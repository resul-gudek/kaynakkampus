import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import KocYonetimi, { type KocGorunum } from "./KocYonetimi";

export const metadata: Metadata = { title: "Yönetim – Kaynak Akademi" };

export default async function AdminPanel() {
  const admin = await aktifKullanici("admin");

  const koclar = await prisma.kullanici.findMany({
    where: { rol: "koc" },
    orderBy: { ad: "asc" },
    include: { _count: { select: { ogrenciler: true } } },
  });

  const gorunum: KocGorunum[] = koclar.map((k) => ({
    id: k.id,
    ad: k.ad,
    kullanici: k.kullanici,
    brans: k.brans ?? "",
    aktif: k.aktif,
    ogrenciSayisi: k._count.ogrenciler,
  }));

  const ogrenciToplam = await prisma.kullanici.count({ where: { rol: "ogrenci" } });
  const atanmamis = await prisma.kullanici.count({ where: { rol: "ogrenci", kocId: null } });

  return (
    <main className="container" style={{ maxWidth: 980, paddingBottom: 40 }}>
      <div className="panel-bas">
        <h1>
          Yönetim <span>Paneli</span>
        </h1>
        <p>
          Hoş geldin, {admin.ad}. Toplam {gorunum.length} koç · {ogrenciToplam} öğrenci
          {atanmamis > 0 && ` (${atanmamis} atanmamış)`}
        </p>
      </div>
      <KocYonetimi koclar={gorunum} />
    </main>
  );
}
