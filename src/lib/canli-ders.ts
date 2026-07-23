import "server-only";

import { createHash, createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { logcu } from "@/lib/log";

const log = logcu("canli-ders");

export const KATILIM_ONCESI_OGRENCI_DK = 10;
export const KATILIM_ONCESI_OGRETMEN_DK = 30;
export const KATILIM_SONRASI_DK = 30;

export function bigBlueButtonHazir(): boolean {
  return !!process.env.BBB_API_URL?.trim() && !!process.env.BBB_SECRET?.trim();
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
    rol === "koc" &&
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

function bbbAyar() {
  const api = process.env.BBB_API_URL?.trim().replace(/\/+$/, "");
  const secret = process.env.BBB_SECRET?.trim();
  if (!api || !secret) throw new Error("Canlı ders sağlayıcısı henüz yapılandırılmadı.");
  return { api, secret };
}

function bbbAdresi(islem: string, parametreler: Record<string, string | number | boolean>) {
  const { api, secret } = bbbAyar();
  const sorgu = new URLSearchParams();
  for (const [anahtar, deger] of Object.entries(parametreler)) {
    sorgu.set(anahtar, String(deger));
  }
  const metin = sorgu.toString();
  const checksum = createHash("sha1").update(islem + metin + secret).digest("hex");
  return `${api}/${islem}?${metin}&checksum=${checksum}`;
}

function odaParolasi(odaId: string, rol: "moderator" | "katilimci") {
  const { secret } = bbbAyar();
  return createHmac("sha256", secret).update(`${odaId}:${rol}`).digest("hex").slice(0, 28);
}

export async function bigBlueButtonKatilimAdresi(girdi: {
  odaId: string;
  baslik: string;
  sure: number;
  kullaniciId: string;
  kullaniciAd: string;
  moderator: boolean;
  cikisAdresi: string;
}) {
  const moderatorPW = odaParolasi(girdi.odaId, "moderator");
  const attendeePW = odaParolasi(girdi.odaId, "katilimci");
  const olustur = bbbAdresi("create", {
    meetingID: girdi.odaId,
    name: girdi.baslik,
    moderatorPW,
    attendeePW,
    duration: Math.min(Math.max(girdi.sure + 60, 75), 540),
    record: false,
    autoStartRecording: false,
    allowStartStopRecording: false,
    logoutURL: girdi.cikisAdresi,
    welcome: "Kaynak Akademi canlı dersine hoş geldiniz.",
  });

  const yanit = await fetch(olustur, { cache: "no-store", signal: AbortSignal.timeout(12_000) });
  const govde = await yanit.text();
  if (!yanit.ok || !/<returncode>SUCCESS<\/returncode>/i.test(govde)) {
    const mesaj = govde.match(/<message>([^<]+)<\/message>/i)?.[1] ?? `HTTP ${yanit.status}`;
    log.error({ odaId: girdi.odaId, hata: mesaj }, "BBB odası oluşturulamadı");
    throw new Error("Canlı ders odası şu anda başlatılamıyor. Lütfen biraz sonra tekrar deneyin.");
  }

  return bbbAdresi("join", {
    meetingID: girdi.odaId,
    fullName: girdi.kullaniciAd,
    userID: girdi.kullaniciId,
    password: girdi.moderator ? moderatorPW : attendeePW,
    redirect: true,
  });
}
