import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import {
  BASVURU_TUR_ETIKETLERI,
  MULAKAT_SONUC_ETIKETLERI,
  type BasvuruTur,
} from "@/lib/sabitler";
import { FORMLAR } from "@/app/basvuru/formlar";
import type { FormTanimi } from "@/app/basvuru/tipler";
import { DOSYA_ALANLARI } from "@/lib/basvuru-dosya-tanim";
import DurumSecici from "./DurumSecici";
import NotlarPaneli from "./NotlarPaneli";
import MulakatPaneli, { type AktifMulakat, type GecmisMulakat } from "./MulakatPaneli";
import stil from "../basvurular.module.css";

export const metadata: Metadata = { title: "Başvuru Detayı – Kaynak Kampüs" };

/* Olumlu sonuçlanan başvuruda hesabın DOĞRU rolle açılması için yöneticiyi
   ilgili ekrana yollar. Başvuru türü "koc" = eğitim koçu, "ogretmen" = öğretmen;
   iki tür ayrı kullanıcı rolüne karşılık gelir (bkz. lib/sabitler.ts ROLLER). */
const HESAP_EKRANI: Record<BasvuruTur, string> = {
  ogretmen: "/admin/ogretmenler",
  koc: "/admin/koclar",
  ogrenci: "/admin/kullanicilar?rol=ogrenci",
};

type Parametreler = Promise<{ id: string }>;

const fmtTamTarih = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const fmtTarihGirdi = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const fmtSaatGirdi = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Istanbul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** veri JSON'undan, form tanımını kullanarak etiketli görüntü satırları üretir. */
function veriSatirlari(form: FormTanimi, veri: Record<string, unknown>) {
  const gruplar: { baslik: string; satirlar: { etiket: string; deger: string }[] }[] = [];
  for (const adim of form.adimlar) {
    const satirlar: { etiket: string; deger: string }[] = [];
    for (const a of adim.alanlar) {
      if (a.tip === "dosya") continue;
      const v = veri[a.ad];
      let metin = "";
      if (a.tip === "onay") {
        metin = v === true ? "Evet" : "";
      } else if (Array.isArray(v)) {
        metin = v.map(String).join(", ");
      } else if (v !== undefined && v !== null && String(v).trim() !== "") {
        metin = String(v);
      }
      if (metin) satirlar.push({ etiket: a.etiket, deger: metin });
    }
    if (satirlar.length) gruplar.push({ baslik: adim.baslik, satirlar });
  }
  return gruplar;
}

