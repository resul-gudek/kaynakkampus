"use server";

import { prisma } from "@/lib/prisma";
import { TakipSemasi } from "@/lib/dogrulama";
import { egitmenMi } from "@/lib/sabitler";
import { oturumGerekli, panelleriTazele, hataMetni, type EylemSonuc } from "./yardimci";

export async function takipEkle(girdi: unknown): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const veri = TakipSemasi.parse(girdi);
    const ogrenci = await prisma.kullanici.findUnique({ where: { id: veri.ogrenciId } });
    if (!ogrenci || ogrenci.kocId !== koc.id) return { hata: "Bu öğrenci size atanmış değil." };
    await prisma.takip.create({ data: { ...veri, kocId: koc.id } });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

export async function takipSil(id: string): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const t = await prisma.takip.findUnique({ where: { id } });
    if (!t || t.kocId !== koc.id) return { hata: "Kayıt bulunamadı." };
    await prisma.takip.delete({ where: { id } });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

export async function takipDurum(id: string, tamamlandi: boolean): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");
    const t = await prisma.takip.findUnique({ where: { id } });
    if (!t) return { hata: "Kayıt bulunamadı." };
    const sahibi = egitmenMi(kim.rol) ? t.kocId === kim.id : t.ogrenciId === kim.id;
    if (!sahibi) return { hata: "Bu kayıt üzerinde yetkiniz yok." };
    await prisma.takip.update({ where: { id }, data: { tamamlandi: !!tamamlandi } });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}
