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

/** Rolün ana panel yolu */
export const ROL_ANASAYFA: Record<string, string> = {
  admin: "/admin",
  koc: "/koc",
  ogrenci: "/ogrenci",
};
