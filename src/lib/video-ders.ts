/* Video ders notları — istemci-güvenli tanımlar ve saf yardımcılar
   (node importu YOK). Saklama tarafı: dosya-saklama.ts,
   DB'ye dokunan yardımcılar ve erişim kuralları: video-ders-sunucu.ts. */

import { grupAccept, type DosyaGrubu } from "./dosya-tanim";
import type { VideoIzlemeDurum } from "./sabitler";

/** Kapak görseli yalnız görsel, ekler doküman + görsel olabilir */
export const KAPAK_GRUPLARI: readonly DosyaGrubu[] = ["image"];
export const EK_GRUPLARI: readonly DosyaGrubu[] = ["doc", "image"];
export const VIDEO_GRUPLARI: readonly DosyaGrubu[] = ["video"];

export const KAPAK_ACCEPT = grupAccept(KAPAK_GRUPLARI);
export const EK_ACCEPT = grupAccept(EK_GRUPLARI);
export const VIDEO_ACCEPT = grupAccept(VIDEO_GRUPLARI);

/** Bir videoya eklenebilecek azami doküman sayısı */
export const MAX_EK = 10;

/** Bu orandan sonra video "tamamlandı" sayılır (son saniyeler izlenmese de) */
export const TAMAMLANMA_ESIGI = 90;

/** Video dosyalarının saklama köküne göreli klasörü
    (traversal kontrolü dosya-saklama.dosyaMutlakYol'da yapılır) */
export function videoKlasoru(videoId: string): string {
  return `video-ders/${videoId}`;
}

/* ── Servis adresleri — gerçek disk yolu istemciye asla gitmez ── */

/** Yüklenmiş video dosyasının akış adresi (Range destekli) */
export function akisUrl(videoId: string): string {
  return `/api/video-ders/${videoId}/akis`;
}

export function kapakUrl(videoId: string): string {
  return `/api/video-ders/${videoId}/kapak`;
}

export function ekUrl(ekId: string): string {
  return `/api/video-ders/ek/${ekId}`;
}

/** Video dosyasının yükleneceği adres (kayıt oluşturulduktan sonra) */
export function yuklemeUrl(videoId: string): string {
  return `/api/video-ders/${videoId}/yukle`;
}

/* ── Kaynak çözümleme ────────────────────────────────────────
   Bağlantı türleri farklı oynatıcı gerektirir: YouTube/Vimeo iframe ile
   gömülür, doğrudan medya bağlantısı ve yüklenen dosya <video> ile oynar.
   Tanınmayan adres gömülmez (X-Frame-Options/CSP ile boş kare çıkmasın);
   öğrenciye "yeni sekmede aç" bağlantısı gösterilir. */

export type OynaticiTuru = "dosya" | "youtube" | "vimeo" | "harici" | "yok";

export interface VideoKaynagi {
  tur: OynaticiTuru;
  /** dosya → akış adresi, youtube/vimeo → gömme adresi, harici → ham adres */
  adres: string;
}

const YOUTUBE_KIMLIK = /^[\w-]{11}$/;

/** YouTube video kimliğini bilinen adres biçimlerinden çıkarır */
function youtubeKimligi(u: URL): string | null {
  const alan = u.hostname.replace(/^www\./, "");
  if (alan === "youtu.be") {
    const k = u.pathname.slice(1).split("/")[0];
    return YOUTUBE_KIMLIK.test(k) ? k : null;
  }
  if (alan !== "youtube.com" && alan !== "m.youtube.com" && alan !== "youtube-nocookie.com") {
    return null;
  }
  const izle = u.searchParams.get("v");
  if (izle && YOUTUBE_KIMLIK.test(izle)) return izle;
  // /embed/<id> · /shorts/<id> · /live/<id>
  const parca = u.pathname.split("/").filter(Boolean);
  if (parca.length >= 2 && ["embed", "shorts", "live", "v"].includes(parca[0])) {
    return YOUTUBE_KIMLIK.test(parca[1]) ? parca[1] : null;
  }
  return null;
}

