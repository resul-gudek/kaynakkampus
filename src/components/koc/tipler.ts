/* Sunucu bileşeninden (page.tsx) client bileşenlerine geçen
   serileştirilmiş satır tipleri — tarihler ISO "YYYY-MM-DD" dizgesi. */

export interface OdevS {
  id: string;
  ders: string;
  konu: string;
  aciklama: string;
  kaynak: string;
  soruSayisi: number | null;
  sonTarih: string; // ISO ya da ""
  durum: string; // "bekliyor" | "tamamlandi"
}

export interface TakipS {
  id: string;
  gun: string;
  gorev: string;
  tamamlandi: boolean;
}

export interface DenemeDersS {
  ders: string;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  yanlisKonular: string[];
}

export interface DenemeS {
  id: string;
  ad: string;
  tur: string;
  tarih: string;
  net: number;
  dersler: DenemeDersS[];
}

export interface YolS {
  id: string;
  sira: number;
  ders: string;
  konu: string;
  hedef: string;
  xp: number;
  durum: "tamamlandi" | "aktif" | "kilitli";
}

export interface OzelS {
  id: string;
  ders: string;
  konu: string;
  tarih: string;
  saat: string;
  sure: number;
  ucret: number;
  odendi: boolean;
  durum: string; // "talep" | "planlandi" | "yapildi" | "reddedildi" | "iptal"
  olusturan: string; // "koc" | "ogrenci"
  mesaj: string;
  redNotu: string;
  not_: string;
  odev: string;
}

/** Özel ders özet çubuğu (lib/hesap ozelDersOzet'in serileştirilmiş hali) */
export interface OzelOzetS {
  toplam: number;
  yapilan: number;
  planlanan: number;
  toplamSaat: number;
  bekleyenUcret: number;
  sonrakiMetin: string; // "20.07.2026 18:00 – Matematik" ya da ""
  gecikenPlan: number;
  onayBekleyenKoc: number;
  onayBekleyenOgr: number;
}

export interface ZayifS {
  ders: string;
  konu: string;
  kez: number;
}

/** Ajanda takvimine düşen tek olay (tüm öğrencilerden toplanır) */
export interface AjandaOlay {
  tip: "ozel" | "odev" | "deneme";
  tarih: string; // ISO
  tamam: boolean;
  etiket: string; // hücre içi kısa metin
  baslik: string; // gün detayı başlığı
  metin: string; // gün detayı açıklaması
  etiketler: string[]; // gün detayı .tag rozetleri
  rozet: { stil: "tamam" | "bekliyor" | "talep"; metin: string } | null;
}

/** WhatsApp düğmelerinin ihtiyaç duyduğu her şey (legacy waOdevHatirlat / waVeliRaporu) */
export interface WaVeri {
  ogrenciId: string;
  ad: string;
  telefon: string;
  veliTelefon: string;
  kocAd: string;
  bekleyenOdevler: { ders: string; konu: string; sonTarih: string; kaynak: string }[];
  odevYuzde: number;
  odevTamam: number;
  odevToplam: number;
  takipYuzde: number;
  takipTamam: number;
  takipToplam: number;
  yolYuzde: number;
  yolTamamlanan: number;
  yolToplam: number;
  seviye: number;
  xp: number;
  sonDeneme: { ad: string; net: number } | null;
  netFarki: number | null;
  zayif: { ders: string; konu: string }[];
  ozel: {
    toplam: number;
    yapilan: number;
    toplamSaat: number;
    sonrakiTarih: string; // ISO ya da ""
    sonrakiSaat: string;
    bekleyenUcret: number;
  };
}
