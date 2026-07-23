"use client";

/* 📘 Ödevler sekmesi — legacy odevCiz / odevForm / odevSil.
   Ek olarak koç ödev durumunu değiştirebilir (odevDurum aksiyonu). */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { tarihStr } from "@/lib/hesap";
import { odevEkle, odevSil, odevDurum } from "@/actions/odev";
import { useVurgu } from "./vurgu";
import type { OdevS } from "./tipler";
import s from "./koc.module.css";

interface Props {
  ogrenciId: string;
  odevler: OdevS[];
  vurguId?: string;
}

export default function OdevSekmesi({ ogrenciId, odevler, vurguId }: Props) {
  const router = useRouter();
  const [bekliyor, baslat] = useTransition();
  const vurgu = useVurgu(vurguId);

  const liste = [...odevler].sort(
    (a, b) =>
      +(a.durum === "tamamlandi") - +(b.durum === "tamamlandi") ||
      a.sonTarih.localeCompare(b.sonTarih)
  );

  function gonder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    baslat(async () => {
      const sonuc = await odevEkle({
        ogrenciId,
        ders: String(fd.get("ders") ?? "").trim(),
        konu: String(fd.get("konu") ?? "").trim(),
        kaynak: String(fd.get("kaynak") ?? "").trim(),
        soruSayisi: +String(fd.get("soru") ?? "") || null,
        sonTarih: String(fd.get("tarih") ?? ""),
        aciklama: String(fd.get("aciklama") ?? "").trim(),
      });
      if (sonuc.hata) alert(sonuc.hata);
      else {
        form.reset();
        router.refresh();
      }
    });
  }

  function sil(id: string) {
    if (!confirm("Bu ödev silinsin mi?")) return;
    baslat(async () => {
      const sonuc = await odevSil(id);
      if (sonuc.hata) alert(sonuc.hata);
      else router.refresh();
    });
  }

  function durumDegis(o: OdevS) {
    baslat(async () => {
      const sonuc = await odevDurum(o.id, o.durum === "tamamlandi" ? "bekliyor" : "tamamlandi");
      if (sonuc.hata) alert(sonuc.hata);
      else router.refresh();
    });
  }

  return (
    <div>
      <form className={s.kutuForm} onSubmit={gonder}>
        <div className={s.formIzgara}>
          <div className={s.formGrup}>
            <label>Ders</label>
            <input name="ders" required placeholder="Örn. Matematik" />
          </div>
          <div className={s.formGrup}>
            <label>Konu</label>
            <input name="konu" required placeholder="Örn. Limit" />
          </div>
          <div className={s.formGrup}>
            <label>Kaynak</label>
            <input name="kaynak" placeholder="Örn. Karekök AYT" />
          </div>
          <div className={s.formGrup}>
            <label>Soru Sayısı</label>
            <input name="soru" type="number" min={0} placeholder="40" />
          </div>
          <div className={s.formGrup}>
            <label>Son Tarih</label>
            <input name="tarih" type="date" required />
          </div>
        </div>
        <div className={s.formGrup} style={{ marginBottom: 12 }}>
          <label>Açıklama</label>
          <textarea name="aciklama" rows={2} placeholder="Öğrenciye not..." />
        </div>
        <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
          Ödevi Ver
        </button>
      </form>

      {liste.length ? (
        liste.map((o) => (
          <div
            key={o.id}
            data-kayit={o.id}
            className={`${s.listeSatir} ${o.durum === "tamamlandi" ? s.tamam : ""} ${vurgu === o.id ? s.vurgu : ""}`}
          >
            <div className={s.listeGovde}>
              <b>
                {o.ders} – {o.konu}
              </b>
              {o.aciklama && <p>{o.aciklama}</p>}
              <div className={s.listeMeta}>
                <span
                  className={`${s.durumRozet} ${o.durum === "tamamlandi" ? s.durumTamam : s.durumBekliyor}`}
                >
                  {o.durum === "tamamlandi" ? "✓ Tamamlandı" : "⏳ Bekliyor"}
                </span>
                {o.kaynak && <span className="tag">📕 {o.kaynak}</span>}
                {!!o.soruSayisi && <span className="tag">{o.soruSayisi} soru</span>}
                <span className="tag">📅 Son: {tarihStr(o.sonTarih) || "—"}</span>
              </div>
              <div className={s.satirButonlar}>
                <button
                  type="button"
                  className="btn btn-outline btn-kucuk"
                  disabled={bekliyor}
                  onClick={() => durumDegis(o)}
                >
                  {o.durum === "tamamlandi" ? "↩ Bekliyor Yap" : "✓ Tamamlandı İşaretle"}
                </button>
              </div>
            </div>
            <button
              type="button"
              className={s.silBtn}
              title="Ödevi sil"
              disabled={bekliyor}
              onClick={() => sil(o.id)}
            >
              ✕
            </button>
          </div>
        ))
      ) : (
        <p className={s.bosMesaj}>Bu öğrenciye henüz ödev verilmedi.</p>
      )}
    </div>
  );
}
