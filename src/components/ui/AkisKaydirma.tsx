"use client";

/* ── AKIŞ İÇİ ROTA KAYDIRMASI ────────────────────────────────────────
   Bir aracın kendi içinde rota değiştirerek ilerleyen akışları için
   (etkinlik klasör ağacı gibi). Next varsayılan olarak her rota
   değişiminde sayfayı tepeye çeker; kullanıcı klasöre her girdiğinde
   hero'ya geri gönderilir.

   Kullanım — akışın layout'una bir kez konur, Link'lere scroll={false}
   verilir; kaydırmayı bu bileşen üstlenir:

     <AkisKaydirma hedef={`.${s.govde}`} />

   Davranış (lib/kaydirma.ts kuralları):
     · İlk açılış (yeni sayfaya giriş) → dokunulmaz, sayfa normal
       şekilde yukarıdan başlar.
     · Sonraki rota değişimleri (aynı akış içinde) → çalışma alanının
       başına hizalanır; alan zaten görünüyorsa hiç kımıldanmaz.

   Statik sayfalarda karşılığı yoktur: orada akışlar rota değiştirmediği
   için KKKaydir.hizala() doğrudan çağrılır.
   ------------------------------------------------------------------ */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { hizala } from "@/lib/kaydirma";

export default function AkisKaydirma({ hedef }: { hedef: string }) {
  const yol = usePathname();
  const ilk = useRef(true);

  useEffect(() => {
    if (ilk.current) {
      ilk.current = false; // yeni sayfaya giriş: tarayıcı davranışı kalsın
      return;
    }
    /* Yeni içerik boyandıktan sonra ölç: hedefin gerçek konumu gerekiyor */
    const kare = requestAnimationFrame(() => hizala(hedef));
    return () => cancelAnimationFrame(kare);
  }, [yol, hedef]);

  return null;
}
