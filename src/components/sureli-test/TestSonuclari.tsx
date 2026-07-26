"use client";

/* 📊 Öğretmen: test sonuçları tablosu.
   Hangi öğrenci hangi testi çözdü, sonucu ne, ne kadar sürede tamamladı.
   Öğrencilerim sayfasındaki "Süreli Testler" sekmesi de bu bileşeni kullanır
   (tekOgrenci=true → Öğrenci kolonu gizlenir). */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { sureMetni } from "@/lib/sureli-test";
import { testSonucSil } from "@/actions/sureli-test";
import { useVurgu } from "@/components/koc/vurgu";
import type { KocSonucS } from "./tipler";
import s from "./test.module.css";

export default function TestSonuclari({
  sonuclar,
  tekOgrenci = false,
  vurguId,
  baslik = "📊 Test Sonuçları",
}: {
  sonuclar: KocSonucS[];
  tekOgrenci?: boolean;
  vurguId?: string;
  baslik?: string;
}) {
  const router = useRouter();
  const [bekliyor, baslat] = useTransition();
  const vurgu = useVurgu(vurguId);

  function sil(x: KocSonucS) {
    if (
      !confirm(
        `${x.ogrenciAd} – "${x.testAd}" sonucu silinsin mi?\n\nSonuç silinirse öğrenci testi yeniden çözebilir.`
      )
    ) {
      return;
    }
    baslat(async () => {
      const sonuc = await testSonucSil(x.oturumId);
      if (sonuc.hata) alert(sonuc.hata);
      else router.refresh();
    });
  }

  const tamamlanan = sonuclar.filter((x) => x.durum !== "basladi");
  const ortalama = tamamlanan.length
    ? Math.round(tamamlanan.reduce((t, x) => t + x.yuzde, 0) / tamamlanan.length)
    : 0;

  return (
    <section className={s.bolum}>
      <div className={s.bolumBas}>
        <h2>{baslik}</h2>
        <span className="tag">
          {tamamlanan.length
            ? `${tamamlanan.length} çözüm · ortalama %${ortalama}`
            : "Çözüm yok"}
        </span>
      </div>

      {sonuclar.length ? (
        <div className={s.tabloSar}>
          <table className={s.tablo}>
            <thead>
              <tr>
                {!tekOgrenci && <th>Öğrenci</th>}
                <th>Test</th>
                <th className={s.sagaYasli}>Doğru</th>
                <th className={s.sagaYasli}>Yanlış</th>
                <th className={s.sagaYasli}>Boş</th>
                <th className={s.sagaYasli}>Başarı</th>
                <th className={s.sagaYasli}>Süre</th>
                <th>Durum</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sonuclar.map((x) => {
                const suruyor = x.durum === "basladi";
                return (
                  <tr
                    key={x.oturumId}
                    data-kayit={x.oturumId}
                    className={vurgu === x.oturumId ? s.vurgu : ""}
                  >
                    {!tekOgrenci && (
                      <td>
                        <b>{x.ogrenciAd}</b>
                      </td>
                    )}
                    <td>
                      <b>{x.testAd}</b>
                      <br />
                      <span className={s.griYazi}>
                        {x.ders}
                        {x.konu ? ` – ${x.konu}` : ""} · {x.soruSayisi} soru
                      </span>
                    </td>
                    <td className={`${s.sagaYasli} ${s.yesilYazi}`}>{suruyor ? "—" : x.dogru}</td>
                    <td className={`${s.sagaYasli} ${s.kirmiziYazi}`}>{suruyor ? "—" : x.yanlis}</td>
                    <td className={`${s.sagaYasli} ${s.griYazi}`}>{suruyor ? "—" : x.bos}</td>
                    <td className={s.sagaYasli}>
                      <b>{suruyor ? "—" : `%${x.yuzde}`}</b>
                    </td>
                    <td className={s.sagaYasli}>{suruyor ? "—" : sureMetni(x.gecenSure)}</td>
                    <td>
                      <span
                        className={`${s.rozet} ${
                          suruyor
                            ? s.rozetDevam
                            : x.durum === "sureDoldu"
                              ? s.rozetSure
                              : s.rozetTamam
                        }`}
                      >
                        {suruyor
                          ? "Çözüyor"
                          : x.durum === "sureDoldu"
                            ? "Süre doldu"
                            : "Tamamlandı"}
                      </span>
                      {!!x.bitis && <div className={s.griYazi}>{x.bitis}</div>}
                    </td>
                    <td>
                      {!suruyor && (
                        <button
                          type="button"
                          className={s.silBtn}
                          title="Sonucu sil (öğrenci yeniden çözebilir)"
                          disabled={bekliyor}
                          onClick={() => sil(x)}
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={s.bosMesaj}>Henüz çözülmüş bir süreli test yok.</p>
      )}
    </section>
  );
}
