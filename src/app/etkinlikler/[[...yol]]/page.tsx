import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  altlari,
  boyutMetni,
  etkinlikIndirUrl,
  etkinlikKapakUrl,
  etkinlikPdfUrl,
  etkinlikYolUrl,
  pdfSayisi,
} from "@/lib/etkinlik";
import { yayindakiAgac, type HamDugum } from "@/lib/etkinlik-sunucu";
import KlasorIkonu from "@/components/etkinlik/KlasorIkonu";
import s from "../etkinlik.module.css";

/* Herkese açık PDF etkinlik arşivi — oturum gerekmez.
   Tek catch-all rota tüm klasör derinliklerini karşılar:
     /etkinlikler                       → kök
     /etkinlikler/ilkokul/2-sinif/turkce → iç klasör

   Arşiv seyrek değişir; sayfa önbelleklenir ve panelden yapılan her
   değişiklikte revalidatePath ile tazelenir (bkz. actions/etkinlik.ts). */
export const revalidate = 300;

/** Yol parçalarını izleyerek klasörü bulur; yol geçersizse null */
function klasoruCoz(agac: HamDugum[], yol: string[]): HamDugum | null | undefined {
  let ustId: string | null = null;
  let bulunan: HamDugum | undefined;
  for (const parca of yol) {
    bulunan = agac.find((d) => d.ustId === ustId && d.slug === parca && d.tur === "klasor");
    if (!bulunan) return undefined; // yol kırık → 404
    ustId = bulunan.id;
  }
  return bulunan ?? null; // null = kök
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ yol?: string[] }>;
}): Promise<Metadata> {
  const { yol } = await params;
  const parcalar = yol ?? [];
  const agac = await yayindakiAgac();
  const klasor = klasoruCoz(agac, parcalar);
  if (klasor === undefined) notFound();

  const ad = klasor?.ad ?? "Etkinlikler";
  const adres = etkinlikYolUrl(parcalar);
  const aciklama = klasor
    ? `${ad} klasöründeki ücretsiz PDF çalışma kâğıtları ve etkinlikler — Kaynak Kampüs etkinlik arşivi.`
    : "İlkokul, ortaokul ve lise için sınıf ve ders klasörlerine göre düzenlenmiş, indirilebilir ücretsiz PDF çalışma kâğıtları.";

  return {
    title: klasor ? `${ad} – Etkinlikler – Kaynak Kampüs` : "Etkinlikler – Kaynak Kampüs",
    description: aciklama,
    alternates: { canonical: adres },
    openGraph: {
      type: "website",
      title: klasor ? `${ad} – Etkinlik Arşivi` : "Etkinlik Arşivi – Kaynak Kampüs",
      description: aciklama,
      url: adres,
      siteName: "Kaynak Kampüs",
      locale: "tr_TR",
    },
  };
}

