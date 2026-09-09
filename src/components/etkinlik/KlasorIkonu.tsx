/* Klasör ikonu — emoji DEĞİL, satır içi SVG.

   Emoji (🗂) renkli emoji yazı tipi olmayan ortamlarda (kimi Linux
   sunucu/tarayıcı, eski Android) gri kutu olarak çizilir; kart görselinin
   tamamı ona dayandığı için bu kabul edilemez. SVG her yerde aynı görünür
   ve renk `currentColor`'dan gelir. */
export default function KlasorIkonu({
  boyut = 64,
  className,
}: {
  boyut?: number;
  className?: string;
}) {
  return (
    <svg
      width={boyut}
      height={boyut}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Arka sekme */}
      <path
        d="M6 16a4 4 0 0 1 4-4h13.2a4 4 0 0 1 2.9 1.24l3.3 3.46a4 4 0 0 0 2.9 1.24H54a4 4 0 0 1 4 4v6H6V16Z"
        fill="currentColor"
        opacity=".55"
      />
      {/* Gövde */}
      <path
        d="M6 24a4 4 0 0 1 4-4h44a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V24Z"
        fill="currentColor"
      />
      {/* Üstte ince ışık şeridi — düz dolgu yerine hafif derinlik */}
      <rect x="6" y="24" width="52" height="3" rx="1.5" fill="#fff" opacity=".22" />
    </svg>
  );
}
