import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import Takvim from "@/components/ogrenci/Takvim";

export const metadata: Metadata = { title: "Takvimim – Kaynak Kampüs" };

export default async function TakvimSayfasi() {
  const ogrenci = await aktifKullanici("ogrenci");

  const [odevler, takip, denemeler, ozelDersler] = await Promise.all([
    prisma.odev.findMany({ where: { ogrenciId: ogrenci.id } }),
    prisma.takip.findMany({ where: { ogrenciId: ogrenci.id } }),
    prisma.deneme.findMany({
      where: { ogrenciId: ogrenci.id },
      include: { dersler: true },
      orderBy: { tarih: "asc" },
    }),
    prisma.ozelDers.findMany({
      where: { ogrenciId: ogrenci.id, NOT: { durum: "iptal" } },
      orderBy: [{ tarih: "asc" }, { saat: "asc" }],
    }),
  ]);

  return (
    <main className="container">
      <Takvim odevler={odevler} ozelDersler={ozelDersler} denemeler={denemeler} takip={takip} />
    </main>
  );
}