export default async function EtkinlikArsivSayfasi({
  params,
}: {
  params: Promise<{ yol?: string[] }>;
}) {
  const { yol } = await params;
  const parcalar = yol ?? [];
  const agac = await yayindakiAgac();
  const klasor = klasoruCoz(agac, parcalar);
  if (klasor === undefined) notFound();

  const icerik = altlari(agac, klasor?.id ?? null);
  const klasorler = icerik.filter((d) => d.tur === "klasor");
  const pdfler = icerik.filter((d) => d.tur === "pdf");

  /* Kırıntı yolu: her adımın kendi adresi slug zincirinden kurulur */
  const kirinti = parcalar.map((_, i) => ({
    ad: klasoruCoz(agac, parcalar.slice(0, i + 1))?.ad ?? "",
    adres: etkinlikYolUrl(parcalar.slice(0, i + 1)),
  }));
  const ustAdres = parcalar.length ? etkinlikYolUrl(parcalar.slice(0, -1)) : "";

  return (
    <main>
      <section className={s.sahneBas}>
        <div className="container">
          <span className={s.rozet}>🗂 Etkinlik Arşivi</span>
          <h1>
            {klasor ? (
              <>
                {klasor.ad} <span>etkinlikleri</span>
              </>
            ) : (
              <>
                Sınıf sınıf <span>çalışma kâğıtları</span>
              </>
            )}
          </h1>
          <p>
            {klasor
              ? "Klasörlere girerek ilgili çalışma kâğıtlarına ulaşabilir, PDF'leri görüntüleyip indirebilirsiniz."
              : "İlkokul, ortaokul ve lise için sınıf ve ders klasörlerine göre düzenlenmiş ücretsiz PDF etkinlikler. Klasöre girip dilediğinizi indirin."}
          </p>
        </div>
      </section>

      <section className={s.govde}>
        <div className="container">
          {/* ── Kırıntı yolu ── */}
          <nav className={s.kirinti} aria-label="Konum">
            <Link href="/etkinlikler">Etkinlikler</Link>
            {kirinti.map((k, i) => (
              <span key={k.adres} className={s.kirintiParca}>
                <span aria-hidden>›</span>
                {i === kirinti.length - 1 ? <b>{k.ad}</b> : <Link href={k.adres}>{k.ad}</Link>}
              </span>
            ))}
          </nav>

          {!!parcalar.length && (
            <Link href={ustAdres} className={s.ustKlasor}>
              ← Üst klasöre dön
            </Link>
          )}

          {!icerik.length ? (
            <div className={s.bos}>
              <span aria-hidden>🗂</span>
              <b>Bu klasörde henüz etkinlik yok.</b>
              <p>Yeni çalışma kâğıtları eklendikçe burada görünecek.</p>
              <Link href="/etkinlikler" className="btn btn-outline">
                Arşive dön
              </Link>
            </div>
          ) : (
            <div className={s.izgara}>
              {klasorler.map((k) => (
                <Link
                  key={k.id}
                  href={etkinlikYolUrl([...parcalar, k.slug])}
                  className={`${s.kart} ${s.klasorKart}`}
                >
                  <span className={s.kare}>
                    <KlasorIkonu className={s.klasorIkon} boyut={72} />
                  </span>
                  <span className={s.kartGovde}>
                    <span className={s.kartBaslik}>{k.ad}</span>
                    <span className={s.kartNot}>
                      {(() => {
                        const n = pdfSayisi(agac, k.id);
                        const altKlasor = altlari(agac, k.id).filter(
                          (a) => a.tur === "klasor"
                        ).length;
                        if (altKlasor && n) return `${altKlasor} klasör · ${n} etkinlik`;
                        if (altKlasor) return `${altKlasor} klasör`;
                        return `${n} etkinlik`;
                      })()}
                    </span>
                  </span>
                </Link>
              ))}

              {pdfler.map((p) => (
                <article key={p.id} className={s.kart}>
                  <a
                    className={s.kare}
                    href={etkinlikPdfUrl(p.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${p.ad} — PDF'i görüntüle`}
                  >
                    {p.kapakYol ? (
                      /* Görsel API rotasından gelir (public dizinde değil) */
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={etkinlikKapakUrl(p.id)} alt={p.ad} loading="lazy" />
                    ) : (
                      /* Kapak yoksa kurumsal varsayılan PDF görseli */
                      <span className={s.pdfGorsel} aria-hidden>
                        <span className={s.pdfSayfa}>
                          <span className={s.pdfSatir} />
                          <span className={s.pdfSatir} />
                          <span className={s.pdfSatir} />
                        </span>
                        <span className={s.pdfEtiket}>PDF</span>
                      </span>
                    )}
                  </a>
                  <div className={s.kartGovde}>
                    <h2 className={s.kartBaslik}>{p.ad}</h2>
                    {!!p.dosyaBoyut && (
                      <span className={s.kartNot}>{boyutMetni(p.dosyaBoyut)}</span>
                    )}
                    <div className={s.pdfEylem}>
                      <a
                        href={etkinlikPdfUrl(p.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={s.gorButon}
                      >
                        PDF&apos;yi Görüntüle
                      </a>
                      <a href={etkinlikIndirUrl(p.id)} className={s.indirButon}>
                        İndir
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
