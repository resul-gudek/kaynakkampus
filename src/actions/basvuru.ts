"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { logcu } from "@/lib/log";
import { basvuruDogrula } from "@/lib/dogrulama-basvuru";
import {
  DOSYA_ALANLARI,
  dosyaKaydet,
  basvuruDosyalariniSil,
  gecerliDosyaAlani,
  type DosyaAlani,
  type DosyaKaydi,
} from "@/lib/basvuru-dosya";
import { hizSiniriIzin } from "@/lib/rate-limit";
import { basvuruAlindiMailiKuyrukla } from "@/lib/basvuru-mail";

const log = logcu("basvuru");

export type BasvuruGonderSonuc = { hata?: string; token?: string };

const AZAMI_TOPLAM_DOSYA = 15;
// IP başına: saatte 5, dakikada 2 başvuru
const SAATLIK_SINIR = 5;
const DAKIKALIK_SINIR = 2;

async function istekIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() || "bilinmeyen";
}

function ilkZodHatasi(e: unknown): string | null {
  if (e && typeof e === "object" && "issues" in e) {
    const issues = (e as { issues: { message: string }[] }).issues;
    if (Array.isArray(issues) && issues.length) return issues[0].message;
  }
  return null;
}

/**
 * Public ön mülakat başvurusu. FormData şunları içerir:
 *  - tur: "ogretmen" | "ogrenci" | "koc"
 *  - veri: form yanıtlarının JSON dizesi
 *  - website: honeypot (boş olmalı)
 *  - dosya:<alan>: yüklenen belge dosyaları (opsiyonel, çoklu olabilir)
 *
 * Önce dosyalar diske yazılır, sonra DB kaydı transaction ile oluşturulur.
 * DB kaydı başarısız olursa diske yazılmış dosyalar temizlenir (sahipsiz
 * dosya kalmaz).
 */
export async function basvuruGonder(formData: FormData): Promise<BasvuruGonderSonuc> {
  // 1) Spam korumaları
  const ip = await istekIp();
  if (!hizSiniriIzin(`basvuru:dk:${ip}`, DAKIKALIK_SINIR, 60_000)) {
    return { hata: "Çok fazla deneme yaptınız. Lütfen biraz sonra tekrar deneyin." };
  }
  if (!hizSiniriIzin(`basvuru:sa:${ip}`, SAATLIK_SINIR, 3_600_000)) {
    return { hata: "Bu adresten çok fazla başvuru alındı. Lütfen daha sonra tekrar deneyin." };
  }
  // Honeypot: gerçek kullanıcı bu gizli alanı doldurmaz.
  if (String(formData.get("website") ?? "").trim() !== "") {
    log.warn({ ip }, "başvuru honeypot tetiklendi");
    return { hata: "Başvuru gönderilemedi." };
  }

  // 2) Doğrulama
  const tur = String(formData.get("tur") ?? "");
  let veriHam: unknown;
  try {
    veriHam = JSON.parse(String(formData.get("veri") ?? "{}"));
  } catch {
    return { hata: "Form verisi okunamadı." };
  }

  let dogrulanan: ReturnType<typeof basvuruDogrula>;
  try {
    dogrulanan = basvuruDogrula(tur, veriHam);
  } catch (e) {
    return { hata: ilkZodHatasi(e) ?? "Form bilgilerinde eksik veya hatalı alanlar var." };
  }

  // 3) Dosyaları topla ve diske yaz (DB'den önce; hata olursa temizlenir)
  const basvuruId = randomUUID();
  const kayitlar: DosyaKaydi[] = [];
  let toplamDosya = 0;
  try {
    for (const anahtar of Object.keys(DOSYA_ALANLARI) as DosyaAlani[]) {
      const girdiler = formData
        .getAll(`dosya:${anahtar}`)
        .filter((x): x is File => x instanceof File && x.size > 0);
      if (girdiler.length === 0) continue;
      if (!gecerliDosyaAlani(anahtar)) continue;
      const tanim = DOSYA_ALANLARI[anahtar];
      const secili = tanim.coklu ? girdiler.slice(0, tanim.max) : girdiler.slice(0, 1);
      for (const file of secili) {
        toplamDosya++;
        if (toplamDosya > AZAMI_TOPLAM_DOSYA) {
          throw new Error("Çok fazla dosya yüklediniz.");
        }
        kayitlar.push(await dosyaKaydet(basvuruId, anahtar, file));
      }
    }
  } catch (e) {
    await basvuruDosyalariniSil(basvuruId);
    return { hata: e instanceof Error ? e.message : "Dosya yüklenemedi." };
  }

  // 4) Kayıt — transaction; başarısız olursa diskteki dosyalar temizlenir.
  const takipToken = randomBytes(32).toString("base64url"); // ~43 karakter, kriptografik
  try {
    await prisma.$transaction(async (tx) => {
      await tx.basvuru.create({
        data: {
          id: basvuruId,
          tur: dogrulanan.tur,
          durum: "yeni",
          ad: dogrulanan.kart.ad,
          telefon: dogrulanan.kart.telefon,
          eposta: dogrulanan.kart.eposta,
          sehir: dogrulanan.kart.sehir,
          veri: JSON.stringify(dogrulanan.veri),
          takipToken,
        },
      });
      if (kayitlar.length) {
        await tx.basvuruDosya.createMany({
          data: kayitlar.map((d) => ({
            basvuruId,
            alan: d.alan,
            ad: d.ad,
            yol: d.yol,
            tur: d.tur,
            boyut: d.boyut,
          })),
        });
      }
    });
  } catch (e) {
    await basvuruDosyalariniSil(basvuruId);
    log.error({ hata: e instanceof Error ? e.message : String(e) }, "başvuru kaydı başarısız");
    return { hata: "Başvuru kaydedilemedi. Lütfen tekrar deneyin." };
  }

  log.info({ basvuruId, tur: dogrulanan.tur, dosya: kayitlar.length }, "yeni başvuru alındı");

  // 5) Bilgilendirme maili (opsiyonel; hata ana akışı etkilemez)
  await basvuruAlindiMailiKuyrukla({
    id: basvuruId,
    ad: dogrulanan.kart.ad,
    eposta: dogrulanan.kart.eposta,
    tur: dogrulanan.tur,
    takipToken,
  }).catch(() => {});

  return { token: takipToken };
}
