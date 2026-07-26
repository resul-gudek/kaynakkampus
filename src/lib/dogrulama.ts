import { z } from "zod";
import { slugGecerli, SLUG_MAX } from "./blog";
import {
  BLOG_DURUMLARI,
  BLOG_KATEGORILERI,
  BLOG_MAX_ETIKET,
  DENEME_TURLERI,
  GUNLER,
  ODEV_DURUMLARI,
  OZEL_DERS_DURUMLARI,
  SEVIYELER,
  TEST_MAX_SORU,
  TEST_MAX_SURE,
  TEST_MIN_SECENEK,
  TEST_MIN_SURE,
  TEST_SECENEKLERI,
  VIDEO_DURUMLARI,
  VIDEO_KAYNAK_TURLERI,
  VIDEO_MAX_GOREV,
  VIDEO_MAX_SURE,
} from "./sabitler";

/* Prisma sqlserver enum desteklemediği için tüm "enum" alanları
   yazma sınırında bu zod şemalarıyla doğrulanır. */

const isoTarih = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih");
const saat = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Geçersiz saat").or(z.literal(""));
/** Opsiyonel e-posta: boş bırakılabilir, doluysa biçimi doğrulanır */
const epostaOpsiyonel = z
  .string()
  .trim()
  .toLowerCase()
  .refine((s) => s === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), "Geçersiz e-posta adresi")
  .default("");

export const OdevSemasi = z.object({
  ogrenciId: z.string().min(1),
  ders: z.string().trim().min(1, "Ders gerekli"),
  konu: z.string().trim().min(1, "Konu gerekli"),
  aciklama: z.string().trim().default(""),
  kaynak: z.string().trim().default(""),
  soruSayisi: z.coerce.number().int().positive().optional().nullable(),
  sonTarih: isoTarih.optional().nullable(),
});

export const OdevDurumSemasi = z.enum(ODEV_DURUMLARI);

export const TakipSemasi = z.object({
  ogrenciId: z.string().min(1),
  gun: z.enum(GUNLER),
  gorev: z.string().trim().min(1, "Görev gerekli"),
});

export const DenemeDersSemasi = z.object({
  ders: z.string().trim().min(1),
  dogru: z.coerce.number().int().min(0),
  yanlis: z.coerce.number().int().min(0),
  bos: z.coerce.number().int().min(0),
  yanlisKonular: z.array(z.string().trim()).default([]),
});

export const DenemeSemasi = z.object({
  ogrenciId: z.string().min(1),
  ad: z.string().trim().min(1, "Deneme adı gerekli"),
  tur: z.enum(DENEME_TURLERI),
  tarih: isoTarih,
  dersler: z.array(DenemeDersSemasi).min(1),
});

export const YolAdimiSemasi = z.object({
  ogrenciId: z.string().min(1),
  ders: z.string().trim().min(1, "Ders gerekli"),
  konu: z.string().trim().min(1, "Konu gerekli"),
  hedef: z.string().trim().default(""),
  xp: z.coerce.number().int().min(10).max(500).default(50),
});

export const OzelDersSemasi = z.object({
  ogrenciId: z.string().min(1),
  ders: z.string().trim().min(1, "Ders gerekli"),
  konu: z.string().trim().default(""),
  tarih: isoTarih,
  saat: saat.default(""),
  sure: z.coerce.number().int().positive().default(60),
  ucret: z.coerce.number().int().min(0).default(0),
  durum: z.enum(OZEL_DERS_DURUMLARI).default("planlandi"),
  olusturan: z.enum(["koc", "ogrenci"]).default("koc"),
  mesaj: z.string().trim().default(""),
});

export const OzelDersGuncelleSemasi = z.object({
  ders: z.string().trim().min(1).optional(),
  konu: z.string().trim().optional(),
  tarih: isoTarih.optional(),
  saat: saat.optional(),
  sure: z.coerce.number().int().positive().optional(),
  ucret: z.coerce.number().int().min(0).optional(),
  durum: z.enum(OZEL_DERS_DURUMLARI).optional(),
  odendi: z.boolean().optional(),
  not_: z.string().trim().optional(),
  odev: z.string().trim().optional(),
  redNotu: z.string().trim().optional(),
});

/* ── Süreli testler ────────────────────────────────────────────
   Soru sayısı hem ayrı alan hem de soru satırı sayısıdır; ikisi
   tutmuyorsa kayıt reddedilir (formda otomatik eşitlenir).
   Doğru cevap, o sorunun dolu seçenek aralığında olmalıdır. */

