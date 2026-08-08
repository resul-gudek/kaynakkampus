import type { Metadata } from "next";
import { aktifKullanici } from "@/lib/oturum";
import { ogrenciOdemeleri } from "@/lib/odeme-sunucu";
import { ogrenciOzeti, tutarStr } from "@/lib/odeme";
import { ODEME_YONTEM_ETIKETLERI } from "@/lib/sabitler";
import { tarihStr } from "@/lib/hesap";
import { OgrenciDurumRozeti } from "@/components/odeme/OdemeRozeti";
import stil from "@/components/odeme/odeme.module.css";

export const metadata: Metadata = { title: "Ödemelerim – Kaynak Kampüs" };

/* Öğrencinin KENDİ ödemeleri ve ödeme geçmişi.
   Sorgu (lib/odeme-sunucu.ts ogrenciOdemeleri) yalnız kendi satırlarını ve
   yalnız öğrenci bacağının kolonlarını çeker: öğretmenin alacağı ücret ve
   platformun kazancı bu sayfaya veri olarak da GELMEZ. */
export default async function OgrenciOdemelerSayfasi() {
  const ogrenci = await aktifKullanici("ogrenci");
  const odemeler = await ogrenciOdemeleri(ogrenci.id);
  const ozet = ogrenciOzeti(odemeler);

  return (
    <main className="container" style={{ maxWidth: 1000, paddingBottom: 40 }}>
      <div className="panel-bas">
        <h1>
          Ödeme<span>lerim</span>
        </h1>
        <p>Yaptığınız ödemeler ve ödeme geçmişiniz bu sayfada listelenir.</p>
      </div>

      <div className={stil.ozet}>
        <div className={stil.ozetKutu}>
          <b>{ozet.adet}</b>
          <small>Ödeme kaydı</small>
        </div>
        <div className={stil.ozetKutu}>
          <b>{tutarStr(ozet.toplam)}</b>
          <small>Toplam tutar</small>
        </div>
        <div className={`${stil.ozetKutu} ${stil.olumlu}`}>
          <b>{tutarStr(ozet.odenen)}</b>
          <small>Ödenen</small>
        </div>
        <div className={`${stil.ozetKutu} ${stil.bekleyen}`}>
          <b>{tutarStr(ozet.bekleyen)}</b>
          <small>Bekleyen</small>
        </div>
      </div>

      <div className={stil.bolum}>
        <h2>
          💳 <span>Ödeme Geçmişim</span>
        </h2>
        <p className={stil.bolumNot}>
          En yeni kayıt üstte görünür. Bir kalemde eksik ya da hatalı gördüğünüz bilgi
          olursa kurum yönetimiyle iletişime geçin.
        </p>
        <div className={stil.tabloSarici}>
          <table className={stil.tablo}>
            <thead>
              <tr>
                <th>Ödeme Tarihi</th>
                <th>Açıklama</th>
                <th className={stil.sag}>Tutar</th>
                <th>Durum</th>
                <th>Ödendiği Tarih</th>
              </tr>
            </thead>
            <tbody>
              {odemeler.map((o) => (
                <tr key={o.id} className={o.durum === "iptal" ? stil.iptalSatir : ""}>
                  <td>
                    <b>{tarihStr(o.tarih)}</b>
                  </td>
                  <td data-label="Açıklama">{o.aciklama || "—"}</td>
                  <td data-label="Tutar" className={`${stil.tutar} ${stil.sag}`}>
                    {tutarStr(o.tutar)}
                  </td>
                  <td data-label="Durum">
                    <OgrenciDurumRozeti durum={o.durum} />
                  </td>
                  <td data-label="Ödendiği Tarih">
                    {o.odemeTarihi
                      ? `${tarihStr(o.odemeTarihi)}${
                          o.yontem ? ` · ${ODEME_YONTEM_ETIKETLERI[o.yontem]}` : ""
                        }`
                      : "—"}
                  </td>
                </tr>
              ))}
              {odemeler.length === 0 && (
                <tr>
                  <td colSpan={5} className={stil.bos}>
                    Henüz kayıtlı bir ödemeniz yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
