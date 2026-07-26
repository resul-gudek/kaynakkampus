import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import TakipListesi from "@/components/ogrenci/TakipListesi";

export const metadata: Metadata = { title: "Haftalık Takip Listem – Kaynak Kampüs" };

export default async function TakipSayfasi() {
  const ogrenci = await aktifKullanici("ogrenci");
  const takip = await prisma.takip.findMany({ where: { ogrenciId: ogrenci.id } });

  return (
    <main className="container">
      <TakipListesi takip={takip} />
    </main>
  );
}
