"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { BILDIRIM_TURLERI } from "@/lib/bildirim-tercih";
import { oturumGerekli, hataMetni, type EylemSonuc } from "./yardimci";

/* Kullanıcının kendi bildirim tercihleri ve kayıtlı cihazları.
   Herkes YALNIZ kendi kaydına dokunabilir: kullaniciId oturumdan alınır,
   istemciden hiç okunmaz. */

const TercihSemasi = z.object({
  tur: z.enum(BILDIRIM_TURLERI),
  push: z.boolean(),
});

/** Tek bir türün cihaz bildirimini açar/kapatır. */
export async function bildirimTercihiKaydet(girdi: unknown): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci", "admin");
    const { tur, push } = TercihSemasi.parse(girdi);
    await prisma.bildirimTercih.upsert({
      where: { kullaniciId_tur: { kullaniciId: kim.id, tur } },
      create: { kullaniciId: kim.id, tur, push },
      update: { push },
    });
    revalidatePath("/bildirimler");
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "bildirimTercih.kaydet") };
  }
}

/** Tüm türleri birlikte açar/kapatır ("tümünü aç/kapat"). */
export async function tumBildirimTercihleriniKaydet(push: unknown): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci", "admin");
    const deger = z.boolean().parse(push);
    await prisma.$transaction(
      BILDIRIM_TURLERI.map((tur) =>
        prisma.bildirimTercih.upsert({
          where: { kullaniciId_tur: { kullaniciId: kim.id, tur } },
          create: { kullaniciId: kim.id, tur, push: deger },
          update: { push: deger },
        })
      )
    );
    revalidatePath("/bildirimler");
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "bildirimTercih.tumunuKaydet") };
  }
}

/** Kullanıcının kayıtlı bir cihazını (push aboneliğini) kaldırır. */
export async function cihazKaldir(abonelikId: unknown): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci", "admin");
    const id = z.string().min(1).parse(abonelikId);
    // kullaniciId koşulu: başkasının cihazı silinemez
    const sonuc = await prisma.pushAbonelik.deleteMany({
      where: { id, kullaniciId: kim.id },
    });
    if (!sonuc.count) return { hata: "Cihaz bulunamadı." };
    revalidatePath("/bildirimler");
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "bildirimTercih.cihazKaldir") };
  }
}
