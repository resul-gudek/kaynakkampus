"use client";

import { useState, useTransition } from "react";
import { veliRaporGonder } from "@/actions/veli";

/** Koçun öğrenci detayında velisine anlık ilerleme raporu göndermesini sağlar. */
export default function VeliRaporButonu({ ogrenciId }: { ogrenciId: string }) {
  const [bekliyor, baslat] = useTransition();
  const [mesaj, setMesaj] = useState<{ hata?: string; tamam?: boolean }>({});

  return (
    <span className="veli-rapor-buton">
      <button
        type="button"
        className="btn btn-outline btn-kucuk"
        disabled={bekliyor}
        title="Velinin e-posta adresine haftalık ilerleme raporu gönderir"
        onClick={() => {
          setMesaj({});
          baslat(async () => {
            const s = await veliRaporGonder(ogrenciId);
            setMesaj(s.hata ? { hata: s.hata } : { tamam: true });
          });
        }}
      >
        {bekliyor ? "Gönderiliyor…" : "📊 Veliye Rapor Gönder"}
      </button>
      {mesaj.tamam && <small style={{ color: "var(--yesil)" }}>Rapor kuyruğa eklendi ✓</small>}
      {mesaj.hata && <small style={{ color: "#dc2626" }}>{mesaj.hata}</small>}
    </span>
  );
}
