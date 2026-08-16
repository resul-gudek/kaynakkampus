"use server";

import { prisma } from "@/lib/prisma";
import { bildirimEkle } from "@/lib/bildirim";
import { tarihNesnesi, tarihStr } from "@/lib/hesap";
import { OdevSemasi, OdevDurumSemasi } from "@/lib/dogrulama";
import { egitmenMi } from "@/lib/sabitler";
import { dosyaSakla, dosyaSil, klasorSil, type SaklananDosya } from "@/lib/dosya-saklama";
import { KANIT_GRUPLARI, MAX_KANIT, kanitKlasoru } from "@/lib/odev-kanit";
import { denetim } from "@/lib/log";
import { oturumGerekli, panelleriTazele, hataMetni, type EylemSonuc } from "./yardimci";

export async function odevEkle(girdi: unknown): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const veri = OdevSemasi.parse(girdi);

    const ogrenci = await prisma.kullanici.findUnique({ where: { id: veri.ogrenciId } });
    if (!ogrenci || ogrenci.rol !== "ogrenci" || ogrenci.kocId !== koc.id) {
      return { hata: "Bu öğrenci size atanmış değil." };
    }

    let kayitId = "";
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
      kayitId = kayit.id;
    });
    denetim("odev.ekle", koc, { odevId: kayitId, ogrenciId: veri.ogrenciId, ders: veri.ders, konu: veri.konu });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "odev.ekle") };
  }
}

export async function odevSil(id: string): Promise<EylemSonuc> {
  try {
    const koc = await oturumGerekli("koc");
    const o = await prisma.odev.findUnique({ where: { id } });
    if (!o || o.kocId !== koc.id) return { hata: "Ödev bulunamadı." };
    await prisma.odev.delete({ where: { id } }); // kanıt satırları FK cascade ile gider
    await klasorSil(kanitKlasoru(id)); // diskteki fotoğraflar
    denetim("odev.sil", koc, { odevId: id, ogrenciId: o.ogrenciId, ders: o.ders, konu: o.konu });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "odev.sil") };
  }
}

export async function odevDurum(id: string, durum: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");
    const yeniDurum = OdevDurumSemasi.parse(durum);
    const o = await prisma.odev.findUnique({ where: { id } });
    if (!o) return { hata: "Ödev bulunamadı." };
    const sahibi = egitmenMi(kim.rol) ? o.kocId === kim.id : o.ogrenciId === kim.id;
    if (!sahibi) return { hata: "Bu ödev üzerinde yetkiniz yok." };

    // Öğrenci tamamlandı diyorsa kanıt fotoğrafı şart (koç serbestçe işaretleyebilir).
    // Normal akış odevTamamla'dır; bu kontrol doğrudan çağrıya karşı savunma katmanı.
    if (kim.rol === "ogrenci" && yeniDurum === "tamamlandi") {
      const kanitAdet = await prisma.odevKanit.count({ where: { odevId: id } });
      if (kanitAdet === 0) {
        return { hata: "Ödevi tamamlamak için en az bir fotoğraf eklemeniz gerekiyor." };
      }
    }

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
    denetim("odev.durum", kim, { odevId: id, eski: o.durum, yeni: yeniDurum });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "odev.durum") };
  }
}

/**
 * Öğrenci ödevi kanıt fotoğrafı/fotoğraflarıyla tamamlar.
 * Dosyalar DB'den önce diske yazılır; kayıt başarısız olursa geri alınır.
 */
