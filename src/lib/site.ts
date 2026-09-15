/* Sitenin dış (mutlak) adresi. SITE_ADRESI ortam değişkeni tanımlıysa o
   kullanılır; tanımsızsa canlı alan adına düşülür ki sitemap, canonical ve
   JSON-LD hiçbir ortamda göreli adres üretmesin.

   ADRES KURALI (iki kaynak birbirine karıştırılmamalı):
   • DIŞARI giden her bağlantı — e-posta gövdesi, bildirim, paylaşılan
     adres — BURADAN üretilir: SITE_KOKU / mutlakAdres(). Alıcı başka bir
     ağdaki cihazdan tıklar; adres internetten açılabilmelidir.
   • UYGULAMA_URL ise kurulumun KENDİ çalışma adresidir (yerel geliştirme
     ya da LAN yayını: bkz. ops/lan-yayin) ve 192.168.x.x gibi yalnız iç
     ağdan açılan bir değer olabilir. Bu yüzden giden maillerde ASLA
     kullanılmaz — kullanıldığında dışarıdan açılmayan bağlantılar üretti. */
export const SITE_KOKU = (process.env.SITE_ADRESI ?? "https://kaynakkampus.com")
  .trim()
  .replace(/\/+$/, "");

/** Ziyaretçilerin doğrudan ulaşabileceği kurumsal e-posta adresi. */
export const ILETISIM_EPOSTA = "kaynakkampus@gmail.com";

/** Siteye göreli bir yolu mutlak adrese çevirir ("/blog" → "https://…/blog").
    Baştaki eğik çizgi eksikse eklenir, fazlası tekilleştirilir; böylece
    çağıran taraf ne verirse versin çift eğik çizgili adres oluşmaz. */
export function mutlakAdres(yol: string): string {
  const temiz = yol.replace(/^\/+/, "");
  return temiz ? `${SITE_KOKU}/${temiz}` : SITE_KOKU;
}
