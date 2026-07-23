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
}

export const NAVIGASYON: NavKalemi[] = [
  { grup: "Ana", ad: "Panelim", href: "/koc", ikon: "🎓", yetki: "panel:koc" },
  { grup: "Ana", ad: "Panelim", href: "/ogrenci", ikon: "🏠", yetki: "panel:ogrenci" },
  { grup: "Yönetim", ad: "Dashboard", href: "/admin", ikon: "📊", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "Kullanıcı Listesi", href: "/admin/kullanicilar", ikon: "👥", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "Koçlar Listesi", href: "/admin/koclar", ikon: "👩‍🏫", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "Aktivite", href: "/admin/aktivite", ikon: "📡", yetki: "panel:admin" },
  { grup: "Yönetim", ad: "E-posta", href: "/admin/mail", ikon: "✉️", yetki: "mail:yonet" },
  { grup: "Eğitim", ad: "Online Sınıflar", href: "/siniflar", ikon: "💻", yetki: "sinif:goruntule" },
  { grup: "Araçlar", ad: "Ödev Oluştur", href: "/odev-olustur.html", ikon: "📝", yetki: "odev:olustur" },
  { grup: "Araçlar", ad: "BEP Oluştur", href: "/bep-olustur.html", ikon: "📋", yetki: "bep:olustur" },
  { grup: "İletişim", ad: "Bildirimler", href: "/bildirimler", ikon: "🔔", yetki: "bildirim:goruntule", bildirim: true },
];

export const ROL_ETIKETLERI: Record<Rol, string> = {
  admin: "Yönetici",
  koc: "Koç",
  ogrenci: "Öğrenci",
};

/** Rolün görebileceği menü kalemleri */
export function rolNavigasyonu(rol: Rol): NavKalemi[] {
  return NAVIGASYON.filter((k) => yetkiVar(rol, k.yetki));
}
