import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import KayitOdagi from "@/components/ogrenci/KayitOdagi";
import OzelDersBolumu from "@/components/ogrenci/OzelDersBolumu";
import { degerlendirmeSerile, type DegerlendirmeS } from "@/components/degerlendirme/alanlar";

export const metadata: Metadata = { title: "Özel Derslerim – Kaynak Kampüs" };

export default async function OzelDerslerSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ kayit?: string }>;
}) {
  const ogrenci = await aktifKullanici("ogrenci");
  const sp = await searchParams;
  const ozelDersler = await prisma.ozelDers.findMany({
    where: { ogrenciId: ogrenci.id, NOT: { durum: "iptal" } },
    orderBy: [{ tarih: "asc" }, { saat: "asc" }],
    // Gizlilik: öğrenci yalnızca kendi yazdığı değerlendirmeyi görür.
    // Öğretmenin öğrenci hakkındaki değerlendirmesi (yon="kocOgrenci") bu
    // yüzeye hiç taşınmaz — yalnızca yönetim (/admin/degerlendirmeler) görür.
    include: { degerlendirmeler: { where: { yon: "ogrenciKoc" } } },
  });

  // Ders başına yalnızca "benim" (öğrencinin öğretmene verdiği) değerlendirme
  const degerlendirmeler: Record<string, { benim?: DegerlendirmeS }> = {};
  for (const d of ozelDersler) {
    for (const dd of d.degerlendirmeler) {
      (degerlendirmeler[d.id] ??= {}).benim = degerlendirmeSerile(dd);
    }
  }

  return (
    <main className="container">
      <KayitOdagi kayit={sp.kayit} />
      <OzelDersBolumu
        ogrenciId={ogrenci.id}
        kocVar={!!ogrenci.kocId}
        dersler={ozelDersler}
        degerlendirmeler={degerlendirmeler}
      />
    </main>
  );
}
