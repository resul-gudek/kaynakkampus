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
  if (yol.startsWith("/veli") && rol !== "veli") {
    return NextResponse.redirect(new URL(anasayfa, req.nextUrl));
  }
  if ((yol.startsWith("/siniflar") || yol.startsWith("/canli-ders")) && !["koc", "ogrenci"].includes(rol)) {
    return NextResponse.redirect(new URL(anasayfa, req.nextUrl));
  }
  // Mesajlar: koç ve öğrenci arası; admin/veli dışarıda
  if (yol.startsWith("/mesajlar") && !["koc", "ogrenci"].includes(rol)) {
    return NextResponse.redirect(new URL(anasayfa, req.nextUrl));
  }
  // Bildirimler: koç, öğrenci ve yönetici (değerlendirme bildirimleri); veli dışarıda
  if (yol.startsWith("/bildirimler") && !["koc", "ogrenci", "admin"].includes(rol)) {
    return NextResponse.redirect(new URL(anasayfa, req.nextUrl));
  }
  // Video ders yönetimi: öğretmen ve yönetici (yetki "video:yonet")
  if (yol.startsWith("/video-dersler") && !["koc", "admin"].includes(rol)) {
    return NextResponse.redirect(new URL(anasayfa, req.nextUrl));
  }
  return NextResponse.next();
});

/* DİKKAT: açık liste — negatif catch-all public/*.html dosyalarını yakalar, kullanma */
export const config = {
  matcher: [
    "/koc/:path*",
    "/ogrenci/:path*",
    "/admin/:path*",
    "/veli/:path*",
    "/siniflar/:path*",
    "/canli-ders/:path*",
    "/mesajlar/:path*",
    "/bildirimler",
    "/video-dersler/:path*",
  ],
};
