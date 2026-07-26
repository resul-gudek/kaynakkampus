/* Başvuru dosya alanı tanımları — istemci-güvenli (node importu YOK).
   Hem form render'ı (istemci) hem sunucu doğrulaması bu tanımları kullanır.
   Tür/boyut beyaz listeleri ortak modülde: dosya-tanim.ts */

import { grupAccept, type DosyaGrubu } from "./dosya-tanim";

export * from "./dosya-tanim";

/** Form dosya alanları. */
export const DOSYA_ALANLARI = {
  profil: { etiket: "Profil fotoğrafı", gruplar: ["image"] as DosyaGrubu[], coklu: false, max: 1 },
  ozgecmis: { etiket: "Özgeçmiş (CV)", gruplar: ["doc"] as DosyaGrubu[], coklu: false, max: 1 },
  diploma: { etiket: "Diploma", gruplar: ["doc", "image"] as DosyaGrubu[], coklu: false, max: 1 },
  sertifika: { etiket: "Sertifika", gruplar: ["doc", "image"] as DosyaGrubu[], coklu: true, max: 5 },
  ek: { etiket: "Ek belge", gruplar: ["doc", "image"] as DosyaGrubu[], coklu: true, max: 5 },
} as const;

export type DosyaAlani = keyof typeof DOSYA_ALANLARI;

export function gecerliDosyaAlani(alan: string): alan is DosyaAlani {
  return Object.prototype.hasOwnProperty.call(DOSYA_ALANLARI, alan);
}

/** İstemci input'u için accept özniteliği (örn. ".pdf,.doc,.docx,.jpg,.png") */
export function alanAccept(alan: DosyaAlani): string {
  return grupAccept(DOSYA_ALANLARI[alan].gruplar);
}
