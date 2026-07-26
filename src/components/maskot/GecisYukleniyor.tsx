"use client";

/* Sayfa geçişi bekleme durumu — Kıvılcım'ın rota sınırlarındaki hâli.
   Next'in loading.tsx sınırlarından çağrılır.

   Maskot kuralı burada bir gerilim yaratıyor: maskot "sürtünme anında"
   görünmeli, ama panel geçişlerinin çoğu 200 ms'nin altında bitiyor —
   o pencerede görünen maskot yanıp sönen bir dekordan öteye geçmez.
   Çözüm: bileşen ilk `gecikme` ms boyunca bilinçli olarak boş kalıyor.
   Hızlı geçişte Kıvılcım hiç sahneye çıkmaz; yalnızca bekleme gerçekten
   sürtünmeye dönüştüğünde belirir.

   Hareket dağılımı da kurala göre: maskot tek seferlik 260 ms giriş
   hareketi yapıp durur, "hâlâ çalışıyor" sinyalini altındaki ince iz
   taşır. Dönen/zıplayan maskot yok.

   Anlamı metin taşıyor (role="status"); maskot dekoratif. */

import { useEffect, useState } from "react";
import Kivilcim from "./Kivilcim";
import s from "./maskot.module.css";

type Props = {
  /** Tek cümle, nokta koymadan — ekranda "…" ile tamamlanıyor. */
  baslik?: string;
  /** Bu süreden kısa geçişlerde maskot hiç görünmez (ms). */
  gecikme?: number;
  /** Kabuk dışı tam sayfa geçişleri için dikey ortalama. */
  tam?: boolean;
  boyut?: number;
};

/** Bekleme bunu geçerse Kıvılcım'ın ifadesi değişip ikinci cümle gelir. */
const UZUN_ESIK = 6000;

type Asama = "gizli" | "gorunur" | "uzun";

export default function GecisYukleniyor({
  baslik = "Sayfa hazırlanıyor",
  gecikme = 400,
  tam = false,
  boyut = 64,
}: Props) {
  const [asama, setAsama] = useState<Asama>("gizli");

  useEffect(() => {
    const acilis = setTimeout(() => setAsama("gorunur"), gecikme);
    const uzama = setTimeout(() => setAsama("uzun"), gecikme + UZUN_ESIK);
    return () => {
      clearTimeout(acilis);
      clearTimeout(uzama);
    };
  }, [gecikme]);

  /* Dış kap her zaman basılıyor: canlı bölge metin gelmeden önce
     kayıtlı olsun ki ekran okuyucu değişimi duyurabilsin. */
  return (
    <div
      className={`${s.gecis} ${tam ? s.gecisTam : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {asama !== "gizli" && (
        <div className={s.gecisIc}>
          <Kivilcim ifade={asama === "uzun" ? "soru" : "odakli"} boyut={boyut} />
          <p className={s.gecisMetin}>{baslik}…</p>
          {asama === "uzun" && <p className={s.gecisNot}>Bu biraz uzun sürüyor.</p>}
          <span className={s.gecisIz} aria-hidden="true">
            <i />
          </span>
        </div>
      )}
    </div>
  );
}
