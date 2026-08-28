/* Sosyal hesaplar — tek kaynak. Hem üst duyuru şeridi hem alt bilgi
   buradan okur; statik sayfalardaki ikizi public/assets/duyuru-serit.js
   ve alt bilgi işaretlemesidir (adresler ikisinde de aynı olmalı). */

export const SOSYAL_HESAPLAR = [
  { ad: "Instagram", url: "https://www.instagram.com/kaynakkampus" },
  { ad: "TikTok", url: "https://www.tiktok.com/@kaynakkampus" },
  { ad: "Facebook", url: "https://www.facebook.com/share/1F1ie32qbu/" },
] as const;

type Ad = (typeof SOSYAL_HESAPLAR)[number]["ad"];

function Simge({ ad }: { ad: Ad }) {
  if (ad === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="17.3" cy="6.7" r="1.3" fill="currentColor" />
      </svg>
    );
  }
  if (ad === "TikTok") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16.6 3h-3.1v12.3a3.3 3.3 0 1 1-2.9-3.3v-3.1a6.4 6.4 0 1 0 6 6.4V9.6a7.3 7.3 0 0 0 4.2 1.3V7.8a4.2 4.2 0 0 1-4.2-4.2Z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06Z"
      />
    </svg>
  );
}

/** Sosyal hesap bağlantıları. `className` kapsayıcının stilini belirler. */
export default function SosyalIkonlar({ className }: { className?: string }) {
  return (
    <div className={className}>
      {SOSYAL_HESAPLAR.map((h) => (
        <a key={h.ad} href={h.url} target="_blank" rel="noopener noreferrer" aria-label={h.ad}>
          <Simge ad={h.ad} />
        </a>
      ))}
    </div>
  );
}
