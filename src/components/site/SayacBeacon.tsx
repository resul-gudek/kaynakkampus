"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/* Anonim sayfa sayacı — public Next sayfalarında (blog) görüntülemeyi
   /api/olay'a bildirir; sunucu yalnızca gün + sayfa başına ADET tutar,
   kişisel veri kaydedilmez. Statik sayfalardaki assets/kullanim-sayac.js'in
   Next tarafındaki karşılığıdır. */
export default function SayacBeacon() {
  const yol = usePathname();

  useEffect(() => {
    if (!yol) return;
    const veri = JSON.stringify({ olay: "sayfa", detay: yol });
    try {
      const yollandi =
        typeof navigator.sendBeacon === "function" &&
        navigator.sendBeacon("/api/olay", new Blob([veri], { type: "application/json" }));
      if (!yollandi) {
        fetch("/api/olay", {
          method: "POST",
          body: veri,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* sayaç sayfayı asla bozmaz */
    }
  }, [yol]);

  return null;
}
