"use client";

/* 📘 Ödevlerim — legacy odevCiz/odevIsaretle birebir */

import { useOptimistic, useTransition } from "react";
import { odevDurum } from "@/actions/odev";
import { bugun, isoTarih, tarihStr } from "@/lib/hesap";
import type { OdevKaydi } from "./tipler";
import s from "./panel.module.css";

export default function OdevListesi({ odevler }: { odevler: OdevKaydi[] }) {
  const [, startTransition] = useTransition();
  const [liste, isaretleOptimistik] = useOptimistic(
    odevler,
    (mevcut, g: { id: string; durum: string }) =>
      mevcut.map((o) => (o.id === g.id ? { ...o, durum: g.durum } : o))
  );

  const sirali = [...liste].sort(
    (a, b) =>
      Number(a.durum === "tamamlandi") - Number(b.durum === "tamamlandi") ||
      sonTarihAnahtar(a).localeCompare(sonTarihAnahtar(b))
  );
  const bekleyen = sirali.filter((o) => o.durum === "bekliyor").length;
  const simdi = bugun();

  function odevIsaretle(id: string, durum: string) {
    startTransition(async () => {
      isaretleOptimistik({ id, durum });
      const sonuc = await odevDurum(id, durum);
      if (sonuc.hata) alert(sonuc.hata);
    });
  }

  return (
    <section className={s.bolum} id="bolum-odev">
      <div className={s["bolum-bas"]}>
        <h2>📘 Ödevlerim</h2>
        <span className="tag">
          {sirali.length ? `${bekleyen} bekleyen / ${sirali.length} toplam` : "Ödev yok"}
        </span>
      </div>
      {sirali.length ? (
        sirali.map((o) => {
          const tamam = o.durum === "tamamlandi";
          const gecikti = o.durum === "bekliyor" && !!o.sonTarih && isoTarih(o.sonTarih) < simdi;
          return (
            <div key={o.id} className={`${s["liste-satir"]} ${tamam ? s.tamam : ""}`} data-id={o.id}>
              <button
                className={`${s["onay-kutu"]} ${tamam ? s.isaretli : ""}`}
                title={tamam ? "Geri al" : "Tamamlandı olarak işaretle"}
                onClick={() => odevIsaretle(o.id, tamam ? "bekliyor" : "tamamlandi")}
              >
                {tamam ? "✓" : ""}
              </button>
              <div className={s["liste-govde"]}>
                <b>
                  {o.ders} – {o.konu}
                </b>
                <p>{o.aciklama || ""}</p>
                <div className={s["liste-meta"]}>
                  {gecikti && <span className={`${s["durum-rozet"]} ${s.gecikti}`}>⚠ Süresi geçti</span>}
                  {o.kaynak && <span className="tag">📕 {o.kaynak}</span>}
                  {!!o.soruSayisi && <span className="tag">{o.soruSayisi} soru</span>}
                  {!!o.sonTarih && <span className="tag">📅 Son: {tarihStr(o.sonTarih)}</span>}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <p className={s["bos-mesaj"]}>Öğretmenin henüz ödev vermedi. 🎉</p>
      )}
    </section>
  );
}

function sonTarihAnahtar(o: OdevKaydi): string {
  return o.sonTarih ? isoTarih(o.sonTarih) : "9999-99-99";
}
