"use client";

/* Public site üst menüsü (React sayfaları için).

   Statik public/*.html sayfaları aynı menüyü sh-* sınıflarıyla taşır;
   burada davranış (çekmece / açılır menü) React state'iyle yürütülür ki
   harici bir script React'in yönettiği DOM'a dokunmasın. Menü kalemleri
   tek kaynaktan gelir: lib/site-menu.ts */

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SITE_MENU, grupMu } from "@/lib/site-menu";
import s from "./site-baslik.module.css";

export default function SiteBaslik({ aktif }: { aktif?: string }) {
  const [cekmece, setCekmece] = useState(false);
  /* Aynı anda tek açılır başlık açık kalır; değer grubun adıdır */
  const [acikGrup, setAcikGrup] = useState<string | null>(null);
  const menuRef = useRef<HTMLElement>(null);

  /* Dışa tıklama ve Escape her iki menüyü de kapatır */
  useEffect(() => {
    function tiklama(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setAcikGrup(null);
    }
    function tus(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setAcikGrup(null);
      setCekmece(false);
    }
    document.addEventListener("click", tiklama);
    document.addEventListener("keydown", tus);
    return () => {
      document.removeEventListener("click", tiklama);
      document.removeEventListener("keydown", tus);
    };
  }, []);

  /* Masaüstü genişliğine geçilirse çekmece kapanır (CSS ile aynı eşik) */
  useEffect(() => {
    const genis = window.matchMedia("(min-width: 1280px)");
    const izle = (e: MediaQueryListEvent) => e.matches && setCekmece(false);
    genis.addEventListener("change", izle);
    return () => genis.removeEventListener("change", izle);
  }, []);

  const aktifMi = (href: string) => href === aktif;
  /* Statik public/*.html sayfalarına Next yönlendirmesi yapılamaz */
  const staticMi = (href: string) => href.endsWith(".html");
  const grupAktifMi = (alt: { href: string }[]) => alt.some((k) => aktifMi(k.href));

  /** Grup kalemi: statik sayfa ise düz <a>, uygulama rotası ise Link */
  const kalem = (k: { ad: string; href: string }) =>
    staticMi(k.href) ? (
      <a key={k.href} href={k.href} className={aktifMi(k.href) ? s.aktif : undefined}>
        {k.ad}
      </a>
    ) : (
      <Link key={k.href} href={k.href} className={aktifMi(k.href) ? s.aktif : undefined}>
        {k.ad}
      </Link>
    );

  return (
    <header className={s.baslik}>
      <div className={s.ic}>
        <Link href="/" className={s.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/kaynak-kampus-logo.png" alt="Kaynak Kampüs Logosu" />
          Kaynak <span>Kampüs</span>
        </Link>

        <nav className={s.menu} aria-label="Ana menü" ref={menuRef}>
          {/* Sıra lib/site-menu.ts'ten gelir; statik sayfalarla birebir aynı */}
          {SITE_MENU.map((oge) =>
            grupMu(oge) ? (
              <div
                key={oge.ad}
                className={[
                  s.acilir,
                  acikGrup === oge.ad ? s.acik : "",
                  grupAktifMi(oge.alt) ? s.aktifVar : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <button
                  type="button"
                  aria-expanded={acikGrup === oge.ad}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAcikGrup((x) => (x === oge.ad ? null : oge.ad));
                  }}
                >
                  {oge.ad}
                </button>
                {acikGrup === oge.ad && (
                  <div className={s.acilirMenu}>{oge.alt.map(kalem)}</div>
                )}
              </div>
            ) : (
              <Link
                key={oge.href}
                href={oge.href}
                className={aktifMi(oge.href) ? s.aktif : undefined}
                aria-current={aktifMi(oge.href) ? "page" : undefined}
              >
                {oge.ad}
              </Link>
            ),
          )}
        </nav>

        {/* Giriş Yap / Aramıza Katıl şimdilik gizlendi (kullanıcı kararı) —
            sayfalar duruyor, doğrudan adresle açılabiliyor. Geri almak için
            bu bloğun yorumunu kaldırmak yeterli. Statik public/*.html
            sayfalarında aynı düğmeler .sh-actions üzerinde hidden ile gizli.
        <div className={s.eylemler}>
          <Link href="/giris" className={`${s.dugme} ${s.cizgili}`}>
            Giriş Yap
          </Link>
          <Link href="/basvuru" className={`${s.dugme} ${s.dolu}`}>
            Aramıza Katıl
          </Link>
        </div>
        */}

        <button
          className={s.hamburger}
          aria-label="Menüyü aç/kapat"
          aria-controls="siteCekmece"
          aria-expanded={cekmece}
          onClick={() => setCekmece((x) => !x)}
        >
          <span /><span /><span />
        </button>
      </div>

      <div
        id="siteCekmece"
        className={`${s.cekmece} ${cekmece ? s.acik : ""}`}
        onClick={() => setCekmece(false)}
      >
        {/* Çekmecede açılır menü yok: gruplar başlık + altındaki kalemler olarak düzleşir */}
        {SITE_MENU.map((oge) =>
          grupMu(oge) ? (
            <Fragment key={oge.ad}>
              <div className={s.cekmeceEtiket}>{oge.ad}</div>
              {oge.alt.map(kalem)}
            </Fragment>
          ) : (
            <Link
              key={oge.href}
              href={oge.href}
              className={aktifMi(oge.href) ? s.aktif : undefined}
              aria-current={aktifMi(oge.href) ? "page" : undefined}
            >
              {oge.ad}
            </Link>
          ),
        )}
        {/* Mobil çekmecedeki aynı düğmeler de gizli — yukarıdaki nota bakın.
        <div className={s.cekmeceEylemler}>
          <Link href="/giris" className={`${s.dugme} ${s.cizgili}`}>
            Giriş Yap
          </Link>
          <Link href="/basvuru" className={`${s.dugme} ${s.dolu}`}>
            Aramıza Katıl ✨
          </Link>
        </div>
        */}
      </div>
    </header>
  );
}
