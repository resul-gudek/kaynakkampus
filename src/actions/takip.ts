"use server";

import { prisma } from "@/lib/prisma";
import { TakipSemasi } from "@/lib/dogrulama";
import { egitmenMi } from "@/lib/sabitler";
import { denetim } from "@/lib/log";
import { oturumGerekli, panelleriTazele, hataMetni, type EylemSonuc } from "./yardimci";

export async function takipEkle(girdi: unknown): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const veri = TakipSemasi.parse(girdi);
    const ogrenci = await prisma.kullanici.findUnique({ where: { id: veri.ogrenciId } });
    if (!ogrenci || ogrenci.kocId !== koc.id) return { hata: "Bu öğrenci size atanmış değil." };
    await prisma.takip.create({ data: { ...veri, kocId: koc.id } });
    denetim("takip.ekle", koc, { ogrenciId: veri.ogrenciId });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "takip.ekle") };
  }
}

export async function takipSil(id: string): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const t = await prisma.takip.findUnique({ where: { id } });
    if (!t || t.kocId !== koc.id) return { hata: "Kayıt bulunamadı." };
    await prisma.takip.delete({ where: { id } });
    denetim("takip.sil", koc, { takipId: id, ogrenciId: t.ogrenciId });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "takip.sil") };
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
    denetim("takip.durum", kim, { takipId: id, ogrenciId: t.ogrenciId, tamamlandi: !!tamamlandi });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "takip.durum") };
  }
}
