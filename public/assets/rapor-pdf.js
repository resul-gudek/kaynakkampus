/* ═══════════════════════════════════════════════════════════════════════════
   RAPOR PDF — tarayıcıda gerçek .pdf dosyası üretir (yazdırma ekranı olmadan)

   Neden kendi yazıcımız var: yazdırma diyaloğu kullanıcıyı ikinci bir ekrana
   götürüyor, mobilde çoğu tarayıcıda "PDF olarak kaydet" seçeneği ya yok ya da
   gizli. Bu modül sayfadaki sonuç bloklarını okuyup vektör metinli, aranabilir
   ve Türkçe karakterleri bozulmayan bir PDF üretir; sonucu Blob olarak verir.

   Türkçe için gömülü font şart: PDF'in gömülü olmayan standart fontları
   (Helvetica vb.) ğ, ş, ı, İ gibi harfleri güvenilir biçimde taşımaz. Bu yüzden
   Poppins TTF yüklenip, yalnızca kullanılan glifler alınarak PDF'e gömülür.

   Kullanım:
     const blob = await RaporPDF.uret({ bloklar, ... });
     await RaporPDF.indir(blob, "dosya.pdf");
     await RaporPDF.paylas(blob, "dosya.pdf", { baslik, metin });
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ═════════════ 1. TTF OKUMA VE ALT KÜME ÇIKARMA ═════════════ */

  /** TTF'in tablo dizinini çözer. */
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

  /** cmap'ten "unicode → glif no" haritası çıkarır (format 4 ve 12). */
  function cmapOku(dv, basla) {
    const sayi = dv.getUint16(basla + 2);
    let secilen = -1, enIyiSkor = -1;
    for (let i = 0; i < sayi; i++) {
      const p = basla + 4 + i * 8;
      const pid = dv.getUint16(p), eid = dv.getUint16(p + 2);
      const alt = basla + dv.getUint32(p + 4);
      const skor = (pid === 3 && eid === 10) ? 4 : (pid === 3 && eid === 1) ? 3 : (pid === 0) ? 2 : 1;
      if (skor > enIyiSkor) { enIyiSkor = skor; secilen = alt; }
    }
    if (secilen < 0) throw new Error("cmap bulunamadı");
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
    } else throw new Error("cmap biçimi desteklenmiyor: " + bicim);
    return harita;
  }

  /** loca tablosunu glif başlangıç dizisine çevirir. */
  function locaOku(dv, tablolar, glifSayisi, uzunBicim) {
    const b = tablolar.loca.basla, off = new Uint32Array(glifSayisi + 1);
    for (let i = 0; i <= glifSayisi; i++) {
      off[i] = uzunBicim ? dv.getUint32(b + i * 4) : dv.getUint16(b + i * 2) * 2;
    }
    return off;
  }

  /** Bileşik glifin parçalarını bulur (ç, ğ gibi harfler bileşiktir). */
  function bilesenler(dv, glyfBasla, off, gid) {
    const bas = glyfBasla + off[gid], son = glyfBasla + off[gid + 1];
    if (son - bas < 10) return [];
    if (dv.getInt16(bas) >= 0) return [];             // düz glif
    const cocuk = [];
    let p = bas + 10;
    for (;;) {
      if (p + 4 > son) break;
      const bayrak = dv.getUint16(p), gi = dv.getUint16(p + 2);
      cocuk.push(gi);
      p += 4 + ((bayrak & 0x0001) ? 4 : 2);           // ARG_1_AND_2_ARE_WORDS
      if (bayrak & 0x0008) p += 2;                    // WE_HAVE_A_SCALE
      else if (bayrak & 0x0040) p += 4;               // X_AND_Y_SCALE
      else if (bayrak & 0x0080) p += 8;               // TWO_BY_TWO
      if (!(bayrak & 0x0020)) break;                  // MORE_COMPONENTS
    }
    return cocuk;
  }

  function u16(n) { return [(n >> 8) & 255, n & 255]; }
  function u32(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]; }

  /** Tablo sağlama toplamı (TrueType). */
  function toplam(u8) {
    let t = 0;
    for (let i = 0; i < u8.length; i += 4) {
      t = (t + ((u8[i] << 24) | ((u8[i + 1] || 0) << 16) | ((u8[i + 2] || 0) << 8) | (u8[i + 3] || 0))) >>> 0;
    }
    return t >>> 0;
  }

  /**
   * Fontu yalnızca kullanılan gliflerle yeniden yazar.
   * Glif numaraları KORUNUR (yalnız kullanılmayanların verisi boşaltılır);
   * böylece cmap ve hmtx olduğu gibi kalabilir, bileşik glif referansları bozulmaz.
   */
  function altKume(font, gidler) {
    const { dv, tablolar, u8 } = font;
    const glifSayisi = font.glifSayisi;
    const tut = new Set([0]);
    const yigin = [...gidler];
    while (yigin.length) {
      const g = yigin.pop();
      if (g == null || g < 0 || g >= glifSayisi || tut.has(g)) continue;
      tut.add(g);
      for (const c of bilesenler(dv, tablolar.glyf.basla, font.loca, g)) if (!tut.has(c)) yigin.push(c);
    }

    // glyf + loca yeniden kur (loca uzun biçim: eşleme/hizalama sorunu kalmaz)
    const parcalar = [], yeniLoca = new Uint32Array(glifSayisi + 1);
    let imlec = 0;
    for (let g = 0; g < glifSayisi; g++) {
      yeniLoca[g] = imlec;
      if (tut.has(g)) {
        const b = tablolar.glyf.basla + font.loca[g], s = tablolar.glyf.basla + font.loca[g + 1];
        if (s > b) { parcalar.push(u8.subarray(b, s)); imlec += s - b; }
      }
    }
    yeniLoca[glifSayisi] = imlec;

    const glyf = new Uint8Array(imlec);
    let y = 0; for (const p of parcalar) { glyf.set(p, y); y += p.length; }
    const loca = new Uint8Array((glifSayisi + 1) * 4);
    for (let i = 0; i <= glifSayisi; i++) {
      const v = yeniLoca[i];
      loca[i * 4] = (v >>> 24) & 255; loca[i * 4 + 1] = (v >>> 16) & 255;
      loca[i * 4 + 2] = (v >>> 8) & 255; loca[i * 4 + 3] = v & 255;
    }

    // head: loca biçimini uzuna çevir, checkSumAdjustment sıfırla
    const head = u8.slice(tablolar.head.basla, tablolar.head.basla + tablolar.head.uzunluk);
    head[8] = head[9] = head[10] = head[11] = 0;
    head[50] = 0; head[51] = 1;

    // post: ad tablosu gerekmiyor, 32 baytlık 3.0 sürümü yeter
    const post = new Uint8Array([0, 3, 0, 0, ...u32(0), ...u16(0), ...u16(0), ...u32(0),
      ...u32(0), ...u32(0), ...u32(0), ...u32(0), ...u32(0)]).slice(0, 32);

    const kopya = e => u8.slice(tablolar[e].basla, tablolar[e].basla + tablolar[e].uzunluk);
    const yeni = { cmap: kopya("cmap"), glyf, head, hhea: kopya("hhea"),
      hmtx: kopya("hmtx"), loca, maxp: kopya("maxp"), post };
    if (tablolar["OS/2"]) yeni["OS/2"] = kopya("OS/2");

    // Tablo dizini etiket sırasına göre yazılır (spesifikasyon gereği)
    const etiketler = Object.keys(yeni).sort();
    const n = etiketler.length;
    let arama = 1, log2 = 0; while (arama * 2 <= n) { arama *= 2; log2++; }
    const bas = [...u32(0x00010000), ...u16(n), ...u16(arama * 16), ...u16(log2), ...u16(n * 16 - arama * 16)];
    const dizinBoy = 12 + n * 16;
    let konum = dizinBoy;
    const dizin = [], govde = [];
    for (const e of etiketler) {
      const t = yeni[e], dolgu = (4 - (t.length % 4)) % 4;
      dizin.push(...[e.charCodeAt(0), e.charCodeAt(1), e.charCodeAt(2), e.charCodeAt(3)],
        ...u32(toplam(t)), ...u32(konum), ...u32(t.length));
      govde.push(t); if (dolgu) govde.push(new Uint8Array(dolgu));
      konum += t.length + dolgu;
    }
    const cikti = new Uint8Array(konum);
    cikti.set(new Uint8Array(bas), 0);
    cikti.set(new Uint8Array(dizin), 12);
    let o = dizinBoy; for (const p of govde) { cikti.set(p, o); o += p.length; }

    // head.checkSumAdjustment
    const ayar = (0xB1B0AFBA - toplam(cikti)) >>> 0;
    const headYeri = dizinBoy + etiketler.slice(0, etiketler.indexOf("head")).reduce((a, e) => {
      const t = yeni[e]; return a + t.length + ((4 - (t.length % 4)) % 4);
    }, 0);
    cikti.set(new Uint8Array(u32(ayar)), headYeri + 8);
    return cikti;
  }

  /** TTF baytlarından ölçüm ve kodlama için gereken her şeyi hazırlar. */
  function fontHazirla(u8, ad) {
    const { dv, tablolar } = tablolariOku(u8);
    if (!tablolar.glyf || !tablolar.loca) throw new Error("Yalnızca TrueType (glyf) fontlar desteklenir");
    const upem = dv.getUint16(tablolar.head.basla + 18);
    const uzunLoca = dv.getInt16(tablolar.head.basla + 50) === 1;
    const glifSayisi = dv.getUint16(tablolar.maxp.basla + 4);
    const loca = locaOku(dv, tablolar, glifSayisi, uzunLoca);
    const cmap = cmapOku(dv, tablolar.cmap.basla);

    // hmtx: glif genişlikleri (son değer eksik glifler için tekrarlanır)
    const metrikSayisi = dv.getUint16(tablolar.hhea.basla + 34);
    const genislik = new Uint16Array(glifSayisi);
    let sonG = 0;
    for (let g = 0; g < glifSayisi; g++) {
      if (g < metrikSayisi) sonG = dv.getUint16(tablolar.hmtx.basla + g * 4);
      genislik[g] = sonG;
    }
    const oc = tablolar["OS/2"] ? tablolar["OS/2"].basla : 0;
    const os2Sur = oc ? dv.getUint16(oc) : 0;
    return {
      ad, u8, dv, tablolar, upem, glifSayisi, loca, cmap, genislik,
      kutu: [dv.getInt16(tablolar.head.basla + 36), dv.getInt16(tablolar.head.basla + 38),
             dv.getInt16(tablolar.head.basla + 40), dv.getInt16(tablolar.head.basla + 42)],
      yukari: dv.getInt16(tablolar.hhea.basla + 4),
      asagi: dv.getInt16(tablolar.hhea.basla + 6),
      buyukBoy: (oc && os2Sur >= 2) ? dv.getInt16(oc + 88) : 700,
      kullanilan: new Map(),   // gid → unicode (ToUnicode ve alt küme için)
    };
  }

  /** Bir karakterin glif numarası; fontta yoksa null. */
  function glif(font, kod) {
    const g = font.cmap.get(kod);
    return g == null ? null : g;
  }

  /* ═════════════ 2. PDF YAZICI ═════════════ */

  const enc = new TextEncoder();

  async function sikistir(u8) {
    if (typeof CompressionStream !== "function") return null;   // eski iOS: sıkıştırmasız
    try {
      const cs = new CompressionStream("deflate");              // zlib sarmalı = /FlateDecode
      const yazar = cs.writable.getWriter();
      yazar.write(u8); yazar.close();
      const parcalar = [];
      const okuyucu = cs.readable.getReader();
      for (;;) { const { done, value } = await okuyucu.read(); if (done) break; parcalar.push(value); }
      let boy = 0; for (const p of parcalar) boy += p.length;
      const cikti = new Uint8Array(boy);
      let o = 0; for (const p of parcalar) { cikti.set(p, o); o += p.length; }
      return cikti;
    } catch { return null; }
  }

  /**
   * Sözlük dizgesi (belge künyesi vb.).
   * Türkçe harfler ASCII dışı olduğu için UTF-16BE onaltılık biçimde yazılır;
   * düz "(...)" gösterimi künyede ş, ğ, â gibi harfleri bozar.
   */
  function pdfDizge(s) {
    const metin = String(s == null ? "" : s).replace(/[\r\n]/g, " ");
    if (!/[^\x20-\x7E]/.test(metin)) {
      return "(" + metin.replace(/[\\()]/g, c => "\\" + c) + ")";
    }
    let hex = "FEFF";
    for (let i = 0; i < metin.length; i++) hex += metin.charCodeAt(i).toString(16).padStart(4, "0");
    return "<" + hex.toUpperCase() + ">";
  }

  class Pdf {
    constructor() {
      this.nesneler = [];        // 1'den başlayan nesne gövdeleri (string | {akis})
      this.sayfalar = [];
    }
    yer() { this.nesneler.push(null); return this.nesneler.length; }
    koy(id, govde) { this.nesneler[id - 1] = govde; return id; }
    ekle(govde) { const id = this.yer(); return this.koy(id, govde); }

    /** Nesneleri birleştirip PDF baytlarını üretir. */
    async serile() {
      const parcalar = [], konumlar = [];
      let uzunluk = 0;
      const yaz = veri => {
        const u8 = typeof veri === "string" ? enc.encode(veri) : veri;
        parcalar.push(u8); uzunluk += u8.length;
      };
      yaz("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
      for (let i = 0; i < this.nesneler.length; i++) {
        konumlar[i] = uzunluk;
        const g = this.nesneler[i];
        yaz(`${i + 1} 0 obj\n`);
        if (g && g.akis) {
          let veri = g.akis, ek = g.sozluk || "";
          // Kendi süzgecini bildiren akış (JPEG = /DCTDecode) yeniden sıkıştırılmaz;
          // sözlükte ikinci bir /Filter anahtarı görüntüyü bozar.
          if (!/\/Filter\b/.test(ek)) {
            const sik = await sikistir(veri);
            if (sik && sik.length < veri.length) { veri = sik; ek += " /Filter /FlateDecode"; }
          }
          yaz(`<< ${ek} /Length ${veri.length} >>\nstream\n`);
          yaz(veri);
          yaz("\nendstream");
        } else {
          yaz(g);
        }
        yaz("\nendobj\n");
      }
      const xref = uzunluk;
      yaz(`xref\n0 ${this.nesneler.length + 1}\n0000000000 65535 f \n`);
      for (let i = 0; i < this.nesneler.length; i++) {
        yaz(String(konumlar[i]).padStart(10, "0") + " 00000 n \n");
      }
      yaz(`trailer\n<< /Size ${this.nesneler.length + 1} /Root ${this.kokId} 0 R /Info ${this.bilgiId} 0 R >>\n`
        + `startxref\n${xref}\n%%EOF\n`);
      const cikti = new Uint8Array(uzunluk);
      let o = 0; for (const p of parcalar) { cikti.set(p, o); o += p.length; }
      return cikti;
    }
  }

  /* ═════════════ 3. SAYFA DÜZENİ ═════════════ */

  const SAYFA = { g: 595.28, y: 841.89 };
  const KENAR = { sol: 44, sag: 44, ust: 46, alt: 56 };
  const ICG = SAYFA.g - KENAR.sol - KENAR.sag;          // içerik genişliği

  const R = {                                           // marka renkleri
    bordo: [0.478, 0.125, 0.208],                       // #7A2035
    gul:   [0.753, 0.388, 0.494],
    metin: [0.184, 0.204, 0.239],
    soluk: [0.333, 0.314, 0.353],
    cizgi: [0.886, 0.839, 0.855],
    zemin: [0.976, 0.965, 0.969],
    beyaz: [1, 1, 1],
  };

  function renkAyir(css, varsayilan) {
    if (!css) return varsayilan;
    const h = String(css).trim().match(/^#?([0-9a-f]{6})$/i);
    if (h) {
      const n = parseInt(h[1], 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    const r = String(css).match(/rgba?\(([^)]+)\)/i);
    if (r) {
      const p = r[1].split(",").map(v => parseFloat(v));
      return [p[0] / 255, p[1] / 255, p[2] / 255];
    }
    return varsayilan;
  }

  const s2 = n => (Math.round(n * 100) / 100).toString();

  /** Renk her koşulda üç sayıya iner: tek bir NaN tüm sayfa akışını bozar. */
  function guvenliRenk(renk) {
    if (typeof renk === "string") renk = renkAyir(renk, R.metin);
    if (!Array.isArray(renk)) return R.metin;
    return [0, 1, 2].map(i => {
      const v = Number(renk[i]);
      return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
    });
  }

  /** Tek bir PDF'i kuran, blok listesini sayfalara yerleştiren düzen motoru. */
  class Duzen {
    constructor(fontlar, ustBilgi) {
      this.pdf = new Pdf();
      this.f = fontlar;                 // { normal, kalin }
      this.ust = ustBilgi;
      this.sayfaOps = [];
      this.y = 0;
      this.yeniSayfa(true);
    }

    /* — düşük seviye çizim — */
    op(s) { this.sayfaOps[this.sayfaOps.length - 1].push(s); }
    dolgu(renk) { const r = guvenliRenk(renk); this.op(`${s2(r[0])} ${s2(r[1])} ${s2(r[2])} rg`); }
    kalem(renk) { const r = guvenliRenk(renk); this.op(`${s2(r[0])} ${s2(r[1])} ${s2(r[2])} RG`); }
    kutuCiz(x, yUst, g, y, renk, kalinlik) {
      const alt = SAYFA.y - yUst - y;
      if (renk) { this.dolgu(renk); this.op(`${s2(x)} ${s2(alt)} ${s2(g)} ${s2(y)} re f`); }
      if (kalinlik) { this.op(`${s2(kalinlik)} w`); this.op(`${s2(x)} ${s2(alt)} ${s2(g)} ${s2(y)} re S`); }
    }
    cizgiCiz(x1, y1, x2, y2, kalinlik) {
      this.op(`${s2(kalinlik || 1)} w ${s2(x1)} ${s2(SAYFA.y - y1)} m ${s2(x2)} ${s2(SAYFA.y - y2)} l S`);
    }

    /* — metin ölçümü ve yazımı — */
    /** Fontta karşılığı olmayan karakterleri (emoji vb.) ayıklar. */
    temizle(metin, font) {
      let s = String(metin == null ? "" : metin).replace(/\s+/g, " ");
      let cikti = "";
      for (const ch of s) {
        const kod = ch.codePointAt(0);
        if (glif(font, kod) != null) cikti += ch;
        else if (kod === 0x2192) cikti += ">";              // → yerine >
        else if (kod === 0x00A0) cikti += " ";
      }
      return cikti.replace(/\s{2,}/g, " ").trim();
    }
    genislik(metin, font, boyut) {
      let t = 0;
      for (const ch of metin) {
        const g = glif(font, ch.codePointAt(0));
        if (g != null) t += font.genislik[g];
      }
      return t * boyut / font.upem;
    }
    /** Metni verilen genişliğe göre satırlara böler; kelimeyi ortadan kesmez. */
    satirla(metin, font, boyut, gen) {
      const satirlar = [];
      for (const paragraf of metin.split("\n")) {
        const kelimeler = paragraf.split(" ").filter(k => k !== "");
        if (!kelimeler.length) { satirlar.push(""); continue; }
        let satir = "";
        for (const k of kelimeler) {
          const deneme = satir ? satir + " " + k : k;
          if (this.genislik(deneme, font, boyut) <= gen || !satir) {
            // tek kelime bile sığmıyorsa harf harf kır (uzun bağlantı vb.)
            if (!satir && this.genislik(k, font, boyut) > gen) {
              let parca = "";
              for (const ch of k) {
                if (this.genislik(parca + ch, font, boyut) > gen && parca) { satirlar.push(parca); parca = ch; }
                else parca += ch;
              }
              satir = parca;
            } else satir = deneme;
          } else { satirlar.push(satir); satir = k; }
        }
        if (satir) satirlar.push(satir);
      }
      return satirlar;
    }
    /** Tek satır metni yazar; hizalama: sol | orta | sag. */
    satirYaz(metin, x, y, font, boyut, renk, hiza) {
      if (!metin) return;
      let gid = "";
      for (const ch of metin) {
        const g = glif(font, ch.codePointAt(0));
        if (g == null) continue;
        font.kullanilan.set(g, ch.codePointAt(0));
        gid += g.toString(16).padStart(4, "0");
      }
      if (!gid) return;
      let bx = x;
      if (hiza === "orta") bx = x - this.genislik(metin, font, boyut) / 2;
      else if (hiza === "sag") bx = x - this.genislik(metin, font, boyut);
      this.dolgu(renk || R.metin);
      this.op(`BT /${font.pdfAd} ${s2(boyut)} Tf 1 0 0 1 ${s2(bx)} ${s2(SAYFA.y - y - boyut * 0.8)} Tm <${gid}> Tj ET`);
    }

    /* — sayfa yönetimi — */
    yeniSayfa(ilk) {
      this.sayfaOps.push([]);
      this.y = KENAR.ust;
      this.tazeSayfa = true;
      if (ilk) this.ustBilgiCiz(); else this.y = KENAR.ust + 8;
    }
    kalanYer() { return SAYFA.y - KENAR.alt - this.y; }
    /**
     * İstenen yükseklik sığmıyorsa yeni sayfaya geçer.
     * Boş sayfaya da sığmayan bir blok olursa (sayfadan uzun tek parça) sayfa
     * açmaya devam etmez; yoksa sonsuz döngüye girer ve tarayıcı kilitlenir.
     */
    yerAc(yukseklik) {
      if (yukseklik <= this.kalanYer()) { this.tazeSayfa = false; return false; }
      if (this.tazeSayfa) { this.tazeSayfa = false; return false; }
      this.yeniSayfa(false);
      this.tazeSayfa = false;
      return true;
    }
    bosluk(h) { this.y += h; }

    /** İlk sayfanın kurumsal başlığı: logo + marka + rapor adı. */
    ustBilgiCiz() {
      const u = this.ust;
      const yuk = 74;
      this.kutuCiz(KENAR.sol, this.y, ICG, yuk, R.bordo);
      let metinX = KENAR.sol + 18;
      if (u.logo) {
        const boy = 46, boyY = boy * (u.logoOran || 1);
        const alt = SAYFA.y - this.y - (yuk + boyY) / 2;
        this.op(`q ${s2(boy)} 0 0 ${s2(boyY)} ${s2(KENAR.sol + 16)} ${s2(alt)} cm /ImLogo Do Q`);
        metinX = KENAR.sol + 16 + boy + 14;
      }
      this.satirYaz(u.marka, metinX, this.y + 14, this.f.kalin, 15, R.beyaz);
      this.satirYaz(u.baslik, metinX, this.y + 33, this.f.kalin, 12.5, [1, 0.88, 0.91]);
      this.satirYaz(u.altBilgi, metinX, this.y + 50, this.f.normal, 9.5, [1, 0.85, 0.89]);
      this.y += yuk + 20;
    }

    /** Her sayfanın alt bilgisi; sayfa sayısı bilindiğinde en sonda basılır. */
    altBilgileriCiz() {
      const n = this.sayfaOps.length;
      for (let i = 0; i < n; i++) {
        const kayit = this.sayfaOps;
        this.sayfaOps = [kayit[i]];
        const y = SAYFA.y - KENAR.alt + 22;
        this.kalem(R.cizgi);
        this.cizgiCiz(KENAR.sol, y - 12, SAYFA.g - KENAR.sag, y - 12, 0.7);
        this.satirYaz(this.ust.altCizgi, KENAR.sol, y - 6, this.f.normal, 8.5, R.soluk);
        this.satirYaz(`${i + 1} / ${n}`, SAYFA.g - KENAR.sag, y - 6, this.f.normal, 8.5, R.soluk, "sag");
        this.sayfaOps = kayit;
      }
    }
  }

  /* ═════════════ 4. BLOKLARI PDF'E DÖKME ═════════════ */

  const YAZI = {
    h1:  { boyut: 17, kalin: true,  onceki: 4,  sonraki: 6,  renk: R.bordo, aralik: 1.28 },
    h2:  { boyut: 13.5, kalin: true, onceki: 14, sonraki: 5, renk: R.bordo, aralik: 1.3 },
    h3:  { boyut: 11.5, kalin: true, onceki: 10, sonraki: 3, renk: R.metin, aralik: 1.32 },
    h4:  { boyut: 10,   kalin: true, onceki: 7,  sonraki: 2, renk: R.gul,   aralik: 1.32 },
    p:   { boyut: 9.6,  kalin: false, onceki: 0, sonraki: 5, renk: R.metin, aralik: 1.45 },
    not: { boyut: 8.8,  kalin: false, onceki: 0, sonraki: 6, renk: R.soluk, aralik: 1.4 },
    li:  { boyut: 9.4,  kalin: false, onceki: 0, sonraki: 2.5, renk: R.metin, aralik: 1.4 },
  };

  /** Akışkan metin bloğu: satır satır yerleşir, satır ortadan kesilmez. */
  function metinBlogu(d, metin, bicim, girinti, madde) {
    const font = bicim.kalin ? d.f.kalin : d.f.normal;
    const temiz = d.temizle(metin, font);
    if (!temiz) return;
    const gen = ICG - (girinti || 0);
    const satirlar = d.satirla(temiz, font, bicim.boyut, gen);
    const satirY = bicim.boyut * bicim.aralik;
    d.bosluk(bicim.onceki || 0);
    // Başlık tek başına sayfa sonunda kalmasın: başlık + iki satır yer ister
    const bakim = bicim.kalin ? satirY * Math.min(satirlar.length + 2, 4) : satirY;
    d.yerAc(bakim);
    for (let i = 0; i < satirlar.length; i++) {
      d.yerAc(satirY);
      if (madde && i === 0) {
        d.dolgu(R.gul);
        d.op(`${s2(KENAR.sol + (girinti || 0) - 9)} ${s2(SAYFA.y - d.y - bicim.boyut * 0.42)} m `
          + `${s2(KENAR.sol + (girinti || 0) - 5.5)} ${s2(SAYFA.y - d.y - bicim.boyut * 0.42)} l `
          + `${s2(KENAR.sol + (girinti || 0) - 7.25)} ${s2(SAYFA.y - d.y - bicim.boyut * 0.42 + 1.75)} l f`);
      }
      d.satirYaz(satirlar[i], KENAR.sol + (girinti || 0), d.y, font, bicim.boyut, bicim.renk);
      d.y += satirY;
    }
    d.bosluk(bicim.sonraki || 0);
  }

  /** Yüzde çubuğu satırı: ad, çubuk, yüzde ve yorum. */
  function cubukBlogu(d, b) {
    const adG = 132, pctG = 34, cubukG = ICG - adG - pctG - 16;
    const font = d.f.normal;
    const yorum = d.temizle(b.yorum, font);
    const yorumSatir = yorum ? d.satirla(yorum, font, 8.6, ICG - adG - 4) : [];
    const yuk = 15 + yorumSatir.length * 11.6 + 7;
    d.yerAc(yuk);
    const orta = d.y + 6;
    d.satirYaz(d.temizle(b.ad, d.f.kalin), KENAR.sol, d.y, d.f.kalin, 9.4, R.metin);
    const cx = KENAR.sol + adG;
    d.kutuCiz(cx, orta - 3.2, cubukG, 6.4, R.zemin);
    const dolu = Math.max(0, Math.min(100, b.yuzde)) / 100 * cubukG;
    if (dolu > 0) d.kutuCiz(cx, orta - 3.2, dolu, 6.4, b.renk);
    d.satirYaz("%" + b.yuzde, SAYFA.g - KENAR.sag, d.y, d.f.kalin, 9.4, b.renk, "sag");
    d.y += 15;
    for (const s of yorumSatir) {
      d.yerAc(11.6);
      d.satirYaz(s, KENAR.sol + adG, d.y, font, 8.6, R.soluk);
      d.y += 11.6;
    }
    d.bosluk(7);
  }

  /** Öne çıkan alan kartı — çerçeveli, üstünde alan rengi şeridi. */
  function ustKartBlogu(d, b) {
    const ic = 12, gen = ICG;
    const font = d.f.normal;
    const satirlar = [];
    const ekle = (metin, boyut, kalin, renk, aralik) => {
      const f = kalin ? d.f.kalin : font;
      const t = d.temizle(metin, f);
      if (!t) return;
      for (const s of d.satirla(t, f, boyut, gen - ic * 2)) {
        satirlar.push({ s, boyut, kalin, renk, y: boyut * (aralik || 1.4) });
      }
    };
    ekle(b.etiket, 8.2, true, R.gul);
    ekle(b.ad + "  %" + b.yuzde, 12.5, true, b.renk, 1.3);
    if (b.uyari) ekle(b.uyari, 8.4, false, R.gul);
    ekle(b.aciklama, 9.2, false, R.metin);
    if (b.oneri) ekle(b.oneri, 9.2, false, R.soluk);
    const yuk = satirlar.reduce((a, s) => a + s.y, 0) + ic * 2 + 3;
    d.yerAc(yuk);                                        // kart bölünmez
    d.kutuCiz(KENAR.sol, d.y, gen, yuk, R.zemin);
    d.kutuCiz(KENAR.sol, d.y, gen, 3, b.renk);
    let y = d.y + ic + 2;
    for (const s of satirlar) {
      d.satirYaz(s.s, KENAR.sol + ic, y, s.kalin ? d.f.kalin : font, s.boyut, s.renk);
      y += s.y;
    }
    d.y += yuk + 9;
  }

  /** Çerçeveli bilgi kutusu (dengeli profil notu, uyarı metni vb.). */
  function kutuBlogu(d, metin, renk) {
    const font = d.f.normal, boyut = 9.2, ic = 11;
    const temiz = d.temizle(metin, font);
    if (!temiz) return;
    const satirlar = d.satirla(temiz, font, boyut, ICG - ic * 2 - 4);
    const yuk = satirlar.length * boyut * 1.45 + ic * 2;
    d.yerAc(yuk);
    d.kutuCiz(KENAR.sol, d.y, ICG, yuk, R.zemin);
    d.kutuCiz(KENAR.sol, d.y, 3, yuk, renk || R.gul);
    let y = d.y + ic - 1;
    for (const s of satirlar) { d.satirYaz(s, KENAR.sol + ic + 4, y, font, boyut, R.metin); y += boyut * 1.45; }
    d.y += yuk + 10;
  }

  /** Alan başlığı: renkli nokta + ad + yüzde, altında ince çizgi. */
  function alanBasligi(d, b) {
    d.bosluk(9);
    d.yerAc(46);
    const cy = d.y + 5.5;
    d.dolgu(b.renk);
    daireCiz(d, KENAR.sol + 3.5, cy, 3.5);
    d.satirYaz(d.temizle(b.ad, d.f.kalin), KENAR.sol + 13, d.y, d.f.kalin, 11.2, R.metin);
    d.satirYaz("%" + b.yuzde, SAYFA.g - KENAR.sag, d.y, d.f.kalin, 11.2, b.renk, "sag");
    d.y += 16;
    d.kalem(R.cizgi);
    d.cizgiCiz(KENAR.sol, d.y - 2, SAYFA.g - KENAR.sag, d.y - 2, 0.7);
    d.bosluk(6);
  }

  function daireCiz(d, cx, cy, r) {
    const k = 0.5523 * r, ay = SAYFA.y - cy;
    d.op(`${s2(cx - r)} ${s2(ay)} m `
      + `${s2(cx - r)} ${s2(ay + k)} ${s2(cx - k)} ${s2(ay + r)} ${s2(cx)} ${s2(ay + r)} c `
      + `${s2(cx + k)} ${s2(ay + r)} ${s2(cx + r)} ${s2(ay + k)} ${s2(cx + r)} ${s2(ay)} c `
      + `${s2(cx + r)} ${s2(ay - k)} ${s2(cx + k)} ${s2(ay - r)} ${s2(cx)} ${s2(ay - r)} c `
      + `${s2(cx - k)} ${s2(ay - r)} ${s2(cx - r)} ${s2(ay - k)} ${s2(cx - r)} ${s2(ay)} c f`);
  }

  /**
   * Radar grafiği — ekrandaki SVG'nin vektör karşılığı.
   * Yeniden hesap yapmaz; ekranda kullanılan yüzdeleri alır.
   */
  function radarBlogu(d, veri) {
    const R_ = 108, etiketAlani = 96;
    const yuk = R_ * 2 + 74;
    d.yerAc(yuk);                                        // grafik asla bölünmez
    const cx = KENAR.sol + ICG / 2, cy = d.y + R_ + 30;
    const n = veri.length;
    const aci = i => (-Math.PI / 2) + i * 2 * Math.PI / n;
    const nokta = (i, r) => [cx + r * Math.cos(aci(i)), cy + r * Math.sin(aci(i))];
    const yol = (pts, kapat) => pts.map((p, i) =>
      `${s2(p[0])} ${s2(SAYFA.y - p[1])} ${i ? "l" : "m"}`).join(" ") + (kapat ? " h" : "");

    d.kalem(R.cizgi);
    for (const seviye of [25, 50, 75, 100]) {
      const pts = veri.map((_, i) => nokta(i, R_ * seviye / 100));
      d.op(`0.7 w ${yol(pts, true)} S`);
    }
    for (let i = 0; i < n; i++) {
      const p = nokta(i, R_);
      d.op(`0.7 w ${s2(cx)} ${s2(SAYFA.y - cy)} m ${s2(p[0])} ${s2(SAYFA.y - p[1])} l S`);
    }
    // veri alanı: %20 opaklık yerine açık bordo dolgu (şeffaflık grubu gerekmez)
    const dpts = veri.map((v, i) => nokta(i, R_ * Math.max(v.yuzde, 0) / 100));
    d.dolgu([0.906, 0.827, 0.847]);
    d.op(`${yol(dpts, true)} f`);
    d.kalem(R.bordo);
    d.op(`1.4 w ${yol(dpts, true)} S`);
    d.dolgu(R.bordo);
    for (const p of dpts) daireCiz(d, p[0], p[1], 2.2);

    // etiketler: sağdakiler sola, soldakiler sağa dayanır ki grafiğe binmesin
    for (let i = 0; i < n; i++) {
      const [lx, ly] = nokta(i, R_ + 16);
      const cos = Math.cos(aci(i)), sin = Math.sin(aci(i));
      const hiza = cos < -0.3 ? "sag" : cos > 0.3 ? "sol" : "orta";
      const ad = d.temizle(veri[i].ad, d.f.kalin);
      const enFazla = hiza === "orta" ? etiketAlani : etiketAlani + 10;
      const satirlar = d.satirla(ad, d.f.kalin, 8, enFazla).concat(["%" + veri[i].yuzde]);
      const ustPay = sin < -0.3 ? (satirlar.length - 1) : sin > 0.3 ? 0 : (satirlar.length - 1) / 2;
      satirlar.forEach((m, k) => {
        const yuzde = k === satirlar.length - 1;
        d.satirYaz(m, lx, ly + (k - ustPay) * 10 - 4, d.f.kalin, yuzde ? 8.2 : 8,
          yuzde ? R.bordo : R.soluk, hiza);
      });
    }
    d.y += yuk;
  }

  /** Blok listesini sırayla sayfalara döker. */
  function bloklariDok(d, gelenBloklar) {
    // Bloklar DOM'dan geldiği için renkler CSS dizgesi olabilir; çizim öncesi
    // bileşenlere ayrılır. Çağıranın verisi değiştirilmez.
    const bloklar = gelenBloklar.map(b => (b.renk == null || Array.isArray(b.renk))
      ? b : { ...b, renk: renkAyir(b.renk, R.gul) });
    for (const b of bloklar) {
      switch (b.t) {
        case "h1": metinBlogu(d, b.m, YAZI.h1); break;
        case "h2": {
          // Bölüm başlığından önce ince ayırıcı; sayfa başındaysa gerekmez
          d.bosluk(YAZI.h2.onceki);
          if (d.y > KENAR.ust + 24 && d.kalanYer() > 60) {
            d.kalem(R.cizgi);
            d.cizgiCiz(KENAR.sol, d.y - 6, SAYFA.g - KENAR.sag, d.y - 6, 0.7);
          }
          metinBlogu(d, b.m, { ...YAZI.h2, onceki: 0 });
          break;
        }
        case "h3": metinBlogu(d, b.m, YAZI.h3); break;
        case "h4": metinBlogu(d, b.m, YAZI.h4); break;
        case "p": metinBlogu(d, b.m, YAZI.p); break;
        case "not": metinBlogu(d, b.m, YAZI.not); break;
        case "li": metinBlogu(d, b.m, YAZI.li, 14, true); break;
        case "kutu": kutuBlogu(d, b.m, b.renk); break;
        case "ust": ustKartBlogu(d, b); break;
        case "bar": cubukBlogu(d, b); break;
        case "radar": radarBlogu(d, b.veri); break;
        case "alan": alanBasligi(d, b); break;
        case "bosluk": d.bosluk(b.h || 8); break;
      }
    }
  }

  /* ═════════════ 5. PDF NESNE AĞACI ═════════════ */

  async function belgeKur(d, logoJpeg) {
    const pdf = d.pdf;
    const kokId = pdf.yer(), sayfalarId = pdf.yer();
    const fontIdler = {};
    for (const anahtar of ["normal", "kalin"]) {
      const font = d.f[anahtar];
      const gidler = [...font.kullanilan.keys()];
      const ttf = altKume(font, gidler);
      const dosyaId = pdf.ekle({ akis: ttf, sozluk: `/Length1 ${ttf.length}` });

      // /W dizisi: yalnız kullanılan glif genişlikleri
      const sirali = gidler.slice().sort((a, b) => a - b);
      let w = "";
      for (let i = 0; i < sirali.length;) {
        let j = i; while (j + 1 < sirali.length && sirali[j + 1] === sirali[j] + 1) j++;
        w += `${sirali[i]} [${sirali.slice(i, j + 1).map(g =>
          Math.round(font.genislik[g] * 1000 / font.upem)).join(" ")}] `;
        i = j + 1;
      }
      const o = 1000 / font.upem;
      const tanimId = pdf.ekle(`<< /Type /FontDescriptor /FontName /${font.pdfTemel}`
        + ` /Flags 4 /FontBBox [${font.kutu.map(v => Math.round(v * o)).join(" ")}]`
        + ` /ItalicAngle 0 /Ascent ${Math.round(font.yukari * o)} /Descent ${Math.round(font.asagi * o)}`
        + ` /CapHeight ${Math.round(font.buyukBoy * o)} /StemV 80 /FontFile2 ${dosyaId} 0 R >>`);
      const altId = pdf.ekle(`<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${font.pdfTemel}`
        + ` /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >>`
        + ` /FontDescriptor ${tanimId} 0 R /DW 1000 /W [${w.trim()}] /CIDToGIDMap /Identity >>`);

      // ToUnicode: metnin kopyalanabilir ve aranabilir olması için
      const girisler = [...font.kullanilan.entries()].sort((a, b) => a[0] - b[0]);
      let bf = "";
      for (let i = 0; i < girisler.length; i += 100) {
        const dilim = girisler.slice(i, i + 100);
        bf += `${dilim.length} beginbfchar\n` + dilim.map(([g, u]) => {
          let hex;
          if (u > 0xFFFF) {                                    // vekil çift
            const v = u - 0x10000;
            hex = (0xD800 + (v >> 10)).toString(16).padStart(4, "0")
                + (0xDC00 + (v & 0x3FF)).toString(16).padStart(4, "0");
          } else hex = u.toString(16).padStart(4, "0");
          return `<${g.toString(16).padStart(4, "0")}> <${hex}>`;
        }).join("\n") + "\nendbfchar\n";
      }
      const cmapMetni = `/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n`
        + `/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n`
        + `/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\n`
        + `endcodespacerange\n${bf}endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend`;
      const uniId = pdf.ekle({ akis: enc.encode(cmapMetni) });
      fontIdler[anahtar] = pdf.ekle(`<< /Type /Font /Subtype /Type0 /BaseFont /${font.pdfTemel}`
        + ` /Encoding /Identity-H /DescendantFonts [${altId} 0 R] /ToUnicode ${uniId} 0 R >>`);
    }

    let logoId = null;
    if (logoJpeg) {
      logoId = pdf.ekle({ akis: logoJpeg.veri, sozluk: `/Type /XObject /Subtype /Image`
        + ` /Width ${logoJpeg.g} /Height ${logoJpeg.y} /ColorSpace /DeviceRGB`
        + ` /BitsPerComponent 8 /Filter /DCTDecode` });
    }

    const kaynak = `<< /Font << /F1 ${fontIdler.normal} 0 R /F2 ${fontIdler.kalin} 0 R >>`
      + (logoId ? ` /XObject << /ImLogo ${logoId} 0 R >>` : "") + " >>";
    const sayfaIdler = [];
    for (const ops of d.sayfaOps) {
      const icerikId = pdf.ekle({ akis: enc.encode(ops.join("\n")) });
      sayfaIdler.push(pdf.ekle(`<< /Type /Page /Parent ${sayfalarId} 0 R`
        + ` /MediaBox [0 0 ${s2(SAYFA.g)} ${s2(SAYFA.y)}] /Resources ${kaynak}`
        + ` /Contents ${icerikId} 0 R >>`));
    }
    pdf.koy(sayfalarId, `<< /Type /Pages /Count ${sayfaIdler.length}`
      + ` /Kids [${sayfaIdler.map(i => i + " 0 R").join(" ")}] >>`);
    pdf.koy(kokId, `<< /Type /Catalog /Pages ${sayfalarId} 0 R >>`);
    pdf.bilgiId = pdf.ekle(`<< /Title ${pdfDizge(d.ust.baslik)} /Author ${pdfDizge(d.ust.marka)}`
      + ` /Creator ${pdfDizge(d.ust.marka)} /Producer ${pdfDizge(d.ust.marka + " rapor-pdf")}`
      + ` /CreationDate ${pdfDizge(pdfTarih(new Date()))} >>`);
    pdf.kokId = kokId;
    return pdf.serile();
  }

  function pdfTarih(t) {
    const p = n => String(n).padStart(2, "0");
    const dk = -t.getTimezoneOffset();
    const isaret = dk >= 0 ? "+" : "-";
    return `D:${t.getFullYear()}${p(t.getMonth() + 1)}${p(t.getDate())}`
      + `${p(t.getHours())}${p(t.getMinutes())}${p(t.getSeconds())}`
      + `${isaret}${p(Math.floor(Math.abs(dk) / 60))}'${p(Math.abs(dk) % 60)}'`;
  }

  /* ═════════════ 6. VARLIK YÜKLEME ═════════════ */

  const onbellek = {};

  async function fontYukle(yol, ad, pdfTemel) {
    if (onbellek[yol]) return onbellek[yol];
    const yanit = await fetch(yol);
    if (!yanit.ok) throw new Error(`Font yüklenemedi (${yanit.status}): ${yol}`);
    const font = fontHazirla(new Uint8Array(await yanit.arrayBuffer()), ad);
    font.pdfAd = ad === "kalin" ? "F2" : "F1";
    font.pdfTemel = pdfTemel;
    onbellek[yol] = font;
    return font;
  }

  /** Logoyu JPEG'e çevirir; PDF'e /DCTDecode olarak doğrudan gömülebilir. */
  async function logoYukle(yol) {
    if (onbellek[yol] !== undefined) return onbellek[yol];
    try {
      const gorsel = await new Promise((coz, red) => {
        const g = new Image();
        g.onload = () => coz(g);
        g.onerror = () => red(new Error("logo yüklenemedi"));
        g.src = yol;
      });
      // Logo bordo renkli ve saydam zeminli; başlık şeridi de bordo olduğu için
      // beyaz bir rozetin üzerine yerleştirilir, yoksa görünmez olur.
      const en = 220, pay = Math.round(en * 0.1);
      const oran = gorsel.naturalHeight / gorsel.naturalWidth || 1;
      const tuval = document.createElement("canvas");
      tuval.width = en; tuval.height = Math.max(1, Math.round(en * oran));
      const c = tuval.getContext("2d");
      c.fillStyle = "#FFFFFF";
      c.fillRect(0, 0, tuval.width, tuval.height);
      c.drawImage(gorsel, pay, pay, tuval.width - pay * 2, tuval.height - pay * 2);
      const veriUrl = tuval.toDataURL("image/jpeg", 0.92);
      const ikili = atob(veriUrl.slice(veriUrl.indexOf(",") + 1));
      const u8 = new Uint8Array(ikili.length);
      for (let i = 0; i < ikili.length; i++) u8[i] = ikili.charCodeAt(i);
      onbellek[yol] = { veri: u8, g: tuval.width, y: tuval.height };
    } catch {
      onbellek[yol] = null;                          // logo olmasa da rapor üretilir
    }
    return onbellek[yol];
  }

  /* ═════════════ 7. GENEL ARAYÜZ ═════════════ */

  /**
   * PDF üretir.
   * @param {object} a - { bloklar, marka, baslik, altBilgi, altCizgi, logo, fontlar }
   * @returns {Promise<Blob>}
   */
  async function uret(a) {
    const yollar = a.fontlar || {};
    const [normal, kalin, logo] = await Promise.all([
      fontYukle(yollar.normal || "assets/fonts/Poppins-Regular.ttf", "normal", "Poppins-Regular"),
      fontYukle(yollar.kalin || "assets/fonts/Poppins-SemiBold.ttf", "kalin", "Poppins-SemiBold"),
      a.logo ? logoYukle(a.logo) : Promise.resolve(null),
    ]);
    normal.kullanilan = new Map(); kalin.kullanilan = new Map();
    const d = new Duzen({ normal, kalin }, {
      marka: a.marka || "Kaynak Kampüs",
      baslik: a.baslik || "Rapor",
      altBilgi: a.altBilgi || "",
      altCizgi: a.altCizgi || a.marka || "Kaynak Kampüs",
      logo: !!logo,
      logoOran: logo ? logo.y / logo.g : 1,
    });
    bloklariDok(d, a.bloklar || []);
    d.altBilgileriCiz();
    const baytlar = await belgeKur(d, logo);
    return new Blob([baytlar], { type: "application/pdf" });
  }

  /** Dosyayı indirir; indirme desteklenmiyorsa yeni sekmede açar. */
  async function indir(blob, dosyaAdi) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const indirilebilir = "download" in a;
    a.href = url;
    a.download = dosyaAdi;
    a.rel = "noopener";
    if (!indirilebilir) a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Blob URL'i hemen iptal etmek bazı mobil tarayıcılarda indirmeyi keser
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return indirilebilir ? "indirildi" : "sekmede-acildi";
  }

  /** Cihaz dosya paylaşımını destekliyorsa paylaşım sayfasını açar. */
  function paylasilabilirMi(blob, dosyaAdi) {
    if (!navigator.canShare || !navigator.share || typeof File !== "function") return false;
    try {
      return navigator.canShare({ files: [new File([blob], dosyaAdi, { type: "application/pdf" })] });
    } catch { return false; }
  }

  async function paylas(blob, dosyaAdi, bilgi) {
    if (!paylasilabilirMi(blob, dosyaAdi)) return "desteklenmiyor";
    const dosya = new File([blob], dosyaAdi, { type: "application/pdf" });
    try {
      await navigator.share({ files: [dosya], title: (bilgi && bilgi.baslik) || dosyaAdi,
        text: (bilgi && bilgi.metin) || "" });
      return "paylasildi";
    } catch (e) {
      // Kullanıcı paylaşımı kapattıysa sessizce geçilir; başka her durumda
      // (izin yok, paylaşım açılamadı) çağıran indirmeye düşebilsin diye
      // "basarisiz" döner — kullanıcıya hata penceresi gösterilmez.
      if (e && e.name === "AbortError") return "iptal";
      console.warn("Paylaşım açılamadı:", e);
      return "basarisiz";
    }
  }

  window.RaporPDF = { uret, indir, paylas, paylasilabilirMi };
})();
