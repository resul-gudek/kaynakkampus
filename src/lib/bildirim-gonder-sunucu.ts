import "server-only";

/* Elle bildirim gönderimi — sunucu tarafı (Prisma). Saf mantık için
   bkz. lib/bildirim-gonder.ts. */

import { prisma } from "@/lib/prisma";
import { egitmenMi } from "@/lib/sabitler";
import { ROL_ETIKETLERI } from "@/lib/navigasyon";
import { logcu } from "@/lib/log";
import {
  alicilariCoz,
  hedefOzeti,
  type AdayAlici,
  type BildirimGonderGirdi,
} from "@/lib/bildirim-gonder";

const log = logcu("bildirim-gonder");

/** Ekranda listelenen aday alıcı: kim olduğu bir bakışta anlaşılsın */
export interface AdayGorunum extends AdayAlici {
  rolEtiket: string;
  /** Öğrenci: sınıf · hedef; veli: çocuklarının adı; eğitmen: branş */
  altBilgi: string;
}

const ADAY_SELECT = {
  id: true,
  rol: true,
  ad: true,
  sinif: true,
  hedef: true,
  brans: true,
  cocuklar: { where: { aktif: true }, select: { ad: true }, orderBy: { ad: "asc" as const } },
} as const;

type AdaySatir = {
  id: string;
  rol: string;
  ad: string;
  sinif: string | null;
  hedef: string | null;
  brans: string | null;
  cocuklar: { ad: string }[];
};

function gorunum(k: AdaySatir): AdayGorunum {
  let altBilgi = "";
  if (k.rol === "ogrenci") altBilgi = [k.sinif, k.hedef].filter(Boolean).join(" · ");
  else if (k.rol === "veli") {
    altBilgi = k.cocuklar.length
      ? "Velisi: " + k.cocuklar.map((c) => c.ad).join(", ")
      : "Bağlı öğrenci yok";
  } else if (egitmenMi(k.rol)) altBilgi = k.brans ?? "";
  return {
    id: k.id,
    rol: k.rol,
    ad: k.ad,
    rolEtiket: ROL_ETIKETLERI[k.rol as keyof typeof ROL_ETIKETLERI] ?? k.rol,
    altBilgi,
  };
}

/** Gönderenin bildirim gönderebileceği aktif kullanıcılar.
    • admin: kendisi dışındaki herkes
    • eğitmen: koçluk ettiği + online sınıflarına üye öğrenciler ve velileri */
export async function adayAlicilar(kim: { id: string; rol: string }): Promise<AdayGorunum[]> {
  if (kim.rol === "admin") {
    const satirlar = await prisma.kullanici.findMany({
      where: { aktif: true, id: { not: kim.id } },
      orderBy: [{ rol: "asc" }, { ad: "asc" }],
      select: ADAY_SELECT,
    });
    return satirlar.map(gorunum);
  }
  if (!egitmenMi(kim.rol)) return [];

  const ogrenciler = await prisma.kullanici.findMany({
    where: {
      rol: "ogrenci",
      aktif: true,
      OR: [{ kocId: kim.id }, { sinifUyelikleri: { some: { sinif: { ogretmenId: kim.id } } } }],
    },
    orderBy: { ad: "asc" },
    select: { ...ADAY_SELECT, veliId: true },
  });
  const veliIdler = [...new Set(ogrenciler.map((o) => o.veliId).filter((v): v is string => !!v))];
  const veliler = veliIdler.length
    ? await prisma.kullanici.findMany({
        where: { id: { in: veliIdler }, rol: "veli", aktif: true },
        orderBy: { ad: "asc" },
        select: ADAY_SELECT,
      })
    : [];
  return [...ogrenciler.map(gorunum), ...veliler.map(gorunum)];
}

/** Alıcı başına tutulan bildirim tavanı (bildirimEkle ile aynı) */
const ALICI_TAVANI = 200;

export interface GonderimSonucu {
  gonderimId: string;
  aliciSayisi: number;
  hedefOzet: string;
}

