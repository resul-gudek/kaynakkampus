import "server-only";

import { AccessToken } from "livekit-server-sdk";
import { prisma } from "@/lib/prisma";
import { egitmenMi } from "@/lib/sabitler";

export const KATILIM_ONCESI_OGRENCI_DK = 10;
export const KATILIM_ONCESI_OGRETMEN_DK = 30;
export const KATILIM_SONRASI_DK = 30;

export function canliDersHazir(): boolean {
  return (
    !!process.env.LIVEKIT_URL?.trim() &&
    !!process.env.LIVEKIT_API_KEY?.trim() &&
    !!process.env.LIVEKIT_API_SECRET?.trim()
  );
}

export async function dersOturumuErisimi(oturumId: string, kullaniciId: string, rol: string) {
  const oturum = await prisma.dersOturumu.findUnique({
    where: { id: oturumId },
    include: {
      sinif: {
        include: {
          ogretmen: { select: { id: true, ad: true } },
          _count: { select: { uyeler: true } },
          uyeler: {
            where: { kullaniciId },
            select: { id: true },
          },
        },
      },
      ozelDers: {
        include: {
          koc: { select: { id: true, ad: true } },
          ogrenci: { select: { id: true, ad: true } },
        },
      },
    },
  });
  if (!oturum) return null;

  const moderator =
    egitmenMi(rol) &&
    (oturum.sinif?.ogretmenId === kullaniciId || oturum.ozelDers?.kocId === kullaniciId);
  const katilimci =
    rol === "ogrenci" &&
    (!!oturum.sinif?.uyeler.length || oturum.ozelDers?.ogrenciId === kullaniciId);

  if (!moderator && !katilimci) return null;
  return { oturum, moderator };
}

export function katilimPenceresi(
  baslangic: Date,
  sure: number,
  moderator: boolean,
  simdi = new Date()
) {
  const once = moderator ? KATILIM_ONCESI_OGRETMEN_DK : KATILIM_ONCESI_OGRENCI_DK;
  const acilis = new Date(baslangic.getTime() - once * 60_000);
  const kapanis = new Date(baslangic.getTime() + (sure + KATILIM_SONRASI_DK) * 60_000);
  return {
    acilis,
    kapanis,
    acik: simdi >= acilis && simdi <= kapanis,
    erken: simdi < acilis,
    gec: simdi > kapanis,
  };
}

function livekitAyar() {
  const url = process.env.LIVEKIT_URL?.trim();
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
  if (!url || !apiKey || !apiSecret) {
    throw new Error("Canlı ders sağlayıcısı henüz yapılandırılmadı.");
  }
  return { url, apiKey, apiSecret };
}

// Jeton yalnızca ilgili odaya katılım hakkı verir; yeniden bağlanmalar için
// geçerliliği katılım penceresinin kapanışına kadar sürer.
export async function canliDersKatilimJetonu(girdi: {
  odaId: string;
  kullaniciId: string;
  kullaniciAd: string;
  moderator: boolean;
  gecerlilikBitis: Date;
}) {
  const { url, apiKey, apiSecret } = livekitAyar();
  const ttlSaniye = Math.max(
    600,
    Math.ceil((girdi.gecerlilikBitis.getTime() - Date.now()) / 1000)
  );
  const jeton = new AccessToken(apiKey, apiSecret, {
    identity: girdi.kullaniciId,
    name: girdi.kullaniciAd,
    ttl: ttlSaniye,
    metadata: JSON.stringify({ rol: girdi.moderator ? "ogretmen" : "ogrenci" }),
  });
  jeton.addGrant({
    room: girdi.odaId,
    roomJoin: true,
    roomAdmin: girdi.moderator,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  return { url, token: await jeton.toJwt() };
}
