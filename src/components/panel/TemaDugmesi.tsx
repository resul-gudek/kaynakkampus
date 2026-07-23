"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

/* Tema ancak client'ta bilinebilir; hydration bitene dek nötr ikon gösterilir */
const bosAbone = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    bosAbone,
    () => true,
    () => false,
  );

export default function TemaDugmesi() {
  const { resolvedTheme, setTheme } = useTheme();
  const hazir = useHydrated();
  const koyu = hazir && resolvedTheme === "dark";

  return (
    <button
      type="button"
      className="ustbar-buton"
      onClick={() => setTheme(koyu ? "light" : "dark")}
      title={koyu ? "Açık tema" : "Koyu tema"}
      aria-label={koyu ? "Açık temaya geç" : "Koyu temaya geç"}
    >
      {hazir ? (koyu ? "☀️" : "🌙") : "🌗"}
    </button>
  );
}
