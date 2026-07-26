import type { MetadataRoute } from "next";

/* Arama motoru kuralları. Blog ve tanıtım sayfaları taranabilir; panel,
   oturum ve API adresleri dışarıda bırakılır. */
const KOK = (process.env.SITE_ADRESI ?? "").trim().replace(/\/+$/, "");

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
        ],
      },
    ],
    sitemap: KOK ? `${KOK}/sitemap.xml` : "/sitemap.xml",
  };
}
