import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { ogrenciListeFiltresi } from "@/lib/video-ders-sunucu";
import { izlemeDurumu } from "@/lib/video-ders";
import VideoListesi, { type VideoKart } from "./VideoListesi";

export const metadata: Metadata = { title: "Video Derslerim – Kaynak Kampüs" };

export default async function VideolarSayfasi() {
  const ogrenci = await aktifKullanici("ogrenci");

  const videolar = await prisma.videoDers.findMany({
    where: await ogrenciListeFiltresi(ogrenci.id),
    orderBy: [{ tarih: "desc" }, { olusturma: "desc" }],
    select: {
      id: true,
      baslik: true,
      ders: true,
      konu: true,
      aciklama: true,
      tarih: true,
      sure: true,
      kapakYol: true,
      ogretmen: { select: { ad: true } },
      izlemeler: {
        where: { ogrenciId: ogrenci.id },
        select: { durum: true, yuzde: true, saniye: true },
      },
      _count: { select: { ekler: true, gorevler: true } },
    },
  });

  const kartlar: VideoKart[] = videolar.map((v) => {
    const izleme = v.izlemeler[0] ?? null;
    return {
      id: v.id,
      baslik: v.baslik,
      ders: v.ders,
      konu: v.konu,
      aciklama: v.aciklama,
      ogretmenAd: v.ogretmen.ad,
      tarih: v.tarih.toISOString().slice(0, 10),
      sure: v.sure,
      kapakVar: !!v.kapakYol,
      ekSayisi: v._count.ekler,
      gorevSayisi: v._count.gorevler,
      izlemeDurum: izlemeDurumu(izleme),
      yuzde: izleme?.yuzde ?? 0,
    };
  });

  return <VideoListesi videolar={kartlar} />;
}
