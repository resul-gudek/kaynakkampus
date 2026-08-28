/* Sitenin dış (mutlak) adresi. SITE_ADRESI ortam değişkeni tanımlıysa o
   kullanılır; tanımsızsa canlı alan adına düşülür ki sitemap, canonical ve
   JSON-LD hiçbir ortamda göreli adres üretmesin. */
export const SITE_KOKU = (process.env.SITE_ADRESI ?? "https://kaynakkampus.com")
  .trim()
  .replace(/\/+$/, "");

/** Siteye göreli bir yolu mutlak adrese çevirir */
export function mutlakAdres(yol: string): string {
  return `${SITE_KOKU}${yol}`;
}
