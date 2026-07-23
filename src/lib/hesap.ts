/* ═══════════════════════════════════════════════════════════════
   Saf iş kuralları — legacy/kocluk.js'ten birebir taşındı.
   Veritabanından çekilen satırlar üzerinde çalışan yan-etkisiz
   fonksiyonlar; hem sunucu bileşenleri hem client bileşenleri kullanır.
   ═══════════════════════════════════════════════════════════════ */

/* ── Tarih yardımcıları ──────────────────────────────────────
   Kural: gün-bazlı alanlar (@db.Date) her zaman UTC gece yarısı
   Date nesnesidir; karşılaştırma/format ISO "YYYY-MM-DD" dizgesi
   üzerinden yapılır (İstanbul UTC+3 gün kayması yaşanmasın). */

/** Date → "YYYY-MM-DD" (null/undefined → "") */
export function isoTarih(d: Date | string | null | undefined): string {
  if (!d) return "";
  if (typeof d === "string") return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/** Bugünün ISO tarihi "YYYY-MM-DD" */
export function bugun(): string {
  return new Date().toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" → UTC gece yarısı Date (DB'ye yazarken kullanılır) */
export function tarihNesnesi(iso: string): Date {
  return new Date(iso.slice(0, 10) + "T00:00:00.000Z");
}

/** Bugünden n gün ileri/geri ISO tarih */
export function gunKaydir(n: number): string {
  const t = new Date();
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

/** "2026-07-20" ya da Date → "20.07.2026" */
export function tarihStr(d: Date | string | null | undefined): string {
  const iso = isoTarih(d);
  const p = iso.split("-");
  return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : iso;
}

/** Kullanıcı adı normalizasyonu — Türkçe İ/ı tuzağına karşı her yerde bu kullanılır */
export function kullaniciAdiNormalize(s: string): string {
  return String(s || "").trim().toLocaleLowerCase("tr-TR");
}

/* ── Net hesabı ──────────────────────────────────────────────
   LGS'de 3, YKS'de 4 yanlış bir doğruyu götürür */
export function netHesapla(tur: string, dogru: number, yanlis: number): number {
  const bolen = tur === "LGS" ? 3 : 4;
  return Math.round((dogru - yanlis / bolen) * 100) / 100;
}

/* ── Telefon ────────────────────────────────────────────────
   WhatsApp (wa.me) biçimine çevirir: 05xx… → 905xx… */
export function telefonDuzelt(t: string | null | undefined): string {
  let s = String(t || "").replace(/\D/g, "");
  if (!s) return "";
  if (s.startsWith("0")) s = "9" + s;
  if (s.length === 10 && s.startsWith("5")) s = "90" + s;
  return s;
}

/* ── Satır tipleri (fonksiyonların ihtiyaç duyduğu asgari alanlar) ── */

export interface YolAdimiSatir {
  id: string;
  sira: number;
  xp: number;
  tamamlandi: boolean;
  ders: string;
  konu: string;
  hedef: string;
}

export interface DenemeDersSatir {
  ders: string;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  yanlisKonular: string; // JSON string dizisi
}

export interface DenemeSatir {
  id: string;
  ad: string;
  tur: string;
  tarih: Date;
  net: number;
  dersler?: DenemeDersSatir[];
}

export interface ProfilDers {
  ders: string;
  seviye: string; // "İyi" | "Orta" | "Zayıf"
  bilinen: string[];
  eksik: string[];
}

export interface Profil {
  sinav: string; // "YKS" | "LGS"
  gunlukSaat: number;
  tarih: string;
  notlar: string;
  dersler: ProfilDers[];
}

export interface OzelDersSatir {
  id: string;
  ders: string;
  konu: string;
  tarih: Date;
  saat: string;
  sure: number;
  ucret: number;
  odendi: boolean;
  durum: string;
  olusturan: string;
}

export interface OdevSatir {
  durum: string;
}

export interface TakipSatir {
  tamamlandi: boolean;
}

/** DenemeDers.yanlisKonular JSON sütununu güvenle diziye çevirir */
export function yanlisKonulariAyristir(json: string | null | undefined): string[] {
  try {
    const v = JSON.parse(json || "[]");
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

/** Kullanici.profil JSON sütununu güvenle Profil'e çevirir */
export function profilAyristir(json: string | null | undefined): Profil | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json);
    return v && Array.isArray(v.dersler) ? (v as Profil) : null;
  } catch {
    return null;
  }
}

/* ── Yol haritası (oyunlaştırılmış ilerleme) ─────────────── */

export type YolDurum = "tamamlandi" | "aktif" | "kilitli";

/** Her adımın oyun durumu: sadece sıradaki adım aktif, sonrakiler kilitli */
export function yolDurumlu<T extends YolAdimiSatir>(adimlar: T[]): (T & { durum: YolDurum })[] {
  const liste = [...adimlar].sort((a, b) => a.sira - b.sira);
  let aktifVerildi = false;
  return liste.map((a) => {
    let durum: YolDurum = "tamamlandi";
    if (!a.tamamlandi) {
      durum = aktifVerildi ? "kilitli" : "aktif";
      aktifVerildi = true;
    }
    return { ...a, durum };
  });
}

export interface XpOzet {
  xp: number;
  seviye: number;
  seviyeIci: number; // bir sonraki seviyeye ilerleme (0-99)
  tamamlanan: number;
  toplam: number;
  yuzde: number;
  rozetler: { ikon: string; ad: string }[];
}

export function xpOzet(adimlar: YolAdimiSatir[]): XpOzet {
  const tamamlanan = adimlar.filter((x) => x.tamamlandi);
  const xp = tamamlanan.reduce((t, x) => t + (x.xp || 50), 0);
  const seviye = Math.floor(xp / 100) + 1;
  const yuzde = adimlar.length ? Math.round((100 * tamamlanan.length) / adimlar.length) : 0;
  const rozetler: { ikon: string; ad: string }[] = [];
  if (tamamlanan.length >= 1) rozetler.push({ ikon: "🚀", ad: "İlk Adım" });
  if (tamamlanan.length >= 3) rozetler.push({ ikon: "🔥", ad: "3 Adım Serisi" });
  if (adimlar.length && yuzde >= 50) rozetler.push({ ikon: "🌗", ad: "Yarı Yol" });
  if (xp >= 300) rozetler.push({ ikon: "💎", ad: "300 XP Kulübü" });
  if (adimlar.length && yuzde === 100) rozetler.push({ ikon: "🏆", ad: "Yol Tamamlandı" });
  return {
    xp,
    seviye,
    seviyeIci: xp % 100,
    tamamlanan: tamamlanan.length,
    toplam: adimlar.length,
    yuzde,
    rozetler,
  };
}

/* ── Zayıf konu analizi ──────────────────────────────────────
   Denemelerdeki "yanlış yapılan konular" + başlangıç formundaki
   eksik konuları birleştirip sıklığa göre sıralar. */

export interface ZayifKonu {
  ders: string;
  konu: string;
  kez: number;
  kaynaklar: string[];
}

export function zayifKonular(denemeler: DenemeSatir[], profil: Profil | null): ZayifKonu[] {
  const sayac: Record<string, ZayifKonu> = {};
  function ekle(ders: string, konu: string, kaynak: string) {
    const k = String(konu || "").trim();
    if (!k) return;
    const anahtar = (ders + "||" + k).toLocaleLowerCase("tr-TR");
    if (!sayac[anahtar]) sayac[anahtar] = { ders, konu: k, kez: 0, kaynaklar: [] };
    sayac[anahtar].kez++;
    if (!sayac[anahtar].kaynaklar.includes(kaynak)) sayac[anahtar].kaynaklar.push(kaynak);
  }
  denemeler.forEach((dn) =>
    (dn.dersler || []).forEach((dr) =>
      yanlisKonulariAyristir(dr.yanlisKonular).forEach((k) => ekle(dr.ders, k, "deneme"))
    )
  );
  if (profil) {
    (profil.dersler || []).forEach((pd) =>
      (pd.eksik || []).forEach((k) => ekle(pd.ders, k, "başlangıç formu"))
    );
  }
  return Object.values(sayac).sort(
    (a, b) => b.kez - a.kez || a.ders.localeCompare(b.ders, "tr")
  );
}

/* ── Özel ders ─────────────────────────────────────────────── */

/** Bildirim metinlerinde kullanılan kısa ders tanımı */
export function ozelDersMetni(x: { ders: string; konu: string; tarih: Date | string; saat: string }): string {
  return (
    x.ders + (x.konu ? " – " + x.konu : "") + " · " + tarihStr(x.tarih) + (x.saat ? " " + x.saat : "")
  );
}

export interface OzelDersOzet {
  toplam: number;
  yapilan: number;
  planlanan: number;
  toplamSaat: number;
  bekleyenUcret: number;
  sonraki: OzelDersSatir | null;
  gecikenPlan: number;
  onayBekleyenKoc: number; // öğrencinin talebi koçun onayını bekliyor
  onayBekleyenOgr: number; // koçun önerisi öğrencinin onayını bekliyor
}

/** Özel ders özeti: yapılan/planlı sayısı, toplam saat, bekleyen ödeme, sıradaki ders */
export function ozelDersOzet(liste: OzelDersSatir[]): OzelDersOzet {
  const sirali = [...liste].sort((a, b) =>
    (isoTarih(a.tarih) + "T" + (a.saat || "")).localeCompare(isoTarih(b.tarih) + "T" + (b.saat || ""))
  );
  const yapilan = sirali.filter((x) => x.durum === "yapildi");
  const planli = sirali.filter((x) => x.durum === "planlandi");
  const simdi = bugun();
  const gelecek = planli.filter((x) => isoTarih(x.tarih) >= simdi);
  const toplamDk = yapilan.reduce((t, x) => t + (+x.sure || 0), 0);
  const talepler = sirali.filter((x) => x.durum === "talep");
  return {
    toplam: sirali.length,
    yapilan: yapilan.length,
    planlanan: planli.length,
    toplamSaat: Math.round(toplamDk / 6) / 10,
    bekleyenUcret: yapilan.filter((x) => !x.odendi).reduce((t, x) => t + (+x.ucret || 0), 0),
    sonraki: gelecek.length ? gelecek[0] : null,
    gecikenPlan: planli.filter((x) => isoTarih(x.tarih) < simdi).length,
    onayBekleyenKoc: talepler.filter((x) => x.olusturan === "ogrenci").length,
    onayBekleyenOgr: talepler.filter((x) => x.olusturan === "koc").length,
  };
}

/* ── Özet istatistik ─────────────────────────────────────── */

export interface OgrenciOzet {
  odevToplam: number;
  odevTamam: number;
  odevYuzde: number;
  takipToplam: number;
  takipTamam: number;
  takipYuzde: number;
  sonNet: number | null;
  netFarki: number | null;
  yolYuzde: number;
  xp: number;
  seviye: number;
}

export function ogrenciOzet(
  odevler: OdevSatir[],
  takip: TakipSatir[],
  denemeler: DenemeSatir[],
  yolAdimlari: YolAdimiSatir[]
): OgrenciOzet {
  const dn = [...denemeler].sort((a, b) => isoTarih(a.tarih).localeCompare(isoTarih(b.tarih)));
  const yolOz = xpOzet(yolAdimlari);
  const odevTamam = odevler.filter((x) => x.durum === "tamamlandi").length;
  const takipTamam = takip.filter((x) => x.tamamlandi).length;
  return {
    odevToplam: odevler.length,
    odevTamam,
    odevYuzde: odevler.length ? Math.round((100 * odevTamam) / odevler.length) : 0,
    takipToplam: takip.length,
    takipTamam,
    takipYuzde: takip.length ? Math.round((100 * takipTamam) / takip.length) : 0,
    sonNet: dn.length ? dn[dn.length - 1].net : null,
    netFarki: dn.length >= 2 ? +(dn[dn.length - 1].net - dn[dn.length - 2].net).toFixed(2) : null,
    yolYuzde: yolOz.yuzde,
    xp: yolOz.xp,
    seviye: yolOz.seviye,
  };
}
