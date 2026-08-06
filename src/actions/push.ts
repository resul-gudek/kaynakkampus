"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { oturumGerekli, hataMetni, type EylemSonuc } from "./yardimci";

/* Web Push abonelik yönetimi. Her cihaz/tarayıcı bir PushAbonelik kaydıdır;
   aynı endpoint tekrar gelirse (yeniden abonelik) eskisi silinip yenisi yazılır. */

const AbonelikSemasi = z.object({
  endpoint: z.string().url().max(1000),
  p256dh: z.string().min(1).max(400),
  auth: z.string().min(1).max(400),
  tarayici: z.string().max(400).default(""),
});

/** İstemciden gelen push aboneliğini oturum sahibine kaydeder. */
export async function pushAboneOl(girdi: unknown): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci", "admin");
    const veri = AbonelikSemasi.parse(girdi);
    await prisma.$transaction([
      prisma.pushAbonelik.deleteMany({ where: { endpoint: veri.endpoint } }),
      prisma.pushAbonelik.create({
        data: {
          kullaniciId: kim.id,
          endpoint: veri.endpoint,
          p256dh: veri.p256dh,
          auth: veri.auth,
          tarayici: veri.tarayici,
        },
      }),
    ]);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "push.aboneOl") };
  }
}

/** Cihaz aboneliğini kaldırır (kullanıcı bildirimleri kapatınca). */
export async function pushAbonelikSil(endpoint: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci", "admin");
    await prisma.pushAbonelik.deleteMany({ where: { endpoint, kullaniciId: kim.id } });
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "push.abonelikSil") };
  }
}
