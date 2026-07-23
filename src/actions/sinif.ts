"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { bildirimEkle } from "@/lib/bildirim";
import { denetim } from "@/lib/log";
import { oturumGerekli, hataMetni, type EylemSonuc } from "./yardimci";

const SinifSemasi = z.object({
  ad: z.string().trim().min(2, "Sınıf adı en az 2 karakter olmalı.").max(100),
  ders: z.string().trim().min(2, "Ders alanı zorunlu.").max(80),
  seviye: z.string().trim().max(50).default(""),
  aciklama: z.string().trim().max(1000).default(""),
  kapasite: z.coerce.number().int().min(1).max(100).default(20),
});

const OturumSemasi = z.object({
  sinifId: z.string().min(1),
  baslik: z.string().trim().min(2, "Ders başlığı zorunlu.").max(120),
  konu: z.string().trim().max(160).default(""),
  baslangic: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Tarih ve saat geçersiz."),
  sure: z.coerce.number().int().min(15).max(480),
});

function siniflariTazele(oturumId?: string) {
  revalidatePath("/siniflar");
  if (oturumId) revalidatePath(`/canli-ders/${oturumId}`);
  revalidatePath("/bildirimler");
  revalidatePath("/", "layout");
}

function istanbulTarihi(deger: string) {
  const tarih = new Date(`${deger}:00+03:00`);
  if (Number.isNaN(tarih.getTime())) throw new Error("Ders tarihi geçersiz.");
  return tarih;
}

export async function sinifOlustur(girdi: unknown): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc");
    const veri = SinifSemasi.parse(girdi);
    const sinif = await prisma.onlineSinif.create({ data: { ...veri, ogretmenId: kim.id } });
    denetim("sinif.olustur", kim, { sinifId: sinif.id, ders: sinif.ders });
    siniflariTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "sinif.olustur") };
  }
}

export async function sinifaOgrenciEkle(sinifId: string, ogrenciId: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc");
    const [sinif, ogrenci] = await Promise.all([
      prisma.onlineSinif.findFirst({
        where: { id: sinifId, ogretmenId: kim.id, aktif: true },
        include: { _count: { select: { uyeler: true } } },
      }),
      prisma.kullanici.findFirst({
        where: { id: ogrenciId, rol: "ogrenci", aktif: true, kocId: kim.id },
      }),
    ]);
    if (!sinif) return { hata: "Sınıf bulunamadı." };
    if (!ogrenci) return { hata: "Yalnızca size atanmış aktif öğrencileri ekleyebilirsiniz." };
    if (sinif._count.uyeler >= sinif.kapasite) return { hata: "Sınıf kapasitesi dolu." };

    await prisma.$transaction(async (tx) => {
      await tx.onlineSinifUye.upsert({
        where: { sinifId_kullaniciId: { sinifId, kullaniciId: ogrenciId } },
        create: { sinifId, kullaniciId: ogrenciId },
        update: {},
      });
      const gelecekOturumlar = await tx.dersOturumu.findMany({
        where: { sinifId, durum: "planlandi", baslangic: { gte: new Date() } },
        select: { id: true },
      });
      for (const oturum of gelecekOturumlar) {
        await tx.dersKatilim.upsert({
          where: {
            oturumId_kullaniciId: { oturumId: oturum.id, kullaniciId: ogrenciId },
          },
          create: { oturumId: oturum.id, kullaniciId: ogrenciId },
          update: {},
        });
      }
      await bildirimEkle(
        tx,
        ogrenciId,
        "🏫",
        `${sinif.ad} online sınıfına eklendin.`,
        { tur: "sinif", ogrenciId, kayitId: sinifId }
      );
    });
    denetim("sinif.ogrenci_ekle", kim, { sinifId, ogrenciId });
    siniflariTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "sinif.ogrenci_ekle") };
  }
}

export async function siniftanOgrenciCikar(sinifId: string, ogrenciId: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc");
    const sinif = await prisma.onlineSinif.findFirst({ where: { id: sinifId, ogretmenId: kim.id } });
    if (!sinif) return { hata: "Sınıf bulunamadı." };
    await prisma.$transaction([
      prisma.onlineSinifUye.deleteMany({ where: { sinifId, kullaniciId: ogrenciId } }),
      prisma.dersKatilim.deleteMany({
        where: {
          kullaniciId: ogrenciId,
          durum: "bekleniyor",
          oturum: { sinifId, durum: "planlandi", baslangic: { gte: new Date() } },
        },
      }),
    ]);
    denetim("sinif.ogrenci_cikar", kim, { sinifId, ogrenciId });
    siniflariTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "sinif.ogrenci_cikar") };
  }
}

