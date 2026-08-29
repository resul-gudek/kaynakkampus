/* Sitenin dış (mutlak) adresi. SITE_ADRESI ortam değişkeni tanımlıysa o
   kullanılır; tanımsızsa canlı alan adına düşülür ki sitemap, canonical ve
   JSON-LD hiçbir ortamda göreli adres üretmesin. */
export const SITE_KOKU = (process.env.SITE_ADRESI ?? "https://kaynakkampus.com")
  .trim()
  .replace(/\/+$/, "");

/** Ziyaretçilerin doğrudan ulaşabileceği kurumsal e-posta adresi. */
export const ILETISIM_EPOSTA = "kaynakkampus@gmail.com";

/** Siteye göreli bir yolu mutlak adrese çevirir */
export function mutlakAdres(yol: string): string {
  return `${SITE_KOKU}${yol}`;
}
