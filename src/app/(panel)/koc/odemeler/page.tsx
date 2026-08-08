import type { Metadata } from "next";
import { aktifKullanici } from "@/lib/oturum";
import { kocOdemeleri } from "@/lib/odeme-sunucu";
import { kocOzeti, tutarStr } from "@/lib/odeme";
import { tarihStr } from "@/lib/hesap";
import { KocDurumRozeti } from "@/components/odeme/OdemeRozeti";
import stil from "@/components/odeme/odeme.module.css";

export const metadata: Metadata = { title: "Ödemeler – Kaynak Kampüs" };

/* Öğretmene YAPILACAK ödemeler: ödeme tarihi, öğrenci, açıklama, tutar, durum.
   Öğrenciden yalnız AD gösterilir — sorgu (lib/odeme-sunucu.ts kocOdemeleri)
   öğrencinin platforma ödediği tutarı, tahsilat durumunu ve platform
   komisyonunu HİÇ ÇEKMEZ; bu veriler sayfaya ulaşmadığı için istemcide de
   görünmez. */
export default async function KocOdemelerSayfasi() {
  const koc = await aktifKullanici("koc");
  const odemeler = await kocOdemeleri(koc.id);
  const ozet = kocOzeti(odemeler);

  return (
    <main className="container" style={{ maxWidth: 1000, paddingBottom: 40 }}>
      <div className="panel-bas">
        <h1>
          Öde<span>meler</span>
        </h1>
        <p>Size yapılacak ödemeler ve ödeme durumları bu sayfada listelenir.</p>
      </div>

      <div className={stil.ozet}>
        <div className={stil.ozetKutu}>
          <b>{ozet.adet}</b>
          <small>Ödeme kalemi</small>
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
          💳 <span>Ödeme Listem</span>
        </h2>
        <p className={stil.bolumNot}>
          Durumlar: <b>Bekliyor</b> — ödeme planlandı, <b>Hazırlanıyor</b> — ödeme
          hazırlanıyor, <b>Ödendi</b> — hesabınıza aktarıldı. Bir kalemle ilgili sorunuz
          olursa kurum yönetimiyle iletişime geçin.
        </p>
        <div className={stil.tabloSarici}>
          <table className={stil.tablo}>
            <thead>
              <tr>
                <th>Ödeme Tarihi</th>
                <th>Öğrenci</th>
                <th>Açıklama</th>
                <th className={stil.sag}>Tutar</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {odemeler.map((o) => (
                <tr key={o.id}>
                  <td>
                    <b>{tarihStr(o.tarih)}</b>
                  </td>
                  <td data-label="Öğrenci">{o.ogrenciAd}</td>
                  <td data-label="Açıklama">{o.aciklama || "—"}</td>
                  <td data-label="Tutar" className={`${stil.tutar} ${stil.sag}`}>
                    {tutarStr(o.tutar)}
                  </td>
                  <td data-label="Durum">
                    <KocDurumRozeti durum={o.durum} />
                    {o.durum === "odendi" && o.odemeTarihi && (
                      <small style={{ color: "var(--muted)", marginLeft: 8 }}>
                        {tarihStr(o.odemeTarihi)}
                      </small>
                    )}
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
