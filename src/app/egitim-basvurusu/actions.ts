"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { logcu } from "@/lib/log";
import { hizSiniriIzin } from "@/lib/rate-limit";
import {
  GENEL_HATA,
  KoclukSemasi,
  OzelDersSemasi,
  type KoclukVeri,
  type OzelDersVeri,
} from "@/lib/egitim-basvurusu";
import {
  koclukBasvuruMailiKuyrukla,
  koclukOnayMailiKuyrukla,
  ozelDersBasvuruMailiKuyrukla,
  ozelDersOnayMailiKuyrukla,
} from "@/lib/egitim-basvurusu-mail";

const log = logcu("egitim-basvurusu");

/* Her başvuru İKİ ayrı mail üretir: (1) kuruma detaylı yönetici bildirimi,
   (2) başvurana kısa "başvurunuzu aldık" onayı. İkisi ayrı kuyruk satırıdır;
   biri kuyruklanamazsa diğeri ve başvurunun kendisi etkilenmez. Gönderim
   hatalarını kuyruğun kendi tekrar mekanizması yönetir (bkz. lib/mail.ts). */

/* "use server" dosyası yalnız async fonksiyon dışa açar; GENEL_HATA sabiti
   lib/egitim-basvurusu.ts'te durur ve formlar da oradan okur. */
export type BasvuruSonuc = { tamam: true } | { tamam: false; hata: string };

// IP başına: dakikada 2, saatte 5 başvuru (iki form ortak sayaç)
const DAKIKALIK_SINIR = 2;
const SAATLIK_SINIR = 5;

async function istekIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() || "bilinmeyen";
}

/**
 * Ortak giriş denetimi. `sirket` honeypot'tur: görünmez alan dolduysa bot
 * sayılır; kayıt yazılmaz ama bota "başarılı" gösterilir ki tekrar denemesin.
 * Dönüş: null → devam; BasvuruSonuc → bu sonucu döndür.
 */
async function onKontrol(sirket: unknown): Promise<BasvuruSonuc | null> {
  const ip = await istekIp();
  if (typeof sirket === "string" && sirket.trim() !== "") {
    log.warn({ ip }, "eğitim başvurusu honeypot tetiklendi");
    return { tamam: true };
  }
  if (!hizSiniriIzin(`egitim-basvurusu:dk:${ip}`, DAKIKALIK_SINIR, 60_000)) {
    log.warn({ ip }, "eğitim başvurusu dakikalık hız sınırı");
    return { tamam: false, hata: "Çok kısa sürede birden fazla başvuru gönderdiniz. Lütfen biraz sonra tekrar deneyin." };
  }
  if (!hizSiniriIzin(`egitim-basvurusu:sa:${ip}`, SAATLIK_SINIR, 3_600_000)) {
    log.warn({ ip }, "eğitim başvurusu saatlik hız sınırı");
    return { tamam: false, hata: "Bu adresten çok fazla başvuru alındı. Lütfen daha sonra tekrar deneyin." };
  }
  return null;
}

/** Özel ders başvurusu: doğrula → kaydet → kurum adresine mail kuyrukla. */
export async function ozelDersBasvurusuGonder(girdi: unknown, sirket?: unknown): Promise<BasvuruSonuc> {
  const engel = await onKontrol(sirket);
  if (engel) return engel;

  const sonuc = OzelDersSemasi.safeParse(girdi);
  if (!sonuc.success) {
    log.warn({ alanlar: sonuc.error.issues.map((i) => i.path.join(".")) }, "özel ders başvurusu doğrulanamadı");
    return { tamam: false, hata: GENEL_HATA };
  }
  const v: OzelDersVeri = sonuc.data;

  try {
    const kayit = await prisma.egitimBasvurusu.create({
      data: {
        tur: "ozel_ders",
        durum: "yeni",
        ogrenciAd: v.ogrenciAd,
        yas: v.yas,
        sinif: v.sinif,
        egitim: v.egitim,
        basvuran: v.basvuran,
        iletisimAd: v.iletisimAd,
        telefon: v.telefon,
        eposta: v.eposta,
        veri: JSON.stringify(v),
      },
      select: { id: true, olusturma: true },
    });
    // Kişisel veri loga yazılmaz; iz için kimlik + eğitim yeter
    log.info({ id: kayit.id, egitim: v.egitim, sinif: v.sinif }, "özel ders başvurusu alındı");

    const kuyruklandi = await ozelDersBasvuruMailiKuyrukla(kayit.id, v).catch(() => false);
    if (!kuyruklandi) log.warn({ id: kayit.id }, "özel ders başvuru maili kuyruklanamadı (mail sistemi kapalı olabilir)");
    const onay = await ozelDersOnayMailiKuyrukla(kayit.id, v, kayit.olusturma).catch(() => false);
    if (!onay) log.warn({ id: kayit.id }, "özel ders başvuru onay maili kuyruklanamadı (mail sistemi kapalı olabilir)");
    return { tamam: true };
  } catch (e) {
    log.error({ hata: e instanceof Error ? e.message : String(e) }, "özel ders başvurusu kaydedilemedi");
    return { tamam: false, hata: GENEL_HATA };
  }
}

/** Eğitim koçluğu başvurusu: doğrula → kaydet → kurum adresine mail kuyrukla. */
export async function koclukBasvurusuGonder(girdi: unknown, sirket?: unknown): Promise<BasvuruSonuc> {
  const engel = await onKontrol(sirket);
  if (engel) return engel;

  const sonuc = KoclukSemasi.safeParse(girdi);
  if (!sonuc.success) {
    log.warn({ alanlar: sonuc.error.issues.map((i) => i.path.join(".")) }, "koçluk başvurusu doğrulanamadı");
    return { tamam: false, hata: GENEL_HATA };
  }
  const v: KoclukVeri = sonuc.data;

  try {
    const kayit = await prisma.egitimBasvurusu.create({
      data: {
        tur: "egitim_koclugu",
        durum: "yeni",
        ogrenciAd: v.ogrenciAd,
        yas: v.yas,
        sinif: v.sinif,
        egitim: "",
        basvuran: v.basvuran,
        iletisimAd: v.iletisimAd,
        telefon: v.telefon,
        eposta: v.eposta,
        veri: JSON.stringify(v),
      },
      select: { id: true, olusturma: true },
    });
    log.info({ id: kayit.id, sinif: v.sinif, konuSayisi: v.konular.length }, "eğitim koçluğu başvurusu alındı");

    const kuyruklandi = await koclukBasvuruMailiKuyrukla(kayit.id, v).catch(() => false);
    if (!kuyruklandi) log.warn({ id: kayit.id }, "koçluk başvuru maili kuyruklanamadı (mail sistemi kapalı olabilir)");
    const onay = await koclukOnayMailiKuyrukla(kayit.id, v, kayit.olusturma).catch(() => false);
    if (!onay) log.warn({ id: kayit.id }, "koçluk başvuru onay maili kuyruklanamadı (mail sistemi kapalı olabilir)");
    return { tamam: true };
  } catch (e) {
    log.error({ hata: e instanceof Error ? e.message : String(e) }, "koçluk başvurusu kaydedilemedi");
    return { tamam: false, hata: GENEL_HATA };
  }
}
