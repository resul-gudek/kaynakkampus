"use client";

/* 📅 Takvimim — legacy tkCiz/tkGunOlaylari/tkDetayCiz birebir
   Kendi olayları: özel dersler, ödev son tarihleri, denemeler, haftalık takip günleri */

import { useState, type ReactNode } from "react";
import { bugun, isoTarih, tarihStr } from "@/lib/hesap";
import { GUNLER } from "@/lib/sabitler";
import type { DenemeKaydi, OdevKaydi, OzelDersKaydi, TakipKaydi } from "./tipler";
import s from "./panel.module.css";

const TK_AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const TK_GUNADI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const TK_TIPLER = [
  { tip: "ozel", ad: "Özel Ders", renk: "#C98792" },
  { tip: "odev", ad: "Ödev", renk: "#C98792" },
  { tip: "deneme", ad: "Deneme", renk: "#7A2035" },
  { tip: "takip", ad: "Haftalık Görev", renk: "#16a34a" },
] as const;

type TkTip = (typeof TK_TIPLER)[number]["tip"];

interface TkOlay {
  tip: TkTip;
  sinif: string;
  tamam: boolean;
  etiket: string;
  detay: ReactNode;
}

function tkIso(y: number, a: number, g: number): string {
  return y + "-" + String(a + 1).padStart(2, "0") + "-" + String(g).padStart(2, "0");
}

