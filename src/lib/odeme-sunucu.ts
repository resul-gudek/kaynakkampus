/* ═══════════════════════════════════════════════════════════════
   Ödemeler — DB'ye dokunan okuma yardımcıları (yalnız sunucu).
   Saf hesaplar, alan listeleri ve satır tipleri: src/lib/odeme.ts

   Her rolün sorgusu BURADA tek yerden kurulur. Rol ayrımı iki katmanlı:
     1) where — öğrenci yalnız ogrenciId=kendisi, öğretmen yalnız
        kocId=kendisi satırlarını çeker,
     2) select — karşı bacağın kolonları HİÇ çekilmez
        (OGRENCI_ODEME_ALANLARI / KOC_ODEME_ALANLARI).
   Sayfalar bu fonksiyonların dışında prisma.odeme sorgusu açmamalıdır;
   açarsa kolon sızdırma riski geri gelir.
   ═══════════════════════════════════════════════════════════════ */

import { prisma } from "./prisma";
import { isoTarih } from "./hesap";
import { EGITMEN_ROLLERI, type Rol } from "./sabitler";
import { ROL_ETIKETLERI } from "./navigasyon";
import {
  KOC_ODEME_ALANLARI,
  OGRENCI_ODEME_ALANLARI,
  kocDurumu,
  ogrenciDurumu,
  platformPayi,
  yontemi,
  type KocOdemeSatiri,
  type OgrenciOdemeSatiri,
  type YoneticiOdemeSatiri,
} from "./odeme";

/**
 * Öğrencinin KENDİ ödemeleri ve ödeme geçmişi (en yeni önce).
 * Öğretmen payı / platform payı bu sorguya hiç girmez.
 */
export async function ogrenciOdemeleri(ogrenciId: string): Promise<OgrenciOdemeSatiri[]> {
  const satirlar = await prisma.odeme.findMany({
    where: { ogrenciId },
    orderBy: [{ tarih: "desc" }, { olusturma: "desc" }],
    select: OGRENCI_ODEME_ALANLARI,
  });
  return satirlar.map((s) => ({
    id: s.id,
    tarih: isoTarih(s.tarih),
    aciklama: s.aciklama,
    tutar: s.ogrenciTutar,
    durum: ogrenciDurumu(s.ogrenciDurum),
    odemeTarihi: isoTarih(s.ogrenciOdemeTarihi),
    yontem: yontemi(s.yontem),
  }));
}

/**
 * Öğretmene YAPILACAK ödemeler (en yeni önce).
 * Öğrenciden yalnız AD gelir (kimin için ödeme aldığı görünsün diye);
 * öğrencinin platforma ödediği tutar, tahsilat durumu ve komisyon
 * çekilmez. Payı sıfır olan kalem öğretmen listesine girmez.
 */
export async function kocOdemeleri(kocId: string): Promise<KocOdemeSatiri[]> {
  const satirlar = await prisma.odeme.findMany({
    where: { kocId, kocTutar: { gt: 0 } },
    orderBy: [{ tarih: "desc" }, { olusturma: "desc" }],
    select: KOC_ODEME_ALANLARI,
  });
  return satirlar.map((s) => ({
    id: s.id,
    tarih: isoTarih(s.tarih),
    ogrenciAd: s.ogrenci.ad,
    aciklama: s.aciklama,
    tutar: s.kocTutar,
    durum: kocDurumu(s.kocDurum),
    odemeTarihi: isoTarih(s.kocOdemeTarihi),
  }));
}

/**
 * Yöneticinin tam finansal görünümü: her iki bacak + platform payı.
 * YALNIZ yönetici çağırmalıdır (çağıran sayfa/eylem rolü doğrular).
 * Süzme istemcide yapılır (bkz. admin/odemeler/OdemeYonetimi.tsx); kayıt
 * sayısı kurum ölçeğinde kaldığı için sayfalama yoktur.
 */
export async function yoneticiOdemeleri(): Promise<YoneticiOdemeSatiri[]> {
  const satirlar = await prisma.odeme.findMany({
    orderBy: [{ tarih: "desc" }, { olusturma: "desc" }],
    include: {
      ogrenci: { select: { id: true, ad: true } },
      koc: { select: { id: true, ad: true } },
    },
  });
  return satirlar.map((s) => ({
    id: s.id,
    tarih: isoTarih(s.tarih),
    aciklama: s.aciklama,
    ogrenciId: s.ogrenciId,
    ogrenciAd: s.ogrenci.ad,
    kocId: s.kocId ?? "",
    kocAd: s.koc?.ad ?? "",
    ogrenciTutar: s.ogrenciTutar,
    ogrenciDurum: ogrenciDurumu(s.ogrenciDurum),
    ogrenciOdemeTarihi: isoTarih(s.ogrenciOdemeTarihi),
    yontem: yontemi(s.yontem),
    kocTutar: s.kocTutar,
    kocDurum: kocDurumu(s.kocDurum),
    kocOdemeTarihi: isoTarih(s.kocOdemeTarihi),
    platformTutar: platformPayi(s),
    yoneticiNotu: s.yoneticiNotu,
  }));
}

/** Yönetici formundaki taraf seçicileri (aktif hesaplar) */
export async function odemeTaraflari() {
  const [ogrenciler, koclar] = await Promise.all([
    prisma.kullanici.findMany({
      where: { rol: "ogrenci", aktif: true },
      orderBy: { ad: "asc" },
      select: { id: true, ad: true, sinif: true },
    }),
    // Öğretmen bacağı: koç ve öğretmen ayrı roller, ikisi de ödeme alabilir
    prisma.kullanici.findMany({
      where: { rol: { in: [...EGITMEN_ROLLERI] }, aktif: true },
      orderBy: [{ rol: "asc" }, { ad: "asc" }],
      select: { id: true, ad: true, rol: true, brans: true },
    }),
  ]);
  return {
    ogrenciler: ogrenciler.map((o) => ({ id: o.id, ad: o.ad, alt: o.sinif ?? "" })),
    // Alt bilgide rol açıkça yazılır ki koç ile öğretmen seçicide karışmasın
    koclar: koclar.map((k) => ({
      id: k.id,
      ad: k.ad,
      alt: [ROL_ETIKETLERI[k.rol as Rol] ?? k.rol, k.brans].filter(Boolean).join(" · "),
    })),
  };
}
