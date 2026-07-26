/* ═══════════════════════════════════════════════════════════════
   Süreli test — saf iş kuralları (yan etkisiz).
   Hem sunucu (puanlama, süre kontrolü) hem client (sayaç, gösterim)
   bu dosyayı kullanır → burada prisma/DB erişimi YOKTUR.
   DB'ye dokunan yardımcılar: src/lib/sureli-test-sunucu.ts
   ═══════════════════════════════════════════════════════════════ */

import { TEST_SECENEKLERI, type TestSecenek } from "./sabitler";

/** Otomatik teslimde ağ gecikmesi payı — bu sürenin içindeki
    geç gelen cevaplar hâlâ kabul edilir (saniye). */
export const TESLIM_TOLERANS_SN = 20;

export interface SoruSatir {
  id: string;
  sira: number;
  dogru: string;
}

export interface TestSonucu {
  dogru: number;
  yanlis: number;
  bos: number;
  yuzde: number;
}

/** Öğrencinin cevapları: { soruId: "A" } */
export type CevapHaritasi = Record<string, string>;

/** SureliTestOturum.cevaplar (JSON) → cevap haritası; bozuk JSON'da {} */
export function cevaplariAyristir(json: string | null | undefined): CevapHaritasi {
  if (!json) return {};
  try {
    const v: unknown = JSON.parse(json);
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const sonuc: CevapHaritasi = {};
    for (const [soruId, cevap] of Object.entries(v as Record<string, unknown>)) {
      if (typeof cevap === "string" && (TEST_SECENEKLERI as readonly string[]).includes(cevap)) {
        sonuc[soruId] = cevap;
      }
    }
    return sonuc;
  } catch {
    return {};
  }
}

/** SureliTestSoru.secenekler (JSON dizi) → string[]; bozuk JSON'da [] */
export function seceneklerAyristir(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const v: unknown = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Şık sırası → harf: 0 → "A". Aralık dışında "" döner. */
export function secenekHarfi(sira: number): TestSecenek | "" {
  return TEST_SECENEKLERI[sira] ?? "";
}

/** Doğru/yanlış/boş ve başarı yüzdesi. Cevaplanmamış her soru boştur. */
export function testPuanla(sorular: SoruSatir[], cevaplar: CevapHaritasi): TestSonucu {
  let dogru = 0;
  let yanlis = 0;
  let bos = 0;
  for (const s of sorular) {
    const verilen = cevaplar[s.id];
    if (!verilen) bos++;
    else if (verilen === s.dogru) dogru++;
    else yanlis++;
  }
  const toplam = sorular.length;
  return { dogru, yanlis, bos, yuzde: toplam ? Math.round((dogru / toplam) * 100) : 0 };
}

/** Oturum açılırken yazılan süre sınırı: başlangıç + süre (dk) */
export function bitisSiniriHesapla(baslangic: Date, sureDk: number): Date {
  return new Date(baslangic.getTime() + sureDk * 60_000);
}

/** İki an arasındaki saniye (negatif olmaz) */
export function gecenSaniye(baslangic: Date, bitis: Date): number {
  return Math.max(0, Math.round((bitis.getTime() - baslangic.getTime()) / 1000));
}

/** Kalan saniye (bitmişse 0) */
export function kalanSaniye(bitisSiniri: Date | string, simdi: Date = new Date()): number {
  const sinir = typeof bitisSiniri === "string" ? new Date(bitisSiniri) : bitisSiniri;
  return Math.max(0, Math.round((sinir.getTime() - simdi.getTime()) / 1000));
}

/** Süre doldu mu — tolerans payı hariç, katı kontrol */
export function sureBitti(bitisSiniri: Date, simdi: Date = new Date()): boolean {
  return simdi.getTime() > bitisSiniri.getTime();
}

/** Geç gelen teslim hâlâ kabul edilir mi (ağ gecikmesi payı) */
export function teslimKabul(bitisSiniri: Date, simdi: Date = new Date()): boolean {
  return simdi.getTime() <= bitisSiniri.getTime() + TESLIM_TOLERANS_SN * 1000;
}

/** Saniye → "07:12" / bir saati geçerse "1:07:12" */
export function sureMetni(saniye: number): string {
  const t = Math.max(0, Math.round(saniye));
  const sa = Math.floor(t / 3600);
  const dk = Math.floor((t % 3600) / 60);
  const sn = t % 60;
  const iki = (n: number) => String(n).padStart(2, "0");
  return sa ? `${sa}:${iki(dk)}:${iki(sn)}` : `${iki(dk)}:${iki(sn)}`;
}

/** Tarih+saat → "26.07.2026 14:32" (proje geneli: Europe/Istanbul) */
const zamanBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
export function zamanMetni(d: Date | string | null | undefined): string {
  if (!d) return "";
  const t = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(t.getTime()) ? "" : zamanBicimi.format(t);
}

/** Dakika → "20 dk" / "1 sa 30 dk" (test süresi etiketi) */
export function sureEtiketi(dakika: number): string {
  if (dakika < 60) return `${dakika} dk`;
  const sa = Math.floor(dakika / 60);
  const dk = dakika % 60;
  return dk ? `${sa} sa ${dk} dk` : `${sa} sa`;
}
