"use client";

/* Bildirim derin bağlantıları: ?sekme=<bolum>&kayit=<id>
   kayit varsa ilgili satıra kaydırıp vurgular (legacy hedefeGit),
   yoksa sekme'ye karşılık gelen bölüme kaydırır. */

import { useEffect } from "react";
import s from "./panel.module.css";

export default function KayitOdagi({ kayit, sekme }: { kayit?: string; sekme?: string }) {
  useEffect(() => {
    if (!kayit && !sekme) return;
    const zaman = setTimeout(() => {
      if (kayit) {
        const satir = document.querySelector(`[data-id="${CSS.escape(kayit)}"]`);
        if (satir) {
          satir.scrollIntoView({ behavior: "smooth", block: "center" });
          satir.classList.add(s.vurgu);
          setTimeout(() => satir.classList.remove(s.vurgu), 3200);
          return;
        }
      }
      if (sekme) {
        document
          .getElementById("bolum-" + sekme)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
    window.history.replaceState(null, "", window.location.pathname);
    return () => clearTimeout(zaman);
  }, [kayit, sekme]);
  return null;
}
