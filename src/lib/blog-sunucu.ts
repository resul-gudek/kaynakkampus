/* Blog — DB'ye dokunan yardımcılar (yalnız sunucu).
   Saf/istemci-güvenli yardımcılar: blog.ts */

import { prisma } from "./prisma";
import { slugla, SLUG_MAX } from "./blog";

/** Yayındaki yazıların ortak listeleme koşulu (ziyaretçiye açık olanlar) */
export const YAYINDA_KOSUL = { durum: "yayinda" as const };

/**
 * Başlıktan (ya da verilen slug'dan) benzersiz bir adres üretir.
 * Çakışma olursa sonuna "-2", "-3" … eklenir.
 * @param hariçId düzenleme sırasında kendi kaydı çakışma sayılmaz
 */
export async function benzersizSlug(
  kaynak: string,
  haricId?: string
): Promise<string> {
  const temel = slugla(kaynak) || "yazi";
  let aday = temel;
  for (let n = 2; n < 200; n++) {
    const mevcut = await prisma.blogYazi.findUnique({
      where: { slug: aday },
      select: { id: true },
    });
    if (!mevcut || (haricId && mevcut.id === haricId)) return aday;
    const ek = `-${n}`;
    aday = temel.slice(0, SLUG_MAX - ek.length).replace(/-+$/g, "") + ek;
  }
  // 200 denemede boş slot bulunamadı — kimlikle garanti benzersiz adres
  return `${temel.slice(0, SLUG_MAX - 9)}-${Math.floor(Date.now() % 1e8)}`;
}
