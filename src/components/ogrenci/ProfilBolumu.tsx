"use client";

/* 🎯 Başlangıç Seviye Formum — legacy profilCiz/profilFormDoldur/profilDersSatirlari birebir */

import { useState, useTransition, type FormEvent } from "react";
import { profilKaydet } from "@/actions/ogrenci";
import { bugun, tarihStr, type Profil } from "@/lib/hesap";
import { PROFIL_DERSLERI, SEVIYELER } from "@/lib/sabitler";
import { konulariAyir } from "./tipler";
import s from "./panel.module.css";

interface DersGirdi {
  seviye: string;
  bilinen: string;
  eksik: string;
}

function formDegerleri(profil: Profil | null) {
  const dersler: Record<string, DersGirdi> = {};
  (profil?.dersler || []).forEach((d) => {
    dersler[d.ders] = {
      seviye: d.seviye,
      bilinen: (d.bilinen || []).join(", "),
      eksik: (d.eksik || []).join(", "),
    };
  });
  return {
    sinav: profil?.sinav === "LGS" ? "LGS" : "YKS",
    saat: profil?.gunlukSaat ? String(profil.gunlukSaat) : "",
    notlar: profil?.notlar || "",
    dersler,
  };
}

export default function ProfilBolumu({ ogrenciId, profil }: { ogrenciId: string; profil: Profil | null }) {
  const [acik, setAcik] = useState(!profil);
  const [bekliyor, startTransition] = useTransition();
  const [sinav, setSinav] = useState(() => formDegerleri(profil).sinav);
  const [saat, setSaat] = useState(() => formDegerleri(profil).saat);
  const [notlar, setNotlar] = useState(() => formDegerleri(profil).notlar);
  const [dersler, setDersler] = useState<Record<string, DersGirdi>>(() => formDegerleri(profil).dersler);

  const seciliDersler = PROFIL_DERSLERI[sinav] || [];

  function dersDegeri(ders: string): DersGirdi {
    return dersler[ders] || { seviye: "Zayıf", bilinen: "", eksik: "" };
  }

  function dersGuncelle(ders: string, alan: keyof DersGirdi, deger: string) {
    setDersler((d) => ({ ...d, [ders]: { ...dersDegeri(ders), [alan]: deger } }));
  }

  /* Formu kayıtlı profil değerleriyle önden doldurur (yalnızca form açılırken) */
  function formAc() {
    if (!acik) {
      const d = formDegerleri(profil);
      setSinav(d.sinav);
      setSaat(d.saat);
      setNotlar(d.notlar);
      setDersler(d.dersler);
    }
    setAcik((a) => !a);
  }

  function kaydet(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const sonuc = await profilKaydet(ogrenciId, {
        sinav,
        gunlukSaat: +saat || 0,
        tarih: bugun(),
        notlar: notlar.trim(),
        dersler: seciliDersler.map((ders) => {
          const d = dersDegeri(ders);
          return {
            ders,
            seviye: d.seviye,
            bilinen: konulariAyir(d.bilinen),
            eksik: konulariAyir(d.eksik),
          };
        }),
      });
      if (sonuc.hata) {
        alert(sonuc.hata);
        return;
      }
      setAcik(false);
    });
  }

  return (
    <section className={s.bolum} id="bolum-profil">
      <div className={s["bolum-bas"]}>
        <h2>🎯 Başlangıç Seviye Formum</h2>
        {profil && (
          <button className="btn btn-outline btn-kucuk" onClick={formAc}>
            Düzenle
          </button>
        )}
      </div>

      {profil ? (
        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <span className="tag">🎯 {profil.sinav}</span>
            <span className="tag">⏱ Günde {profil.gunlukSaat || "?"} saat</span>
            <span className="tag">📅 {tarihStr(profil.tarih)}</span>
          </div>
          <table className={s["profil-ders-tablo"]}>
            <thead>
              <tr>
                <th>Ders</th>
                <th>Seviyem</th>
                <th>Bildiğim Konular</th>
                <th>Eksik Konularım</th>
              </tr>
            </thead>
            <tbody>
              {(profil.dersler || []).map((d) => (
                <tr key={d.ders}>
                  <td>
                    <b>{d.ders}</b>
                  </td>
                  <td>
                    <span className={`${s["seviye-cip"]} ${s[seviyeSinif(d.seviye)]}`}>{d.seviye}</span>
                  </td>
                  <td>
                    {(d.bilinen || []).length
                      ? d.bilinen.map((k) => (
                          <span key={k} className={s["konu-cip"]}>
                            ✓ {k}
                          </span>
                        ))
                      : "—"}
                  </td>
                  <td>
                    {(d.eksik || []).length
                      ? d.eksik.map((k) => (
                          <span key={k} className={`${s["konu-cip"]} ${s.eksik}`}>
                            ! {k}
                          </span>
                        ))
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {profil.notlar && <p style={{ fontSize: ".83rem", color: "var(--muted)" }}>📝 {profil.notlar}</p>}
        </div>
      ) : (
        <p className={s["bos-mesaj"]}>
          Henüz doldurmadın. Bildiğin konuları, eksiklerini ve çalışma düzenini paylaş ki öğretmenin
          sana özel bir yol haritası hazırlayabilsin. 👇
        </p>
      )}

      {acik && (
        <form className={s["ic-form"]} onSubmit={kaydet}>
          <div className={s["form-izgara"]}>
            <div className={s["form-grup"]}>
              <label>Hazırlandığım Sınav</label>
              <select value={sinav} onChange={(e) => setSinav(e.target.value)}>
                <option>YKS</option>
                <option>LGS</option>
              </select>
            </div>
            <div className={s["form-grup"]}>
              <label>Günlük Çalışma Sürem (saat)</label>
              <input
                type="number"
                min={0}
                max={16}
                step={0.5}
                placeholder="4"
                value={saat}
                onChange={(e) => setSaat(e.target.value)}
              />
            </div>
          </div>
          <div style={{ margin: "6px 0 12px" }}>
            {seciliDersler.map((ders) => {
              const d = dersDegeri(ders);
              return (
                <div key={ders} className={s["pr-satir"]}>
                  <span className={s["dn-ders"]}>{ders}</span>
                  <select value={d.seviye} onChange={(e) => dersGuncelle(ders, "seviye", e.target.value)}>
                    {[...SEVIYELER].reverse().map((sv) => (
                      <option key={sv}>{sv}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Bildiğin konular (virgülle)"
                    value={d.bilinen}
                    onChange={(e) => dersGuncelle(ders, "bilinen", e.target.value)}
                  />
                  <input
                    placeholder="Eksik konuların (virgülle)"
                    value={d.eksik}
                    onChange={(e) => dersGuncelle(ders, "eksik", e.target.value)}
                  />
                </div>
              );
            })}
          </div>
          <div className={s["form-grup"]} style={{ marginBottom: 12 }}>
            <label>Eklemek İstediklerim</label>
            <input
              placeholder="Örn. akşamları verimim düşük, paragrafta hız sorunum var..."
              value={notlar}
              onChange={(e) => setNotlar(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
            Formu Kaydet
          </button>
          <span style={{ fontSize: ".78rem", color: "var(--muted)", marginLeft: 10 }}>
            Bu bilgiler öğretmenine iletilir ve yol haritan buna göre hazırlanır.
          </span>
        </form>
      )}
    </section>
  );
}

function seviyeSinif(sv: string): string {
  return sv === "İyi" ? "seviye-iyi" : sv === "Zayıf" ? "seviye-zayif" : "seviye-orta";
}
