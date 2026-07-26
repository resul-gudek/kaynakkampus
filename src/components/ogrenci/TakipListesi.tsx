"use client";

/* ✅ Haftalık Takip Listem — legacy takipCiz/takipIsaretle birebir */

import { Fragment, useOptimistic, useTransition } from "react";
import { takipDurum } from "@/actions/takip";
import { GUNLER } from "@/lib/sabitler";
import BosDurum from "@/components/maskot/BosDurum";
import type { TakipKaydi } from "./tipler";
import s from "./panel.module.css";

export default function TakipListesi({ takip }: { takip: TakipKaydi[] }) {
  const [, startTransition] = useTransition();
  const [liste, isaretleOptimistik] = useOptimistic(
    takip,
    (mevcut, g: { id: string; tamamlandi: boolean }) =>
      mevcut.map((t) => (t.id === g.id ? { ...t, tamamlandi: g.tamamlandi } : t))
  );

  const sirali = [...liste].sort(
    (a, b) => GUNLER.indexOf(a.gun as (typeof GUNLER)[number]) - GUNLER.indexOf(b.gun as (typeof GUNLER)[number])
  );
  const tamam = sirali.filter((t) => t.tamamlandi).length;

  function takipIsaretle(id: string, tamamlandi: boolean) {
    startTransition(async () => {
      isaretleOptimistik({ id, tamamlandi });
      const sonuc = await takipDurum(id, tamamlandi);
      if (sonuc.hata) alert(sonuc.hata);
    });
  }

  return (
    <section className={s.bolum} id="bolum-takip">
      <div className={s["bolum-bas"]}>
        <h2>✅ Haftalık Takip Listem</h2>
        <span className="tag">{sirali.length ? `${tamam}/${sirali.length} tamamlandı` : "Görev yok"}</span>
      </div>
      {sirali.length ? (
        <div>
          {sirali.map((t, i) => {
            const gunBasi = i === 0 || sirali[i - 1].gun !== t.gun;
            return (
              <Fragment key={t.id}>
                {gunBasi && <div className={s["gun-baslik"]}>📆 {t.gun}</div>}
                <div className={`${s["liste-satir"]} ${t.tamamlandi ? s.tamam : ""}`}>
                  <button
                    className={`${s["onay-kutu"]} ${t.tamamlandi ? s.isaretli : ""}`}
                    title={t.tamamlandi ? "Geri al" : "Tamamlandı olarak işaretle"}
                    onClick={() => takipIsaretle(t.id, !t.tamamlandi)}
                  >
                    {t.tamamlandi ? "✓" : ""}
                  </button>
                  <div className={s["liste-govde"]}>
                    <b>{t.gorev}</b>
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      ) : (
        <BosDurum
          ifade="sakin"
          baslik="Takip listen boş."
          metin="Öğretmenin haftalık görev ekleyince burada görünecek."
        />
      )}
    </section>
  );
}
