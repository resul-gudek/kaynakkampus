"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { denetim } from "@/lib/log";
import {
  BasvuruDurumSemasi,
  BasvuruNotSemasi,
  MulakatPlanlaSemasi,
  MulakatSonucSemasi,
} from "@/lib/dogrulama-basvuru";
import { mulakatPlanlandiMailiKuyrukla, basvuruSonucMailiKuyrukla } from "@/lib/basvuru-mail";
import { oturumGerekli, hataMetni, type EylemSonuc } from "./yardimci";

function basvuruSayfalariniYenile(id?: string) {
  revalidatePath("/admin/basvurular");
  if (id) revalidatePath(`/admin/basvurular/${id}`);
}

/** Görüşme tarih+saatini İstanbul yerelinde tek bir DateTime'a çevirir. */
function mulakatZamani(tarih: string, saat: string): Date {
  return new Date(`${tarih}T${saat}:00+03:00`);
}

/** Sonuca göre başvuru durumunu otomatik ilerletir (bazı sonuçlarda). */
const SONUC_DURUM: Record<string, string | undefined> = {
  yapildi: "mulakat_tamamlandi",
  katilmadi: "mulakat_tamamlandi",
  beklemede: "mulakat_tamamlandi",
  olumlu: "olumlu",
  olumsuz: "olumsuz",
  yeniden: "mulakata_uygun",
};

export async function basvuruDurumGuncelle(id: string, durum: string): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const d = BasvuruDurumSemasi.parse(durum);
    const b = await prisma.basvuru.findUnique({
      where: { id },
      select: { id: true, ad: true, eposta: true, takipToken: true, durum: true },
    });
    if (!b) return { hata: "Başvuru bulunamadı." };
    await prisma.basvuru.update({ where: { id }, data: { durum: d } });

    // Durum Olumlu/Olumsuz'a *değiştiğinde* başvurana son durum maili gönder.
    if ((d === "olumlu" || d === "olumsuz") && b.durum !== d) {
      await basvuruSonucMailiKuyrukla(
        { id: b.id, ad: b.ad, eposta: b.eposta, takipToken: b.takipToken },
        d
      ).catch(() => {});
    }

    denetim("basvuru.durumGuncelle", admin, { basvuruId: id, durum: d, oncekiDurum: b.durum });
    basvuruSayfalariniYenile(id);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "basvuru.durumGuncelle") };
  }
}

export async function basvuruNotEkle(girdi: unknown): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const veri = BasvuruNotSemasi.parse(girdi);
    const b = await prisma.basvuru.findUnique({ where: { id: veri.basvuruId }, select: { id: true } });
    if (!b) return { hata: "Başvuru bulunamadı." };
    const yazar = await prisma.kullanici.findUnique({
      where: { id: admin.id },
      select: { ad: true },
    });
    await prisma.basvuruNot.create({
      data: {
        basvuruId: veri.basvuruId,
        yazarId: admin.id,
        yazarAd: yazar?.ad ?? "",
        metin: veri.metin,
      },
    });
    denetim("basvuru.notEkle", admin, { basvuruId: veri.basvuruId });
    basvuruSayfalariniYenile(veri.basvuruId);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "basvuru.notEkle") };
  }
}

export async function basvuruNotSil(notId: string): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const n = await prisma.basvuruNot.findUnique({ where: { id: notId }, select: { basvuruId: true } });
    if (!n) return { hata: "Not bulunamadı." };
    await prisma.basvuruNot.delete({ where: { id: notId } });
    denetim("basvuru.notSil", admin, { notId, basvuruId: n.basvuruId });
    basvuruSayfalariniYenile(n.basvuruId);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "basvuru.notSil") };
  }
}

/**
 * Mülakat planlar / yeniden planlar. Her çağrı YENİ bir aktif mülakat kaydı
 * oluşturur; önceki aktif kayıt geçmiş olarak saklanır (aktif=false). Yeni
 * kayıt hatırlatma bayrakları false ile başlar (tarih/saat değişince
 * hatırlatmalar yeniden gönderilir). Başvuru durumu "mulakat_planlandi" olur.
 */
