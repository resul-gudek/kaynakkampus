/* ═══════════════════════════════════════════════════════════════
   Eğitim Başvurusu — özel ders ve eğitim koçluğu başvurularının
   iş kuralları. Panellerden (öğrenci/öğretmen) ve "Aramıza Katıl"
   ön mülakat sisteminden (Basvuru modeli) BAĞIMSIZDIR.

   Bu dosya saf TypeScript'tir (DB/DOM yok): hem istemci formu hem
   sunucu eylemi hem de yönetim ekranı aynı kuralları buradan okur.
   Yaş/sınıf → eğitim uygunluğu ve telefon biçimi tek yerde durur;
   istemcide gizlenen bir eğitim sunucuda da reddedilir.
   ═══════════════════════════════════════════════════════════════ */

import { z } from "zod";

/* ── Tür / durum ─────────────────────────────────────────────── */

export const EGITIM_BASVURU_TURLERI = ["ozel_ders", "egitim_koclugu"] as const;
export type EgitimBasvuruTur = (typeof EGITIM_BASVURU_TURLERI)[number];
export const EGITIM_BASVURU_TUR_ETIKETLERI: Record<EgitimBasvuruTur, string> = {
  ozel_ders: "Özel Ders",
  egitim_koclugu: "Eğitim Koçluğu",
};

export const EGITIM_BASVURU_DURUMLARI = [
  "yeni",
  "iletisime_gecildi",
  "gorusme_yapildi",
  "kayit_oldu",
  "uygun_degil",
] as const;
export type EgitimBasvuruDurum = (typeof EGITIM_BASVURU_DURUMLARI)[number];
export const EGITIM_BASVURU_DURUM_ETIKETLERI: Record<EgitimBasvuruDurum, string> = {
  yeni: "Yeni",
  iletisime_gecildi: "İletişime Geçildi",
  gorusme_yapildi: "Görüşme Yapıldı",
  kayit_oldu: "Kayıt Oldu",
  uygun_degil: "Uygun Değil",
};

/* ── Sınıf ───────────────────────────────────────────────────── */

export const SINIFLAR = [
  "okul_oncesi",
  "1", "2", "3", "4",
  "5", "6", "7", "8",
  "9", "10", "11", "12",
] as const;
export type Sinif = (typeof SINIFLAR)[number];

export function sinifEtiketi(sinif: string): string {
  return sinif === "okul_oncesi" ? "Okul öncesi" : `${sinif}. sınıf`;
}

/** Başlık biçimi ("2. Sınıf") — mail konusu gibi başlık düzeni gereken yerlerde. */
export function sinifBasligi(sinif: string): string {
  return sinif === "okul_oncesi" ? "Okul Öncesi" : `${sinif}. Sınıf`;
}

/** Okul öncesi 0, 1. sınıf 1 … 12. sınıf 12 (kademe kuralları için). */
function sinifNo(sinif: Sinif): number {
  return sinif === "okul_oncesi" ? 0 : Number(sinif);
}

export const YAS_EN_AZ = 3;
export const YAS_EN_COK = 30;

/* ── Eğitimler (özel ders) ───────────────────────────────────── */

export const EGITIMLER = ["ingilizce", "almanca", "ilkokul_destek", "din_kuran", "degerler"] as const;
export type Egitim = (typeof EGITIMLER)[number];
export const EGITIM_ETIKETLERI: Record<Egitim, string> = {
  ingilizce: "İngilizce",
  almanca: "Almanca",
  ilkokul_destek: "İlkokul Ders Desteği",
  din_kuran: "Din ve Kur’an Eğitimi",
  degerler: "Değerler Eğitimi",
};
export const EGITIM_ACIKLAMALARI: Record<Egitim, string> = {
  ingilizce: "6–18 yaş · seviyeye göre planlanan bireysel dersler",
  almanca: "6–18 yaş · temelden ya da okul desteği olarak",
  ilkokul_destek: "1–4. sınıf · Türkçe, matematik, hayat bilgisi, fen",
  din_kuran: "Okul öncesinden liseye · Kur’an okuma, sure ve dualar, temel bilgiler",
  degerler: "Okul öncesi ve ilkokul · karakter ve değerler eğitimi",
};

/**
 * Yaş ve sınıfa göre bir eğitimin başvuruya açık olup olmadığını söyler.
 * Kurallar (ürün kararı):
 *   İngilizce / Almanca      → 6–18 yaş
 *   İlkokul Ders Desteği     → 1–4. sınıf
 *   Din ve Kur’an Eğitimi    → okul öncesinden liseye (her sınıf)
 *   Değerler Eğitimi         → okul öncesi ve ilkokul (0–4)
 */
