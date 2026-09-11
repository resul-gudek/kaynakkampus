"use client";

/* ── KAYDIRMA KATMANI ────────────────────────────────────────────────
   Kök layout'ta bir kez monte edilir ve site genelinde iki şeyi kurar:

     1. --kk-yapiskan-ust: yapışkan/sabit üst barın ÖLÇÜLEN yüksekliği.
        globals.css bunu html { scroll-padding-top } olarak kullanır, bu
        sayede #bağlantı sıçramaları ve scrollIntoView çağrıları başlığın
        altına oturur — üst bar artık içeriği örtmez. Sabit pixel yok:
        telefon, tablet ve akıllı tahtada aynı kod doğru sonucu verir.

     2. href="#" güvenlik ağı: yer tutucu bağlantılar sayfayı tepeye
        fırlatmasın. Gerçek hedefi olan (#bolum) bağlantılara dokunulmaz.

   Adım/akış hizalaması bu bileşenin işi değildir; onu çağıran taraf
   @/lib/kaydirma içindeki hizala() / gorunurKil() ile yapar.
   Statik sayfalardaki karşılığı: public/assets/kk-kaydir.js.
   ------------------------------------------------------------------ */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { olc } from "@/lib/kaydirma";

export default function KaydirmaKatmani() {
  const yol = usePathname();

  useEffect(() => {
    /* Rota değiştiğinde üst bar yüksekliği değişebilir (site başlığı ↔
       panel üst barı), yerleşim oturduktan sonra yeniden ölçülür. */
    const kare = requestAnimationFrame(() => olc());
    return () => cancelAnimationFrame(kare);
  }, [yol]);

  useEffect(() => {
    const tikla = (e: MouseEvent) => {
      const hedef = e.target as HTMLElement | null;
      if (hedef?.closest?.('a[href="#"]')) e.preventDefault();
    };
    document.addEventListener("click", tikla);
    return () => document.removeEventListener("click", tikla);
  }, []);

  return null;
}
