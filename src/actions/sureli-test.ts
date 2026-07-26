"use server";

/* ⏱️ Süreli testler.
   Öğretmen tarafı: test oluştur / sil / öğrenciye ata / atamayı kaldır / sonucu sil.
   Öğrenci tarafı: testi başlat, cevapları kaydet, testi tamamla.

   Güvenlik notları:
   · Doğru cevaplar bu dosyanın dışına (istemciye) yalnız test kapandıktan
     sonra çıkar; çözüm sırasında sayfa yalnızca soru + seçenekleri alır.
   · Süre sunucuda tutulur (SureliTestOturum.bitisSiniri). İstemci sayacı
     yalnız gösterimdir; kabul/puanlama kararı sureli-test-sunucu.ts'tedir. */

import { prisma } from "@/lib/prisma";
import { bildirimEkle } from "@/lib/bildirim";
import { tarihNesnesi, tarihStr } from "@/lib/hesap";
import { SureliTestSemasi, TestAtamaSemasi, TestCevapSemasi } from "@/lib/dogrulama";
import { bitisSiniriHesapla, sureBitti, sureEtiketi } from "@/lib/sureli-test";
import { oturumKapat } from "@/lib/sureli-test-sunucu";
import { denetim } from "@/lib/log";
import { oturumGerekli, panelleriTazele, hataMetni, type EylemSonuc } from "./yardimci";

/* ── Öğretmen ──────────────────────────────────────────────── */

/** Testi soruları ve (seçilmişse) ilk atamalarıyla birlikte oluşturur. */
export async function testOlustur(girdi: unknown): Promise<EylemSonuc & { testId?: string }> {
  try {
    const koc = await oturumGerekli("koc");
    const veri = SureliTestSemasi.parse(girdi);

    const ogrenciler = veri.ogrenciIdler.length
      ? await prisma.kullanici.findMany({
          where: { id: { in: veri.ogrenciIdler }, rol: "ogrenci", kocId: koc.id },
          select: { id: true },
        })
      : [];
    if (ogrenciler.length !== veri.ogrenciIdler.length) {
      return { hata: "Seçilen öğrencilerden biri size atanmış değil." };
    }

    let testId = "";
    await prisma.$transaction(async (tx) => {
      const test = await tx.sureliTest.create({
        data: {
          kocId: koc.id,
          ad: veri.ad,
          ders: veri.ders,
          konu: veri.konu,
          seviye: veri.seviye,
          soruSayisi: veri.soruSayisi,
          sure: veri.sure,
        },
      });
      await tx.sureliTestSoru.createMany({
        data: veri.sorular.map((s, i) => ({
          testId: test.id,
          sira: i + 1,
          metin: s.metin,
          secenekler: JSON.stringify(s.secenekler),
          dogru: s.dogru,
        })),
      });
      const sonTarih = veri.sonTarih ? tarihNesnesi(veri.sonTarih) : null;
      for (const o of ogrenciler) {
        await tx.sureliTestAtama.create({
          data: { testId: test.id, ogrenciId: o.id, sonTarih },
        });
        await bildirimEkle(
          tx,
          o.id,
          "⏱️",
          `Yeni süreli test: ${test.ad} · ${test.soruSayisi} soru · ${sureEtiketi(test.sure)}` +
            (sonTarih ? ` · Son tarih: ${tarihStr(sonTarih)}` : ""),
          { tur: "test", ogrenciId: o.id, kayitId: test.id }
        );
      }
      testId = test.id;
    });

    denetim("test.olustur", koc, {
      testId,
      ad: veri.ad,
      soruSayisi: veri.soruSayisi,
      sure: veri.sure,
      atanan: ogrenciler.length,
    });
    panelleriTazele();
    return { tamam: true, testId };
  } catch (e) {
    return { hata: hataMetni(e, "test.olustur") };
  }
}

export async function testSil(id: string): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const test = await prisma.sureliTest.findUnique({ where: { id } });
    if (!test || test.kocId !== koc.id) return { hata: "Test bulunamadı." };
    // Soru / atama / oturum satırları FK cascade ile gider
    await prisma.sureliTest.delete({ where: { id } });
    denetim("test.sil", koc, { testId: id, ad: test.ad });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "test.sil") };
  }
}

/** Testi pasife alır / yeniden yayına açar (pasif test öğrencide görünmez). */
export async function testAktiflik(id: string, aktif: boolean): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const test = await prisma.sureliTest.findUnique({ where: { id } });
    if (!test || test.kocId !== koc.id) return { hata: "Test bulunamadı." };
    await prisma.sureliTest.update({ where: { id }, data: { aktif } });
    denetim("test.aktiflik", koc, { testId: id, aktif });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "test.aktiflik") };
  }
}

