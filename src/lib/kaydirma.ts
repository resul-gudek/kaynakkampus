/* ── KAYDIRMA (SCROLL) DAVRANIŞI · ÇAĞRI ARAYÜZÜ ─────────────────────
   Panel ve Next sayfalarındaki çok adımlı akışlar (başvuru sihirbazı,
   süreli test, sekmeli paneller) bu modülü kullanır.
   Statik sayfalardaki karşılığı: public/assets/kk-kaydir.js (KKKaydir).

   Çözülen problem: "seç → sayfanın en üstüne fırla → tekrar aşağı kaydır".
   Adım değiştiğinde kullanıcı çalışma alanında kalmalı, üst bara geri
   gönderilmemeli.

   Üç senaryo ayrılır:
     A. Gerçekten yeni bir sayfaya geçiş → tarayıcı/Next normal davranır
        (gerekirse basaGit() açıkça çağrılır).
     B. Aynı akışta içerik değişimi → hizala(): çalışma alanı korunur,
        hedef zaten görünüyorsa hiç kımıldanmaz.
     C. Yeni adım ekran dışında → gorunurKil(): yalnız gerektiği kadar.

     import { hizala, gorunurKil, ustBosluk } from "@/lib/kaydirma";

     hizala(kabuk.current);            // adım değişti: alanın başına
     gorunurKil(hataKutusu);           // yalnız ekran dışındaysa getir

   ÖLÇÜ SABİT DEĞİL: yapışkan/sabit üst barın yüksekliği her seferinde
   ölçülür, böylece telefon, tablet, akıllı tahta ve dar panel modunda
   aynı kod doğru sonucu verir.
   ------------------------------------------------------------------ */

export type KaydirmaSecenek = {
  /** Hedefin üstünde bırakılacak ek pay (px) — varsayılan 12 */
  bosluk?: number;
  /** Hedef görünse de hizala */
  zorla?: boolean;
  /** Varsayılan: smooth; kullanıcı hareketi azalttıysa auto */
  davranis?: ScrollBehavior;
};

const VARSAYILAN_BOSLUK = 12;
const TOLERANS = 6; // bu kadar sapma "hizalı" sayılır

let onbellekUst = 0;
let onbellekGecerli = false;

function tarayici(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function azaltilmisHareket(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function davranisSec(sec?: KaydirmaSecenek): ScrollBehavior {
  if (sec?.davranis) return sec.davranis;
  return azaltilmisHareket() ? "auto" : "smooth";
}

function eleman(hedef: Element | string | null | undefined): Element | null {
  if (!hedef) return null;
  if (typeof hedef === "string") return document.querySelector(hedef);
  return hedef;
}

/* ── Yapışkan üst bar ölçümü ───────────────────────────────────────
   Seçici listesi tutmuyoruz: gövdenin sığ katmanları taranır ve
   position:sticky/fixed olup tepeye yapışanlar toplanır. Böylece panel
   üst barı, site başlığı ve sonradan eklenen herhangi bir yapışkan
   şerit kendiliğinden hesaba katılır.

   Ölçülen şey "şu anki yeri" değil, YAPIŞTIĞINDA kaplayacağı yerdir:
   sayfa başındayken yapışkan başlığın üstünde duyuru şeridi olabilir ve
   o an tepede görünmez — ama kaydırma bittiğinde tepeyi kaplar. Bu
   ayrım olmadan hizalanan içerik başlığın altında kalıyordu.

   İki koruma: top payı 0 olmayanlar (mobil çekmece, kenar çubuğu)
   sayılmaz; viewport'un %40'ından yüksek olanlar (açık kip pencere /
   perde) başlık sanılmaz. */
const TARAMA_SINIRI = 400; // gezilecek en fazla düğüm (başlıklar sığ durur)

function adaylar(): Element[] {
  const liste: Element[] = [];
  let sayac = 0;
  const gez = (el: Element, derinlik: number) => {
    for (const c of Array.from(el.children)) {
      if (sayac >= TARAMA_SINIRI) return;
      const t = c.tagName;
      if (t === "SCRIPT" || t === "STYLE" || t === "LINK" || t === "TEMPLATE") continue;
      liste.push(c);
      sayac++;
      if (derinlik > 0) gez(c, derinlik - 1);
    }
  };
  if (document.body) gez(document.body, 3);
  if (document.elementsFromPoint) {
    const gen = window.innerWidth || 0;
    for (const x of [Math.round(gen / 2), 6, Math.max(0, gen - 6)]) {
      try {
        liste.push(...(document.elementsFromPoint(x, 1) || []));
      } catch {
        /* nokta okuması başarısızsa sığ tarama yeter */
      }
    }
  }
  return liste;
}

/** Adayın yapıştığında viewport tepesinde kaplayacağı yükseklik (px). */
function adayPayi(el: Element, yuk: number): number {
  if (!el || el === document.body || el === document.documentElement) return 0;
  let stil: CSSStyleDeclaration;
  try {
    stil = window.getComputedStyle(el);
  } catch {
    return 0;
  }
  const kon = stil.position;
  if (kon !== "fixed" && kon !== "sticky") return 0;
  if (stil.visibility === "hidden" || stil.display === "none") return 0;
  const r = el.getBoundingClientRect();
  if (!r.height || !r.width) return 0;
  if (yuk && r.height > yuk * 0.4) return 0; // perde / kip pencere
  const t = parseFloat(stil.top);
  if (!isFinite(t) || t > 4 || t < -1) return 0; // tepeye yapışmıyor
  if (kon === "fixed") return r.top > 4 ? 0 : r.bottom;
  return Math.max(0, t) + r.height; // sticky: yapışınca
}

function olcUst(): number {
  if (!tarayici()) return 0;
  const yuk = window.innerHeight || 0;
  let en = 0;
  for (const el of adaylar()) {
    const p = adayPayi(el, yuk);
    if (p > en) en = p;
  }
  return Math.max(0, Math.round(en));
}

/** Yapışkan üst barın ölçülen yüksekliği (px). */
export function ustBosluk(): number {
  if (!tarayici()) return 0;
  if (!onbellekGecerli) {
    onbellekUst = olcUst();
    onbellekGecerli = true;
    /* Yerel #bağlantı sıçramaları ve scrollIntoView çağrıları da aynı
       payı kullansın: globals.css içinde
       html { scroll-padding-top: var(--kk-yapiskan-ust, 0px) } */
    try {
      document.documentElement.style.setProperty("--kk-yapiskan-ust", `${onbellekUst}px`);
    } catch {
      /* stil yazılamıyorsa hizalama yine JS ile çalışır */
    }
  }
  return onbellekUst;
}

/** Ölçümü tazele (yerleşim elle değiştiyse). */
export function olc(): number {
  onbellekGecerli = false;
  return ustBosluk();
}

if (tarayici()) {
  const bayatla = () => {
    onbellekGecerli = false;
  };
  window.addEventListener("resize", bayatla);
  window.addEventListener("orientationchange", bayatla);
  window.visualViewport?.addEventListener("resize", bayatla);
  /* Ölçüm kaydırma konumundan bağımsızdır; yerleşim değişimlerinde
     (panel dar/geniş kenar çubuğu gibi) bu olayla tazelenir. */
  document.addEventListener("kk-yerlesim-degisti", bayatla);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => olc());
  } else {
    olc();
  }
}

