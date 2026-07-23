/* ═══════════════════════════════════════════════════════════════
   E-posta altyapısı — yalnız sunucu tarafında kullanılır.

   Üç katman:
   1. Ayar    : MailAyar tablosundaki tek satır (id=1). Admin panelinden
                yönetilir; `aktif` kapalıyken kuyruklama ve gönderim durur.
   2. Şablon  : MailSablon tablosu; {{degisken}} yer tutucuları gönderim
                sırasında değil KUYRUKLAMA sırasında doldurulur (kuyruk
                satırı kendi kendine yeterlidir).
   3. Kuyruk  : MailKuyruk tablosu; mailler doğrudan gönderilmez, önce
                kuyruğa yazılır. src/lib/mail-isleyici.ts periyodik olarak
                bekleyenleri gönderir, hata alırsa artan gecikmeyle
                (deneme × 5 dk) MAX_DENEME kez tekrar dener.

   Tekrar koruması: refTur+refId verilen mailler (hoş geldin, ders
   hatırlatma) aynı kaynak için ikinci kez kuyruklanmaz.
   ═══════════════════════════════════════════════════════════════ */

import nodemailer from "nodemailer";
import type { MailAyar } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isoTarih, tarihNesnesi, tarihStr, gunKaydir } from "@/lib/hesap";
import { VARSAYILAN_SABLONLAR } from "@/lib/mail-sablonlari";
import { logcu } from "@/lib/log";

const log = logcu("mail");

/** Gönderim başına azami deneme; aşılırsa satır "hata" durumuna düşer. */
export const MAX_DENEME = 3;

/* ── Ayar ──────────────────────────────────────────────────── */

/** Tek satırlık mail ayarını getirir; yoksa varsayılanlarla oluşturur. */
export async function mailAyarGetir(): Promise<MailAyar> {
  const mevcut = await prisma.mailAyar.findUnique({ where: { id: 1 } });
  if (mevcut) return mevcut;
  try {
    return await prisma.mailAyar.create({ data: { id: 1 } });
  } catch {
    // eşzamanlı ilk erişim yarışı: satırı bir başkası oluşturdu
    return (await prisma.mailAyar.findUniqueOrThrow({ where: { id: 1 } }));
  }
}

/** Ayarlar gönderime elverişli mi? (aktif + sunucu + gönderen adresi) */
export function mailGonderilebilir(ayar: MailAyar): boolean {
  return ayar.aktif && !!ayar.sunucu && !!ayar.gonderenAdres;
}

/* ── Şablon ────────────────────────────────────────────────── */

/** Eksik varsayılan şablonları oluşturur (idempotent). */
export async function sablonlariHazirla(): Promise<void> {
  for (const s of VARSAYILAN_SABLONLAR) {
    const var_ = await prisma.mailSablon.findUnique({ where: { anahtar: s.anahtar } });
    if (!var_) {
      await prisma.mailSablon
        .create({ data: { anahtar: s.anahtar, ad: s.ad, konu: s.konu, govde: s.govde } })
        .catch(() => undefined); // yarış: aynı anda oluşturulduysa sorun değil
    }
  }
}

function htmlKacis(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** {{degisken}} yer tutucularını doldurur; html=true ise değerler kaçışlanır. */
export function sablonDoldur(
  metin: string,
  degiskenler: Record<string, string>,
  html = false
): string {
  return metin.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, anahtar: string) => {
    const deger = degiskenler[anahtar] ?? "";
    return html ? htmlKacis(deger) : deger;
  });
}

