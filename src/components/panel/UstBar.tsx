"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import TemaDugmesi from "./TemaDugmesi";

interface Props {
  kullanici: { ad: string; etiket: string };
  okunmamis: number;
  bildirimHref: string | null;
  cikisAction: () => Promise<void>;
  onMenuAc: () => void;
}

export default function UstBar({ kullanici, okunmamis, bildirimHref, cikisAction, onMenuAc }: Props) {
  const [menuAcik, setMenuAcik] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* Dışarı tıklanınca kullanıcı menüsünü kapat */
  useEffect(() => {
    if (!menuAcik) return;
    const kapat = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAcik(false);
    };
    document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, [menuAcik]);

  const basHarfler = kullanici.ad
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("tr-TR");

  return (
    <header className="ustbar">
      <button type="button" className="ustbar-buton hamburger" onClick={onMenuAc} aria-label="Menüyü aç">
        ☰
      </button>

      <div className="ustbar-bosluk" />

      <TemaDugmesi />

      {bildirimHref && (
        <Link href={bildirimHref} className="ustbar-buton ustbar-zil" title="Bildirimler" aria-label="Bildirimler">
          🔔
          {okunmamis > 0 && <span className="menu-rozet zil-rozet">{okunmamis > 99 ? "99+" : okunmamis}</span>}
        </Link>
      )}

      <div className="kullanici-menu" ref={menuRef}>
        <button
          type="button"
          className="kullanici-rozet"
          onClick={() => setMenuAcik((a) => !a)}
          aria-expanded={menuAcik}
        >
          <div className="avatar">{basHarfler}</div>
          <span className="kullanici-ad">
            {kullanici.ad}
            <small>{kullanici.etiket}</small>
          </span>
          <span className="kullanici-ok">▾</span>
        </button>

        {menuAcik && (
          <div className="kullanici-acilir">
            <div className="kullanici-acilir-bas">
              <b>{kullanici.ad}</b>
              <small>{kullanici.etiket}</small>
            </div>
            <form action={cikisAction}>
              <button type="submit" className="kullanici-acilir-kalem cikis">
                🚪 Çıkış Yap
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
