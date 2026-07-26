/* Süreli test — DB'ye dokunan yardımcılar (yalnız sunucu).
   Saf kurallar src/lib/sureli-test.ts içindedir.

   Süre otoritesi burasıdır: bir oturum ancak bu dosyadaki oturumKapat ile
   puanlanıp kapanır. Öğrenci sekmeyi kapatıp bir daha dönmese bile, süresi
   geçen oturumlar sayfa yüklenirken suresiGecenleriKapat ile kapatılır —
   böylece sonuç hem öğrenciye hem öğretmene düşer. */

import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { bildirimEkle } from "./bildirim";
import { logcu } from "./log";
import {
  cevaplariAyristir,
  gecenSaniye,
  sureBitti,
  sureMetni,
  teslimKabul,
  testPuanla,
  type CevapHaritasi,
  type SoruSatir,
} from "./sureli-test";

const log = logcu("sureli-test");

/** Kapatma için gereken en az oturum alanları */
export interface KapanacakOturum {
  id: string;
  ogrenciId: string;
  baslangic: Date;
  bitisSiniri: Date;
  durum: string;
  cevaplar: string;
}

export interface KapatmaSonucu {
  durum: "tamamlandi" | "sureDoldu";
  dogru: number;
  yanlis: number;
  bos: number;
  yuzde: number;
  gecenSure: number;
}

interface KapatmaSecenekleri {
  /** Süre dolduğu için otomatik teslim (öğrenci "Testi Tamamla"ya basmadı) */
  otomatik: boolean;
  /** Teslimle birlikte gelen nihai cevaplar; süre + tolerans aşıldıysa yok sayılır */
  yeniCevaplar?: CevapHaritasi;
  /** Öğretmene bildirim için gösterim bilgileri */
  testAd: string;
  kocId: string;
  ogrenciAd: string;
  simdi?: Date;
}

/**
 * Oturumu puanlar, kapatır ve öğretmene sonuç bildirimi düşer.
 * Süre aşıldıysa durum "sureDoldu" olur ve bitiş anı süre sınırına çekilir
 * (geç kapatma, tamamlama süresini şişirmesin).
 */
export async function oturumKapat(
  oturum: KapanacakOturum,
  sorular: SoruSatir[],
  secenekler: KapatmaSecenekleri
): Promise<KapatmaSonucu> {
  const simdi = secenekler.simdi ?? new Date();
  const sureAsildi = sureBitti(oturum.bitisSiniri, simdi);

  // Süre + tolerans içinde gelen teslim nihai cevap kümesidir; sonrasında
  // yalnız çözüm sırasında kaydedilmiş cevaplar puanlanır.
  const cevaplar =
    secenekler.yeniCevaplar && teslimKabul(oturum.bitisSiniri, simdi)
      ? secenekler.yeniCevaplar
      : cevaplariAyristir(oturum.cevaplar);

  const sonuc = testPuanla(sorular, cevaplar);
  const durum: "tamamlandi" | "sureDoldu" =
    secenekler.otomatik || sureAsildi ? "sureDoldu" : "tamamlandi";
  const bitis = sureAsildi ? oturum.bitisSiniri : simdi;
  const gecenSure = gecenSaniye(oturum.baslangic, bitis);

  await prisma.$transaction(async (tx) => {
    // Yarış koruması: yalnız hâlâ açık olan oturum kapatılır (çift bildirim olmasın)
    const guncellenen = await tx.sureliTestOturum.updateMany({
      where: { id: oturum.id, durum: "basladi" },
      data: {
        durum,
        bitis,
        gecenSure,
        dogru: sonuc.dogru,
        yanlis: sonuc.yanlis,
        bos: sonuc.bos,
        yuzde: sonuc.yuzde,
        cevaplar: JSON.stringify(cevaplar),
      },
    });
    if (guncellenen.count === 0) return;

    await bildirimEkle(
      tx,
      secenekler.kocId,
      durum === "sureDoldu" ? "⏰" : "🧪",
      `${secenekler.ogrenciAd} "${secenekler.testAd}" testini ${
        durum === "sureDoldu" ? "süre dolduğunda tamamladı" : "tamamladı"
      }: ${sonuc.dogru} doğru · ${sonuc.yanlis} yanlış · ${sonuc.bos} boş · %${sonuc.yuzde} · ${sureMetni(gecenSure)}`,
      { tur: "test", ogrenciId: oturum.ogrenciId, kayitId: oturum.id }
    );
  });

  return { durum, ...sonuc, gecenSure };
}

/**
 * Süresi geçmiş ama hâlâ "basladi" duran oturumları kapatır.
 * Öğrenci ve öğretmen sayfaları render'dan önce çağırır; bu sayede
 * terk edilmiş oturumlar da sonuca dönüşür.
 */
export async function suresiGecenleriKapat(kosul: Prisma.SureliTestOturumWhereInput): Promise<number> {
  try {
    const acikOturumlar = await prisma.sureliTestOturum.findMany({
      where: { ...kosul, durum: "basladi", bitisSiniri: { lt: new Date() } },
      include: {
        test: { select: { ad: true, kocId: true, sorular: { select: { id: true, sira: true, dogru: true } } } },
        ogrenci: { select: { ad: true } },
      },
    });
    for (const o of acikOturumlar) {
      await oturumKapat(o, o.test.sorular, {
        otomatik: true,
        testAd: o.test.ad,
        kocId: o.test.kocId,
        ogrenciAd: o.ogrenci.ad,
      });
    }
    return acikOturumlar.length;
  } catch (e) {
    // Sayfa render'ı sırasında çağrılır; hata sayfayı düşürmesin
    log.error({ hata: e instanceof Error ? e.message : String(e) }, "süresi geçen oturumlar kapatılamadı");
    return 0;
  }
}