export default async function BasvuruDetaySayfasi({ params }: { params: Parametreler }) {
  await aktifKullanici("admin");
  const { id } = await params;

  const basvuru = await prisma.basvuru.findUnique({
    where: { id },
    include: {
      dosyalar: { orderBy: { olusturma: "asc" } },
      notlar: { orderBy: { olusturma: "desc" } },
      mulakatlar: { orderBy: { olusturma: "desc" } },
    },
  });
  if (!basvuru) notFound();

  const form = FORMLAR[basvuru.tur as FormTanimi["tur"]] ?? null;
  let veri: Record<string, unknown> = {};
  try {
    veri = JSON.parse(basvuru.veri) as Record<string, unknown>;
  } catch {
    veri = {};
  }
  const gruplar = form ? veriSatirlari(form, veri) : [];
  const turEtiket = BASVURU_TUR_ETIKETLERI[basvuru.tur as BasvuruTur] ?? basvuru.tur;

  // Mülakatlar → aktif + geçmiş
  const aktifKayit = basvuru.mulakatlar.find((m) => m.aktif) ?? null;
  const aktif: AktifMulakat | null = aktifKayit
    ? {
        id: aktifKayit.id,
        tarih: fmtTarihGirdi.format(aktifKayit.tarih),
        saat: fmtSaatGirdi.format(aktifKayit.tarih),
        tarihMetni: fmtTamTarih.format(aktifKayit.tarih),
        sure: aktifKayit.sure,
        tur: aktifKayit.tur,
        baglanti: aktifKayit.baglanti,
        adres: aktifKayit.adres,
        gorusmeci: aktifKayit.gorusmeci,
        aciklama: aktifKayit.aciklama,
        sonuc: aktifKayit.sonuc,
        sonucNotu: aktifKayit.sonucNotu,
      }
    : null;
  const gecmis: GecmisMulakat[] = basvuru.mulakatlar
    .filter((m) => !m.aktif)
    .map((m) => ({ id: m.id, tarihMetni: fmtTamTarih.format(m.tarih), tur: m.tur, sonuc: m.sonuc }));

  const notlar = basvuru.notlar.map((n) => ({
    id: n.id,
    metin: n.metin,
    yazarAd: n.yazarAd,
    olusturma: fmtTamTarih.format(n.olusturma),
  }));

  return (
    <main className={`container ${stil.sayfa}`}>
      <div className={stil.detayUst}>
        <Link href="/admin/basvurular" className={stil.geri}>
          ← Başvurular
        </Link>
      </div>

      <div className="panel-bas" style={{ paddingTop: 8 }}>
        <h1>
          {basvuru.ad} <span>· {turEtiket}</span>
        </h1>
        <p>Başvuru tarihi: {fmtTamTarih.format(basvuru.olusturma)}</p>
      </div>

      <div className={stil.detayGrid}>
        {/* Sol: form verisi + dosyalar + mülakat */}
        <div>
          <section className={stil.panel}>
            <h2 className={stil.panelBaslik}>📋 Başvuru bilgileri</h2>
            {gruplar.map((g) => (
              <div key={g.baslik}>
                <p className={stil.grupBaslik}>{g.baslik}</p>
                <dl className={stil.veriListe}>
                  {g.satirlar.map((s, i) => (
                    <div key={i}>
                      <dt>{s.etiket}</dt>
                      <dd>{s.deger}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
            {gruplar.length === 0 && <p>Bu başvuruda görüntülenecek bilgi bulunamadı.</p>}
          </section>

          <section className={stil.panel}>
            <h2 className={stil.panelBaslik}>📎 Yüklenen belgeler</h2>
            {basvuru.dosyalar.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: ".88rem" }}>Belge yüklenmemiş.</p>
            ) : (
              <div className={stil.dosyalar}>
                {basvuru.dosyalar.map((d) => (
                  <div key={d.id} className={stil.dosyaSatir}>
                    <span>
                      {DOSYA_ALANLARI[d.alan as keyof typeof DOSYA_ALANLARI]?.etiket ?? d.alan}
                      {" · "}
                      <a href={`/api/basvuru/dosya/${d.id}`} target="_blank" rel="noopener noreferrer">
                        {d.ad}
                      </a>
                    </span>
                    <span className={stil.dosyaBoyut}>{(d.boyut / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={stil.panel}>
            <h2 className={stil.panelBaslik}>📅 Mülakat</h2>
            <MulakatPaneli basvuruId={basvuru.id} aktif={aktif} gecmis={gecmis} />
            {aktif?.sonuc && (
              <p style={{ marginTop: 12, fontSize: ".85rem", color: "var(--muted)" }}>
                Güncel sonuç:{" "}
                <b style={{ color: "var(--text)" }}>
                  {MULAKAT_SONUC_ETIKETLERI[aktif.sonuc as keyof typeof MULAKAT_SONUC_ETIKETLERI] ??
                    aktif.sonuc}
                </b>
                {aktif.sonucNotu ? ` — ${aktif.sonucNotu}` : ""}
              </p>
            )}
          </section>
        </div>

        {/* Sağ: iletişim + durum + notlar */}
        <div>
          <section className={stil.panel}>
            <h2 className={stil.panelBaslik}>👤 İletişim</h2>
            <div className={stil.ozetKutu}>
              <span>
                <b>Ad:</b> {basvuru.ad}
              </span>
              {basvuru.telefon && (
                <span>
                  <b>Telefon:</b> {basvuru.telefon}
                </span>
              )}
              {basvuru.eposta && (
                <span>
                  <b>E-posta:</b> <a href={`mailto:${basvuru.eposta}`}>{basvuru.eposta}</a>
                </span>
              )}
              {basvuru.sehir && (
                <span>
                  <b>Şehir:</b> {basvuru.sehir}
                </span>
              )}
            </div>
          </section>

          <section className={stil.panel}>
            <h2 className={stil.panelBaslik}>🏷️ Durum</h2>
            <DurumSecici id={basvuru.id} durum={basvuru.durum} />
            {basvuru.durum === "olumlu" && (
              <p style={{ marginTop: 12, fontSize: ".85rem", color: "var(--muted)" }}>
                Hesabı <b style={{ color: "var(--text)" }}>{turEtiket}</b> rolüyle açmak için{" "}
                <Link href={HESAP_EKRANI[basvuru.tur as BasvuruTur] ?? "/admin/kullanicilar"}>
                  ilgili ekranı aç →
                </Link>
              </p>
            )}
          </section>

          <section className={stil.panel}>
            <h2 className={stil.panelBaslik}>📝 Yönetici notları</h2>
            <NotlarPaneli basvuruId={basvuru.id} notlar={notlar} />
          </section>
        </div>
      </div>
    </main>
  );
}
