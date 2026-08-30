import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/* Anonim kullanım sayaçları — sitedeki genel kullanım (oyun başlatma,
   etkinlik indirme, ödev/BEP/ders programı oluşturma, sayfa görüntüleme)
   yalnızca GÜN + OLAY + DETAY başına bir SAYI olarak tutulur.
   Kişisel veri (IP, kullanıcı, tarayıcı, çerez) kaydedilmez. */

/** İzin verilen olay anahtarları — dışarıdan gelen her şey buna süzülür. */
export const OLAYLAR = new Set([
  "sayfa", // sayfa görüntüleme (detay: sayfa adı)
  "oyun", // oyun başlatma (detay: oyun adı)
  "etkinlik", // etkinlik indirme/inceleme tıklaması (detay: etkinlik adı)
  "odev", // ödev oluşturucu (detay: "olusturuldu" | "yazdirildi")
  "bep", // BEP oluşturucu (detay: "olusturuldu" | "yazdirildi")
  "ders-programi", // ders programı (detay: "yazdirildi" | "kaydedildi")
]);

const DETAY_AZAMI = 120;

/** İstanbul saatine göre "bugün" — DATE kolonuna UTC gece yarısı yazılır. */
export function bugunIstanbul(): Date {
  const gun = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // "YYYY-MM-DD"
  return new Date(gun + "T00:00:00.000Z");
}

/** Detayı sadeleştir: kontrol karakterleri atılır, boşluk normalize edilir, kırpılır. */
export function detayTemizle(ham: unknown): string {
  if (typeof ham !== "string") return "";
  return ham.replace(/[\x00-\x1f\x7f]/g, "").replace(/\s+/g, " ").trim().slice(0, DETAY_AZAMI);
}

/** Sayacı 1 artırır; satır yoksa oluşturur. Yarışta (aynı anda iki create)
    P2002 gelirse bir kez daha dener — kayıp artırım pratikte önemsizdir. */
export async function sayacArtir(olay: string, detay: string): Promise<void> {
  const gun = bugunIstanbul();
  for (let deneme = 0; deneme < 2; deneme++) {
    try {
      await prisma.kullanimSayaci.upsert({
        where: { gun_olay_detay: { gun, olay, detay } },
        update: { sayi: { increment: 1 } },
        create: { gun, olay, detay, sayi: 1 },
      });
      return;
    } catch (e) {
      const yaris = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
      if (!yaris || deneme === 1) throw e;
    }
  }
}
