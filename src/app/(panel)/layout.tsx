import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/lib/auth";
import { aktifKullanici } from "@/lib/oturum";
import MenuLinkler from "@/components/panel/MenuLinkler";

/* Uygulama menüsü — legacy KA.MENU'nun karşılığı.
   Yeni panel sayfası eklendikçe buraya bir satır eklemek yeterli. */
const MENU: Record<string, { href: string; ikon: string; ad: string; bildirim?: boolean }[]> = {
  koc: [
    { href: "/koc", ikon: "🎓", ad: "Panelim" },
    { href: "/odev-olustur.html", ikon: "📝", ad: "Ödev Oluştur" },
    { href: "/bep-olustur.html", ikon: "📋", ad: "BEP Oluştur" },
    { href: "/bildirimler", ikon: "🔔", ad: "Bildirimler", bildirim: true },
  ],
  ogrenci: [
    { href: "/ogrenci", ikon: "🏠", ad: "Panelim" },
    { href: "/bildirimler", ikon: "🔔", ad: "Bildirimler", bildirim: true },
  ],
  admin: [{ href: "/admin", ikon: "👩‍🏫", ad: "Koçlar" }],
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const kullanici = await aktifKullanici();
  const okunmamis =
    kullanici.rol === "admin"
      ? 0
      : await prisma.bildirim.count({ where: { aliciId: kullanici.id, okundu: false } });

  const basHarfler = kullanici.ad
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("tr-TR");

  return (
    <>
      <header className="panel-header">
        <div className="container">
          <div className="nav-inner">
            <Link href="/" className="logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.png" alt="Kaynak Akademi Logosu" className="logo-icon" />
              Kaynak <span>Akademi</span>
            </Link>

            <MenuLinkler kalemler={MENU[kullanici.rol] ?? []} okunmamis={okunmamis} />

            <div className="kullanici-alan">
              <div className="kullanici-rozet">
                <div className="avatar">{basHarfler}</div>
                {kullanici.ad}
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/giris" });
                }}
              >
                <button type="submit" className="btn btn-outline btn-kucuk">
                  Çıkış Yap
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
