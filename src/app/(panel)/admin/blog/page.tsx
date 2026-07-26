import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { yetkiVar } from "@/lib/yetki";
import { ROL_ANASAYFA } from "@/lib/auth.config";
import type { Rol } from "@/lib/sabitler";
import BlogYonetim, { type BlogSatir } from "./BlogYonetim";

export const metadata: Metadata = { title: "Blog – Kaynak Kampüs" };

export default async function AdminBlogSayfasi() {
  const kullanici = await aktifKullanici();
  const rol = kullanici.rol as Rol;
  if (!yetkiVar(rol, "blog:yonet")) redirect(ROL_ANASAYFA[rol] ?? "/giris");

  const yazilar = await prisma.blogYazi.findMany({
    orderBy: [{ guncelleme: "desc" }],
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
      durum: true,
      yayinTarihi: true,
      okuma: true,
      kapakYol: true,
      kapakAd: true,
      guncelleme: true,
    },
  });

  const satirlar: BlogSatir[] = yazilar.map((y) => ({
    id: y.id,
    slug: y.slug,
    baslik: y.baslik,
    ozet: y.ozet,
    icerik: y.icerik,
    kategori: y.kategori,
    etiketler: y.etiketler,
    seoAciklama: y.seoAciklama,
    yazarAd: y.yazarAd,
    durum: y.durum,
    yayinTarihi: y.yayinTarihi ? y.yayinTarihi.toISOString().slice(0, 10) : "",
    okuma: y.okuma,
    kapakVar: !!y.kapakYol,
    kapakAd: y.kapakAd,
    guncelleme: y.guncelleme.toISOString().slice(0, 10),
  }));

  return <BlogYonetim yazilar={satirlar} varsayilanYazar={kullanici.ad} />;
}
