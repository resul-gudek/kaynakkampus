/* ═══════════════════════════════════════════════════════════════
   Veli ilerleme raporu — yalnız sunucu tarafında kullanılır.

   Öğrencinin özet verilerini (hesap.ts saf fonksiyonlarıyla) toplayıp
   "veli-rapor" şablonuyla veliye e-posta kuyruklar. İki tetikleyici:
   1. Koç manuel gönderir (src/actions/veli.ts → veliRaporGonder),
   2. Mail Ayarları'nda otomatik veli raporu açıksa, mail işleyicisi
      haftada bir kez (hafta başı anahtarıyla, tekrarsız) kuyruklar.
   ═══════════════════════════════════════════════════════════════ */

import { prisma } from "@/lib/prisma";
import {
  ogrenciOzet,
  ozelDersOzet,
  profilAyristir,
  tarihStr,
  xpOzet,
  zayifKonular,
} from "@/lib/hesap";
import { mailAyarGetir, mailKuyrukla } from "@/lib/mail";
import { logcu } from "@/lib/log";

const log = logcu("veli-rapor");

/** İçinde bulunulan haftanın Pazartesi'sinin ISO tarihi (tekrar koruması anahtarı). */
export function haftaBasi(d: Date = new Date()): string {
  const g = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const gun = g.getUTCDay(); // 0=Pazar … 6=Cumartesi
  const pazartesiyeKadar = (gun + 6) % 7; // Pazartesi'ye kaç gün geri
  g.setUTCDate(g.getUTCDate() - pazartesiyeKadar);
  return g.toISOString().slice(0, 10);
}

/** Rapor için gerekli öğrenci + ilişkileri (veli, koç, tüm ilerleme kayıtları). */
const RAPOR_ICLUDE = {
  koc: { select: { ad: true } },
  veli: { select: { id: true, ad: true, eposta: true } },
  odevlerOgrenci: { select: { durum: true } },
  takipOgrenci: { select: { tamamlandi: true } },
  denemeler: { include: { dersler: true }, orderBy: { tarih: "asc" } },
  yolOgrenci: { orderBy: { sira: "asc" } },
  ozelDersOgrenci: true,
} as const;

type RaporOgrenci = NonNullable<
  Awaited<ReturnType<typeof ogrenciRaporVerisiGetir>>
>;

async function ogrenciRaporVerisiGetir(ogrenciId: string) {
  return prisma.kullanici.findUnique({
    where: { id: ogrenciId },
    include: RAPOR_ICLUDE,
  });
}

/** Öğrenci kaydından "veli-rapor" şablonu değişkenlerini üretir. */
export function veliRaporDegiskenleri(ogrenci: RaporOgrenci, donem: string): Record<string, string> {
  const profil = profilAyristir(ogrenci.profil);
  const oz = ogrenciOzet(
    ogrenci.odevlerOgrenci,
    ogrenci.takipOgrenci,
    ogrenci.denemeler,
    ogrenci.yolOgrenci
  );
  const yolOz = xpOzet(ogrenci.yolOgrenci);
  const ozelOz = ozelDersOzet(
    ogrenci.ozelDersOgrenci.map((x) => ({
      id: x.id, ders: x.ders, konu: x.konu, tarih: x.tarih, saat: x.saat,
      sure: x.sure, ucret: x.ucret, odendi: x.odendi, durum: x.durum, olusturan: x.olusturan,
    }))
  );
  const zayif = zayifKonular(ogrenci.denemeler, profil).slice(0, 3);

  const netMetin =
    oz.sonNet === null
      ? "Henüz deneme sonucu yok"
      : `${oz.sonNet}${oz.netFarki !== null ? ` (${oz.netFarki >= 0 ? "+" : ""}${oz.netFarki})` : ""}`;

  const sonraki = ozelOz.sonraki;
  return {
    veliAd: ogrenci.veli?.ad ?? "Velimiz",
    ogrenciAd: ogrenci.ad,
    koc: ogrenci.koc?.ad ?? "—",
    donem,
    odev: `${oz.odevTamam}/${oz.odevToplam} · %${oz.odevYuzde}`,
    takip: `${oz.takipTamam}/${oz.takipToplam} · %${oz.takipYuzde}`,
    sonNet: netMetin,
    seviye: `Seviye ${yolOz.seviye} · ${yolOz.xp} XP · %${yolOz.yuzde}`,
    zayif: zayif.length ? zayif.map((z) => `${z.ders} – ${z.konu}`).join(", ") : "Öne çıkan zayıf konu yok 🎉",
    sonrakiDers: sonraki
      ? `${sonraki.ders}${sonraki.konu ? " – " + sonraki.konu : ""} · ${tarihStr(sonraki.tarih)}${sonraki.saat ? " " + sonraki.saat : ""}`
      : "Planlanmış özel ders yok",
    panelAdresi: process.env.UYGULAMA_URL ?? "http://localhost:37337",
  };
}

/** Tek bir öğrenci için veli raporunu kuyruklar. Veli/e-posta yoksa sessizce false döner.
    refId verilirse (haftalık otomatik) aynı hafta ikinci kez kuyruklanmaz. */
export async function veliRaporuKuyrukla(
  ogrenciId: string,
  opts: { donem: string; refId?: string } = { donem: "bu hafta" }
): Promise<boolean> {
  const ogrenci = await ogrenciRaporVerisiGetir(ogrenciId);
  if (!ogrenci || ogrenci.rol !== "ogrenci") return false;
  if (!ogrenci.veli || !ogrenci.veli.eposta) return false;

  return mailKuyrukla({
    sablonAnahtar: "veli-rapor",
    alici: ogrenci.veli.eposta,
    aliciAd: ogrenci.veli.ad,
    degiskenler: veliRaporDegiskenleri(ogrenci, opts.donem),
    refTur: "veli-rapor",
    refId: opts.refId,
  });
}

/** Otomatik haftalık raporlar: veli raporu açıkken, velisi + e-postası olan
    her öğrenci için hafta başı anahtarıyla (tekrarsız) rapor kuyruklar.
    Mail işleyicisi her turda çağırır. */
export async function veliRaporlariKuyrukla(): Promise<number> {
  const ayar = await mailAyarGetir();
  if (!ayar.aktif || !ayar.veliRaporAktif) return 0;

  const hafta = haftaBasi();
  const ogrenciler = await prisma.kullanici.findMany({
    where: { rol: "ogrenci", aktif: true, veli: { is: { aktif: true, eposta: { not: "" } } } },
    select: { id: true },
  });

  let sayi = 0;
  for (const o of ogrenciler) {
    const eklendi = await veliRaporuKuyrukla(o.id, {
      donem: "bu hafta",
      refId: `${o.id}|${hafta}`,
    });
    if (eklendi) sayi++;
  }
  if (sayi) log.info({ sayi, hafta }, "veli raporları kuyruklandı");
  return sayi;
}
