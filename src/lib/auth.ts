import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import { kullaniciAdiNormalize } from "./hesap";
import { girisTuruUygun } from "./sabitler";
import { logcu } from "./log";

const log = logcu("auth");

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        kullanici: { label: "Kullanıcı Adı" },
        sifre: { label: "Şifre", type: "password" },
        tur: { label: "Hesap Türü" },
      },
      async authorize(creds, istek) {
        const kullanici = kullaniciAdiNormalize(String(creds?.kullanici ?? ""));
        const sifre = String(creds?.sifre ?? "");
        const tur = String(creds?.tur ?? "");
        if (!kullanici || !sifre || !tur) return null;

        const u = await prisma.kullanici.findUnique({ where: { kullanici } });
        /* Hesap türü de kimlik bilgisinin parçası (legacy davranışı) + pasif
           hesap giremez. Tür bir rol değil rol kümesidir: "egitimci" hem koç
           hem öğretmen hesaplarını kapsar (bkz. lib/sabitler.ts). */
        if (!u || !u.aktif || !girisTuruUygun(tur, u.rol)) {
          log.warn(
            { kullanici, tur, neden: !u ? "kullanici-yok" : !u.aktif ? "pasif" : "tur-uyusmaz" },
            "giriş reddedildi"
          );
          return null;
        }
        const dogru = await bcrypt.compare(sifre, u.sifreHash);
        if (!dogru) {
          log.warn({ kullanici, tur, neden: "sifre-yanlis" }, "giriş reddedildi");
          return null;
        }

        // Aktivite modülü: giriş kaydı (IP + tarayıcı) ve son görülme
        const basliklar = istek?.headers instanceof Headers ? istek.headers : null;
        const ip = (basliklar?.get("x-forwarded-for") ?? "").split(",")[0].trim();
        const tarayici = basliklar?.get("user-agent") ?? "";
        await prisma.$transaction([
          prisma.girisKaydi.create({ data: { kullaniciId: u.id, ip, tarayici } }),
          prisma.kullanici.update({ where: { id: u.id }, data: { sonGorulme: new Date() } }),
        ]);

        // Oturuma yazılan rol daima hesabın GERÇEK rolüdür (koc / ogretmen / …),
        // seçilen giriş türü değil — yetkiler role göre çözülür.
        log.info({ kullaniciId: u.id, kullanici, tur, rol: u.rol, ip }, "giriş başarılı");
        return { id: u.id, name: u.ad, rol: u.rol };
      },
    }),
  ],
});
