import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import KayitOdagi from "@/components/ogrenci/KayitOdagi";
import OdevListesi from "@/components/ogrenci/OdevListesi";

export const metadata: Metadata = { title: "Ödevlerim – Kaynak Akademi" };

export default async function OdevlerSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ kayit?: string }>;
}) {
  const ogrenci = await aktifKullanici("ogrenci");
  const sp = await searchParams;
  const odevler = await prisma.odev.findMany({ where: { ogrenciId: ogrenci.id } });

  return (
    <main className="container">
      <KayitOdagi kayit={sp.kayit} />
      <OdevListesi odevler={odevler} />
    </main>
  );
}
