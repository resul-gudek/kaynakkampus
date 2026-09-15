import type { NextAuthConfig } from "next-auth";

/* Edge-güvenli temel yapılandırma: middleware bu dosyayı kullanır,
   bu yüzden burada Prisma/bcrypt import edilmez (split-config deseni). */
export const authConfig = {
  pages: { signIn: "/giris" },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = user.rol;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.rol) session.user.rol = token.rol;
      return session;
    },
  },
  providers: [], // gerçek provider auth.ts'te eklenir
} satisfies NextAuthConfig;

/** Giriş sonrası dönülecek hedefin taşındığı sorgu parametresi (bkz. proxy.ts) */
export const DONUS_PARAM = "devam";

/**
 * Giriş sonrası dönüş hedefini güvenli hâle getirir.
 *
 * Yalnız BU SİTEYE ait, tek eğik çizgiyle başlayan yollar kabul edilir; başka
 * her şey (mutlak adres, "//baskasite", protokol satırı, ters eğik çizgi) null
 * döner — açık yönlendirme (open redirect) açığı doğmasın. Rol denetimi burada
 * yapılmaz: yanlış roldeki kullanıcıyı proxy zaten kendi paneline yollar.
 */
export function guvenliDonusYolu(ham: string | null | undefined): string | null {
  if (!ham) return null;
  const yol = ham.trim();
  if (!yol.startsWith("/")) return null; // mutlak adres / göreli yol değil
  if (yol.startsWith("//") || yol.startsWith("/\\")) return null; // protokole göreli dış adres
  if (yol.startsWith("/giris")) return null; // kendine dönüp döngü kurmasın
  if (/[\u0000-\u001f\u007f]/.test(yol)) return null; // denetim karakteri reddedilir
  return yol;
}

/** Rolün ana panel yolu */
export const ROL_ANASAYFA: Record<string, string> = {
  admin: "/admin",
  koc: "/koc",
  // Öğretmen ayrı bir roldür; eğitimci panelini koç ile paylaşır (bkz. lib/yetki.ts)
  ogretmen: "/koc",
  ogrenci: "/ogrenci",
  veli: "/veli",
};

/** Giriş ekranındaki hesap türünün açılış sayfası. Tür rol değil rol kümesidir:
    "egitimci" (koç + öğretmen) tek bir eğitimci paneline düşer. */
export const GIRIS_TURU_ANASAYFA: Record<string, string> = {
  egitimci: "/koc",
  ogrenci: "/ogrenci",
  admin: "/admin",
};
