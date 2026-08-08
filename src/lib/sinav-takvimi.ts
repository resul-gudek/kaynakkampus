/* ══════════════════════════════════════════════════════════════════════
   Güncel Sınav Takvimi — ÖSYM ve MEB kaynaklarından senkronizasyon.

   Tek güvenilir kaynak ilkesi:
   · ÖSYM  → osym.gov.tr/Sayfa/SinavTakvimi sayfasındaki resmî takvim
             tablosu ayrıştırılır (sunucu tarafında, CORS engeli yok).
   · MEB   → merkezî sınavlar (LGS, İOKBS, açık öğretim) tabloya değil
             duyuru/kılavuz olarak yayımlanır; bunlar çekirdek dosyada
             (public/assets/sinav-takvimi.json) tutulur, ODSGM'deki
             "Sınav Uygulama Takvimi" bağlantısı otomatik yakalanır.
   · Duyurular → ÖSYM ana sayfası + meb.gov.tr; sınavla ilgili başlıklar
             süzülür ve ana sayfadaki duyuru kartlarında gösterilir.

   Ağ erişilemezse çekirdek dosya aynen döner (canli: false).
   ══════════════════════════════════════════════════════════════════════ */

export interface Sinav {
  id: string;
  ad: string;
  kurum: string;
  /** Takvimi henüz yayımlanmamış yer tutucu kayıt */
  bekleyen?: boolean;
  beklenenDonem?: string | null;
  not?: string | null;
  sinavTarihi: string | null;
  sinavSaati: string | null;
  sinavBitis: string | null;
  onBasvuruBas: string | null;
  onBasvuruBit: string | null;
  basvuruBas: string | null;
  basvuruBit: string | null;
  gecBasvuruBas: string | null;
  gecBasvuru: string | null;
  sonucTarihi: string | null;
  kaynakUrl: string;
  /** Yer tutucu kayıt için: canlı takvimde bu desene uyan satır çıkarsa yer tutucu düşer */
  yerineDesen?: string;
}

export interface Duyuru {
  baslik: string;
  url: string;
  kaynak: string;
}

export interface TakvimVerisi {
  surum: number;
  guncellenme: string;
  canli: boolean;
  kaynak: "canli" | "cekirdek" | "karma";
  kaynaklar: { ad: string; url: string }[];
  sinavlar: Sinav[];
  duyurular?: Duyuru[];
}

const OSYM_TAKVIM = "https://www.osym.gov.tr/Sayfa/SinavTakvimi";
const OSYM_ANA = "https://www.osym.gov.tr/";
const MEB_ANA = "https://www.meb.gov.tr/";
const ODSGM_ANA = "https://odsgm.meb.gov.tr/";

const KULLANICI_AJANI = "Mozilla/5.0 (compatible; KaynakKampus/1.0; +https://kaynakkampus.com)";
const ZAMAN_ASIMI = 9000;
/* www.meb.gov.tr ana sayfası ağır ve çoğu zaman 20 sn'nin üstünde yanıt
   veriyor; senkronizasyonu bekletmesin diye kısa tutulur. Sınav duyuruları
   için asıl kaynak ODSGM'dir (hızlı ve konusu doğrudan sınavlar). */
const MEB_ZAMAN_ASIMI = 4000;

/* ── Metin yardımcıları ─────────────────────────────────────────────── */

/** HTML varlıklarını çözer, etiketleri atar, boşlukları tekiller */
export function metneCevir(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const TR_HARF: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", I: "i", Ö: "o", Ş: "s", Ü: "u",
};

