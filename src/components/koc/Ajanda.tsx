"use client";

/* 📅 Ajanda / Takvim — legacy koc-panel.html tkCiz/tkGunOlaylari/tkDetayCiz.
   Olaylar sunucuda toplanıp serileştirilmiş gelir; ay gezinme, tip filtreleri
   ve gün seçimi client durumudur. */

import { useMemo, useState } from "react";
import { bugun, tarihStr } from "@/lib/hesap";
import { GUNLER } from "@/lib/sabitler";
import type { AjandaOlay } from "./tipler";
import s from "./koc.module.css";

const TK_AYLAR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const TK_GUNADI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const TK_TIPLER = [
  { tip: "ozel" as const, ad: "Özel Ders", renk: "#C98792" },
  { tip: "odev" as const, ad: "Ödev", renk: "#C98792" },
  { tip: "deneme" as const, ad: "Deneme", renk: "#7A2035" },
];
const OLAY_SINIF = { ozel: s.tkOzel, odev: s.tkOdev, deneme: s.tkDeneme };
const ROZET_SINIF = { tamam: s.durumTamam, bekliyor: s.durumBekliyor, talep: s.durumTalep };

function tkIso(y: number, a: number, g: number) {
  return y + "-" + String(a + 1).padStart(2, "0") + "-" + String(g).padStart(2, "0");
}

export default function Ajanda({ olaylar }: { olaylar: AjandaOlay[] }) {
  const bugunIso = bugun();
  const [yil, setYil] = useState(+bugunIso.slice(0, 4));
  const [ayIdx, setAyIdx] = useState(+bugunIso.slice(5, 7) - 1);
  const [secili, setSecili] = useState(bugunIso);
  const [filtre, setFiltre] = useState({ ozel: true, odev: true, deneme: true });

  /* Filtre uygulanmış olaylar, güne göre gruplu */
  const gunlere = useMemo(() => {
    const m = new Map<string, AjandaOlay[]>();
    for (const o of olaylar) {
      if (!filtre[o.tip]) continue;
      const dizi = m.get(o.tarih);
      if (dizi) dizi.push(o);
      else m.set(o.tarih, [o]);
    }
    return m;
  }, [olaylar, filtre]);

  function ayKaydir(n: number) {
    let a = ayIdx + n, y = yil;
    if (a < 0) { a = 11; y--; }
    if (a > 11) { a = 0; y++; }
    setAyIdx(a); setYil(y);
  }
  function bugune() {
    setYil(+bugunIso.slice(0, 4));
    setAyIdx(+bugunIso.slice(5, 7) - 1);
    setSecili(bugunIso);
  }

  /* Izgara hesabı — legacy tkCiz ile aynı */
  const ilkGun = (new Date(yil, ayIdx, 1).getDay() + 6) % 7;
  const gunSayisi = new Date(yil, ayIdx + 1, 0).getDate();
  const oncekiAySon = new Date(yil, ayIdx, 0).getDate();
  const hucreSayisi = Math.ceil((ilkGun + gunSayisi) / 7) * 7;

  const sayac = { ozel: 0, odev: 0, deneme: 0 };
  const hucreler: React.ReactNode[] = [];
  for (let h = 0; h < hucreSayisi; h++) {
    const gunNo = h - ilkGun + 1;
    if (gunNo < 1 || gunNo > gunSayisi) {
      const dis = gunNo < 1 ? oncekiAySon + gunNo : gunNo - gunSayisi;
      hucreler.push(
        <div key={"d" + h} className={`${s.takvimHucre} ${s.disari}`}>
          <span className={s.takvimNo}>{dis}</span>
        </div>
      );
      continue;
    }
    const iso = tkIso(yil, ayIdx, gunNo);
    const ol = gunlere.get(iso) ?? [];
    ol.forEach((o) => sayac[o.tip]++);
    const tipler = [...new Set(ol.map((o) => o.tip))];
    hucreler.push(
      <div
        key={iso}
        role="button"
        tabIndex={0}
        className={`${s.takvimHucre} ${iso === bugunIso ? s.bugun : ""} ${iso === secili ? s.seciliGun : ""}`}
        onClick={() => setSecili(iso)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSecili(iso); }}
      >
        <span className={s.takvimNo}>{gunNo}</span>
        {ol.slice(0, 3).map((o, i) => (
          <span key={i} className={`${s.tkOlay} ${OLAY_SINIF[o.tip]} ${o.tamam ? s.olayTamam : ""}`}>
            {o.etiket}
          </span>
        ))}
        {ol.length > 3 && <span className={s.tkDaha}>+{ol.length - 3} daha</span>}
        {ol.length > 0 && (
          <span className={s.tkNoktalar}>
            {tipler.map((t) => (
              <span
                key={t}
                className={s.tkBenek}
                style={{ background: TK_TIPLER.find((x) => x.tip === t)?.renk }}
              />
            ))}
          </span>
        )}
      </div>
    );
  }

  /* Seçili günün detayı */
  const p = secili.split("-");
  const gunAdi = GUNLER[(new Date(+p[0], +p[1] - 1, +p[2]).getDay() + 6) % 7];
  const seciliOlaylar = gunlere.get(secili) ?? [];

  return (
    <section className={s.bolum}>
      <div className={s.bolumBas}>
        <h2>
          📅 Ajandam <span className={s.bolumBasNot}>(tüm öğrencilerin)</span>
        </h2>
        <div className={s.tkLejant}>
          {TK_TIPLER.map((t) => (
            <label key={t.tip} className={filtre[t.tip] ? s.acik : ""}>
              <input
                type="checkbox"
                checked={filtre[t.tip]}
                onChange={() => setFiltre((f) => ({ ...f, [t.tip]: !f[t.tip] }))}
              />
              <span className={s.tkBenek} style={{ background: t.renk }} />
              {t.ad}
            </label>
          ))}
        </div>
      </div>

      <div className={s.takvimUst}>
        <div className={s.tkNav}>
          <button type="button" onClick={() => ayKaydir(-1)} aria-label="Önceki ay">‹</button>
          <span className={s.takvimAy}>{TK_AYLAR[ayIdx]} {yil}</span>
          <button type="button" onClick={() => ayKaydir(1)} aria-label="Sonraki ay">›</button>
          <button type="button" className={s.tkBugunBtn} onClick={bugune}>Bugün</button>
        </div>
        <span className="tag">
          Bu ay: {sayac.ozel} özel ders · {sayac.odev} ödev teslimi · {sayac.deneme} deneme
        </span>
      </div>

      <div className={s.takvimIzgara}>
        {TK_GUNADI.map((g) => (
          <div key={g} className={s.takvimGunadi}>{g}</div>
        ))}
        {hucreler}
      </div>

      <div className={s.takvimDetay}>
        <h3>📋 {tarihStr(secili)} · {gunAdi}</h3>
        {seciliOlaylar.length ? (
          seciliOlaylar.map((o, i) => (
            <div key={i} className={`${s.listeSatir} ${o.tamam ? s.tamam : ""}`}>
              <div className={s.listeGovde}>
                <b>{o.baslik}</b>
                <p>{o.metin}</p>
                <div className={s.listeMeta}>
                  {o.etiketler.map((e, j) => (
                    <span key={j} className="tag">{e}</span>
                  ))}
                  {o.rozet && (
                    <span className={`${s.durumRozet} ${ROZET_SINIF[o.rozet.stil]}`}>{o.rozet.metin}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className={s.bosMesaj}>Bu gün için planlanmış bir şey yok. 🌤️</p>
        )}
      </div>
    </section>
  );
}
