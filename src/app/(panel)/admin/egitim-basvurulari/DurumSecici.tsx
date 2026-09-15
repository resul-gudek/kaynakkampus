"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { egitimBasvuruDurumGuncelle } from "@/actions/egitim-basvurusu-admin";
import { EGITIM_BASVURU_DURUMLARI, EGITIM_BASVURU_DURUM_ETIKETLERI } from "@/lib/egitim-basvurusu";
import stil from "./egitim-basvurulari.module.css";

/** Başvuru durumu seçici — listede satır içi, detayda büyük hâliyle kullanılır. */
export default function DurumSecici({ id, durum, buyuk }: { id: string; durum: string; buyuk?: boolean }) {
  const [secili, setSecili] = useState(durum);
  const [mesaj, setMesaj] = useState<{ tur: "tamam" | "hata"; metin: string } | null>(null);
  const [bekliyor, baslat] = useTransition();
  const router = useRouter();

  function kaydet(yeni: string) {
    setSecili(yeni);
    setMesaj(null);
    baslat(async () => {
      const s = await egitimBasvuruDurumGuncelle(id, yeni);
      if (s.hata) {
        setMesaj({ tur: "hata", metin: s.hata });
        setSecili(durum);
        return;
      }
      setMesaj({ tur: "tamam", metin: "Güncellendi" });
      router.refresh();
    });
  }

  return (
    <div className={`${stil.durumSecici} ${buyuk ? stil.durumBuyuk : ""}`}>
      <select
        aria-label="Başvuru durumu"
        value={secili}
        onChange={(e) => kaydet(e.target.value)}
        disabled={bekliyor}
      >
        {EGITIM_BASVURU_DURUMLARI.map((d) => (
          <option key={d} value={d}>
            {EGITIM_BASVURU_DURUM_ETIKETLERI[d]}
          </option>
        ))}
      </select>
      {mesaj && (
        <small className={`${stil.durumNot} ${mesaj.tur === "tamam" ? stil.durumTamam : stil.durumHata}`} role="status">
          {mesaj.metin}
        </small>
      )}
    </div>
  );
}
