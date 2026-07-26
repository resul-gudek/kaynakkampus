/* Öğrenci paneli bileşenlerinin ortak satır tipleri.
   Sunucu bileşeni Prisma satırlarını olduğu gibi geçirir
   (RSC serileştirmesi Date destekler); tipler Prisma'dan türetilir. */

import type { Deneme, DenemeDers, Odev, OzelDers, Takip, YolAdimi } from "@prisma/client";

export type OdevKaydi = Odev;
/** Ödev listesi satırı — tamamlama kanıtı fotoğrafları da gelir */
export type KanitS = { id: string; ad: string };
export type OdevListeKaydi = Odev & { kanitlar: KanitS[] };
export type TakipKaydi = Takip;
export type YolKaydi = YolAdimi;
export type OzelDersKaydi = OzelDers;
export type DenemeKaydi = Deneme & { dersler: DenemeDers[] };

/** "a, b, c" → ["a","b","c"] (legacy konulariAyir) */
export function konulariAyir(s: string): string[] {
  return String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
