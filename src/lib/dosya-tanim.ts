/* Yüklenen dosyalar için ortak tür/boyut beyaz listeleri — istemci-güvenli
   (node importu YOK). Hem form render'ı (istemci) hem sunucu doğrulaması
   bu tanımlardan beslenir. Saklama tarafı: dosya-saklama.ts */

export const MAX_DOSYA_BOYUT = 10 * 1024 * 1024; // 10 MB

/** Video dosyaları (ders videosu) için ayrı tavan — bu dosyalar server
    action'dan DEĞİL, akış yapan yükleme rotasından geçer
    (bkz. /api/video-ders/[id]/yukle), o yüzden MAX_DOSYA_BOYUT'a tabi değildir. */
export const MAX_VIDEO_BOYUT = 512 * 1024 * 1024; // 512 MB

/** İzin verilen MIME → uzantı eşlemesi (grup bazlı) */
export const IZINLI_TURLER: Record<"image" | "doc" | "video", Record<string, string>> = {
  image: {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  },
  doc: {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  },
  // Yalnız tarayıcıda doğrudan oynatılabilen kapsayıcılar; .mov/.avi gibi
  // türler kabul edilmez (öğrencinin tarayıcısında açılmayabilir).
  video: {
    "video/mp4": "mp4",
    "video/webm": "webm",
  },
};

/** Uzantı beyaz listesi (MIME'e ek ikinci kontrol) */
export const IZINLI_UZANTILAR = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "pdf",
  "doc",
  "docx",
  "mp4",
  "webm",
]);

export type DosyaGrubu = "image" | "doc" | "video";

/** İstemci input'u için accept özniteliği (örn. ".jpg,.png,.webp") */
export function grupAccept(gruplar: readonly DosyaGrubu[]): string {
  const uzantilar = gruplar.flatMap((g) => Object.values(IZINLI_TURLER[g]).map((u) => "." + u));
  return Array.from(new Set(uzantilar)).join(",");
}
