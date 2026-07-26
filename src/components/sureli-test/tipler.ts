/* Süreli test bileşenlerinin serileştirilmiş satır tipleri.
   Sunucu bileşenleri Prisma satırlarını bu tiplere indirger; tarihler
   gösterime hazır metin ya da ISO dizgesidir.

   GÜVENLİK: Çözüm ekranına giden tipte (CozumSoru) doğru cevap ALANI YOKTUR.
   Doğru cevaplar yalnız test kapandıktan sonra SonucSoru ile taşınır. */

/** Öğrencinin test listesindeki bir kart */
export interface TestKarti {
  testId: string;
  ad: string;
  ders: string;
  konu: string;
  seviye: string;
  soruSayisi: number;
  sure: number; // dakika
  sonTarih: string; // ISO "YYYY-MM-DD" ya da ""
  ogretmenAd: string;
  /** Devam eden ya da tamamlanmış oturum; hiç başlanmadıysa "" */
  oturumId: string;
  /** "" = başlanmadı */
  durum: "" | "basladi" | "tamamlandi" | "sureDoldu";
  sonuc: TestSonucS | null;
}

/** Kapanmış bir oturumun sonucu */
export interface TestSonucS {
  dogru: number;
  yanlis: number;
  bos: number;
  yuzde: number;
  gecenSure: number; // saniye
  durum: "tamamlandi" | "sureDoldu";
  bitis: string; // "26.07.2026 14:32" ya da ""
}

/** Çözüm ekranındaki soru — doğru cevap içermez */
export interface CozumSoru {
  id: string;
  sira: number;
  metin: string;
  secenekler: string[];
}

/** Sonuç incelemesindeki soru — test kapandığı için doğru cevap da gelir */
export interface SonucSoru extends CozumSoru {
  dogru: string; // "A".."E"
  verilen: string; // öğrencinin cevabı; boş bıraktıysa ""
}

/** Çözüm ekranına geçen oturum bilgisi */
export interface CozumOturumu {
  id: string;
  testAd: string;
  ders: string;
  konu: string;
  sure: number; // dakika
  /** Süre sınırı (ISO) — sayaç bu ana göre geri sayar */
  bitisSiniri: string;
  cevaplar: Record<string, string>;
}

/* ── Öğretmen tarafı ── */

/** Test bankası satırı */
export interface KocTestS {
  id: string;
  ad: string;
  ders: string;
  konu: string;
  seviye: string;
  soruSayisi: number;
  sure: number;
  aktif: boolean;
  atamalar: KocAtamaS[];
  /** Bu testin çözüm sayısı */
  cozenSayisi: number;
}

export interface KocAtamaS {
  id: string;
  ogrenciId: string;
  ogrenciAd: string;
  sonTarih: string; // ISO ya da ""
  /** Öğrencinin bu testteki son durumu */
  durum: "" | "basladi" | "tamamlandi" | "sureDoldu";
}

/** Öğretmenin gördüğü tek sonuç satırı */
export interface KocSonucS {
  oturumId: string;
  ogrenciId: string;
  ogrenciAd: string;
  testId: string;
  testAd: string;
  ders: string;
  konu: string;
  soruSayisi: number;
  sure: number;
  durum: "basladi" | "tamamlandi" | "sureDoldu";
  dogru: number;
  yanlis: number;
  bos: number;
  yuzde: number;
  gecenSure: number; // saniye
  bitis: string; // "26.07.2026 14:32" ya da ""
}

/** Öğretmen formundaki öğrenci seçenekleri */
export interface OgrenciSecenek {
  id: string;
  ad: string;
  sinif: string;
}

/** Oturum durumu → rozet metni */
export const TEST_DURUM_ETIKETLERI: Record<string, string> = {
  "": "Çözülmedi",
  basladi: "Devam ediyor",
  tamamlandi: "Tamamlandı",
  sureDoldu: "Süre doldu",
};
