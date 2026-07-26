import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { cevaplariAyristir, seceneklerAyristir, zamanMetni } from "@/lib/sureli-test";
import { suresiGecenleriKapat } from "@/lib/sureli-test-sunucu";
import TestCozum from "@/components/sureli-test/TestCozum";
import TestSonuc from "@/components/sureli-test/TestSonuc";
import type { CozumSoru, SonucSoru } from "@/components/sureli-test/tipler";

export const metadata: Metadata = { title: "Süreli Test – Kaynak Kampüs" };

/* Test çözüm / sonuç ekranı. [id] = SureliTestOturum.id
   Oturum sürüyorsa çözüm ekranı, kapandıysa sonuç ekranı gösterilir.
   Doğru cevaplar YALNIZ kapanmış oturumda okunur (aşağıdaki iki ayrı sorgu). */
export default async function TestOturumSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ogrenci = await aktifKullanici("ogrenci");
  const { id } = await params;

  // Süresi geçmişse önce kapat; ardından okunan durum nihai durumdur
  await suresiGecenleriKapat({ id, ogrenciId: ogrenci.id });

  const oturum = await prisma.sureliTestOturum.findUnique({
    where: { id },
    include: {
      test: { select: { id: true, ad: true, ders: true, konu: true, sure: true, soruSayisi: true } },
    },
  });
  if (!oturum || oturum.ogrenciId !== ogrenci.id) notFound();

  /* ── Test sürüyor: sorular doğru cevap OLMADAN çekilir ── */
  if (oturum.durum === "basladi") {
    const sorular = await prisma.sureliTestSoru.findMany({
      where: { testId: oturum.testId },
      orderBy: { sira: "asc" },
      select: { id: true, sira: true, metin: true, secenekler: true },
    });
    const cozumSorulari: CozumSoru[] = sorular.map((s) => ({
      id: s.id,
      sira: s.sira,
      metin: s.metin,
      secenekler: seceneklerAyristir(s.secenekler),
    }));

    return (
      <main className="container">
        <TestCozum
          oturum={{
            id: oturum.id,
            testAd: oturum.test.ad,
            ders: oturum.test.ders,
            konu: oturum.test.konu,
            sure: oturum.test.sure,
            bitisSiniri: oturum.bitisSiniri.toISOString(),
            cevaplar: cevaplariAyristir(oturum.cevaplar),
          }}
          sorular={cozumSorulari}
        />
      </main>
    );
  }

  /* ── Test kapandı: sonuç + cevap incelemesi ── */
  const sorular = await prisma.sureliTestSoru.findMany({
    where: { testId: oturum.testId },
    orderBy: { sira: "asc" },
  });
  const verilen = cevaplariAyristir(oturum.cevaplar);
  const sonucSorulari: SonucSoru[] = sorular.map((s) => ({
    id: s.id,
    sira: s.sira,
    metin: s.metin,
    secenekler: seceneklerAyristir(s.secenekler),
    dogru: s.dogru,
    verilen: verilen[s.id] ?? "",
  }));

  return (
    <main className="container">
      <TestSonuc
        baslik={oturum.test.ad}
        altBaslik={oturum.test.ders + (oturum.test.konu ? ` – ${oturum.test.konu}` : "")}
        soruSayisi={oturum.test.soruSayisi}
        sure={oturum.test.sure}
        sonuc={{
          dogru: oturum.dogru,
          yanlis: oturum.yanlis,
          bos: oturum.bos,
          yuzde: oturum.yuzde,
          gecenSure: oturum.gecenSure ?? 0,
          durum: oturum.durum as "tamamlandi" | "sureDoldu",
          bitis: zamanMetni(oturum.bitis),
        }}
        sorular={sonucSorulari}
        geri={{ etiket: "← Süreli Testlerim", href: "/ogrenci/testler" }}
      />
    </main>
  );
}
