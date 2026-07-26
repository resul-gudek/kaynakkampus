import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pino worker-thread transport'ları bundle edilmemeli
  serverExternalPackages: ["pino", "pino-pretty"],
  experimental: {
    // Başvuru formu belge yükleme içerir; Server Action gövde limiti (varsayılan
    // 1 MB) yükseltilir. İstemci tarafında da toplam boyut kontrol edilir
    // (bkz. BasvuruSihirbazi) — bu limit son emniyet supabıdır.
    serverActions: { bodySizeLimit: "25mb" },
  },
  async rewrites() {
    return {
      // Ana sayfa public/index.html'den sunulur (Next, public/index.html'i kökte otomatik sunmaz)
      beforeFiles: [{ source: "/", destination: "/index.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    // Eski statik sayfa linkleri yeni React rotalarına yönlenir
    return [
      { source: "/giris.html", destination: "/giris", permanent: false },
      { source: "/koc-panel.html", destination: "/koc", permanent: false },
      { source: "/ogrenci-panel.html", destination: "/ogrenci", permanent: false },
      { source: "/bildirimler.html", destination: "/bildirimler", permanent: false },
    ];
  },
};

export default nextConfig;
