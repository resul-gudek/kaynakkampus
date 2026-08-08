/* ═══════════════════════════════════════════════════════════════
   Ödemeler — istemci-güvenli tanımlar, alan listeleri ve saf hesaplar
   (node/prisma importu YOK). DB'ye dokunan sorgular: odeme-sunucu.ts,
   yazma işlemleri: actions/odeme.ts.

   MODÜLÜN TEMEL KURALI — bir ödeme kaleminin iki bacağı vardır ve
   taraflar birbirinin bacağını GÖRMEZ:

     öğrenci  → ne ödediği, ne zaman, durumu.  Öğretmen payını ve
                platform payını hiçbir şekilde göremez.
     öğretmen → kendisine ne ödeneceği, hangi öğrenci için, tarih,
                açıklama, durum. Öğrencinin platforma ödediği tutarı,
                komisyonu ve tahsilat bilgisini göremez — öğrenciden
                yalnız AD gelir, tek bir finansal alanı gelmez.
     yönetici → tümü + platform payı.

   Bu ayrım aşağıdaki alan listeleriyle, SORGU seviyesinde uygulanır:
   yasak kolonlar hiç SELECT edilmez, dolayısıyla ne sunucu bileşenine
   ne de istemciye ulaşır. Sayfada/istemcide "gösterme" filtresine
   güvenilmez. Liste dışına kolon eklemek gizliliği bozar — koruma testi
   odeme.test.ts içindedir.
   ═══════════════════════════════════════════════════════════════ */

import {
  KOC_ODEME_DURUMLARI,
  ODEME_YONTEMLERI,
  OGRENCI_ODEME_DURUMLARI,
  type KocOdemeDurum,
  type OdemeYontem,
  type OgrenciOdemeDurum,
} from "./sabitler";

/* ── Prisma select alan listeleri ────────────────────────────── */

/** Öğrencinin kendi ödemelerinde görebildiği kolonlar */
export const OGRENCI_ODEME_ALANLARI = {
  id: true,
  tarih: true,
  aciklama: true,
  ogrenciTutar: true,
  ogrenciDurum: true,
  ogrenciOdemeTarihi: true,
  yontem: true,
} as const;

/** Öğretmenin kendisine yapılacak ödemelerde görebildiği kolonlar.
    Öğrenciden YALNIZCA ad gelir (iç içe select bilerek tek alanlıdır);
    öğrencinin tutarı/durumu/tahsilatı bu sorguya hiç girmez. */
export const KOC_ODEME_ALANLARI = {
  id: true,
  tarih: true,
  aciklama: true,
  kocTutar: true,
  kocDurum: true,
  kocOdemeTarihi: true,
  ogrenci: { select: { ad: true } },
} as const;

/** Öğrenciye kapalı kolonlar — öğretmen payı, komisyon ve yönetici notu */
export const OGRENCIYE_KAPALI = [
  "kocId",
  "kocTutar",
  "kocDurum",
  "kocOdemeTarihi",
  "yoneticiNotu",
] as const;

/** Öğretmene kapalı kolonlar — öğrencinin finansal bacağının tamamı.
    Öğrenci ADI kapalı değildir (öğretmen kimin için ödeme aldığını görür);
    kimlik (ogrenciId) yine de taşınmaz, gerek yok. */
export const KOCA_KAPALI = [
  "ogrenciId",
  "ogrenciTutar",
  "ogrenciDurum",
  "ogrenciOdemeTarihi",
  "yontem",
  "yoneticiNotu",
] as const;

/** Öğretmen sorgusunun öğrenci ilişkisinden çekmesine izin verilen alanlar */
export const KOCA_ACIK_OGRENCI_ALANLARI = ["ad"] as const;

/* ── Durum daraltma ──────────────────────────────────────────
   Prisma sqlserver enum desteklemediği için durum kolonları String'dir
   (CHECK + zod ile korunur). Okuma tarafında tanınmayan değer görsel
   olarak "bekliyor" gibi davranır; sayfa patlamaz. */

