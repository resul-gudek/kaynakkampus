"use server";

import { prisma } from "@/lib/prisma";
import { bildirimEkle } from "@/lib/bildirim";
import { ozelDersMetni, tarihNesnesi } from "@/lib/hesap";
import { OzelDersSemasi, OzelDersGuncelleSemasi } from "@/lib/dogrulama";
import { oturumGerekli, panelleriTazele, hataMetni, type EylemSonuc } from "./yardimci";

/* Bildirim metinleri legacy/kocluk.js ozelDersEkle/ozelDersGuncelle'den birebir */

export async function ozelDersEkle(girdi: unknown): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");
    const veri = OzelDersSemasi.parse(girdi);

    const ogrenci = await prisma.kullanici.findUnique({ where: { id: veri.ogrenciId } });
    if (!ogrenci || ogrenci.rol !== "ogrenci" || !ogrenci.kocId) {
      return { hata: "Öğrenci bulunamadı ya da bir koça atanmamış." };
    }

    let kocId: string;
    if (kim.rol === "koc") {
      if (ogrenci.kocId !== kim.id) return { hata: "Bu öğrenci size atanmış değil." };
      kocId = kim.id;
      veri.olusturan = "koc";
    } else {
      if (ogrenci.id !== kim.id) return { hata: "Sadece kendi adınıza talep açabilirsiniz." };
      kocId = ogrenci.kocId;
      // Öğrenci yalnız talep açabilir, ücret belirleyemez
      veri.olusturan = "ogrenci";
      veri.durum = "talep";
      veri.ucret = 0;
    }

    await prisma.$transaction(async (tx) => {
      const kayit = await tx.ozelDers.create({
        data: {
          ogrenciId: veri.ogrenciId,
          kocId,
          ders: veri.ders,
          konu: veri.konu,
          tarih: tarihNesnesi(veri.tarih),
          saat: veri.saat,
          sure: veri.sure,
          ucret: veri.ucret,
          durum: veri.durum,
          olusturan: veri.olusturan,
          mesaj: veri.mesaj,
        },
      });
      const m = ozelDersMetni(kayit);
      const hedef = { tur: "ozel" as const, ogrenciId: kayit.ogrenciId, kayitId: kayit.id };
      if (kayit.durum === "talep") {
        if (kayit.olusturan === "ogrenci") {
          await bildirimEkle(tx, kayit.kocId, "🙋", ogrenci.ad + " özel ders talebi gönderdi: " + m, hedef);
        } else {
          await bildirimEkle(tx, kayit.ogrenciId, "📨", "Öğretmenin özel ders önerdi: " + m + " · Onayın bekleniyor.", hedef);
        }
      } else if (kayit.durum === "planlandi" && kayit.olusturan === "koc") {
        await bildirimEkle(tx, kayit.ogrenciId, "📅", "Öğretmenin özel ders planladı: " + m, hedef);
      }
    });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

export async function ozelDersSil(id: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");
    const x = await prisma.ozelDers.findUnique({ where: { id } });
    if (!x) return { hata: "Kayıt bulunamadı." };
    // Koç kendi kaydını; öğrenci yalnız kendi açtığı bekleyen talebi silebilir
    const yetkili =
      kim.rol === "koc"
        ? x.kocId === kim.id
        : x.ogrenciId === kim.id && x.olusturan === "ogrenci" && x.durum === "talep";
    if (!yetkili) return { hata: "Bu kayıt üzerinde yetkiniz yok." };
    await prisma.ozelDers.delete({ where: { id } });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}

