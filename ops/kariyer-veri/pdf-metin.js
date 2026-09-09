/* ÖSYM kılavuz PDF'inden düz metin çıkarır.
   Nesne dizini + nesne akışları (ObjStm) + sayfa ağacı + font çözümü
   (ToUnicode; yoksa gömülü TTF cmap tersi) + içerik akışındaki metin
   işleçleri. Tablo 5 program adları Identity-H composite fontla
   basıldığı için bu çözüm olmadan okunamaz.

   Yalnız programlari-guncelle.js tarafından kullanılır; genel amaçlı
   bir PDF kütüphanesi değildir, bu tek kılavuzun düzenine göre yazıldı. */
"use strict";
const zlib = require("zlib");
const BS = String.fromCharCode(92);

/** @param {Buffer} tampon  @returns {string[]} sayfa sırasına göre metin satırları */
function pdfMetni(tampon) {
const pdf = tampon.toString("latin1");

/* ── 1. Nesne dizini ─────────────────────────────────────────── */
const nesne = new Map();
{
  const re = /(\d+)\s+(\d+)\s+obj\b/g;
  let m;
  while ((m = re.exec(pdf))) nesne.set(Number(m[1]), m.index + m[0].length);
}
const gomulu = new Map();                     // ObjStm içinden çıkan nesneler
function govde(id) {
  if (gomulu.has(id)) return gomulu.get(id);
  const b = nesne.get(id);
  if (b === undefined) return null;
  const son = pdf.indexOf("endobj", b);
  return pdf.slice(b, son < 0 ? b + 200000 : son);
}
function ref(s) { const m = /^\s*(\d+)\s+\d+\s+R/.exec(s || ""); return m ? Number(m[1]) : null; }
/** Sözlükten anahtarın ham değerini alır (iç içe << >> ve [ ] dengelenir). */
function alan(sozluk, ad) {
  const i = sozluk.indexOf("/" + ad);
  if (i < 0) return null;
  let j = i + ad.length + 1;
  while (j < sozluk.length && /\s/.test(sozluk[j])) j++;
  if (sozluk[j] === "<" && sozluk[j + 1] === "<") {
    let d = 0, k = j;
    for (; k < sozluk.length; k++) {
      if (sozluk[k] === "<" && sozluk[k + 1] === "<") { d++; k++; }
      else if (sozluk[k] === ">" && sozluk[k + 1] === ">") { d--; k++; if (!d) { k++; break; } }
    }
    return sozluk.slice(j, k);
  }
  if (sozluk[j] === "[") {
    let d = 0, k = j;
    for (; k < sozluk.length; k++) {
      if (sozluk[k] === "[") d++;
      else if (sozluk[k] === "]") { d--; if (!d) { k++; break; } }
    }
    return sozluk.slice(j, k);
  }
  const son = sozluk.slice(j).search(/[\/\]\>\n\r]/);
  return sozluk.slice(j, son < 0 ? sozluk.length : j + son).trim();
}
/** Nesnenin akışını açar. */
function akis(id) {
  const g = govde(id);
  if (g === null) return null;
  const i = g.search(/stream\r?\n/);
  if (i < 0) return null;
  const bas = i + /stream\r?\n/.exec(g)[0].length;
  const son = g.indexOf("endstream", bas);
  const ham = Buffer.from(g.slice(bas, son), "latin1");
  if (/\/FlateDecode/.test(g.slice(0, i))) {
    try { return zlib.inflateSync(ham).toString("latin1"); } catch { return null; }
  }
  return ham.toString("latin1");
}

/* ── 1b. Nesne akışlarını (ObjStm) aç ────────────────────────── */
for (const id of [...nesne.keys()]) {
  const g = govde(id);
  if (!g || !/\/Type\s*\/ObjStm/.test(g)) continue;
  const ic = akis(id);
  if (!ic) continue;
  const n = Number(alan(g, "N")), ilk = Number(alan(g, "First"));
  if (!n || Number.isNaN(ilk)) continue;
  const bas = ic.slice(0, ilk).trim().split(/\s+/).map(Number);
  for (let i = 0; i < n; i++) {
    const no = bas[i * 2], off = bas[i * 2 + 1];
    const sonOff = i + 1 < n ? ilk + bas[(i + 1) * 2 + 1] : ic.length;
    if (!Number.isFinite(no)) continue;
    gomulu.set(no, ic.slice(ilk + off, sonOff));
  }
}

