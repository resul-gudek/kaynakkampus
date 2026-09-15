import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import {
  BASVURAN_ETIKETLERI,
  EGITIM_BASVURU_DURUM_ETIKETLERI,
  EGITIM_BASVURU_TUR_ETIKETLERI,
  EGITIM_ETIKETLERI,
  basvuruBolumleri,
  sinifEtiketi,
  type Basvuran,
  type Egitim,
  type EgitimBasvuruDurum,
  type EgitimBasvuruTur,
} from "@/lib/egitim-basvurusu";
import DurumSecici from "../DurumSecici";
import stil from "../egitim-basvurulari.module.css";

export const metadata: Metadata = { title: "Eğitim Başvurusu Detayı – Kaynak Kampüs" };

/* Detay da her istekte veritabanından okunur (durum değişince bayatlamasın). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Parametreler = Promise<{ id: string }>;

const fmtTamTarih = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function EgitimBasvuruDetaySayfasi({ params }: { params: Parametreler }) {
  await aktifKullanici("admin");
  const { id } = await params;

  const b = await prisma.egitimBasvurusu.findUnique({ where: { id } });
  if (!b) notFound();

  let veri: unknown = {};
  try {
    veri = JSON.parse(b.veri);
  } catch {
    veri = {};
  }
  const bolumler = basvuruBolumleri(b.tur, veri);
  const turEtiketi = EGITIM_BASVURU_TUR_ETIKETLERI[b.tur as EgitimBasvuruTur] ?? b.tur;
  const egitim = b.tur === "ozel_ders" ? EGITIM_ETIKETLERI[b.egitim as Egitim] ?? b.egitim : "";
  const telHam = b.telefon.replace(/\s/g, "");
  /* Geri bağlantısı kaydın kendi sekmesine döner (liste varsayılanı "Tümü"dür). */
  const listeAdresi = `/admin/egitim-basvurulari?tur=${b.tur}`;

  return (
    <main className={`container ${stil.sayfa}`}>
      <div className={stil.detayUst}>
        <Link href={listeAdresi} className={stil.geri}>
          ← Eğitim Başvuruları
        </Link>
      </div>

      <div className="panel-bas" style={{ paddingTop: 0 }}>
        <h1>
          {b.ogrenciAd} <span>· {egitim || turEtiketi}</span>
        </h1>
        <p>
          {turEtiketi} başvurusu · {b.yas} yaş, {sinifEtiketi(b.sinif)} · {fmtTamTarih.format(b.olusturma)}
        </p>
      </div>

      <div className={stil.detayGrid}>
        <section>
          <div className={stil.panel}>
            <h2 className={stil.panelBaslik}>📋 Başvuru bilgileri</h2>
            {bolumler.map((g) => (
              <div key={g.baslik}>
                <div className={stil.grupBaslik}>{g.baslik}</div>
                <dl className={stil.veriListe}>
                  {g.satirlar.map((r) => (
                    <div key={r.etiket}>
                      <dt>{r.etiket}</dt>
                      <dd>{r.deger}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>

        <aside>
          <div className={stil.panel}>
            <h2 className={stil.panelBaslik}>🔄 Durum</h2>
            <p style={{ marginBottom: 10 }}>
              <span className={`${stil.durumRozet} ${stil[`durum_${b.durum as EgitimBasvuruDurum}`] ?? ""}`}>
                {EGITIM_BASVURU_DURUM_ETIKETLERI[b.durum as EgitimBasvuruDurum] ?? b.durum}
              </span>
            </p>
            <DurumSecici id={b.id} durum={b.durum} buyuk />
          </div>

          <div className={stil.panel}>
            <h2 className={stil.panelBaslik}>📞 İletişim</h2>
            <div className={stil.ozetKutu}>
              <div className={stil.ozetSatir}>
                <span>Başvuran</span>
                <b>{BASVURAN_ETIKETLERI[b.basvuran as Basvuran] ?? b.basvuran}</b>
              </div>
              <div className={stil.ozetSatir}>
                <span>Ad soyad</span>
                <b>{b.iletisimAd}</b>
              </div>
              <div className={stil.ozetSatir}>
                <span>Telefon</span>
                <a href={`tel:${telHam}`}>{b.telefon}</a>
              </div>
              <div className={stil.ozetSatir}>
                <span>E-posta</span>
                <a href={`mailto:${b.eposta}`}>{b.eposta}</a>
              </div>
            </div>
            <div className={stil.hizliEylemler}>
              <a href={`tel:${telHam}`}>📞 Ara</a>
              <a href={`https://wa.me/${telHam.replace(/^0/, "90")}`} target="_blank" rel="noopener noreferrer">
                💬 WhatsApp
              </a>
              <a href={`mailto:${b.eposta}?subject=${encodeURIComponent(`Kaynak Kampüs – ${turEtiketi} başvurunuz`)}`}>✉️ E-posta</a>
            </div>
          </div>

          <div className={stil.panel}>
            <h2 className={stil.panelBaslik}>🕒 Kayıt</h2>
            <div className={stil.ozetKutu}>
              <div className={stil.ozetSatir}>
                <span>Başvuru</span>
                <b>{fmtTamTarih.format(b.olusturma)}</b>
              </div>
              <div className={stil.ozetSatir}>
                <span>Son güncelleme</span>
                <b>{fmtTamTarih.format(b.guncelleme)}</b>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
