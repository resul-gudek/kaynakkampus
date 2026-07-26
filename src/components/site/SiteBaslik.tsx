"use client";

/* Public site üst menüsü (React sayfaları için).

   Statik public/*.html sayfaları aynı menüyü sh-* sınıflarıyla taşır;
   burada davranış (çekmece / açılır menü) React state'iyle yürütülür ki
   harici bir script React'in yönettiği DOM'a dokunmasın. Menü kalemleri
   tek kaynaktan gelir: lib/site-menu.ts */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ARACLAR_SIRASI, SITE_ARACLAR, SITE_MENU } from "@/lib/site-menu";
import s from "./site-baslik.module.css";

export default function SiteBaslik({ aktif }: { aktif?: string }) {
  const [cekmece, setCekmece] = useState(false);
  const [araclar, setAraclar] = useState(false);
  const acilirRef = useRef<HTMLDivElement>(null);

  /* Dışa tıklama ve Escape her iki menüyü de kapatır */
  useEffect(() => {
    function tiklama(e: MouseEvent) {
      if (acilirRef.current && !acilirRef.current.contains(e.target as Node)) setAraclar(false);
    }
    function tus(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setAraclar(false);
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

  return (
    <header className={s.baslik}>
      <div className={s.ic}>
        <Link href="/" className={s.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/kaynak-kampus-logo.png" alt="Kaynak Kampüs Logosu" />
          Kaynak <span>Kampüs</span>
        </Link>

        <nav className={s.menu} aria-label="Ana menü">
          {SITE_MENU.slice(0, ARACLAR_SIRASI).map((k) => (
            <Link
              key={k.href}
              href={k.href}
              className={aktifMi(k.href) ? s.aktif : undefined}
              aria-current={aktifMi(k.href) ? "page" : undefined}
            >
              {k.ad}
            </Link>
          ))}

          {/* Statik sayfalardaki sırayla aynı: "Araçlar" ilk kalemden sonra */}
          <div className={`${s.acilir} ${araclar ? s.acik : ""}`} ref={acilirRef}>
            <button
              type="button"
              aria-expanded={araclar}
              onClick={(e) => {
                e.stopPropagation();
                setAraclar((x) => !x);
              }}
            >
              Araçlar
            </button>
            {araclar && (
              <div className={s.acilirMenu}>
                {SITE_ARACLAR.map((k) => (
                  <a key={k.href} href={k.href}>
                    {k.ad}
                  </a>
                ))}
              </div>
            )}
          </div>

          {SITE_MENU.slice(ARACLAR_SIRASI).map((k) => (
            <Link
              key={k.href}
              href={k.href}
              className={aktifMi(k.href) ? s.aktif : undefined}
              aria-current={aktifMi(k.href) ? "page" : undefined}
            >
              {k.ad}
            </Link>
          ))}
        </nav>

        <div className={s.eylemler}>
          <Link href="/giris" className={`${s.dugme} ${s.cizgili}`}>
            Giriş Yap
          </Link>
          <Link href="/basvuru" className={`${s.dugme} ${s.dolu}`}>
            Aramıza Katıl
          </Link>
        </div>

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
        {SITE_MENU.map((k) => (
          <Link key={k.href} href={k.href} className={aktifMi(k.href) ? s.aktif : undefined}>
            {k.ad}
          </Link>
        ))}
        <div className={s.cekmeceEtiket}>Araçlar</div>
        {SITE_ARACLAR.map((k) => (
          <a key={k.href} href={k.href}>
            {k.ad}
          </a>
        ))}
        <div className={s.cekmeceEylemler}>
          <Link href="/giris" className={`${s.dugme} ${s.cizgili}`}>
            Giriş Yap
          </Link>
          <Link href="/basvuru" className={`${s.dugme} ${s.dolu}`}>
            Aramıza Katıl ✨
          </Link>
        </div>
      </div>
    </header>
  );
}
