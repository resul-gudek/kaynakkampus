import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { aktifKullanici } from "@/lib/oturum";
import { ROL_ANASAYFA } from "@/lib/auth.config";
import { yetkiVar } from "@/lib/yetki";
import { zamanStr } from "@/lib/tarih";
import type { Rol } from "@/lib/sabitler";
import {
  HEDEF_GRUBU_ROLU,
  gonderenGruplari,
  grupEtiketi,
  metinKisalt,
} from "@/lib/bildirim-gonder";
import { adayAlicilar, gonderimGecmisi } from "@/lib/bildirim-gonder-sunucu";
import BosDurum from "@/components/maskot/BosDurum";
import BildirimGonderForm from "./BildirimGonderForm";
import admin from "../admin/admin.module.css";
import stil from "./bildirim-gonder.module.css";

export const metadata: Metadata = { title: "Bildirim Gönder – Kaynak Kampüs" };

/* Derin bağlantı: ?kisi=<id>[,<id>…] — koç öğrenci detayından "Bildirim Gönder"
   ile gelinirken öğrenci (ve velisi) önceden seçili açılır. Aday kümesinde
   olmayan kimlikler sessizce yok sayılır. */
export default async function BildirimGonderSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ kisi?: string }>;
}) {
  const kullanici = await aktifKullanici();
  const rol = kullanici.rol as Rol;
  if (!yetkiVar(rol, "bildirim:gonder")) redirect(ROL_ANASAYFA[rol] ?? "/");

  const sp = await searchParams;
  const kim = { id: kullanici.id, rol };

  const [adaylar, gecmis] = await Promise.all([adayAlicilar(kim), gonderimGecmisi(kim)]);

  const adayIdler = new Set(adaylar.map((a) => a.id));
  const onSecili = (sp.kisi ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x && adayIdler.has(x));

  const gruplar = gonderenGruplari(rol).map((g) => ({
    anahtar: g,
    etiket: grupEtiketi(g, rol),
    sayi: adaylar.filter((a) => a.rol === HEDEF_GRUBU_ROLU[g]).length,
  }));

  const yonetici = rol === "admin";

  return (
    <main className="container" style={{ maxWidth: 1080, paddingBottom: 40 }}>
      <div className="panel-bas">
        <h1>
          Bildirim <span>Gönder</span>
        </h1>
        <p>
          {yonetici
            ? "Öğrenci, veli, öğretmen ve koçlara uygulama içi bildirim gönderin. Cihaz bildirimi açık olanlara telefon/bilgisayarlarına da düşer."
            : "Öğrencilerinize ve velilerine uygulama içi bildirim gönderin. Cihaz bildirimi açık olanlara telefon/bilgisayarlarına da düşer."}
        </p>
      </div>

      {adaylar.length === 0 ? (
        <section className={admin.bolum}>
          <BosDurum
            ifade="sakin"
            baslik="Bildirim gönderebileceğiniz kimse yok."
            metin={
              yonetici
                ? "Sistemde sizden başka aktif kullanıcı bulunmuyor."
                : "Size atanmış ya da online sınıflarınıza üye aktif öğrenci bulunmuyor."
            }
          />
        </section>
      ) : (
        <BildirimGonderForm rol={rol} gruplar={gruplar} adaylar={adaylar} onSecili={onSecili} />
      )}

      {/* ── Gönderim geçmişi ── */}
      <section className={admin.bolum}>
        <h2>
          🕐 <span>Gönderim Geçmişi</span>
        </h2>
        {gecmis.length === 0 ? (
          <p className={stil.bosNot}>Henüz panelden gönderilmiş bildirim yok.</p>
        ) : (
          <div className={admin.tabloSarici}>
            <table className={admin.tablo}>
              <thead>
                <tr>
                  <th>Bildirim</th>
                  <th>Kime</th>
                  {yonetici && <th>Gönderen</th>}
                  <th>Tarih</th>
                  <th>Alıcı</th>
                  <th>Okunan</th>
                </tr>
              </thead>
              <tbody>
                {gecmis.map((g) => {
                  const yuzde = g.aliciSayisi ? Math.round((g.okunan / g.aliciSayisi) * 100) : 0;
                  return (
                    <tr key={g.id}>
                      <td>
                        <span className={stil.gecmisMetin} title={g.metin}>
                          <span aria-hidden="true">{g.ikon}</span> {metinKisalt(g.metin)}
                        </span>
                      </td>
                      <td data-label="Kime">{g.hedefOzet}</td>
                      {yonetici && <td data-label="Gönderen">{g.gonderenAd}</td>}
                      <td data-label="Tarih" className={stil.tarih}>{zamanStr(g.tarih)}</td>
                      <td data-label="Alıcı">{g.aliciSayisi}</td>
                      <td data-label="Okunan">
                        <span className={stil.okunma} title={`${g.okunan} / ${g.aliciSayisi} okundu`}>
                          <i style={{ width: `${yuzde}%` }} />
                          <b>%{yuzde}</b>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
