import { z } from "zod";
import {
  BASVURU_TURLERI,
  FORMU_DOLDURAN,
  GUNLER,
  MULAKAT_SONUCLARI,
  MULAKAT_TURLERI,
  OKUL_TURLERI,
} from "./sabitler";

/* ═══════════════════════════════════════════════════════════════
   Ön mülakat / başvuru form doğrulama şemaları.
   İstemci, form yanıtlarını tek bir JSON nesnesi (`veri`) olarak
   gönderir; dosyalar FormData'da ayrı taşınır. Bu şemalar parse
   edilmiş JSON nesnesini doğrular (gerçek boolean/array/number).
   Türe özel şema `veri` alanına yazılır; kart alanları (ad, telefon,
   eposta, sehir) türetilir (bkz. actions/basvuru.ts).
   ═══════════════════════════════════════════════════════════════ */

// ── Yeniden kullanılan alan tipleri ──────────────────────────
const kisaMetin = (max = 200) => z.string().trim().max(max);
const uzunMetin = (max = 5000) => z.string().trim().max(max).default("");
const zorunluKisa = (etiket: string, max = 200) =>
  z.string().trim().min(1, `${etiket} gerekli`).max(max);

/** Boş bırakılabilir e-posta; doluysa biçim doğrulanır */
const epostaOpsiyonel = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .refine((s) => s === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), "Geçersiz e-posta adresi")
  .default("");

/** Boş bırakılabilir URL (video / portfolyo linkleri) */
const urlOpsiyonel = z
  .string()
  .trim()
  .max(500)
  .refine((s) => s === "" || /^https?:\/\/.+/i.test(s), "Geçerli bir bağlantı girin (https://…)")
  .default("");

/** Zorunlu onay kutusu (KVKK / açık rıza / veli onayı) */
const zorunluOnay = (mesaj: string) =>
  z.boolean().refine((v) => v === true, mesaj);

const opsiyonelBool = z.boolean().default(false);
const metinDizisi = z.array(z.string().trim().max(200)).max(100).default([]);

// Doğum yılı: 1940–bugün aralığında makul bir sayı
const dogumYili = z.coerce
  .number()
  .int()
  .min(1940, "Geçersiz yıl")
  .max(2025, "Geçersiz yıl")
  .optional();

// ── Ortak KVKK bloğu ─────────────────────────────────────────
const kvkkAlanlari = {
  kvkkOnay: zorunluOnay("KVKK aydınlatma metnini onaylamanız gerekir."),
  acikRizaOnay: zorunluOnay("Verilerinizin işlenmesine açık rıza vermeniz gerekir."),
};

// ── 2.1 Öğretmen ön mülakat formu ────────────────────────────
export const OgretmenBasvuruSemasi = z.object({
  // Aşama 1 — Kişisel
  ad: zorunluKisa("Ad"),
  soyad: zorunluKisa("Soyad"),
  telefon: zorunluKisa("Telefon"),
  eposta: epostaOpsiyonel,
  sehir: kisaMetin().default(""),
  ilce: kisaMetin().default(""),
  dogumYili,
  // Aşama 2 — Eğitim
  universite: kisaMetin().default(""),
  fakulte: kisaMetin().default(""),
  bolum: kisaMetin().default(""),
  mezuniyetYili: kisaMetin(20).default(""),
  devamEgitim: kisaMetin().default(""),
  yuksekLisans: kisaMetin(500).default(""),
  formasyon: kisaMetin(300).default(""),
  sertifikalar: uzunMetin(2000),
  // Aşama 3 — Branş ve ders
  brans: zorunluKisa("Branş"),
  dersler: metinDizisi,
  seviyeler: metinDizisi, // ilkokul/ortaokul/lise sınıf seviyeleri + sınav grupları
  bireyselDers: opsiyonelBool,
  grupDersi: opsiyonelBool,
  // Aşama 4 — Deneyim
  deneyimYili: kisaMetin(50).default(""),
  kurumlar: uzunMetin(2000),
  ozelDersDeneyimi: uzunMetin(2000),
  onlineDersDeneyimi: uzunMetin(2000),
  egitimTeknolojisiDuzey: kisaMetin(100).default(""),
  kullandigiAraclar: uzunMetin(1000),
  // Aşama 5 — Uygunluk
  gunler: z.array(z.enum(GUNLER)).max(7).default([]),
  saatler: kisaMetin(300).default(""),
  maxHaftalikDers: z.coerce.number().int().min(0).max(100).optional(),
  onlineUygun: opsiyonelBool,
  yuzyuzeUygun: opsiyonelBool,
  // Aşama 6 — Açık uçlu
  nedenKatilmak: uzunMetin(),
  anlatimYontemi: uzunMetin(),
  anlamadigindaYontem: uzunMetin(),
  motivasyonDusuk: uzunMetin(),
  dikkatCanli: uzunMetin(),
  veliIletisim: uzunMetin(),
  // Aşama 7 — Video linkleri (dosyalar ayrı taşınır)
  ornekDersVideo: urlOpsiyonel,
  tanitimVideo: urlOpsiyonel,
  ...kvkkAlanlari,
});