export function egitimUygunMu(egitim: Egitim, yas: number, sinif: Sinif): boolean {
  const s = sinifNo(sinif);
  switch (egitim) {
    case "ingilizce":
    case "almanca":
      return yas >= 6 && yas <= 18;
    case "ilkokul_destek":
      return s >= 1 && s <= 4;
    case "din_kuran":
      return true;
    case "degerler":
      return s <= 4;
  }
}

export function uygunEgitimler(yas: number, sinif: Sinif): Egitim[] {
  return EGITIMLER.filter((e) => egitimUygunMu(e, yas, sinif));
}

/* ── Eğitime göre dinamik sorular ────────────────────────────── */

export const DIL_SEVIYELERI = ["Bilmiyorum", "Başlangıç", "Temel", "Orta", "İyi"] as const;
export const DIL_AMACLARI = [
  "Okul derslerine destek",
  "Temelden öğrenme",
  "Konuşma becerisini geliştirme",
  "Sınava hazırlık",
  "Genel gelişim",
  "Diğer",
] as const;
export const ILKOKUL_DERSLERI = ["Türkçe", "Matematik", "Hayat Bilgisi", "Fen Bilimleri", "İngilizce", "Diğer"] as const;
export const DIN_IHTIYACLARI = [
  "Kur’an okumayı öğrenme",
  "Kur’an-ı Kerim geliştirme",
  "Sure ve dualar",
  "Temel dini bilgiler",
  "Genel Din ve Kur’an Eğitimi",
  "Diğer",
] as const;

/* ── Koçluk ──────────────────────────────────────────────────── */

export const KOCLUK_KONULARI = [
  "Ders çalışma düzeni oluşturma",
  "Program hazırlama",
  "Zaman yönetimi",
  "Motivasyon",
  "Hedef belirleme",
  "Sınav sürecini planlama",
  "Ders takibi",
  "Ödev ve görev takibi",
  "Çalışma alışkanlığı kazanma",
  "Kendime uygun çalışma yöntemini bulma",
  "Diğer",
] as const;

/* ── Ortak ───────────────────────────────────────────────────── */

export const BASVURANLAR = ["veli", "ogrenci"] as const;
export type Basvuran = (typeof BASVURANLAR)[number];
export const BASVURAN_ETIKETLERI: Record<Basvuran, string> = {
  veli: "Veli",
  ogrenci: "Öğrencinin kendisi",
};

export const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"] as const;

/* ── Telefon ─────────────────────────────────────────────────── */

/**
 * Türkiye telefon numarasını doğrular ve "0XXX XXX XX XX" biçimine çevirir.
 * Kabul edilen girişler: 05xx…, 5xx…, +90 5xx…, 0090 5xx…, 0212… (sabit hat),
 * araya boşluk / tire / parantez / nokta girmiş hâlleri. Geçersizse null.
 */
export function telefonNormalle(girdi: string): string | null {
  let rakamlar = girdi.replace(/[\s().\-]/g, "");
  if (rakamlar.startsWith("+")) rakamlar = rakamlar.slice(1);
  if (!/^\d+$/.test(rakamlar)) return null;
  if (rakamlar.startsWith("0090")) rakamlar = rakamlar.slice(4);
  else if (rakamlar.startsWith("90") && rakamlar.length === 12) rakamlar = rakamlar.slice(2);
  else if (rakamlar.startsWith("0") && rakamlar.length === 11) rakamlar = rakamlar.slice(1);
  // Ulusal numara: alan kodu 2xx/3xx/4xx (sabit) ya da 5xx (mobil) + 7 rakam
  if (!/^[2-5]\d{9}$/.test(rakamlar)) return null;
  return `0${rakamlar.slice(0, 3)} ${rakamlar.slice(3, 6)} ${rakamlar.slice(6, 8)} ${rakamlar.slice(8, 10)}`;
}

/* ── Zod şemaları ────────────────────────────────────────────── */

const metin = (max: number) => z.string().trim().max(max);
const zorunluMetin = (mesaj: string, max = 120) => z.string().trim().min(2, mesaj).max(max);
const epostaSemasi = z.string().trim().toLowerCase().email("Geçerli bir e-posta adresi yazın.").max(254);
const telefonSemasi = z
  .string()
  .trim()
  .min(1, "Telefon numarası gerekli.")
  .transform((v, ctx) => {
    const n = telefonNormalle(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "Geçerli bir Türkiye telefon numarası yazın (örn. 05xx xxx xx xx)." });
      return z.NEVER;
    }
    return n;
  });
const yasSemasi = z.coerce
  .number({ message: "Yaş sayı olmalı." })
  .int("Yaş tam sayı olmalı.")
  .min(YAS_EN_AZ, `Yaş en az ${YAS_EN_AZ} olabilir.`)
  .max(YAS_EN_COK, `Yaş en fazla ${YAS_EN_COK} olabilir.`);
