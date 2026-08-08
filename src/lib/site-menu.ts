/* Public site üst menüsü — React sayfaları (şu an /blog) için tek kaynak.
   Statik public/*.html sayfaları aynı menüyü kendi işaretlemesinde taşır
   (bkz. public/assets/site-header.css · site-header.js); buradaki liste
   onlarla AYNI sırada tutulmalıdır. */

export interface SiteMenuKalemi {
  ad: string;
  href: string;
}

/** Üst menüde açılır liste olarak duran başlık */
export interface SiteMenuGrubu {
  ad: string;
  alt: SiteMenuKalemi[];
}

export type SiteMenuOgesi = SiteMenuKalemi | SiteMenuGrubu;

export function grupMu(oge: SiteMenuOgesi): oge is SiteMenuGrubu {
  return "alt" in oge;
}

export const SITE_MENU: SiteMenuOgesi[] = [
  { ad: "Ana Sayfa", href: "/" },
  { ad: "Sınav Takvimi", href: "/sinav-takvimi.html" },
  {
    ad: "Araçlar",
    alt: [
      { ad: "Ödev Oluştur", href: "/odev-olustur.html" },
      { ad: "BEP Oluştur", href: "/bep-olustur.html" },
      { ad: "Ders Programı", href: "/ders-programi.html" },
      { ad: "Etkinlikler", href: "/etkinlikler.html" },
    ],
  },
  { ad: "Çoklu Zekâ Testi", href: "/coklu-zeka-testi.html" },
  { ad: "Oyunlar", href: "/oyunlar.html" },
  {
    ad: "Blog & Haberler",
    alt: [
      { ad: "Blog", href: "/blog" },
      { ad: "Haberler", href: "/haberler.html" },
    ],
  },
  { ad: "Nasıl Çalışır", href: "/#how" },
  { ad: "Hakkımızda", href: "/hakkimizda.html" },
];

