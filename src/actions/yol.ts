"use server";

import { prisma } from "@/lib/prisma";
import { YolAdimiSemasi } from "@/lib/dogrulama";
import { egitmenMi } from "@/lib/sabitler";
import { denetim } from "@/lib/log";
import { oturumGerekli, panelleriTazele, hataMetni, type EylemSonuc } from "./yardimci";

export async function yolEkle(girdi: unknown): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const veri = YolAdimiSemasi.parse(girdi);
    const ogrenci = await prisma.kullanici.findUnique({ where: { id: veri.ogrenciId } });
    if (!ogrenci || ogrenci.kocId !== koc.id) return { hata: "Bu öğrenci size atanmış değil." };

    await prisma.$transaction(async (tx) => {
      const son = await tx.yolAdimi.aggregate({
        where: { ogrenciId: veri.ogrenciId },
        _max: { sira: true },
      });
      await tx.yolAdimi.create({
        data: { ...veri, kocId: koc.id, sira: (son._max.sira ?? 0) + 1 },
      });
    });
    denetim("yol.ekle", koc, { ogrenciId: veri.ogrenciId, ders: veri.ders, konu: veri.konu });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "yol.ekle") };
  }
}

export async function yolSil(id: string): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const a = await prisma.yolAdimi.findUnique({ where: { id } });
    if (!a || a.kocId !== koc.id) return { hata: "Adım bulunamadı." };
    await prisma.yolAdimi.delete({ where: { id } });
    denetim("yol.sil", koc, { adimId: id, ogrenciId: a.ogrenciId, konu: a.konu });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "yol.sil") };
  }
}

/** Sadece sıradaki (aktif) adım tamamlanabilir; geri alma son tamamlanan adımda geçerlidir. */
export async function yolTamamla(id: string, tamamlandi: boolean): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");
    const a = await prisma.yolAdimi.findUnique({ where: { id } });
    if (!a) return { hata: "Adım bulunamadı." };
    const sahibi = egitmenMi(kim.rol) ? a.kocId === kim.id : a.ogrenciId === kim.id;
    if (!sahibi) return { hata: "Bu adım üzerinde yetkiniz yok." };

    const adimlar = await prisma.yolAdimi.findMany({
      where: { ogrenciId: a.ogrenciId },
      orderBy: { sira: "asc" },
    });
    if (tamamlandi) {
      const aktif = adimlar.find((x) => !x.tamamlandi);
      if (!aktif || aktif.id !== id) return { hata: "Sadece sıradaki adım tamamlanabilir." };
    } else {
      const sonTamam = [...adimlar].reverse().find((x) => x.tamamlandi);
      if (!sonTamam || sonTamam.id !== id) return { hata: "Sadece son tamamlanan adım geri alınabilir." };
    }

    await prisma.yolAdimi.update({ where: { id }, data: { tamamlandi } });
    denetim("yol.tamamla", kim, { adimId: id, ogrenciId: a.ogrenciId, tamamlandi });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "yol.tamamla") };
  }
}
