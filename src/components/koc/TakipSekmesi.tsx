"use client";

/* ✅ Takip Listesi sekmesi — legacy takipCiz / takipForm / takipSil.
   Ek olarak koç görevi tamamlandı/bekliyor yapabilir (takipDurum aksiyonu). */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { GUNLER } from "@/lib/sabitler";
import { takipEkle, takipSil, takipDurum } from "@/actions/takip";
import type { TakipS } from "./tipler";
import s from "./koc.module.css";

interface Props {
  ogrenciId: string;
  gorevler: TakipS[];
}

export default function TakipSekmesi({ ogrenciId, gorevler }: Props) {
  const router = useRouter();
  const [bekliyor, baslat] = useTransition();

  const liste = [...gorevler].sort(
    (a, b) => GUNLER.indexOf(a.gun as (typeof GUNLER)[number]) - GUNLER.indexOf(b.gun as (typeof GUNLER)[number])
  );

  function gonder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    baslat(async () => {
      const sonuc = await takipEkle({
        ogrenciId,
        gun: String(fd.get("gun") ?? ""),
        gorev: String(fd.get("gorev") ?? "").trim(),
      });
      if (sonuc.hata) alert(sonuc.hata);
      else {
        form.reset();
        router.refresh();
      }
    });
  }

  function sil(id: string) {
    if (!confirm("Bu görev silinsin mi?")) return;
    baslat(async () => {
      const sonuc = await takipSil(id);
      if (sonuc.hata) alert(sonuc.hata);
      else router.refresh();
    });
  }

  function durumDegis(t: TakipS) {
    baslat(async () => {
      const sonuc = await takipDurum(t.id, !t.tamamlandi);
      if (sonuc.hata) alert(sonuc.hata);
      else router.refresh();
    });
  }

  return (
    <div>
      <form className={s.kutuForm} onSubmit={gonder}>
        <div className={s.formIzgara}>
          <div className={s.formGrup}>
            <label>Gün</label>
            <select name="gun" defaultValue="Pazartesi">
              {GUNLER.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className={s.formGrup} style={{ gridColumn: "span 2" }}>
            <label>Görev</label>
            <input name="gorev" required placeholder="Örn. TYT Türkçe: 30 paragraf sorusu" />
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
          Takip Listesine Ekle
        </button>
      </form>

      {liste.length ? (
        liste.map((t) => (
          <div key={t.id} className={`${s.listeSatir} ${t.tamamlandi ? s.tamam : ""}`}>
            <div className={s.listeGovde}>
              <b>{t.gorev}</b>
              <div className={s.listeMeta}>
                <span className="tag">📆 {t.gun}</span>
                <span className={`${s.durumRozet} ${t.tamamlandi ? s.durumTamam : s.durumBekliyor}`}>
                  {t.tamamlandi ? "✓ Öğrenci tamamladı" : "⏳ Bekliyor"}
                </span>
              </div>
              <div className={s.satirButonlar}>
                <button
                  type="button"
                  className="btn btn-outline btn-kucuk"
                  disabled={bekliyor}
                  onClick={() => durumDegis(t)}
                >
                  {t.tamamlandi ? "↩ Bekliyor Yap" : "✓ Tamamlandı İşaretle"}
                </button>
              </div>
            </div>
            <button
              type="button"
              className={s.silBtn}
              title="Görevi sil"
              disabled={bekliyor}
              onClick={() => sil(t.id)}
            >
              ✕
            </button>
          </div>
        ))
      ) : (
        <p className={s.bosMesaj}>Takip listesi boş. Haftalık görevleri buradan ekleyebilirsin.</p>
      )}
    </div>
  );
}
