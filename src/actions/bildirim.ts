"use server";

import { prisma } from "@/lib/prisma";
import { oturumGerekli, panelleriTazele, hataMetni, type EylemSonuc } from "./yardimci";

export async function bildirimOkundu(id: string, okundu = true): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");
    const b = await prisma.bildirim.findUnique({ where: { id } });
    if (!b || b.aliciId !== kim.id) return { hata: "Bildirim bulunamadı." };
    await prisma.bildirim.update({ where: { id }, data: { okundu } });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

export async function bildirimTumunuOkundu(): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");
    await prisma.bildirim.updateMany({ where: { aliciId: kim.id }, data: { okundu: true } });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

export async function bildirimSil(id: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");
    const b = await prisma.bildirim.findUnique({ where: { id } });
    if (!b || b.aliciId !== kim.id) return { hata: "Bildirim bulunamadı." };
    await prisma.bildirim.delete({ where: { id } });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

export async function bildirimTemizle(): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");
    await prisma.bildirim.deleteMany({ where: { aliciId: kim.id } });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}