const gunlerSemasi = z.array(z.enum(GUNLER)).max(GUNLER.length).default([]);
const kvkkSemasi = z.literal(true, { message: "Devam etmek için kişisel veri bilgilendirmesini onaylayın." });

const OrtakIletisim = {
  basvuran: z.enum(BASVURANLAR, { message: "Başvuruyu kimin yaptığını seçin." }),
  iletisimAd: zorunluMetin("Ad soyad yazın."),
  telefon: telefonSemasi,
  eposta: epostaSemasi,
  gunler: gunlerSemasi,
  saatler: metin(300).default(""),
  kvkkOnay: kvkkSemasi,
};

export const OzelDersSemasi = z
  .object({
    ogrenciAd: zorunluMetin("Öğrencinin adını ve soyadını yazın."),
    yas: yasSemasi,
    sinif: z.enum(SINIFLAR, { message: "Sınıf seçin." }),
    egitim: z.enum(EGITIMLER, { message: "Bir eğitim seçin." }),
    // Dil (İngilizce / Almanca)
    seviye: z.enum(DIL_SEVIYELERI).optional(),
    amac: z.enum(DIL_AMACLARI).optional(),
    amacDiger: metin(200).default(""),
    // İlkokul ders desteği
    dersler: z.array(z.enum(ILKOKUL_DERSLERI)).max(ILKOKUL_DERSLERI.length).default([]),
    dersDiger: metin(200).default(""),
    // Din ve Kur’an
    ihtiyac: z.enum(DIN_IHTIYACLARI).optional(),
    ihtiyacDiger: metin(200).default(""),
    ...OrtakIletisim,
    ekBilgi: metin(3000).default(""),
  })
  .superRefine((v, ctx) => {
    if (!egitimUygunMu(v.egitim, v.yas, v.sinif)) {
      ctx.addIssue({ code: "custom", path: ["egitim"], message: "Seçilen eğitim bu yaş ve sınıf için uygun değil." });
    }
    if (v.egitim === "ingilizce" || v.egitim === "almanca") {
      if (!v.seviye) ctx.addIssue({ code: "custom", path: ["seviye"], message: "Mevcut seviyeyi seçin." });
      if (!v.amac) ctx.addIssue({ code: "custom", path: ["amac"], message: "Dersi alma amacını seçin." });
    }
    if (v.egitim === "ilkokul_destek" && v.dersler.length === 0) {
      ctx.addIssue({ code: "custom", path: ["dersler"], message: "En az bir ders seçin." });
    }
    if (v.egitim === "din_kuran" && !v.ihtiyac) {
      ctx.addIssue({ code: "custom", path: ["ihtiyac"], message: "İhtiyaç alanını seçin." });
    }
  });
export type OzelDersVeri = z.infer<typeof OzelDersSemasi>;
export type OzelDersGirdi = z.input<typeof OzelDersSemasi>;

export const KoclukSemasi = z.object({
  ogrenciAd: zorunluMetin("Öğrencinin adını ve soyadını yazın."),
  yas: yasSemasi,
  sinif: z.enum(SINIFLAR, { message: "Sınıf seçin." }),
  okul: metin(200).default(""),
  konular: z.array(z.enum(KOCLUK_KONULARI)).min(1, "En az bir konu seçin.").max(KOCLUK_KONULARI.length),
  konuDiger: metin(200).default(""),
  zorlayan: metin(2000).default(""),
  ...OrtakIletisim,
  not: metin(3000).default(""),
});
export type KoclukVeri = z.infer<typeof KoclukSemasi>;
export type KoclukGirdi = z.input<typeof KoclukSemasi>;

export const EgitimBasvuruDurumSemasi = z.enum(EGITIM_BASVURU_DURUMLARI);

/** Kullanıcıya teknik ayrıntı gösterilmez; gönderim hataları bu tek metne iner. */
export const GENEL_HATA =
  "Başvurunuz şu anda gönderilemedi. Lütfen bilgilerinizi kontrol ederek tekrar deneyin.";

/* ── Görüntü satırları (mail + yönetim detayı ortak) ─────────── */

export interface BasvuruBolumu {
  baslik: string;
  satirlar: { etiket: string; deger: string }[];
}

function digerli(secim: string | undefined, diger: string): string {
  if (!secim) return "";
  return secim === "Diğer" && diger ? `Diğer: ${diger}` : secim;
}

