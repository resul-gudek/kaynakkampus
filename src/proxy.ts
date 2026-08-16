import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig, ROL_ANASAYFA } from "@/lib/auth.config";
import { egitmenMi } from "@/lib/sabitler";

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

  // Öğretim paneli: eğitim koçu + öğretmen (iki ayrı rol, ortak panel)
  if (yol.startsWith("/koc") && !egitmenMi(rol)) {
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
  if ((yol.startsWith("/siniflar") || yol.startsWith("/canli-ders")) && !(egitmenMi(rol) || rol === "ogrenci")) {
    return NextResponse.redirect(new URL(anasayfa, req.nextUrl));
  }
  // Mesajlar: eğitmen (koç/öğretmen) ve öğrenci arası; admin/veli dışarıda
  if (yol.startsWith("/mesajlar") && !(egitmenMi(rol) || rol === "ogrenci")) {
    return NextResponse.redirect(new URL(anasayfa, req.nextUrl));
  }
  // Bildirimler: eğitmen, öğrenci ve yönetici (değerlendirme bildirimleri); veli dışarıda
  if (yol.startsWith("/bildirimler") && !(egitmenMi(rol) || rol === "ogrenci" || rol === "admin")) {
    return NextResponse.redirect(new URL(anasayfa, req.nextUrl));
  }
  // Video ders yönetimi: eğitmen ve yönetici (yetki "video:yonet")
  if (yol.startsWith("/video-dersler") && !(egitmenMi(rol) || rol === "admin")) {
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
