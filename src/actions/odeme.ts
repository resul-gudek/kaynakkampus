"use server";

/* ═══════════════════════════════════════════════════════════════
   Ödemeler — yazma eylemleri. TAMAMI YALNIZ YÖNETİCİYE AÇIKTIR:
   her eylem oturumGerekli("admin") ile başlar. Öğrenci ve öğretmen
   ödeme kaydı oluşturamaz, güncelleyemez, durum değiştiremez;
   kendi bacaklarını yalnız okurlar (bkz. lib/odeme-sunucu.ts).

   Ödeme tarihleri (ogrenciOdemeTarihi / kocOdemeTarihi) elle girilmez:
   durum "odendi"ye geçtiği gün damgalanır, geri alınırsa temizlenir —
   böylece "ödendi ama tarihi yok" ya da tersi tutarsızlık oluşmaz.
   ═══════════════════════════════════════════════════════════════ */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { denetim } from "@/lib/log";
import { bugun, tarihNesnesi } from "@/lib/hesap";
import {
  KocOdemeDurumSemasi,
  OdemeSemasi,
  OgrenciOdemeDurumSemasi,
} from "@/lib/dogrulama";
import { egitmenMi, type KocOdemeDurum, type OgrenciOdemeDurum } from "@/lib/sabitler";
import { oturumGerekli, hataMetni, type EylemSonuc } from "./yardimci";

function odemeleriTazele() {
  revalidatePath("/admin/odemeler");
  revalidatePath("/ogrenci/odemeler");
  revalidatePath("/koc/odemeler");
}

/** Öğrenci bacağının durum → tarih eşlemesi (yalnız "odendi" tarih taşır) */
function ogrenciTarihi(durum: OgrenciOdemeDurum, mevcut: Date | null): Date | null {
  if (durum !== "odendi") return null;
  return mevcut ?? tarihNesnesi(bugun());
}

/** Öğretmen bacağının durum → tarih eşlemesi */
function kocTarihi(durum: KocOdemeDurum, mevcut: Date | null): Date | null {
  if (durum !== "odendi") return null;
  return mevcut ?? tarihNesnesi(bugun());
}

/** Seçilen tarafların gerçekten öğrenci/öğretmen olduğunu doğrular */
async function taraflariDogrula(ogrenciId: string, kocId: string): Promise<string | null> {
  const ogrenci = await prisma.kullanici.findUnique({
    where: { id: ogrenciId },
    select: { rol: true },
  });
  if (!ogrenci || ogrenci.rol !== "ogrenci") return "Geçerli bir öğrenci seçin.";
  if (kocId) {
    const koc = await prisma.kullanici.findUnique({
      where: { id: kocId },
      select: { rol: true },
    });
    // Ödemenin öğretmen bacağı hem koça hem öğretmene bağlanabilir (iki ayrı rol)
    if (!koc || !egitmenMi(koc.rol)) return "Geçerli bir koç/öğretmen seçin.";
  }
  return null;
}

export async function odemeEkle(girdi: unknown): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const veri = OdemeSemasi.parse(girdi);
    const hata = await taraflariDogrula(veri.ogrenciId, veri.kocId);
    if (hata) return { hata };

    const kayit = await prisma.odeme.create({
      data: {
        ogrenciId: veri.ogrenciId,
        kocId: veri.kocId || null,
        aciklama: veri.aciklama,
        tarih: tarihNesnesi(veri.tarih),
        ogrenciTutar: veri.ogrenciTutar,
        ogrenciDurum: veri.ogrenciDurum,
        ogrenciOdemeTarihi: ogrenciTarihi(veri.ogrenciDurum, null),
        yontem: veri.yontem,
        kocTutar: veri.kocTutar,
        kocDurum: veri.kocDurum,
        kocOdemeTarihi: kocTarihi(veri.kocDurum, null),
        yoneticiNotu: veri.yoneticiNotu,
      },
      select: { id: true },
    });

    denetim("odeme.ekle", admin, {
      odemeId: kayit.id,
      ogrenciId: veri.ogrenciId,
      kocId: veri.kocId || null,
      ogrenciTutar: veri.ogrenciTutar,
      kocTutar: veri.kocTutar,
    });
    odemeleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "odeme.ekle") };
  }
}