// ── 2.2 Öğrenci ön mülakat formu ─────────────────────────────
export const OgrenciBasvuruSemasi = z
  .object({
    formuDolduran: z.enum(FORMU_DOLDURAN).default("ogrenci"),
    ad: zorunluKisa("Öğrencinin adı"),
    soyad: zorunluKisa("Öğrencinin soyadı"),
    sinif: kisaMetin(50).default(""),
    okulTuru: z.enum(OKUL_TURLERI).or(z.literal("")).default(""),
    sehir: kisaMetin().default(""),
    telefon: zorunluKisa("İletişim telefonu"),
    eposta: epostaOpsiyonel,
    // 18 yaş altı ise veli bilgileri zorunlu (superRefine)
    yas18Alti: opsiyonelBool,
    ders: kisaMetin(300).default(""),
    konular: uzunMetin(2000),
    sonNot: kisaMetin(50).default(""),
    ortalama: kisaMetin(50).default(""),
    sorunlar: uzunMetin(2000),
    hedefNot: kisaMetin(100).default(""),
    hedefGelisim: uzunMetin(2000),
    beklenti: uzunMetin(2000),
    gunler: z.array(z.enum(GUNLER)).max(7).default([]),
    saatler: kisaMetin(300).default(""),
    oncedenOzelDers: opsiyonelBool,
    koclukIster: opsiyonelBool,
    ekBilgi: uzunMetin(),
    // Veli alanları
    veliAd: kisaMetin().default(""),
    veliTelefon: kisaMetin(50).default(""),
    veliEposta: epostaOpsiyonel,
    veliOnay: opsiyonelBool,
    ...kvkkAlanlari,
  })
  .superRefine((v, ctx) => {
    const veliZorunlu =
      v.formuDolduran === "veli" ||
      v.yas18Alti === true ||
      v.okulTuru === "İlkokul" ||
      v.okulTuru === "Ortaokul";
    if (!veliZorunlu) return;
    if (!v.veliAd.trim())
      ctx.addIssue({ code: "custom", path: ["veliAd"], message: "Veli adı gerekli" });
    if (!v.veliTelefon.trim())
      ctx.addIssue({ code: "custom", path: ["veliTelefon"], message: "Veli telefonu gerekli" });
    if (v.veliOnay !== true)
      ctx.addIssue({ code: "custom", path: ["veliOnay"], message: "Veli onayı gerekli" });
  });

// ── 2.3 Eğitim koçu ön mülakat formu ─────────────────────────
export const KocBasvuruSemasi = z.object({
  ad: zorunluKisa("Ad"),
  soyad: zorunluKisa("Soyad"),
  telefon: zorunluKisa("Telefon"),
  eposta: epostaOpsiyonel,
  sehir: kisaMetin().default(""),
  mezunOkul: kisaMetin().default(""),
  mezunBolum: kisaMetin().default(""),
  koclukEgitimi: uzunMetin(2000),
  sertifikalar: uzunMetin(2000),
  koclukDeneyimi: uzunMetin(2000),
  yasGruplari: metinDizisi,
  ilkokulDeneyim: opsiyonelBool,
  ortaokulDeneyim: opsiyonelBool,
  liseDeneyim: opsiyonelBool,
  sinavDeneyim: opsiyonelBool,
  haftalikUygunluk: kisaMetin(500).default(""),
  onlineGorusmeUygun: opsiyonelBool,
  kisaOzgecmis: uzunMetin(),
  // Açık uçlu sorular
  koclukTanimi: uzunMetin(),
  calismaAliskanligiYok: uzunMetin(),
  surekliErteleyen: uzunMetin(),
  hedefBelirleme: uzunMetin(),
  gelisimTakip: uzunMetin(),
  veliIletisim: uzunMetin(),
  ...kvkkAlanlari,
});

/** tur → şema eşlemesi */
export const BASVURU_SEMALARI = {
  ogretmen: OgretmenBasvuruSemasi,
  ogrenci: OgrenciBasvuruSemasi,
  koc: KocBasvuruSemasi,
} as const;

export const BasvuruTurSemasi = z.enum(BASVURU_TURLERI);

/** Türe özel şemayı seçip doğrular; kart alanlarını türetir. */
export function basvuruDogrula(tur: string, veri: unknown) {
  const t = BasvuruTurSemasi.parse(tur);
  const sema = BASVURU_SEMALARI[t];
  const cozum = sema.parse(veri) as Record<string, unknown>;
  const ad = `${String(cozum.ad ?? "").trim()} ${String(cozum.soyad ?? "").trim()}`.trim();
  return {
    tur: t,
    veri: cozum,
    kart: {
      ad,
      telefon: String(cozum.telefon ?? "").trim(),
      eposta: String(cozum.eposta ?? "").trim(),
      sehir: String(cozum.sehir ?? "").trim(),
    },
  };
}

/* ── Yönetim tarafı şemaları ──────────────────────────────── */

export const BasvuruDurumSemasi = z.enum([
  "yeni",
  "inceleniyor",
  "ek_bilgi",
  "mulakata_uygun",
  "mulakat_planlandi",
  "mulakat_tamamlandi",
  "olumlu",
  "olumsuz",
]);

export const BasvuruNotSemasi = z.object({
  basvuruId: z.string().min(1),
  metin: z.string().trim().min(1, "Not boş olamaz").max(4000, "Not çok uzun"),
});

const isoTarih = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih");
const saat = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Geçersiz saat");

export const MulakatPlanlaSemasi = z.object({
  basvuruId: z.string().min(1),
  tarih: isoTarih,
  saat,
  sure: z.coerce.number().int().min(5).max(600).default(30),
  tur: z.enum(MULAKAT_TURLERI).default("online"),
  baglanti: urlOpsiyonel,
  adres: kisaMetin(500).default(""),
  gorusmeci: kisaMetin(200).default(""),
  aciklama: uzunMetin(2000),
});

export const MulakatSonucSemasi = z.object({
  mulakatId: z.string().min(1),
  sonuc: z.enum(MULAKAT_SONUCLARI),
  sonucNotu: uzunMetin(2000),
});