export const SureliTestSoruSemasi = z
  .object({
    metin: z.string().trim().min(1, "Soru metni gerekli"),
    secenekler: z
      .array(z.string().trim())
      .min(TEST_MIN_SECENEK, `En az ${TEST_MIN_SECENEK} seçenek gerekli`)
      .max(TEST_SECENEKLERI.length),
    dogru: z.enum(TEST_SECENEKLERI, "Doğru cevap seçin"),
  })
  .refine((s) => s.secenekler.every((x) => x !== ""), {
    error: "Seçenekler boş bırakılamaz",
    path: ["secenekler"],
  })
  .refine((s) => TEST_SECENEKLERI.indexOf(s.dogru) < s.secenekler.length, {
    error: "Doğru cevap, seçenek aralığının dışında",
    path: ["dogru"],
  });

export const SureliTestSemasi = z
  .object({
    ad: z.string().trim().min(1, "Test adı gerekli"),
    ders: z.string().trim().min(1, "Ders gerekli"),
    konu: z.string().trim().default(""),
    seviye: z.string().trim().default(""), // sınıf seviyesi
    soruSayisi: z.coerce
      .number()
      .int()
      .min(1, "En az 1 soru")
      .max(TEST_MAX_SORU, `En çok ${TEST_MAX_SORU} soru`),
    sure: z.coerce
      .number()
      .int()
      .min(TEST_MIN_SURE, `Süre en az ${TEST_MIN_SURE} dakika`)
      .max(TEST_MAX_SURE, `Süre en çok ${TEST_MAX_SURE} dakika`),
    sorular: z.array(SureliTestSoruSemasi).min(1, "En az 1 soru girin"),
    ogrenciIdler: z.array(z.string().min(1)).default([]),
    sonTarih: isoTarih.optional().nullable(),
  })
  .refine((t) => t.sorular.length === t.soruSayisi, {
    error: "Girilen soru sayısı, belirtilen soru sayısıyla aynı olmalı",
    path: ["sorular"],
  });

export const TestAtamaSemasi = z.object({
  testId: z.string().min(1),
  ogrenciIdler: z.array(z.string().min(1)).min(1, "En az bir öğrenci seçin"),
  sonTarih: isoTarih.optional().nullable(),
});

/** Çözüm sırasında kaydedilen cevaplar: { soruId: "A" } — boş cevap gönderilmez */
export const TestCevapSemasi = z.record(z.string().min(1), z.enum(TEST_SECENEKLERI));

/* ── Video ders notları ────────────────────────────────────────
   Kaynak "baglanti" ise adres zorunludur. Kaynak "dosya" ise video kayıt
   oluşturulduktan sonra akış rotasından yüklenir (bkz. actions/video-ders.ts),
   bu yüzden şema aşamasında dosya beklenmez.
   En az bir hedef (öğrenci ya da sınıf) seçilmelidir; atanmamış video
   hiçbir öğrencinin listesine düşmez. */

export const VideoDersSemasi = z
  .object({
    baslik: z.string().trim().min(1, "Video başlığı gerekli").max(200),
    ders: z.string().trim().min(1, "Ders gerekli"),
    konu: z.string().trim().default(""),
    /** Yalnız yönetici gönderir; koç kendi adına yükler (action zorlar) */
    ogretmenId: z.string().trim().default(""),
    aciklama: z.string().trim().default(""),
    islenenKonular: z.string().trim().default(""),
    ogretmenNotu: z.string().trim().default(""),
    tarih: isoTarih,
    sure: z.coerce
      .number()
      .int()
      .min(0)
      .max(VIDEO_MAX_SURE, `Süre en çok ${VIDEO_MAX_SURE} dakika`)
      .default(0),
    kaynakTur: z.enum(VIDEO_KAYNAK_TURLERI).default("baglanti"),
    adres: z.string().trim().max(1000).default(""),
    durum: z.enum(VIDEO_DURUMLARI).default("taslak"),
    ogrenciIdler: z.array(z.string().min(1)).default([]),
    sinifIdler: z.array(z.string().min(1)).default([]),
    gorevler: z
      .array(z.string().trim().max(500))
      .max(VIDEO_MAX_GOREV, `En çok ${VIDEO_MAX_GOREV} görev`)
      .default([]),
  })
  .refine((v) => v.kaynakTur !== "baglanti" || v.adres !== "", {
    error: "Video bağlantısı gerekli",
    path: ["adres"],
  })
  .refine((v) => v.adres === "" || /^https?:\/\/.+/i.test(v.adres), {
    error: "Bağlantı http:// veya https:// ile başlamalı",
    path: ["adres"],
  })
  .refine((v) => v.ogrenciIdler.length + v.sinifIdler.length > 0, {
    error: "En az bir öğrenci ya da sınıf seçin",
    path: ["ogrenciIdler"],
  });

