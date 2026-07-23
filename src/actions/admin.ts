"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { kullaniciAdiNormalize } from "@/lib/hesap";
import { KocEkleSemasi } from "@/lib/dogrulama";
import { oturumGerekli, hataMetni, type EylemSonuc } from "./yardimci";

export async function kocEkle(girdi: unknown): Promise<EylemSonuc> {
  try {
    await oturumGerekli("admin");
    const veri = KocEkleSemasi.parse(girdi);
    const kullanici = kullaniciAdiNormalize(veri.kullanici);
    const mevcut = await prisma.kullanici.findUnique({ where: { kullanici } });
    if (mevcut) return { hata: "Bu kullanıcı adı zaten kayıtlı." };
    await prisma.kullanici.create({
      data: {
        rol: "koc",
        ad: veri.ad,
        kullanici,
        sifreHash: bcrypt.hashSync(veri.sifre, 10),
        brans: veri.brans,
      },
    });
    revalidatePath("/admin");
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

/** Koçu pasifleştir/aktifleştir — pasif koç giriş yapamaz */
export async function kocAktifDegistir(kocId: string, aktif: boolean): Promise<EylemSonuc> {
  try {
    await oturumGerekli("admin");
    const k = await prisma.kullanici.findUnique({ where: { id: kocId } });
    if (!k || k.rol !== "koc") return { hata: "Koç bulunamadı." };
    await prisma.kullanici.update({ where: { id: kocId }, data: { aktif } });
    revalidatePath("/admin");
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

export async function kocSifreSifirla(kocId: string, yeniSifre: string): Promise<EylemSonuc> {
  try {
    await oturumGerekli("admin");
    if (!yeniSifre || yeniSifre.length < 4) return { hata: "Şifre en az 4 karakter olmalı." };
    const k = await prisma.kullanici.findUnique({ where: { id: kocId } });
    if (!k || k.rol !== "koc") return { hata: "Koç bulunamadı." };
    await prisma.kullanici.update({
      where: { id: kocId },
      data: { sifreHash: bcrypt.hashSync(yeniSifre, 10) },
    });
    revalidatePath("/admin");
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

/** Koçu ve ona ait kayıtları siler; öğrencileri atanmamış duruma çevirir.
    (MSSQL çoklu cascade yolu kabul etmediği için bağımlılar açıkça silinir.) */
export async function kocSil(kocId: string): Promise<EylemSonuc> {
  try {
    await oturumGerekli("admin");
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
    revalidatePath("/admin");
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}
