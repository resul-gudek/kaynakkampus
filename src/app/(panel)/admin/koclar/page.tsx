import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import KocYonetimi, { type KocGorunum } from "../KocYonetimi";

export const metadata: Metadata = { title: "Koçlar Listesi – Kaynak Kampüs" };

/* Yalnız "koc" rolü. Öğretmenler ayrı bir roldür ve /admin/ogretmenler
   sayfasında yönetilir — iki liste kasıtlı olarak birbirine karışmaz. */
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
        <p>
          Eğitim koçu hesaplarını ekleyin, durumlarını yönetin ve öğrenci sayılarını takip edin.
          Öğretmen hesapları için <b>Öğretmenler</b> ekranını kullanın.
        </p>
      </div>
      <KocYonetimi koclar={kocGorunum} rol="koc" />
    </main>
  );
}
