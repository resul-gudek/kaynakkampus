/* Blog modülü — istemci-güvenli tanımlar ve saf yardımcılar (node importu
   YOK). Saklama tarafı: dosya-saklama.ts, DB'ye dokunan yardımcılar:
   blog-sunucu.ts.

   Blog kullanıcı sistemine bağlı DEĞİLDİR: yazar serbest metindir, ziyaretçi
   oturum açmadan tüm yayınları okur. */

import { grupAccept, type DosyaGrubu } from "./dosya-tanim";
import {
  BLOG_KATEGORILERI,
  BLOG_KATEGORI_ETIKETLERI,
  BLOG_KATEGORI_IKONLARI,
  type BlogKategori,
} from "./sabitler";

/** Kapak görseli yalnız görsel olabilir */
export const BLOG_KAPAK_GRUPLARI: readonly DosyaGrubu[] = ["image"];
export const BLOG_KAPAK_ACCEPT = grupAccept(BLOG_KAPAK_GRUPLARI);

/** Dakikada okunan ortalama kelime (Türkçe metin için ölçülü bir değer) */
const DAKIKADA_KELIME = 190;

/* ── Adresler ─────────────────────────────────────────────────
   Kapak görseli public dizinde tutulmaz; gerçek disk yolu istemciye
   gitmesin diye API rotasından sunulur. */

export function blogKapakUrl(yaziId: string): string {
  return `/api/blog/kapak/${yaziId}`;
}

export function blogYaziUrl(slug: string): string {
  return `/blog/${slug}`;
}

/** Kapak dosyalarının saklama köküne göreli klasörü */
export function blogKlasoru(yaziId: string): string {
  return `blog/${yaziId}`;
}

/* ── Kategori yardımcıları ───────────────────────────────────── */

export function gecerliKategori(deger: string | null | undefined): BlogKategori | null {
  const k = String(deger ?? "");
  return (BLOG_KATEGORILERI as readonly string[]).includes(k) ? (k as BlogKategori) : null;
}

/** Bilinmeyen anahtar geldiğinde çökmemek için anahtarın kendisi döner */
export function kategoriEtiketi(kategori: string): string {
  const k = gecerliKategori(kategori);
  return k ? BLOG_KATEGORI_ETIKETLERI[k] : kategori;
}

export function kategoriIkonu(kategori: string): string {
  const k = gecerliKategori(kategori);
  return k ? BLOG_KATEGORI_IKONLARI[k] : "📝";
}

/* ── Slug üretimi ─────────────────────────────────────────────
   Türkçe karakterler ascii karşılıklarına çevrilir; sonuç yalnız
   [a-z0-9-] içerir. Örn. "Verimli Ders Çalışma Yöntemleri"
   → "verimli-ders-calisma-yontemleri" */

const TR_HARFLER: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", I: "i", İ: "i", i: "i",
  ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u", â: "a", Â: "a",
  î: "i", Î: "i", û: "u", Û: "u",
};

export const SLUG_MAX = 90;

