/* ═══════════════════════════════════════════════════════════════
   BLOG İÇERİĞİ — TEK BİÇİM (CANONICAL) HTML

   Yazı gövdesi nereden gelirse gelsin (Word, Google Docs, WhatsApp,
   ChatGPT, elle yazılmış markdown, eski kayıtlardaki düz metin) tek bir
   dar HTML biçimine indirgenir:

     p · h2 · h3 · strong · em · ul · ol · li · a · blockquote · br

   Bunun dışındaki HER şey atılır: font-family, font-size, renk, zemin,
   style/class/id, span/div sarmalayıcıları, tablolar, görseller,
   script/style blokları, olay öznitelikleri… Öznitelik olarak yalnız
   <a href> yaşar (http/https/mailto/tel ya da site içi adres).

   Bu yüzden çıktı doğrudan dangerouslySetInnerHTML ile basılabilir:
   metin düğümleri kaçırılır, etiketler bu dosyanın ürettiği sabit
   dizgelerdir — girdiden hiçbir etiket/öznitelik olduğu gibi geçmez.

   Tek giriş noktası: blogIcerikNormalle()
     • HTML gelirse   → temizlenip tek biçime indirgenir
     • düz metin gelirse → markdown-lite ayrıştırıcısından geçirilir
   Fonksiyon SABİT NOKTALIDIR: normalle(normalle(x)) === normalle(x).

   Node ve tarayıcıda aynı şekilde çalışır (DOM kullanmaz): sunucu
   eyleminde kaydederken, sayfa basılırken ve editörde yapıştırırken
   aynı kod çalışsın diye saf dizge işlemesiyle yazılmıştır.
   ═══════════════════════════════════════════════════════════════ */

import { icerigiAyristir, type MetinParcasi } from "./blog";

/** Kaydedilen içerikte yaşamasına izin verilen etiketler */
export const IZINLI_ETIKETLER = [
  "p", "h2", "h3", "strong", "em", "ul", "ol", "li", "a", "blockquote", "br",
] as const;

/* ── Etiket eşlemesi ──────────────────────────────────────────
   Girdideki etiket → çıktıdaki karşılığı. Listede olmayan etiket
   "sarmalayıcı" sayılır: etiket atılır, içindeki metin kalır. */

const ESLEME: Record<string, string> = {
  // Blok kaplar — hepsi paragrafa iner
  p: "p", div: "p", section: "p", article: "p", main: "p", aside: "p",
  header: "p", footer: "p", figure: "p", figcaption: "p", address: "p",
  pre: "p", dl: "p", dt: "p", dd: "p", tr: "p", caption: "p",
  details: "p", summary: "p", fieldset: "p", legend: "p", hgroup: "p",
  // Başlıklar — h1 editöre yazılmaz, yazı başlığı ayrı alandan gelir
  h1: "h2", h2: "h2", h3: "h3", h4: "h3", h5: "h3", h6: "h3",
  // Listeler
  ul: "ul", menu: "ul", ol: "ol", li: "li",
  // Alıntı
  blockquote: "blockquote",
  // Satır içi
  b: "strong", strong: "strong",
  i: "em", em: "em", cite: "em", dfn: "em", var: "em",
  a: "a", br: "br",
};

/** İçeriğiyle birlikte tümden atılan etiketler (metni de gitmeli) */
const ICERIGIYLE_AT = new Set([
  "script", "style", "noscript", "iframe", "object", "embed", "template",
  "svg", "math", "head", "title", "meta", "link", "base", "xml", "frameset",
  "frame", "canvas", "form", "select", "textarea", "button", "option",
  "applet", "audio", "video", "map", "picture",
]);

/** Kapanış etiketi beklenmeyen (boş) etiketler */
const BOS_ETIKETLER = new Set([
  "br", "hr", "img", "input", "meta", "link", "source", "col", "area",
  "base", "embed", "param", "track", "wbr",
]);

/** Sarmalayıcı olarak atılırken araya boşluk konanlar (tablo hücreleri) */
const AYIRICI_SARMAL = new Set(["td", "th"]);

