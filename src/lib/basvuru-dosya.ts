/* ═══════════════════════════════════════════════════════════════
   Başvuru belge saklama — ortak dosya-saklama katmanının başvuruya
   özel sarmalayıcısı. Alan tanımları: basvuru-dosya-tanim.ts
   Güvenlik kuralları ve saklama kökü: dosya-saklama.ts
   ═══════════════════════════════════════════════════════════════ */

import path from "node:path";
import { dosyaSakla, klasorSil, type SaklananDosya } from "./dosya-saklama";
import { DOSYA_ALANLARI, type DosyaAlani } from "./basvuru-dosya-tanim";

export * from "./basvuru-dosya-tanim";
export * from "./dosya-saklama";

export interface DosyaKaydi extends SaklananDosya {
  alan: DosyaAlani;
}

/** Başvuru belgelerinin saklama köküne göreli klasörü */
function basvuruKlasoru(basvuruId: string): string {
  return path.posix.join("basvuru", basvuruId);
}

/** Tek bir başvuru belgesini doğrulayıp diske kaydeder. Hata durumunda fırlatır. */
export async function dosyaKaydet(
  basvuruId: string,
  alan: DosyaAlani,
  file: File
): Promise<DosyaKaydi> {
  const kayit = await dosyaSakla(
    basvuruKlasoru(basvuruId),
    alan,
    file,
    DOSYA_ALANLARI[alan].gruplar
  );
  return { alan, ...kayit };
}

/** Bir başvuruya ait tüm yüklenmiş dosya klasörünü siler (rollback / temizlik). */
export async function basvuruDosyalariniSil(basvuruId: string): Promise<void> {
  await klasorSil(basvuruKlasoru(basvuruId));
}
