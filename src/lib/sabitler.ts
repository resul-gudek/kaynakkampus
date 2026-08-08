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

export const ROLLER = ["admin", "koc", "ogrenci", "veli"] as const;
export const ODEV_DURUMLARI = ["bekliyor", "tamamlandi"] as const;
export const DENEME_TURLERI = ["TYT", "AYT", "LGS", "Branş"] as const;
export const OZEL_DERS_DURUMLARI = ["talep", "planlandi", "yapildi", "reddedildi", "iptal"] as const;
/** Ders sonrası değerlendirme yönü: koç→öğrenci / öğrenci→koç */
export const DEGERLENDIRME_YONLERI = ["kocOgrenci", "ogrenciKoc"] as const;
export const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"] as const;
export const SEVIYELER = ["İyi", "Orta", "Zayıf"] as const;

/* ── Süreli testler ───────────────────────────────────────────
   Şıklar A..E; bir soru en az 2, en çok 5 seçenek taşıyabilir.
   Oturum durumu: "basladi" (çözülüyor) | "tamamlandi" (öğrenci bitirdi)
   | "sureDoldu" (süre bittiği için otomatik kapandı). */
export const TEST_SECENEKLERI = ["A", "B", "C", "D", "E"] as const;
export const TEST_MIN_SECENEK = 2;
export const TEST_OTURUM_DURUMLARI = ["basladi", "tamamlandi", "sureDoldu"] as const;
/** Test süresi sınırları (dakika) ve soru sayısı tavanı */
export const TEST_MIN_SURE = 1;
export const TEST_MAX_SURE = 300;
export const TEST_MAX_SORU = 100;

/* ── Video ders notları ───────────────────────────────────────
   Yayın durumu: "taslak" (öğrenciye kapalı) | "yayinda" (listelenir)
   | "gizli" (listelenmez; atanmış öğrenci doğrudan bağlantıyla açar).
   Kaynak: harici bağlantı ya da sunucuya yüklenen dosya. */
export const VIDEO_DURUMLARI = ["taslak", "yayinda", "gizli"] as const;
export const VIDEO_KAYNAK_TURLERI = ["baglanti", "dosya"] as const;
/** Öğrencinin video ilerleme durumu (izleme kaydı yoksa "izlenmedi") */
export const VIDEO_IZLEME_DURUMLARI = ["izlenmedi", "izleniyor", "tamamlandi"] as const;
export const VIDEO_MAX_SURE = 600; // dakika
export const VIDEO_MAX_GOREV = 20;

export type Rol = (typeof ROLLER)[number];
export type OdevDurum = (typeof ODEV_DURUMLARI)[number];
export type DenemeTur = (typeof DENEME_TURLERI)[number];
export type OzelDersDurum = (typeof OZEL_DERS_DURUMLARI)[number];
export type DegerlendirmeYon = (typeof DEGERLENDIRME_YONLERI)[number];
export type TestSecenek = (typeof TEST_SECENEKLERI)[number];
export type TestOturumDurum = (typeof TEST_OTURUM_DURUMLARI)[number];
export type VideoDurum = (typeof VIDEO_DURUMLARI)[number];
export type VideoKaynakTur = (typeof VIDEO_KAYNAK_TURLERI)[number];
export type VideoIzlemeDurum = (typeof VIDEO_IZLEME_DURUMLARI)[number];

export const VIDEO_DURUM_ETIKETLERI: Record<VideoDurum, string> = {
  taslak: "Taslak",
  yayinda: "Yayında",
  gizli: "Gizli",
};

export const VIDEO_IZLEME_ETIKETLERI: Record<VideoIzlemeDurum, string> = {
  izlenmedi: "İzlenmedi",
  izleniyor: "İzleniyor",
  tamamlandi: "Tamamlandı",
};

/* ── Blog ─────────────────────────────────────────────────────
   Kategori anahtarları ascii/slug biçimindedir; adres ve DB'de anahtar,
   arayüzde BLOG_KATEGORI_ETIKETLERI kullanılır.
   Yayın durumu: "taslak" (yalnız panelde görünür) | "yayinda" (herkese açık). */
export const BLOG_KATEGORILERI = [
  "egitim",
  "ogrenci-rehberi",
  "ogretmen-rehberi",
  "ebeveyn-rehberi",
  "sinav-ders-calisma",
  "egitim-koclugu",
  "ozel-ders",
  "etkinlik-materyal",
] as const;
export const BLOG_DURUMLARI = ["taslak", "yayinda"] as const;

export type BlogKategori = (typeof BLOG_KATEGORILERI)[number];
export type BlogDurum = (typeof BLOG_DURUMLARI)[number];

export const BLOG_KATEGORI_ETIKETLERI: Record<BlogKategori, string> = {
  egitim: "Eğitim",
  "ogrenci-rehberi": "Öğrenci Rehberi",
  "ogretmen-rehberi": "Öğretmen Rehberi",
  "ebeveyn-rehberi": "Ebeveyn Rehberi",
  "sinav-ders-calisma": "Sınav ve Ders Çalışma",
  "egitim-koclugu": "Eğitim Koçluğu",
  "ozel-ders": "Özel Ders",
  "etkinlik-materyal": "Etkinlik ve Materyal",
};

export const BLOG_KATEGORI_IKONLARI: Record<BlogKategori, string> = {
  egitim: "🎓",
  "ogrenci-rehberi": "🧑‍🎓",
  "ogretmen-rehberi": "👩‍🏫",
  "ebeveyn-rehberi": "👪",
  "sinav-ders-calisma": "📚",
  "egitim-koclugu": "🧭",
  "ozel-ders": "🎯",
  "etkinlik-materyal": "🎨",
};

