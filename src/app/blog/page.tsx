import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { gecerliKategori, yayinTarihiMetni } from "@/lib/blog";
import { YAYINDA_KOSUL } from "@/lib/blog-sunucu";
import BlogListe from "./BlogListe";
import type { YaziKarti } from "./tipler";
import s from "./blog.module.css";

/* Herkese açık: oturum gerekmez. Yazılar seyrek değiştiği için sayfa
   önbelleklenir; yayın/düzenleme sonrası revalidatePath ile tazelenir
   (bkz. actions/blog.ts). */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog – Kaynak Kampüs",
  description:
    "Eğitim, öğrenci ve öğretmen rehberi, sınav hazırlığı, ders çalışma yöntemleri, eğitim koçluğu ve etkinlik önerileri üzerine Kaynak Kampüs yazıları.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: "Blog – Kaynak Kampüs",
    description:
      "Eğitim, rehberlik, sınav hazırlığı ve ders çalışma yöntemleri üzerine Kaynak Kampüs yazıları.",
    url: "/blog",
    siteName: "Kaynak Kampüs",
    locale: "tr_TR",
  },
};

export default async function BlogSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; q?: string }>;
}) {
  const { kategori, q } = await searchParams;

  const yazilar = await prisma.blogYazi.findMany({
    where: YAYINDA_KOSUL,
    orderBy: [{ yayinTarihi: "desc" }, { olusturma: "desc" }],
    select: {
      id: true,
      slug: true,
      baslik: true,
      ozet: true,
      kategori: true,
      etiketler: true,
      yayinTarihi: true,
      okuma: true,
      kapakYol: true,
    },
  });

  const kartlar: YaziKarti[] = yazilar.map((y) => ({
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
  }));

  /* Geçersiz kategori parametresi yok sayılır (süzgeç açılışta boş kalır) */
  const secili = gecerliKategori(kategori) ?? "";

  return (
    <main>
      <section className={s.sahneBas}>
        <div className="container">
          <span className={s.rozet}>📰 Kaynak Kampüs Blog</span>
          <h1>
            Eğitimde yol gösteren <span>yazılar</span>
          </h1>
        </div>
      </section>

      <section className={s.govde}>
        <div className="container">
          <BlogListe yazilar={kartlar} ilkKategori={secili} ilkArama={q ?? ""} />
        </div>
      </section>
    </main>
  );
}
