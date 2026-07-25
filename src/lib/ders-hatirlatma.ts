/* ═══════════════════════════════════════════════════════════════
   Online ders "derse kaç dk kala" hatırlatması — yalnız sunucu tarafında.

   Mail işleyicisi her turda çağırır. Başlamamış, planlı, henüz
   hatırlatılmamış dersler için, dersin (sınıf override'ı yoksa global)
   hatırlatma penceresine girenlere hem uygulama içi bildirim hem de
   (VAPID varsa) push gönderir; sonra ders `hatirlatildi=true` işaretlenir.

   Alıcılar: sınıf dersinde öğrenciler + öğretmen; özel ders oturumunda
   öğrenci + koç.
   ═══════════════════════════════════════════════════════════════ */

import { prisma } from "@/lib/prisma";
import { bildirimEkle } from "@/lib/bildirim";
import { mailAyarGetir } from "@/lib/mail";
import { pushGonderCoklu } from "@/lib/push";
import { logcu } from "@/lib/log";

const log = logcu("ders-hatirlatma");

/** En büyük olası hatırlatma penceresi (dk) — sorgu ufkunu sınırlar. */
const MAKS_PENCERE_DK = 1440;

const saatBicim = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  hour: "2-digit",
  minute: "2-digit",
});

export async function dersHatirlatmalariniUret(): Promise<number> {
  const ayar = await mailAyarGetir();
  const genelDk = ayar.dersHatirlatmaDk;

  const simdi = new Date();
  const ufuk = new Date(simdi.getTime() + (MAKS_PENCERE_DK + 1) * 60_000);

  const oturumlar = await prisma.dersOturumu.findMany({
    where: {
      durum: "planlandi",
      hatirlatildi: false,
      baslangic: { gt: simdi, lte: ufuk },
    },
    select: {
      id: true,
      baslik: true,
      baslangic: true,
      sinif: {
        select: {
          ad: true,
          ogretmenId: true,
          hatirlatmaDk: true,
          uyeler: { select: { kullaniciId: true } },
        },
      },
      ozelDers: { select: { kocId: true, ogrenciId: true } },
    },
  });

  let toplam = 0;

  for (const o of oturumlar) {
    const lead = o.sinif?.hatirlatmaDk ?? genelDk;
    const pencereAcilis = o.baslangic.getTime() - lead * 60_000;
    if (simdi.getTime() < pencereAcilis) continue; // henüz erken

    // Alıcılar (yinelenenler temizlenir)
    const aliciSet = new Set<string>();
    if (o.sinif) {
      o.sinif.uyeler.forEach((u) => aliciSet.add(u.kullaniciId));
      aliciSet.add(o.sinif.ogretmenId);
    }
    if (o.ozelDers) {
      aliciSet.add(o.ozelDers.ogrenciId);
      aliciSet.add(o.ozelDers.kocId);
    }
    const alicilar = [...aliciSet];
    if (!alicilar.length) {
      // Alıcı yoksa yine de işaretle ki her turda taranmasın
      await prisma.dersOturumu.update({ where: { id: o.id }, data: { hatirlatildi: true } });
      continue;
    }

    const saat = saatBicim.format(o.baslangic);
    const sinifAd = o.sinif?.ad ? o.sinif.ad + ": " : "";
    const metin = `${sinifAd}${o.baslik} canlı dersi ${lead} dk içinde (${saat}) başlıyor.`;
    const url = `/canli-ders/${o.id}`;

    // Uygulama içi bildirim + hatirlatildi işareti tek transaction'da
    await prisma.$transaction(async (tx) => {
      for (const aliciId of alicilar) {
        await bildirimEkle(tx, aliciId, "⏰", metin, {
          tur: "oturum",
          ogrenciId: aliciId,
          kayitId: o.id,
        });
      }
      await tx.dersOturumu.update({ where: { id: o.id }, data: { hatirlatildi: true } });
    });

    // Push (ağ işi; transaction dışında, en iyi çaba)
    await pushGonderCoklu(alicilar, {
      baslik: "Canlı ders yaklaşıyor ⏰",
      govde: metin,
      url,
      etiket: `oturum-${o.id}`,
    });

    toplam++;
  }

  if (toplam) log.info({ oturum: toplam }, "ders hatırlatmaları gönderildi");
  return toplam;
}
