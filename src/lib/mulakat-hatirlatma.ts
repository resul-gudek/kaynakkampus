/* Mülakat hatırlatmaları — mülakattan bir gün ve bir saat önce başvurana
   e-posta gönderir. mail-isleyici.ts turunda çağrılır. Başvuran kayıtlı
   kullanıcı olmadığından site-içi bildirim uygulanmaz; hatırlatma e-postadır.

   Tekrar koruması iki katmanlı: Mulakat üzerindeki boolean bayraklar
   (hatirlatma24SaatGonderildi / hatirlatma1SaatGonderildi) + mailKuyrukla
   refTur/refId. Mülakat yeniden planlanınca YENİ kayıt (bayraklar false)
   oluştuğu için hatırlatmalar yeni tarihe göre yeniden çıkar. */

import { prisma } from "@/lib/prisma";
import { mailAyarGetir, mailKuyrukla } from "@/lib/mail";
import { tarihStr } from "@/lib/hesap";
import { MULAKAT_TUR_ETIKETLERI, type MulakatTur } from "@/lib/sabitler";

const SAAT_MS = 3_600_000;

function detayMetni(m: { tur: string; baglanti: string; adres: string }): string {
  if (m.tur === "online") return m.baglanti || "Bağlantı görüşme öncesi paylaşılacaktır.";
  if (m.tur === "yuzyuze") return m.adres || "Adres görüşme öncesi paylaşılacaktır.";
  return "Sizi arayacağız.";
}

function neKadarKala(farkMs: number): string {
  if (farkMs <= 1.5 * SAAT_MS) return "yaklaşık 1 saat sonra";
  const saat = Math.round(farkMs / SAAT_MS);
  return `yaklaşık ${saat} saat sonra`;
}

/** Gönderim penceresine girmiş aktif mülakatlar için hatırlatma kuyruklar.
    Kuyruğa eklenen hatırlatma sayısını döner. */
export async function mulakatHatirlatmalariniKuyrukla(): Promise<number> {
  const ayar = await mailAyarGetir();
  if (!ayar.aktif) return 0;

  const simdi = new Date();
  const ufuk = new Date(simdi.getTime() + 25 * SAAT_MS);

  const mulakatlar = await prisma.mulakat.findMany({
    where: {
      aktif: true,
      tarih: { gt: simdi, lte: ufuk },
      basvuru: { eposta: { not: "" } },
      OR: [{ hatirlatma24SaatGonderildi: false }, { hatirlatma1SaatGonderildi: false }],
    },
    select: {
      id: true,
      tarih: true,
      tur: true,
      baglanti: true,
      adres: true,
      hatirlatma24SaatGonderildi: true,
      hatirlatma1SaatGonderildi: true,
      basvuru: { select: { ad: true, eposta: true } },
    },
  });

  let sayac = 0;
  for (const m of mulakatlar) {
    const fark = m.tarih.getTime() - simdi.getTime();
    // Hangi kova? 1 saatlik pencere önceliklidir.
    let kova: "1" | "24" | null = null;
    if (fark <= SAAT_MS && !m.hatirlatma1SaatGonderildi) kova = "1";
    else if (fark <= 24 * SAAT_MS && !m.hatirlatma24SaatGonderildi) kova = "24";
    if (!kova) continue;

    const saat = m.tarih.toLocaleTimeString("tr-TR", {
      timeZone: "Europe/Istanbul",
      hour: "2-digit",
      minute: "2-digit",
    });

    const eklendi = await mailKuyrukla({
      sablonAnahtar: "mulakat-hatirlatma",
      alici: m.basvuru.eposta,
      aliciAd: m.basvuru.ad,
      degiskenler: {
        ad: m.basvuru.ad,
        tarih: tarihStr(m.tarih),
        saat,
        tur: MULAKAT_TUR_ETIKETLERI[m.tur as MulakatTur] ?? m.tur,
        detay: detayMetni(m),
        neKadarKala: neKadarKala(fark),
      },
      refTur: `mulakat-hatirlatma-${kova}`,
      refId: m.id,
    });

    // Bayrağı işaretle (mail kuyruklanamasa bile tekrar denemeyi sınırlamak
    // için yalnız eklendiyse işaretle; 1 saat kovası 24'ü de kapatır).
    if (eklendi) {
      await prisma.mulakat.update({
        where: { id: m.id },
        data:
          kova === "1"
            ? { hatirlatma1SaatGonderildi: true, hatirlatma24SaatGonderildi: true }
            : { hatirlatma24SaatGonderildi: true },
      });
      sayac++;
    }
  }
  return sayac;
}