/** Seçimi çözer, gönderim kaydını ve alıcı başına bildirim satırlarını tek
    transaction'da yazar. Cihaz push'u kuyruğa bırakılır (pushDurum=bekliyor,
    bkz. lib/push-kuyruk.ts) — commit dışında ağ işi yapılmaz. */
export async function bildirimGonderimiYap(
  kim: { id: string; rol: string },
  girdi: BildirimGonderGirdi
): Promise<GonderimSonucu> {
  const adaylar = await adayAlicilar(kim);
  const { alicilar, bilinmeyen, yetkisizGruplar } = alicilariCoz(adaylar, girdi, kim);

  if (yetkisizGruplar.length) throw new Error("Seçilen gruplardan bazılarına gönderim yetkiniz yok.");
  if (bilinmeyen.length) {
    throw new Error(
      bilinmeyen.length === 1
        ? "Seçilen kişilerden biri artık listenizde değil. Sayfayı yenileyip tekrar deneyin."
        : `Seçilen ${bilinmeyen.length} kişi artık listenizde değil. Sayfayı yenileyip tekrar deneyin.`
    );
  }
  if (!alicilar.length) throw new Error("Seçime uyan aktif alıcı bulunamadı.");

  const hedefOzet = hedefOzeti(girdi, kim.rol);

  const gonderim = await prisma.$transaction(async (tx) => {
    const g = await tx.bildirimGonderim.create({
      data: {
        gonderenId: kim.id,
        ikon: girdi.ikon,
        metin: girdi.metin,
        hedefOzet,
        aliciSayisi: alicilar.length,
      },
      select: { id: true },
    });
    await tx.bildirim.createMany({
      data: alicilar.map((a) => ({
        aliciId: a.id,
        ikon: girdi.ikon,
        metin: girdi.metin,
        hedefTur: "duyuru",
        gonderimId: g.id,
      })),
    });
    return g;
  });

  // Alıcı başına 200 tavanı — tek sorguda, en iyi çaba (başarısızlık gönderimi bozmaz)
  try {
    await prisma.$executeRaw`
      WITH s AS (
        SELECT b.id, ROW_NUMBER() OVER (PARTITION BY b.aliciId ORDER BY b.tarih DESC, b.id DESC) AS rn
        FROM [Bildirim] b
        WHERE b.aliciId IN (SELECT aliciId FROM [Bildirim] WHERE gonderimId = ${gonderim.id})
      )
      DELETE FROM [Bildirim] WHERE id IN (SELECT id FROM s WHERE rn > ${ALICI_TAVANI})`;
  } catch (e) {
    log.warn({ hata: e instanceof Error ? e.message : String(e) }, "bildirim tavanı budanamadı");
  }

  return { gonderimId: gonderim.id, aliciSayisi: alicilar.length, hedefOzet };
}

export interface GecmisSatiri {
  id: string;
  tarih: Date;
  gonderenAd: string;
  ikon: string;
  metin: string;
  hedefOzet: string;
  aliciSayisi: number;
  okunan: number;
}

/** Gönderim geçmişi: yönetici herkesinkini, eğitmen kendininkini görür. */
export async function gonderimGecmisi(
  kim: { id: string; rol: string },
  adet = 30
): Promise<GecmisSatiri[]> {
  const satirlar = await prisma.bildirimGonderim.findMany({
    where: kim.rol === "admin" ? undefined : { gonderenId: kim.id },
    orderBy: { tarih: "desc" },
    take: adet,
    include: { gonderen: { select: { ad: true } } },
  });
  if (!satirlar.length) return [];
  const okunanlar = await prisma.bildirim.groupBy({
    by: ["gonderimId"],
    where: { gonderimId: { in: satirlar.map((s) => s.id) }, okundu: true },
    _count: { _all: true },
  });
  const okunanHar = new Map(okunanlar.map((o) => [o.gonderimId, o._count._all]));
  return satirlar.map((s) => ({
    id: s.id,
    tarih: s.tarih,
    gonderenAd: s.gonderen.ad,
    ikon: s.ikon,
    metin: s.metin,
    hedefOzet: s.hedefOzet,
    aliciSayisi: s.aliciSayisi,
    okunan: okunanHar.get(s.id) ?? 0,
  }));
}
