/* Etkinlikler — PDF arşivi ve klasör ağacı.
   İstemci-güvenli tanımlar ve saf yardımcılar (node importu YOK).
   DB'ye dokunan yardımcılar: etkinlik-sunucu.ts

   BU BİR TAKVİM DEĞİLDİR. Tarih, saat, yer, çevrim içi, kategori,
   geçmiş/yaklaşan gibi kavramlar bilerek yoktur; modül sınıf/ders/ünite
   klasörleri altında PDF çalışma kâğıdı tutar.

   Klasör de PDF de aynı "düğüm" biçimidir (tur alanı ayırır); böylece bir
   klasörün içindeki karışık liste tek sırayla gelir. */

import { grupAccept, type DosyaGrubu } from "./dosya-tanim";
import { ETKINLIK_MAX_DERINLIK, type EtkinlikTuru } from "./sabitler";

/** PDF etkinliği yalnız belge, ön izleme yalnız görsel olabilir */
export const ETKINLIK_PDF_GRUPLARI: readonly DosyaGrubu[] = ["doc"];
export const ETKINLIK_KAPAK_GRUPLARI: readonly DosyaGrubu[] = ["image"];
/** Yükleme alanı yalnız .pdf kabul eder (doc/docx grupta var ama burada yok) */
export const ETKINLIK_PDF_ACCEPT = ".pdf";
export const ETKINLIK_KAPAK_ACCEPT = grupAccept(ETKINLIK_KAPAK_GRUPLARI);

/* ── Adresler ─────────────────────────────────────────────────
   PDF ve kapak public dizinde tutulmaz; gerçek disk yolu istemciye
   gitmesin diye API rotasından sunulur. */

/** PDF'i tarayıcıda açar (inline) */
export function etkinlikPdfUrl(id: string): string {
  return `/api/etkinlik/pdf/${id}`;
}

/** PDF'i indirir (attachment) */
export function etkinlikIndirUrl(id: string): string {
  return `/api/etkinlik/pdf/${id}?indir=1`;
}

export function etkinlikKapakUrl(id: string): string {
  return `/api/etkinlik/kapak/${id}`;
}

/** Ziyaretçi adresi: /etkinlikler/<slug>/<slug>… */
export function etkinlikYolUrl(slugYolu: readonly string[]): string {
  return slugYolu.length ? `/etkinlikler/${slugYolu.join("/")}` : "/etkinlikler";
}

/** Panel adresi: klasöre girmek için */
export function etkinlikPanelUrl(klasorId?: string | null): string {
  return klasorId ? `/admin/etkinlikler?klasor=${klasorId}` : "/admin/etkinlikler";
}

/** Düğümün dosyalarının saklama köküne göreli klasörü */
export function etkinlikKlasoru(dugumId: string): string {
  return `etkinlik/${dugumId}`;
}

/* ── Düğüm ────────────────────────────────────────────────────
   Sunucudan istemciye geçen biçim; yalnız serileştirilebilir alanlar. */

export interface EtkinlikDugumu {
  id: string;
  ustId: string | null;
  tur: EtkinlikTuru;
  ad: string;
  slug: string;
  sira: number;
  durum: string;
  /** PDF yüklenmiş mi */
  dosyaVar: boolean;
  dosyaAd: string;
  dosyaBoyut: number;
  kapakVar: boolean;
}

/** Ağaç işleyen yardımcıların beklediği en az alan kümesi */
export interface AgacDugumu {
  id: string;
  ustId: string | null;
  tur: string;
  ad: string;
  sira: number;
}

export function klasorMu(d: { tur: string }): boolean {
  return d.tur === "klasor";
}

export function pdfMu(d: { tur: string }): boolean {
  return d.tur === "pdf";
}

/* ── Sıralama ─────────────────────────────────────────────────
   Klasörler her zaman PDF'lerden önce gelir (dosya yöneticisi
   alışkanlığı); ardından el ile verilen sıra, sonra ad. */

export function dugumKarsilastir(
  a: { tur: string; sira: number; ad: string },
  b: { tur: string; sira: number; ad: string }
): number {
  if (a.tur !== b.tur) return a.tur === "klasor" ? -1 : 1;
  if (a.sira !== b.sira) return a.sira - b.sira;
  return a.ad.localeCompare(b.ad, "tr");
}

export function dugumleriSirala<T extends { tur: string; sira: number; ad: string }>(
  liste: readonly T[]
): T[] {
  return [...liste].sort(dugumKarsilastir);
}

/* ── Ağaç ─────────────────────────────────────────────────────
   Ağaç küçüktür (yüzlerce düğüm); tamamı tek sorguyla çekilip bellekte
   işlenir. Bu sayede kırıntı yolu, alt ağaç sayımı ve arama ek sorgu
   gerektirmez. */

