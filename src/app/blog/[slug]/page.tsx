import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  blogKapakUrl,
  blogYaziUrl,
  etiketleriAyir,
  kategoriEtiketi,
  kategoriIkonu,
  ozetUret,
  slugGecerli,
  yayinTarihiMetni,
} from "@/lib/blog";
import { YAYINDA_KOSUL } from "@/lib/blog-sunucu";
import { mutlakAdres } from "@/lib/site";
import Icerik from "../Icerik";
import YaziKarti from "../YaziKarti";
import type { YaziKarti as YaziKartiVerisi } from "../tipler";
import s from "../blog.module.css";

/* Herkese açık yazı sayfası — oturum gerekmez.
   ISR: yayın/düzenleme sonrası revalidatePath ile tazelenir. */
export const revalidate = 300;

const ILGILI_ADET = 3;

/** Yayındaki yazıyı slug'a göre getirir (taslak yazılar 404 döner) */
async function yaziGetir(slug: string) {
  if (!slugGecerli(slug)) return null;
  return prisma.blogYazi.findFirst({
    where: { slug, ...YAYINDA_KOSUL },
    select: {
      id: true,
      slug: true,
      baslik: true,
      ozet: true,
      icerik: true,
      kategori: true,
      etiketler: true,
      seoAciklama: true,
      yazarAd: true,
      yayinTarihi: true,
      okuma: true,
      kapakYol: true,
      guncelleme: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const yazi = await yaziGetir(slug);
  /* 404 KARARI BURADA VERİLİR. Kök src/app/loading.tsx bir Suspense sınırı
     kurduğu için sayfa gövdesinde çağrılan notFound() kabuk akıtıldıktan
     sonra çalışır ve yanıt 200 kalır (yumuşak 404 → arama motorları
     olmayan adresi indeksler). generateMetadata akıştan ÖNCE çalıştığından
     durum kodu buradan doğru şekilde 404 olur. */
  if (!yazi) notFound();

  const aciklama = yazi.seoAciklama || yazi.ozet || ozetUret(yazi.icerik, 155);
  const adres = blogYaziUrl(yazi.slug);
  const kapak = yazi.kapakYol ? [{ url: blogKapakUrl(yazi.id) }] : undefined;

  return {
    title: `${yazi.baslik} – Kaynak Kampüs Blog`,
    description: aciklama,
    keywords: etiketleriAyir(yazi.etiketler),
    alternates: { canonical: adres },
    openGraph: {
      type: "article",
      title: yazi.baslik,
      description: aciklama,
      url: adres,
      siteName: "Kaynak Kampüs",
      locale: "tr_TR",
      publishedTime: yazi.yayinTarihi?.toISOString(),
      modifiedTime: yazi.guncelleme.toISOString(),
      images: kapak,
    },
    twitter: {
      card: kapak ? "summary_large_image" : "summary",
      title: yazi.baslik,
      description: aciklama,
      images: kapak?.map((k) => k.url),
    },
  };
}

export default async function BlogYaziSayfasi({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const yazi = await yaziGetir(slug);
  if (!yazi) notFound();

  /* İlgili yazılar: önce aynı kategori, yetmezse en yeni diğer yazılarla
     tamamlanır (kategoride tek yazı varsa bölüm boş kalmasın). */
  const ayniKategori = await prisma.blogYazi.findMany({
    where: { ...YAYINDA_KOSUL, kategori: yazi.kategori, id: { not: yazi.id } },
    orderBy: [{ yayinTarihi: "desc" }],
    take: ILGILI_ADET,
    select: KART_ALANLARI,
  });

  let ilgili = ayniKategori;
  if (ilgili.length < ILGILI_ADET) {
    const digerleri = await prisma.blogYazi.findMany({
      where: {
        ...YAYINDA_KOSUL,
        id: { notIn: [yazi.id, ...ilgili.map((y) => y.id)] },
      },
      orderBy: [{ yayinTarihi: "desc" }],
      take: ILGILI_ADET - ilgili.length,
      select: KART_ALANLARI,
    });
    ilgili = [...ilgili, ...digerleri];
  }

  const etiketler = etiketleriAyir(yazi.etiketler);
  const tarih = yayinTarihiMetni(yazi.yayinTarihi);

  /* Arama motorları için yapısal veri (JSON-LD). Kullanıcı verisi
     JSON.stringify ile kaçırılır; içeriğe HTML enjekte edilemez. */
  const yapisalVeri = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: mutlakAdres(blogYaziUrl(yazi.slug)),
    headline: yazi.baslik,
    description: yazi.seoAciklama || yazi.ozet,
    articleSection: kategoriEtiketi(yazi.kategori),
    keywords: etiketler.join(", "),
    datePublished: yazi.yayinTarihi?.toISOString(),
    dateModified: yazi.guncelleme.toISOString(),
    author: { "@type": "Organization", name: yazi.yazarAd || "Kaynak Kampüs" },
    publisher: { "@type": "Organization", name: "Kaynak Kampüs" },
    inLanguage: "tr-TR",
  };

  return (
    <main>
      <script
        type="application/ld+json"
        // JSON-LD script gövdesi; HTML olarak yorumlanmaz
        dangerouslySetInnerHTML={{ __html: JSON.stringify(yapisalVeri).replace(/</g, "\\u003c") }}
      />

      <section className={s.yaziSahne}>
        <div className="container">
          <nav className={s.izYolu} aria-label="Konum">
            <Link href="/">Ana Sayfa</Link>
            <span aria-hidden>/</span>
            <Link href="/blog">Blog</Link>
            <span aria-hidden>/</span>
            <Link href={`/blog?kategori=${yazi.kategori}`}>{kategoriEtiketi(yazi.kategori)}</Link>
          </nav>

          <header className={s.yaziBas}>
            <h1>{yazi.baslik}</h1>
            <div className={s.yaziMeta}>
              <Link href={`/blog?kategori=${yazi.kategori}`} className={s.kategoriCip}>
                {kategoriIkonu(yazi.kategori)} {kategoriEtiketi(yazi.kategori)}
              </Link>
              {tarih && <time dateTime={yazi.yayinTarihi?.toISOString()}>📅 {tarih}</time>}
              {!!yazi.okuma && <span>⏱ {yazi.okuma} dk okuma</span>}
              {yazi.yazarAd && <span>✍️ {yazi.yazarAd}</span>}
            </div>
            {yazi.ozet && <p className={s.yaziOzet}>{yazi.ozet}</p>}
          </header>

          {yazi.kapakYol && (
            <div className={s.yaziKapak}>
              {/* Kapak API rotasından gelir (public dizinde değil) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={blogKapakUrl(yazi.id)} alt={yazi.baslik} />
            </div>
          )}

          <Icerik icerik={yazi.icerik} />

          {!!etiketler.length && (
            <div className={s.etiketler}>
              <b>Etiketler:</b>
              {etiketler.map((e) => (
                <span key={e} className={s.etiket}>
                  #{e}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {!!ilgili.length && (
        <section className={s.ilgili}>
          <div className="container">
            <h2>İlgili yazılar</h2>
            <p>Bu yazıyı okuyanların ilgisini çekebilecek diğer içerikler.</p>
            <div className={s.izgara}>
              {ilgili.map((y) => (
                <YaziKarti key={y.id} yazi={kartaCevir(y)} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={s.geriSatir}>
        <div className="container">
          <Link href="/blog" className="btn btn-outline">
            ← Tüm blog yazıları
          </Link>
        </div>
      </section>
    </main>
  );
}

/* ── Kart verisi ──────────────────────────────────────────── */

const KART_ALANLARI = {
  id: true,
  slug: true,
  baslik: true,
  ozet: true,
  kategori: true,
  etiketler: true,
  yayinTarihi: true,
  okuma: true,
  kapakYol: true,
} as const;

type KartKaydi = {
  id: string;
  slug: string;
  baslik: string;
  ozet: string;
  kategori: string;
  etiketler: string;
  yayinTarihi: Date | null;
  okuma: number;
  kapakYol: string | null;
};

function kartaCevir(y: KartKaydi): YaziKartiVerisi {
  return {
    id: y.id,
    slug: y.slug,
    baslik: y.baslik,
    ozet: y.ozet,
    kategori: y.kategori,
    etiketler: y.etiketler,
    tarihMetni: yayinTarihiMetni(y.yayinTarihi),
    tarihIso: y.yayinTarihi?.toISOString() ?? "",
    okuma: y.okuma,
    kapakVar: !!y.kapakYol,
  };
}
