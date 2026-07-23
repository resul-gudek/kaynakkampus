import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import { kullaniciAdiNormalize } from "./hesap";
import { logcu } from "./log";

const log = logcu("auth");

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        kullanici: { label: "Kullanıcı Adı" },
        sifre: { label: "Şifre", type: "password" },
        rol: { label: "Rol" },
      },
      async authorize(creds) {
        const kullanici = kullaniciAdiNormalize(String(creds?.kullanici ?? ""));
        const sifre = String(creds?.sifre ?? "");
        const rol = String(creds?.rol ?? "");
        if (!kullanici || !sifre || !rol) return null;

        const u = await prisma.kullanici.findUnique({ where: { kullanici } });
        // Rol de kimlik bilgisinin parçası (legacy davranışı) + pasif hesap giremez
        if (!u || u.rol !== rol || !u.aktif) {
          log.warn(
            { kullanici, rol, neden: !u ? "kullanici-yok" : !u.aktif ? "pasif" : "rol-uyusmaz" },
            "giriş reddedildi"
          );
          return null;
        }
        const dogru = await bcrypt.compare(sifre, u.sifreHash);
        if (!dogru) {
          log.warn({ kullanici, rol, neden: "sifre-yanlis" }, "giriş reddedildi");
          return null;
        }

        log.info({ kullaniciId: u.id, kullanici, rol }, "giriş başarılı");
        return { id: u.id, name: u.ad, rol: u.rol };
      },
    }),
  ],
});