/** ustId → çocuklar (sıralı) */
export function altHaritasi<T extends AgacDugumu>(
  dugumler: readonly T[]
): Map<string | null, T[]> {
  const harita = new Map<string | null, T[]>();
  for (const d of dugumler) {
    const anahtar = d.ustId ?? null;
    const liste = harita.get(anahtar);
    if (liste) liste.push(d);
    else harita.set(anahtar, [d]);
  }
  for (const [k, v] of harita) harita.set(k, dugumleriSirala(v));
  return harita;
}

/** Bir klasörün doğrudan içindekiler (sıralı) */
export function altlari<T extends AgacDugumu>(
  dugumler: readonly T[],
  klasorId: string | null
): T[] {
  return altHaritasi(dugumler).get(klasorId) ?? [];
}

/** Kökten düğüme kadar olan zincir (düğümün kendisi dâhil) */
export function kirintiYolu<T extends { id: string; ustId: string | null }>(
  dugumler: readonly T[],
  id: string | null
): T[] {
  if (!id) return [];
  const indeks = new Map(dugumler.map((d) => [d.id, d]));
  const yol: T[] = [];
  let simdiki = indeks.get(id);
  // Bozuk veri döngü yaratsa bile sonsuz dönmesin
  for (let n = 0; simdiki && n <= ETKINLIK_MAX_DERINLIK + 2; n++) {
    yol.unshift(simdiki);
    simdiki = simdiki.ustId ? indeks.get(simdiki.ustId) : undefined;
  }
  return yol;
}

/** Düğümün derinliği (kök klasör = 1) */
export function dugumDerinligi<T extends { id: string; ustId: string | null }>(
  dugumler: readonly T[],
  id: string | null
): number {
  return kirintiYolu(dugumler, id).length;
}

/** Bir düğümün tüm alt ağacı (kendisi HARİÇ) */
export function altAgac<T extends AgacDugumu>(dugumler: readonly T[], id: string): T[] {
  const harita = altHaritasi(dugumler);
  const sonuc: T[] = [];
  const kuyruk = [...(harita.get(id) ?? [])];
  while (kuyruk.length) {
    const d = kuyruk.shift()!;
    sonuc.push(d);
    kuyruk.push(...(harita.get(d.id) ?? []));
  }
  return sonuc;
}

/** hedef, kaynağın alt ağacında mı? (klasörü kendi içine taşımayı engeller) */
export function altindaMi<T extends AgacDugumu>(
  dugumler: readonly T[],
  kaynakId: string,
  hedefId: string | null
): boolean {
  if (!hedefId) return false;
  if (kaynakId === hedefId) return true;
  return altAgac(dugumler, kaynakId).some((d) => d.id === hedefId);
}

/** Klasörün alt ağacındaki PDF sayısı (yalnız yayındakiler istenebilir) */
export function pdfSayisi<T extends AgacDugumu & { durum: string }>(
  dugumler: readonly T[],
  klasorId: string,
  yalnizYayinda = false
): number {
  return altAgac(dugumler, klasorId).filter(
    (d) => d.tur === "pdf" && (!yalnizYayinda || d.durum === "yayinda")
  ).length;
}

/* ── Slug ─────────────────────────────────────────────────────
   Adres bileşeni; kardeşler arasında benzersizdir. Üretimi lib/blog.ts
   içindeki slugla ile yapılır (aynı Türkçe→ascii kuralı). */

export function etkinlikSlugGecerli(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 90;
}

/* ── Görüntüleme yardımcıları ────────────────────────────────── */

/** 1536000 → "1,5 MB" */
export function boyutMetni(bayt: number): string {
  if (!bayt || bayt < 0) return "";
  if (bayt < 1024) return `${bayt} B`;
  if (bayt < 1024 * 1024) return `${Math.round(bayt / 1024)} KB`;
  const mb = bayt / (1024 * 1024);
  return `${mb.toFixed(mb < 10 ? 1 : 0).replace(".", ",")} MB`;
}

/* ── Arama ────────────────────────────────────────────────────
   Ağaç bellekte olduğu için arama da bellekte yapılır: ad üzerinde
   tr-TR duyarlı, çok kelimeli eşleşme. */

function normalize(metin: string): string {
  return String(metin ?? "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g")
    .replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[şŞ]/g, "s")
    .replace(/[üÜ]/g, "u")
    .trim();
}

export function dugumEsliyor(dugum: { ad: string }, arama: string): boolean {
  const q = normalize(arama);
  if (!q) return true;
  const havuz = normalize(dugum.ad);
  return q.split(/\s+/).every((k) => havuz.includes(k));
}

export function dugumleriAra<T extends { ad: string }>(
  dugumler: readonly T[],
  arama: string
): T[] {
  if (!arama.trim()) return [...dugumler];
  return dugumler.filter((d) => dugumEsliyor(d, arama));
}