export async function dersOturumuOlustur(girdi: unknown): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc");
    const veri = OturumSemasi.parse(girdi);
    const baslangic = istanbulTarihi(veri.baslangic);
    if (baslangic.getTime() < Date.now() - 5 * 60_000) {
      return { hata: "Geçmiş bir saate ders planlayamazsınız." };
    }

    const sinif = await prisma.onlineSinif.findFirst({
      where: { id: veri.sinifId, ogretmenId: kim.id, aktif: true },
      include: { uyeler: { select: { kullaniciId: true } } },
    });
    if (!sinif) return { hata: "Sınıf bulunamadı." };
    if (!sinif.uyeler.length) return { hata: "Ders planlamadan önce sınıfa en az bir öğrenci ekleyin." };

    const bitis = new Date(baslangic.getTime() + veri.sure * 60_000);
    const cakisan = await prisma.dersOturumu.findFirst({
      where: {
        sinif: { ogretmenId: kim.id },
        durum: { in: ["planlandi", "canli"] },
        baslangic: { lt: bitis },
        AND: [{ baslangic: { gt: new Date(baslangic.getTime() - 8 * 60 * 60_000) } }],
      },
      select: { baslangic: true, sure: true },
    });
    if (
      cakisan &&
      cakisan.baslangic.getTime() + cakisan.sure * 60_000 > baslangic.getTime()
    ) {
      return { hata: "Bu saat aralığında başka bir online dersiniz var." };
    }

    const oturum = await prisma.$transaction(async (tx) => {
      const yeni = await tx.dersOturumu.create({
        data: {
          sinifId: sinif.id,
          baslik: veri.baslik,
          konu: veri.konu,
          baslangic,
          sure: veri.sure,
          saglayiciOdaId: `ka-${randomUUID()}`,
          kayitEtkin: false,
        },
      });
      await tx.dersKatilim.createMany({
        data: sinif.uyeler.map((uye) => ({
          oturumId: yeni.id,
          kullaniciId: uye.kullaniciId,
        })),
      });
      for (const uye of sinif.uyeler) {
        await bildirimEkle(
          tx,
          uye.kullaniciId,
          "💻",
          `${sinif.ad}: ${veri.baslik} canlı dersi planlandı.`,
          { tur: "oturum", ogrenciId: uye.kullaniciId, kayitId: yeni.id }
        );
      }
      return yeni;
    });
    denetim("sinif.oturum_olustur", kim, {
      sinifId: sinif.id,
      oturumId: oturum.id,
      baslangic: baslangic.toISOString(),
    });
    siniflariTazele(oturum.id);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "sinif.oturum_olustur") };
  }
}

export async function dersOturumuIptal(oturumId: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc");
    const oturum = await prisma.dersOturumu.findFirst({
      where: { id: oturumId, sinif: { ogretmenId: kim.id } },
      include: { sinif: { include: { uyeler: { select: { kullaniciId: true } } } } },
    });
    if (!oturum || !oturum.sinif) return { hata: "Ders oturumu bulunamadı." };
    if (oturum.durum !== "planlandi") return { hata: "Yalnız planlanmış dersler iptal edilebilir." };

    await prisma.$transaction(async (tx) => {
      await tx.dersOturumu.update({ where: { id: oturumId }, data: { durum: "iptal" } });
      for (const uye of oturum.sinif!.uyeler) {
        await bildirimEkle(
          tx,
          uye.kullaniciId,
          "🚫",
          `${oturum.sinif!.ad}: ${oturum.baslik} canlı dersi iptal edildi.`,
          { tur: "oturum", ogrenciId: uye.kullaniciId, kayitId: oturumId }
        );
      }
    });
    denetim("sinif.oturum_iptal", kim, { sinifId: oturum.sinifId, oturumId });
    siniflariTazele(oturumId);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "sinif.oturum_iptal") };
  }
}

export async function dersOturumuTamamla(oturumId: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc");
    const oturum = await prisma.dersOturumu.findFirst({
      where: { id: oturumId, sinif: { ogretmenId: kim.id } },
      select: { id: true, sinifId: true, baslangic: true, durum: true },
    });
    if (!oturum) return { hata: "Ders oturumu bulunamadı." };
    if (!["planlandi", "canli"].includes(oturum.durum)) {
      return { hata: "Bu ders zaten kapatılmış." };
    }
    if (oturum.baslangic.getTime() > Date.now()) {
      return { hata: "Başlamamış bir ders tamamlandı olarak işaretlenemez." };
    }

    await prisma.$transaction([
      prisma.dersOturumu.update({ where: { id: oturumId }, data: { durum: "tamamlandi" } }),
      prisma.dersKatilim.updateMany({
        where: { oturumId, durum: "bekleniyor" },
        data: { durum: "katilmadi" },
      }),
    ]);
    denetim("sinif.oturum_tamamla", kim, { sinifId: oturum.sinifId, oturumId });
    siniflariTazele(oturumId);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "sinif.oturum_tamamla") };
  }
}
