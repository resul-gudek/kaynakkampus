import { z } from "zod";
import {
  DENEME_TURLERI,
  GUNLER,
  ODEV_DURUMLARI,
  OZEL_DERS_DURUMLARI,
  SEVIYELER,
} from "./sabitler";

/* Prisma sqlserver enum desteklemediği için tüm "enum" alanları
   yazma sınırında bu zod şemalarıyla doğrulanır. */

const isoTarih = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih");
const saat = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Geçersiz saat").or(z.literal(""));

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
});

export const KocEkleSemasi = z.object({
  ad: z.string().trim().min(1, "Ad Soyad gerekli"),
  kullanici: z.string().trim().min(3, "Kullanıcı adı en az 3 karakter"),
  sifre: z.string().min(4, "Şifre en az 4 karakter"),
  brans: z.string().trim().default(""),
});