export function ogrenciDurumu(deger: string): OgrenciOdemeDurum {
  return (OGRENCI_ODEME_DURUMLARI as readonly string[]).includes(deger)
    ? (deger as OgrenciOdemeDurum)
    : "bekliyor";
}

export function kocDurumu(deger: string): KocOdemeDurum {
  return (KOC_ODEME_DURUMLARI as readonly string[]).includes(deger)
    ? (deger as KocOdemeDurum)
    : "bekliyor";
}

export function yontemi(deger: string): OdemeYontem {
  return (ODEME_YONTEMLERI as readonly string[]).includes(deger)
    ? (deger as OdemeYontem)
    : "";
}

/* ── Satır tipleri ───────────────────────────────────────────
   Sayfalara taşınan biçim: Date alanları ISO dizgeye çevrilir
   (istemci bileşenine serileşebilir veri geçsin). */

export interface OgrenciOdemeSatiri {
  id: string;
  tarih: string;
  aciklama: string;
  tutar: number;
  durum: OgrenciOdemeDurum;
  odemeTarihi: string;
  yontem: OdemeYontem;
}

export interface KocOdemeSatiri {
  id: string;
  tarih: string;
  /** ödemenin hangi öğrenci için olduğu — yalnız ad, finansal bilgi yok */
  ogrenciAd: string;
  aciklama: string;
  tutar: number;
  durum: KocOdemeDurum;
  odemeTarihi: string;
}

/** Yönetici satırı — her iki bacak + taraf adları */
export interface YoneticiOdemeSatiri {
  id: string;
  tarih: string;
  aciklama: string;
  ogrenciId: string;
  ogrenciAd: string;
  kocId: string;
  kocAd: string;
  ogrenciTutar: number;
  ogrenciDurum: OgrenciOdemeDurum;
  ogrenciOdemeTarihi: string;
  yontem: OdemeYontem;
  kocTutar: number;
  kocDurum: KocOdemeDurum;
  kocOdemeTarihi: string;
  platformTutar: number;
  yoneticiNotu: string;
}

/* ── Hesaplar ────────────────────────────────────────────────
   İptal edilen kalem hiçbir toplama girmez: tahsil edilmeyecek bir
   borç ne ciroya ne alacağa yazılır. */

/** Platformda kalan tutar — saklanmaz, her zaman buradan hesaplanır */
export function platformPayi(o: { ogrenciTutar: number; kocTutar: number }): number {
  return o.ogrenciTutar - o.kocTutar;
}

/** 1250 → "1.250 ₺" */
export function tutarStr(tl: number): string {
  return `${Math.round(tl || 0).toLocaleString("tr-TR")} ₺`;
}

export interface OgrenciOdemeOzeti {
  adet: number;
  toplam: number;
  odenen: number;
  bekleyen: number;
}

/** Öğrenci sayfasının üst kutuları */
export function ogrenciOzeti(satirlar: OgrenciOdemeSatiri[]): OgrenciOdemeOzeti {
  const gecerli = satirlar.filter((s) => s.durum !== "iptal");
  const odenen = gecerli.filter((s) => s.durum === "odendi");
  const topla = (l: OgrenciOdemeSatiri[]) => l.reduce((t, s) => t + s.tutar, 0);
  const toplam = topla(gecerli);
  const odenenToplam = topla(odenen);
  return {
    adet: gecerli.length,
    toplam,
    odenen: odenenToplam,
    bekleyen: toplam - odenenToplam,
  };
}

export interface KocOdemeOzeti {
  adet: number;
  toplam: number;
  odenen: number;
  /** "bekliyor" + "hazirlaniyor" — henüz hesaba geçmemiş alacak */
  bekleyen: number;
}

/** Öğretmen sayfasının üst kutuları */
export function kocOzeti(satirlar: KocOdemeSatiri[]): KocOdemeOzeti {
  const topla = (l: KocOdemeSatiri[]) => l.reduce((t, s) => t + s.tutar, 0);
  const toplam = topla(satirlar);
  const odenen = topla(satirlar.filter((s) => s.durum === "odendi"));
  return { adet: satirlar.length, toplam, odenen, bekleyen: toplam - odenen };
}

