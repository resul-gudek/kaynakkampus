import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import KayitOdagi from "@/components/ogrenci/KayitOdagi";
import OzelDersBolumu from "@/components/ogrenci/OzelDersBolumu";

export const metadata: Metadata = { title: "Özel Derslerim – Kaynak Akademi" };

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
  });

  return (
    <main className="container">
      <KayitOdagi kayit={sp.kayit} />
      <OzelDersBolumu ogrenciId={ogrenci.id} kocVar={!!ogrenci.kocId} dersler={ozelDersler} />
    </main>
  );
}
