"use server";

import { prisma } from "@/lib/prisma";
import { bildirimEkle } from "@/lib/bildirim";
import { tarihNesnesi, tarihStr } from "@/lib/hesap";
import { OdevSemasi, OdevDurumSemasi } from "@/lib/dogrulama";
import { oturumGerekli, panelleriTazele, hataMetni, type EylemSonuc } from "./yardimci";

export async function odevEkle(girdi: unknown): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const veri = OdevSemasi.parse(girdi);

    const ogrenci = await prisma.kullanici.findUnique({ where: { id: veri.ogrenciId } });
    if (!ogrenci || ogrenci.rol !== "ogrenci" || ogrenci.kocId !== koc.id) {
      return { hata: "Bu öğrenci size atanmış değil." };
    }

    await prisma.$transaction(async (tx) => {
      const kayit = await tx.odev.create({
        data: {
          ogrenciId: veri.ogrenciId,
          kocId: koc.id,
          ders: veri.ders,
          konu: veri.konu,
          aciklama: veri.aciklama,
          kaynak: veri.kaynak,
          soruSayisi: veri.soruSayisi ?? null,
          sonTarih: veri.sonTarih ? tarihNesnesi(veri.sonTarih) : null,
        },
      });
      await bildirimEkle(
        tx,
        kayit.ogrenciId,
        "📘",
        "Yeni ödev: " + kayit.ders + " – " + kayit.konu +
          (kayit.sonTarih ? " · Son tarih: " + tarihStr(kayit.sonTarih) : ""),
        { tur: "odev", ogrenciId: kayit.ogrenciId, kayitId: kayit.id }
      );
    });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

export async function odevSil(id: string): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const o = await prisma.odev.findUnique({ where: { id } });
    if (!o || o.kocId !== koc.id) return { hata: "Ödev bulunamadı." };
    await prisma.odev.delete({ where: { id } });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

export async function odevDurum(id: string, durum: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");
    const yeniDurum = OdevDurumSemasi.parse(durum);
    const o = await prisma.odev.findUnique({ where: { id } });
    if (!o) return { hata: "Ödev bulunamadı." };
    const sahibi = kim.rol === "koc" ? o.kocId === kim.id : o.ogrenciId === kim.id;
    if (!sahibi) return { hata: "Bu ödev üzerinde yetkiniz yok." };

    await prisma.$transaction(async (tx) => {
      await tx.odev.update({ where: { id }, data: { durum: yeniDurum } });
      // Sadece tamamlanmaya geçişte koça bildirim (legacy davranışı)
      if (yeniDurum === "tamamlandi" && o.durum !== "tamamlandi") {
        const ogr = await tx.kullanici.findUnique({ where: { id: o.ogrenciId } });
        await bildirimEkle(
          tx,
          o.kocId,
          "✅",
          (ogr?.ad ?? "Öğrenci") + " bir ödevi tamamladı: " + o.ders + " – " + o.konu,
          { tur: "odev", ogrenciId: o.ogrenciId, kayitId: o.id }
        );
      }
    });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}
