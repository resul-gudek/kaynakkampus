"use client";

/* ✓ Test teslim onayı — teslimden sonra cevaplar değiştirilemez, kalan süre
   de kullanılamaz. Öğrenci kararı bilerek versin diye cevaplanan/boş sayısı
   ve kalan süre gösterilir; boş soru varsa ayrıca uyarılır.

   Kalan süre canlıdır: pencere açıkken de saniye saniye azalır (sayaç
   çalışmaya devam eder), süre dolarsa pencere kapanıp teslim otomatik olur. */

import { sureMetni } from "@/lib/sureli-test";
import OnayPenceresi from "./OnayPenceresi";
import s from "./test.module.css";

export default function TestTeslimOnay({
  soruSayisi,
  cevaplanan,
  kalan,
  hata,
  teslimEdiliyor,
  onOnay,
  onIptal,
}: {
  soruSayisi: number;
  cevaplanan: number;
  /** Kalan saniye */
  kalan: number;
  hata: string;
  teslimEdiliyor: boolean;
  onOnay: () => void;
  onIptal: () => void;
}) {
  const bos = Math.max(0, soruSayisi - cevaplanan);

  return (
    <OnayPenceresi
      ikon="✓"
      baslik="Testi tamamlamak üzeresin"
      altBaslik={
        bos
          ? `${soruSayisi} sorudan ${cevaplanan} tanesini cevapladın`
          : "Bütün soruları cevapladın"
      }
      hata={hata}
      islemde={teslimEdiliyor}
      onayEtiketi="✓ Testi Tamamla"
      islemdeEtiketi="Tamamlanıyor…"
      iptalEtiketi="↩ Çözmeye Dön"
      onOnay={onOnay}
      onIptal={onIptal}
    >
      <div className={s.pencereOzet}>
        <div className={s.ozetKutu}>
          <small>Cevaplanan</small>
          <b>{cevaplanan}</b>
        </div>
        <div className={`${s.ozetKutu} ${bos ? s.ozetBos : ""}`}>
          <small>Boş</small>
          <b>{bos}</b>
        </div>
        <div className={s.ozetKutu}>
          <small>Kalan süre</small>
          <b>{sureMetni(kalan)}</b>
        </div>
      </div>

      {bos > 0 && (
        <p className={s.pencereUyari}>
          <span aria-hidden="true">⚠️</span>
          <span>
            <b>{bos} soru boş kalacak.</b> Boş sorular yanlış saymaz ama puan da getirmez.
          </span>
        </p>
      )}

      <ul className={s.pencereMaddeler}>
        <li>
          <span className={s.maddeIkon} aria-hidden="true">🔒</span>
          <span className={s.maddeMetin}>Tamamladıktan sonra cevaplarını <b>değiştiremezsin</b>.</span>
        </li>
        <li>
          <span className={s.maddeIkon} aria-hidden="true">⏱️</span>
          <span className={s.maddeMetin}>Kalan {sureMetni(kalan)} süreden vazgeçmiş olursun.</span>
        </li>
        <li>
          <span className={s.maddeIkon} aria-hidden="true">📊</span>
          <span className={s.maddeMetin}>Sonucun ve doğru cevaplar hemen ardından gösterilir.</span>
        </li>
      </ul>
    </OnayPenceresi>
  );
}