function kaydir(y: number, davranis: ScrollBehavior) {
  window.scrollTo({ top: Math.max(0, Math.round(y)), behavior: davranis });
}

function simdikiY(): number {
  return window.pageYOffset || document.documentElement.scrollTop || 0;
}

/**
 * B/C senaryosu — çalışma alanına ya da yeni adıma hizala.
 *
 * Hedef yapışkan barın hemen altına hizalanır, ama yalnız gerektiğinde:
 * zaten hizalıysa ya da bütünüyle görünüyorsa kımıldanmaz. Hiçbir
 * durumda "sayfanın tepesine git" davranışı üretmez.
 *
 * @returns kaydırma yapıldıysa true
 */
export function hizala(
  hedef: Element | string | null | undefined,
  sec?: KaydirmaSecenek,
): boolean {
  if (!tarayici()) return false;
  const el = eleman(hedef);
  if (!el) return false;
  const pay = sec?.bosluk ?? VARSAYILAN_BOSLUK;
  const ust = ustBosluk() + pay;
  const r = el.getBoundingClientRect();

  if (!sec?.zorla) {
    if (Math.abs(r.top - ust) <= TOLERANS) return false; // hizalı
    if (r.top >= ust && r.bottom <= window.innerHeight) return false; // görünür
  }
  kaydir(simdikiY() + r.top - ust, davranisSec(sec));
  return true;
}

/**
 * C senaryosu — yalnız ekran dışında kalıyorsa en az kaydırma.
 * Hedefin üstü görünüyorsa hiç dokunmaz.
 */
export function gorunurKil(
  hedef: Element | string | null | undefined,
  sec?: KaydirmaSecenek,
): boolean {
  if (!tarayici()) return false;
  const el = eleman(hedef);
  if (!el) return false;
  const pay = sec?.bosluk ?? VARSAYILAN_BOSLUK;
  const ust = ustBosluk() + pay;
  const dip = window.innerHeight;
  const r = el.getBoundingClientRect();

  if (r.top >= ust && r.top < dip) return false; // başı görünüyor: yeter
  if (r.top < ust) {
    kaydir(simdikiY() + r.top - ust, davranisSec(sec));
    return true;
  }
  if (r.height <= dip - ust) {
    kaydir(simdikiY() + r.bottom - dip + pay, davranisSec(sec));
  } else {
    kaydir(simdikiY() + r.top - ust, davranisSec(sec));
  }
  return true;
}

/**
 * Yeniden çizim sırasında göz hizasını koru: `capa` çizim öncesindeki
 * ekran hizasında tutulur. React'te layout effect içinde kullanılır.
 */
export function konumuKoru<T>(ciz: () => T, capa: Element | string): T {
  if (!tarayici()) return ciz();
  const onceki = eleman(capa)?.getBoundingClientRect().top ?? null;
  const sonuc = ciz();
  if (onceki == null) return sonuc;
  const yeni = eleman(capa);
  if (!yeni) return sonuc;
  const fark = yeni.getBoundingClientRect().top - onceki;
  if (Math.abs(fark) > 1) kaydir(simdikiY() + fark, "auto");
  return sonuc;
}

/** A senaryosu — bilinçli olarak sayfanın tepesine (nadiren gerekir). */
export function basaGit(sec?: KaydirmaSecenek) {
  if (!tarayici()) return;
  kaydir(0, davranisSec(sec));
}
