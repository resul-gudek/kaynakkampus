import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { aktifKullanici } from "@/lib/oturum";
import { prisma } from "@/lib/prisma";
import SiniflarPaneli, { type SinifGorunum } from "./SiniflarPaneli";

export const metadata: Metadata = { title: "Online Sınıflar – Kaynak Akademi" };

function sinifGorunumu(
  sinif: Awaited<ReturnType<typeof kocSiniflariniGetir>>[number] | Awaited<ReturnType<typeof ogrenciSiniflariniGetir>>[number]["sinif"]
): SinifGorunum {
  return {
    id: sinif.id,
    ad: sinif.ad,
    ders: sinif.ders,
    seviye: sinif.seviye,
    aciklama: sinif.aciklama,
    kapasite: sinif.kapasite,
    aktif: sinif.aktif,
    ogretmenAd: sinif.ogretmen.ad,
    uyeler: sinif.uyeler.map((uye) => ({
      id: uye.kullanici.id,
      ad: uye.kullanici.ad,
      sinif: uye.kullanici.sinif ?? "",
    })),
    oturumlar: sinif.oturumlar.map((oturum) => ({
      id: oturum.id,
      baslik: oturum.baslik,
      konu: oturum.konu,
      baslangic: oturum.baslangic.toISOString(),
      sure: oturum.sure,
      durum: oturum.durum,
      kayitEtkin: oturum.kayitEtkin,
    })),
  };
}

function kocSiniflariniGetir(kocId: string) {
  return prisma.onlineSinif.findMany({
    where: { ogretmenId: kocId },
    orderBy: [{ aktif: "desc" }, { olusturma: "desc" }],
    include: {
      ogretmen: { select: { ad: true } },
      uyeler: {
        orderBy: { kullanici: { ad: "asc" } },
        include: { kullanici: { select: { id: true, ad: true, sinif: true } } },
      },
      oturumlar: { orderBy: { baslangic: "asc" } },
    },
  });
}

function ogrenciSiniflariniGetir(ogrenciId: string) {
  return prisma.onlineSinifUye.findMany({
    where: { kullaniciId: ogrenciId, sinif: { aktif: true } },
    orderBy: { katilma: "desc" },
    include: {
      sinif: {
        include: {
          ogretmen: { select: { ad: true } },
          uyeler: {
            orderBy: { kullanici: { ad: "asc" } },
            include: { kullanici: { select: { id: true, ad: true, sinif: true } } },
          },
          oturumlar: { orderBy: { baslangic: "asc" } },
        },
      },
    },
  });
}

export default async function SiniflarSayfasi() {
  const kullanici = await aktifKullanici();
  if (!["koc", "ogrenci"].includes(kullanici.rol)) redirect("/admin");

  if (kullanici.rol === "koc") {
    const [siniflar, ogrenciler] = await Promise.all([
      kocSiniflariniGetir(kullanici.id),
      prisma.kullanici.findMany({
        where: { rol: "ogrenci", aktif: true, kocId: kullanici.id },
        orderBy: { ad: "asc" },
        select: { id: true, ad: true, sinif: true },
      }),
    ]);
    return (
      <SiniflarPaneli
        rol="koc"
        siniflar={siniflar.map(sinifGorunumu)}
        ogrenciler={ogrenciler.map((o) => ({ id: o.id, ad: o.ad, sinif: o.sinif ?? "" }))}
      />
    );
  }

  const uyelikler = await ogrenciSiniflariniGetir(kullanici.id);
  return <SiniflarPaneli rol="ogrenci" siniflar={uyelikler.map((u) => sinifGorunumu(u.sinif))} ogrenciler={[]} />;
}
