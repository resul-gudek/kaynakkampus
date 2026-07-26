"use client";

/* 🗺️ Yol Haritam — legacy yolCiz/adimTamamla/adimGeriAl birebir */

import { useOptimistic, useRef, useState, useTransition } from "react";
import { yolTamamla } from "@/actions/yol";
import { xpOzet, yolDurumlu } from "@/lib/hesap";
import BosDurum from "@/components/maskot/BosDurum";
import type { YolKaydi } from "./tipler";
import s from "./panel.module.css";

export default function YolHaritasi({ adimlar }: { adimlar: YolKaydi[] }) {
  const [kutla, setKutla] = useState("");
  const [, startTransition] = useTransition();
  const kutlaZaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [liste, isaretle] = useOptimistic(
    adimlar,
    (mevcut, g: { id: string; tamamlandi: boolean }) =>
      mevcut.map((a) => (a.id === g.id ? { ...a, tamamlandi: g.tamamlandi } : a))
  );

  const oz = xpOzet(liste);
  const durumlu = yolDurumlu(liste);
  const tamamlananlar = durumlu.filter((a) => a.durum === "tamamlandi");
  const sonTamamlanan = tamamlananlar.length ? tamamlananlar[tamamlananlar.length - 1] : null;

  function adimTamamla(id: string, xp: number) {
    startTransition(async () => {
      isaretle({ id, tamamlandi: true });
      if (kutlaZaman.current) clearTimeout(kutlaZaman.current);
      setKutla(`🎉 Harika! +${xp} XP kazandın. Sıradaki adım açıldı, böyle devam!`);
      kutlaZaman.current = setTimeout(() => setKutla(""), 4000);
      const sonuc = await yolTamamla(id, true);
      if (sonuc.hata) {
        setKutla("");
        alert(sonuc.hata);
      }
    });
  }

  function adimGeriAl(id: string) {
    startTransition(async () => {
      isaretle({ id, tamamlandi: false });
      setKutla("");
      const sonuc = await yolTamamla(id, false);
      if (sonuc.hata) alert(sonuc.hata);
    });
  }

  return (
    <section className={s.bolum} id="bolum-yol">
      <div className={s["bolum-bas"]}>
        <h2>🗺️ Yol Haritam</h2>
        <span className="tag">
          {durumlu.length ? `${oz.tamamlanan}/${oz.toplam} adım · %${oz.yuzde}` : "Henüz adım yok"}
        </span>
      </div>

      <div className={s["yol-ust"]}>
        <div className={s["seviye-rozet"]}>
          <small>SEVİYE</small>
          <b>{oz.seviye}</b>
        </div>
        <div className={s["xp-alan"]}>
          <div className={s["xp-etiket"]}>
            <span>⭐ {oz.xp} XP</span>
            <span>Sonraki seviye: {100 - oz.seviyeIci} XP</span>
          </div>
          <div className={s["xp-bar"]}>
            <i style={{ width: `${oz.seviyeIci}%` }} />
          </div>
        </div>
        <div className={s["rozet-seridi"]}>
          {oz.rozetler.length ? (
            oz.rozetler.map((r) => (
              <span key={r.ad} className={s.rozet}>
                {r.ikon} {r.ad}
              </span>
            ))
          ) : (
            <span className={s.rozet} style={{ opacity: 0.55 }}>
              🎖 İlk rozetin için ilk adımı tamamla!
            </span>
          )}
        </div>
      </div>

      <p className={`${s.kutla} ${kutla ? s.goster : ""}`}>{kutla}</p>

      {durumlu.length ? (
        <div className={s["yol-hat"]}>
          {durumlu.map((a) => (
            <div key={a.id} className={`${s["yol-adim"]} ${s[yolSinif(a.durum)]}`}>
              <div className={s["yol-nokta"]}>
                {a.durum === "tamamlandi" ? "✓" : a.durum === "aktif" ? a.sira : "🔒"}
              </div>
              <div className={s["yol-kart"]}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <b>
                    {a.ders} – {a.konu}
                  </b>
                  <span className={s["xp-cip"]}>⭐ {a.xp || 50} XP</span>
                </div>
                <p>{a.hedef || ""}</p>
                {a.durum === "aktif" && (
                  <button
                    className="btn btn-primary btn-kucuk"
                    style={{ marginTop: 10 }}
                    onClick={() => adimTamamla(a.id, a.xp || 50)}
                  >
                    Bu adımı tamamladım 🎉
                  </button>
                )}
                {a.durum === "tamamlandi" && sonTamamlanan && a.id === sonTamamlanan.id && (
                  <button
                    className="btn btn-outline btn-kucuk"
                    style={{ marginTop: 10 }}
                    onClick={() => adimGeriAl(a.id)}
                  >
                    Geri al
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <BosDurum
          ifade="bakisSag"
          baslik="Yol haritan henüz hazır değil."
          metin="Öğretmenin adımları oluşturunca ilerlemen burada görünecek."
        />
      )}
    </section>
  );
}

function yolSinif(durum: "tamamlandi" | "aktif" | "kilitli"): string {
  return durum === "tamamlandi" ? "tamam" : durum;
}
