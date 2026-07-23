"use client";

/* 🗺️ Yol Haritası sekmesi (öğretmen görünümü) — legacy yolCiz / yolForm / yolSil. */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { XpOzet } from "@/lib/hesap";
import { yolEkle, yolSil } from "@/actions/yol";
import type { YolS } from "./tipler";
import s from "./koc.module.css";

const ADIM_SINIF = {
  tamamlandi: s.adimTamamlandi,
  aktif: s.adimAktif,
  kilitli: s.adimKilitli,
};

interface Props {
  ogrenciId: string;
  adimlar: YolS[];
  ozet: XpOzet;
}

export default function YolSekmesi({ ogrenciId, adimlar, ozet }: Props) {
  const router = useRouter();
  const [bekliyor, baslat] = useTransition();

  function gonder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    baslat(async () => {
      const sonuc = await yolEkle({
        ogrenciId,
        ders: String(fd.get("ders") ?? "").trim(),
        konu: String(fd.get("konu") ?? "").trim(),
        hedef: String(fd.get("hedef") ?? "").trim(),
        xp: +String(fd.get("xp") ?? "") || 50,
      });
      if (sonuc.hata) alert(sonuc.hata);
      else {
        form.reset();
        router.refresh();
      }
    });
  }

  function sil(id: string) {
    if (!confirm("Bu adım silinsin mi?")) return;
    baslat(async () => {
      const sonuc = await yolSil(id);
      if (sonuc.hata) alert(sonuc.hata);
      else router.refresh();
    });
  }

  return (
    <div>
      <div className={s.yolOzet}>
        <span>
          🏅 Seviye <b>{ozet.seviye}</b>
        </span>
        <span>
          ⭐ <b>{ozet.xp} XP</b>
        </span>
        <span>
          📍 <b>{ozet.tamamlanan}/{ozet.toplam}</b> adım tamamlandı (<b>%{ozet.yuzde}</b>)
        </span>
        {ozet.rozetler.map((r, i) => (
          <span key={i} className="tag">
            {r.ikon} {r.ad}
          </span>
        ))}
      </div>

      <form className={s.kutuForm} onSubmit={gonder}>
        <div className={s.formIzgara}>
          <div className={s.formGrup}>
            <label>Ders</label>
            <input name="ders" required placeholder="Örn. Matematik" />
          </div>
          <div className={s.formGrup}>
            <label>Konu</label>
            <input name="konu" required placeholder="Örn. Rasyonel Sayılar" />
          </div>
          <div className={s.formGrup}>
            <label>Hedef / Görev</label>
            <input name="hedef" placeholder="Örn. Konu tekrarı + 50 soru" />
          </div>
          <div className={s.formGrup}>
            <label>XP Ödülü</label>
            <input name="xp" type="number" min={10} step={10} defaultValue={50} />
          </div>
        </div>
        <div className={s.formAlt}>
          <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
            Adım Ekle
          </button>
          <span className={s.formNot}>
            Adımlar sırayla açılır: öğrenci bir adımı bitirmeden sonraki kilitli kalır.
          </span>
        </div>
      </form>

      {adimlar.length ? (
        adimlar.map((a) => (
          <div key={a.id} className={`${s.listeSatir} ${a.durum === "tamamlandi" ? s.tamam : ""}`}>
            <div className={`${s.adimNo} ${ADIM_SINIF[a.durum]}`}>
              {a.durum === "tamamlandi" ? "✓" : a.durum === "aktif" ? a.sira : "🔒"}
            </div>
            <div className={s.listeGovde}>
              <b>
                {a.ders} – {a.konu}
              </b>
              {a.hedef && <p>{a.hedef}</p>}
              <div className={s.listeMeta}>
                <span className="tag">⭐ {a.xp || 50} XP</span>
                <span
                  className={`${s.durumRozet} ${a.durum === "tamamlandi" ? s.durumTamam : s.durumBekliyor}`}
                >
                  {a.durum === "tamamlandi"
                    ? "✓ Tamamlandı"
                    : a.durum === "aktif"
                      ? "⭐ Öğrencinin sıradaki adımı"
                      : "🔒 Kilitli"}
                </span>
              </div>
            </div>
            <button
              type="button"
              className={s.silBtn}
              title="Adımı sil"
              disabled={bekliyor}
              onClick={() => sil(a.id)}
            >
              ✕
            </button>
          </div>
        ))
      ) : (
        <p className={s.bosMesaj}>
          Bu öğrenci için henüz yol haritası yok. Konu konu adımlar ekleyerek oyunlaştırılmış bir
          rota oluştur.
        </p>
      )}
    </div>
  );
}
