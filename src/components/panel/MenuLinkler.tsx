"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Kalem {
  href: string;
  ikon: string;
  ad: string;
  bildirim?: boolean;
}

/* Aktif sayfa vurgusu client'ta pathname ile belirlenir (legacy menuCiz karşılığı) */
export default function MenuLinkler({ kalemler, okunmamis }: { kalemler: Kalem[]; okunmamis: number }) {
  const yol = usePathname();
  return (
    <nav className="ana-menu">
      {kalemler.map((m) => {
        const aktif = !m.href.endsWith(".html") && yol.startsWith(m.href);
        const rozet =
          m.bildirim && okunmamis > 0 ? (
            <span className="menu-rozet">{okunmamis > 99 ? "99+" : okunmamis}</span>
          ) : null;
        return (
          <Link key={m.href} href={m.href} className={`menu-link${aktif ? " aktif" : ""}`}>
            {m.ikon} {m.ad}
            {rozet}
          </Link>
        );
      })}
    </nav>
  );
}