function iletisimBolumleri(v: OzelDersVeri | KoclukVeri, notEtiketi: string, not: string): BasvuruBolumu[] {
  return [
    {
      baslik: "İletişim",
      satirlar: [
        { etiket: "Başvuruyu yapan", deger: BASVURAN_ETIKETLERI[v.basvuran] },
        { etiket: v.basvuran === "veli" ? "Veli ad soyad" : "Ad soyad", deger: v.iletisimAd },
        { etiket: "Telefon", deger: v.telefon },
        { etiket: "E-posta", deger: v.eposta },
      ],
    },
    {
      baslik: "Uygunluk",
      satirlar: [
        { etiket: "Uygun günler", deger: v.gunler.join(", ") },
        { etiket: "Uygun saatler", deger: v.saatler },
        { etiket: notEtiketi, deger: not },
      ],
    },
  ];
}

/** Özel ders başvurusunu okunur bölümlere ayırır; boş satırlar atılır. */
export function ozelDersBolumleri(v: OzelDersVeri): BasvuruBolumu[] {
  const egitimSatirlari: { etiket: string; deger: string }[] = [
    { etiket: "Eğitim", deger: EGITIM_ETIKETLERI[v.egitim] },
  ];
  if (v.egitim === "ingilizce" || v.egitim === "almanca") {
    egitimSatirlari.push(
      { etiket: "Mevcut seviye", deger: v.seviye ?? "" },
      { etiket: "Dersi alma amacı", deger: digerli(v.amac, v.amacDiger) },
    );
  } else if (v.egitim === "ilkokul_destek") {
    const dersler = v.dersler.map((d) => (d === "Diğer" && v.dersDiger ? `Diğer: ${v.dersDiger}` : d));
    egitimSatirlari.push({ etiket: "Destek istenen dersler", deger: dersler.join(", ") });
  } else if (v.egitim === "din_kuran") {
    egitimSatirlari.push({ etiket: "İhtiyaç alanı", deger: digerli(v.ihtiyac, v.ihtiyacDiger) });
  }
  return temizle([
    {
      baslik: "Öğrenci",
      satirlar: [
        { etiket: "Ad soyad", deger: v.ogrenciAd },
        { etiket: "Yaş", deger: `${v.yas}` },
        { etiket: "Sınıf", deger: sinifEtiketi(v.sinif) },
      ],
    },
    { baslik: "Eğitim seçimi", satirlar: egitimSatirlari },
    ...iletisimBolumleri(v, "Ek bilgi", v.ekBilgi),
  ]);
}

/** Eğitim koçluğu başvurusunu okunur bölümlere ayırır; boş satırlar atılır. */
export function koclukBolumleri(v: KoclukVeri): BasvuruBolumu[] {
  const konular = v.konular.map((k) => (k === "Diğer" && v.konuDiger ? `Diğer: ${v.konuDiger}` : k));
  return temizle([
    {
      baslik: "Öğrenci",
      satirlar: [
        { etiket: "Ad soyad", deger: v.ogrenciAd },
        { etiket: "Yaş", deger: `${v.yas}` },
        { etiket: "Sınıf", deger: sinifEtiketi(v.sinif) },
        { etiket: "Okul", deger: v.okul },
      ],
    },
    {
      baslik: "Koçluk ihtiyacı",
      satirlar: [
        { etiket: "Destek istenen konular", deger: konular.join(", ") },
        { etiket: "En çok zorlayan konu", deger: v.zorlayan },
      ],
    },
    ...iletisimBolumleri(v, "Not", v.not),
  ]);
}

function temizle(bolumler: BasvuruBolumu[]): BasvuruBolumu[] {
  return bolumler
    .map((b) => ({ ...b, satirlar: b.satirlar.filter((s) => s.deger.trim() !== "") }))
    .filter((b) => b.satirlar.length > 0);
}

/** Kayıt/veri JSON'unu türe göre bölümlere çevirir (yönetim detayı). */
export function basvuruBolumleri(tur: string, veri: unknown): BasvuruBolumu[] {
  if (tur === "ozel_ders") {
    const s = OzelDersSemasi.safeParse(veri);
    if (s.success) return ozelDersBolumleri(s.data);
  } else if (tur === "egitim_koclugu") {
    const s = KoclukSemasi.safeParse(veri);
    if (s.success) return koclukBolumleri(s.data);
  }
  // Şema zamanla değişirse eski kayıtlar yine de ham hâliyle görünsün
  const ham = veri && typeof veri === "object" ? (veri as Record<string, unknown>) : {};
  return [
    {
      baslik: "Başvuru verisi",
      satirlar: Object.entries(ham)
        .filter(([, d]) => d !== "" && d !== undefined && d !== null && !(Array.isArray(d) && d.length === 0))
        .map(([k, d]) => ({ etiket: k, deger: Array.isArray(d) ? d.join(", ") : String(d) })),
    },
  ];
}