/* ── 2. ToUnicode CMap ───────────────────────────────────────── */
function cmapCoz(metin) {
  const harita = new Map();
  const onalti = h => {
    let s = "";
    for (let i = 0; i + 3 < h.length + 1; i += 4) s += String.fromCharCode(parseInt(h.substr(i, 4), 16));
    return s;
  };
  const bfchar = /beginbfchar([\s\S]*?)endbfchar/g;
  let m;
  while ((m = bfchar.exec(metin))) {
    const ciftler = m[1].match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) || [];
    for (const c of ciftler) {
      const p = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/.exec(c);
      harita.set(parseInt(p[1], 16), onalti(p[2]));
    }
  }
  const bfrange = /beginbfrange([\s\S]*?)endbfrange/g;
  while ((m = bfrange.exec(metin))) {
    const govdeM = m[1];
    const satirRe = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(?:<([0-9A-Fa-f]+)>|\[([\s\S]*?)\])/g;
    let r;
    while ((r = satirRe.exec(govdeM))) {
      const bas = parseInt(r[1], 16), son = parseInt(r[2], 16);
      if (r[3] !== undefined) {
        const kok = parseInt(r[3], 16);
        for (let k = bas; k <= son; k++) harita.set(k, String.fromCodePoint(kok + (k - bas)));
      } else {
        const oge = r[4].match(/<([0-9A-Fa-f]+)>/g) || [];
        oge.forEach((o, i) => harita.set(bas + i, onalti(o.slice(1, -1))));
      }
    }
  }
  return harita;
}

/* ── 2b. ToUnicode yoksa: gömülü TTF cmap'ini ters çevir ─────── */
function tablolariOku(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const sayi = dv.getUint16(4), tablolar = {};
  for (let i = 0; i < sayi; i++) {
    const o = 12 + i * 16;
    const etiket = String.fromCharCode(u8[o], u8[o + 1], u8[o + 2], u8[o + 3]);
    tablolar[etiket] = { basla: dv.getUint32(o + 8), uzunluk: dv.getUint32(o + 12) };
  }
  return { dv, tablolar };
}
function cmapOku(dv, basla) {
  const sayi = dv.getUint16(basla + 2);
  let secilen = -1, enIyi = -1;
  for (let i = 0; i < sayi; i++) {
    const p = basla + 4 + i * 8;
    const pid = dv.getUint16(p), eid = dv.getUint16(p + 2);
    const alt = basla + dv.getUint32(p + 4);
    const skor = (pid === 3 && eid === 10) ? 4 : (pid === 3 && eid === 1) ? 3 : (pid === 0) ? 2 : 1;
    if (skor > enIyi) { enIyi = skor; secilen = alt; }
  }
  if (secilen < 0) return new Map();
  const bicim = dv.getUint16(secilen), harita = new Map();
  if (bicim === 4) {
    const segX2 = dv.getUint16(secilen + 6), seg = segX2 / 2;
    const sonO = secilen + 14, basO = sonO + segX2 + 2, deltaO = basO + segX2, aralikO = deltaO + segX2;
    for (let i = 0; i < seg; i++) {
      const son = dv.getUint16(sonO + i * 2), bas = dv.getUint16(basO + i * 2);
      const delta = dv.getInt16(deltaO + i * 2), ao = dv.getUint16(aralikO + i * 2);
      if (bas === 0xFFFF) continue;
      for (let k = bas; k <= son && k !== 0x10000; k++) {
        let g;
        if (ao === 0) g = (k + delta) & 0xFFFF;
        else { g = dv.getUint16(aralikO + i * 2 + ao + (k - bas) * 2); if (g) g = (g + delta) & 0xFFFF; }
        if (g) harita.set(k, g);
      }
    }
  } else if (bicim === 12) {
    const grup = dv.getUint32(secilen + 12);
    for (let i = 0; i < grup; i++) {
      const p = secilen + 16 + i * 12;
      const b = dv.getUint32(p), s = dv.getUint32(p + 4), g = dv.getUint32(p + 8);
      for (let k = b; k <= s; k++) harita.set(k, g + (k - b));
    }
  }
  return harita;
}
const ttfOnbellek = new Map();
function glifHaritasi(fontGovde) {
  // Type0 → DescendantFonts → FontDescriptor → FontFile2
  const dRef = alan(fontGovde, "DescendantFonts");
  const dId = dRef && (ref(dRef) || (/(\d+)\s+\d+\s+R/.exec(dRef) && Number(/(\d+)\s+\d+\s+R/.exec(dRef)[1])));
  const dGovde = dId ? (govde(dId) || "") : fontGovde;
  const fdId = ref(alan(dGovde, "FontDescriptor"));
  if (!fdId) return null;
  const fd = govde(fdId) || "";
  const ffId = ref(alan(fd, "FontFile2"));
  if (!ffId) return null;
  if (ttfOnbellek.has(ffId)) return ttfOnbellek.get(ffId);
  let harita = null;
  try {
    const ttf = Buffer.from(akis(ffId), "latin1");
    const { dv, tablolar } = tablolariOku(new Uint8Array(ttf));
    if (tablolar.cmap) {
      const uni = cmapOku(dv, tablolar.cmap.basla);
      harita = new Map();
      for (const [u, g] of uni) if (!harita.has(g)) harita.set(g, String.fromCodePoint(u));
    }
  } catch { harita = null; }
  ttfOnbellek.set(ffId, harita);
  return harita;
}