export async function ozelDersGuncelle(id: string, girdi: unknown): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");
    const alanlar = OzelDersGuncelleSemasi.parse(girdi);

    const x = await prisma.ozelDers.findUnique({ where: { id } });
    if (!x) return { hata: "Kayıt bulunamadı." };

    if (kim.rol === "koc") {
      if (x.kocId !== kim.id) return { hata: "Bu kayıt üzerinde yetkiniz yok." };
    } else {
      // Öğrenci yalnızca koçun önerisini yanıtlayabilir (onay/red)
      const onayAkisi =
        x.ogrenciId === kim.id &&
        x.durum === "talep" &&
        x.olusturan === "koc" &&
        (alanlar.durum === "planlandi" || alanlar.durum === "reddedildi");
      if (!onayAkisi) return { hata: "Bu işlem için yetkiniz yok." };
      // Öğrenci başka alan değiştiremez
      for (const k of Object.keys(alanlar) as (keyof typeof alanlar)[]) {
        if (k !== "durum" && k !== "redNotu" && alanlar[k] !== undefined) delete alanlar[k];
      }
    }

    const eskiDurum = x.durum;
    const eskiOdendi = x.odendi;

    await prisma.$transaction(async (tx) => {
      const yeni = await tx.ozelDers.update({
        where: { id },
        data: {
          ...(alanlar.ders !== undefined && { ders: alanlar.ders }),
          ...(alanlar.konu !== undefined && { konu: alanlar.konu }),
          ...(alanlar.tarih !== undefined && { tarih: tarihNesnesi(alanlar.tarih) }),
          ...(alanlar.saat !== undefined && { saat: alanlar.saat }),
          ...(alanlar.sure !== undefined && { sure: alanlar.sure }),
          ...(alanlar.ucret !== undefined && { ucret: alanlar.ucret }),
          ...(alanlar.durum !== undefined && { durum: alanlar.durum }),
          ...(alanlar.odendi !== undefined && { odendi: alanlar.odendi }),
          ...(alanlar.not_ !== undefined && { not_: alanlar.not_ }),
          ...(alanlar.odev !== undefined && { odev: alanlar.odev }),
          ...(alanlar.redNotu !== undefined && { redNotu: alanlar.redNotu }),
        },
      });

      const ogr = await tx.kullanici.findUnique({ where: { id: yeni.ogrenciId } });
      const ogrAd = ogr?.ad ?? "Öğrenci";
      const m = ozelDersMetni(yeni);
      const hedef = { tur: "ozel" as const, ogrenciId: yeni.ogrenciId, kayitId: yeni.id };

      if (alanlar.durum !== undefined && yeni.durum !== eskiDurum) {
        if (eskiDurum === "talep" && yeni.durum === "planlandi") {
          if (yeni.olusturan === "ogrenci") {
            await bildirimEkle(tx, yeni.ogrenciId, "✅", "Özel ders talebin onaylandı: " + m + (+yeni.ucret ? " · " + yeni.ucret + " ₺" : ""), hedef);
          } else {
            await bildirimEkle(tx, yeni.kocId, "✅", ogrAd + " ders önerini onayladı: " + m, hedef);
          }
        } else if (yeni.durum === "reddedildi") {
          const neden = yeni.redNotu ? " · Neden: " + yeni.redNotu : "";
          if (yeni.olusturan === "ogrenci") {
            await bildirimEkle(tx, yeni.ogrenciId, "❌", "Özel ders talebin reddedildi: " + m + neden, hedef);
          } else {
            await bildirimEkle(tx, yeni.kocId, "❌", ogrAd + " ders önerini reddetti: " + m + neden, hedef);
          }
        } else if (yeni.durum === "yapildi") {
          await bildirimEkle(tx, yeni.ogrenciId, "🎓", "Dersin yapıldı olarak işaretlendi: " + m + (yeni.odev ? " · Ders ödevi: " + yeni.odev : ""), hedef);
        } else if (yeni.durum === "iptal") {
          await bildirimEkle(tx, yeni.ogrenciId, "🚫", "Özel dersin iptal edildi: " + m, hedef);
        }
      }
      if (alanlar.odendi === true && !eskiOdendi) {
        await bildirimEkle(tx, yeni.ogrenciId, "💰", "Ders ödemen kaydedildi: " + m + (+yeni.ucret ? " · " + yeni.ucret + " ₺" : ""), hedef);
      }
    });
    panelleriTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e) };
  }
}