/** HTML gövdeden düz metin üretir (mail istemcileri için text alternatifi). */
export function htmlMetne(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|tr|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ── Kuyruklama ────────────────────────────────────────────── */

export interface KuyrukGirdi {
  sablonAnahtar: string;
  alici: string;
  aliciAd?: string;
  degiskenler: Record<string, string>;
  /** Verilirse aynı (şablon, refTur, refId) için ikinci kez kuyruklanmaz. */
  refTur?: string;
  refId?: string;
  /** Bu tarihten önce gönderilmez (varsayılan: hemen). */
  planlanan?: Date;
}

/** Şablonu doldurup maili kuyruğa ekler. Eklendiyse true döner.
    Mail sistemi kapalıysa, şablon pasifse ya da tekrar koruması
    devredeyse sessizce false döner; asla fırlatmaz (mail, ana işlemi
    — kullanıcı ekleme vb. — düşürmemeli). */
export async function mailKuyrukla(girdi: KuyrukGirdi): Promise<boolean> {
  try {
    const alici = girdi.alici.trim();
    if (!alici) return false;

    const ayar = await mailAyarGetir();
    if (!ayar.aktif) return false;

    let sablon = await prisma.mailSablon.findUnique({ where: { anahtar: girdi.sablonAnahtar } });
    if (!sablon) {
      await sablonlariHazirla();
      sablon = await prisma.mailSablon.findUnique({ where: { anahtar: girdi.sablonAnahtar } });
    }
    if (!sablon || !sablon.aktif) return false;

    if (girdi.refTur && girdi.refId) {
      const mevcut = await prisma.mailKuyruk.findFirst({
        where: { sablon: sablon.anahtar, refTur: girdi.refTur, refId: girdi.refId },
        select: { id: true },
      });
      if (mevcut) return false;
    }

    await prisma.mailKuyruk.create({
      data: {
        alici,
        aliciAd: girdi.aliciAd ?? "",
        konu: sablonDoldur(sablon.konu, girdi.degiskenler),
        govde: sablonDoldur(sablon.govde, girdi.degiskenler, true),
        sablon: sablon.anahtar,
        refTur: girdi.refTur ?? "",
        refId: girdi.refId ?? "",
        planlanan: girdi.planlanan ?? new Date(),
      },
    });
    log.info({ sablon: sablon.anahtar, alici, refId: girdi.refId }, "mail kuyruğa eklendi");
    return true;
  } catch (e) {
    log.error(
      { sablon: girdi.sablonAnahtar, alici: girdi.alici, hata: e instanceof Error ? e.message : String(e) },
      "mail kuyruklama hatası"
    );
    return false;
  }
}

const ROL_METNI: Record<string, string> = { admin: "Yönetici", koc: "Koç", ogrenci: "Öğrenci" };

/** Yeni kullanıcı oluşturulduğunda hoş geldin mailini kuyruklar. */
export async function hosgeldinMailiKuyrukla(kullanici: {
  id: string;
  ad: string;
  kullanici: string;
  eposta: string;
  rol: string;
}): Promise<boolean> {
  if (!kullanici.eposta) return false;
  return mailKuyrukla({
    sablonAnahtar: "hosgeldin",
    alici: kullanici.eposta,
    aliciAd: kullanici.ad,
    degiskenler: {
      ad: kullanici.ad,
      kullanici: kullanici.kullanici,
      rol: ROL_METNI[kullanici.rol] ?? kullanici.rol,
      panelAdresi: process.env.UYGULAMA_URL ?? "http://localhost:37337",
    },
    refTur: "kullanici",
    refId: kullanici.id,
  });
}

/* ── Ders hatırlatmaları ───────────────────────────────────── */

/** OzelDers.tarih (UTC gece yarısı) + saat dizgesini gerçek ders anına çevirir.
    Saatler İstanbul yereli kabul edilir (TR'de yaz saati uygulanmıyor → sabit +03:00). */
function dersZamani(tarih: Date, saat: string): Date {
  return new Date(isoTarih(tarih) + "T" + (saat || "09:00") + ":00+03:00");
}

/** Gönderim penceresine girmiş (ders anına `hatirlatmaSaat`ten az kalmış)
    planlı özel dersler için öğrenciye hatırlatma maili kuyruklar.
    Worker her turda çağırır; tekrar koruması refTur/refId iledir ve
    refId ders tarih-saatini içerir → ders ertelenirse yeni hatırlatma çıkar. */
export async function dersHatirlatmalariKuyrukla(): Promise<number> {
  const ayar = await mailAyarGetir();
  if (!ayar.aktif) return 0;

  const simdi = new Date();
  const gunUfku = Math.ceil(ayar.hatirlatmaSaat / 24) + 1;
  const dersler = await prisma.ozelDers.findMany({
    where: {
      durum: "planlandi",
      tarih: { gte: tarihNesnesi(gunKaydir(0)), lte: tarihNesnesi(gunKaydir(gunUfku)) },
      ogrenci: { aktif: true, eposta: { not: "" } },
    },
    select: {
      id: true,
      ders: true,
      konu: true,
      tarih: true,
      saat: true,
      sure: true,
      ogrenci: { select: { ad: true, eposta: true } },
      koc: { select: { ad: true } },
    },
  });

  let sayi = 0;
  for (const d of dersler) {
    const zaman = dersZamani(d.tarih, d.saat);
    if (zaman <= simdi) continue; // geçmiş ders
    const gonderAni = zaman.getTime() - ayar.hatirlatmaSaat * 3_600_000;
    if (gonderAni > simdi.getTime()) continue; // henüz erken

    const eklendi = await mailKuyrukla({
      sablonAnahtar: "ders-hatirlatma",
      alici: d.ogrenci.eposta,
      aliciAd: d.ogrenci.ad,
      degiskenler: {
        ad: d.ogrenci.ad,
        ders: d.ders,
        konu: d.konu || "—",
        tarih: tarihStr(d.tarih),
        saat: d.saat || "—",
        sure: String(d.sure),
        koc: d.koc.ad,
      },
      refTur: "ozelders",
      refId: `${d.id}|${isoTarih(d.tarih)}|${d.saat}`,
    });
    if (eklendi) sayi++;
  }
  if (sayi) log.info({ sayi }, "ders hatırlatmaları kuyruklandı");
  return sayi;
}

/* ── Gönderim ──────────────────────────────────────────────── */

function tasiyiciOlustur(ayar: MailAyar) {
  return nodemailer.createTransport({
    host: ayar.sunucu,
    port: ayar.port,
    secure: ayar.guvenli,
    auth: ayar.kullaniciAdi ? { user: ayar.kullaniciAdi, pass: ayar.sifre } : undefined,
  });
}

function gonderenBasligi(ayar: MailAyar): string {
  return ayar.gonderenAd
    ? `"${ayar.gonderenAd.replace(/"/g, "'")}" <${ayar.gonderenAdres}>`
    : ayar.gonderenAdres;
}

let kuyrukIsleniyor = false;

/** Bekleyen kuyruğu işler (worker ve admin "şimdi işle" butonu çağırır).
    Eşzamanlı iki işleme turuna karşı süreç içi kilit kullanır. */
export async function kuyrukIsle(): Promise<{ gonderilen: number; hatali: number }> {
  if (kuyrukIsleniyor) return { gonderilen: 0, hatali: 0 };
  kuyrukIsleniyor = true;
  try {
    const ayar = await mailAyarGetir();
    if (!mailGonderilebilir(ayar)) return { gonderilen: 0, hatali: 0 };

    const bekleyenler = await prisma.mailKuyruk.findMany({
      where: { durum: "bekliyor", planlanan: { lte: new Date() } },
      orderBy: { planlanan: "asc" },
      take: 20, // tur başına tavan; kalanlar sonraki turda
    });
    if (!bekleyenler.length) return { gonderilen: 0, hatali: 0 };

    const tasiyici = tasiyiciOlustur(ayar);
    let gonderilen = 0;
    let hatali = 0;

    for (const m of bekleyenler) {
      try {
        await tasiyici.sendMail({
          from: gonderenBasligi(ayar),
          to: m.aliciAd ? `"${m.aliciAd.replace(/"/g, "'")}" <${m.alici}>` : m.alici,
          subject: m.konu,
          html: m.govde,
          text: htmlMetne(m.govde),
        });
        await prisma.mailKuyruk.update({
          where: { id: m.id },
          data: { durum: "gonderildi", gonderim: new Date(), sonHata: "" },
        });
        gonderilen++;
        log.info({ id: m.id, alici: m.alici, sablon: m.sablon }, "mail gönderildi");
      } catch (e) {
        const deneme = m.deneme + 1;
        const kalici = deneme >= MAX_DENEME;
        await prisma.mailKuyruk.update({
          where: { id: m.id },
          data: {
            deneme,
            sonHata: (e instanceof Error ? e.message : String(e)).slice(0, 2000),
            durum: kalici ? "hata" : "bekliyor",
            planlanan: new Date(Date.now() + deneme * 5 * 60_000), // artan gecikme
          },
        });
        hatali++;
        log.warn(
          { id: m.id, alici: m.alici, deneme, kalici, hata: e instanceof Error ? e.message : String(e) },
          "mail gönderim hatası"
        );
      }
    }
    return { gonderilen, hatali };
  } finally {
    kuyrukIsleniyor = false;
  }
}

/** Kayıtlı ayarlarla doğrudan (kuyruksuz) test maili gönderir. */
export async function testMailGonder(alici: string): Promise<{ tamam?: boolean; hata?: string }> {
  const ayar = await mailAyarGetir();
  if (!ayar.sunucu || !ayar.gonderenAdres)
    return { hata: "Önce SMTP sunucusu ve gönderen adresini kaydedin." };
  try {
    await tasiyiciOlustur(ayar).sendMail({
      from: gonderenBasligi(ayar),
      to: alici,
      subject: "Kaynak Akademi — Test Maili ✅",
      html: `<p>Merhaba,</p><p>Bu bir test mailidir. SMTP ayarlarınız doğru çalışıyor. 🎉</p>`,
      text: "Merhaba,\n\nBu bir test mailidir. SMTP ayarlarınız doğru çalışıyor.",
    });
    log.info({ alici }, "test maili gönderildi");
    return { tamam: true };
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : String(e);
    log.warn({ alici, hata: mesaj }, "test maili gönderilemedi");
    return { hata: "Gönderilemedi: " + mesaj };
  }
}
