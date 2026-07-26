/* 🏁 Test sonucu — doğru/yanlış/boş, başarı yüzdesi ve tamamlama süresi.
   Sunucu bileşeni; hem öğrenci sonuç ekranı hem öğretmen detayı kullanır.
   Doğru cevaplar yalnız test kapandıktan sonra buraya taşınır. */

import Link from "next/link";
import { TEST_SECENEKLERI } from "@/lib/sabitler";
import { sureEtiketi, sureMetni } from "@/lib/sureli-test";
import type { SonucSoru, TestSonucS } from "./tipler";
import s from "./test.module.css";

interface Props {
  baslik: string;
  altBaslik: string;
  soruSayisi: number;
  sure: number; // testin tanımlı süresi (dk)
  sonuc: TestSonucS;
  /** Cevap incelemesi — verilmezse yalnız özet gösterilir */
  sorular?: SonucSoru[];
  geri?: { etiket: string; href: string };
}

export default function TestSonuc({
  baslik,
  altBaslik,
  soruSayisi,
  sure,
  sonuc,
  sorular,
  geri,
}: Props) {
  const sureDoldu = sonuc.durum === "sureDoldu";

  return (
    <section className={s.bolum}>
      <div className={s.bolumBas}>
        <h2>🏁 {baslik}</h2>
        <span className={`${s.rozet} ${sureDoldu ? s.rozetSure : s.rozetTamam}`}>
          {sureDoldu ? "⏰ Süre doldu" : "✓ Tamamlandı"}
        </span>
      </div>

      <div className={s.meta}>
        <span className="tag">{altBaslik}</span>
        <span className="tag">📝 {soruSayisi} soru</span>
        <span className="tag">⏱️ Test süresi: {sureEtiketi(sure)}</span>
        {!!sonuc.bitis && <span className="tag">📅 {sonuc.bitis}</span>}
      </div>

      <div className={s.sonucIzgara} style={{ marginTop: 16 }}>
        <div className={`${s.sonucKutu} ${s.yesil}`}>
          <small>Doğru</small>
          <b>{sonuc.dogru}</b>
        </div>
        <div className={`${s.sonucKutu} ${s.kirmizi}`}>
          <small>Yanlış</small>
          <b>{sonuc.yanlis}</b>
        </div>
        <div className={`${s.sonucKutu} ${s.gri}`}>
          <small>Boş</small>
          <b>{sonuc.bos}</b>
        </div>
        <div className={`${s.sonucKutu} ${s.vurgulu}`}>
          <small>Başarı</small>
          <b>%{sonuc.yuzde}</b>
        </div>
        <div className={s.sonucKutu}>
          <small>Tamamlama süresi</small>
          <b>{sureMetni(sonuc.gecenSure)}</b>
        </div>
      </div>

      <div className={s.yuzdeCubuk} aria-hidden="true">
        <i style={{ width: `${sonuc.yuzde}%` }} />
      </div>

      {sorular?.length ? (
        <>
          <p className={s.formBaslik}>Cevap incelemesi</p>
          {sorular.map((soru) => (
            <div key={soru.id} className={s.soru}>
              <div className={s.soruBas}>
                <span className={s.soruNo}>{soru.sira}</span>
                <p className={s.soruMetin}>{soru.metin}</p>
              </div>
              <div className={s.secenekler}>
                {soru.secenekler.map((metin, i) => {
                  const harf = TEST_SECENEKLERI[i];
                  const dogruSik = soru.dogru === harf;
                  const yanlisSecim = soru.verilen === harf && !dogruSik;
                  return (
                    <div
                      key={harf}
                      className={`${s.secenek} ${dogruSik ? s.dogruSecenek : ""} ${
                        yanlisSecim ? s.yanlisSecenek : ""
                      }`}
                    >
                      <span className={s.secenekHarf}>{harf}</span>
                      <span className={s.secenekMetin}>{metin}</span>
                      {dogruSik && <span className={s.isaret}>✓ Doğru cevap</span>}
                      {yanlisSecim && <span className={s.isaret}>✕ Senin cevabın</span>}
                    </div>
                  );
                })}
              </div>
              {!soru.verilen && <p className={s.notMetin}>Bu soruyu boş bıraktın.</p>}
            </div>
          ))}
        </>
      ) : null}

      {geri && (
        <div className={s.formAlt}>
          <Link href={geri.href} className="btn btn-outline btn-kucuk">
            {geri.etiket}
          </Link>
        </div>
      )}
    </section>
  );
}
