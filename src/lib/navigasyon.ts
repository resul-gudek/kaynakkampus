import type { Rol } from "@/lib/sabitler";
import { yetkiVar } from "@/lib/yetki";

/* Uygulama menüsü — tek kaynak. Yeni panel sayfası eklendikçe buraya
   bir satır eklemek yeterli; görünürlük "yetki" alanıyla belirlenir.
   Sidebar grupları dizideki SIRAYA göre ve ardışıklıkla oluşturur:
   bir rolün göreceği kalemler alt alta, grupları da rolün okuma
   akışına göre (iş → iletişim → hesap) dizilmiştir. */
export interface NavKalemi {
  grup: string;
  ad: string;
  href: string;
  ikon: string;
  /** "modul:eylem" — null ise oturum açan herkes görür */
  yetki: string | null;
  /** Aynı yetkiyi taşıyan roller kalemi farklı grupta görecekse
      daraltma: yalnız bu roller görür (yetkiye EK koşuldur) */
  roller?: Rol[];
  bildirim?: boolean;
  /** okunmamış mesaj rozeti gösterilecek kalem */
  mesaj?: boolean;
}

export const NAVIGASYON: NavKalemi[] = [
  /* ── Ana giriş noktası (rolün kendi paneli her zaman en üsttedir) ── */
  { grup: "Ana", ad: "Panelim", href: "/koc", ikon: "panel", yetki: "panel:koc" },
  { grup: "Ana", ad: "Panelim", href: "/ogrenci", ikon: "ev", yetki: "panel:ogrenci" },

  /* ── Eğitimci: günlük iş → dersler → araçlar ── */
  { grup: "Öğretmenlik", ad: "Ajanda", href: "/koc/ajanda", ikon: "ajanda", yetki: "panel:koc" },
  { grup: "Öğretmenlik", ad: "Öğrencilerim", href: "/koc/ogrenciler", ikon: "ogrenciler", yetki: "panel:koc" },
  { grup: "Öğretmenlik", ad: "Süreli Testler", href: "/koc/testler", ikon: "sure", yetki: "panel:koc" },
  { grup: "Eğitim", ad: "Online Sınıflar", href: "/siniflar", ikon: "ogretmen", yetki: "sinif:goruntule", roller: ["koc", "ogretmen"] },
  { grup: "Eğitim", ad: "Video Dersler", href: "/video-dersler", ikon: "video", yetki: "video:yonet", roller: ["koc", "ogretmen"] },
  { grup: "Araçlar", ad: "Ödev Oluştur", href: "/odev-olustur.html", ikon: "odevOlustur", yetki: "odev:olustur" },
  { grup: "Araçlar", ad: "BEP Oluştur", href: "/bep-olustur.html", ikon: "bep", yetki: "bep:olustur" },

  /* ── Öğrenci: derslerim → günlük çalışma → gelişim ── */
  { grup: "Derslerim", ad: "Özel Derslerim", href: "/ogrenci/ozel-dersler", ikon: "mezuniyet", yetki: "panel:ogrenci" },
  { grup: "Derslerim", ad: "Online Sınıflar", href: "/siniflar", ikon: "ogretmen", yetki: "sinif:goruntule", roller: ["ogrenci"] },
  { grup: "Derslerim", ad: "Video Derslerim", href: "/ogrenci/videolar", ikon: "videoOynat", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Takvimim", href: "/ogrenci/takvim", ikon: "ajanda", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Ödevlerim", href: "/ogrenci/odevler", ikon: "odev", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Süreli Testlerim", href: "/ogrenci/testler", ikon: "sure", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Takip Listem", href: "/ogrenci/takip", ikon: "takip", yetki: "panel:ogrenci" },
  { grup: "Gelişimim", ad: "Deneme Sonuçlarım", href: "/ogrenci/denemeler", ikon: "artis", yetki: "panel:ogrenci" },
  { grup: "Gelişimim", ad: "Yol Haritam", href: "/ogrenci/yol-haritasi", ikon: "harita", yetki: "panel:ogrenci" },
  { grup: "Gelişimim", ad: "Seviye Formum", href: "/ogrenci/profil", ikon: "hedef", yetki: "panel:ogrenci" },

  /* ── Veli ── */
  { grup: "Velilik", ad: "Panelim", href: "/veli", ikon: "veli", yetki: "panel:veli" },

  /* ── Yönetici: genel bakış → kişiler → finans → içerik ── */
  { grup: "Yönetim", ad: "Dashboard", href: "/admin", ikon: "panel", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "Aktivite", href: "/admin/aktivite", ikon: "aktivite", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "Site Kullanımı", href: "/admin/kullanim", ikon: "artis", yetki: "panel:admin" },
  { grup: "Kullanıcılar", ad: "Kullanıcı Listesi", href: "/admin/kullanicilar", ikon: "ogrenciler", yetki: "panel:admin" },
  { grup: "Kullanıcılar", ad: "Koçlar", href: "/admin/koclar", ikon: "pusula", yetki: "panel:admin" },
  { grup: "Kullanıcılar", ad: "Öğretmenler", href: "/admin/ogretmenler", ikon: "ogretmen", yetki: "panel:admin" },
  { grup: "Kullanıcılar", ad: "Başvurular", href: "/admin/basvurular", ikon: "gelenKutusu", yetki: "basvuru:yonet" },
  { grup: "Kullanıcılar", ad: "Değerlendirmeler", href: "/admin/degerlendirmeler", ikon: "yildiz", yetki: "panel:admin" },
  { grup: "Finans", ad: "Ödemeler", href: "/admin/odemeler", ikon: "odeme", yetki: "odeme:yonet" },
  { grup: "İçerik", ad: "Blog", href: "/admin/blog", ikon: "blog", yetki: "blog:yonet" },
  { grup: "İçerik", ad: "Video Dersler", href: "/video-dersler", ikon: "video", yetki: "video:yonet", roller: ["admin"] },

  /* ── İletişim (roller kesişir; E-posta yalnız yönetici) ── */
  { grup: "İletişim", ad: "Mesajlar", href: "/mesajlar", ikon: "mesaj", yetki: "mesaj:goruntule", mesaj: true },
  { grup: "İletişim", ad: "E-posta", href: "/admin/mail", ikon: "mail", yetki: "mail:yonet" },
  { grup: "İletişim", ad: "Bildirimler", href: "/bildirimler", ikon: "zil", yetki: "bildirim:goruntule", bildirim: true },

  /* ── Hesap/ödeme her rolde en alttadır ── */
  { grup: "Hesabım", ad: "Ödemeler", href: "/koc/odemeler", ikon: "odeme", yetki: "odeme:koc" },
  { grup: "Hesabım", ad: "Ödemelerim", href: "/ogrenci/odemeler", ikon: "odeme", yetki: "odeme:ogrenci" },
];

/* Grup → ikon aksan rengi (globals.css'te .nav-link[data-aksan=…] karşılığı).
   hatem-crm'deki grup renk haritasının marka paletine uyarlanmış hâli. */
export const GRUP_AKSANLARI: Record<string, string> = {
  Ana: "notr",
  "Öğretmenlik": "bordo",
  "Derslerim": "bordo",
  "Çalışmalarım": "gok",
  "Gelişimim": "sari",
  Velilik: "gok",
  "Yönetim": "bordo",
  "Kullanıcılar": "gok",
  Finans: "sari",
  "İçerik": "bordo",
  "Eğitim": "gok",
  "Araçlar": "sari",
  "İletişim": "yesil",
  "Hesabım": "notr",
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
  return NAVIGASYON.filter(
    (k) => yetkiVar(rol, k.yetki) && (!k.roller || k.roller.includes(rol))
  );
}
