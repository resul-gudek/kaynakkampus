"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { denetim } from "@/lib/log";
import { EgitimBasvuruDurumSemasi } from "@/lib/egitim-basvurusu";
import { oturumGerekli, hataMetni, type EylemSonuc } from "./yardimci";

/** Eğitim başvurusunun (özel ders / koçluk) takip durumunu değiştirir — yalnız yönetici. */
export async function egitimBasvuruDurumGuncelle(id: string, durum: string): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const d = EgitimBasvuruDurumSemasi.parse(durum);
    const b = await prisma.egitimBasvurusu.findUnique({ where: { id }, select: { id: true, durum: true } });
    if (!b) return { hata: "Başvuru bulunamadı." };
    if (b.durum !== d) {
      await prisma.egitimBasvurusu.update({ where: { id }, data: { durum: d } });
      denetim("egitimBasvurusu.durumGuncelle", admin, { basvuruId: id, durum: d, oncekiDurum: b.durum });
    }
    revalidatePath("/admin/egitim-basvurulari");
    revalidatePath(`/admin/egitim-basvurulari/${id}`);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "egitimBasvurusu.durumGuncelle") };
  }
}