export const VideoDurumSemasi = z.enum(VIDEO_DURUMLARI);

/** Öğrencinin oynatıcıdan gönderdiği ilerleme — sunucu yüzdeyi eşikle yorumlar */
export const VideoIlerlemeSemasi = z.object({
  videoId: z.string().min(1),
  saniye: z.coerce.number().int().min(0).max(24 * 3600),
  yuzde: z.coerce.number().int().min(0).max(100),
});

/** Öğrencinin kişisel notu — yalnız kendisi görür */
export const VideoNotSemasi = z.object({
  videoId: z.string().min(1),
  notlar: z.string().trim().max(5000, "Not çok uzun (en çok 5000 karakter)").default(""),
});

/* ── Blog ──────────────────────────────────────────────────────
   Yazı kullanıcı sistemine bağlanmaz; yazar serbest metindir.
   slug boş bırakılabilir — sunucu başlıktan üretir (bkz. benzersizSlug). */

export const BlogYaziSemasi = z.object({
  baslik: z.string().trim().min(3, "Başlık gerekli").max(200, "Başlık çok uzun"),
  /** Boş gelirse başlıktan üretilir; doluysa biçimi doğrulanır */
  slug: z
    .string()
    .trim()
    .max(SLUG_MAX, `Adres en çok ${SLUG_MAX} karakter olabilir`)
    .refine((s) => s === "" || slugGecerli(s), "Adres yalnız küçük harf, rakam ve tire içerebilir")
    .default(""),
  ozet: z.string().trim().max(400, "Kısa açıklama en çok 400 karakter").default(""),
  icerik: z.string().trim().min(1, "Yazı içeriği gerekli").max(60000, "İçerik çok uzun"),
  kategori: z.enum(BLOG_KATEGORILERI, { error: "Kategori seçin" }),
  etiketler: z
    .array(z.string().trim().min(1).max(40))
    .max(BLOG_MAX_ETIKET, `En çok ${BLOG_MAX_ETIKET} etiket`)
    .default([]),
  seoAciklama: z.string().trim().max(300, "SEO açıklaması en çok 300 karakter").default(""),
  yazarAd: z.string().trim().max(120).default(""),
  durum: z.enum(BLOG_DURUMLARI).default("taslak"),
  /** Boş bırakılırsa yayına alındığı an kullanılır */
  yayinTarihi: isoTarih.or(z.literal("")).default(""),
});

export const BlogDurumSemasi = z.enum(BLOG_DURUMLARI);

/* ── Ders sonrası karşılıklı değerlendirme ─────────────────────
   Yapılandırılmış cevaplar DersDegerlendirme.veri içinde JSON tutulur;
   puan (genel puan) ayrı kolona kopyalanır (bkz. actions/degerlendirme.ts). */

const puan5 = z.coerce.number().int().min(1, "Puan seçin").max(5);

/** Öğretmenin öğrenciyi değerlendirmesi (yon="kocOgrenci") */
export const KocOgrenciDegerlendirmeSemasi = z.object({
  zamaninda: z.enum(["evet", "kismen", "hayir"]), // derse zamanında katıldı mı
  hazirlikli: z.enum(["evet", "kismen", "hayir"]), // derse hazırlıklı mıydı
  katilim: puan5, // derse katılımı
  dikkat: puan5, // dikkati
  anlama: puan5, // konuyu ne ölçüde anladı
  gucluYonler: z.string().trim().default(""), // güçlü olduğu noktalar
  zorlandigi: z.string().trim().default(""), // zorlandığı noktalar
  tekrarKonular: z.string().trim().default(""), // tekrar etmesi gereken konular
  yapilacaklar: z.string().trim().default(""), // sonraki derse kadar yapması gerekenler
  genelYorum: z.string().trim().default(""), // genel öğretmen değerlendirmesi (yazılı)
  puan: puan5, // genel puan
});