export async function odemeGuncelle(id: string, girdi: unknown): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const veri = OdemeSemasi.parse(girdi);
    const mevcut = await prisma.odeme.findUnique({
      where: { id },
      select: { id: true, ogrenciOdemeTarihi: true, kocOdemeTarihi: true },
    });
    if (!mevcut) return { hata: "Ödeme kaydı bulunamadı." };
    const hata = await taraflariDogrula(veri.ogrenciId, veri.kocId);
    if (hata) return { hata };

    await prisma.odeme.update({
      where: { id },
      data: {
        ogrenciId: veri.ogrenciId,
        kocId: veri.kocId || null,
        aciklama: veri.aciklama,
        tarih: tarihNesnesi(veri.tarih),
        ogrenciTutar: veri.ogrenciTutar,
        ogrenciDurum: veri.ogrenciDurum,
        ogrenciOdemeTarihi: ogrenciTarihi(veri.ogrenciDurum, mevcut.ogrenciOdemeTarihi),
        yontem: veri.yontem,
        kocTutar: veri.kocTutar,
        kocDurum: veri.kocDurum,
        kocOdemeTarihi: kocTarihi(veri.kocDurum, mevcut.kocOdemeTarihi),
        yoneticiNotu: veri.yoneticiNotu,
      },
    });

    denetim("odeme.guncelle", admin, { odemeId: id, ogrenciId: veri.ogrenciId });
    odemeleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "odeme.guncelle") };
  }
}

/** Öğrenci bacağı durumu — tahsilat (Bekliyor / Ödendi / İptal) */
export async function odemeOgrenciDurum(id: string, durum: string): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const yeni = OgrenciOdemeDurumSemasi.parse(durum);
    const mevcut = await prisma.odeme.findUnique({
      where: { id },
      select: { ogrenciDurum: true, ogrenciOdemeTarihi: true },
    });
    if (!mevcut) return { hata: "Ödeme kaydı bulunamadı." };

    await prisma.odeme.update({
      where: { id },
      data: {
        ogrenciDurum: yeni,
        ogrenciOdemeTarihi: ogrenciTarihi(yeni, mevcut.ogrenciOdemeTarihi),
      },
    });
    denetim("odeme.ogrenciDurum", admin, { odemeId: id, eski: mevcut.ogrenciDurum, yeni });
    odemeleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "odeme.ogrenciDurum") };
  }
}

/** Öğretmen bacağı durumu — ödeme (Bekliyor / Hazırlanıyor / Ödendi) */
export async function odemeKocDurum(id: string, durum: string): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const yeni = KocOdemeDurumSemasi.parse(durum);
    const mevcut = await prisma.odeme.findUnique({
      where: { id },
      select: { kocDurum: true, kocOdemeTarihi: true, kocId: true, kocTutar: true },
    });
    if (!mevcut) return { hata: "Ödeme kaydı bulunamadı." };
    if (!mevcut.kocId || mevcut.kocTutar <= 0) {
      return { hata: "Bu kalemde öğretmen payı yok." };
    }

    await prisma.odeme.update({
      where: { id },
      data: { kocDurum: yeni, kocOdemeTarihi: kocTarihi(yeni, mevcut.kocOdemeTarihi) },
    });
    denetim("odeme.kocDurum", admin, { odemeId: id, eski: mevcut.kocDurum, yeni });
    odemeleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "odeme.kocDurum") };
  }
}

export async function odemeSil(id: string): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const mevcut = await prisma.odeme.findUnique({
      where: { id },
      select: { id: true, ogrenciId: true, ogrenciTutar: true },
    });
    if (!mevcut) return { hata: "Ödeme kaydı bulunamadı." };

    await prisma.odeme.delete({ where: { id } });
    denetim("odeme.sil", admin, {
      odemeId: id,
      ogrenciId: mevcut.ogrenciId,
      ogrenciTutar: mevcut.ogrenciTutar,
    });
    odemeleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "odeme.sil") };
  }
}
