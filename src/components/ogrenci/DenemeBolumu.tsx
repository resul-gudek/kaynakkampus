"use client";

/* 📈 Deneme Sonuçlarım — legacy deneme formu + öneri kutusu + SVG net gelişim grafiği birebir */

import { useRef, useState, useTransition, type FormEvent } from "react";
import { denemeEkle } from "@/actions/deneme";
import {
  netHesapla,
  tarihStr,
  yanlisKonulariAyristir,
  zayifKonular,
  type Profil,
} from "@/lib/hesap";
import { DENEME_DERSLERI, DENEME_TURLERI } from "@/lib/sabitler";
import { konulariAyir, type DenemeKaydi } from "./tipler";
import s from "./panel.module.css";

interface SatirGirdi {
  dogru: string;
  yanlis: string;
  bos: string;
  konular: string;
}

const BOS_SATIR: SatirGirdi = { dogru: "", yanlis: "", bos: "", konular: "" };

export default function DenemeBolumu({
  ogrenciId,
  denemeler,
  profil,
}: {
  ogrenciId: string;
  denemeler: DenemeKaydi[];
  profil: Profil | null;
}) {
  const [bekliyor, startTransition] = useTransition();

  /* ── Form durumu ── */
  const [ad, setAd] = useState("");
  const [tur, setTur] = useState<string>("TYT");
  const [tarih, setTarih] = useState("");
  const [satirlar, setSatirlar] = useState<Record<string, SatirGirdi>>({});

  const formDersleri = DENEME_DERSLERI[tur] || [];

  function satir(ders: string): SatirGirdi {
    return satirlar[ders] || BOS_SATIR;
  }
  function satirGuncelle(ders: string, alan: keyof SatirGirdi, deger: string) {
    setSatirlar((d) => ({ ...d, [ders]: { ...satir(ders), [alan]: deger } }));
  }
  function turDegis(yeni: string) {
    setTur(yeni);
    setSatirlar({});
  }

  const toplamNet =
    Math.round(
      formDersleri.reduce((t, d) => {
        const g = satir(d.ders);
        return t + netHesapla(tur, +g.dogru || 0, +g.yanlis || 0);
      }, 0) * 100
    ) / 100;

  function kaydet(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    for (const d of formDersleri) {
      const g = satir(d.ders);
      const toplam = (+g.dogru || 0) + (+g.yanlis || 0) + (+g.bos || 0);
      if (toplam > d.soru) {
        alert(`${d.ders}: Doğru + Yanlış + Boş toplamı ${d.soru} soruyu aşamaz.`);
        return;
      }
    }
    startTransition(async () => {
      const sonuc = await denemeEkle({
        ogrenciId,
        ad: ad.trim(),
        tur,
        tarih,
        dersler: formDersleri.map((d) => {
          const g = satir(d.ders);
          return {
            ders: d.ders,
            dogru: +g.dogru || 0,
            yanlis: +g.yanlis || 0,
            bos: +g.bos || 0,
            yanlisKonular: konulariAyir(g.konular),
          };
        }),
      });
      if (sonuc.hata) {
        alert(sonuc.hata);
        return;
      }
      setAd("");
      setTarih("");
      setSatirlar({});
    });
  }

  /* ── Çalışmam gereken konular ── */
  const zayif = zayifKonular(denemeler, profil);

  return (
    <section className={s.bolum} id="bolum-deneme">
      <div className={s["bolum-bas"]}>
        <h2>📈 Deneme Sonuçlarım</h2>
        <span className="tag">Sonucunu gir, öğretmenin de görsün</span>
      </div>

      {zayif.length > 0 && (
        <div className={s["oneri-kutu"]}>
          <h3>📌 Çalışman Gereken Konular</h3>
          <p style={{ fontSize: ".8rem", color: "var(--muted)", marginBottom: 8 }}>
            Denemelerindeki yanlışlardan ve başlangıç formundan otomatik çıkarıldı. En sık hata
            yaptığın konular başta:
          </p>
          {zayif.slice(0, 12).map((z) => (
            <span key={z.ders + "|" + z.konu} className={`${s["konu-cip"]} ${s.eksik}`}>
              {z.ders} – {z.konu} {z.kez > 1 && <b>×{z.kez}</b>}
            </span>
          ))}
        </div>
      )}

      <NetGrafigi denemeler={denemeler} />

      <form className={s["ic-form"]} style={{ marginBottom: 18 }} onSubmit={kaydet}>
        <div className={s["form-izgara"]}>
          <div className={s["form-grup"]}>
            <label>Deneme Adı</label>
            <input required placeholder="Örn. 3D TYT Deneme 6" value={ad} onChange={(e) => setAd(e.target.value)} />
          </div>
          <div className={s["form-grup"]}>
            <label>Tür</label>
            <select value={tur} onChange={(e) => turDegis(e.target.value)}>
              {DENEME_TURLERI.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className={s["form-grup"]}>
            <label>Tarih</label>
            <input type="date" required value={tarih} onChange={(e) => setTarih(e.target.value)} />
          </div>
        </div>
        <div className={s["dn-baslik"]}>
          <span>Ders</span>
          <span>Doğru</span>
          <span>Yanlış</span>
          <span>Boş</span>
          <span>Net</span>
          <span>Yanlış Yaptığın Konular (virgülle)</span>
        </div>
        <div>
          {formDersleri.map((d) => {
            const g = satir(d.ders);
            return (
              <div key={d.ders} className={s["dn-satir"]}>
                <span className={s["dn-ders"]}>
                  {d.ders}
                  <small>{d.soru} soru</small>
                </span>
                <input
                  type="number"
                  min={0}
                  max={d.soru}
                  placeholder="D"
                  value={g.dogru}
                  onChange={(e) => satirGuncelle(d.ders, "dogru", e.target.value)}
                />
                <input
                  type="number"
                  min={0}
                  max={d.soru}
                  placeholder="Y"
                  value={g.yanlis}
                  onChange={(e) => satirGuncelle(d.ders, "yanlis", e.target.value)}
                />
                <input
                  type="number"
                  min={0}
                  max={d.soru}
                  placeholder="B"
                  value={g.bos}
                  onChange={(e) => satirGuncelle(d.ders, "bos", e.target.value)}
                />
                <span className={s["dn-net"]}>{netHesapla(tur, +g.dogru || 0, +g.yanlis || 0)}</span>
                <input
                  className={s["dn-konular"]}
                  placeholder="Örn. Paragraf, Problemler"
                  value={g.konular}
                  onChange={(e) => satirGuncelle(d.ders, "konular", e.target.value)}
                />
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
            Sonucu Kaydet
          </button>
          <span className={s["dn-toplam"]}>
            Toplam Net: <span>{toplamNet}</span>
          </span>
        </div>
      </form>

      {denemeler.length ? (
        denemeler.map((d, i) => {
          const fark = i > 0 ? +(d.net - denemeler[i - 1].net).toFixed(2) : null;
          return (
            <div key={d.id} className={s["deneme-kart"]}>
              <div className={s["deneme-kart-bas"]}>
                <b>{d.ad}</b>
                <span className="tag">{d.tur}</span>
                <span className="tag">📅 {tarihStr(d.tarih)}</span>
                <span className={s["dn-toplam"]} style={{ marginLeft: "auto" }}>
                  Net: {d.net}
                  {fark !== null && (
                    <>
                      {" "}
                      <span className={fark >= 0 ? s["net-artis"] : s["net-dusus"]}>
                        {fark >= 0 ? "▲ +" : "▼ "}
                        {fark}
                      </span>
                    </>
                  )}
                </span>
              </div>
              {d.dersler.length > 0 && (
                <table className={s["deneme-tablo"]}>
                  <thead>
                    <tr>
                      <th>Ders</th>
                      <th>D</th>
                      <th>Y</th>
                      <th>B</th>
                      <th>Net</th>
                      <th>Yanlış Konular</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.dersler.map((dr) => {
                      const konular = yanlisKonulariAyristir(dr.yanlisKonular);
                      return (
                        <tr key={dr.id}>
                          <td>
                            <b>{dr.ders}</b>
                          </td>
                          <td>{dr.dogru}</td>
                          <td>{dr.yanlis}</td>
                          <td>{dr.bos}</td>
                          <td>
                            <b>{dr.net}</b>
                          </td>
                          <td>
                            {konular.length
                              ? konular.map((k) => (
                                  <span key={k} className={`${s["konu-cip"]} ${s.eksik}`}>
                                    {k}
                                  </span>
                                ))
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        })
      ) : (
        <p className={s["bos-mesaj"]}>Henüz deneme sonucu girmedin.</p>
      )}
    </section>
  );
}

/* ── Net gelişim grafiğim (SVG, tek seri + tür filtresi) — legacy grafikCiz birebir ── */

function NetGrafigi({ denemeler }: { denemeler: DenemeKaydi[] }) {
  const [seciliTur, setSeciliTur] = useState<string | null>(null);
  const [ipucu, setIpucu] = useState<{ i: number; sol: number; ust: number } | null>(null);
  const kapRef = useRef<HTMLDivElement>(null);

  if (denemeler.length < 2) return null;

  const turler = [...new Set(denemeler.map((d) => d.tur))];
  let grafikTur = seciliTur;
  if (!grafikTur || !turler.includes(grafikTur)) {
    grafikTur = [...turler].sort(
      (a, b) =>
        denemeler.filter((d) => d.tur === b).length - denemeler.filter((d) => d.tur === a).length
    )[0];
  }
  const liste = denemeler.filter((d) => d.tur === grafikTur);

  const W = 720, H = 240, L = 48, R = 20, T = 22, B = 34;
  const iw = W - L - R, ih = H - T - B;
  const nets = liste.map((d) => d.net);
  let min = Math.min(...nets), max = Math.max(...nets);
  if (min === max) { min -= 5; max += 5; }
  const pay = (max - min) * 0.18;
  min = Math.max(0, min - pay);
  max = max + pay;
  const x = (i: number) => (liste.length === 1 ? L + iw / 2 : L + (iw * i) / (liste.length - 1));
  const y = (v: number) => T + ih * (1 - (v - min) / (max - min));

  const izgara: { y: number; deger: number }[] = [];
  for (let i = 0; i <= 4; i++) {
    const t = min + ((max - min) * i) / 4;
    izgara.push({ y: y(t), deger: Math.round(t * 10) / 10 });
  }
  const adim = Math.max(1, Math.ceil(liste.length / 6));
  const yolStr = liste.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.net)}`).join(" ");
  const son = liste[liste.length - 1];

  function ipucuGoster(e: React.MouseEvent<SVGCircleElement>, i: number) {
    const kap = kapRef.current?.getBoundingClientRect();
    if (!kap) return;
    const hedef = (e.target as SVGCircleElement).getBoundingClientRect();
    const sol = hedef.left - kap.left + hedef.width / 2;
    setIpucu({ i, sol: Math.min(Math.max(sol, 80), kap.width - 80), ust: hedef.top - kap.top - 6 });
  }

  const ipucuDeneme = ipucu ? liste[ipucu.i] : null;
  const ipucuFark =
    ipucu && ipucu.i > 0 && ipucuDeneme
      ? Math.round((ipucuDeneme.net - liste[ipucu.i - 1].net) * 100) / 100
      : null;

  return (
    <div className={s["grafik-kutu"]}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <h3 style={{ fontSize: ".95rem", fontWeight: 700 }}>📈 Net Gelişimim</h3>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {turler.map((t) => (
            <button
              key={t}
              type="button"
              className={`${s["g-cip"]} ${t === grafikTur ? s.aktif : ""}`}
              onClick={() => setSeciliTur(t)}
            >
              {t} · {denemeler.filter((d) => d.tur === t).length}
            </button>
          ))}
        </div>
      </div>
      <div style={{ position: "relative" }} ref={kapRef}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          role="img"
          aria-label={`${grafikTur} denemeleri net gelişim grafiğim`}
        >
          {izgara.map((g, i) => (
            <g key={i}>
              <line x1={L} x2={W - R} y1={g.y} y2={g.y} stroke="#e8edf9" strokeWidth={1} />
              <text x={L - 8} y={g.y + 4} textAnchor="end" fontSize={11} fill="#64748b">
                {g.deger}
              </text>
            </g>
          ))}
          {liste.map((d, i) =>
            i % adim && i !== liste.length - 1 ? null : (
              <text key={d.id} x={x(i)} y={H - 10} textAnchor="middle" fontSize={11} fill="#64748b">
                {tarihStr(d.tarih).slice(0, 5)}
              </text>
            )
          )}
          <path d={yolStr} fill="none" stroke="#1a3c8f" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {liste.map((d, i) => (
            <g key={d.id}>
              <circle cx={x(i)} cy={y(d.net)} r={4.5} fill="#1a3c8f" stroke="#fff" strokeWidth={2} />
              <circle
                cx={x(i)}
                cy={y(d.net)}
                r={14}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => ipucuGoster(e, i)}
                onMouseLeave={() => setIpucu(null)}
              />
            </g>
          ))}
          <text
            x={x(liste.length - 1)}
            y={y(son.net) - 12}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill="#1a3c8f"
          >
            {son.net}
          </text>
        </svg>
        {ipucuDeneme && ipucu && (
          <div className={s["g-ipucu"]} style={{ display: "block", left: ipucu.sol, top: ipucu.ust }}>
            <b>{ipucuDeneme.ad}</b>
            <br />
            {tarihStr(ipucuDeneme.tarih)}
            <br />
            Net: <b>{ipucuDeneme.net}</b>
            {ipucuFark !== null && (
              <>
                <br />
                Değişim:{" "}
                <b style={{ color: ipucuFark >= 0 ? "#4ade80" : "#f87171" }}>
                  {ipucuFark >= 0 ? "+" : ""}
                  {ipucuFark}
                </b>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