/* ── 3. Sayfa kaynaklarındaki fontlar ────────────────────────── */
function sayfaFontlari(kaynakMetni) {
  const fontlar = new Map();                    // /ad → {bayt, harita}
  const fd = alan(kaynakMetni, "Font");
  if (!fd) return fontlar;
  const sozluk = fd.startsWith("<<") ? fd : (govde(ref(fd)) || "");
  const re = /\/([A-Za-z0-9_.]+)\s+(\d+)\s+\d+\s+R/g;
  let m;
  while ((m = re.exec(sozluk))) {
    const fg = govde(Number(m[2])) || "";
    const composite = /\/Type0/.test(fg) || /Identity-H/.test(fg);
    const tuRef = ref(alan(fg, "ToUnicode"));
    let harita = null;
    if (tuRef) { const c = akis(tuRef); if (c) harita = cmapCoz(c); }
    // Yalnız composite (Identity-H) fontta kodlar glif no'dur; basit fontta
    // kod = karakter kodudur, glif haritası uygulanırsa harfler bozulur.
    if (composite && (!harita || !harita.size)) harita = glifHaritasi(fg);
    fontlar.set(m[1], { bayt: composite ? 2 : 1, harita });
  }
  return fontlar;
}

/* ── 4. İçerik akışından metin ───────────────────────────────── */
function dizgeCoz(ham, font) {
  // ham: ( ... ) ya da < ... >
  if (ham[0] === "<") {
    const h = ham.slice(1, -1).replace(/\s+/g, "");
    let out = "";
    const adim = font && font.bayt === 2 ? 4 : 2;
    for (let i = 0; i + adim <= h.length; i += adim) {
      const kod = parseInt(h.substr(i, adim), 16);
      out += font && font.harita && font.harita.has(kod) ? font.harita.get(kod) : String.fromCharCode(kod);
    }
    return out;
  }
  let str = ham.slice(1, -1), out = "";
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === BS) {
      const n = str[++i];
      if (n === "n" || n === "r") out += " ";
      else if (n >= "0" && n <= "7") {
        let o = n;
        while (o.length < 3 && str[i + 1] >= "0" && str[i + 1] <= "7") o += str[++i];
        out += String.fromCharCode(parseInt(o, 8));
      } else out += n;
    } else out += c;
  }
  if (font && font.bayt === 2) {                 // ( ) içinde de CID olabilir
    let cid = "";
    for (let i = 0; i + 1 < out.length; i += 2) {
      const kod = (out.charCodeAt(i) << 8) | out.charCodeAt(i + 1);
      cid += font.harita && font.harita.has(kod) ? font.harita.get(kod) : "";
    }
    return cid;
  }
  if (font && font.harita && font.harita.size) {  // basit fontta da ToUnicode varsa uygula
    let ç = "";
    for (const ch of out) ç += font.harita.has(ch.charCodeAt(0)) ? font.harita.get(ch.charCodeAt(0)) : ch;
    return ç;
  }
  return out;
}

