import type { MetadataRoute } from "next";
import { SITE_KOKU } from "@/lib/site";

/* Arama motoru kuralları. Blog ve tanıtım sayfaları taranabilir; panel,
   oturum ve API adresleri dışarıda bırakılır. */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/koc",
          "/ogrenci",
          "/veli",
          "/siniflar",
          "/canli-ders",
          "/mesajlar",
          "/bildirimler",
          "/video-dersler",
          "/giris",
          // Başvuru siteden gizlendiği sürece taranmasın (kullanıcı kararı).
          "/basvuru",
        ],
      },
    ],
    sitemap: `${SITE_KOKU}/sitemap.xml`,
  };
}
