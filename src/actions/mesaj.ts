"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { MesajSemasi } from "@/lib/dogrulama";
import { denetim } from "@/lib/log";
import { oturumGerekli, hataMetni, type EylemSonuc } from "./yardimci";

/* Mesajlaşma yalnız koç ↔ (kendi) öğrencisi arasındadır.
   Gönderen koç ise alıcı kendi öğrencisi, öğrenci ise alıcı kendi koçu olmalı. */
async function karsiTarafGecerli(
  gonderen: { id: string; rol: string },
  aliciId: string
): Promise<boolean> {
  if (gonderen.id === aliciId) return false;
  const alici = await prisma.kullanici.findUnique({
    where: { id: aliciId },
    select: { rol: true, kocId: true, aktif: true },
  });
  if (!alici || !alici.aktif) return false;
  if (gonderen.rol === "koc") return alici.rol === "ogrenci" && alici.kocId === gonderen.id;
  if (gonderen.rol === "ogrenci") {
    const ben = await prisma.kullanici.findUnique({
      where: { id: gonderen.id },
      select: { kocId: true },
    });
    return alici.rol === "koc" && ben?.kocId === aliciId;
  }
  return false;
}

/** Koç ↔ öğrenci mesajı gönderir; alıcıya okunmamış rozeti için kayıt bırakır. */
export async function mesajGonder(girdi: unknown): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");
    const veri = MesajSemasi.parse(girdi);

    if (!(await karsiTarafGecerli(kim, veri.aliciId))) {
      return { hata: "Bu kişiyle mesajlaşamazsınız." };
    }

    const kayit = await prisma.mesaj.create({
      data: { gonderenId: kim.id, aliciId: veri.aliciId, govde: veri.govde },
    });
    denetim("mesaj.gonder", kim, { mesajId: kayit.id, aliciId: veri.aliciId });
    revalidatePath("/mesajlar");
    revalidatePath("/", "layout"); // sidebar okunmamış mesaj rozeti
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "mesaj.gonder") };
  }
}

/** Karşı taraftan gelen okunmamış mesajları okundu işaretler. */
export async function mesajlariOku(digerId: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");
    await prisma.mesaj.updateMany({
      where: { gonderenId: digerId, aliciId: kim.id, okundu: false },
      data: { okundu: true },
    });
    revalidatePath("/mesajlar");
    revalidatePath("/", "layout");
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "mesaj.oku") };
  }
}
