"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Search, X } from "lucide-react";
import type { NavKalemi } from "@/lib/navigasyon";
import { GRUP_AKSANLARI } from "@/lib/navigasyon";
import PanelIkon from "./Ikon";

interface Props {
  kalemler: NavKalemi[];
  okunmamis: number;
  okunmamisMesaj: number;
  dar: boolean;
  mobilAcik: boolean;
  onKapat: () => void;
  onDarDegistir: () => void;
}

/* Türkçe arama: "ogrenci" yazınca "Öğrenci" de eşleşsin */
function sadelestir(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c");
}

export default function Sidebar({ kalemler, okunmamis, okunmamisMesaj, dar, mobilAcik, onKapat, onDarDegistir }: Props) {
  const yol = usePathname();
  const [arama, setArama] = useState("");
  /* Dar modda ikon üstüne gelince gösterilen ipucu — scroll kabı ikonları
     kırptığı için fixed konumlu tek bir balon kullanılır (hatem-crm deseni) */
  const [ipucu, setIpucu] = useState<{ metin: string; ust: number } | null>(null);
  const asideRef = useRef<HTMLElement>(null);

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

  const sorgu = sadelestir(arama.trim());
  const gorunur = sorgu
    ? kalemler.filter((k) => sadelestir(k.ad).includes(sorgu) || sadelestir(k.grup).includes(sorgu))
    : kalemler;

  /* Kalemler sıra korunarak gruplanır */
  const gruplar: { ad: string; kalemler: NavKalemi[] }[] = [];
  for (const k of gorunur) {
    const son = gruplar[gruplar.length - 1];
    if (son && son.ad === k.grup) son.kalemler.push(k);
    else gruplar.push({ ad: k.grup, kalemler: [k] });
  }

  const ipucuGoster = (e: React.MouseEvent, metin: string) => {
    if (!dar) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setIpucu({ metin, ust: r.top + r.height / 2 });
  };
  const ipucuGizle = () => setIpucu(null);

  return (
    <aside ref={asideRef} className={`sidebar${mobilAcik ? " acik" : ""}`}>
      {!dar && (
        <div className="sidebar-arama">
          <Search size={14} className="sidebar-arama-ikon" aria-hidden="true" />
          <input
            type="text"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Menüde ara…"
            aria-label="Menüde ara"
            autoComplete="off"
          />
          {arama && (
            <button type="button" className="sidebar-arama-sil" onClick={() => setArama("")} aria-label="Aramayı temizle">
              <X size={12} />
            </button>
          )}
        </div>
      )}

      <nav className="sidebar-nav">
        {gruplar.length === 0 && <p className="sidebar-bos">Sonuç bulunamadı</p>}
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
                  data-aksan={GRUP_AKSANLARI[m.grup] ?? "notr"}
                  onMouseEnter={(e) => ipucuGoster(e, m.ad)}
                  onMouseLeave={ipucuGizle}
                >
                  <span className="nav-ikon">
                    <PanelIkon ad={m.ikon} boyut={17} />
                  </span>
                  {!dar && (
                    <span className="nav-ad">
                      {m.ad}
                      {rozet}
                    </span>
                  )}
                  {dar && sayi > 0 && <span className="nav-nokta" />}
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
        onMouseEnter={(e) => ipucuGoster(e, "Menüyü genişlet")}
        onMouseLeave={ipucuGizle}
        aria-label={dar ? "Menüyü genişlet" : "Menüyü daralt"}
      >
        <span className="nav-ikon">{dar ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}</span>
        {!dar && <span className="nav-ad">Menüyü Küçült</span>}
      </button>

      {dar && ipucu && (
        <span className="sidebar-ipucu" style={{ top: ipucu.ust }} role="tooltip">
          {ipucu.metin}
        </span>
      )}
    </aside>
  );
}
