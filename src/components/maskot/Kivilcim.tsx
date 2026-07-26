/* 🔥 Kıvılcım — Kaynak Kampüs maskotu.
   Bir illüstrasyon değil rig: gövde sabit, yüz katmanı (gözbebeği, kapak/kaş,
   gaga) ifadeye göre değişir. Dokuz ifadenin hiçbirinde yeni çizim yok.

   <defs>/<use> bilinçli olarak kullanılmadı: aynı sayfada iki maskot
   render edilince id'ler çakışırdı. Tüy şekli doğrudan path olarak basılıyor.

   Sunucu bileşeni — hook yok, olay yok; istemci bileşenlerinden de
   sorunsuz import edilir. */

import s from "./maskot.module.css";

export type Ifade =
  | "sakin"
  | "konusan"
  | "soru"
  | "onay"
  | "odakli"
  | "uzgun"
  | "uyari"
  | "bakisSag"
  | "kutlama";

/** Tüy kaması: taban (0,0), uç (0,-64). Kanat, kuyruk ve sorguç bundan. */
const TUY = "M0 0C7-16 9-40 0-64C-9-40-7-16 0 0Z";

/** Tek yuvarlak gövde kütlesi. */
const GOVDE =
  "M100 64C129 64 152 87 152 116C152 148 129 170 100 170C71 170 48 148 48 116C48 87 71 64 100 64Z";

/** Kapalı gaga; konuşan/kutlama hâlinde iki parçaya ayrılır. */
const GAGA_KAPALI =
  "M91 126C95 125 105 125 109 126C107 134 104 139 100 139C96 139 93 134 91 126Z";
const GAGA_UST =
  "M91 124C95 123 105 123 109 124C107 130 104 133 100 133C96 133 93 130 91 124Z";
const GAGA_ALT =
  "M92 137C96 136 104 136 108 137C106 144 104 148 100 148C96 148 94 144 92 137Z";

type Props = {
  ifade?: Ifade;
  /** Kenar uzunluğu (px). Panelde 44–96 arası, lise ekranlarında 28–40. */
  boyut?: number;
  /** Metin anlamı taşıyorsa maskot dekoratiftir; erişilebilir ad verme. */
  etiket?: string;
  className?: string;
};

export default function Kivilcim({ ifade = "sakin", boyut = 72, etiket, className }: Props) {
  const gagaAcik = ifade === "konusan" || ifade === "kutlama";
  const kanatAcik = ifade === "kutlama";

  return (
    <svg
      className={`${s.kivilcim} ${className ?? ""}`}
      viewBox="0 0 200 200"
      width={boyut}
      height={boyut}
      role={etiket ? "img" : undefined}
      aria-label={etiket}
      aria-hidden={etiket ? undefined : true}
      focusable="false"
    >
      {/* kutlama: kanat yelpazeleri açılır, gövdenin arkasında kalır */}
      {kanatAcik && (
        <>
          <path d={TUY} transform="translate(56,112) rotate(-24) scale(.72)" fill="var(--kv-gul)" />
          <path d={TUY} transform="translate(56,112) rotate(-44) scale(.9)" fill="var(--kv-gul-ac)" />
          <path d={TUY} transform="translate(56,112) rotate(-64) scale(.76)" fill="var(--kv-gul)" />
          <path d={TUY} transform="translate(144,112) rotate(24) scale(.72)" fill="var(--kv-gul)" />
          <path d={TUY} transform="translate(144,112) rotate(44) scale(.9)" fill="var(--kv-gul-ac)" />
          <path d={TUY} transform="translate(144,112) rotate(64) scale(.76)" fill="var(--kv-gul)" />
        </>
      )}

      {/* kuyruk — küçük boyutta anka kimliğini taşıyan detay */}
      <path d={TUY} transform="translate(100,158) rotate(156) scale(.4)" fill="var(--kv-gul)" />
      <path d={TUY} transform="translate(100,158) rotate(180) scale(.5)" fill="var(--kv-gul-ac)" />
      <path d={TUY} transform="translate(100,158) rotate(204) scale(.4)" fill="var(--kv-gul)" />

      {/* kanatlar — gövdenin arkasına saklanmış eğik elipsler */}
      <ellipse cx="58" cy="138" rx="28" ry="19" transform="rotate(-22 58 138)" fill="var(--kv-gul)" />
      <ellipse cx="142" cy="138" rx="28" ry="19" transform="rotate(22 142 138)" fill="var(--kv-gul)" />

      {/* sorguç = kıvılcım; şaşkınlıkta gerilir, üzgünde düşer */}
      <Sorguc ifade={ifade} />

      <path d={GOVDE} fill="var(--kv-govde)" />

      {/* ayaklar */}
      <rect x="74" y="165" width="15" height="12" rx="6" fill="var(--kv-gul-ac)" />
      <rect x="111" y="165" width="15" height="12" rx="6" fill="var(--kv-gul-ac)" />

      {/* ── yüz katmanı ── */}
      <circle cx="81" cy="107" r="16" fill="var(--kv-krem)" />
      <circle cx="119" cy="107" r="16" fill="var(--kv-krem)" />
      <Gozler ifade={ifade} />
      <Kaslar ifade={ifade} />

      {gagaAcik ? (
        <>
          <path d={GAGA_UST} fill="var(--kv-gul-ac)" />
          <path d={GAGA_ALT} fill="var(--kv-gul-ac)" />
        </>
      ) : (
        <path
          d={GAGA_KAPALI}
          transform={ifade === "uzgun" ? "translate(0,2)" : undefined}
          fill="var(--kv-gul-ac)"
        />
      )}
    </svg>
  );
}

