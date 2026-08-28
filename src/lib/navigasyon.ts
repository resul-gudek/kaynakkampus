import type { Rol } from "@/lib/sabitler";
import { yetkiVar } from "@/lib/yetki";

/* Uygulama menüsü — tek kaynak. Yeni panel sayfası eklendikçe buraya
   bir satır eklemek yeterli; görünürlük "yetki" alanıyla belirlenir. */
export interface NavKalemi {
  grup: string;
  ad: string;
  href: string;
  ikon: string;
  /** "modul:eylem" — null ise oturum açan herkes görür */
  yetki: string | null;
  bildirim?: boolean;
  /** okunmamış mesaj rozeti gösterilecek kalem */
  mesaj?: boolean;
}

export const NAVIGASYON: NavKalemi[] = [
  { grup: "Ana", ad: "Panelim", href: "/koc", ikon: "panel", yetki: "panel:koc" },
  { grup: "Ana", ad: "Panelim", href: "/ogrenci", ikon: "ev", yetki: "panel:ogrenci" },
  { grup: "Öğretmenlik", ad: "Ajanda", href: "/koc/ajanda", ikon: "ajanda", yetki: "panel:koc" },
  { grup: "Öğretmenlik", ad: "Öğrencilerim", href: "/koc/ogrenciler", ikon: "ogrenciler", yetki: "panel:koc" },
  { grup: "Öğretmenlik", ad: "Süreli Testler", href: "/koc/testler", ikon: "sure", yetki: "panel:koc" },
  { grup: "Öğretmenlik", ad: "Ödemeler", href: "/koc/odemeler", ikon: "odeme", yetki: "odeme:koc" },
  { grup: "Çalışmalarım", ad: "Takvimim", href: "/ogrenci/takvim", ikon: "ajanda", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Ödevlerim", href: "/ogrenci/odevler", ikon: "odev", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Süreli Testlerim", href: "/ogrenci/testler", ikon: "sure", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Takip Listem", href: "/ogrenci/takip", ikon: "takip", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Yol Haritam", href: "/ogrenci/yol-haritasi", ikon: "harita", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Deneme Sonuçlarım", href: "/ogrenci/denemeler", ikon: "artis", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Özel Derslerim", href: "/ogrenci/ozel-dersler", ikon: "mezuniyet", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Video Derslerim", href: "/ogrenci/videolar", ikon: "videoOynat", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Seviye Formum", href: "/ogrenci/profil", ikon: "hedef", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Ödemelerim", href: "/ogrenci/odemeler", ikon: "odeme", yetki: "odeme:ogrenci" },
  { grup: "Velilik", ad: "Panelim", href: "/veli", ikon: "veli", yetki: "panel:veli" },
  { grup: "Yönetim", ad: "Dashboard", href: "/admin", ikon: "panel", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "Kullanıcı Listesi", href: "/admin/kullanicilar", ikon: "ogrenciler", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "Koçlar", href: "/admin/koclar", ikon: "pusula", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "Öğretmenler", href: "/admin/ogretmenler", ikon: "ogretmen", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "Değerlendirmeler", href: "/admin/degerlendirmeler", ikon: "yildiz", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "Başvurular", href: "/admin/basvurular", ikon: "gelenKutusu", yetki: "basvuru:yonet" },
  { grup: "Yönetim", ad: "Ödemeler", href: "/admin/odemeler", ikon: "odeme", yetki: "odeme:yonet" },
  { grup: "Yönetim", ad: "Aktivite", href: "/admin/aktivite", ikon: "aktivite", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "E-posta", href: "/admin/mail", ikon: "mail", yetki: "mail:yonet" },
  { grup: "Yönetim", ad: "Blog", href: "/admin/blog", ikon: "blog", yetki: "blog:yonet" },
  { grup: "Eğitim", ad: "Online Sınıflar", href: "/siniflar", ikon: "ogretmen", yetki: "sinif:goruntule" },
  { grup: "Eğitim", ad: "Video Dersler", href: "/video-dersler", ikon: "video", yetki: "video:yonet" },
  { grup: "Araçlar", ad: "Ödev Oluştur", href: "/odev-olustur.html", ikon: "odevOlustur", yetki: "odev:olustur" },
  { grup: "Araçlar", ad: "BEP Oluştur", href: "/bep-olustur.html", ikon: "bep", yetki: "bep:olustur" },
  { grup: "İletişim", ad: "Mesajlar", href: "/mesajlar", ikon: "mesaj", yetki: "mesaj:goruntule", mesaj: true },
  { grup: "İletişim", ad: "Bildirimler", href: "/bildirimler", ikon: "zil", yetki: "bildirim:goruntule", bildirim: true },
];

/* Grup → ikon aksan rengi (globals.css'te .nav-link[data-aksan=…] karşılığı).
   hatem-crm'deki grup renk haritasının marka paletine uyarlanmış hâli. */
export const GRUP_AKSANLARI: Record<string, string> = {
  Ana: "notr",
  "Öğretmenlik": "bordo",
  "Çalışmalarım": "bordo",
  Velilik: "gok",
  "Yönetim": "bordo",
  "Eğitim": "gok",
  "Araçlar": "sari",
  "İletişim": "yesil",
};

export const ROL_ETIKETLERI: Record<Rol, string> = {
  admin: "Yönetici",
  koc: "Koç",
  ogretmen: "Öğretmen",
  ogrenci: "Öğrenci",
  veli: "Veli",
};

/** Rolün görebileceği menü kalemleri */
export function rolNavigasyonu(rol: Rol): NavKalemi[] {
  return NAVIGASYON.filter((k) => yetkiVar(rol, k.yetki));
}