export async function mulakatPlanla(girdi: unknown): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const veri = MulakatPlanlaSemasi.parse(girdi);
    const basvuru = await prisma.basvuru.findUnique({
      where: { id: veri.basvuruId },
      select: { id: true, ad: true, eposta: true, takipToken: true },
    });
    if (!basvuru) return { hata: "Başvuru bulunamadı." };

    const zaman = mulakatZamani(veri.tarih, veri.saat);
    if (Number.isNaN(zaman.getTime())) return { hata: "Geçersiz tarih/saat." };

    const mulakat = await prisma.$transaction(async (tx) => {
      // Önceki aktif görüşmeler geçmişe alınır (silinmez).
      await tx.mulakat.updateMany({
        where: { basvuruId: veri.basvuruId, aktif: true },
        data: { aktif: false },
      });
      const yeni = await tx.mulakat.create({
        data: {
          basvuruId: veri.basvuruId,
          aktif: true,
          tarih: zaman,
          sure: veri.sure,
          tur: veri.tur,
          baglanti: veri.baglanti,
          adres: veri.adres,
          gorusmeci: veri.gorusmeci,
          aciklama: veri.aciklama,
          // hatirlatma24SaatGonderildi / hatirlatma1SaatGonderildi → default false
        },
      });
      await tx.basvuru.update({
        where: { id: veri.basvuruId },
        data: { durum: "mulakat_planlandi" },
      });
      return yeni;
    });

    // Başvurana bilgilendirme maili (opsiyonel; ana akışı düşürmez)
    await mulakatPlanlandiMailiKuyrukla(
      { ad: basvuru.ad, eposta: basvuru.eposta, takipToken: basvuru.takipToken },
      mulakat
    ).catch(() => {});

    denetim("basvuru.mulakatPlanla", admin, {
      basvuruId: veri.basvuruId,
      mulakatId: mulakat.id,
      tarih: zaman.toISOString(),
      tur: veri.tur,
    });
    basvuruSayfalariniYenile(veri.basvuruId);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "basvuru.mulakatPlanla") };
  }
}

/** Mülakat sonucunu kaydeder; bazı sonuçlarda başvuru durumunu ilerletir. */
export async function mulakatSonucKaydet(girdi: unknown): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const veri = MulakatSonucSemasi.parse(girdi);
    const m = await prisma.mulakat.findUnique({
      where: { id: veri.mulakatId },
      select: {
        id: true,
        basvuruId: true,
        basvuru: { select: { ad: true, eposta: true, takipToken: true, durum: true } },
      },
    });
    if (!m) return { hata: "Mülakat bulunamadı." };

    const yeniDurum = SONUC_DURUM[veri.sonuc];
    await prisma.$transaction(async (tx) => {
      await tx.mulakat.update({
        where: { id: veri.mulakatId },
        data: { sonuc: veri.sonuc, sonucNotu: veri.sonucNotu },
      });
      if (yeniDurum) {
        await tx.basvuru.update({ where: { id: m.basvuruId }, data: { durum: yeniDurum } });
      }
    });

    // Sonuç başvuru durumunu Olumlu/Olumsuz'a çektiyse başvurana son durum maili.
    if ((yeniDurum === "olumlu" || yeniDurum === "olumsuz") && m.basvuru.durum !== yeniDurum) {
      await basvuruSonucMailiKuyrukla(
        { id: m.basvuruId, ad: m.basvuru.ad, eposta: m.basvuru.eposta, takipToken: m.basvuru.takipToken },
        yeniDurum
      ).catch(() => {});
    }

    denetim("basvuru.mulakatSonuc", admin, {
      basvuruId: m.basvuruId,
      mulakatId: m.id,
      sonuc: veri.sonuc,
    });
    basvuruSayfalariniYenile(m.basvuruId);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "basvuru.mulakatSonuc") };
  }
}
