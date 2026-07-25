import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import MesajPaneli, { type Konusma, type MesajGorunum } from "./MesajPaneli";

export const metadata: Metadata = { title: "Mesajlar – Kaynak Akademi" };

/* "Bugün · 14:35" / "12.07 · 09:10" biçimi (İstanbul) */
function zamanStr(t: Date): string {
  const gunF = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric" });
  const saatF = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });
  const gun = gunF.format(t);
  const bugun = gunF.format(new Date());
  const kisaGun = gun.slice(0, 5); // GG.AA
  return (gun === bugun ? "Bugün" : kisaGun) + " · " + saatF.format(t);
}

export default async function MesajlarSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ ile?: string }>;
}) {
  const kim = await aktifKullanici();
  const sp = await searchParams;

  /* Muhataplar: koç için kendi öğrencileri, öğrenci için kendi koçu. */
  let muhataplar: { id: string; ad: string; altBilgi: string }[] = [];
  if (kim.rol === "koc") {
    const ogrenciler = await prisma.kullanici.findMany({
      where: { rol: "ogrenci", kocId: kim.id, aktif: true },
      orderBy: { ad: "asc" },
      select: { id: true, ad: true, sinif: true },
    });
    muhataplar = ogrenciler.map((o) => ({ id: o.id, ad: o.ad, altBilgi: o.sinif || "Öğrenci" }));
  } else if (kim.rol === "ogrenci" && kim.kocId) {
    const koc = await prisma.kullanici.findUnique({
      where: { id: kim.kocId },
      select: { id: true, ad: true, brans: true, aktif: true },
    });
    if (koc?.aktif) muhataplar = [{ id: koc.id, ad: koc.ad, altBilgi: koc.brans || "Koç" }];
  }

  /* Bu kullanıcının dahil olduğu tüm mesajlar (son 500), muhataba göre gruplanır. */
  const tumMesajlar = await prisma.mesaj.findMany({
    where: { OR: [{ gonderenId: kim.id }, { aliciId: kim.id }] },
    orderBy: { tarih: "asc" },
    take: 500,
    select: { id: true, gonderenId: true, aliciId: true, govde: true, okundu: true, tarih: true },
  });

  const izinliIdler = new Set(muhataplar.map((m) => m.id));

  const konusmalar: Konusma[] = muhataplar.map((m) => {
    const arasi = tumMesajlar.filter(
      (x) =>
        (x.gonderenId === kim.id && x.aliciId === m.id) ||
        (x.gonderenId === m.id && x.aliciId === kim.id)
    );
    const son = arasi[arasi.length - 1];
    const okunmamis = arasi.filter((x) => x.aliciId === kim.id && !x.okundu).length;
    return {
      digerId: m.id,
      ad: m.ad,
      altBilgi: m.altBilgi,
      sonMesaj: son ? son.govde : "",
      sonZaman: son ? zamanStr(son.tarih) : "",
      okunmamis,
    };
  });

  /* Seçili konuşma: geçerli ?ile= varsa o, yoksa okunmamışı olan ilk, yoksa ilk muhatap. */
  const istenen = sp.ile && izinliIdler.has(sp.ile) ? sp.ile : "";
  const seciliId =
    istenen ||
    konusmalar.find((k) => k.okunmamis > 0)?.digerId ||
    konusmalar[0]?.digerId ||
    "";

  const secili = konusmalar.find((k) => k.digerId === seciliId) ?? null;
  const seciliMesajlar: MesajGorunum[] = seciliId
    ? tumMesajlar
        .filter(
          (x) =>
            (x.gonderenId === kim.id && x.aliciId === seciliId) ||
            (x.gonderenId === seciliId && x.aliciId === kim.id)
        )
        .map((x) => ({ id: x.id, benden: x.gonderenId === kim.id, govde: x.govde, zaman: zamanStr(x.tarih) }))
    : [];

  return (
    <MesajPaneli
      konusmalar={konusmalar}
      seciliId={seciliId}
      secili={secili}
      mesajlar={seciliMesajlar}
      okunmamisVar={(secili?.okunmamis ?? 0) > 0}
    />
  );
}
