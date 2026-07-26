"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { basvuruDurumGuncelle } from "@/actions/basvuru-admin";
import { BASVURU_DURUMLARI, BASVURU_DURUM_ETIKETLERI } from "@/lib/sabitler";
import ortak from "./detay.module.css";

export default function DurumSecici({ id, durum }: { id: string; durum: string }) {
  const [secili, setSecili] = useState(durum);
  const [mesaj, setMesaj] = useState("");
  const [bekliyor, baslat] = useTransition();
  const router = useRouter();

  function kaydet(yeni: string) {
    setSecili(yeni);
    setMesaj("");
    baslat(async () => {
      const s = await basvuruDurumGuncelle(id, yeni);
      if (s.hata) {
        setMesaj(s.hata);
        setSecili(durum);
        return;
      }
      setMesaj("Durum güncellendi.");
      router.refresh();
    });
  }

  return (
    <div className={ortak.durumSecici}>
      <label>
        <span>Başvuru durumu</span>
        <select value={secili} onChange={(e) => kaydet(e.target.value)} disabled={bekliyor}>
          {BASVURU_DURUMLARI.map((d) => (
            <option key={d} value={d}>
              {BASVURU_DURUM_ETIKETLERI[d]}
            </option>
          ))}
        </select>
      </label>
      <small className={ortak.ipucuNot}>
        ✉️ “Olumlu” veya “Olumsuz” seçildiğinde başvurana (e-postası varsa) son durum bilgisi otomatik gönderilir.
      </small>
      {mesaj && <small className={ortak.kucukBilgi}>{mesaj}</small>}
    </div>
  );
}