/* ── Sorguç ─────────────────────────────────────────────── */
function Sorguc({ ifade }: { ifade: Ifade }) {
  // şaşkın/uyarı: gerilme; üzgün: düşme
  const olcek = ifade === "uyari" || ifade === "soru" ? 1.1 : ifade === "uzgun" ? 0.86 : 1;
  const y = ifade === "uzgun" ? 68 : 64;
  return (
    <g transform={`translate(100,${y}) scale(${olcek})`}>
      <path d={TUY} transform="rotate(-30) scale(.46)" fill="var(--kv-gul)" />
      <path d={TUY} transform="rotate(0) scale(.62)" fill="var(--kv-gul)" />
      <path d={TUY} transform="rotate(30) scale(.46)" fill="var(--kv-gul)" />
    </g>
  );
}

/* ── Gözbebekleri ───────────────────────────────────────── */
function Gozler({ ifade }: { ifade: Ifade }) {
  // kapalı mutlu kavis
  if (ifade === "onay" || ifade === "kutlama") {
    return (
      <>
        <path
          d="M70 108C76 119 86 119 92 108"
          fill="none"
          stroke="var(--kv-koyu)"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <path
          d="M108 108C114 119 124 119 130 108"
          fill="none"
          stroke="var(--kv-koyu)"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
      </>
    );
  }

  // bakış kaydırma + bebek boyutu
  const dx = ifade === "bakisSag" ? 8 : ifade === "soru" ? 1 : 0;
  const dy = ifade === "uzgun" ? 3 : ifade === "odakli" ? 2 : 0;
  const r = ifade === "uyari" ? 6 : ifade === "odakli" ? 7.5 : 8;
  const parlama = ifade !== "uyari" && ifade !== "odakli";

  return (
    <>
      <circle cx={83 + dx} cy={110 + dy} r={r} fill="var(--kv-koyu)" />
      <circle cx={121 + dx} cy={110 + dy} r={r} fill="var(--kv-koyu)" />
      {parlama && (
        <>
          <circle cx={79.4 + dx} cy={106.4 + dy} r="3.2" fill="#fff" />
          <circle cx={117.4 + dx} cy={106.4 + dy} r="3.2" fill="#fff" />
        </>
      )}
    </>
  );
}

/* ── Kapak ve kaşlar — duygunun tamamı burada ───────────── */
function Kaslar({ ifade }: { ifade: Ifade }) {
  const kalem = { fill: "none", stroke: "var(--kv-govde)", strokeWidth: 9, strokeLinecap: "round" as const };

  switch (ifade) {
    case "soru": // tek kaş kalkık
      return (
        <>
          <path d="M64 98C72 90 90 90 98 97" {...kalem} />
          <path d="M104 92C112 88 128 90 136 98" {...kalem} />
        </>
      );
    case "odakli": // yarı kapak
      return (
        <>
          <path d="M65 104A16 16 0 0 1 97 104Z" fill="var(--kv-govde)" />
          <path d="M103 104A16 16 0 0 1 135 104Z" fill="var(--kv-govde)" />
          <path d="M64 100C72 96 90 98 98 104" {...kalem} />
          <path d="M136 100C128 96 110 98 102 104" {...kalem} />
        </>
      );
    case "uzgun": // içe düşen kaş
      return (
        <>
          <path d="M63 90C71 94 89 98 96 104" {...kalem} />
          <path d="M137 90C129 94 111 98 104 104" {...kalem} />
        </>
      );
    case "uyari": // içe çatılan kaş
      return (
        <>
          <path d="M64 92C72 88 90 92 98 100" {...kalem} />
          <path d="M136 92C128 88 110 92 102 100" {...kalem} />
        </>
      );
    default:
      return null;
  }
}
