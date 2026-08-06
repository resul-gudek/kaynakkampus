"use client";

/* ⏱️ Süreli Testlerim — öğrencinin test listesi.
   "Başlat" sunucuda oturum açar (süre o an işlemeye başlar) ve çözüm
   ekranına götürür; yarım kalan test "Devam Et" ile aynı oturumu sürdürür.

   Süre geri alınamadığı için başlatma öncesi onay penceresi (TestBaslatOnay)
   gösterilir; başlatma isteği de o pencerede beklenir. */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { bugun, tarihStr } from "@/lib/hesap";
import { sureEtiketi, sureMetni } from "@/lib/sureli-test";
import { testBaslat } from "@/actions/sureli-test";
import BosDurum from "@/components/maskot/BosDurum";
import TestBaslatOnay from "./TestBaslatOnay";
import { TEST_DURUM_ETIKETLERI, type TestKarti } from "./tipler";
import s from "./test.module.css";

/* Sıralama: çözülmedi → devam ediyor → çözülmüş (en yeni sonuç üstte) */
const SIRA: Record<string, number> = { "": 0, basladi: 1, tamamlandi: 2, sureDoldu: 2 };

export default function TestListesi({
  testler,
  vurguId,
}: {
  testler: TestKarti[];
  vurguId?: string;
}) {
  const router = useRouter();
  /** Onay penceresinde bekleyen test; null → pencere kapalı */
  const [onaylanan, setOnaylanan] = useState<TestKarti | null>(null);
  const [basliyor, setBasliyor] = useState(false);
  const [hata, setHata] = useState("");
  const [, baslat] = useTransition();

  const liste = [...testler].sort(
    (a, b) => SIRA[a.durum] - SIRA[b.durum] || a.ad.localeCompare(b.ad, "tr")
  );
  const cozulmeyen = liste.filter((t) => t.durum === "" || t.durum === "basladi").length;
  const simdi = bugun();

  function onaySor(t: TestKarti) {
    setHata("");
    setOnaylanan(t);
  }

  function onayKapat() {
    setOnaylanan(null);
    setHata("");
    // Hata gösterildiyse liste eskimiş olabilir (test kapanmış/atama kalkmış)
    if (hata) router.refresh();
  }

  function testeBasla() {
    const t = onaylanan;
    if (!t || basliyor) return;
    setBasliyor(true);
    setHata("");
    baslat(async () => {
      const sonuc = await testBaslat(t.testId);
      if (sonuc.hata) {
        // Pencere açık kalır: öğrenci hatayı okuyup vazgeçer ya da tekrar dener
        setBasliyor(false);
        setHata(sonuc.hata);
        return;
      }
      // basliyor açık bırakılır: yönlendirme bitene dek pencere kilitli kalsın
      router.push(`/ogrenci/testler/${sonuc.oturumId}`);
    });
  }

  return (
    <section className={s.bolum} id="bolum-testler">
      <div className={s.bolumBas}>
        <h2>⏱️ Süreli Testlerim</h2>
        <span className="tag">
          {liste.length
            ? `${cozulmeyen} çözülecek / ${liste.length} test`
            : "Atanmış test yok"}
        </span>
      </div>

      {liste.length ? (
        <div className={s.kartlar}>
          {liste.map((t) => {
            const cozuldu = t.durum === "tamamlandi" || t.durum === "sureDoldu";
            const devam = t.durum === "basladi";
            const gecikti = !cozuldu && !!t.sonTarih && t.sonTarih < simdi;
            return (
              <article
                key={t.testId}
                data-id={t.testId}
                className={`${s.kart} ${cozuldu ? s.cozuldu : ""} ${devam ? s.devam : ""} ${
                  vurguId === t.testId ? s.vurgu : ""
                }`}
              >
                <div className={s.kartBas}>
                  <div>
                    <b>{t.ad}</b>
                    <small>
                      {t.ders}
                      {t.konu ? ` – ${t.konu}` : ""}
                      {t.ogretmenAd ? ` · ${t.ogretmenAd}` : ""}
                    </small>
                  </div>
                  <span className={`${s.rozet} ${rozetStili(t.durum)}`}>
                    {TEST_DURUM_ETIKETLERI[t.durum]}
                  </span>
                </div>

                <div className={s.meta}>
                  <span className="tag">📝 {t.soruSayisi} soru</span>
                  <span className="tag">⏱️ {sureEtiketi(t.sure)}</span>
                  {t.seviye && <span className="tag">🎓 {t.seviye}</span>}
                  {!!t.sonTarih && (
                    <span className={gecikti ? `${s.rozet} ${s.rozetSure}` : "tag"}>
                      📅 {gecikti ? "Süresi geçti: " : "Son: "}
                      {tarihStr(t.sonTarih)}
                    </span>
                  )}
                </div>

                {cozuldu && t.sonuc && (
                  <div className={s.meta}>
                    <span className={s.yesilYazi}>{t.sonuc.dogru} doğru</span>
                    <span className={s.kirmiziYazi}>{t.sonuc.yanlis} yanlış</span>
                    <span className={s.griYazi}>{t.sonuc.bos} boş</span>
                    <span className="tag">%{t.sonuc.yuzde}</span>
                    <span className="tag">🕒 {sureMetni(t.sonuc.gecenSure)}</span>
                  </div>
                )}

                <div className={s.butonlar}>
                  {cozuldu ? (
                    <Link href={`/ogrenci/testler/${t.oturumId}`} className="btn btn-outline btn-kucuk">
                      Sonucu Gör
                    </Link>
                  ) : devam ? (
                    <Link href={`/ogrenci/testler/${t.oturumId}`} className="btn btn-primary btn-kucuk">
                      ▶ Devam Et
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-kucuk"
                      disabled={basliyor && onaylanan?.testId === t.testId}
                      onClick={() => onaySor(t)}
                    >
                      {basliyor && onaylanan?.testId === t.testId
                        ? "Başlatılıyor…"
                        : "▶ Testi Başlat"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <BosDurum
          ifade="sakin"
          baslik="Henüz süreli testin yok."
          metin="Öğretmenin test atadığında burada görünecek."
        />
      )}

      {onaylanan && (
        <TestBaslatOnay
          test={onaylanan}
          basliyor={basliyor}
          hata={hata}
          onOnay={testeBasla}
          onIptal={onayKapat}
        />
      )}
    </section>
  );
}

function rozetStili(durum: string) {
  if (durum === "tamamlandi") return s.rozetTamam;
  if (durum === "sureDoldu") return s.rozetSure;
  if (durum === "basladi") return s.rozetDevam;
  return s.rozetBekliyor;
}
