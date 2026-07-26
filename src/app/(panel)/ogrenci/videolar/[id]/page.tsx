import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { ogrenciDetayFiltresi } from "@/lib/video-ders-sunucu";
import { izlemeDurumu, videoKaynagi } from "@/lib/video-ders";
import VideoDetay from "./VideoDetay";

export const metadata: Metadata = { title: "Video Ders – Kaynak Kampüs" };

export default async function VideoDetaySayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ogrenci = await aktifKullanici("ogrenci");

  // Erişim filtresi sorgunun içindedir: atanmamış/taslak video "bulunamadı"dır
  const video = await prisma.videoDers.findFirst({
    where: await ogrenciDetayFiltresi(ogrenci.id, id),
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
      dosyaYol: true,
      ogretmen: { select: { ad: true, brans: true } },
      ekler: {
        orderBy: { olusturma: "asc" },
        select: { id: true, ad: true, tur: true, boyut: true },
      },
      gorevler: { orderBy: { sira: "asc" }, select: { id: true, metin: true } },
      izlemeler: {
        where: { ogrenciId: ogrenci.id },
        select: { durum: true, yuzde: true, saniye: true, notlar: true },
      },
    },
  });
  if (!video) notFound();

  const izleme = video.izlemeler[0] ?? null;

  return (
    <VideoDetay
      video={{
        id: video.id,
        baslik: video.baslik,
        ders: video.ders,
        konu: video.konu,
        aciklama: video.aciklama,
        islenenKonular: video.islenenKonular,
        ogretmenNotu: video.ogretmenNotu,
        tarih: video.tarih.toISOString().slice(0, 10),
        sure: video.sure,
        ogretmenAd: video.ogretmen.ad,
        ogretmenBrans: video.ogretmen.brans ?? "",
        ekler: video.ekler,
        gorevler: video.gorevler,
      }}
      kaynak={videoKaynagi(video)}
      izleme={{
        durum: izlemeDurumu(izleme),
        yuzde: izleme?.yuzde ?? 0,
        saniye: izleme?.saniye ?? 0,
        notlar: izleme?.notlar ?? "",
      }}
    />
  );
}