export interface YoneticiOdemeOzeti {
  adet: number;
  /** öğrencilerin ödemesi gereken toplam (iptaller hariç) */
  ogrenciToplam: number;
  /** tahsil edilmiş kısım */
  ogrenciTahsil: number;
  /** öğretmenlere ödenecek toplam */
  kocToplam: number;
  /** öğretmenlere ödenmiş kısım */
  kocOdenen: number;
  /** platformda kalan (ogrenciToplam - kocToplam) */
  platform: number;
}

/** Yönetici sayfasının finansal özeti */
export function yoneticiOzeti(satirlar: YoneticiOdemeSatiri[]): YoneticiOdemeOzeti {
  const gecerli = satirlar.filter((s) => s.ogrenciDurum !== "iptal");
  const ozet: YoneticiOdemeOzeti = {
    adet: gecerli.length,
    ogrenciToplam: 0,
    ogrenciTahsil: 0,
    kocToplam: 0,
    kocOdenen: 0,
    platform: 0,
  };
  for (const s of gecerli) {
    ozet.ogrenciToplam += s.ogrenciTutar;
    if (s.ogrenciDurum === "odendi") ozet.ogrenciTahsil += s.ogrenciTutar;
    ozet.kocToplam += s.kocTutar;
    if (s.kocDurum === "odendi") ozet.kocOdenen += s.kocTutar;
  }
  ozet.platform = ozet.ogrenciToplam - ozet.kocToplam;
  return ozet;
}

export interface OgrenciBazliOzet {
  ogrenciId: string;
  ogrenciAd: string;
  adet: number;
  /** öğrencinin ödediği/ödeyeceği toplam */
  ogrenciToplam: number;
  /** tahsil edilmiş kısım */
  tahsil: number;
  /** tahsil edilmeyi bekleyen kısım */
  bekleyen: number;
  /** bu öğrenciden doğan öğretmen alacağı */
  kocToplam: number;
  /** bu öğrenciden platformda kalan */
  platform: number;
}

/**
 * Yönetici için öğrenci bazlı finansal döküm — "her öğrenci için ödediği
 * tutar / öğretmene ödenecek tutar / platforma kalan" görünümü.
 * Tahsil tutarına göre azalan sıralanır.
 */
export function ogrenciBazliOzet(satirlar: YoneticiOdemeSatiri[]): OgrenciBazliOzet[] {
  const tablo = new Map<string, OgrenciBazliOzet>();
  for (const s of satirlar) {
    if (s.ogrenciDurum === "iptal") continue;
    const kayit =
      tablo.get(s.ogrenciId) ??
      {
        ogrenciId: s.ogrenciId,
        ogrenciAd: s.ogrenciAd,
        adet: 0,
        ogrenciToplam: 0,
        tahsil: 0,
        bekleyen: 0,
        kocToplam: 0,
        platform: 0,
      };
    kayit.adet += 1;
    kayit.ogrenciToplam += s.ogrenciTutar;
    if (s.ogrenciDurum === "odendi") kayit.tahsil += s.ogrenciTutar;
    kayit.kocToplam += s.kocTutar;
    tablo.set(s.ogrenciId, kayit);
  }
  for (const kayit of tablo.values()) {
    kayit.bekleyen = kayit.ogrenciToplam - kayit.tahsil;
    kayit.platform = kayit.ogrenciToplam - kayit.kocToplam;
  }
  return [...tablo.values()].sort((a, b) => b.ogrenciToplam - a.ogrenciToplam);
}

/* ── Rozet sınıfları ─────────────────────────────────────────
   Üç görsel durum: olumlu (ödendi), bekleyen (bekliyor/hazırlanıyor),
   nötr (iptal). CSS modülleri bu anahtarları taşır. */

export type RozetTuru = "olumlu" | "bekleyen" | "notr";

export function ogrenciDurumRozeti(durum: OgrenciOdemeDurum): RozetTuru {
  if (durum === "odendi") return "olumlu";
  if (durum === "iptal") return "notr";
  return "bekleyen";
}

export function kocDurumRozeti(durum: KocOdemeDurum): RozetTuru {
  return durum === "odendi" ? "olumlu" : "bekleyen";
}
