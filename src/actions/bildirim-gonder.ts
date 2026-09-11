"use server";

import { revalidatePath } from "next/cache";
import { BildirimGonderSemasi, gonderebilirMi } from "@/lib/bildirim-gonder";
import { bildirimGonderimiYap } from "@/lib/bildirim-gonder-sunucu";
import { denetim } from "@/lib/log";
import { oturumGerekli, panelleriTazele, hataMetni, type EylemSonuc } from "./yardimci";

export type GonderSonuc = EylemSonuc & { aliciSayisi?: number };

/** Yönetici / eğitmen panelden veli, öğrenci ve öğretmenlere bildirim gönderir.
    Alıcı kümesi sunucuda yeniden çözülür: istemciden gelen kişi listesi yalnız
    gönderenin ulaşabildiği adaylar arasından kabul edilir. */
export async function bildirimGonder(girdi: unknown): Promise<GonderSonuc> {
  try {
    const kim = await oturumGerekli("admin", "koc");
    if (!gonderebilirMi(kim.rol)) return { hata: "Bu işlem için yetkiniz yok." };

    const ayristirma = BildirimGonderSemasi.safeParse(girdi);
    if (!ayristirma.success) {
      return { hata: ayristirma.error.issues[0]?.message ?? "Geçersiz girdi." };
    }
    const veri = ayristirma.data;

    const sonuc = await bildirimGonderimiYap(kim, veri);

    denetim("bildirim.gonder", kim, {
      gonderimId: sonuc.gonderimId,
      aliciSayisi: sonuc.aliciSayisi,
      hedef: sonuc.hedefOzet,
      gruplar: veri.gruplar,
      kisiSayisi: veri.kisiler.length,
    });

    panelleriTazele(); // zil rozeti + /bildirimler
    revalidatePath("/veli", "layout");
    revalidatePath("/bildirim-gonder");
    return { tamam: true, aliciSayisi: sonuc.aliciSayisi };
  } catch (e) {
    return { hata: hataMetni(e, "bildirim.gonder") };
  }
}
