"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import SayacBeacon from "./SayacBeacon";

/* Public Next sayfalarının ölçüm kapısı — statik sayfalardaki
     <script src="assets/cerez-onay.js" defer></script>
     <script src="assets/analitik.js" defer></script>
     <script src="assets/kullanim-sayac.js" ...></script>
   üçlüsünün Next karşılığı. Tek yerden bağlanır ki bir sayfa ölçüm
   dışında kalmasın.

   Yalnızca PUBLIC kabuklara eklenir (blog, giriş, başvuru, iletişim);
   (panel) altındaki oturumlu sayfalar bilerek dışarıda — panel kullanımı
   Google'a gitmez, o taraf kendi denetim loglarıyla izlenir.

   Sıra önemli: cerez-onay.js Consent Mode v2 varsayılanlarını ("denied")
   dataLayer'a önce yazar, GA4 ondan sonra yüklenir; kullanıcı onay
   vermedikçe çerez yazılmaz. Bu yüzden betikler ardışık ekleniyor,
   paralel değil. */

const BETIKLER = ["/assets/cerez-onay.js", "/assets/analitik.js"];

/* Modül düzeyi: StrictMode'un effect'i iki kez çalıştırması ve rota
   değişiminde yeniden bağlanma betikleri tekrar yüklemesin */
let betiklerEklendi = false;

function betikleriSirayaEkle(sira: string[], i = 0) {
  if (i >= sira.length) return;
  const s = document.createElement("script");
  s.src = sira[i];
  s.async = false;
  /* Bir betik yüklenemezse (ağ hatası) zincir yine ilerlemez: GA4'ü
     onay varsayılanları olmadan yüklemek yanlış olur. */
  s.onload = () => betikleriSirayaEkle(sira, i + 1);
  document.head.appendChild(s);
}

export default function SiteOlcum() {
  const yol = usePathname();
  const ilkYol = useRef(true);

  useEffect(() => {
    if (betiklerEklendi) return;
    betiklerEklendi = true;
    betikleriSirayaEkle(BETIKLER);
  }, []);

  /* İstemci tarafı gezinme (Link) sayfayı yeniden yüklemediği için GA4
     kendiliğinden page_view üretmez; ilk görüntülemeyi analitik.js'teki
     gtag("config") gönderdiğinden burada ilk yol atlanır. */
  useEffect(() => {
    if (!yol) return;
    if (ilkYol.current) {
      ilkYol.current = false;
      return;
    }
    const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    if (typeof gtag !== "function") return;
    gtag("event", "page_view", {
      page_path: yol,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [yol]);

  return <SayacBeacon />;
}
