import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { isoTarih } from "@/lib/hesap";
import Ajanda from "@/components/koc/Ajanda";
import type { AjandaOlay } from "@/components/koc/tipler";

export const metadata: Metadata = { title: "Ajanda – Kaynak Kampüs" };

export default async function AjandaSayfasi() {
  const koc = await aktifKullanici("koc");

  const ogrenciler = await prisma.kullanici.findMany({
    where: { rol: "ogrenci", kocId: koc.id },
    orderBy: { ad: "asc" },
    include: {
      odevlerOgrenci: { orderBy: { sonTarih: "asc" } },
      denemeler: { orderBy: [{ tarih: "asc" }, { id: "asc" }] },
      ozelDersOgrenci: { orderBy: [{ tarih: "asc" }, { saat: "asc" }] },
    },
  });

  /* ── Ajanda olayları (tüm öğrencilerden, öğrenci adıyla) ── */
  const olaylar: AjandaOlay[] = [];
  for (const o of ogrenciler) {
    const kisaAd = o.ad.split(" ")[0];
    for (const x of o.ozelDersOgrenci) {
      if (!["planlandi", "yapildi", "talep"].includes(x.durum)) continue;
      olaylar.push({
        tip: "ozel",
        tarih: isoTarih(x.tarih),
        tamam: x.durum === "yapildi",
        etiket: "🎓 " + (x.saat ? x.saat + " " : "") + kisaAd,
        baslik: `🎓 Özel Ders · ${o.ad}`,
        metin: x.ders + (x.konu ? " – " + x.konu : ""),
        etiketler: x.saat ? [`🕐 ${x.saat} · ${x.sure || 60} dk`] : [],
        rozet:
          x.durum === "yapildi"
            ? { stil: "tamam", metin: "✓ Yapıldı" }
            : x.durum === "talep"
              ? { stil: "talep", metin: "🕓 Onay bekliyor" }
              : { stil: "bekliyor", metin: "📌 Planlandı" },
      });
    }
    for (const od of o.odevlerOgrenci) {
      if (!od.sonTarih) continue;
      olaylar.push({
        tip: "odev",
        tarih: isoTarih(od.sonTarih),
        tamam: od.durum === "tamamlandi",
        etiket: `📘 ${kisaAd}: ${od.ders}`,
        baslik: `📘 Ödev son günü · ${o.ad}`,
        metin: `${od.ders} – ${od.konu}`,
        etiketler: od.soruSayisi ? [`${od.soruSayisi} soru`] : [],
        rozet:
          od.durum === "tamamlandi"
            ? { stil: "tamam", metin: "✓ Tamamlandı" }
            : { stil: "bekliyor", metin: "⏳ Bekliyor" },
      });
    }
    for (const d of o.denemeler) {
      olaylar.push({
        tip: "deneme",
        tarih: isoTarih(d.tarih),
        tamam: false,
        etiket: `📈 ${kisaAd}: ${d.tur}`,
        baslik: `📈 Deneme · ${o.ad}`,
        metin: d.ad,
        etiketler: [d.tur, `Net: ${d.net}`],
        rozet: null,
      });
    }
  }

  return (
    <main className="container">
      <Ajanda olaylar={olaylar} />
    </main>
  );
}