/** Testi bir veya birkaç öğrenciye atar; zaten atanmış olanlar atlanır. */
export async function testAta(girdi: unknown): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const veri = TestAtamaSemasi.parse(girdi);

    const test = await prisma.sureliTest.findUnique({
      where: { id: veri.testId },
      include: { atamalar: { select: { ogrenciId: true } } },
    });
    if (!test || test.kocId !== koc.id) return { hata: "Test bulunamadı." };

    const ogrenciler = await prisma.kullanici.findMany({
      where: { id: { in: veri.ogrenciIdler }, rol: "ogrenci", kocId: koc.id },
      select: { id: true },
    });
    if (ogrenciler.length !== veri.ogrenciIdler.length) {
      return { hata: "Seçilen öğrencilerden biri size atanmış değil." };
    }
    const mevcut = new Set(test.atamalar.map((a) => a.ogrenciId));
    const yeniler = ogrenciler.filter((o) => !mevcut.has(o.id));
    if (!yeniler.length) return { hata: "Seçilen öğrencilere bu test zaten atanmış." };

    const sonTarih = veri.sonTarih ? tarihNesnesi(veri.sonTarih) : null;
    await prisma.$transaction(async (tx) => {
      for (const o of yeniler) {
        await tx.sureliTestAtama.create({ data: { testId: test.id, ogrenciId: o.id, sonTarih } });
        await bildirimEkle(
          tx,
          o.id,
          "⏱️",
          `Yeni süreli test: ${test.ad} · ${test.soruSayisi} soru · ${sureEtiketi(test.sure)}` +
            (sonTarih ? ` · Son tarih: ${tarihStr(sonTarih)}` : ""),
          { tur: "test", ogrenciId: o.id, kayitId: test.id }
        );
      }
    });

    denetim("test.ata", koc, { testId: test.id, adet: yeniler.length });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "test.ata") };
  }
}

/** Atamayı kaldırır. Öğrencinin çözüm kayıtları (oturumlar) korunur. */
export async function testAtamaSil(atamaId: string): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const atama = await prisma.sureliTestAtama.findUnique({
      where: { id: atamaId },
      include: { test: { select: { id: true, kocId: true } } },
    });
    if (!atama || atama.test.kocId !== koc.id) return { hata: "Atama bulunamadı." };
    await prisma.sureliTestAtama.delete({ where: { id: atamaId } });
    denetim("test.atamaSil", koc, { testId: atama.test.id, ogrenciId: atama.ogrenciId });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "test.atamaSil") };
  }
}

/** Sonucu siler — öğrenci testi yeniden çözebilir hâle gelir. */
export async function testSonucSil(oturumId: string): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const oturum = await prisma.sureliTestOturum.findUnique({
      where: { id: oturumId },
      include: { test: { select: { id: true, kocId: true } } },
    });
    if (!oturum || oturum.test.kocId !== koc.id) return { hata: "Test sonucu bulunamadı." };
    await prisma.sureliTestOturum.delete({ where: { id: oturumId } });
    denetim("test.sonucSil", koc, {
      testId: oturum.test.id,
      ogrenciId: oturum.ogrenciId,
      oturumId,
    });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "test.sonucSil") };
  }
}

/* ── Öğrenci ───────────────────────────────────────────────── */

/**
 * Testi başlatır ve oturum kimliğini döner.
 * · Yarım kalmış (süresi geçmemiş) oturum varsa ona devam edilir.
 * · Tamamlanmış oturum varsa test yeniden çözülemez (öğretmen sonucu silerse açılır).
 */
export async function testBaslat(testId: string): Promise<EylemSonuc & { oturumId?: string }> {
  try {
    const ogrenci = await oturumGerekli("ogrenci");

    const atama = await prisma.sureliTestAtama.findUnique({
      where: { testId_ogrenciId: { testId, ogrenciId: ogrenci.id } },
      include: { test: { select: { id: true, ad: true, sure: true, aktif: true, soruSayisi: true } } },
    });
    if (!atama) return { hata: "Bu test size atanmamış." };
    if (!atama.test.aktif) return { hata: "Bu test şu anda çözüme kapalı." };
    if (atama.test.soruSayisi === 0) return { hata: "Bu testin soruları henüz hazır değil." };

    const oturumlar = await prisma.sureliTestOturum.findMany({
      where: { testId, ogrenciId: ogrenci.id },
      orderBy: { baslangic: "desc" },
    });
    if (oturumlar.some((o) => o.durum !== "basladi")) {
      return { hata: "Bu testi zaten çözdün. Sonucunu test listenden görebilirsin." };
    }
    // Süresi geçmemiş yarım oturum → devam
    const acik = oturumlar.find((o) => o.durum === "basladi" && !sureBitti(o.bitisSiniri));
    if (acik) return { tamam: true, oturumId: acik.id };
    // Süresi geçmiş yarım oturum varsa suresiGecenleriKapat kapatır; burada
    // yeni oturum açmak yerine kullanıcıyı listeye döndürmek yeterli.
    if (oturumlar.length) {
      return { hata: "Bu testin süresi doldu. Sonucunu test listenden görebilirsin." };
    }

    const baslangic = new Date();
    const oturum = await prisma.sureliTestOturum.create({
      data: {
        testId,
        ogrenciId: ogrenci.id,
        baslangic,
        bitisSiniri: bitisSiniriHesapla(baslangic, atama.test.sure),
      },
    });

    denetim("test.baslat", ogrenci, { testId, oturumId: oturum.id, sure: atama.test.sure });
    return { tamam: true, oturumId: oturum.id };
  } catch (e) {
    return { hata: hataMetni(e, "test.baslat") };
  }
}

