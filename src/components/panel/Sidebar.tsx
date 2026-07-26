"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { NavKalemi } from "@/lib/navigasyon";

interface Props {
  kalemler: NavKalemi[];
  okunmamis: number;
  okunmamisMesaj: number;
  dar: boolean;
  mobilAcik: boolean;
  onKapat: () => void;
  onDarDegistir: () => void;
}

export default function Sidebar({ kalemler, okunmamis, okunmamisMesaj, dar, mobilAcik, onKapat, onDarDegistir }: Props) {
  const yol = usePathname();
  const aktifHref = kalemler
    .filter(
      (k) =>
        !k.href.endsWith(".html") &&
        (yol === k.href || yol.startsWith(k.href + "/"))
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  /* Mobilde sayfa değişince menüyü kapat */
  useEffect(() => {
    onKapat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yol]);

  /* Kalemler sıra korunarak gruplanır */
  const gruplar: { ad: string; kalemler: NavKalemi[] }[] = [];
  for (const k of kalemler) {
    const son = gruplar[gruplar.length - 1];
    if (son && son.ad === k.grup) son.kalemler.push(k);
    else gruplar.push({ ad: k.grup, kalemler: [k] });
  }

  return (
    <aside className={`sidebar${mobilAcik ? " acik" : ""}`}>
      <Link href="/" className="sidebar-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/kaynak-kampus-logo.png" alt="Kaynak Kampüs Logosu" className="logo-icon" />
        {!dar && (
          <span className="sidebar-logo-yazi">
            Kaynak <span>Kampüs</span>
          </span>
        )}
      </Link>

      <nav className="sidebar-nav">
        {gruplar.map((g) => (
          <div key={g.ad} className="nav-grup">
            {!dar && <div className="nav-grup-baslik">{g.ad}</div>}
            {g.kalemler.map((m) => {
              const aktif = m.href === aktifHref;
              const sayi = m.bildirim ? okunmamis : m.mesaj ? okunmamisMesaj : 0;
              const rozet =
                sayi > 0 ? (
                  <span className="menu-rozet">{sayi > 99 ? "99+" : sayi}</span>
                ) : null;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className={`nav-link${aktif ? " aktif" : ""}`}
                  title={dar ? m.ad : undefined}
                >
                  <span className="nav-ikon">{m.ikon}</span>
                  {!dar && (
                    <span className="nav-ad">
                      {m.ad}
                      {rozet}
                    </span>
                  )}
                  {dar && rozet && <span className="nav-nokta" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <button
        type="button"
        className="sidebar-daralt"
        onClick={onDarDegistir}
        title={dar ? "Menüyü genişlet" : "Menüyü daralt"}
      >
        <span className="nav-ikon">{dar ? "»" : "«"}</span>
        {!dar && <span className="nav-ad">Daralt</span>}
      </button>
    </aside>
  );
}
