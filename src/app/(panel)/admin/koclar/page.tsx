import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import KocYonetimi, { type KocGorunum } from "../KocYonetimi";

export const metadata: Metadata = { title: "Koçlar Listesi – Kaynak Akademi" };

export default async function KoclarSayfasi() {
  await aktifKullanici("admin");

  const koclar = await prisma.kullanici.findMany({
    where: { rol: "koc" },
    orderBy: { ad: "asc" },
    include: { _count: { select: { ogrenciler: true } } },
  });

  const kocGorunum: KocGorunum[] = koclar.map((k) => ({
    id: k.id,
    ad: k.ad,
    kullanici: k.kullanici,
    brans: k.brans ?? "",
    aktif: k.aktif,
    ogrenciSayisi: k._count.ogrenciler,
  }));

  return (
    <main className="container" style={{ maxWidth: 1160, paddingBottom: 40 }}>
      <div className="panel-bas">
        <h1>
          Koçlar <span>Listesi</span>
        </h1>
        <p>Koç hesaplarını ekleyin, durumlarını yönetin ve öğrenci sayılarını takip edin.</p>
      </div>
      <KocYonetimi koclar={kocGorunum} />
    </main>
  );
}
