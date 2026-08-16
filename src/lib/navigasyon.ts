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
  { grup: "Ana", ad: "Panelim", href: "/koc", ikon: "🎓", yetki: "panel:koc" },
  { grup: "Ana", ad: "Panelim", href: "/ogrenci", ikon: "🏠", yetki: "panel:ogrenci" },
  { grup: "Öğretmenlik", ad: "Ajanda", href: "/koc/ajanda", ikon: "📅", yetki: "panel:koc" },
  { grup: "Öğretmenlik", ad: "Öğrencilerim", href: "/koc/ogrenciler", ikon: "👥", yetki: "panel:koc" },
  { grup: "Öğretmenlik", ad: "Süreli Testler", href: "/koc/testler", ikon: "⏱️", yetki: "panel:koc" },
  { grup: "Öğretmenlik", ad: "Ödemeler", href: "/koc/odemeler", ikon: "💳", yetki: "odeme:koc" },
  { grup: "Çalışmalarım", ad: "Takvimim", href: "/ogrenci/takvim", ikon: "📅", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Ödevlerim", href: "/ogrenci/odevler", ikon: "📘", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Süreli Testlerim", href: "/ogrenci/testler", ikon: "⏱️", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Takip Listem", href: "/ogrenci/takip", ikon: "✅", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Yol Haritam", href: "/ogrenci/yol-haritasi", ikon: "🗺️", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Deneme Sonuçlarım", href: "/ogrenci/denemeler", ikon: "📈", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Özel Derslerim", href: "/ogrenci/ozel-dersler", ikon: "🎓", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Video Derslerim", href: "/ogrenci/videolar", ikon: "🎬", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Seviye Formum", href: "/ogrenci/profil", ikon: "🎯", yetki: "panel:ogrenci" },
  { grup: "Çalışmalarım", ad: "Ödemelerim", href: "/ogrenci/odemeler", ikon: "💳", yetki: "odeme:ogrenci" },
  { grup: "Velilik", ad: "Panelim", href: "/veli", ikon: "👪", yetki: "panel:veli" },
  { grup: "Yönetim", ad: "Dashboard", href: "/admin", ikon: "📊", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "Kullanıcı Listesi", href: "/admin/kullanicilar", ikon: "👥", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "Koçlar", href: "/admin/koclar", ikon: "🧭", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "Öğretmenler", href: "/admin/ogretmenler", ikon: "👩‍🏫", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "Değerlendirmeler", href: "/admin/degerlendirmeler", ikon: "⭐", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "Başvurular", href: "/admin/basvurular", ikon: "📥", yetki: "basvuru:yonet" },
  { grup: "Yönetim", ad: "Ödemeler", href: "/admin/odemeler", ikon: "💳", yetki: "odeme:yonet" },
  { grup: "Yönetim", ad: "Aktivite", href: "/admin/aktivite", ikon: "📡", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "E-posta", href: "/admin/mail", ikon: "✉️", yetki: "mail:yonet" },
  { grup: "Yönetim", ad: "Blog", href: "/admin/blog", ikon: "📰", yetki: "blog:yonet" },
  { grup: "Eğitim", ad: "Online Sınıflar", href: "/siniflar", ikon: "💻", yetki: "sinif:goruntule" },
  { grup: "Eğitim", ad: "Video Dersler", href: "/video-dersler", ikon: "🎬", yetki: "video:yonet" },
  { grup: "Araçlar", ad: "Ödev Oluştur", href: "/odev-olustur.html", ikon: "📝", yetki: "odev:olustur" },
  { grup: "Araçlar", ad: "BEP Oluştur", href: "/bep-olustur.html", ikon: "📋", yetki: "bep:olustur" },
  { grup: "İletişim", ad: "Mesajlar", href: "/mesajlar", ikon: "💬", yetki: "mesaj:goruntule", mesaj: true },
  { grup: "İletişim", ad: "Bildirimler", href: "/bildirimler", ikon: "🔔", yetki: "bildirim:goruntule", bildirim: true },
];

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
