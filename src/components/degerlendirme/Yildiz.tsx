"use client";

/* 1–5 yıldız girişi. Erişilebilirlik için radio-benzeri buton grubu. */

import { useState } from "react";
import s from "./degerlendirme.module.css";

export default function Yildiz({
  ad,
  deger,
  onDegisim,
  devreDisi,
}: {
  ad: string;
  deger: number;
  onDegisim: (v: number) => void;
  devreDisi?: boolean;
}) {
  const [onizleme, setOnizleme] = useState(0);
  const gosterilen = onizleme || deger;

  return (
    <div className={s.yildizlar} role="radiogroup" aria-label={ad}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={deger === n}
          aria-label={`${n} yıldız`}
          disabled={devreDisi}
          className={`${s.yildiz} ${n <= gosterilen ? s.yildizDolu : ""}`}
          onMouseEnter={() => setOnizleme(n)}
          onMouseLeave={() => setOnizleme(0)}
          onFocus={() => setOnizleme(n)}
          onBlur={() => setOnizleme(0)}
          onClick={() => onDegisim(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