/**
 * Çözüm sırasında cevapları kaydeder (istemci değişiklikleri geciktirerek yollar).
 * Sekme kapanırsa süre dolduğunda bu cevaplar puanlanır.
 */
export async function testCevapKaydet(oturumId: string, cevaplar: unknown): Promise<EylemSonuc> {
  try {
    const ogrenci = await oturumGerekli("ogrenci");
    const gelen = TestCevapSemasi.parse(cevaplar);

    const oturum = await prisma.sureliTestOturum.findUnique({
      where: { id: oturumId },
      select: { id: true, ogrenciId: true, durum: true, bitisSiniri: true, testId: true },
    });
    if (!oturum) return { hata: "Test oturumu bulunamadı." };
    if (oturum.ogrenciId !== ogrenci.id) return { hata: "Bu test üzerinde yetkiniz yok." };
    if (oturum.durum !== "basladi") return { hata: "Bu test kapandı." };
    if (sureBitti(oturum.bitisSiniri)) return { hata: "Test süresi doldu." };

    // Yalnız bu testin sorularına ait cevaplar yazılır
    const sorular = await prisma.sureliTestSoru.findMany({
      where: { testId: oturum.testId },
      select: { id: true },
    });
    const gecerli = new Set(sorular.map((s) => s.id));
    const temiz = Object.fromEntries(
      Object.entries(gelen).filter(([soruId]) => gecerli.has(soruId))
    );

    await prisma.sureliTestOturum.updateMany({
      where: { id: oturumId, durum: "basladi" },
      data: { cevaplar: JSON.stringify(temiz) },
    });
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "test.cevapKaydet") };
  }
}

/**
 * Testi tamamlar ve puanlar. otomatik=true ise sayaç sıfırlandığı için
 * gönderilmiştir → sonuç "sureDoldu" olarak kaydedilir.
 */
export async function testTamamla(
  oturumId: string,
  cevaplar: unknown,
  otomatik = false
): Promise<EylemSonuc> {
  try {
    const ogrenci = await oturumGerekli("ogrenci");
    const gelen = TestCevapSemasi.parse(cevaplar);

    const oturum = await prisma.sureliTestOturum.findUnique({
      where: { id: oturumId },
      include: {
        test: {
          select: {
            id: true,
            ad: true,
            kocId: true,
            sorular: { select: { id: true, sira: true, dogru: true } },
          },
        },
        ogrenci: { select: { ad: true } },
      },
    });
    if (!oturum) return { hata: "Test oturumu bulunamadı." };
    if (oturum.ogrenciId !== ogrenci.id) return { hata: "Bu test üzerinde yetkiniz yok." };
    if (oturum.durum !== "basladi") return { tamam: true }; // zaten kapanmış (çift teslim)

    const gecerli = new Set(oturum.test.sorular.map((s) => s.id));
    const temiz = Object.fromEntries(
      Object.entries(gelen).filter(([soruId]) => gecerli.has(soruId))
    );

    const sonuc = await oturumKapat(oturum, oturum.test.sorular, {
      otomatik,
      yeniCevaplar: temiz,
      testAd: oturum.test.ad,
      kocId: oturum.test.kocId,
      ogrenciAd: oturum.ogrenci.ad,
    });

    denetim("test.tamamla", ogrenci, {
      testId: oturum.test.id,
      oturumId,
      durum: sonuc.durum,
      dogru: sonuc.dogru,
      yanlis: sonuc.yanlis,
      bos: sonuc.bos,
      yuzde: sonuc.yuzde,
      gecenSure: sonuc.gecenSure,
    });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "test.tamamla") };
  }
}