const DIZGE = "\\((?:[^()" + BS + BS + "]|" + BS + BS + "[\\s\\S])*\\)|<[0-9A-Fa-f\\s]*>";
const ISLEC = new RegExp(
  "/([A-Za-z0-9_.]+)\\s+[\\d.]+\\s+Tf" +
  "|(" + DIZGE + ")\\s*(?:Tj|')" +
  "|\\[((?:" + DIZGE + "|[^\\[\\]])*)\\]\\s*TJ" +
  "|(-?[\\d.]+)\\s+(-?[\\d.]+)\\s+(?:Td|TD)" +
  "|(-?[\\d.]+)\\s+(-?[\\d.]+)\\s+(-?[\\d.]+)\\s+(-?[\\d.]+)\\s+(-?[\\d.]+)\\s+(-?[\\d.]+)\\s+Tm", "g");

function sayfaMetni(icerik, fontlar) {
  const satirlar = [];
  let sat = "", font = null, sonY = null;
  let m;
  ISLEC.lastIndex = 0;
  while ((m = ISLEC.exec(icerik))) {
    if (m[1] !== undefined) { font = fontlar.get(m[1]) || null; continue; }
    if (m[2] !== undefined) { sat += dizgeCoz(m[2].trim(), font); continue; }
    if (m[3] !== undefined) {
      const par = new RegExp(DIZGE + "|(-?[\\d.]+)", "g");
      let p;
      while ((p = par.exec(m[3]))) {
        if (p[0][0] === "(" || p[0][0] === "<") sat += dizgeCoz(p[0].trim(), font);
        else if (parseFloat(p[0]) < -150) sat += " ";
      }
      continue;
    }
    const y = m[5] !== undefined ? parseFloat(m[5]) : parseFloat(m[11]);
    const mutlak = m[5] === undefined;
    if (sat && (mutlak ? sonY === null || Math.abs(y - sonY) > 0.5 : Math.abs(y) > 0.5)) {
      satirlar.push(sat); sat = "";
    }
    sonY = mutlak ? y : (sonY === null ? y : sonY + y);
  }
  if (sat) satirlar.push(sat);
  return satirlar;
}

/* ── 5. Sayfaları gez ────────────────────────────────────────── */
const cikti = [];
let sayfaNo = 0;
const sayfaRe = /\/Type\s*\/Page[^s]/g;
for (const id of nesne.keys()) {
  const g = govde(id);
  if (!g) continue;
  sayfaRe.lastIndex = 0;
  if (!sayfaRe.test(g)) continue;
  sayfaNo++;
  const kaynakHam = alan(g, "Resources");
  const kaynak = kaynakHam && kaynakHam.startsWith("<<") ? kaynakHam : (govde(ref(kaynakHam)) || "");
  const fontlar = sayfaFontlari(kaynak);
  const icHam = alan(g, "Contents");
  let icerik = "";
  if (icHam && icHam.startsWith("[")) {
    for (const r of icHam.match(/(\d+)\s+\d+\s+R/g) || []) icerik += (akis(Number(/(\d+)/.exec(r)[1])) || "") + "\n";
  } else icerik = akis(ref(icHam)) || "";
  if (!icerik) continue;
  cikti.push("=== SAYFA " + sayfaNo + " (obj " + id + ") ===");
  cikti.push(...sayfaMetni(icerik, fontlar));
}
  return cikti;
}

module.exports = { pdfMetni };
