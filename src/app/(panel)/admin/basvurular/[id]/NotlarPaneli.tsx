"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { basvuruNotEkle, basvuruNotSil } from "@/actions/basvuru-admin";
import ortak from "./detay.module.css";

interface Not {
  id: string;
  metin: string;
  yazarAd: string;
  olusturma: string; // önceden biçimlenmiş
}

export default function NotlarPaneli({ basvuruId, notlar }: { basvuruId: string; notlar: Not[] }) {
  const [metin, setMetin] = useState("");
  const [hata, setHata] = useState("");
  const [bekliyor, baslat] = useTransition();
  const router = useRouter();

  function ekle() {
    if (!metin.trim()) return;
    setHata("");
    baslat(async () => {
      const s = await basvuruNotEkle({ basvuruId, metin });
      if (s.hata) return setHata(s.hata);
      setMetin("");
      router.refresh();
    });
  }
  function sil(id: string) {
    baslat(async () => {
      const s = await basvuruNotSil(id);
      if (s.hata) return setHata(s.hata);
      router.refresh();
    });
  }

  return (
    <div>
      <p className={ortak.gizliUyari}>🔒 Notlar yalnız yönetim tarafından görülür.</p>
      <div className={ortak.notEkle}>
        <textarea
          rows={2}
          value={metin}
          placeholder="Örn. Özgeçmişi uygun. Örnek ders videosu istenecek."
          onChange={(e) => setMetin(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-primary btn-kucuk"
          onClick={ekle}
          disabled={bekliyor || !metin.trim()}
        >
          {bekliyor ? "…" : "Not Ekle"}
        </button>
      </div>
      {hata && <small className={ortak.hata}>{hata}</small>}

      <ul className={ortak.notListe}>
        {notlar.map((n) => (
          <li key={n.id}>
            <div>
              <p>{n.metin}</p>
              <small>
                {n.yazarAd || "Yönetici"} · {n.olusturma}
              </small>
            </div>
            <button type="button" className={ortak.notSil} onClick={() => sil(n.id)} aria-label="Notu sil">
              ✕
            </button>
          </li>
        ))}
        {notlar.length === 0 && <li className={ortak.bosNot}>Henüz not eklenmedi.</li>}
      </ul>
    </div>
  );
}