export function slugla(metin: string): string {
  return String(metin ?? "")
    .replace(/[çÇğĞıIİiöÖşŞüÜâÂîÎûÛ]/g, (h) => TR_HARFLER[h] ?? h)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

/** Slug adres bileşeni olarak kullanılabilir mi (rota parametresi doğrulaması) */
export function slugGecerli(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= SLUG_MAX;
}

/* ── Etiketler ────────────────────────────────────────────────
   DB'de virgülle ayrılmış tek alanda tutulur (ayrı tablo gerektirecek
   bir sorgulama ihtiyacı yok; arama metin içinde yapılır). */

export function etiketleriAyir(metin: string | null | undefined): string[] {
  const gorulen = new Set<string>();
  const sonuc: string[] = [];
  for (const parca of String(metin ?? "").split(/[,\n]/)) {
    const e = parca.trim().replace(/\s+/g, " ");
    if (!e) continue;
    const anahtar = e.toLocaleLowerCase("tr-TR");
    if (gorulen.has(anahtar)) continue;
    gorulen.add(anahtar);
    sonuc.push(e.slice(0, 40));
  }
  return sonuc;
}

export function etiketleriBirlestir(etiketler: readonly string[]): string {
  return etiketler.join(", ");
}

/* ── Metin yardımcıları ─────────────────────────────────────── */

/** İçerikten tahmini okuma süresi (dakika, en az 1) */
export function okumaSuresi(icerik: string): number {
  const kelime = String(icerik ?? "").trim().split(/\s+/).filter(Boolean).length;
  if (!kelime) return 0;
  return Math.max(1, Math.round(kelime / DAKIKADA_KELIME));
}

/** Özet boş bırakıldığında içerikten üretilen kısa açıklama */
export function ozetUret(icerik: string, uzunluk = 180): string {
  const duz = String(icerik ?? "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+[.)]\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (duz.length <= uzunluk) return duz;
  const kesik = duz.slice(0, uzunluk);
  const bosluk = kesik.lastIndexOf(" ");
  return (bosluk > 60 ? kesik.slice(0, bosluk) : kesik).trimEnd() + "…";
}

/** Tarihi "12 Mart 2026" biçiminde yazar (SSR/CSR farkı olmaması için elle) */
const AYLAR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function yayinTarihiMetni(tarih: Date | string | null | undefined): string {
  if (!tarih) return "";
  const t = typeof tarih === "string" ? new Date(tarih) : tarih;
  if (Number.isNaN(t.getTime())) return "";
  return `${t.getDate()} ${AYLAR[t.getMonth()]} ${t.getFullYear()}`;
}

/* ── Arama / filtreleme ──────────────────────────────────────
   Liste sayfasındaki arama ve kategori süzgeci; hem istemci hem
   test tarafından kullanılır. */

export interface AranabilirYazi {
  baslik: string;
  ozet: string;
  kategori: string;
  etiketler: string;
}

/** tr-TR duyarlı normalleştirme (İ/ı sorunları için) */
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

export function yaziEsliyor<T extends AranabilirYazi>(
  yazi: T,
  arama: string,
  kategori: string
): boolean {
  if (kategori && yazi.kategori !== kategori) return false;
  const q = normalize(arama);
  if (!q) return true;
  const havuz = normalize(
    [yazi.baslik, yazi.ozet, kategoriEtiketi(yazi.kategori), yazi.etiketler].join(" ")
  );
  // Çok kelimeli aramada her kelime ayrı ayrı bulunmalı
  return q.split(/\s+/).every((k) => havuz.includes(k));
}

export function yazilariSuz<T extends AranabilirYazi>(
  yazilar: readonly T[],
  arama: string,
  kategori: string
): T[] {
  return yazilar.filter((y) => yaziEsliyor(y, arama, kategori));
}

/* ── İçerik ayrıştırma (markdown-lite) ───────────────────────
   Yönetici içeriği düz metin olarak girer; HTML kabul EDİLMEZ (XSS
   yüzeyi açmamak için). Desteklenen işaretler:
     ## Başlık          → h2        ### Başlık → h3
     - madde            → sırasız liste
     1. madde           → sıralı liste
     > alıntı           → blockquote
     ---                → ayırıcı
     **kalın** *eğik* [metin](https://…)
   Çıktı React tarafından render edilen veri yapısıdır; hiçbir yerde
   dangerouslySetInnerHTML kullanılmaz. */

export type MetinParcasi =
  | { tur: "metin"; deger: string }
  | { tur: "kalin"; deger: string }
  | { tur: "egik"; deger: string }
  | { tur: "baglanti"; deger: string; adres: string };

export type IcerikBlogu =
  | { tur: "baslik"; seviye: 2 | 3; parcalar: MetinParcasi[] }
  | { tur: "paragraf"; parcalar: MetinParcasi[] }
  | { tur: "alinti"; parcalar: MetinParcasi[] }
  | { tur: "liste"; sirali: boolean; maddeler: MetinParcasi[][] }
  | { tur: "ayirici" };

/** Yalnız http(s) adreslerine bağlantı verilir (javascript: vb. atılır) */
function guvenliAdres(adres: string): string | null {
  try {
    const u = new URL(adres, "https://kaynakkampus.local");
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch {
    /* ayrıştırılamayan adres */
  }
  return null;
}

const SATIRICI = /\*\*([^*]+)\*\*|\*([^*\n]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Satır içi işaretleri parçalara böler */
export function satirIciAyristir(metin: string): MetinParcasi[] {
  const kaynak = String(metin ?? "");
  const parcalar: MetinParcasi[] = [];
  let son = 0;
  for (const eslesme of kaynak.matchAll(SATIRICI)) {
    const indeks = eslesme.index ?? 0;
    if (indeks > son) parcalar.push({ tur: "metin", deger: kaynak.slice(son, indeks) });
    const [tam, kalin, egik, baglantiMetni, baglantiAdresi] = eslesme;
    if (kalin !== undefined) {
      parcalar.push({ tur: "kalin", deger: kalin });
    } else if (egik !== undefined) {
      parcalar.push({ tur: "egik", deger: egik });
    } else {
      const adres = guvenliAdres(baglantiAdresi ?? "");
      if (adres) parcalar.push({ tur: "baglanti", deger: baglantiMetni ?? "", adres });
      else parcalar.push({ tur: "metin", deger: baglantiMetni ?? "" });
    }
    son = indeks + tam.length;
  }
  if (son < kaynak.length) parcalar.push({ tur: "metin", deger: kaynak.slice(son) });
  return parcalar.length ? parcalar : [{ tur: "metin", deger: "" }];
}

export function icerigiAyristir(icerik: string): IcerikBlogu[] {
  const bloklar: IcerikBlogu[] = [];
  const satirlar = String(icerik ?? "").replace(/\r\n?/g, "\n").split("\n");

  let paragraf: string[] = [];
  let liste: { sirali: boolean; maddeler: string[] } | null = null;
  let alinti: string[] = [];

  const paragrafiKapat = () => {
    if (!paragraf.length) return;
    bloklar.push({ tur: "paragraf", parcalar: satirIciAyristir(paragraf.join(" ")) });
    paragraf = [];
  };
  const listeyiKapat = () => {
    if (!liste) return;
    bloklar.push({
      tur: "liste",
      sirali: liste.sirali,
      maddeler: liste.maddeler.map((m) => satirIciAyristir(m)),
    });
    liste = null;
  };
  const alintiyiKapat = () => {
    if (!alinti.length) return;
    bloklar.push({ tur: "alinti", parcalar: satirIciAyristir(alinti.join(" ")) });
    alinti = [];
  };
  const hepsiniKapat = () => {
    paragrafiKapat();
    listeyiKapat();
    alintiyiKapat();
  };

  for (const ham of satirlar) {
    const satir = ham.trim();

    if (!satir) {
      hepsiniKapat();
      continue;
    }

    const baslik = /^(#{2,3})\s+(.*)$/.exec(satir);
    if (baslik) {
      hepsiniKapat();
      bloklar.push({
        tur: "baslik",
        seviye: baslik[1].length === 2 ? 2 : 3,
        parcalar: satirIciAyristir(baslik[2]),
      });
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(satir)) {
      hepsiniKapat();
      bloklar.push({ tur: "ayirici" });
      continue;
    }

    const alintiSatiri = /^>\s?(.*)$/.exec(satir);
    if (alintiSatiri) {
      paragrafiKapat();
      listeyiKapat();
      alinti.push(alintiSatiri[1]);
      continue;
    }

    const madde = /^([-*•]|\d+[.)])\s+(.*)$/.exec(satir);
    if (madde) {
      paragrafiKapat();
      alintiyiKapat();
      const sirali = /^\d/.test(madde[1]);
      if (!liste || liste.sirali !== sirali) {
        listeyiKapat();
        liste = { sirali, maddeler: [] };
      }
      liste.maddeler.push(madde[2]);
      continue;
    }

    // Düz satır: açık listeye/alıntıya devam ediyorsa ona eklenir
    if (liste) {
      liste.maddeler[liste.maddeler.length - 1] += " " + satir;
      continue;
    }
    if (alinti.length) {
      alinti.push(satir);
      continue;
    }
    paragraf.push(satir);
  }

  hepsiniKapat();
  return bloklar;
}
