"use client";

/* ⏱️ Test çözüm ekranı — geri sayan sayaç + şık işaretleme.

   Sayaç, sunucudan gelen mutlak bitiş anına (bitisSiniri) göre her saniye
   yeniden hesaplanır; sekme uyutulsa ya da saat kaysa bile kalan süre
   şaşmaz. Sayaç sıfırlandığında test otomatik teslim edilir.

   Cevaplar işaretlendikçe sunucuya kaydedilir (gecikmeli): öğrenci sekmeyi
   kapatıp dönmezse süre dolduğunda kayıtlı cevaplar puanlanır. */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TEST_SECENEKLERI } from "@/lib/sabitler";
import { kalanSaniye, sureEtiketi, sureMetni } from "@/lib/sureli-test";
import { testCevapKaydet, testTamamla } from "@/actions/sureli-test";
import TestTeslimOnay from "./TestTeslimOnay";
import type { CozumOturumu, CozumSoru } from "./tipler";
import s from "./test.module.css";

/** Cevap değişikliğinden bu kadar sonra sunucuya yazılır (ms) */
const KAYIT_GECIKMESI = 1000;
/** Sayaç bu saniyenin altına düşünce kırmızı yanıp söner */
const UYARI_SANIYE = 60;

export default function TestCozum({
  oturum,
  sorular,
}: {
  oturum: CozumOturumu;
  sorular: CozumSoru[];
}) {
  const router = useRouter();
  const [cevaplar, setCevaplar] = useState<Record<string, string>>(oturum.cevaplar);
  const [kalan, setKalan] = useState(() => kalanSaniye(oturum.bitisSiniri));
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [teslimEdiliyor, setTeslimEdiliyor] = useState(false);
  const [teslimOnay, setTeslimOnay] = useState(false);
  const [teslimHata, setTeslimHata] = useState("");

  // Teslim bir kez olur: sayaç ve buton aynı anda tetiklenebilir
  const teslimRef = useRef(false);
  // Teslim/kayıt anındaki güncel cevaplar (efekt bağımlılığı olmadan okunur)
  const cevapRef = useRef(cevaplar);
  useEffect(() => {
    cevapRef.current = cevaplar;
  }, [cevaplar]);

  const teslimEt = useCallback(
    async (otomatik: boolean) => {
      if (teslimRef.current) return;
      teslimRef.current = true;
      setTeslimEdiliyor(true);
      const sonuc = await testTamamla(oturum.id, cevapRef.current, otomatik);
      if (sonuc.hata) {
        // Teslim başarısız → öğrenci yeniden denesin (süre dolduysa sunucu kapatır)
        teslimRef.current = false;
        setTeslimEdiliyor(false);
        setTeslimHata(sonuc.hata);
        return;
      }
      router.refresh(); // sayfa artık sonuç ekranını gösterir
    },
    [oturum.id, router]
  );

  /* ── Sayaç ── */
  useEffect(() => {
    function tik() {
      const k = kalanSaniye(oturum.bitisSiniri);
      setKalan(k);
      if (k <= 0) {
        setTeslimOnay(false); // onay penceresi açıksa kapanır: teslim zaten otomatik
        void teslimEt(true);
      }
    }
    tik(); // süre sayfa açılırken çoktan bitmiş olabilir
    const zaman = setInterval(tik, 1000);
    return () => clearInterval(zaman);
  }, [oturum.bitisSiniri, teslimEt]);

  /* ── Cevapları gecikmeli kaydet ──
     Sunucudaki hâlle karşılaştırılır: değişiklik yoksa (ilk render, yeniden
     bağlanma) boşa yazma yapılmaz. */
  const kaydedilenRef = useRef(JSON.stringify(oturum.cevaplar));
  useEffect(() => {
    if (teslimRef.current || JSON.stringify(cevaplar) === kaydedilenRef.current) return;
    setKaydediliyor(true);
    const zaman = setTimeout(async () => {
      const seri = JSON.stringify(cevapRef.current);
      await testCevapKaydet(oturum.id, cevapRef.current);
      kaydedilenRef.current = seri;
      setKaydediliyor(false);
    }, KAYIT_GECIKMESI);
    return () => clearTimeout(zaman);
  }, [cevaplar, oturum.id]);

  /* ── Sekme kapatma uyarısı (test sürerken) ── */
  useEffect(() => {
    function uyar(e: BeforeUnloadEvent) {
      if (!teslimRef.current) e.preventDefault();
    }
    window.addEventListener("beforeunload", uyar);
    return () => window.removeEventListener("beforeunload", uyar);
  }, []);

  function isaretle(soruId: string, harf: string) {
    if (teslimRef.current) return;
    setCevaplar((mevcut) => {
      if (mevcut[soruId] !== harf) return { ...mevcut, [soruId]: harf };
      // Aynı şıkka tekrar tıklamak cevabı siler (soruyu boş bırakma)
      const kalanlar = { ...mevcut };
      delete kalanlar[soruId];
      return kalanlar;
    });
  }

  function teslimSor() {
    if (teslimRef.current) return;
    setTeslimHata("");
    setTeslimOnay(true);
  }

  const cevaplanan = Object.keys(cevaplar).length;
  const toplamSaniye = oturum.sure * 60;
  const yuzde = toplamSaniye ? Math.max(0, Math.min(100, (kalan / toplamSaniye) * 100)) : 0;
  const azaldi = kalan <= UYARI_SANIYE;

  return (
    <>
      {/* ── Sayaç çubuğu ── */}
      <div className={s.sayacCubuk}>
        <div className={s.sayacBilgi}>
          <b>{oturum.testAd}</b>
          <small>
            {oturum.ders}
            {oturum.konu ? ` – ${oturum.konu}` : ""} · {sorular.length} soru ·{" "}
            {sureEtiketi(oturum.sure)}
          </small>
        </div>
        <div className={`${s.sayac} ${azaldi ? s.sayacUyari : ""}`}>
          <span aria-hidden="true">⏱️</span>
          <time
            role="timer"
            aria-label={`Kalan süre ${sureMetni(kalan)}`}
            dateTime={`PT${Math.max(0, kalan)}S`}
            title="Kalan süre"
          >
            {sureMetni(kalan)}
          </time>
        </div>
        <div className={s.ilerlemeCubuk} aria-hidden="true">
          <i className={azaldi ? s.azaldi : ""} style={{ width: `${yuzde}%` }} />
        </div>
      </div>

      <section className={s.bolum}>
        {/* Soru gezinme şeridi */}
        <div className={s.izleme} aria-label="Soru durumu">
          {sorular.map((soru) => (
            <a
              key={soru.id}
              href={`#soru-${soru.sira}`}
              className={`${s.izlemeNokta} ${cevaplar[soru.id] ? s.dolu : ""}`}
              title={`${soru.sira}. soru${cevaplar[soru.id] ? ` · ${cevaplar[soru.id]}` : " · boş"}`}
            >
              {soru.sira}
            </a>
          ))}
        </div>

        {sorular.map((soru) => {
          const secili = cevaplar[soru.id] ?? "";
          return (
            <div
              key={soru.id}
              id={`soru-${soru.sira}`}
              className={`${s.soru} ${secili ? s.cevapli : ""}`}
            >
              <div className={s.soruBas}>
                <span className={s.soruNo}>{soru.sira}</span>
                <p className={s.soruMetin}>{soru.metin}</p>
              </div>
              <div className={s.secenekler} role="group" aria-label={`${soru.sira}. soru şıkları`}>
                {soru.secenekler.map((metin, i) => {
                  const harf = TEST_SECENEKLERI[i];
                  return (
                    <button
                      key={harf}
                      type="button"
                      className={`${s.secenek} ${secili === harf ? s.secili : ""}`}
                      aria-pressed={secili === harf}
                      disabled={teslimEdiliyor}
                      onClick={() => isaretle(soru.id, harf)}
                    >
                      <span className={s.secenekHarf}>{harf}</span>
                      <span className={s.secenekMetin}>{metin}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className={s.altCubuk}>
          <span className={s.kayitDurum}>
            {cevaplanan}/{sorular.length} soru cevaplandı
            {kaydediliyor ? " · kaydediliyor…" : " · kaydedildi ✓"}
          </span>
          <button
            type="button"
            className="btn btn-primary"
            disabled={teslimEdiliyor}
            onClick={teslimSor}
          >
            {teslimEdiliyor ? "Tamamlanıyor…" : "✓ Testi Tamamla"}
          </button>
        </div>

        {/* Otomatik teslim hatası: onay penceresi kapalıyken de görünür olmalı */}
        {teslimHata && !teslimOnay && (
          <p className={s.pencereHata} role="alert">
            {teslimHata}
          </p>
        )}

        <p className={s.notMetin}>
          Süre dolduğunda test otomatik olarak tamamlanır; işaretlediğin cevaplar kaydedilir.
        </p>
      </section>

      {teslimOnay && (
        <TestTeslimOnay
          soruSayisi={sorular.length}
          cevaplanan={cevaplanan}
          kalan={kalan}
          hata={teslimHata}
          teslimEdiliyor={teslimEdiliyor}
          onOnay={() => void teslimEt(false)}
          onIptal={() => {
            setTeslimOnay(false);
            setTeslimHata("");
          }}
        />
      )}
    </>
  );
}
