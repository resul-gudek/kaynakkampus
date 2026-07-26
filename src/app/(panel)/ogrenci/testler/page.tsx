import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { isoTarih } from "@/lib/hesap";
import { zamanMetni } from "@/lib/sureli-test";
import { suresiGecenleriKapat } from "@/lib/sureli-test-sunucu";
import TestListesi from "@/components/sureli-test/TestListesi";
import type { TestKarti } from "@/components/sureli-test/tipler";

export const metadata: Metadata = { title: "Süreli Testlerim – Kaynak Kampüs" };

export default async function TestlerSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ kayit?: string }>;
}) {
  const ogrenci = await aktifKullanici("ogrenci");
  const sp = await searchParams;

  // Sekmesi kapanmış / süresi geçmiş oturumlar önce sonuca dönüştürülür
  await suresiGecenleriKapat({ ogrenciId: ogrenci.id });

  const atamalar = await prisma.sureliTestAtama.findMany({
    where: { ogrenciId: ogrenci.id, test: { aktif: true } },
    orderBy: { olusturma: "desc" },
    include: {
      test: {
        select: {
          id: true,
          ad: true,
          ders: true,
          konu: true,
          seviye: true,
          soruSayisi: true,
          sure: true,
          koc: { select: { ad: true } },
          oturumlar: {
            where: { ogrenciId: ogrenci.id },
            orderBy: { baslangic: "desc" },
          },
        },
      },
    },
  });

  const testler: TestKarti[] = atamalar.map((a) => {
    // Kapanmış oturum varsa sonuç odur; yoksa süren oturum gösterilir
    const kapali = a.test.oturumlar.find((o) => o.durum !== "basladi");
    const suren = a.test.oturumlar.find((o) => o.durum === "basladi");
    const oturum = kapali ?? suren ?? null;
    return {
      testId: a.test.id,
      ad: a.test.ad,
      ders: a.test.ders,
      konu: a.test.konu,
      seviye: a.test.seviye,
      soruSayisi: a.test.soruSayisi,
      sure: a.test.sure,
      sonTarih: isoTarih(a.sonTarih),
      ogretmenAd: a.test.koc.ad,
      oturumId: oturum?.id ?? "",
      durum: (oturum?.durum ?? "") as TestKarti["durum"],
      sonuc:
        kapali && kapali.durum !== "basladi"
          ? {
              dogru: kapali.dogru,
              yanlis: kapali.yanlis,
              bos: kapali.bos,
              yuzde: kapali.yuzde,
              gecenSure: kapali.gecenSure ?? 0,
              durum: kapali.durum as "tamamlandi" | "sureDoldu",
              bitis: zamanMetni(kapali.bitis),
            }
          : null,
    };
  });

  return (
    <main className="container">
      <TestListesi testler={testler} vurguId={sp.kayit} />
    </main>
  );
}