/** Vimeo video kimliği (yalnız sayısal) */
function vimeoKimligi(u: URL): string | null {
  const alan = u.hostname.replace(/^www\./, "");
  if (alan !== "vimeo.com" && alan !== "player.vimeo.com") return null;
  const sayi = u.pathname.split("/").filter(Boolean).find((p) => /^\d+$/.test(p));
  return sayi ?? null;
}

/** Kaydın kaynak alanlarından oynatıcı için kullanılacak adresi üretir */
export function videoKaynagi(video: {
  id: string;
  kaynakTur: string;
  adres: string;
  dosyaYol?: string | null;
}): VideoKaynagi {
  if (video.kaynakTur === "dosya") {
    return video.dosyaYol ? { tur: "dosya", adres: akisUrl(video.id) } : { tur: "yok", adres: "" };
  }
  const ham = (video.adres || "").trim();
  if (!ham) return { tur: "yok", adres: "" };

  let u: URL;
  try {
    u = new URL(ham);
  } catch {
    return { tur: "yok", adres: "" };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return { tur: "yok", adres: "" };

  const yt = youtubeKimligi(u);
  if (yt) {
    const baslangic = u.searchParams.get("t") ?? u.searchParams.get("start") ?? "";
    const saniye = /^\d+$/.test(baslangic) ? `?start=${baslangic}` : "";
    return { tur: "youtube", adres: `https://www.youtube-nocookie.com/embed/${yt}${saniye}` };
  }
  const vm = vimeoKimligi(u);
  if (vm) return { tur: "vimeo", adres: `https://player.vimeo.com/video/${vm}` };

  if (/\.(mp4|webm|m4v|ogv)$/i.test(u.pathname)) return { tur: "dosya", adres: u.toString() };
  return { tur: "harici", adres: u.toString() };
}

/** Kaynağı oynatıcı içinde gösterilebilir mi (yok/harici → hayır) */
export function oynatilabilir(kaynak: VideoKaynagi): boolean {
  return kaynak.tur === "dosya" || kaynak.tur === "youtube" || kaynak.tur === "vimeo";
}

/** İlerleme kaydının izlenebildiği türler — iframe içinde konum okunamaz */
export function ilerlemeIzlenebilir(kaynak: VideoKaynagi): boolean {
  return kaynak.tur === "dosya";
}

/* ── Biçimlendirme ─────────────────────────────────────────── */

/** 42 → "42 dakika", 95 → "1 sa 35 dk", 0 → "" */
export function sureMetni(dakika: number): string {
  const dk = Math.max(0, Math.round(dakika || 0));
  if (!dk) return "";
  if (dk < 60) return `${dk} dakika`;
  const saat = Math.floor(dk / 60);
  const kalan = dk % 60;
  return kalan ? `${saat} sa ${kalan} dk` : `${saat} saat`;
}

/** Saniye → "07:32" / "1:07:32" (oynatıcı konumu) */
export function konumMetni(saniye: number): string {
  const t = Math.max(0, Math.floor(saniye || 0));
  const sa = Math.floor(t / 3600);
  const dk = Math.floor((t % 3600) / 60);
  const sn = t % 60;
  const iki = (n: number) => String(n).padStart(2, "0");
  return sa ? `${sa}:${iki(dk)}:${iki(sn)}` : `${iki(dk)}:${iki(sn)}`;
}

/** Bayt → "12,4 MB" */
export function boyutMetni(bayt: number): string {
  const b = Math.max(0, bayt || 0);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/** "Konu 1\nKonu 2" → ["Konu 1", "Konu 2"] (boş satırlar atılır) */
export function satirlar(metin: string | null | undefined): string[] {
  return String(metin || "")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** İzleme kaydından öğrenciye gösterilecek durum (kayıt yok → izlenmedi) */
export function izlemeDurumu(
  izleme: { durum: string; yuzde: number } | null | undefined
): VideoIzlemeDurum {
  if (!izleme) return "izlenmedi";
  if (izleme.durum === "tamamlandi") return "tamamlandi";
  if (izleme.durum === "izleniyor" || izleme.yuzde > 0) return "izleniyor";
  return "izlenmedi";
}
