/* Sınav / ders tanımları — legacy/kocluk.js'ten birebir taşındı */

/** Deneme girişinde kullanılan ders listeleri ve soru sayıları */
export const DENEME_DERSLERI: Record<string, { ders: string; soru: number }[]> = {
  TYT: [
    { ders: "Türkçe", soru: 40 }, { ders: "Sosyal Bilimler", soru: 20 },
    { ders: "Temel Matematik", soru: 40 }, { ders: "Fen Bilimleri", soru: 20 },
  ],
  AYT: [
    { ders: "Matematik", soru: 40 }, { ders: "Fizik", soru: 14 },
    { ders: "Kimya", soru: 13 }, { ders: "Biyoloji", soru: 13 },
    { ders: "Edebiyat", soru: 24 }, { ders: "Tarih", soru: 10 }, { ders: "Coğrafya", soru: 6 },
  ],
  LGS: [
    { ders: "Türkçe", soru: 20 }, { ders: "Matematik", soru: 20 },
    { ders: "Fen Bilimleri", soru: 20 }, { ders: "İnkılap Tarihi", soru: 10 },
    { ders: "Din Kültürü", soru: 10 }, { ders: "İngilizce", soru: 10 },
  ],
  "Branş": [{ ders: "Branş", soru: 40 }],
};

/** Başlangıç seviye formundaki öz değerlendirme ders listeleri */
export const PROFIL_DERSLERI: Record<string, string[]> = {
  YKS: ["Türkçe / Edebiyat", "Matematik", "Geometri", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya"],
  LGS: ["Türkçe", "Matematik", "Fen Bilimleri", "İnkılap Tarihi", "Din Kültürü", "İngilizce"],
};

export const ROLLER = ["admin", "koc", "ogrenci"] as const;
export const ODEV_DURUMLARI = ["bekliyor", "tamamlandi"] as const;
export const DENEME_TURLERI = ["TYT", "AYT", "LGS", "Branş"] as const;
export const OZEL_DERS_DURUMLARI = ["talep", "planlandi", "yapildi", "reddedildi", "iptal"] as const;
export const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"] as const;
export const SEVIYELER = ["İyi", "Orta", "Zayıf"] as const;

export type Rol = (typeof ROLLER)[number];
export type OdevDurum = (typeof ODEV_DURUMLARI)[number];
export type DenemeTur = (typeof DENEME_TURLERI)[number];
export type OzelDersDurum = (typeof OZEL_DERS_DURUMLARI)[number];
