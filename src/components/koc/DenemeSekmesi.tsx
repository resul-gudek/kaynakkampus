"use client";

/* 📈 Deneme Sonuçları sekmesi — legacy denemeCiz / grafikCiz / grafikIpucu.
   Deneme girişi öğrenci panelindedir; koç burada izler ve silebilir. */

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { tarihStr } from "@/lib/hesap";
import { denemeSil } from "@/actions/deneme";
import type { DenemeS } from "./tipler";
import s from "./koc.module.css";

/* ── Net gelişim grafiği (SVG, tek seri + tür filtresi) ── */
function NetGrafik({ denemeler }: { denemeler: DenemeS[] }) {
  const turler = useMemo(() => [...new Set(denemeler.map((d) => d.tur))], [denemeler]);
  const varsayilan = useMemo(
    () =>
      [...turler].sort(
        (a, b) =>
          denemeler.filter((d) => d.tur === b).length - denemeler.filter((d) => d.tur === a).length
      )[0],
    [turler, denemeler]
  );
  const [tur, setTur] = useState<string | null>(null);
  const aktifTur = tur && turler.includes(tur) ? tur : varsayilan;
  const liste = denemeler.filter((d) => d.tur === aktifTur);
  const govdeRef = useRef<HTMLDivElement>(null);
  const [ipucu, setIpucu] = useState<{ i: number; sol: number; ust: number } | null>(null);

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

  const izgara: { y: number; etiket: number }[] = [];
  for (let i = 0; i <= 4; i++) {
    const t = min + ((max - min) * i) / 4;
    izgara.push({ y: y(t), etiket: Math.round(t * 10) / 10 });
  }
  const adim = Math.max(1, Math.ceil(liste.length / 6));
  const yolStr = liste.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.net)}`).join(" ");
  const son = liste[liste.length - 1];

  function ipucuGoster(e: React.MouseEvent<SVGCircleElement>, i: number) {
    const kap = govdeRef.current?.getBoundingClientRect();
    if (!kap) return;
    const hedef = (e.target as SVGCircleElement).getBoundingClientRect();
    const sol = hedef.left - kap.left + hedef.width / 2;
    setIpucu({
      i,
      sol: Math.min(Math.max(sol, 80), kap.width - 80),
      ust: hedef.top - kap.top - 6,
    });
  }

  const ipucuDeneme = ipucu ? liste[ipucu.i] : null;
  const ipucuFark =
    ipucu && ipucu.i > 0 && ipucuDeneme
      ? Math.round((ipucuDeneme.net - liste[ipucu.i - 1].net) * 100) / 100
      : null;

  return (
    <div className={s.grafikKutu}>
      <div className={s.grafikBas}>
        <h3>📈 Net Gelişimi</h3>
        <div className={s.grafikCipler}>
          {turler.map((t) => (
            <button
              key={t}
              type="button"
              className={`${s.gCip} ${t === aktifTur ? s.aktif : ""}`}
              onClick={() => setTur(t)}
            >
              {t} · {denemeler.filter((d) => d.tur === t).length}
            </button>
          ))}
        </div>
      </div>
      <div className={s.gGovde} ref={govdeRef}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          role="img"
          aria-label={`${aktifTur} denemeleri net gelişim grafiği`}
        >
          {izgara.map((g, i) => (
            <g key={i}>
              <line x1={L} x2={W - R} y1={g.y} y2={g.y} stroke="#e8edf9" strokeWidth={1} />
              <text x={L - 8} y={g.y + 4} textAnchor="end" fontSize={11} fill="#64748b">
                {g.etiket}
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
          <path
            d={yolStr}
            fill="none"
            stroke="#1a3c8f"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
          {son && (
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
          )}
        </svg>
        {ipucu && ipucuDeneme && (
          <div className={s.gIpucu} style={{ display: "block", left: ipucu.sol, top: ipucu.ust }}>
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

export default function DenemeSekmesi({ denemeler }: { denemeler: DenemeS[] }) {
  const router = useRouter();
  const [bekliyor, baslat] = useTransition();

  function sil(id: string) {
    if (!confirm("Bu deneme sonucu silinsin mi?")) return;
    baslat(async () => {
      const sonuc = await denemeSil(id);
      if (sonuc.hata) alert(sonuc.hata);
      else router.refresh();
    });
  }

  return (
    <div>
      {denemeler.length >= 2 && <NetGrafik denemeler={denemeler} />}

      {denemeler.length ? (
        denemeler.map((d, i) => {
          const fark = i > 0 ? +(d.net - denemeler[i - 1].net).toFixed(2) : null;
          return (
            <div key={d.id} className={s.denemeKart}>
              <div className={s.denemeKartBas}>
                <b>{d.ad}</b>
                <span className="tag">{d.tur}</span>
                <span className="tag">📅 {tarihStr(d.tarih)}</span>
                <span className={s.dnToplam} style={{ marginLeft: "auto" }}>
                  Net: {d.net}
                  {fark !== null && (
                    <span className={fark >= 0 ? s.netArtis : s.netDusus}>
                      {fark >= 0 ? "▲ +" : "▼ "}
                      {fark}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className={s.silBtn}
                  title="Sonucu sil"
                  disabled={bekliyor}
                  onClick={() => sil(d.id)}
                >
                  ✕
                </button>
              </div>
              {d.dersler.length > 0 && (
                <details className={s.denemeDetay}>
                  <summary>Ders bazında sonuçlar</summary>
                  <table className={s.denemeTablo}>
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
                      {d.dersler.map((dr, j) => (
                        <tr key={j}>
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
                            {dr.yanlisKonular.length
                              ? dr.yanlisKonular.map((k, m) => (
                                  <span key={m} className={`${s.konuCip} ${s.eksik}`}>
                                    {k}
                                  </span>
                                ))
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              )}
            </div>
          );
        })
      ) : (
        <p className={s.bosMesaj}>Henüz deneme sonucu girilmedi.</p>
      )}
    </div>
  );
}
