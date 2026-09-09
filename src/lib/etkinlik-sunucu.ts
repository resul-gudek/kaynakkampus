/* Etkinlikler (PDF arşivi) — DB'ye dokunan yardımcılar (yalnız sunucu).
   Saf/istemci-güvenli yardımcılar: etkinlik.ts */

import { prisma } from "./prisma";
import { slugla } from "./blog";
import { altAgac, type AgacDugumu } from "./etkinlik";

/** Ağaç tek sorguyla çekilir: yüzlerce düğümde bile tek gidiş-geliş, ve
    kırıntı yolu / alt ağaç sayımı ek sorgu istemez. */
export const DUGUM_ALANLARI = {
  id: true,
  ustId: true,
  tur: true,
  ad: true,
  slug: true,
  sira: true,
  durum: true,
  dosyaYol: true,
  dosyaAd: true,
  dosyaBoyut: true,
  kapakYol: true,
} as const;

export type HamDugum = {
  id: string;
  ustId: string | null;
  tur: string;
  ad: string;
  slug: string;
  sira: number;
  durum: string;
  dosyaYol: string | null;
  dosyaAd: string;
  dosyaBoyut: number;
  kapakYol: string | null;
};

/** Ağacın tamamı (panel için; taslaklar dâhil) */
export async function agaciGetir(): Promise<HamDugum[]> {
  return prisma.etkinlikDugum.findMany({
    orderBy: [{ sira: "asc" }, { ad: "asc" }],
    select: DUGUM_ALANLARI,
  });
}

/**
 * Ziyaretçiye açık ağaç. Bir düğüm ancak KENDİSİ ve TÜM ÜSTLERİ yayındaysa
 * görünür — taslağa alınan klasör bütün alt ağacını gizler.
 *
 * Ayrıca içinde (hiçbir derinlikte) yayında PDF bulunmayan klasörler
 * elenir: ziyaretçi boş klasörlere girip çıkmasın.
 */
export async function yayindakiAgac(): Promise<HamDugum[]> {
  const hepsi = await agaciGetir();
  const indeks = new Map(hepsi.map((d) => [d.id, d]));

  const zincirYayinda = (d: HamDugum): boolean => {
    let simdiki: HamDugum | undefined = d;
    for (let n = 0; simdiki && n < 32; n++) {
      if (simdiki.durum !== "yayinda") return false;
      simdiki = simdiki.ustId ? indeks.get(simdiki.ustId) : undefined;
    }
    return true;
  };

  const gorunur = hepsi.filter(zincirYayinda);
  // PDF'i olmayan (ve altında da olmayan) klasörler listelenmez
  return gorunur.filter(
    (d) =>
      d.tur === "pdf" ||
      altAgac(gorunur as AgacDugumu[], d.id).some((a) => a.tur === "pdf")
  );
}

/**
 * Kardeşler arasında benzersiz slug üretir.
 * Çakışma olursa sonuna "-2", "-3" … eklenir.
 * @param haricId yeniden adlandırmada kendi kaydı çakışma sayılmaz
 */
export async function benzersizDugumSlug(
  ad: string,
  ustId: string | null,
  haricId?: string
): Promise<string> {
  const temel = slugla(ad) || "klasor";
  const kardesler = await prisma.etkinlikDugum.findMany({
    where: { ustId },
    select: { id: true, slug: true },
  });
  const dolu = new Set(kardesler.filter((k) => k.id !== haricId).map((k) => k.slug));
  if (!dolu.has(temel)) return temel;
  for (let n = 2; n < 500; n++) {
    const aday = `${temel.slice(0, 86)}-${n}`;
    if (!dolu.has(aday)) return aday;
  }
  return `${temel.slice(0, 80)}-${Math.floor(Date.now() % 1e6)}`;
}

/** Klasöre eklenecek yeni düğümün sıra numarası (sona koyar) */
export async function sonrakiSira(ustId: string | null): Promise<number> {
  const sonuc = await prisma.etkinlikDugum.aggregate({
    where: { ustId },
    _max: { sira: true },
  });
  return (sonuc._max.sira ?? 0) + 1;
}
