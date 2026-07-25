"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { kullaniciAdiNormalize, telefonDuzelt } from "@/lib/hesap";
import { KocEkleSemasi, KullaniciEkleSemasi } from "@/lib/dogrulama";
import { hosgeldinMailiKuyrukla } from "@/lib/mail";
import { denetim } from "@/lib/log";
import { oturumGerekli, hataMetni, type EylemSonuc } from "./yardimci";

function adminSayfalariniYenile() {
  revalidatePath("/admin");
  revalidatePath("/admin/koclar");
  revalidatePath("/admin/kullanicilar");
}

/** Admin kullanıcı listesinden yönetici, koç veya öğrenci hesabı oluşturur. */
export async function kullaniciEkle(girdi: unknown): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const veri = KullaniciEkleSemasi.parse(girdi);
    const kullanici = kullaniciAdiNormalize(veri.kullanici);

    const mevcut = await prisma.kullanici.findUnique({ where: { kullanici } });
    if (mevcut) return { hata: "Bu kullanıcı adı zaten kayıtlı." };

    if (veri.rol === "ogrenci" && veri.kocId) {
      const koc = await prisma.kullanici.findUnique({
        where: { id: veri.kocId },
        select: { rol: true, aktif: true },
      });
      if (!koc || koc.rol !== "koc") return { hata: "Seçilen koç bulunamadı." };
      if (!koc.aktif) return { hata: "Pasif bir koça öğrenci atanamaz." };
    }

    if (veri.rol === "ogrenci" && veri.veliId) {
      const veli = await prisma.kullanici.findUnique({
        where: { id: veri.veliId },
        select: { rol: true, aktif: true },
      });
      if (!veli || veli.rol !== "veli") return { hata: "Seçilen veli bulunamadı." };
      if (!veli.aktif) return { hata: "Pasif bir veliye öğrenci bağlanamaz." };
    }

    const yeni = await prisma.kullanici.create({
      data: {
        rol: veri.rol,
        ad: veri.ad,
        kullanici,
        sifreHash: bcrypt.hashSync(veri.sifre, 10),
        eposta: veri.eposta,
        ...(veri.rol === "koc" && { brans: veri.brans }),
        ...(veri.rol === "ogrenci" && {
          sinif: veri.sinif,
          hedef: veri.hedef,
          kocId: veri.kocId || null,
          veliId: veri.veliId || null,
          telefon: telefonDuzelt(veri.telefon),
          veliTelefon: telefonDuzelt(veri.veliTelefon),
        }),
      },
    });

    await hosgeldinMailiKuyrukla(yeni);
    denetim("admin.kullaniciEkle", admin, {
      kullaniciId: yeni.id,
      kullanici,
      rol: veri.rol,
      kocId: veri.rol === "ogrenci" ? veri.kocId || null : undefined,
      veliId: veri.rol === "ogrenci" ? veri.veliId || null : undefined,
    });
    adminSayfalariniYenile();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "admin.kullaniciEkle") };
  }
}

export async function kocEkle(girdi: unknown): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const veri = KocEkleSemasi.parse(girdi);
    const kullanici = kullaniciAdiNormalize(veri.kullanici);
    const mevcut = await prisma.kullanici.findUnique({ where: { kullanici } });
    if (mevcut) return { hata: "Bu kullanıcı adı zaten kayıtlı." };
    const yeni = await prisma.kullanici.create({
      data: {
        rol: "koc",
        ad: veri.ad,
        kullanici,
        sifreHash: bcrypt.hashSync(veri.sifre, 10),
        brans: veri.brans,
        eposta: veri.eposta,
      },
    });
    await hosgeldinMailiKuyrukla(yeni); // e-posta girildiyse hoş geldin maili kuyruklanır
    denetim("admin.kocEkle", admin, { kocId: yeni.id, kullanici });
    adminSayfalariniYenile();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "admin.kocEkle") };
  }
}

/** Koçu pasifleştir/aktifleştir — pasif koç giriş yapamaz */
export async function kocAktifDegistir(kocId: string, aktif: boolean): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const k = await prisma.kullanici.findUnique({ where: { id: kocId } });
    if (!k || k.rol !== "koc") return { hata: "Koç bulunamadı." };
    await prisma.kullanici.update({ where: { id: kocId }, data: { aktif } });
    denetim("admin.kocAktif", admin, { kocId, kullanici: k.kullanici, aktif });
    adminSayfalariniYenile();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "admin.kocAktif") };
  }
}

export async function kocSifreSifirla(kocId: string, yeniSifre: string): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    if (!yeniSifre || yeniSifre.length < 4) return { hata: "Şifre en az 4 karakter olmalı." };
    const k = await prisma.kullanici.findUnique({ where: { id: kocId } });
    if (!k || k.rol !== "koc") return { hata: "Koç bulunamadı." };
    await prisma.kullanici.update({
      where: { id: kocId },
      data: { sifreHash: bcrypt.hashSync(yeniSifre, 10) },
    });
    denetim("admin.kocSifreSifirla", admin, { kocId, kullanici: k.kullanici });
    adminSayfalariniYenile();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "admin.kocSifreSifirla") };
  }
}

/** Koçu ve ona ait kayıtları siler; öğrencileri atanmamış duruma çevirir.
    (MSSQL çoklu cascade yolu kabul etmediği için bağımlılar açıkça silinir.) */
export async function kocSil(kocId: string): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const k = await prisma.kullanici.findUnique({ where: { id: kocId } });
    if (!k || k.rol !== "koc") return { hata: "Koç bulunamadı." };

    await prisma.$transaction(async (tx) => {
      await tx.odev.deleteMany({ where: { kocId } });
      await tx.takip.deleteMany({ where: { kocId } });
      await tx.yolAdimi.deleteMany({ where: { kocId } });
      await tx.ozelDers.deleteMany({ where: { kocId } });
      await tx.bildirim.deleteMany({ where: { aliciId: kocId } });
      await tx.kullanici.updateMany({ where: { kocId }, data: { kocId: null } });
      await tx.kullanici.delete({ where: { id: kocId } });
    });
    denetim("admin.kocSil", admin, { kocId, kullanici: k.kullanici, ad: k.ad });
    adminSayfalariniYenile();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "admin.kocSil") };
  }
}
