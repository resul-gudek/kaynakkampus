"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import TemaDugmesi from "./TemaDugmesi";
import BildirimZili, { type ZilBildirim } from "./BildirimZili";

interface Props {
  kullanici: { ad: string; etiket: string };
  okunmamis: number;
  bildirimHref: string | null;
  bildirimler: ZilBildirim[];
  cikisAction: () => Promise<void>;
  mobilAcik: boolean;
  onMenuAc: () => void;
}

export default function UstBar({ kullanici, okunmamis, bildirimHref, bildirimler, cikisAction, mobilAcik, onMenuAc }: Props) {
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
        {mobilAcik ? <X size={20} /> : <Menu size={20} />}
      </button>

      <Link href="/" className="ustbar-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/kaynak-kampus-logo.png" alt="Kaynak Kampüs Logosu" className="logo-icon" />
        <span className="ustbar-logo-yazi">
          <b>
            Kaynak <span>Kampüs</span>
          </b>
          <small>{kullanici.etiket} Paneli</small>
        </span>
      </Link>

      <div className="ustbar-bosluk" />

      <TemaDugmesi />

      {bildirimHref && <BildirimZili sayi={okunmamis} bildirimler={bildirimler} />}

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
          <ChevronDown size={14} className="kullanici-ok" aria-hidden="true" />
        </button>

        {menuAcik && (
          <div className="kullanici-acilir">
            <div className="kullanici-acilir-bas">
              <b>{kullanici.ad}</b>
              <small>{kullanici.etiket}</small>
            </div>
            <form action={cikisAction}>
              <button type="submit" className="kullanici-acilir-kalem cikis">
                <LogOut size={15} /> Çıkış Yap
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
