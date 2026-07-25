"use server";

import { prisma } from "@/lib/prisma";
import { mailAyarGetir, mailGonderilebilir } from "@/lib/mail";
import { veliRaporuKuyrukla } from "@/lib/veli-rapor";
import { denetim } from "@/lib/log";
import { oturumGerekli, hataMetni, type EylemSonuc } from "./yardimci";

/** Koç, öğrencisinin velisine anlık ilerleme raporu gönderir (kuyruğa ekler). */
export async function veliRaporGonder(ogrenciId: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc");
    const ogrenci = await prisma.kullanici.findUnique({
      where: { id: ogrenciId },
      select: { rol: true, kocId: true, veliId: true, veli: { select: { eposta: true } } },
    });
    if (!ogrenci || ogrenci.rol !== "ogrenci") return { hata: "Öğrenci bulunamadı." };
    if (ogrenci.kocId !== kim.id) return { hata: "Bu öğrenci size atanmış değil." };
    if (!ogrenci.veliId) return { hata: "Bu öğrenciye bağlı bir veli yok." };
    if (!ogrenci.veli?.eposta) return { hata: "Velinin kayıtlı bir e-posta adresi yok." };

    const ayar = await mailAyarGetir();
    if (!mailGonderilebilir(ayar)) {
      return { hata: "E-posta gönderimi kapalı. Yönetici Mail Ayarları'ndan açmalı." };
    }

    const eklendi = await veliRaporuKuyrukla(ogrenciId, { donem: "bu hafta" });
    if (!eklendi) return { hata: "Rapor kuyruklanamadı. Şablon pasif olabilir." };

    denetim("veli.raporGonder", kim, { ogrenciId, veliId: ogrenci.veliId });
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "veli.raporGonder") };
  }
}
