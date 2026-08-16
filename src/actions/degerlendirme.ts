"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { bildirimEkle } from "@/lib/bildirim";
import { ozelDersMetni } from "@/lib/hesap";
import {
  KocOgrenciDegerlendirmeSemasi,
  OgrenciKocDegerlendirmeSemasi,
} from "@/lib/dogrulama";
import { egitmenMi } from "@/lib/sabitler";
import { denetim } from "@/lib/log";
import { oturumGerekli, panelleriTazele, hataMetni, type EylemSonuc } from "./yardimci";

/* Ders sonrası karşılıklı değerlendirme.
   Yön kullanıcının rolünden türetilir: koç → öğrenciyi (kocOgrenci),
   öğrenci → öğretmeni (ogrenciKoc). Ders başına her yönde tek kayıt (upsert).

   Gizlilik: taraflar birbirinin değerlendirmesini görmez (öğrenci/öğretmen
   yüzeyleri yalnızca kendi yönünü çeker, veli puan özetini görür); tam kayıtlar
   yalnızca yönetimde /admin/degerlendirmeler sayfasında görünür. Bu nedenle
   yeni değerlendirme bildirimi karşı tarafa değil yöneticilere gider. */

export async function degerlendirmeKaydet(
  ozelDersId: string,
  girdi: unknown
): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "ogrenci");

    const ders = await prisma.ozelDers.findUnique({ where: { id: ozelDersId } });
    if (!ders) return { hata: "Ders kaydı bulunamadı." };
    if (ders.durum !== "yapildi") {
      return { hata: "Yalnızca tamamlanmış (yapıldı) dersler değerlendirilebilir." };
    }

    let yon: "kocOgrenci" | "ogrenciKoc";
    let hedefId: string;
    let veri: Record<string, unknown>;

    if (egitmenMi(kim.rol)) {
      if (ders.kocId !== kim.id) return { hata: "Bu ders size atanmış değil." };
      yon = "kocOgrenci";
      hedefId = ders.ogrenciId;
      veri = KocOgrenciDegerlendirmeSemasi.parse(girdi);
    } else {
      if (ders.ogrenciId !== kim.id) {
        return { hata: "Yalnızca katıldığınız dersi değerlendirebilirsiniz." };
      }
      yon = "ogrenciKoc";
      hedefId = ders.kocId;
      veri = OgrenciKocDegerlendirmeSemasi.parse(girdi);
    }

    const puan = Number(veri.puan) || 0;
    const veriJson = JSON.stringify(veri);

    let yeniKayit = false;
    await prisma.$transaction(async (tx) => {
      const mevcut = await tx.dersDegerlendirme.findUnique({
        where: { ozelDersId_yon: { ozelDersId, yon } },
      });
      yeniKayit = !mevcut;

      await tx.dersDegerlendirme.upsert({
        where: { ozelDersId_yon: { ozelDersId, yon } },
        create: { ozelDersId, yon, yazarId: kim.id, hedefId, puan, veri: veriJson },
        update: { puan, veri: veriJson },
      });

      /* Yeni değerlendirmede yöneticilere bildirim (düzenlemede tekrar bildirim
         yok). Karşı taraf içeriği göremediği için ona bildirim gitmez; hedef
         bağlantısı da verilmez — yöneticiler kaydı Değerlendirmeler sayfasından
         inceler. */
      if (yeniKayit) {
        const m = ozelDersMetni(ders);
        const yazar = await tx.kullanici.findUnique({ where: { id: kim.id } });
        const hedefKisi = await tx.kullanici.findUnique({ where: { id: hedefId } });
        const yazarAd = yazar?.ad ?? (egitmenMi(kim.rol) ? "Öğretmen" : "Öğrenci");
        const hedefAd = hedefKisi?.ad ?? "—";
        const metin =
          egitmenMi(kim.rol)
            ? `Yeni ders değerlendirmesi — ${yazarAd} → ${hedefAd}: ${m}`
            : `Yeni ders değerlendirmesi — ${yazarAd} → öğretmeni ${hedefAd}: ${m}`;
        const yoneticiler = await tx.kullanici.findMany({
          where: { rol: "admin" },
          select: { id: true },
        });
        for (const y of yoneticiler) {
          await bildirimEkle(tx, y.id, "⭐", metin);
        }
      }
    });

    denetim("degerlendirme.kaydet", kim, { ozelDersId, yon, puan, yeni: yeniKayit });
    panelleriTazele();
    revalidatePath("/veli", "layout");
    revalidatePath("/admin/degerlendirmeler");
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "degerlendirme.kaydet") };
  }
}
