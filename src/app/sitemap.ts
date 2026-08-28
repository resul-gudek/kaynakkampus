import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { blogYaziUrl } from "@/lib/blog";
import { YAYINDA_KOSUL } from "@/lib/blog-sunucu";
import { mutlakAdres as tam } from "@/lib/site";

/* Site haritası — herkese açık sayfalar ve yayındaki blog yazıları.
   Mutlak adresler src/lib/site.ts'ten gelir (SITE_ADRESI ya da canlı
   alan adı); arama motorları göreli adres kabul etmez. */

/** Statik public sayfalar — public/*.html ve React public rotaları */
const SABIT_SAYFALAR: { yol: string; oncelik: number; siklik: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { yol: "/", oncelik: 1, siklik: "weekly" },
  { yol: "/blog", oncelik: 0.9, siklik: "daily" },
  // Sınav takvimi ÖSYM/MEB duyurularıyla sık değişir
  { yol: "/sinav-takvimi.html", oncelik: 0.9, siklik: "daily" },
  { yol: "/haberler.html", oncelik: 0.7, siklik: "daily" },
  { yol: "/hakkimizda.html", oncelik: 0.7, siklik: "monthly" },
  { yol: "/etkinlikler.html", oncelik: 0.7, siklik: "weekly" },
  { yol: "/oyunlar.html", oncelik: 0.6, siklik: "monthly" },
  { yol: "/coklu-zeka-testi.html", oncelik: 0.6, siklik: "monthly" },
  { yol: "/odev-olustur.html", oncelik: 0.5, siklik: "monthly" },
  { yol: "/bep-olustur.html", oncelik: 0.5, siklik: "monthly" },
  { yol: "/ders-programi.html", oncelik: 0.5, siklik: "monthly" },
  { yol: "/basvuru", oncelik: 0.6, siklik: "monthly" },
  { yol: "/gizlilik.html", oncelik: 0.3, siklik: "yearly" },
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let yazilar: { slug: string; guncelleme: Date; yayinTarihi: Date | null }[] = [];
  try {
    yazilar = await prisma.blogYazi.findMany({
      where: YAYINDA_KOSUL,
      orderBy: { yayinTarihi: "desc" },
      select: { slug: true, guncelleme: true, yayinTarihi: true },
    });
  } catch {
    // Veritabanına ulaşılamazsa site haritası statik sayfalarla üretilir
  }

  return [
    ...SABIT_SAYFALAR.map((s) => ({
      url: tam(s.yol),
      changeFrequency: s.siklik,
      priority: s.oncelik,
    })),
    ...yazilar.map((y) => ({
      url: tam(blogYaziUrl(y.slug)),
      lastModified: y.guncelleme,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
