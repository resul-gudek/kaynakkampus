import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import YolHaritasi from "@/components/ogrenci/YolHaritasi";

export const metadata: Metadata = { title: "Yol Haritam – Kaynak Kampüs" };

export default async function YolHaritasiSayfasi() {
  const ogrenci = await aktifKullanici("ogrenci");
  const yolAdimlari = await prisma.yolAdimi.findMany({
    where: { ogrenciId: ogrenci.id },
    orderBy: { sira: "asc" },
  });

  return (
    <main className="container">
      <YolHaritasi adimlar={yolAdimlari} />
    </main>
  );
}