/** Sınav adından kararlı bir kimlik üretir (çekirdek dosyayla aynı kural) */
export function kimlik(ad: string): string {
  return ad
    .replace(/[çğıİöşüÇĞIÖŞÜ]/g, (c) => TR_HARF[c] ?? c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/* ── ÖSYM takvim tablosu ────────────────────────────────────────────── */

interface HucreTarihi {
  iso: string;
  saat: string | null;
}

/** Bir hücredeki tüm gg.aa.yyyy (varsa SS:DD) değerlerini sırayla döndürür */
function hucreTarihleri(hucre: string): HucreTarihi[] {
  const out: HucreTarihi[] = [];
  const re = /(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(hucre))) {
    out.push({ iso: `${m[3]}-${m[2]}-${m[1]}`, saat: m[4] ? `${m[4]}:${m[5]}` : null });
  }
  return out;
}

function ilk(t: HucreTarihi[]): string | null {
  return t.length ? t[0].iso : null;
}
function son(t: HucreTarihi[]): string | null {
  return t.length ? t[t.length - 1].iso : null;
}

/**
 * ÖSYM sınav takvimi sayfasındaki tabloyu ayrıştırır.
 * Sütun düzeni: Sınav Adı | Sınav Tarihi | Ön Başvuru | Başvuru | Geç Başvuru | Sonuç
 */
export function osymTakvimiAyristir(html: string): Sinav[] {
  const tablo = html.match(/<table[\s\S]*?<\/table>/i);
  if (!tablo) return [];

  const satirlar = tablo[0].match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  const sinavlar: Sinav[] = [];

  for (const tr of satirlar) {
    const hucreler = (tr.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? []).map(metneCevir);
    if (hucreler.length < 6) continue;

    const [ad, sinavC, onC, basC, gecC, sonucC] = hucreler;
    if (!ad || /^s.nav\s*ad/i.test(ad)) continue;
    // Adında hiç tarih/yıl geçmeyen başlık satırlarını at
    if (!/\d{4}|\bYKS\b|KPSS|ALES/i.test(ad)) continue;

    const s = hucreTarihleri(sinavC);
    const on = hucreTarihleri(onC);
    const b = hucreTarihleri(basC);
    const g = hucreTarihleri(gecC);
    const so = hucreTarihleri(sonucC);

    sinavlar.push({
      id: kimlik(ad),
      ad,
      kurum: "ÖSYM",
      sinavTarihi: ilk(s),
      sinavSaati: s.length ? s[0].saat : null,
      sinavBitis: s.length > 1 ? son(s) : null,
      onBasvuruBas: ilk(on),
      onBasvuruBit: son(on),
      basvuruBas: ilk(b),
      basvuruBit: son(b),
      gecBasvuruBas: ilk(g),
      gecBasvuru: son(g),
      sonucTarihi: ilk(so),
      kaynakUrl: OSYM_TAKVIM,
    });
  }

  return sinavlar;
}

/* ── Duyurular ──────────────────────────────────────────────────────── */

/** Ana sayfadaki duyuru kartlarına yalnız sınavla ilgili başlıklar girsin */
const SINAV_ANAHTARLARI = [
  "sınav", "sinav", "başvuru", "basvuru", "takvim", "kılavuz", "kilavuz",
  "tercih", "yerleştirme", "yerlestirme", "sonuç", "sonuc", "giriş belge",
  "yks", "tyt", "ayt", "ydt", "lgs", "kpss", "ales", "dgs", "yds", "yökdil",
  "yokdil", "tus", "dus", "msü", "msu", "ags", "öabt", "oabt", "iokbs",
  "bursluluk", "ekpss", "dhbt", "açık öğretim", "acik ogretim",
];

function sinavlaIlgili(baslik: string): boolean {
  const t = baslik.toLocaleLowerCase("tr");
  return SINAV_ANAHTARLARI.some((k) => t.includes(k));
}

/** ÖSYM ana sayfasındaki duyuru bağlantıları (slug biçimli göreli adresler) */
export function osymDuyurulariAyristir(html: string): Duyuru[] {
  const out: Duyuru[] = [];
  const gorulen = new Set<string>();
  const re = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;

  while ((m = re.exec(html))) {
    const href = m[1];
    const baslik = metneCevir(m[2]);
    // Yalnız /slug-bicimli-duyuru adresleri; sistem/PDF bağlantıları dışarıda
    if (!/^\/[a-z0-9][a-z0-9-]{18,}$/.test(href)) continue;
    if (baslik.length < 25 || baslik.length > 220) continue;
    if (!sinavlaIlgili(baslik)) continue;

    const anahtar = baslik.toLocaleLowerCase("tr");
    if (gorulen.has(anahtar)) continue;
    gorulen.add(anahtar);

    out.push({ baslik, url: new URL(href, OSYM_ANA).href, kaynak: "osym.gov.tr" });
  }
  return out;
}

/** meb.gov.tr ana sayfasındaki haber bağlantıları */
export function mebDuyurulariAyristir(html: string): Duyuru[] {
  const out: Duyuru[] = [];
  const gorulen = new Set<string>();
  const re = /<a[^>]+href="([^"]*\/haber\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;

  while ((m = re.exec(html))) {
    const icerik = m[2];
    let baslik = metneCevir(icerik);
    if (!baslik) {
      baslik = metneCevir((icerik.match(/alt="([^"]+)"/) ?? [])[1] ?? "");
    }
    if (baslik.length < 25 || baslik.length > 220) continue;
    if (!sinavlaIlgili(baslik)) continue;

    const anahtar = baslik.toLocaleLowerCase("tr");
    if (gorulen.has(anahtar)) continue;
    gorulen.add(anahtar);

    let url: string;
    try {
      url = new URL(m[1], MEB_ANA).href;
    } catch {
      continue;
    }
    out.push({ baslik: baslikDuzelt(baslik), url, kaynak: "meb.gov.tr" });
  }
  return out;
}

/**
 * ODSGM (Ölçme, Değerlendirme ve Sınav Hizmetleri) ana sayfasındaki duyurular.
 * Sayfa aynı haberi hem başlık hem özet hem de birleşik biçimde bağladığı
 * için adres başına EN BAŞLIK GİBİ metin seçilir: kırpma işareti ("[...]")
 * taşımayan ve en kısa olan.
 */
export function odsgmDuyurulariAyristir(html: string): Duyuru[] {
  const adayaGore = new Map<string, string>();
  const re = /<a[^>]+href="([^"]*\/icerik\/\d+[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;

  while ((m = re.exec(html))) {
    // Listelerde başlığın önüne "25 Tem 2026 18:12" biçiminde tarih eklenir
    const baslik = metneCevir(m[2]).replace(/^\d{1,2}\s+\S{3}\s+\d{4}\s+\d{2}:\d{2}\s*/, "");
    if (baslik.length < 25 || baslik.length > 220) continue;
    if (baslik.includes("[...]")) continue; // kırpılmış özet
    if (!sinavlaIlgili(baslik)) continue;

    let url: string;
    try {
      url = new URL(m[1], ODSGM_ANA).href;
    } catch {
      continue;
    }
    const eski = adayaGore.get(url);
    if (!eski || baslik.length < eski.length) adayaGore.set(url, baslik);
  }

  const out: Duyuru[] = [];
  const gorulen = new Set<string>();
  for (const [url, baslik] of adayaGore) {
    const anahtar = baslik.toLocaleLowerCase("tr");
    if (gorulen.has(anahtar)) continue;
    gorulen.add(anahtar);
    out.push({ baslik: baslikDuzelt(baslik), url, kaynak: "odsgm.meb.gov.tr" });
  }
  return out;
}

/* Başlık büyütülürken olduğu gibi kalması gereken kısaltmalar */
const KISALTMALAR = new Set([
  "LGS", "YKS", "TYT", "AYT", "YDT", "KPSS", "ALES", "DGS", "YDS", "YÖKDİL",
  "TUS", "DUS", "MSÜ", "AGS", "ÖABT", "İOKBS", "EKPSS", "DHBT", "YDUS", "EUS",
  "STS", "HMGS", "YÖS", "MEB", "ÖSYM", "AÖL", "AÖO", "AÖİHL", "MAÖL", "UDSP",
  "MTSK", "TIMSS", "PISA", "BİLSEM", "EKYS", "ODSGM", "MYS", "BEP", "TÜBİTAK",
]);
/* Başlık ortasında küçük kalması doğal olan bağlaçlar */
const BAGLAC = new Set(["ve", "ile", "için", "veya", "ya", "da", "de", "ki"]);

/**
 * MEB başlıkları TAMAMI BÜYÜK gelir; okunur hâle getirir.
 * Kısaltmalar ("LGS") büyük, bağlaçlar ("ve") küçük bırakılır.
 */
export function baslikDuzelt(s: string): string {
  if (s !== s.toLocaleUpperCase("tr")) return s;
  return s
    .split(/(\s+)/)
    .map((parca, i) => {
      if (/^\s*$/.test(parca)) return parca;
      // Kısaltma kontrolü noktalama dışındaki çekirdeğe bakar: "(LGS)" → "LGS"
      const cekirdek = parca.replace(/[^0-9A-Za-zÇĞİıÖŞÜçğöşü]/g, "");
      if (KISALTMALAR.has(cekirdek)) return parca;
      const kucuk = parca.toLocaleLowerCase("tr");
      if (i > 0 && BAGLAC.has(kucuk)) return kucuk;
      return kucuk.replace(/(^|[\s"'(])(\S)/g, (_, p: string, c: string) => p + c.toLocaleUpperCase("tr"));
    })
    .join("");
}

/** ODSGM ana sayfasındaki "20XX Yılı Sınav Uygulama Takvimi" bağlantısı */
export function mebTakvimBaglantisi(html: string): { ad: string; url: string } | null {
  const re = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  let enIyi: { ad: string; url: string; yil: number } | null = null;

  while ((m = re.exec(html))) {
    const ad = metneCevir(m[2]);
    const yilM = ad.match(/(20\d{2})\s*Y[ıi]l[ıi]\s*S[ıi]nav\s*Uygulama\s*Takvimi/i);
    if (!yilM) continue;
    const yil = Number(yilM[1]);
    if (enIyi && enIyi.yil >= yil) continue;
    try {
      enIyi = { ad, url: new URL(m[1], ODSGM_ANA).href, yil };
    } catch {
      /* bozuk adres — atla */
    }
  }
  return enIyi ? { ad: enIyi.ad, url: enIyi.url } : null;
}

/* ── Birleştirme ────────────────────────────────────────────────────── */

/**
 * Canlı ÖSYM satırlarını çekirdek veriyle birleştirir.
 * · Aynı kimlikli satır canlı veriyle güncellenir.
 * · Canlıda olup çekirdekte olmayan satır eklenir (ÖSYM yeni yıl takvimini
 *   yayımladığında 2027 sınavları kendiliğinden görünür).
 * · Çekirdekteki yer tutucu ("bekleyen") satır, yerineDesen'e uyan gerçek
 *   bir canlı satır çıktığında düşer.
 * · Çekirdekteki MEB satırları korunur (ÖSYM tablosunda yer almazlar).
 */
export function birlestir(cekirdek: Sinav[], canli: Sinav[]): Sinav[] {
  const sonuc = new Map<string, Sinav>();
  for (const s of cekirdek) sonuc.set(s.id, s);

  for (const c of canli) {
    const eski = sonuc.get(c.id);
    // Çekirdekteki elle girilmiş açıklama/notu koru, tarihleri canlıdan al
    sonuc.set(c.id, eski ? { ...eski, ...c, not: eski.not ?? c.not ?? null } : c);
  }

  // Karşılığı yayımlanan yer tutucuları çıkar
  for (const [id, s] of [...sonuc]) {
    if (!s.bekleyen || !s.yerineDesen) continue;
    let desen: RegExp;
    try {
      desen = new RegExp(s.yerineDesen, "i");
    } catch {
      continue;
    }
    if (canli.some((c) => desen.test(c.ad))) sonuc.delete(id);
  }

  return [...sonuc.values()].sort((a, b) => {
    // Tarihi olanlar önce, kendi içlerinde tarihe göre
    if (!a.sinavTarihi && !b.sinavTarihi) return a.ad.localeCompare(b.ad, "tr");
    if (!a.sinavTarihi) return 1;
    if (!b.sinavTarihi) return -1;
    return a.sinavTarihi.localeCompare(b.sinavTarihi);
  });
}

/* ── Ağ ─────────────────────────────────────────────────────────────── */

async function metinGetir(url: string, zamanAsimi = ZAMAN_ASIMI): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": KULLANICI_AJANI, Accept: "text/html,*/*" },
      signal: AbortSignal.timeout(zamanAsimi),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const metin = await res.text();
    return metin && metin.length > 500 ? metin : null;
  } catch {
    return null;
  }
}

/**
 * İki listeyi sırayla birer birer harmanlar ve aynı başlığı bir kez alır.
 * Böylece duyuru kartlarında yalnız tek kurumun haberleri sıralanmaz.
 */
export function harmanla(a: Duyuru[], b: Duyuru[]): Duyuru[] {
  const out: Duyuru[] = [];
  const gorulen = new Set<string>();
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    for (const d of [a[i], b[i]]) {
      if (!d) continue;
      const anahtar = d.baslik.toLocaleLowerCase("tr");
      if (gorulen.has(anahtar)) continue;
      gorulen.add(anahtar);
      out.push(d);
    }
  }
  return out;
}

export interface SenkronSonucu {
  sinavlar: Sinav[];
  duyurular: Duyuru[];
  kaynaklar: { ad: string; url: string }[];
  canli: boolean;
}

/**
 * ÖSYM ve MEB kaynaklarını paralel çeker, çekirdek veriyle birleştirir.
 * Hiçbir kaynak yanıt vermezse çekirdek veri aynen döner (canli: false).
 */
export async function senkronEt(cekirdek: TakvimVerisi): Promise<SenkronSonucu> {
  const [takvimHtml, osymAnaHtml, odsgmHtml, mebAnaHtml] = await Promise.all([
    metinGetir(OSYM_TAKVIM),
    metinGetir(OSYM_ANA),
    metinGetir(ODSGM_ANA),
    metinGetir(MEB_ANA, MEB_ZAMAN_ASIMI),
  ]);

  const canliSinavlar = takvimHtml ? osymTakvimiAyristir(takvimHtml) : [];
  // Kaynaklar dönüşümlü sıralanır: ÖSYM ve MEB duyuruları kartlarda karışsın
  const duyurular = harmanla(
    osymAnaHtml ? osymDuyurulariAyristir(osymAnaHtml) : [],
    [
      ...(odsgmHtml ? odsgmDuyurulariAyristir(odsgmHtml) : []),
      ...(mebAnaHtml ? mebDuyurulariAyristir(mebAnaHtml) : []),
    ],
  );

  const kaynaklar = [...cekirdek.kaynaklar];
  const mebTakvim = odsgmHtml ? mebTakvimBaglantisi(odsgmHtml) : null;
  if (mebTakvim && !kaynaklar.some((k) => k.url === mebTakvim.url)) {
    kaynaklar.push({ ad: `MEB ${mebTakvim.ad}`, url: mebTakvim.url });
  }

  return {
    // Takvim tablosu en az 10 satır vermediyse ayrıştırma bozulmuş sayılır
    sinavlar: canliSinavlar.length >= 10 ? birlestir(cekirdek.sinavlar, canliSinavlar) : cekirdek.sinavlar,
    duyurular,
    kaynaklar,
    canli: canliSinavlar.length >= 10,
  };
}
