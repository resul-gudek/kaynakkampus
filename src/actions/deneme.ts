"use server";

import { prisma } from "@/lib/prisma";
import { netHesapla, tarihNesnesi } from "@/lib/hesap";
import { DenemeSemasi } from "@/lib/dogrulama";
import { denetim } from "@/lib/log";
import { oturumGerekli, panelleriTazele, hataMetni, type EylemSonuc } from "./yardimci";

export async function denemeEkle(girdi: unknown): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");
    const veri = DenemeSemasi.parse(girdi);

    const ogrenci = await prisma.kullanici.findUnique({ where: { id: veri.ogrenciId } });
    if (!ogrenci || ogrenci.rol !== "ogrenci") return { hata: "Öğrenci bulunamadı." };
    const yetkili = kim.rol === "ogrenci" ? ogrenci.id === kim.id : ogrenci.kocId === kim.id;
    if (!yetkili) return { hata: "Bu öğrenci için deneme giremezsiniz." };

    // Ders netleri ve toplam net sunucuda hesaplanır (tek doğruluk kaynağı)
    const dersler = veri.dersler.map((d) => ({
      ...d,
      net: netHesapla(veri.tur, d.dogru, d.yanlis),
    }));
    const toplamNet = Math.round(dersler.reduce((t, d) => t + d.net, 0) * 100) / 100;

    const yeni = await prisma.deneme.create({
      data: {
        ogrenciId: veri.ogrenciId,
        ad: veri.ad,
        tur: veri.tur,
        tarih: tarihNesnesi(veri.tarih),
        net: toplamNet,
        dersler: {
          create: dersler.map((d) => ({
            ders: d.ders,
            dogru: d.dogru,
            yanlis: d.yanlis,
            bos: d.bos,
            net: d.net,
            yanlisKonular: JSON.stringify(d.yanlisKonular),
          })),
        },
      },
    });
    denetim("deneme.ekle", kim, { denemeId: yeni.id, ogrenciId: veri.ogrenciId, tur: veri.tur, net: toplamNet });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "deneme.ekle") };
  }
}

export async function denemeSil(id: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");
    const dn = await prisma.deneme.findUnique({ where: { id }, include: { ogrenci: true } });
    if (!dn) return { hata: "Deneme bulunamadı." };
    const yetkili = kim.rol === "ogrenci" ? dn.ogrenciId === kim.id : dn.ogrenci.kocId === kim.id;
    if (!yetkili) return { hata: "Bu kayıt üzerinde yetkiniz yok." };
    await prisma.deneme.delete({ where: { id } }); // DenemeDers cascade ile silinir
    denetim("deneme.sil", kim, { denemeId: id, ogrenciId: dn.ogrenciId, ad: dn.ad });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "deneme.sil") };
  }
}
