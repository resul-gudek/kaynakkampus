import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig, ROL_ANASAYFA } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

/* Rol koruması — legacy KA.korumali(rol)'un karşılığı.
   Yanlış rol kendi paneline, oturumsuz kullanıcı girişe yönlenir. */
export default auth((req) => {
  const yol = req.nextUrl.pathname;
  const oturum = req.auth;

  if (!oturum?.user) {
    return NextResponse.redirect(new URL("/giris", req.nextUrl));
  }

  const rol = oturum.user.rol ?? "";
  const anasayfa = ROL_ANASAYFA[rol] ?? "/giris";

  if (yol.startsWith("/koc") && rol !== "koc") {
    return NextResponse.redirect(new URL(anasayfa, req.nextUrl));
  }
  if (yol.startsWith("/ogrenci") && rol !== "ogrenci") {
    return NextResponse.redirect(new URL(anasayfa, req.nextUrl));
  }
  if (yol.startsWith("/admin") && rol !== "admin") {
    return NextResponse.redirect(new URL(anasayfa, req.nextUrl));
  }
  if ((yol.startsWith("/siniflar") || yol.startsWith("/canli-ders")) && !["koc", "ogrenci"].includes(rol)) {
    return NextResponse.redirect(new URL(anasayfa, req.nextUrl));
  }
  // Bildirimler: koç ve öğrenci; admin'in bildirimi yok
  if (yol.startsWith("/bildirimler") && rol === "admin") {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }
  return NextResponse.next();
});

/* DİKKAT: açık liste — negatif catch-all public/*.html dosyalarını yakalar, kullanma */
export const config = {
  matcher: [
    "/koc/:path*",
    "/ogrenci/:path*",
    "/admin/:path*",
    "/siniflar/:path*",
    "/canli-ders/:path*",
    "/bildirimler",
  ],
};
