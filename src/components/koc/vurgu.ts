"use client";

import { useEffect, useState } from "react";

/** Bildirim derin bağlantısıyla (?kayit=) gelinen kaydı vurgular ve ona kaydırır.
    Legacy hedefeGit(): satıra kaydır + "vurgu" sınıfı + 3.2 sn sonra kaldır +
    URL'den kayit parametresini temizle (yenilemede tekrar atlamasın). */
export function useVurgu(kayitId?: string) {
  const [aktif, setAktif] = useState(kayitId ?? "");
  const [onceki, setOnceki] = useState(kayitId);
  /* kayitId değişince vurguyu render sırasında güncelle (effect'te setState yok) */
  if (kayitId !== onceki) {
    setOnceki(kayitId);
    if (kayitId) setAktif(kayitId);
  }

  useEffect(() => {
    if (!kayitId) return;
    const el = document.querySelector(`[data-kayit="${kayitId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const url = new URL(window.location.href);
    if (url.searchParams.has("kayit")) {
      url.searchParams.delete("kayit");
      window.history.replaceState(null, "", url.pathname + "?" + url.searchParams.toString());
    }
    const zaman = setTimeout(() => setAktif(""), 3200);
    return () => clearTimeout(zaman);
  }, [kayitId]);

  return aktif;
}
