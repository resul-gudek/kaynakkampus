"use server";

/* ═══════════════════════════════════════════════════════════════
   Blog yazıları — yönetim eylemleri (yalnız yönetici).

   Blog kullanıcı sistemine BAĞLI DEĞİLDİR: yazının yazarı serbest
   metindir, ziyaretçi oturum açmadan yayınları okur. Yönetim tarafı
   "blog:yonet" yetkisiyle korunur (bkz. lib/yetki.ts).

   Kapak görseli public DIŞI dizinde saklanır (bkz. dosya-saklama.ts) ve
   /api/blog/kapak/[id] üzerinden sunulur.
   ═══════════════════════════════════════════════════════════════ */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { denetim } from "@/lib/log";
import { BlogDurumSemasi, BlogYaziSemasi } from "@/lib/dogrulama";
import { dosyaSakla, dosyaSil, klasorSil, type SaklananDosya } from "@/lib/dosya-saklama";
import {
  BLOG_KAPAK_GRUPLARI,
  blogKlasoru,
  etiketleriAyir,
  etiketleriBirlestir,
  okumaSuresi,
  ozetUret,
} from "@/lib/blog";
import { benzersizSlug } from "@/lib/blog-sunucu";
import { oturumGerekli, hataMetni, type EylemSonuc } from "./yardimci";

/** Yeni kayıtta istemcinin adresi gösterebilmesi için kimlik + slug döner */
type BlogSonuc = EylemSonuc & { id?: string; slug?: string };

/** Blog public sayfaları ISR ile önbelleklenir; mutasyondan sonra tazelenir */
function blogTazele(slug?: string, eskiSlug?: string) {
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  if (eskiSlug && eskiSlug !== slug) revalidatePath(`/blog/${eskiSlug}`);
  revalidatePath("/sitemap.xml");
}

/** FormData → BlogYaziSemasi girdisi */
function formVerisi(formData: FormData) {
  return {
    baslik: formData.get("baslik"),
    slug: formData.get("slug") ?? "",
    ozet: formData.get("ozet") ?? "",
    icerik: formData.get("icerik"),
    kategori: formData.get("kategori"),
    etiketler: etiketleriAyir(String(formData.get("etiketler") ?? "")),
    seoAciklama: formData.get("seoAciklama") ?? "",
    yazarAd: formData.get("yazarAd") ?? "",
    durum: formData.get("durum") || "taslak",
    yayinTarihi: formData.get("yayinTarihi") ?? "",
  };
}

/**
 * Yayın anı. Elle girilen tarih önceliklidir; yoksa kaydın mevcut tarihi
 * korunur (taslağa alınıp yeniden yayınlanan yazı ilk tarihini kaybetmez).
 * Hiç tarih yoksa yalnız yayına alınırken "şimdi" damgalanır — taslak
 * tarihsiz kalır (bkz. CK_BlogYazi_yayinTarihi).
 */
function yayinAni(durum: string, girilen: string, mevcut?: Date | null): Date | null {
  if (girilen) return new Date(`${girilen}T00:00:00.000Z`);
  if (mevcut) return mevcut;
  return durum === "yayinda" ? new Date() : null;
}

/** Kayıt alanlarını şemadan üretir (ekle/güncelle ortak) */
function kayitAlanlari(veri: ReturnType<typeof BlogYaziSemasi.parse>) {
  return {
    baslik: veri.baslik,
    ozet: veri.ozet || ozetUret(veri.icerik),
    icerik: veri.icerik,
    kategori: veri.kategori,
    etiketler: etiketleriBirlestir(veri.etiketler),
    seoAciklama: veri.seoAciklama || veri.ozet || ozetUret(veri.icerik, 155),
    yazarAd: veri.yazarAd,
    durum: veri.durum,
    okuma: okumaSuresi(veri.icerik),
  };
}

export async function blogYaziEkle(formData: FormData): Promise<BlogSonuc> {
  let kapak: SaklananDosya | null = null;
  let yaziId = "";
  try {
    const kim = await oturumGerekli("admin");
    const veri = BlogYaziSemasi.parse(formVerisi(formData));
    const slug = await benzersizSlug(veri.slug || veri.baslik);

    const yazi = await prisma.blogYazi.create({
      data: {
        ...kayitAlanlari(veri),
        slug,
        yayinTarihi: yayinAni(veri.durum, veri.yayinTarihi),
      },
      select: { id: true, slug: true },
    });
    yaziId = yazi.id;

    // Kapak kayıt oluştuktan sonra saklanır (klasör adı kimliğe bağlı)
    const dosya = formData.get("kapak");
    if (dosya instanceof File && dosya.size > 0) {
      kapak = await dosyaSakla(blogKlasoru(yazi.id), "kapak", dosya, BLOG_KAPAK_GRUPLARI);
      await prisma.blogYazi.update({
        where: { id: yazi.id },
        data: { kapakYol: kapak.yol, kapakTur: kapak.tur, kapakAd: kapak.ad },
      });
    }

    denetim("blog.ekle", kim, { yaziId: yazi.id, slug, durum: veri.durum });
    blogTazele(slug);
    return { tamam: true, id: yazi.id, slug };
  } catch (e) {
    // Kısmi kalıntı bırakma: kayıt oluştuysa ve kapak yazıldıysa temizlenir
    if (kapak) await dosyaSil(kapak.yol);
    if (yaziId) {
      await prisma.blogYazi.delete({ where: { id: yaziId } }).catch(() => {});
      await klasorSil(blogKlasoru(yaziId));
    }
    return { hata: hataMetni(e, "blogYaziEkle") };
  }
}

