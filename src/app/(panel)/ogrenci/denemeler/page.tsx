import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { profilAyristir } from "@/lib/hesap";
import DenemeBolumu from "@/components/ogrenci/DenemeBolumu";

export const metadata: Metadata = { title: "Deneme Sonuçlarım – Kaynak Akademi" };

export default async function DenemelerSayfasi() {
  const ogrenci = await aktifKullanici("ogrenci");
  const denemeler = await prisma.deneme.findMany({
    where: { ogrenciId: ogrenci.id },
    include: { dersler: true },
    orderBy: { tarih: "asc" },
  });

  return (
    <main className="container">
      <DenemeBolumu ogrenciId={ogrenci.id} denemeler={denemeler} profil={profilAyristir(ogrenci.profil)} />
    </main>
  );
}
