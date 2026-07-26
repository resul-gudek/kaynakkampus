import type { DosyaAlani } from "@/lib/basvuru-dosya-tanim";

/* Veri-güdümlü başvuru formu tanımları. Üç form da aynı sihirbaz
   bileşeni (BasvuruSihirbazi) tarafından render edilir. */

export type AlanTipi =
  | "metin"
  | "cokMetin"
  | "tel"
  | "eposta"
  | "sayi"
  | "yil"
  | "secim"
  | "cokSecim" // onay kutusu grubu → string[]
  | "onay" // tek onay kutusu → boolean
  | "url"
  | "dosya";

export interface Alan {
  ad: string;
  etiket: string;
  tip: AlanTipi;
  zorunlu?: boolean;
  secenekler?: readonly string[]; // secim / cokSecim
  gruplar?: { baslik: string; secenekler: readonly string[] }[]; // gruplu cokSecim
  ipucu?: string;
  placeholder?: string;
  dosyaAlani?: DosyaAlani; // tip === "dosya"
  coklu?: boolean; // dosya çoklu
  tamGenislik?: boolean; // grid'de tam satır
  /** deger'e göre koşullu görünürlük (örn. veli alanları) */
  gorunur?: (deger: Record<string, unknown>) => boolean;
}

export interface Adim {
  baslik: string;
  aciklama?: string;
  alanlar: Alan[];
}

export interface FormTanimi {
  tur: "ogretmen" | "ogrenci" | "koc";
  baslik: string;
  adimlar: Adim[];
}
