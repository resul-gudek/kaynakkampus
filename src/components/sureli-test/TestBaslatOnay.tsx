"use client";

/* ⏱️ Test başlatma onayı — süre başladıktan sonra geri dönüşü olmadığı için
   öğrenciye ne olacağı maddeler hâlinde gösterilir.
   Pencere kabuğu (dialog, Esc, backdrop, hata alanı): OnayPenceresi. */

import { sureEtiketi } from "@/lib/sureli-test";
import { tarihStr } from "@/lib/hesap";
import OnayPenceresi from "./OnayPenceresi";
import s from "./test.module.css";

export interface BaslatilacakTest {
  ad: string;
  ders: string;
  konu: string;
  seviye: string;
  soruSayisi: number;
  sure: number; // dakika
  sonTarih: string; // ISO "YYYY-MM-DD" ya da ""
}

export default function TestBaslatOnay({
  test,
  basliyor,
  hata,
  onOnay,
  onIptal,
}: {
  test: BaslatilacakTest;
  basliyor: boolean;
  hata: string;
  onOnay: () => void;
  onIptal: () => void;
}) {
  return (
    <OnayPenceresi
      ikon="⏱️"
      baslik="Testi başlatmak üzeresin"
      altBaslik={`${test.ad} · ${test.ders}${test.konu ? ` – ${test.konu}` : ""}`}
      hata={hata}
      islemde={basliyor}
      onayEtiketi="▶ Hazırım, Başlat"
      islemdeEtiketi="Başlatılıyor…"
      onOnay={onOnay}
      onIptal={onIptal}
    >
      <div className={s.pencereOzet}>
        <div className={s.ozetKutu}>
          <small>Soru</small>
          <b>{test.soruSayisi}</b>
        </div>
        <div className={s.ozetKutu}>
          <small>Süre</small>
          <b>{sureEtiketi(test.sure)}</b>
        </div>
        {test.seviye && (
          <div className={s.ozetKutu}>
            <small>Seviye</small>
            <b>{test.seviye}</b>
          </div>
        )}
        {test.sonTarih && (
          <div className={`${s.ozetKutu} ${s.ozetTarih}`}>
            <small>Son tarih</small>
            <b>{tarihStr(test.sonTarih)}</b>
          </div>
        )}
      </div>

      {/* Her maddenin cümlesi tek <span> içinde durur — bkz. .maddeMetin notu */}
      <ul className={s.pencereMaddeler}>
        <li>
          <span className={s.maddeIkon} aria-hidden="true">▶</span>
          <span className={s.maddeMetin}>Sayaç <b>başlat</b> demenle işlemeye başlar ve <b>durmaz</b>.</span>
        </li>
        <li>
          <span className={s.maddeIkon} aria-hidden="true">🔒</span>
          <span className={s.maddeMetin}>Sekmeyi kapatsan ya da çıksan bile süre işlemeye devam eder.</span>
        </li>
        <li>
          <span className={s.maddeIkon} aria-hidden="true">💾</span>
          <span className={s.maddeMetin}>İşaretlediğin cevaplar kendiliğinden kaydedilir.</span>
        </li>
        <li>
          <span className={s.maddeIkon} aria-hidden="true">⏰</span>
          <span className={s.maddeMetin}>Süre dolduğunda test otomatik tamamlanır ve puanlanır.</span>
        </li>
        <li>
          <span className={s.maddeIkon} aria-hidden="true">1️⃣</span>
          <span className={s.maddeMetin}>Testi <b>yalnız bir kez</b> çözebilirsin.</span>
        </li>
      </ul>
    </OnayPenceresi>
  );
}
