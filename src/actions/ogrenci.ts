"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { kullaniciAdiNormalize, telefonDuzelt } from "@/lib/hesap";
import { OgrenciEkleSemasi, ProfilSemasi } from "@/lib/dogrulama";
import { hosgeldinMailiKuyrukla } from "@/lib/mail";
import { denetim } from "@/lib/log";
import { oturumGerekli, panelleriTazele, hataMetni, type EylemSonuc } from "./yardimci";

export async function ogrenciEkle(girdi: unknown): Promise<EylemSonuc & { ogrenciId?: string }> {
  try {
    const koc = await oturumGerekli("koc");
    const veri = OgrenciEkleSemasi.parse(girdi);
    const kullanici = kullaniciAdiNormalize(veri.kullanici);

    const mevcut = await prisma.kullanici.findUnique({ where: { kullanici } });
    if (mevcut) return { hata: "Bu kullanıcı adı zaten kayıtlı." };

    const yeni = await prisma.kullanici.create({
      data: {
        rol: "ogrenci",
        ad: veri.ad,
        kullanici,
        sifreHash: bcrypt.hashSync(veri.sifre, 10),
        sinif: veri.sinif,
        hedef: veri.hedef,
        kocId: koc.id,
        telefon: telefonDuzelt(veri.telefon),
        veliTelefon: telefonDuzelt(veri.veliTelefon),
        eposta: veri.eposta,
      },
    });
    await hosgeldinMailiKuyrukla(yeni); // e-posta girildiyse hoş geldin maili kuyruklanır
    denetim("ogrenci.ekle", koc, { ogrenciId: yeni.id, kullanici });
    panelleriTazele();
    return { tamam: true, ogrenciId: yeni.id };
  } catch (e) {
    return { hata: hataMetni(e, "ogrenci.ekle") };
  }
}

/** Atanmamış (koçu olmayan) öğrenciyi kendine atar */
export async function ogrenciAta(ogrenciId: string): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const o = await prisma.kullanici.findUnique({ where: { id: ogrenciId } });
    if (!o || o.rol !== "ogrenci") return { hata: "Öğrenci bulunamadı." };
    if (o.kocId) return { hata: "Bu öğrenci zaten bir koça atanmış." };
    await prisma.kullanici.update({ where: { id: ogrenciId }, data: { kocId: koc.id } });
    denetim("ogrenci.ata", koc, { ogrenciId, kullanici: o.kullanici });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "ogrenci.ata") };
  }
}

export async function telefonGuncelle(
  ogrenciId: string,
  alanlar: { telefon?: string; veliTelefon?: string }
): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const o = await prisma.kullanici.findUnique({ where: { id: ogrenciId } });
    if (!o || o.kocId !== koc.id) return { hata: "Bu öğrenci size atanmış değil." };
    await prisma.kullanici.update({
      where: { id: ogrenciId },
      data: {
        ...(alanlar.telefon !== undefined && { telefon: telefonDuzelt(alanlar.telefon) }),
        ...(alanlar.veliTelefon !== undefined && { veliTelefon: telefonDuzelt(alanlar.veliTelefon) }),
      },
    });
    // Telefon değerleri PII olduğundan loga yazılmaz; hangi alanların değiştiği yeter
    denetim("ogrenci.telefonGuncelle", koc, {
      ogrenciId,
      alanlar: Object.keys(alanlar).filter((a) => alanlar[a as keyof typeof alanlar] !== undefined),
    });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "ogrenci.telefonGuncelle") };
  }
}

/** Başlangıç seviye profili — öğrenci kendisininkini, koç kendi öğrencisininkini kaydedebilir */
export async function profilKaydet(ogrenciId: string, girdi: unknown): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");
    const profil = ProfilSemasi.parse(girdi);
    const o = await prisma.kullanici.findUnique({ where: { id: ogrenciId } });
    if (!o || o.rol !== "ogrenci") return { hata: "Öğrenci bulunamadı." };
    const yetkili = kim.rol === "ogrenci" ? o.id === kim.id : o.kocId === kim.id;
    if (!yetkili) return { hata: "Bu profil üzerinde yetkiniz yok." };
    await prisma.kullanici.update({
      where: { id: ogrenciId },
      data: { profil: JSON.stringify(profil) },
    });
    denetim("ogrenci.profilKaydet", kim, { ogrenciId });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "ogrenci.profilKaydet") };
  }
}
