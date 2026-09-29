import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/* Anonim kullanım sayaçları — sitedeki genel kullanım (oyun başlatma,
   etkinlik indirme, ödev/BEP/ders programı oluşturma, sayfa görüntüleme)
   yalnızca GÜN + OLAY + DETAY başına bir SAYI olarak tutulur.
   Kişisel veri (IP, kullanıcı, tarayıcı, çerez) kaydedilmez. */

/** /api/olay'a istemciden gelebilecek olay anahtarları — dışarıdan gelen her
    şey buna süzülür. "etkinlik" (PDF indirme, detay: etkinlik kimliği) burada
    YOKTUR: indirme rotası kendisi sayar (api/etkinlik/pdf/[id]), böylece
    dışarıdan POST ile şişirilemez. */
export const OLAYLAR = new Set([
  "sayfa", // sayfa görüntüleme (detay: sayfa adı)
  "oyun", // oyun başlatma (detay: oyun adı)
  "odev", // ödev oluşturucu (detay: "olusturuldu" | "yazdirildi")
  "bep", // BEP oluşturucu (detay: "olusturuldu" | "yazdirildi")
  "ders-programi", // ders programı (detay: "yazdirildi" | "kaydedildi")
  "test", // çoklu zekâ testi tamamlandı (detay: düzey)
  "kariyer", // kariyer pusulam sonuç ekranına ulaşıldı (detay: "tamamlandi")
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

/* ── Herkese açık toplamlar ───────────────────────────────────
   Ziyaretçiye gösterilen "kez oynandı / kez okundu" sayıları: bir olayın
   TÜM ZAMANLAR toplamı, detay başına. Her sayfa açılışında veritabanına
   gitmemek için 5 dk bellekte tutulur (globalThis — bkz. Next paket
   yalıtımı: rota ve instrumentation ayrı paketlerdir). */

const TOPLAM_ONBELLEK_MS = 5 * 60_000;

type ToplamOnbellek = Map<string, { zaman: number; veri: Map<string, number> }>;
const kok = globalThis as unknown as { __kkSayacToplam?: ToplamOnbellek };
const onbellek: ToplamOnbellek = (kok.__kkSayacToplam ??= new Map());

/** olay'ın detay → toplam sayı haritası (önek verilirse yalnız o önekle
    başlayan detaylar). Hata olursa boş harita döner — sayaç sayfayı bozmaz. */
export async function toplamSayilar(olay: string, onek = ""): Promise<Map<string, number>> {
  const anahtar = olay + "|" + onek;
  const hazir = onbellek.get(anahtar);
  if (hazir && Date.now() - hazir.zaman < TOPLAM_ONBELLEK_MS) return hazir.veri;

  const veri = new Map<string, number>();
  try {
    const gruplar = await prisma.kullanimSayaci.groupBy({
      by: ["detay"],
      where: { olay, ...(onek ? { detay: { startsWith: onek } } : {}) },
      _sum: { sayi: true },
    });
    for (const g of gruplar) if (g.detay) veri.set(g.detay, g._sum.sayi ?? 0);
  } catch {
    return hazir?.veri ?? veri;
  }
  onbellek.set(anahtar, { zaman: Date.now(), veri });
  return veri;
}

/** Blog yazısının okunma sayısı anahtarı — SayacBeacon "sayfa" olayına
    usePathname() yollar, yazı sayfası için bu "/blog/<slug>"tır. */
export const blogSayfaDetayi = (slug: string) => `/blog/${slug}`;

/* ── Araç özeti ───────────────────────────────────────────────
   Ziyaretçiye gösterilen "kaç kez kullanıldı" sayıları: araç başına TEK
   anlamlı ölçü (ödevde oluşturma, oyunda başlatma, testte tamamlama…).
   Eşiğin altındaki sayılar hiç dönmez; istemci o aracın satırını boş
   bırakır. Eşik 1: her araçta, kullanıldığı andan itibaren görünür. */

export const ARAC_ESIK = 1;

/** araç anahtarı → sayılan olay (+ varsa yalnız bu detay ya da bu önekle başlayanlar) */
const ARAC_OLCULERI: Record<string, { olay: string; detay?: string; onek?: string }> = {
  oyunlar: { olay: "oyun" },
  odev: { olay: "odev", detay: "olusturuldu" },
  bep: { olay: "bep", detay: "olusturuldu" },
  "ders-programi": { olay: "ders-programi" },
  etkinlikler: { olay: "etkinlik" },
  "coklu-zeka-testi": { olay: "test" },
  "kariyer-pusulam": { olay: "kariyer" },
  "sinav-takvimi": { olay: "sayfa", detay: "sinav-takvimi" },
  haberler: { olay: "sayfa", detay: "haberler" },
  blog: { olay: "sayfa", onek: "/blog/" }, // yazı sayfaları; /blog listesi sayılmaz
};

const OZET_ANAHTAR = "__arac_ozeti";

/** { araç: tüm zamanlar sayısı } — yalnız ARAC_ESIK ve üstü. 5 dk önbellekli. */
export async function aracOzeti(): Promise<Record<string, number>> {
  const hazir = onbellek.get(OZET_ANAHTAR);
  if (hazir && Date.now() - hazir.zaman < TOPLAM_ONBELLEK_MS) return Object.fromEntries(hazir.veri);

  const veri = new Map<string, number>();
  try {
    const olaylar = [...new Set(Object.values(ARAC_OLCULERI).map((o) => o.olay))];
    const gruplar = await prisma.kullanimSayaci.groupBy({
      by: ["olay", "detay"],
      where: { olay: { in: olaylar } },
      _sum: { sayi: true },
    });
    for (const [arac, olcu] of Object.entries(ARAC_OLCULERI)) {
      const toplam = gruplar
        .filter(
          (g) =>
            g.olay === olcu.olay &&
            (olcu.detay === undefined || g.detay === olcu.detay) &&
            (olcu.onek === undefined || (g.detay.startsWith(olcu.onek) && g.detay !== olcu.onek)),
        )
        .reduce((t, g) => t + (g._sum.sayi ?? 0), 0);
      if (toplam >= ARAC_ESIK) veri.set(arac, toplam);
    }
  } catch {
    return hazir ? Object.fromEntries(hazir.veri) : {};
  }
  onbellek.set(OZET_ANAHTAR, { zaman: Date.now(), veri });
  return Object.fromEntries(veri);
}