export async function odevKanitYukle(formData: FormData): Promise<EylemSonuc> {
  const yazilanlar: SaklananDosya[] = [];
  let kaydedildi = false;
  try {
    const ogrenci = await oturumGerekli("ogrenci");
    const odevId = String(formData.get("odevId") ?? "");
    const o = await prisma.odev.findUnique({
      where: { id: odevId },
      include: { _count: { select: { kanitlar: true } } },
    });
    if (!o) return { hata: "Ödev bulunamadı." };
    if (o.ogrenciId !== ogrenci.id) return { hata: "Bu ödev üzerinde yetkiniz yok." };

    const dosyalar = formData
      .getAll("kanit")
      .filter((x): x is File => x instanceof File && x.size > 0);
    if (dosyalar.length === 0) {
      return { hata: "Ödevi tamamlamak için en az bir fotoğraf ekleyin." };
    }
    const kalan = MAX_KANIT - o._count.kanitlar;
    if (dosyalar.length > kalan) {
      return {
        hata:
          kalan > 0
            ? `En fazla ${kalan} fotoğraf daha ekleyebilirsiniz.`
            : `Bu ödeve en fazla ${MAX_KANIT} fotoğraf eklenebilir.`,
      };
    }

    try {
      for (const dosya of dosyalar) {
        yazilanlar.push(await dosyaSakla(kanitKlasoru(odevId), "kanit", dosya, KANIT_GRUPLARI));
      }
    } catch (e) {
      await Promise.all(yazilanlar.map((d) => dosyaSil(d.yol)));
      return { hata: e instanceof Error ? e.message : "Fotoğraf yüklenemedi." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.odevKanit.createMany({
        data: yazilanlar.map((d) => ({
          odevId,
          ad: d.ad,
          yol: d.yol,
          tur: d.tur,
          boyut: d.boyut,
        })),
      });
      if (o.durum !== "tamamlandi") {
        await tx.odev.update({ where: { id: odevId }, data: { durum: "tamamlandi" } });
        const ogr = await tx.kullanici.findUnique({ where: { id: o.ogrenciId } });
        await bildirimEkle(
          tx,
          o.kocId,
          "✅",
          (ogr?.ad ?? "Öğrenci") + " bir ödevi tamamladı: " + o.ders + " – " + o.konu +
            " · " + yazilanlar.length + " fotoğraf ekledi",
          { tur: "odev", ogrenciId: o.ogrenciId, kayitId: o.id }
        );
      }
    });
    kaydedildi = true;

    denetim("odev.kanitYukle", ogrenci, {
      odevId,
      adet: yazilanlar.length,
      eskiDurum: o.durum,
    });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    // DB tarafı düştüyse diske yazılanlar geride kalmasın; kayıt tamamlandıysa dokunma
    if (!kaydedildi) await Promise.all(yazilanlar.map((d) => dosyaSil(d.yol)));
    return { hata: hataMetni(e, "odev.kanitYukle") };
  }
}

/** Öğrenci kendi yüklediği kanıt fotoğrafını siler.
    Son fotoğraf da silinirse ödev "bekliyor"a döner (tamamlandı ⇒ kanıt var). */
export async function odevKanitSil(kanitId: string): Promise<EylemSonuc> {
  try {
    const ogrenci = await oturumGerekli("ogrenci");
    const kanit = await prisma.odevKanit.findUnique({
      where: { id: kanitId },
      include: { odev: { select: { id: true, ogrenciId: true, durum: true } } },
    });
    if (!kanit) return { hata: "Fotoğraf bulunamadı." };
    if (kanit.odev.ogrenciId !== ogrenci.id) return { hata: "Bu fotoğraf üzerinde yetkiniz yok." };

    const kalan = await prisma.odevKanit.count({ where: { odevId: kanit.odev.id } });
    await prisma.$transaction(async (tx) => {
      await tx.odevKanit.delete({ where: { id: kanitId } });
      if (kalan <= 1 && kanit.odev.durum === "tamamlandi") {
        await tx.odev.update({ where: { id: kanit.odev.id }, data: { durum: "bekliyor" } });
      }
    });
    await dosyaSil(kanit.yol);

    denetim("odev.kanitSil", ogrenci, { odevId: kanit.odev.id, kanitId });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "odev.kanitSil") };
  }
}
