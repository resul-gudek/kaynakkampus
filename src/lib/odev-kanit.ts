/* Ödev tamamlama kanıtı (çözüm/defter fotoğrafı) tanımları —
   istemci-güvenli (node importu YOK). Saklama: dosya-saklama.ts */

import { grupAccept, type DosyaGrubu } from "./dosya-tanim";

/** Kanıt yalnız görsel olabilir; öğrenci defter/çözüm fotoğrafı yükler. */
export const KANIT_GRUPLARI: readonly DosyaGrubu[] = ["image"];

/** input[accept] değeri (örn. ".jpg,.png,.webp") */
export const KANIT_ACCEPT = grupAccept(KANIT_GRUPLARI);

/** Bir ödeve eklenebilecek azami fotoğraf sayısı */
export const MAX_KANIT = 5;

/** Kanıt dosyalarının saklama köküne göreli klasörü (traversal kontrolü
    dosya-saklama.dosyaMutlakYol'da yapılır) */
export function kanitKlasoru(odevId: string): string {
  return `odev/${odevId}`;
}

/** Görsel servis adresi — gerçek disk yolu istemciye asla gitmez */
export function kanitUrl(kanitId: string): string {
  return `/api/odev/kanit/${kanitId}`;
}