/** Öğrencinin öğretmeni değerlendirmesi (yon="ogrenciKoc") */
export const OgrenciKocDegerlendirmeSemasi = z.object({
  anlasilir: puan5, // konuyu anlaşılır anlattı mı
  hiz: z.enum(["yavas", "uygun", "hizli"]), // anlatım hızı uygun muydu
  sorulara: puan5, // sorulara yeterli cevap alabildiniz mi
  rahat: puan5, // ders sırasında rahat hissettiniz mi
  verimli: puan5, // dersin verimli geçtiğini düşünüyor musunuz
  anlatimYorum: z.string().trim().default(""), // anlatımını nasıl değerlendiriyorsunuz
  gorus: z.string().trim().default(""), // eklemek istediğiniz görüş
  puan: puan5, // genel öğretmen puanı
});

export const ProfilSemasi = z.object({
  sinav: z.enum(["YKS", "LGS"]),
  gunlukSaat: z.coerce.number().min(0).max(24),
  tarih: isoTarih,
  notlar: z.string().trim().default(""),
  dersler: z.array(
    z.object({
      ders: z.string().trim().min(1),
      seviye: z.enum(SEVIYELER),
      bilinen: z.array(z.string().trim()).default([]),
      eksik: z.array(z.string().trim()).default([]),
    })
  ),
});

export const OgrenciEkleSemasi = z.object({
  ad: z.string().trim().min(1, "Ad Soyad gerekli"),
  kullanici: z.string().trim().min(3, "Kullanıcı adı en az 3 karakter"),
  sifre: z.string().min(4, "Şifre en az 4 karakter"),
  sinif: z.string().trim().default(""),
  hedef: z.string().trim().default(""),
  telefon: z.string().trim().default(""),
  veliTelefon: z.string().trim().default(""),
  eposta: epostaOpsiyonel,
});

export const KocEkleSemasi = z.object({
  ad: z.string().trim().min(1, "Ad Soyad gerekli"),
  kullanici: z.string().trim().min(3, "Kullanıcı adı en az 3 karakter"),
  sifre: z.string().min(4, "Şifre en az 4 karakter"),
  brans: z.string().trim().default(""),
  eposta: epostaOpsiyonel,
});

export const KullaniciEkleSemasi = z.object({
  rol: z.enum(["admin", "koc", "ogrenci", "veli"], "Geçerli bir rol seçin"),
  ad: z.string().trim().min(1, "Ad Soyad gerekli"),
  kullanici: z.string().trim().min(3, "Kullanıcı adı en az 3 karakter"),
  sifre: z.string().min(4, "Şifre en az 4 karakter"),
  eposta: epostaOpsiyonel,
  brans: z.string().trim().default(""),
  sinif: z.string().trim().default(""),
  hedef: z.string().trim().default(""),
  kocId: z.string().trim().default(""),
  veliId: z.string().trim().default(""),
  telefon: z.string().trim().default(""),
  veliTelefon: z.string().trim().default(""),
});

/** Koç ↔ öğrenci mesajı */
export const MesajSemasi = z.object({
  aliciId: z.string().min(1),
  govde: z.string().trim().min(1, "Mesaj boş olamaz").max(4000, "Mesaj çok uzun"),
});

/* ── E-posta altyapısı ─────────────────────────────────────── */

export const MailAyarSemasi = z.object({
  aktif: z.boolean().default(false),
  sunucu: z.string().trim().default(""),
  port: z.coerce.number().int().min(1).max(65535).default(587),
  guvenli: z.boolean().default(false),
  kullaniciAdi: z.string().trim().default(""),
  sifre: z.string().default(""), // boş bırakılırsa mevcut şifre korunur (actions/mail.ts)
  gonderenAd: z.string().trim().default("Kaynak Kampüs"),
  gonderenAdres: epostaOpsiyonel,
  hatirlatmaSaat: z.coerce.number().int().min(1, "En az 1 saat").max(168, "En çok 168 saat (7 gün)").default(24),
  veliRaporAktif: z.boolean().default(false),
  dersHatirlatmaDk: z.coerce.number().int().min(1, "En az 1 dakika").max(1440, "En çok 1440 dakika (24 saat)").default(15),
});

export const MailSablonSemasi = z.object({
  anahtar: z.string().trim().min(1),
  konu: z.string().trim().min(1, "Konu gerekli"),
  govde: z.string().trim().min(1, "Gövde gerekli"),
  aktif: z.boolean().default(true),
});