const BLOK_KAPLAR = new Set(["p", "h2", "h3", "blockquote"]);
const METIN_KABI = new Set(["p", "h2", "h3", "li", "blockquote"]);
const LISTELER = new Set(["ul", "ol"]);
const SATIR_ICI = new Set(["strong", "em", "a"]);

/* ── Kaçırma ──────────────────────────────────────────────── */

/** Metin düğümü kaçırma. Geçerli varlıklar (&amp;, &uuml;, &#39;) korunur. */
function kacirMetin(metin: string): string {
  return metin
    .replace(/&(?!#\d{1,7};|#[xX][0-9a-fA-F]{1,6};|[a-zA-Z][a-zA-Z0-9]{1,31};)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Öznitelik değeri kaçırma (yalnız href için kullanılır) */
function kacirOznitelik(deger: string): string {
  return kacirMetin(deger).replace(/"/g, "&quot;");
}

/**
 * Bağlantı adresi denetimi. Yalnız http, https, mailto, tel ve site içi
 * adresler geçer; javascript:, data:, vbscript: vb. atılır.
 * @returns güvenliyse adres, değilse null
 */
export function guvenliBaglanti(ham: string): string | null {
  const adres = String(ham ?? "")
    // Görünmez karakterlerle gizlenen "java\0script:" biçimleri
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028\u2029\ufeff]/g, "")
    .trim();
  if (!adres) return null;
  if (/^(https?:|mailto:|tel:)/i.test(adres)) return adres;
  // Site içi adres (rota, çapa, sorgu)
  if (/^[/#?][^/\\]?/.test(adres) && !/^\/\//.test(adres)) return adres;
  // Şema yoksa ve düz alan adı gibi duruyorsa https varsayılır
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:[/?#]|$)/i.test(adres)) return `https://${adres}`;
  return null;
}

/** Dış bağlantı mı (yeni sekmede açılmalı mı) */
function disBaglanti(adres: string): boolean {
  return /^https?:/i.test(adres);
}

/* ── Öznitelik okuma ──────────────────────────────────────── */

const OZNITELIK = /([a-zA-Z_:@][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/g;

function oznitelikOku(ham: string, ad: string): string {
  OZNITELIK.lastIndex = 0;
  for (const e of ham.matchAll(OZNITELIK)) {
    if (e[1].toLowerCase() === ad) return (e[2] ?? e[3] ?? e[4] ?? "").trim();
  }
  return "";
}

/* ── style'dan kalın/eğik çıkarımı ────────────────────────────
   Google Docs ve Word kalını <strong> ile değil
   <span style="font-weight:700"> ile yazar. Stil tümüyle atılacağı için
   anlamı önce kurtarılır: kalın kalın, eğik eğik kalsın.

   Ters yönü de gerekir: Docs tüm belgeyi
   <b style="font-weight:normal" id="docs-internal-guid-…"> içine sarar —
   bu <b> kalın DEĞİLDİR, yutulmalıdır. */

type Isaret = { kalin: boolean; egik: boolean; kalinDegil: boolean; egikDegil: boolean };

function stilIsaretleri(stil: string): Isaret {
  const s = stil.toLowerCase();
  const agirlik = /font-weight\s*:\s*([a-z0-9]+)/.exec(s)?.[1] ?? "";
  const bicim = /font-style\s*:\s*([a-z]+)/.exec(s)?.[1] ?? "";
  return {
    kalin: agirlik === "bold" || agirlik === "bolder" || /^[6-9]00$/.test(agirlik),
    kalinDegil: agirlik === "normal" || agirlik === "lighter" || /^[1-5]00$/.test(agirlik),
    egik: bicim === "italic" || bicim === "oblique",
    egikDegil: bicim === "normal",
  };
}

/* ── Ön temizlik ──────────────────────────────────────────────
   Yorumlar (Word'ün <!--[if !supportLists]--> koşullu blokları dâhil),
   DOCTYPE, CDATA ve işlem yönergeleri etiket sayılmaz; ayrıştırmadan
   önce atılır. */

function onTemizlik(ham: string): string {
  return ham
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "")
    .replace(/<\?[\s\S]*?\?>/g, "")
    .replace(/<![^>]*>/g, "");
}

/* ── Ayrıştırıcı ──────────────────────────────────────────────
   Etiketler bir yığınla izlenir; çıktı dizgesi yalnız bu dosyanın
   yazdığı etiketlerden oluşur, dolayısıyla her zaman dengelidir. */

const ETIKET = /<(\/?)([a-zA-Z][a-zA-Z0-9:_-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;

/** Yığın kaydı: bir girdi etiketinin açtığı çıktı etiketleri */
type Kayit = { girdi: string; cikti: string[] };

export function htmlTemizle(ham: string): string {
  const kaynak = onTemizlik(String(ham ?? ""));
  const cikti: string[] = [];
  const yigin: Kayit[] = [];
  /* İç içe liste düzleştirilirken yutulan <ul>/<ol> sayısı: kapanışları da
     yutulmalı, yoksa iç listenin </ul>'si dıştakini kapatır. */
  let yutulanListe = 0;

  /* ── yığın yardımcıları ── */
  const acikEtiketler = (): string[] => yigin.flatMap((k) => k.cikti);

  function enIcKap(): string | null {
    const a = acikEtiketler();
    for (let i = a.length - 1; i >= 0; i--) if (METIN_KABI.has(a[i])) return a[i];
    return null;
  }
  function acikListe(): string | null {
    const a = acikEtiketler();
    for (let i = a.length - 1; i >= 0; i--) if (LISTELER.has(a[i])) return a[i];
    return null;
  }
  function kayitKapat(kayit: Kayit) {
    for (let i = kayit.cikti.length - 1; i >= 0; i--) cikti.push(`</${kayit.cikti[i]}>`);
  }
  /** Belirli bir çıktı etiketini (ve üstünde kalan her şeyi) kapatır */
  function ciktiKapat(hedef: string) {
    for (let i = yigin.length - 1; i >= 0; i--) {
      if (yigin[i].cikti.includes(hedef)) {
        while (yigin.length > i) kayitKapat(yigin.pop()!);
        return;
      }
    }
  }
  /** Açık satır içi biçimleri kapatır (kaba/listeye dokunmaz) */
  function satirIciKapat() {
    while (yigin.length) {
      const ust = yigin[yigin.length - 1];
      if (ust.cikti.some((t) => METIN_KABI.has(t) || LISTELER.has(t))) break;
      kayitKapat(yigin.pop()!);
    }
  }
  function kabiKapat() {
    satirIciKapat();
    const kap = enIcKap();
    if (kap) ciktiKapat(kap);
  }
  function hepsiniKapat() {
    while (yigin.length) kayitKapat(yigin.pop()!);
  }
  function ac(girdi: string, etiketler: string[], acilis?: string) {
    for (const t of etiketler) cikti.push(acilis && t === etiketler[0] ? acilis : `<${t}>`);
    yigin.push({ girdi, cikti: etiketler });
  }

  /** Metin yazılabilmesi için bir kap açık olmalı */
  function kapGerekli() {
    if (!enIcKap()) ac("", ["p"]);
  }

  function metinYaz(ham: string) {
    const metin = ham
      .replace(/&nbsp;|&#0*160;|&#x0*a0;/gi, " ")
      .replace(/[\s\u00a0]+/g, " ");
    if (!metin.trim()) {
      // Kap içindeki tek boşluk sözcükleri ayırır; kap dışındaki atılır
      if (enIcKap() && metin) cikti.push(" ");
      return;
    }
    kapGerekli();
    cikti.push(kacirMetin(metin));
  }

  /* ── belge dolaşımı ── */
  let son = 0;
  for (const e of kaynak.matchAll(ETIKET)) {
    const indeks = e.index ?? 0;
    if (indeks > son) metinYaz(kaynak.slice(son, indeks));
    son = indeks + e[0].length;

    const kapanis = e[1] === "/";
    const girdi = e[2].toLowerCase().replace(/^o:/, ""); // Word'ün o:p etiketi
    const oznitelikler = e[3] ?? "";

    /* İçeriğiyle atılanlar: kapanışına kadar her şey yutulur */
    if (ICERIGIYLE_AT.has(girdi)) {
      if (!kapanis && !BOS_ETIKETLER.has(girdi)) {
        const kapa = new RegExp(`</\\s*${girdi}\\s*>`, "i");
        const kalan = kaynak.slice(son);
        const bul = kapa.exec(kalan);
        son += bul ? bul.index + bul[0].length : kalan.length;
      }
      continue;
    }

    if (kapanis) {
      if (yutulanListe > 0 && LISTELER.has(ESLEME[girdi])) {
        yutulanListe--;
        continue;
      }
      for (let i = yigin.length - 1; i >= 0; i--) {
        if (yigin[i].girdi === girdi) {
          while (yigin.length > i) kayitKapat(yigin.pop()!);
          break;
        }
      }
      continue;
    }

    const stil = stilIsaretleri(oznitelikOku(oznitelikler, "style"));
    let hedef: string | undefined = ESLEME[girdi];

    // Docs'un <b style="font-weight:normal"> sarmalı kalın değildir
    if (hedef === "strong" && stil.kalinDegil) hedef = undefined;
    if (hedef === "em" && stil.egikDegil) hedef = undefined;

    /* ── Sarmalayıcı (span, font, tablo, bilinmeyen etiket…) ──
       Etiket atılır, metni kalır; style'daki kalın/eğik kurtarılır. */
    if (!hedef) {
      if (BOS_ETIKETLER.has(girdi)) continue;
      if (AYIRICI_SARMAL.has(girdi) && enIcKap()) cikti.push(" ");
      const isaretler: string[] = [];
      const acik = acikEtiketler();
      if (stil.kalin && !acik.includes("strong")) isaretler.push("strong");
      if (stil.egik && !acik.includes("em")) isaretler.push("em");
      if (isaretler.length) kapGerekli();
      ac(girdi, isaretler);
      continue;
    }

    /* ── br ── */
    if (hedef === "br") {
      if (enIcKap()) cikti.push("<br>");
      continue;
    }

    /* ── Blok kaplar: p, h2, h3, blockquote ── */
    if (BLOK_KAPLAR.has(hedef)) {
      const kap = enIcKap();
      // Madde ya da alıntı içindeki blok yeni kap açmaz; satır atlar
      if (kap === "li" || (kap === "blockquote" && hedef !== "blockquote")) {
        cikti.push("<br>");
        ac(girdi, []);
        continue;
      }
      kabiKapat();
      const liste = acikListe();
      if (liste) ciktiKapat(liste);
      ac(girdi, [hedef]);
      continue;
    }

    /* ── Listeler ── */
    if (LISTELER.has(hedef)) {
      // İç içe liste düzleştirilir: maddeler dıştaki listede toplanır
      if (acikListe()) {
        yutulanListe++;
        continue;
      }
      kabiKapat();
      ac(girdi, [hedef]);
      continue;
    }

    if (hedef === "li") {
      satirIciKapat();
      if (enIcKap() === "li") ciktiKapat("li");
      if (!acikListe()) {
        const kap = enIcKap();
        if (kap) ciktiKapat(kap);
        ac("", ["ul"]);
      }
      ac(girdi, ["li"]);
      continue;
    }

    /* ── Bağlantı ── */
    if (hedef === "a") {
      const adres = guvenliBaglanti(oznitelikOku(oznitelikler, "href"));
      // Adres yoksa/güvensizse etiket atılır, metni kalır
      if (!adres || acikEtiketler().includes("a")) {
        ac(girdi, []);
        continue;
      }
      kapGerekli();
      const ek = disBaglanti(adres) ? ' target="_blank" rel="noopener noreferrer nofollow"' : "";
      ac(girdi, ["a"], `<a href="${kacirOznitelik(adres)}"${ek}>`);
      continue;
    }

    /* ── strong / em ── */
    if (SATIR_ICI.has(hedef)) {
      if (acikEtiketler().includes(hedef)) {
        ac(girdi, []); // aynı biçim zaten açık; iç içe yazılmaz
        continue;
      }
      kapGerekli();
      ac(girdi, [hedef]);
      continue;
    }
  }

  if (son < kaynak.length) metinYaz(kaynak.slice(son));
  hepsiniKapat();

  return sonRotus(cikti.join(""));
}

/* ── Son rötuş ────────────────────────────────────────────────
   Ayrıştırıcının bıraktığı boş kapları, sarkan <br>'leri ve fazla
   boşlukları temizler; iki <br> gören paragrafı ikiye böler; Word /
   WhatsApp yapıştırmalarında madde işaretiyle başlayan paragrafları
   gerçek listeye çevirir. */

const KAP_DESENI = "p|h2|h3|li|blockquote";

function sonRotus(ham: string): string {
  let html = ham;

  // Kap içindeki başı/sonu boşluklar
  html = html
    .replace(new RegExp(`(<(?:${KAP_DESENI})>)\\s+`, "g"), "$1")
    .replace(new RegExp(`\\s+(</(?:${KAP_DESENI})>)`, "g"), "$1")
    .replace(/\s+(<\/(?:strong|em|a)>)/g, "$1 ")
    .replace(/(<(?:strong|em)>)\s+/g, " $1");

  // İki ve daha çok <br> → paragraf kırılması
  html = html.replace(/<p>((?:(?!<\/?p>)[\s\S])*)<\/p>/g, (tam, ic: string) => {
    if (!/(?:<br>\s*){2,}/.test(ic)) return tam;
    return ic
      .split(/(?:<br>\s*){2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${p}</p>`)
      .join("");
  });

  html = maddeParagraflari(html);

  // Boş kaplar, sarkan <br>'ler, boş biçim etiketleri
  let onceki = "";
  while (onceki !== html) {
    onceki = html;
    html = html
      .replace(new RegExp(`(<(${KAP_DESENI})>)(\\s|<br>)+`, "g"), "$1")
      .replace(new RegExp(`(\\s|<br>)+(</(?:${KAP_DESENI})>)`, "g"), "$2")
      .replace(new RegExp(`<(${KAP_DESENI})>\\s*</\\1>`, "g"), "")
      .replace(/<(strong|em)>\s*<\/\1>/g, "")
      .replace(/<a\b[^>]*>\s*<\/a>/g, "")
      .replace(/<(ul|ol)>\s*<\/\1>/g, "")
      .replace(/\s{2,}/g, " ");
  }

  return html.trim();
}

/* Madde işaretiyle başlayan paragraf dizileri gerçek listeye çevrilir.
   Word listeyi çoğu zaman <p class=MsoListParagraph>• metin</p> olarak,
   WhatsApp'tan gelen metin ise "- metin" satırları olarak yapışır. */

const MADDE_BASI = /^(?:[-–—*•·▪◦‣]|\(?(\d{1,2})[.)])\s+/;

function maddeParagraflari(html: string): string {
  const parcalar = html.match(/<(p|h2|h3|ul|ol|blockquote)>[\s\S]*?<\/\1>/g);
  if (!parcalar) return html;
  // Güvenlik ağı: parçalar belgeyi tam kapsamıyorsa hiç dokunulmaz
  if (parcalar.join("").length !== html.length) return html;

  type Madde = { ic: string; ham: string; sira: number };
  const sonuc: string[] = [];
  let liste: { etiket: "ul" | "ol"; maddeler: Madde[] } | null = null;

  const listeyiKapat = () => {
    if (!liste) return;
    /* Tek maddelik "liste" büyük olasılıkla listenin değil, tire ile
       başlayan bir cümlenin işaretidir. Sıralı listede ilk madde 1
       değilse de dokunulmaz — "12. sınıf …" diye başlayan paragraflar
       listeye dönüşmesin. İkisinde de paragraflar olduğu gibi kalır. */
    const gercek =
      liste.maddeler.length > 1 && (liste.etiket === "ul" || liste.maddeler[0].sira === 1);
    if (gercek) {
      const iceri = liste.maddeler.map((m) => `<li>${m.ic}</li>`).join("");
      sonuc.push(`<${liste.etiket}>${iceri}</${liste.etiket}>`);
    } else {
      for (const m of liste.maddeler) sonuc.push(m.ham);
    }
    liste = null;
  };

  for (const parca of parcalar) {
    const p = /^<p>([\s\S]*)<\/p>$/.exec(parca);
    const ic = p?.[1] ?? "";
    // İşareti ararken açık etiketler atlanır ("<strong>• …")
    const isaret = p ? MADDE_BASI.exec(ic.replace(/<[^>]*>/g, "")) : null;
    if (!isaret) {
      listeyiKapat();
      sonuc.push(parca);
      continue;
    }
    const etiket: "ul" | "ol" = isaret[1] ? "ol" : "ul";
    if (liste && liste.etiket !== etiket) listeyiKapat();
    if (!liste) liste = { etiket, maddeler: [] };
    liste.maddeler.push({
      ham: parca,
      sira: Number(isaret[1] ?? 0),
      ic: ic.replace(/^((?:<[^>]*>)*)\s*/, "$1").replace(MADDE_BASI, ""),
    });
  }
  listeyiKapat();
  return sonuc.join("");
}

/* ── Düz metin (markdown-lite) → HTML ─────────────────────────
   Eski kayıtlar ve düz metin yapıştırmaları için. Ayrıştırma
   lib/blog.ts'teki icerigiAyristir ile yapılır (tek kaynak). */

function parcalarHtml(parcalar: MetinParcasi[]): string {
  return parcalar
    .map((p) => {
      if (p.tur === "kalin") return `<strong>${kacirMetin(p.deger)}</strong>`;
      if (p.tur === "egik") return `<em>${kacirMetin(p.deger)}</em>`;
      if (p.tur === "baglanti") {
        const adres = guvenliBaglanti(p.adres);
        if (!adres) return kacirMetin(p.deger);
        return `<a href="${kacirOznitelik(adres)}">${kacirMetin(p.deger)}</a>`;
      }
      return kacirMetin(p.deger);
    })
    .join("");
}

export function duzMetinHtml(metin: string): string {
  const html: string[] = [];
  for (const b of icerigiAyristir(metin)) {
    switch (b.tur) {
      case "baslik":
        html.push(`<h${b.seviye}>${parcalarHtml(b.parcalar)}</h${b.seviye}>`);
        break;
      case "alinti":
        html.push(`<blockquote>${parcalarHtml(b.parcalar)}</blockquote>`);
        break;
      case "liste": {
        const etiket = b.sirali ? "ol" : "ul";
        const maddeler = b.maddeler.map((m) => `<li>${parcalarHtml(m)}</li>`).join("");
        html.push(`<${etiket}>${maddeler}</${etiket}>`);
        break;
      }
      case "ayirici":
        // Ayırıcı çizgi izinli etiketler arasında değil; atlanır
        break;
      default:
        html.push(`<p>${parcalarHtml(b.parcalar)}</p>`);
    }
  }
  return html.join("");
}

/* ── Biçim sezgisi ───────────────────────────────────────────── */

const HTML_IZI =
  /<\/?(?:p|div|span|h[1-6]|ul|ol|li|br|strong|em|b|i|a|blockquote|table|tr|td|font|section|article|pre|img|hr)\b[^>]*>/i;

/** İçerik HTML mi, yoksa (eski kayıtlardaki gibi) düz metin mi */
export function htmlMi(metin: string): boolean {
  return HTML_IZI.test(String(metin ?? ""));
}

/**
 * Blog gövdesinin tek normalleştiricisi. Kaydederken, sayfayı basarken
 * ve editöre yüklerken hep bu çağrılır — böylece eski düz metin kayıtlar
 * da yeni standarda kendiliğinden uyar.
 *
 * Sabit noktalıdır: çıktısını yeniden vermek çıktıyı değiştirmez.
 */
export function blogIcerikNormalle(ham: string): string {
  const kaynak = String(ham ?? "").trim();
  if (!kaynak) return "";
  return htmlTemizle(htmlMi(kaynak) ? kaynak : duzMetinHtml(kaynak));
}
