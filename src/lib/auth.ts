import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import { kullaniciAdiNormalize } from "./hesap";
import { girisTuruUygun } from "./sabitler";
import { logcu } from "./log";

const log = logcu("auth");

/** İstek başlıklarından istemci IP'si ve tarayıcısı (nginx arkasında çalışır:
    x-forwarded-for birincil, x-real-ip yedek). */
function istemciBilgisi(istek: Request | undefined) {
  const b = istek?.headers instanceof Headers ? istek.headers : null;
  const ip =
    (b?.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    (b?.get("x-real-ip") ?? "").trim();
  return { ip, tarayici: b?.get("user-agent") ?? "" };
}

/** Reddedilen giriş hem loga hem DB'ye yazılır — Aktivite Merkezi kaba kuvvet
    denemelerini de görsün. Kayıt yazılamazsa akış bundan etkilenmez. */
async function girisReddet(veri: {
  kullaniciId?: string;
  denenen: string;
  tur: string;
  neden: "kullanici-yok" | "pasif" | "tur-uyusmaz" | "sifre-yanlis";
  ip: string;
  tarayici: string;
}) {
  log.warn(
    { kullanici: veri.denenen, tur: veri.tur, neden: veri.neden, ip: veri.ip },
    "giriş reddedildi"
  );
  try {
    await prisma.girisKaydi.create({
      data: {
        kullaniciId: veri.kullaniciId ?? null,
        basarili: false,
        denenen: veri.denenen,
        neden: veri.neden,
        ip: veri.ip,
        tarayici: veri.tarayici,
      },
    });
  } catch (e) {
    log.error({ e, denenen: veri.denenen }, "başarısız giriş kaydı DB'ye yazılamadı");
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  events: {
    /* JWT stratejisinde çıkış olayına token düşer; kim çıktıysa loglanır. */
    signOut(mesaj) {
      const token = "token" in mesaj ? mesaj.token : null;
      log.info({ kullaniciId: token?.id, rol: token?.rol }, "çıkış yapıldı");
    },
  },
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
        const { ip, tarayici } = istemciBilgisi(istek);

        const u = await prisma.kullanici.findUnique({ where: { kullanici } });
        /* Hesap türü de kimlik bilgisinin parçası (legacy davranışı) + pasif
           hesap giremez. Tür bir rol değil rol kümesidir: "egitimci" hem koç
           hem öğretmen hesaplarını kapsar (bkz. lib/sabitler.ts). */
        if (!u || !u.aktif || !girisTuruUygun(tur, u.rol)) {
          await girisReddet({
            kullaniciId: u?.id,
            denenen: kullanici,
            tur,
            neden: !u ? "kullanici-yok" : !u.aktif ? "pasif" : "tur-uyusmaz",
            ip,
            tarayici,
          });
          return null;
        }
        const dogru = await bcrypt.compare(sifre, u.sifreHash);
        if (!dogru) {
          await girisReddet({
            kullaniciId: u.id,
            denenen: kullanici,
            tur,
            neden: "sifre-yanlis",
            ip,
            tarayici,
          });
          return null;
        }

        /* Aktivite modülü: giriş kaydı (IP + tarayıcı) ve son görülme.
           Kayıt yazılamazsa giriş ENGELLENMEZ — aksi halde loglama arızası
           kullanıcıya "şifre hatalı" gibi görünür. */
        try {
          await prisma.$transaction([
            prisma.girisKaydi.create({
              data: { kullaniciId: u.id, denenen: kullanici, ip, tarayici },
            }),
            prisma.kullanici.update({ where: { id: u.id }, data: { sonGorulme: new Date() } }),
          ]);
        } catch (e) {
          log.error({ e, kullaniciId: u.id }, "giriş kaydı DB'ye yazılamadı");
        }

        // Oturuma yazılan rol daima hesabın GERÇEK rolüdür (koc / ogretmen / …),
        // seçilen giriş türü değil — yetkiler role göre çözülür.
        log.info({ kullaniciId: u.id, kullanici, tur, rol: u.rol, ip }, "giriş başarılı");
        return { id: u.id, name: u.ad, rol: u.rol };
      },
    }),
  ],
});
