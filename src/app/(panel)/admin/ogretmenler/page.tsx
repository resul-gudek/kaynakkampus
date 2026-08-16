import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import KocYonetimi, { type KocGorunum } from "../KocYonetimi";

export const metadata: Metadata = { title: "Öğretmenler Listesi – Kaynak Kampüs" };

/* Yalnız "ogretmen" rolü. Eğitim koçları ayrı bir roldür ve /admin/koclar
   sayfasında yönetilir — iki liste kasıtlı olarak birbirine karışmaz. */
export default async function OgretmenlerSayfasi() {
  await aktifKullanici("admin");

  const ogretmenler = await prisma.kullanici.findMany({
    where: { rol: "ogretmen" },
    orderBy: { ad: "asc" },
    include: { _count: { select: { ogrenciler: true } } },
  });

  const gorunum: KocGorunum[] = ogretmenler.map((o) => ({
    id: o.id,
    ad: o.ad,
    kullanici: o.kullanici,
    brans: o.brans ?? "",
    aktif: o.aktif,
    ogrenciSayisi: o._count.ogrenciler,
  }));

  return (
    <main className="container" style={{ maxWidth: 1160, paddingBottom: 40 }}>
      <div className="panel-bas">
        <h1>
          Öğretmenler <span>Listesi</span>
        </h1>
        <p>
          Öğretmen hesaplarını ekleyin, durumlarını yönetin ve öğrenci sayılarını takip edin.
          Eğitim koçu hesapları için <b>Koçlar</b> ekranını kullanın.
        </p>
      </div>
      <KocYonetimi koclar={gorunum} rol="ogretmen" />
    </main>
  );
}