export async function blogYaziGuncelle(formData: FormData): Promise<BlogSonuc> {
  let yeniKapak: SaklananDosya | null = null;
  try {
    const kim = await oturumGerekli("admin");
    const id = String(formData.get("id") ?? "");
    if (!id) return { hata: "Yazı bulunamadı." };

    const mevcut = await prisma.blogYazi.findUnique({
      where: { id },
      select: { id: true, slug: true, kapakYol: true, yayinTarihi: true },
    });
    if (!mevcut) return { hata: "Yazı bulunamadı." };

    const veri = BlogYaziSemasi.parse(formVerisi(formData));
    const slug = await benzersizSlug(veri.slug || veri.baslik, id);

    const dosya = formData.get("kapak");
    if (dosya instanceof File && dosya.size > 0) {
      yeniKapak = await dosyaSakla(blogKlasoru(id), "kapak", dosya, BLOG_KAPAK_GRUPLARI);
    }

    await prisma.blogYazi.update({
      where: { id },
      data: {
        ...kayitAlanlari(veri),
        slug,
        yayinTarihi: yayinAni(veri.durum, veri.yayinTarihi, mevcut.yayinTarihi),
        ...(yeniKapak
          ? { kapakYol: yeniKapak.yol, kapakTur: yeniKapak.tur, kapakAd: yeniKapak.ad }
          : {}),
      },
    });

    // Yeni kapak yerleştiyse eskisi diskten silinir
    if (yeniKapak && mevcut.kapakYol) await dosyaSil(mevcut.kapakYol);

    denetim("blog.guncelle", kim, { yaziId: id, slug, durum: veri.durum });
    blogTazele(slug, mevcut.slug);
    return { tamam: true, id, slug };
  } catch (e) {
    if (yeniKapak) await dosyaSil(yeniKapak.yol);
    return { hata: hataMetni(e, "blogYaziGuncelle") };
  }
}

/** Hızlı yayınla / yayından kaldır (liste satırından) */
export async function blogYaziDurum(id: string, durum: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("admin");
    const yeni = BlogDurumSemasi.parse(durum);
    const mevcut = await prisma.blogYazi.findUnique({
      where: { id },
      select: { slug: true, yayinTarihi: true },
    });
    if (!mevcut) return { hata: "Yazı bulunamadı." };

    await prisma.blogYazi.update({
      where: { id },
      data: {
        durum: yeni,
        // Mevcut tarih korunur; yeniden yayına alınan yazı ilk tarihiyle döner
        yayinTarihi: yayinAni(yeni, "", mevcut.yayinTarihi),
      },
    });

    denetim("blog.durum", kim, { yaziId: id, durum: yeni });
    blogTazele(mevcut.slug);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "blogYaziDurum") };
  }
}

/** Kapak görselini kaldırır (yazı korunur) */
export async function blogKapakSil(id: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("admin");
    const yazi = await prisma.blogYazi.findUnique({
      where: { id },
      select: { slug: true, kapakYol: true },
    });
    if (!yazi) return { hata: "Yazı bulunamadı." };
    if (!yazi.kapakYol) return { tamam: true };

    await prisma.blogYazi.update({
      where: { id },
      data: { kapakYol: null, kapakTur: "", kapakAd: "" },
    });
    await dosyaSil(yazi.kapakYol);

    denetim("blog.kapakSil", kim, { yaziId: id });
    blogTazele(yazi.slug);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "blogKapakSil") };
  }
}

export async function blogYaziSil(id: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("admin");
    const yazi = await prisma.blogYazi.findUnique({
      where: { id },
      select: { slug: true, baslik: true },
    });
    if (!yazi) return { hata: "Yazı bulunamadı." };

    await prisma.blogYazi.delete({ where: { id } });
    await klasorSil(blogKlasoru(id));

    denetim("blog.sil", kim, { yaziId: id, baslik: yazi.baslik });
    blogTazele(yazi.slug);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "blogYaziSil") };
  }
}
