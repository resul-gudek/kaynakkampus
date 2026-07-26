import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { isoTarih } from "@/lib/hesap";
import { zamanMetni } from "@/lib/sureli-test";
import { suresiGecenleriKapat } from "@/lib/sureli-test-sunucu";
import TestYonetim from "@/components/sureli-test/TestYonetim";
import TestSonuclari from "@/components/sureli-test/TestSonuclari";
import type {
  KocSonucS,
  KocTestS,
  OgrenciSecenek,
} from "@/components/sureli-test/tipler";

export const metadata: Metadata = { title: "Süreli Testler – Kaynak Kampüs" };

export default async function KocTestlerSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ kayit?: string }>;
}) {
  const koc = await aktifKullanici("koc");
  const sp = await searchParams;

  // Terk edilmiş oturumlar sonuca dönüşsün (öğretmen nihai tabloyu görsün)
  await suresiGecenleriKapat({ test: { kocId: koc.id } });

  const [testler, ogrenciler] = await Promise.all([
    prisma.sureliTest.findMany({
      where: { kocId: koc.id },
      orderBy: { olusturma: "desc" },
      include: {
        atamalar: {
          orderBy: { olusturma: "asc" },
          include: { ogrenci: { select: { id: true, ad: true } } },
        },
        oturumlar: {
          orderBy: { baslangic: "desc" },
          include: { ogrenci: { select: { id: true, ad: true } } },
        },
      },
    }),
    prisma.kullanici.findMany({
      where: { rol: "ogrenci", kocId: koc.id },
      orderBy: { ad: "asc" },
      select: { id: true, ad: true, sinif: true },
    }),
  ]);

  const bankaListesi: KocTestS[] = testler.map((t) => ({
    id: t.id,
    ad: t.ad,
    ders: t.ders,
    konu: t.konu,
    seviye: t.seviye,
    soruSayisi: t.soruSayisi,
    sure: t.sure,
    aktif: t.aktif,
    cozenSayisi: t.oturumlar.filter((o) => o.durum !== "basladi").length,
    atamalar: t.atamalar.map((a) => {
      const oturum =
        t.oturumlar.find((o) => o.ogrenciId === a.ogrenciId && o.durum !== "basladi") ??
        t.oturumlar.find((o) => o.ogrenciId === a.ogrenciId);
      return {
        id: a.id,
        ogrenciId: a.ogrenciId,
        ogrenciAd: a.ogrenci.ad,
        sonTarih: isoTarih(a.sonTarih),
        durum: (oturum?.durum ?? "") as KocTestS["atamalar"][number]["durum"],
      };
    }),
  }));

  /* Sonuç tablosu: en yeni çözüm üstte, süren oturumlar da görünür */
  const sonuclar: KocSonucS[] = testler
    .flatMap((t) => t.oturumlar.map((o) => ({ test: t, oturum: o })))
    .sort(
      (a, b) =>
        (b.oturum.bitis ?? b.oturum.baslangic).getTime() -
        (a.oturum.bitis ?? a.oturum.baslangic).getTime()
    )
    .map(({ test: t, oturum: o }) => ({
      oturumId: o.id,
      ogrenciId: o.ogrenciId,
      ogrenciAd: o.ogrenci.ad,
      testId: t.id,
      testAd: t.ad,
      ders: t.ders,
      konu: t.konu,
      soruSayisi: t.soruSayisi,
      sure: t.sure,
      durum: o.durum as KocSonucS["durum"],
      dogru: o.dogru,
      yanlis: o.yanlis,
      bos: o.bos,
      yuzde: o.yuzde,
      gecenSure: o.gecenSure ?? 0,
      bitis: zamanMetni(o.bitis),
    }));

  const ogrenciSecenekleri: OgrenciSecenek[] = ogrenciler.map((o) => ({
    id: o.id,
    ad: o.ad,
    sinif: o.sinif ?? "",
  }));

  return (
    <main className="container">
      <TestYonetim testler={bankaListesi} ogrenciler={ogrenciSecenekleri} />
      <TestSonuclari sonuclar={sonuclar} vurguId={sp.kayit} />
    </main>
  );
}
