import type { Prisma } from "@prisma/client";

export interface BildirimHedef {
  tur: "ozel" | "odev" | "sinif" | "oturum" | "test" | "video";
  ogrenciId: string;
  kayitId: string;
}

/** Bildirim ekler (transaction içinde çağrılır) ve alıcı başına 200 kayıt tavanını uygular. */
export async function bildirimEkle(
  tx: Prisma.TransactionClient,
  aliciId: string | null | undefined,
  ikon: string,
  metin: string,
  hedef?: BildirimHedef | null
) {
  if (!aliciId) return;
  await tx.bildirim.create({
    data: {
      aliciId,
      ikon,
      metin,
      hedefTur: hedef?.tur ?? null,
      hedefOgrenciId: hedef?.ogrenciId ?? null,
      hedefKayitId: hedef?.kayitId ?? null,
    },
  });
  // eski kayıtlar taşmasın (legacy: 200 tavan)
  const taskin = await tx.bildirim.findMany({
    where: { aliciId },
    orderBy: { tarih: "desc" },
    skip: 200,
    select: { id: true },
  });
  if (taskin.length) {
    await tx.bildirim.deleteMany({ where: { id: { in: taskin.map((x) => x.id) } } });
  }
}
