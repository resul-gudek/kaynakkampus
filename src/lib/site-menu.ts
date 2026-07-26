/* Public site üst menüsü — React sayfaları (şu an /blog) için tek kaynak.
   Statik public/*.html sayfaları aynı menüyü kendi işaretlemesinde taşır
   (bkz. public/assets/site-header.css · site-header.js); buradaki liste
   onlarla AYNI sırada tutulmalıdır. */

export interface SiteMenuKalemi {
  ad: string;
  href: string;
}

export const SITE_MENU: SiteMenuKalemi[] = [
  { ad: "Ana Sayfa", href: "/" },
  { ad: "Çoklu Zekâ Testi", href: "/coklu-zeka-testi.html" },
  { ad: "Oyunlar", href: "/oyunlar.html" },
  { ad: "Etkinlikler", href: "/etkinlikler.html" },
  { ad: "Blog", href: "/blog" },
  { ad: "Haberler", href: "/haberler.html" },
  { ad: "Nasıl Çalışır", href: "/#how" },
  { ad: "Hakkımızda", href: "/hakkimizda.html" },
];

/** "Araçlar" açılır menüsü statik sayfalarda ilk kalemden hemen sonra durur */
export const ARACLAR_SIRASI = 1;

/** "Araçlar" açılır menüsü */
export const SITE_ARACLAR: SiteMenuKalemi[] = [
  { ad: "Ödev Oluştur", href: "/odev-olustur.html" },
  { ad: "BEP Oluştur", href: "/bep-olustur.html" },
  { ad: "Ders Programı", href: "/ders-programi.html" },
];
