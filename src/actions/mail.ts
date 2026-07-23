"use server";

/* E-posta yönetimi action'ları — tümü admin gerektirir (/admin/mail sayfası). */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { MailAyarSemasi, MailSablonSemasi } from "@/lib/dogrulama";
import {
  mailAyarGetir,
  testMailGonder,
  dersHatirlatmalariKuyrukla,
  kuyrukIsle,
} from "@/lib/mail";
import { denetim } from "@/lib/log";
import { oturumGerekli, hataMetni, type EylemSonuc } from "./yardimci";

function mailSayfasiniTazele() {
  revalidatePath("/admin/mail");
}

/** SMTP ayarlarını kaydeder; şifre boş bırakılırsa mevcut şifre korunur. */
export async function mailAyarKaydet(girdi: unknown): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const veri = MailAyarSemasi.parse(girdi);
    const mevcut = await mailAyarGetir();
    const sifre = veri.sifre === "" ? mevcut.sifre : veri.sifre;
    await prisma.mailAyar.update({
      where: { id: 1 },
      data: { ...veri, sifre },
    });
    denetim("mail.ayarKaydet", admin, { sunucu: veri.sunucu, aktif: veri.aktif });
    mailSayfasiniTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "mail.ayarKaydet") };
  }
}

/** Kayıtlı ayarlarla verilen adrese test maili gönderir (kuyruğa girmez). */
export async function mailTestGonder(alici: string): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const adres = String(alici || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adres)) return { hata: "Geçersiz e-posta adresi." };
    const sonuc = await testMailGonder(adres);
    if (sonuc.hata) return { hata: sonuc.hata };
    denetim("mail.testGonder", admin, { alici: adres });
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "mail.testGonder") };
  }
}

/** Şablonun konu/gövde/aktiflik bilgisini günceller. */
export async function mailSablonKaydet(girdi: unknown): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const veri = MailSablonSemasi.parse(girdi);
    const sablon = await prisma.mailSablon.findUnique({ where: { anahtar: veri.anahtar } });
    if (!sablon) return { hata: "Şablon bulunamadı." };
    await prisma.mailSablon.update({
      where: { anahtar: veri.anahtar },
      data: { konu: veri.konu, govde: veri.govde, aktif: veri.aktif },
    });
    denetim("mail.sablonKaydet", admin, { anahtar: veri.anahtar, aktif: veri.aktif });
    mailSayfasiniTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "mail.sablonKaydet") };
  }
}

/** Kuyruğu elle tetikler: önce hatırlatmaları kuyruklar, sonra bekleyenleri gönderir. */
export async function mailKuyrukIsle(): Promise<EylemSonuc & { mesaj?: string }> {
  try {
    const admin = await oturumGerekli("admin");
    const hatirlatma = await dersHatirlatmalariKuyrukla();
    const sonuc = await kuyrukIsle();
    denetim("mail.kuyrukIsle", admin, { hatirlatma, ...sonuc });
    mailSayfasiniTazele();
    return {
      tamam: true,
      mesaj: `${hatirlatma} hatırlatma kuyruklandı · ${sonuc.gonderilen} mail gönderildi · ${sonuc.hatali} hata`,
    };
  } catch (e) {
    return { hata: hataMetni(e, "mail.kuyrukIsle") };
  }
}

/** Hatalı/bekleyen kuyruk kaydını sıfırlayıp yeniden gönderime alır. */
export async function mailYenidenDene(id: string): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const kayit = await prisma.mailKuyruk.findUnique({ where: { id } });
    if (!kayit) return { hata: "Kuyruk kaydı bulunamadı." };
    await prisma.mailKuyruk.update({
      where: { id },
      data: { durum: "bekliyor", deneme: 0, sonHata: "", planlanan: new Date() },
    });
    denetim("mail.yenidenDene", admin, { id, alici: kayit.alici });
    mailSayfasiniTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "mail.yenidenDene") };
  }
}

/** Tek kuyruk kaydını siler. */
export async function mailKuyrukSil(id: string): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    await prisma.mailKuyruk.delete({ where: { id } });
    denetim("mail.kuyrukSil", admin, { id });
    mailSayfasiniTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "mail.kuyrukSil") };
  }
}

/** Sonuçlanmış (gönderildi/hata) kayıtları topluca temizler. */
export async function mailKuyrukTemizle(): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const sonuc = await prisma.mailKuyruk.deleteMany({
      where: { durum: { in: ["gonderildi", "hata"] } },
    });
    denetim("mail.kuyrukTemizle", admin, { silinen: sonuc.count });
    mailSayfasiniTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "mail.kuyrukTemizle") };
  }
}
