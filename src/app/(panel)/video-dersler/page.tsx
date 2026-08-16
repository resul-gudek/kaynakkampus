import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { yetkiVar } from "@/lib/yetki";
import { yonetimFiltresi } from "@/lib/video-ders-sunucu";
import { ROL_ANASAYFA } from "@/lib/auth.config";
import { EGITMEN_ROLLERI, type Rol } from "@/lib/sabitler";
import VideoYonetim, { type VideoSatir, type Secenekler } from "./VideoYonetim";

export const metadata: Metadata = { title: "Video Dersler – Kaynak Kampüs" };

export default async function VideoDerslerSayfasi() {
  const kullanici = await aktifKullanici();
  const rol = kullanici.rol as Rol;
  if (!yetkiVar(rol, "video:yonet")) redirect(ROL_ANASAYFA[rol] ?? "/giris");
  const yonetici = yetkiVar(rol, "panel:admin");

  const [videolar, ogrenciler, siniflar, ogretmenler] = await Promise.all([
    prisma.videoDers.findMany({
      where: yonetimFiltresi(kullanici),
      orderBy: [{ tarih: "desc" }, { olusturma: "desc" }],
      select: {
        id: true,
        baslik: true,
        ders: true,
        konu: true,
        aciklama: true,
        islenenKonular: true,
        ogretmenNotu: true,
        tarih: true,
        sure: true,
        kaynakTur: true,
        adres: true,
        dosyaAd: true,
        dosyaYol: true,
        dosyaBoyut: true,
        kapakYol: true,
        durum: true,
        ogretmenId: true,
        ogretmen: { select: { ad: true } },
        ekler: {
          orderBy: { olusturma: "asc" },
          select: { id: true, ad: true, tur: true, boyut: true },
        },
        gorevler: { orderBy: { sira: "asc" }, select: { id: true, metin: true } },
        atamalar: { select: { ogrenciId: true, sinifId: true } },
        izlemeler: { select: { durum: true } },
      },
    }),
    // Koç yalnız kendi öğrencilerine ve kendi sınıflarına atama yapabilir
    prisma.kullanici.findMany({
      where: { rol: "ogrenci", aktif: true, ...(yonetici ? {} : { kocId: kullanici.id }) },
      orderBy: { ad: "asc" },
      select: { id: true, ad: true, sinif: true },
    }),
    prisma.onlineSinif.findMany({
      where: { aktif: true, ...(yonetici ? {} : { ogretmenId: kullanici.id }) },
      orderBy: { ad: "asc" },
      select: { id: true, ad: true, ders: true, _count: { select: { uyeler: true } } },
    }),
    yonetici
      ? prisma.kullanici.findMany({
          // Yönetici video'yu koç ya da öğretmen adına yükleyebilir
          where: { rol: { in: [...EGITMEN_ROLLERI] }, aktif: true },
          orderBy: { ad: "asc" },
          select: { id: true, ad: true, brans: true },
        })
      : Promise.resolve([]),
  ]);

  const satirlar: VideoSatir[] = videolar.map((v) => ({
    id: v.id,
    baslik: v.baslik,
    ders: v.ders,
    konu: v.konu,
    aciklama: v.aciklama,
    islenenKonular: v.islenenKonular,
    ogretmenNotu: v.ogretmenNotu,
    tarih: v.tarih.toISOString().slice(0, 10),
    sure: v.sure,
    kaynakTur: v.kaynakTur,
    adres: v.adres,
    dosyaAd: v.dosyaAd,
    dosyaVar: !!v.dosyaYol,
    dosyaBoyut: v.dosyaBoyut,
    kapakVar: !!v.kapakYol,
    durum: v.durum,
    ogretmenId: v.ogretmenId,
    ogretmenAd: v.ogretmen.ad,
    ekler: v.ekler,
    gorevler: v.gorevler.map((g) => g.metin),
    ogrenciIdler: v.atamalar.map((a) => a.ogrenciId).filter((x): x is string => !!x),
    sinifIdler: v.atamalar.map((a) => a.sinifId).filter((x): x is string => !!x),
    izlemeOzeti: {
      izleyen: v.izlemeler.filter((i) => i.durum !== "izlenmedi").length,
      tamamlayan: v.izlemeler.filter((i) => i.durum === "tamamlandi").length,
    },
  }));

  const secenekler: Secenekler = {
    ogrenciler: ogrenciler.map((o) => ({ id: o.id, ad: o.ad, sinif: o.sinif ?? "" })),
    siniflar: siniflar.map((x) => ({
      id: x.id,
      ad: x.ad,
      ders: x.ders,
      uyeSayisi: x._count.uyeler,
    })),
    ogretmenler: ogretmenler.map((o) => ({ id: o.id, ad: o.ad, brans: o.brans ?? "" })),
  };

  return (
    <VideoYonetim
      yonetici={yonetici}
      kendiId={kullanici.id}
      videolar={satirlar}
      secenekler={secenekler}
    />
  );
}