export default function Takvim({
  odevler,
  ozelDersler,
  denemeler,
  takip,
}: {
  odevler: OdevKaydi[];
  ozelDersler: OzelDersKaydi[];
  denemeler: DenemeKaydi[];
  takip: TakipKaydi[];
}) {
  const bugunIso = bugun();
  const [yil, setYil] = useState(() => +bugunIso.slice(0, 4));
  const [ayIdx, setAyIdx] = useState(() => +bugunIso.slice(5, 7) - 1);
  const [secili, setSecili] = useState(bugunIso);
  const [filtre, setFiltre] = useState<Record<TkTip, boolean>>({
    ozel: true,
    odev: true,
    deneme: true,
    takip: true,
  });

  function ayKaydir(n: number) {
    let a = ayIdx + n, y = yil;
    if (a < 0) { a = 11; y--; }
    if (a > 11) { a = 0; y++; }
    setAyIdx(a);
    setYil(y);
  }

  function bugune() {
    setYil(+bugunIso.slice(0, 4));
    setAyIdx(+bugunIso.slice(5, 7) - 1);
    setSecili(bugunIso);
  }

  /* Bir güne düşen tüm olaylar (özel ders, ödev son günü, deneme, haftalık görev) */
  function gunOlaylari(iso: string, gunAdi: string): TkOlay[] {
    const ol: TkOlay[] = [];
    if (filtre.ozel)
      ozelDersler
        .filter((x) => isoTarih(x.tarih) === iso && ["planlandi", "yapildi", "talep"].includes(x.durum))
        .forEach((x) =>
          ol.push({
            tip: "ozel",
            sinif: s["tk-ozel"],
            tamam: x.durum === "yapildi",
            etiket: "🎓 " + (x.saat ? x.saat + " " : "") + x.ders,
            detay: (
              <>
                <b>
                  🎓 Özel Ders: {x.ders}
                  {x.konu ? " – " + x.konu : ""}
                </b>
                <div className={s["liste-meta"]}>
                  {x.saat && (
                    <span className="tag">
                      🕐 {x.saat} · {x.sure || 60} dk
                    </span>
                  )}
                  <span
                    className={`${s["durum-rozet"]} ${
                      x.durum === "yapildi"
                        ? s["durum-tamam"]
                        : x.durum === "talep"
                          ? s["durum-talep"]
                          : s["durum-bekliyor"]
                    }`}
                  >
                    {x.durum === "yapildi" ? "✓ Yapıldı" : x.durum === "talep" ? "🕓 Onay bekliyor" : "📌 Planlandı"}
                  </span>
                </div>
              </>
            ),
          })
        );
    if (filtre.odev)
      odevler
        .filter((o) => !!o.sonTarih && isoTarih(o.sonTarih) === iso)
        .forEach((o) =>
          ol.push({
            tip: "odev",
            sinif: s["tk-odev"],
            tamam: o.durum === "tamamlandi",
            etiket: "📘 " + o.ders,
            detay: (
              <>
                <b>
                  📘 Ödev (son gün): {o.ders} – {o.konu}
                </b>
                <div className={s["liste-meta"]}>
                  {o.kaynak && <span className="tag">📕 {o.kaynak}</span>}
                  {!!o.soruSayisi && <span className="tag">{o.soruSayisi} soru</span>}
                  <span
                    className={`${s["durum-rozet"]} ${
                      o.durum === "tamamlandi" ? s["durum-tamam"] : s["durum-bekliyor"]
                    }`}
                  >
                    {o.durum === "tamamlandi" ? "✓ Tamamlandı" : "⏳ Bekliyor"}
                  </span>
                </div>
              </>
            ),
          })
        );
    if (filtre.deneme)
      denemeler
        .filter((d) => isoTarih(d.tarih) === iso)
        .forEach((d) =>
          ol.push({
            tip: "deneme",
            sinif: s["tk-deneme"],
            tamam: false,
            etiket: "📈 " + d.tur + " · " + d.net,
            detay: (
              <>
                <b>📈 Deneme: {d.ad}</b>
                <div className={s["liste-meta"]}>
                  <span className="tag">{d.tur}</span>
                  <span className="tag">Net: {d.net}</span>
                </div>
              </>
            ),
          })
        );
    if (filtre.takip)
      takip
        .filter((t) => t.gun === gunAdi)
        .forEach((t) =>
          ol.push({
            tip: "takip",
            sinif: s["tk-takip"],
            tamam: t.tamamlandi,
            etiket: "✅ " + t.gorev,
            detay: (
              <>
                <b>✅ Haftalık görev: {t.gorev}</b>
                <div className={s["liste-meta"]}>
                  <span
                    className={`${s["durum-rozet"]} ${t.tamamlandi ? s["durum-tamam"] : s["durum-bekliyor"]}`}
                  >
                    {t.tamamlandi ? "✓ Tamamlandı" : "⏳ Bekliyor"}
                  </span>
                  <span className="tag">📆 Her {gunAdi}</span>
                </div>
              </>
            ),
          })
        );
    return ol;
  }

  /* Ay ızgarası */
  const ilkGun = (new Date(yil, ayIdx, 1).getDay() + 6) % 7;
  const gunSayisi = new Date(yil, ayIdx + 1, 0).getDate();
  const oncekiAySon = new Date(yil, ayIdx, 0).getDate();
  const hucreSayisi = Math.ceil((ilkGun + gunSayisi) / 7) * 7;
  const sayac: Record<TkTip, number> = { ozel: 0, odev: 0, deneme: 0, takip: 0 };

  const hucreler: ReactNode[] = [];
  for (let h = 0; h < hucreSayisi; h++) {
    const gunNo = h - ilkGun + 1;
    if (gunNo < 1 || gunNo > gunSayisi) {
      const dis = gunNo < 1 ? oncekiAySon + gunNo : gunNo - gunSayisi;
      hucreler.push(
        <div key={"d" + h} className={`${s["takvim-hucre"]} ${s.disari}`}>
          <span className={s["takvim-no"]}>{dis}</span>
        </div>
      );
      continue;
    }
    const iso = tkIso(yil, ayIdx, gunNo);
    const gunAdi = GUNLER[(new Date(yil, ayIdx, gunNo).getDay() + 6) % 7];
    const ol = gunOlaylari(iso, gunAdi);
    ol.forEach((o) => sayac[o.tip]++);
    const tipler = [...new Set(ol.map((o) => o.tip))];
    hucreler.push(
      <div
        key={iso}
        className={`${s["takvim-hucre"]} ${iso === bugunIso ? s.bugun : ""} ${iso === secili ? s.secili : ""}`}
        onClick={() => setSecili(iso)}
      >
        <span className={s["takvim-no"]}>{gunNo}</span>
        {ol.slice(0, 3).map((o, i) => (
          <span key={i} className={`${s["tk-olay"]} ${o.sinif} ${o.tamam ? s.tamamlandi : ""}`}>
            {o.etiket}
          </span>
        ))}
        {ol.length > 3 && <span className={s["tk-daha"]}>+{ol.length - 3} daha</span>}
        {ol.length > 0 && (
          <span className={s["tk-noktalar"]}>
            {tipler.map((t) => (
              <span
                key={t}
                className={s["tk-benek"]}
                style={{ background: TK_TIPLER.find((x) => x.tip === t)?.renk }}
              />
            ))}
          </span>
        )}
      </div>
    );
  }

  /* Seçili gün detayı */
  const p = secili.split("-");
  const seciliGunAdi = GUNLER[(new Date(+p[0], +p[1] - 1, +p[2]).getDay() + 6) % 7];
  const seciliOlaylar = gunOlaylari(secili, seciliGunAdi);

  return (
    <section className={s.bolum} id="bolum-takvim">
      <div className={s["bolum-bas"]}>
        <h2>📅 Takvimim</h2>
        <div className={s["tk-lejant"]}>
          {TK_TIPLER.map((t) => (
            <label key={t.tip} className={filtre[t.tip] ? s.acik : ""}>
              <input
                type="checkbox"
                checked={filtre[t.tip]}
                onChange={() => setFiltre((f) => ({ ...f, [t.tip]: !f[t.tip] }))}
              />
              <span className={s["tk-benek"]} style={{ background: t.renk }} />
              {t.ad}
            </label>
          ))}
        </div>
      </div>
      <div className={s["takvim-ust"]}>
        <div className={s["tk-nav"]}>
          <button type="button" onClick={() => ayKaydir(-1)} aria-label="Önceki ay">
            ‹
          </button>
          <span className={s["takvim-ay"]}>
            {TK_AYLAR[ayIdx]} {yil}
          </span>
          <button type="button" onClick={() => ayKaydir(1)} aria-label="Sonraki ay">
            ›
          </button>
          <button type="button" className={s["tk-bugun-btn"]} onClick={bugune}>
            Bugün
          </button>
        </div>
        <span className="tag">
          Bu ay: {sayac.ozel} özel ders · {sayac.odev} ödev · {sayac.deneme} deneme
        </span>
      </div>
      <div className={s["takvim-izgara"]}>
        {TK_GUNADI.map((g) => (
          <div key={g} className={s["takvim-gunadi"]}>
            {g}
          </div>
        ))}
        {hucreler}
      </div>
      <div className={s["takvim-detay"]}>
        <h3>
          📋 {tarihStr(secili)} · {seciliGunAdi}
        </h3>
        {seciliOlaylar.length ? (
          seciliOlaylar.map((o, i) => (
            <div key={i} className={`${s["liste-satir"]} ${o.tamam ? s.tamam : ""}`}>
              <div className={s["liste-govde"]}>{o.detay}</div>
            </div>
          ))
        ) : (
          <p className={s["bos-mesaj"]}>Bu gün için planlanmış bir şey yok. 🌤️</p>
        )}
      </div>
    </section>
  );
}