export const BLOG_DURUM_ETIKETLERI: Record<BlogDurum, string> = {
  taslak: "Taslak",
  yayinda: "Yayında",
};

/** Bir yazıya eklenebilecek azami etiket sayısı */
export const BLOG_MAX_ETIKET = 10;

/* ── Ödemeler ─────────────────────────────────────────────────
   Ödeme kaleminin iki bacağı ayrı durum yürütür:
     · öğrenci bacağı  → "bekliyor" (tahsil edilmedi) | "odendi" | "iptal"
     · öğretmen bacağı → "bekliyor" | "hazirlaniyor" (ödeme hazırlanıyor) | "odendi"
   Durumları yalnız yönetici değiştirir; öğrenci/öğretmen kendi bacağını
   yalnız okur (bkz. lib/odeme.ts, actions/odeme.ts). */
export const OGRENCI_ODEME_DURUMLARI = ["bekliyor", "odendi", "iptal"] as const;
export const KOC_ODEME_DURUMLARI = ["bekliyor", "hazirlaniyor", "odendi"] as const;
/** Tahsilat yöntemi — "" (belirtilmedi) dahil */
export const ODEME_YONTEMLERI = ["", "havale", "kart", "nakit", "diger"] as const;
/** Tek kalemde girilebilecek azami tutar (TL) — hatalı girişe karşı üst sınır */
export const ODEME_MAX_TUTAR = 1_000_000;

export type OgrenciOdemeDurum = (typeof OGRENCI_ODEME_DURUMLARI)[number];
export type KocOdemeDurum = (typeof KOC_ODEME_DURUMLARI)[number];
export type OdemeYontem = (typeof ODEME_YONTEMLERI)[number];

export const OGRENCI_ODEME_ETIKETLERI: Record<OgrenciOdemeDurum, string> = {
  bekliyor: "Bekliyor",
  odendi: "Ödendi",
  iptal: "İptal",
};

export const KOC_ODEME_ETIKETLERI: Record<KocOdemeDurum, string> = {
  bekliyor: "Bekliyor",
  hazirlaniyor: "Hazırlanıyor",
  odendi: "Ödendi",
};

export const ODEME_YONTEM_ETIKETLERI: Record<OdemeYontem, string> = {
  "": "Belirtilmedi",
  havale: "Havale / EFT",
  kart: "Kredi kartı",
  nakit: "Nakit",
  diger: "Diğer",
};

/* ── Ön mülakat / başvuru sistemi ─────────────────────────────
   Teknik değerler İngilizce/ascii; kullanıcıya *_ETIKETLERI ile gösterilir. */

export const BASVURU_TURLERI = ["ogretmen", "ogrenci", "koc"] as const;
export type BasvuruTur = (typeof BASVURU_TURLERI)[number];
export const BASVURU_TUR_ETIKETLERI: Record<BasvuruTur, string> = {
  ogretmen: "Öğretmen",
  ogrenci: "Öğrenci",
  koc: "Eğitim Koçu",
};

export const BASVURU_DURUMLARI = [
  "yeni",
  "inceleniyor",
  "ek_bilgi",
  "mulakata_uygun",
  "mulakat_planlandi",
  "mulakat_tamamlandi",
  "olumlu",
  "olumsuz",
] as const;
export type BasvuruDurum = (typeof BASVURU_DURUMLARI)[number];
export const BASVURU_DURUM_ETIKETLERI: Record<BasvuruDurum, string> = {
  yeni: "Yeni başvuru",
  inceleniyor: "İnceleniyor",
  ek_bilgi: "Ek bilgi bekleniyor",
  mulakata_uygun: "Mülakata uygun",
  mulakat_planlandi: "Mülakat planlandı",
  mulakat_tamamlandi: "Mülakat tamamlandı",
  olumlu: "Olumlu",
  olumsuz: "Olumsuz",
};

export const MULAKAT_TURLERI = ["online", "telefon", "yuzyuze"] as const;
export type MulakatTur = (typeof MULAKAT_TURLERI)[number];
export const MULAKAT_TUR_ETIKETLERI: Record<MulakatTur, string> = {
  online: "Online görüşme",
  telefon: "Telefon görüşmesi",
  yuzyuze: "Yüz yüze görüşme",
};

/** Mülakat sonucu — "" (henüz sonuçlanmadı) dahil */
export const MULAKAT_SONUCLARI = [
  "yapildi",
  "katilmadi",
  "yeniden",
  "olumlu",
  "olumsuz",
  "beklemede",
] as const;
export type MulakatSonuc = (typeof MULAKAT_SONUCLARI)[number];
export const MULAKAT_SONUC_ETIKETLERI: Record<MulakatSonuc, string> = {
  yapildi: "Mülakat yapıldı",
  katilmadi: "Mülakata katılmadı",
  yeniden: "Görüşme yeniden planlanacak",
  olumlu: "Olumlu",
  olumsuz: "Olumsuz",
  beklemede: "Beklemede",
};

/** Formlarda kullanılan seçenek listeleri */
export const SINIF_SEVIYELERI = {
  ilkokul: ["1. Sınıf", "2. Sınıf", "3. Sınıf", "4. Sınıf"],
  ortaokul: ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf"],
  lise: ["9. Sınıf", "10. Sınıf", "11. Sınıf", "12. Sınıf", "Mezun"],
} as const;
export const SINAV_GRUPLARI = ["LGS", "TYT", "AYT", "YDT", "KPSS", "DGS", "ALES"] as const;
export const OKUL_TURLERI = [
  "İlkokul",
  "Ortaokul",
  "Lise",
  "Mezun / Üniversite",
] as const;
/** Öğrenci formunu dolduran kişi */
export const FORMU_DOLDURAN = ["ogrenci", "veli"] as const;
