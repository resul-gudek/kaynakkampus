/* ═══════════════════════════════════════════════════════════════
   Ortak dosya saklama — public DIŞI dizine güvenli dosya kaydı (sunucu).
   Tür/boyut beyaz listeleri istemci-güvenli modülde: dosya-tanim.ts

   Güvenlik kuralları:
   • Beyaz liste: yalnız izin verilen uzantı + MIME birlikte kabul edilir
     (çalıştırılabilir/script dosyalar reddedilir).
   • Boyut sınırı (MAX_DOSYA_BOYUT).
   • Dosya adı rastgele üretilir; orijinal ad yalnız görüntüleme için
     DB'de saklanır, diske YAZILMAZ.
   • Saklanan `yol` köke görelidir; gerçek disk yolu istemciye gitmez.

   Kalıcı disk gereklidir. Yayın ortamı geçici FS ise YUKLEME_DIZINI
   kalıcı bir birime işaret etmelidir (aksi halde dosyalar kaybolur).
   ═══════════════════════════════════════════════════════════════ */

import { randomBytes } from "node:crypto";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import {
  IZINLI_TURLER,
  IZINLI_UZANTILAR,
  MAX_DOSYA_BOYUT,
  type DosyaGrubu,
} from "./dosya-tanim";

export interface SaklananDosya {
  ad: string; // orijinal (temizlenmiş) dosya adı — görüntüleme için
  yol: string; // saklama köküne göreli yol
  tur: string; // MIME
  boyut: number;
}

/** Saklama kök dizini (mutlak). Public dizinin DIŞINDA olmalıdır.
    BASVURU_YUKLEME_DIZINI eski addır; geriye dönük uyumluluk için okunur. */
export function saklamaKoku(): string {
  const yapilandirma = (
    process.env.YUKLEME_DIZINI ?? process.env.BASVURU_YUKLEME_DIZINI
  )?.trim();
  const kok = yapilandirma && yapilandirma.length > 0 ? yapilandirma : "veri-yukleme";
  return path.isAbsolute(kok) ? kok : path.join(process.cwd(), kok);
}

/** Göreli saklama yolunu güvenle mutlak yola çevirir (path traversal koruması). */
export function dosyaMutlakYol(goreliYol: string): string {
  const kok = path.resolve(saklamaKoku());
  const hedef = path.resolve(kok, goreliYol);
  if (hedef !== kok && !hedef.startsWith(kok + path.sep)) {
    throw new Error("Geçersiz dosya yolu.");
  }
  return hedef;
}

/** Orijinal adı görüntüleme için temizler (yol/tehlikeli karakterler atılır) */
export function adTemizle(ad: string): string {
  return (
    path
      .basename(String(ad || "belge"))
      .replace(/[^\p{L}\p{N}._ -]+/gu, "_")
      .slice(0, 120) || "belge"
  );
}

/**
 * Tek bir dosyayı doğrulayıp diske kaydeder. Hata durumunda fırlatır.
 * @param goreliKlasor saklama köküne göreli hedef klasör (örn. "odev/<id>")
 * @param onEk üretilen dosya adının başına eklenen etiket (örn. "kanit")
 * @param gruplar kabul edilen tür grupları
 */
export async function dosyaSakla(
  goreliKlasor: string,
  onEk: string,
  file: File,
  gruplar: readonly DosyaGrubu[]
): Promise<SaklananDosya> {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Geçersiz dosya.");
  }
  if (file.size > MAX_DOSYA_BOYUT) {
    throw new Error(
      `"${adTemizle(file.name)}" çok büyük (en fazla ${Math.round(MAX_DOSYA_BOYUT / 1024 / 1024)} MB).`
    );
  }

  const mime = (file.type || "").toLowerCase();
  const grup = gruplar.find((g) => mime in IZINLI_TURLER[g]);
  if (!grup) {
    throw new Error(`"${adTemizle(file.name)}" için izin verilmeyen dosya türü.`);
  }

  const beklenenUzanti = IZINLI_TURLER[grup][mime];
  const gercekUzanti = path.extname(file.name).replace(".", "").toLowerCase();
  // MIME + uzantı birlikte doğrulanır; uzantı beyaz listede ve MIME ile uyumlu olmalı.
  const uzantiUyumlu =
    IZINLI_UZANTILAR.has(gercekUzanti) &&
    (gercekUzanti === beklenenUzanti ||
      (beklenenUzanti === "jpg" && (gercekUzanti === "jpg" || gercekUzanti === "jpeg")));
  if (!uzantiUyumlu) {
    throw new Error(`"${adTemizle(file.name)}" dosya uzantısı içeriğiyle uyuşmuyor.`);
  }

  const klasor = dosyaMutlakYol(goreliKlasor);
  await mkdir(klasor, { recursive: true });

  const rastgele = randomBytes(16).toString("hex");
  const dosyaAdi = `${onEk}-${rastgele}.${beklenenUzanti}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(klasor, dosyaAdi), buffer);

  return {
    ad: adTemizle(file.name),
    yol: path.posix.join(goreliKlasor, dosyaAdi),
    tur: mime,
    boyut: file.size,
  };
}

/** Tek dosyayı diskten siler (rollback / kayıt silme). Hata yutulur. */
export async function dosyaSil(goreliYol: string): Promise<void> {
  try {
    await rm(dosyaMutlakYol(goreliYol), { force: true });
  } catch {
    /* yolu geçersiz ya da dosya yok — sessizce geç */
  }
}

/** Bir kaydın tüm dosya klasörünü siler (rollback / temizlik). Hata yutulur. */
export async function klasorSil(goreliKlasor: string): Promise<void> {
  try {
    await rm(dosyaMutlakYol(goreliKlasor), { recursive: true, force: true });
  } catch {
    /* yolu geçersiz ya da klasör yok — sessizce geç */
  }
}
