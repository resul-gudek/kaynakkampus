/* ═══════════════════════════════════════════════════════════════
   Video ders — DB'ye dokunan yardımcılar (yalnız sunucu).
   Saf kurallar ve istemci-güvenli tanımlar src/lib/video-ders.ts içindedir.

   Erişim kuralları burada tek kaynaktan tanımlanır; sayfalar, server
   action'lar ve dosya/akış rotaları aynı fonksiyonları kullanır.

   Öğrenci:  videoyu görebilmesi için (a) kendisine ya da üyesi olduğu bir
             online sınıfa atanmış, (b) durumu "yayinda" ya da "gizli",
             (c) oynatılabilir bir kaynağı olmalıdır. "taslak" hiçbir
             öğrenciye görünmez; "gizli" listelenmez, yalnız doğrudan
             bağlantıyla açılır.
   Öğretmen: yalnız kendi adına kayıtlı videolar (ogretmenId).
   Yönetici: tümü.
   ═══════════════════════════════════════════════════════════════ */

import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { bildirimEkle } from "./bildirim";
import { yetkiVar } from "./yetki";
import { tarihStr } from "./hesap";
import type { Rol } from "./sabitler";

/** Kaynağı eksik (dosyası yüklenmemiş / adresi boş) videolar öğrenciye
    gösterilmez — oynatılamayacak bir kart listeyi kirletir. */
export const OYNATILABILIR_KAYNAK: Prisma.VideoDersWhereInput = {
  OR: [
    { kaynakTur: "baglanti", adres: { not: "" } },
    { kaynakTur: "dosya", dosyaYol: { not: null } },
  ],
};

/** Öğrencinin üyesi olduğu online sınıfların kimlikleri */
export async function ogrenciSinifIdleri(ogrenciId: string): Promise<string[]> {
  const uyelikler = await prisma.onlineSinifUye.findMany({
    where: { kullaniciId: ogrenciId },
    select: { sinifId: true },
  });
  return uyelikler.map((u) => u.sinifId);
}

/** Öğrenciye atanmış videoları seçen where parçası (durum hariç) */
export function ogrenciAtamaFiltresi(
  ogrenciId: string,
  sinifIdleri: string[]
): Prisma.VideoDersWhereInput {
  return {
    atamalar: {
      some: {
        OR: [
          { ogrenciId },
          ...(sinifIdleri.length ? [{ sinifId: { in: sinifIdleri } }] : []),
        ],
      },
    },
  };
}

/** Öğrencinin video listesi filtresi: atanmış + yayında + oynatılabilir */
export async function ogrenciListeFiltresi(ogrenciId: string): Promise<Prisma.VideoDersWhereInput> {
  const sinifIdleri = await ogrenciSinifIdleri(ogrenciId);
  return {
    AND: [{ durum: "yayinda" }, OYNATILABILIR_KAYNAK, ogrenciAtamaFiltresi(ogrenciId, sinifIdleri)],
  };
}

/** Öğrencinin tek bir videoya erişim filtresi: "gizli" de doğrudan açılabilir */
export async function ogrenciDetayFiltresi(
  ogrenciId: string,
  videoId: string
): Promise<Prisma.VideoDersWhereInput> {
  const sinifIdleri = await ogrenciSinifIdleri(ogrenciId);
  return {
    AND: [
      { id: videoId },
      { durum: { in: ["yayinda", "gizli"] } },
      ogrenciAtamaFiltresi(ogrenciId, sinifIdleri),
    ],
  };
}

/** Yönetim/öğretmen tarafı liste filtresi (admin → tümü, koç → kendi videoları) */
export function yonetimFiltresi(kullanici: { id: string; rol: string }): Prisma.VideoDersWhereInput {
  if (yetkiVar(kullanici.rol as Rol, "panel:admin")) return {};
  return { ogretmenId: kullanici.id };
}

/**
 * Videoyu düzenleme/silme/dosya yükleme yetkisi.
 * Yönetici tümünü, öğretmen yalnız kendi adına kayıtlı videoyu yönetir.
 */
export function yonetebilir(
  video: { ogretmenId: string },
  kullanici: { id: string; rol: string }
): boolean {
  return yetkiVar(kullanici.rol as Rol, "panel:admin") || video.ogretmenId === kullanici.id;
}

/**
 * Video dosyası / kapak / ek okuma yetkisi — API rotalarının tek kontrolü.
 * Öğrenci için atama + yayın durumu, öğretmen/yönetici için sahiplik bakılır.
 */
export async function okuyabilir(
  videoId: string,
  kullanici: { id: string; rol: string }
): Promise<boolean> {
  const video = await prisma.videoDers.findUnique({
    where: { id: videoId },
    select: { id: true, ogretmenId: true, durum: true },
  });
  if (!video) return false;
  if (kullanici.rol !== "ogrenci") return yonetebilir(video, kullanici);

  if (video.durum === "taslak") return false;
  const sinifIdleri = await ogrenciSinifIdleri(kullanici.id);
  const atama = await prisma.videoAtama.findFirst({
    where: {
      videoId,
      OR: [
        { ogrenciId: kullanici.id },
        ...(sinifIdleri.length ? [{ sinifId: { in: sinifIdleri } }] : []),
      ],
    },
    select: { id: true },
  });
  return atama !== null;
}

/** Videonun atandığı tüm öğrenci kimlikleri (bildirim gönderimi için) */
export async function atanmisOgrenciIdleri(videoId: string): Promise<string[]> {
  const atamalar = await prisma.videoAtama.findMany({
    where: { videoId },
    select: { ogrenciId: true, sinifId: true },
  });
  const tekil = new Set<string>();
  for (const a of atamalar) if (a.ogrenciId) tekil.add(a.ogrenciId);

  const sinifIdleri = atamalar.map((a) => a.sinifId).filter((x): x is string => !!x);
  if (sinifIdleri.length) {
    const uyeler = await prisma.onlineSinifUye.findMany({
      where: { sinifId: { in: sinifIdleri }, kullanici: { rol: "ogrenci", aktif: true } },
      select: { kullaniciId: true },
    });
    for (const u of uyeler) tekil.add(u.kullaniciId);
  }
  return [...tekil];
}

/**
 * Video yayına alındığında atanmış öğrencilere bildirim düşer.
 * Hem güncelleme action'ı hem dosya yükleme rotası buradan çağırır
 * (dosya kaynaklı videoda yayın, yükleme tamamlandıktan sonra duyurulur).
 */
export async function videoYayinBildirimi(video: {
  id: string;
  baslik: string;
  ders: string;
  tarih: Date;
}): Promise<number> {
  const ogrenciIdler = await atanmisOgrenciIdleri(video.id);
  if (!ogrenciIdler.length) return 0;
  await prisma.$transaction(async (tx) => {
    for (const ogrenciId of ogrenciIdler) {
      await bildirimEkle(
        tx,
        ogrenciId,
        "🎬",
        `Yeni video ders: ${video.ders} – ${video.baslik} · ${tarihStr(video.tarih)}`,
        { tur: "video", ogrenciId, kayitId: video.id }
      );
    }
  });
  return ogrenciIdler.length;
}
