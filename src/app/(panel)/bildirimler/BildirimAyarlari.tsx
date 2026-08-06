"use client";

import { useState, useTransition } from "react";
import {
  bildirimTercihiKaydet,
  cihazKaldir,
  tumBildirimTercihleriniKaydet,
} from "@/actions/bildirim-tercih";
import type { BildirimTuru, TurTanim } from "@/lib/bildirim-tercih";
import stil from "./bildirimler.module.css";

export interface CihazGorunum {
  id: string;
  ad: string; // "Windows · Chrome" gibi okunur ad
  eklendi: string;
}

interface Props {
  turler: TurTanim[];
  tercihler: Record<string, boolean>;
  cihazlar: CihazGorunum[];
}

/* Kullanıcının kendi bildirim ayarları. Anahtarlar iyimser günceller:
   sunucu hata dönerse eski değere geri alınır ve hata gösterilir. */
export default function BildirimAyarlari({ turler, tercihler, cihazlar }: Props) {
  const [acik, setAcik] = useState(false);
  const [durum, setDurum] = useState<Record<string, boolean>>(tercihler);
  const [aygitlar, setAygitlar] = useState(cihazlar);
  const [hata, setHata] = useState("");
  const [, baslat] = useTransition();

  const acikSayi = turler.filter((t) => durum[t.tur]).length;
  const hepsiAcik = acikSayi === turler.length;

  function turDegistir(tur: BildirimTuru, yeni: boolean) {
    const onceki = durum[tur];
    setDurum((d) => ({ ...d, [tur]: yeni }));
    setHata("");
    baslat(async () => {
      const sonuc = await bildirimTercihiKaydet({ tur, push: yeni });
      if (sonuc.hata) {
        setDurum((d) => ({ ...d, [tur]: onceki }));
        setHata(sonuc.hata);
      }
    });
  }

  function tumunuDegistir(yeni: boolean) {
    const onceki = durum;
    const hepsi: Record<string, boolean> = { ...durum };
    for (const t of turler) hepsi[t.tur] = yeni;
    setDurum(hepsi);
    setHata("");
    baslat(async () => {
      const sonuc = await tumBildirimTercihleriniKaydet(yeni);
      if (sonuc.hata) {
        setDurum(onceki);
        setHata(sonuc.hata);
      }
    });
  }

  function cihazSil(id: string) {
    const onceki = aygitlar;
    setAygitlar((c) => c.filter((x) => x.id !== id));
    setHata("");
    baslat(async () => {
      const sonuc = await cihazKaldir(id);
      if (sonuc.hata) {
        setAygitlar(onceki);
        setHata(sonuc.hata);
      }
    });
  }

  return (
    <section className={stil.ayarBolum}>
      <button
        type="button"
        className={stil.ayarBaslik}
        onClick={() => setAcik((a) => !a)}
        aria-expanded={acik}
      >
        <span>⚙️ Bildirim ayarları</span>
        <span className={stil.ayarOzet}>
          {acikSayi === 0
            ? "cihaz bildirimleri kapalı"
            : hepsiAcik
              ? "tümü açık"
              : `${acikSayi}/${turler.length} açık`}
          <span aria-hidden> {acik ? "▲" : "▼"}</span>
        </span>
      </button>

      {acik && (
        <div className={stil.ayarGovde}>
          <p className={stil.ayarNot}>
            Buradaki anahtarlar <b>cihazınıza düşen bildirimleri</b> yönetir. Bildirimler her
            durumda bu listede görünmeye devam eder, yani hiçbir şeyi kaçırmazsınız.
          </p>

          {hata && <p className={stil.ayarHata}>{hata}</p>}

          <div className={stil.ayarSatir}>
            <div className={stil.ayarMetin}>
              <b>Tümü</b>
              <span>Bütün bildirim türlerini birlikte aç ya da kapat.</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hepsiAcik}
              aria-label="Tüm bildirim türleri"
              className={hepsiAcik ? stil.anahtarAcik : stil.anahtar}
              onClick={() => tumunuDegistir(!hepsiAcik)}
            >
              <span className={stil.anahtarTopu} />
            </button>
          </div>

          <ul className={stil.ayarListe}>
            {turler.map((t) => (
              <li key={t.tur} className={stil.ayarSatir}>
                <div className={stil.ayarMetin}>
                  <b>
                    {t.ikon} {t.ad}
                  </b>
                  <span>{t.aciklama}</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!durum[t.tur]}
                  aria-label={t.ad}
                  className={durum[t.tur] ? stil.anahtarAcik : stil.anahtar}
                  onClick={() => turDegistir(t.tur, !durum[t.tur])}
                >
                  <span className={stil.anahtarTopu} />
                </button>
              </li>
            ))}
          </ul>

          <h3 className={stil.ayarAltBaslik}>Kayıtlı cihazlar</h3>
          {aygitlar.length === 0 ? (
            <p className={stil.ayarNot}>
              Henüz kayıtlı cihaz yok. Bildirim almak istediğiniz cihazda sağ altta çıkan
              <b> “bildirimleri aç”</b> kutusundan izin vermeniz gerekiyor.
            </p>
          ) : (
            <ul className={stil.cihazListe}>
              {aygitlar.map((c) => (
                <li key={c.id} className={stil.cihazSatir}>
                  <div className={stil.ayarMetin}>
                    <b>{c.ad}</b>
                    <span>{c.eklendi} tarihinde eklendi</span>
                  </div>
                  <button
                    type="button"
                    className={stil.silBtn}
                    title="Bu cihazı kaldır"
                    aria-label={c.ad + " cihazını kaldır"}
                    onClick={() => cihazSil(c.id)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
