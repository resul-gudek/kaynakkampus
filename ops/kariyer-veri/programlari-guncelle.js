#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   KARİYER PUSULAM — DOĞRULANMIŞ PROGRAM KATALOĞUNU ÜRETİR
   ──────────────────────────────────────────────────────────────────
   Çalıştırma:  node ops/kariyer-veri/programlari-guncelle.js
   Çıktı:       public/assets/kariyer-programlar.js

   Kaynaklar (ikisi de resmîdir, program adları burada UYDURULMAZ):
   1) YÖK Yükseköğretim Program Atlası — tercih kılavuzu araması
      https://yokatlas.yok.gov.tr/api/tercih-kilavuz/search
      Merkezî yerleştirmeyle öğrenci alan tüm ön lisans (Tablo 3) ve
      lisans (Tablo 4) programları; ad, düzey ve puan türü buradan gelir.
   2) ÖSYM Yükseköğretim Programları ve Kontenjanları Kılavuzu (PDF)
      Tablo 5 — özel yetenek sınavıyla öğrenci alan programlar.
      YÖK Atlas bu tabloyu taşımadığı için PDF'ten okunur.

   Her yıl kılavuz yenilendiğinde: aşağıdaki KILAVUZ_PDF adresini
   güncelleyip betiği yeniden çalıştırmak yeterlidir. Betik sonunda
   aile ataması yapılmamış program kalıp kalmadığını (UNMAPPED) yazar;
   sıfır değilse aile-kurallari.js'e kural eklenmelidir.
   ══════════════════════════════════════════════════════════════════ */
"use strict";
const fs = require("fs");
const path = require("path");
const { pdfMetni } = require("./pdf-metin.js");
const KURALLAR = require("./aile-kurallari.js");

const KOK = path.resolve(__dirname, "..", "..");
const CIKTI = path.join(KOK, "public", "assets", "kariyer-programlar.js");
const ARAMA = "https://yokatlas.yok.gov.tr/api/tercih-kilavuz/search";
const KILAVUZ_PDF = "https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/TERCIH/kontkilavuz_yktd21072026.pdf";
const SAYFA_BOYU = 1000;

/* Tablo 5'te program adının yanındaki koşul/burs ekleri; YÖK Atlas'ın
   "birimGrupAdi" alanı bunları zaten atar, PDF tarafında elle atılır. */
const EK_SIL = /\s*\((?:KKTC Uyruklu|Burslu|Ücretli|%\d+ İndirimli|İngilizce|M\.T\.O\.K\.|Lisans|UOLP-[^)]*)\)/g;

async function atlasHasadi() {
  const gruplar = new Map();
  let sayfa = 0, toplam = null, okunan = 0, meta = null, adsiz = 0, puansiz = 0;
  for (;;) {
    const yanit = await fetch(ARAMA, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0", Referer: "https://yokatlas.yok.gov.tr/" },
      body: JSON.stringify({ filters: {}, page: sayfa, size: SAYFA_BOYU, sortBy: "kilavuzKodu", direction: "ASC" }),
    });
    if (!yanit.ok) throw new Error("YÖK Atlas HTTP " + yanit.status);
    const j = await yanit.json();
    if (toplam === null) toplam = j.totalElements;
    if (!meta && j.content[0]) meta = { sinav: String(j.content[0].sinav).trim(), yil: j.content[0].yil };
    for (const k of j.content) {
      okunan++;
      // Anahtar birimGrupId DEĞİL, program adıdır: 2026 kılavuzunda 73 kayıt
      // birimGrupId taşımıyor ve id'ye göre gruplayınca hepsi tek kovaya
      // düşüp 38 gerçek program adı katalogdan siliniyordu. Ad zaten aşağıda
      // birleştirmenin de anahtarı; kaynakta boşlukla biten adlar var, kırpılır.
      const ad = String(k.birimGrupAdi || "").trim();
      if (!ad) { adsiz++; continue; }
      let g = gruplar.get(ad);
      if (!g) { g = { ad: ad, duzey: new Set(), puan: new Set(), adet: 0 }; gruplar.set(ad, g); }
      g.adet++;
      g.duzey.add(k.birimTuruAdi === "LISANS" ? "lisans" : "onlisans");
      // Kaynakta puanTuru null olabilen kayıtlar var (2026'da 2 kayıt); boş
      // değer listeye girerse arayüzde "· null" olarak görünür.
      const puan = k.puanTuru == null ? "" : String(k.puanTuru).trim();
      if (puan) g.puan.add(puan);
      else puansiz++;
      // Düzey ↔ puan türü eşleşmesi: aynı ad iki düzeyde varsa hangi düzeyin
      // hangi puan türüyle öğrenci aldığı ayrı tutulur, birleşince kaybolmasın.
      const dz = k.birimTuruAdi === "LISANS" ? "lisans" : "onlisans";
      if (puan) {
        if (!g.duzeyPuan) g.duzeyPuan = {};
        (g.duzeyPuan[dz] = g.duzeyPuan[dz] || new Set()).add(puan);
      }
    }
    if (j.content.length < SAYFA_BOYU || okunan >= toplam) break;
    sayfa++;
    if (sayfa > 200) throw new Error("Sayfa sınırı aşıldı — API davranışı değişmiş olabilir");
    process.stdout.write("\r  YÖK Atlas: " + okunan + " / " + toplam);
  }
  process.stdout.write("\r  YÖK Atlas: " + okunan + " / " + toplam + " kayıt okundu"
    + " · " + gruplar.size + " program adı"
    + (adsiz ? " · adsız atlanan " + adsiz : "")
    + (puansiz ? " · puan türü boş " + puansiz : "") + "\n");
  return { gruplar, meta, kayitSayisi: okunan };
}

async function tablo5Hasadi() {
  const yanit = await fetch(KILAVUZ_PDF, { headers: { "User-Agent": "Mozilla/5.0" } });
  const tur = yanit.headers.get("content-type") || "";
  if (!yanit.ok || !/pdf/.test(tur)) throw new Error("ÖSYM kılavuzu indirilemedi (" + yanit.status + " " + tur + ")");
  const satirlar = pdfMetni(Buffer.from(await yanit.arrayBuffer()));
  console.log("  ÖSYM kılavuzu: " + satirlar.length + " satır metin çıkarıldı");

  // Tablo 5 bölümü: "TABLO 5" başlığından, tablo sonrası koşullar bölümüne kadar
  const bas = satirlar.findIndex(s => /^TABLO 5\s*$/.test(s));
  const son = satirlar.findIndex((s, i) => i > bas && /^TABLO 5'TE YER ALAN/.test(s));
  if (bas < 0 || son < 0) throw new Error("Tablo 5 sınırları bulunamadı — kılavuz düzeni değişmiş olabilir");

  const adlar = new Map();
  for (let i = bas; i < son; i++) {
    if (!/^\d{9}\s*$/.test(satirlar[i])) continue;
    let ad = null;
    for (let j = i + 1; j < son && j < i + 4; j++) {
      if (/^\d{9}\s*$/.test(satirlar[j])) break;
      if (/^ {2}\S/.test(satirlar[j])) { ad = satirlar[j].trim(); break; }
    }
    if (!ad) continue;
    const temiz = ad.replace(EK_SIL, "").replace(/\s+/g, " ").trim();
    if (!temiz) continue;
    adlar.set(temiz, (adlar.get(temiz) || 0) + 1);
  }
  console.log("  ÖSYM Tablo 5: " + adlar.size + " benzersiz program adı");
  return adlar;
}

function aileBul(ad, kullanilan) {
  for (let i = 0; i < KURALLAR.length; i++) {
    const k = KURALLAR[i];
    if (k.tam && k.tam.includes(ad)) { kullanilan.add(i + "|" + ad); return k.aile; }
    if (k.desen && k.desen.some(d => d.test(ad))) { kullanilan.add(i + "|desen"); return k.aile; }
  }
  return null;
}

/** Türkçe uyumlu, benzersiz kimlik üretir. */
function kimlik(ad, alinanlar) {
  const eslem = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
  let s = ad.toLocaleLowerCase("tr").replace(/[çğıöşüâîû]/g, c => eslem[c] || c)
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!s) s = "program";
  let son = s, n = 2;
  while (alinanlar.has(son)) son = s + "-" + n++;
  alinanlar.add(son);
  return son;
}

(async function () {
  console.log("Kariyer Pusulam — program kataloğu üretiliyor\n");
  const atlas = await atlasHasadi();
  const tablo5 = await tablo5Hasadi();

  /* ── Birleştirme: aynı ad tek kayıt, düzey ve puan türü birleşir ──
     duzeyPuan, hangi düzeyin hangi puan türüyle öğrenci aldığını korur;
     puanTuru bunların birleşimidir (arama ve kısa gösterim için). */
  const kayit = new Map();
  function ekle(ad, duzeyler, puanlar, kaynak, adet, duzeyPuan) {
    let k = kayit.get(ad);
    if (!k) { k = { ad, duzey: [], puanTuru: [], duzeyPuan: {}, kaynak: [], programAdet: 0 }; kayit.set(ad, k); }
    duzeyler.forEach(d => { if (!k.duzey.includes(d)) k.duzey.push(d); });
    puanlar.forEach(p => { if (p && !k.puanTuru.includes(p)) k.puanTuru.push(p); });
    for (const d in duzeyPuan || {}) {
      k.duzeyPuan[d] = k.duzeyPuan[d] || [];
      duzeyPuan[d].forEach(p => { if (p && k.duzeyPuan[d].indexOf(p) < 0) k.duzeyPuan[d].push(p); });
    }
    if (!k.kaynak.includes(kaynak)) k.kaynak.push(kaynak);
    k.programAdet += adet || 0;
    return k;
  }
  for (const g of atlas.gruplar.values()) {
    const dp = {};
    for (const d in g.duzeyPuan || {}) dp[d] = [...g.duzeyPuan[d]];
    ekle(g.ad, [...g.duzey], [...g.puan], "yokatlas", g.adet, dp);
  }
  for (const [ad, adet] of tablo5) {
    ekle(ad, ["lisans"], ["ÖZEL YETENEK"], "osym-tablo5", adet,
      { lisans: ["ÖZEL YETENEK"] }).ozelYetenek = true;
  }

  /* ── Aile ataması ── */
  const kullanilan = new Set(), alinanKimlikler = new Set();
  const liste = [...kayit.values()].sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
  const bagsiz = [];
  for (const p of liste) {
    p.aileId = aileBul(p.ad, kullanilan);
    p.id = kimlik(p.ad, alinanKimlikler);
    if (!p.aileId) bagsiz.push(p.ad);
  }

  /* ── Kapsama raporu ── */
  const lisans = liste.filter(p => p.duzey.includes("lisans")).length;
  const onlisans = liste.filter(p => p.duzey.includes("onlisans")).length;
  const aileAdet = {};
  liste.forEach(p => { if (p.aileId) aileAdet[p.aileId] = (aileAdet[p.aileId] || 0) + 1; });
  const bosKural = [];
  KURALLAR.forEach((k, i) => {
    if (!k.tam) return;
    k.tam.forEach(ad => { if (!kullanilan.has(i + "|" + ad)) bosKural.push(k.aile + " → " + ad); });
  });

  /* ── Veri bütünlüğü kapıları ──
     Her biri sessizce geçerse arayüzde "· null" gibi çıktılar ya da
     kaybolmuş program adları oluşur; bu yüzden açıkça raporlanır. */
  const kusur = [];
  const yalnizLisans = liste.filter(p => p.duzey.length === 1 && p.duzey[0] === "lisans").length;
  const yalnizOnlisans = liste.filter(p => p.duzey.length === 1 && p.duzey[0] === "onlisans").length;
  const ikiDuzey = liste.filter(p => p.duzey.length > 1).length;
  if (yalnizLisans + yalnizOnlisans + ikiDuzey !== liste.length) kusur.push("düzey bölümlemesi toplamı tutmuyor");
  // Puan türü olmayan program KUSUR değildir: kılavuzda puan türü
  // yayımlanmayan gerçek programlar var (2026'da Manas Üniversitesi'nin iki
  // filoloji programı). Bunlar silinmez, arayüzde puan türü satırı gösterilmez.
  const puanTurusuz = [];
  liste.forEach(p => {
    if (!p.duzey.length) kusur.push(p.ad + ": düzey yok");
    if (p.puanTuru.some(t => !t)) kusur.push(p.ad + ": boş puan türü değeri");
    if (p.ad !== p.ad.trim()) kusur.push(p.ad + ": adda baştaki/sondaki boşluk");
    if (!p.puanTuru.length) puanTurusuz.push(p.ad);
    Object.keys(p.duzeyPuan).forEach(d => { if (p.duzey.indexOf(d) < 0) kusur.push(p.ad + ": duzeyPuan'da fazladan " + d); });
  });

  console.log("\nKAPSAMA");
  console.log("  TOPLAM_PROGRAM  =", liste.length);
  console.log("  YALNIZ_LISANS   =", yalnizLisans);
  console.log("  YALNIZ_ONLISANS =", yalnizOnlisans);
  console.log("  HER_IKI_DUZEY   =", ikiDuzey, "(toplamda bir kez sayılır)");
  console.log("  → bölümleme     =", yalnizLisans + yalnizOnlisans + ikiDuzey, "=== TOPLAM_PROGRAM");
  console.log("  lisans sunan    =", lisans, "· ön lisans sunan =", onlisans,
    "(kesişim " + ikiDuzey + ", toplamları program sayısı DEĞİLDİR)");
  console.log("  VERI_KUSURU     =", kusur.length);
  if (kusur.length) console.log("    " + kusur.slice(0, 20).join("\n    "));
  if (puanTurusuz.length) console.log("  Kılavuzda puan türü yayımlanmayan program: "
    + puanTurusuz.length + " (" + puanTurusuz.join(", ") + ")");
  console.log("  AILE_SAYISI     =", Object.keys(aileAdet).length);
  console.log("  UNMAPPED_PROGRAM_COUNT =", bagsiz.length);
  if (bagsiz.length) console.log("  Bağsız:\n    " + bagsiz.join("\n    "));
  if (bosKural.length) console.log("  Katalogda karşılığı olmayan kural girdileri: " + bosKural.length +
    " (kılavuzdan çıkmış olabilir)\n    " + bosKural.join("\n    "));

  if (bagsiz.length) {
    console.error("\nDurduruldu: aile atanmamış program var. aile-kurallari.js güncellenmeli.");
    process.exit(1);
  }
  if (kusur.length) {
    console.error("\nDurduruldu: veri kusuru var, dosya yazılmadı.");
    process.exit(1);
  }

  /* ── Dosyayı yaz ── */
  const bugun = new Date().toISOString().slice(0, 10);
  const satirlar = liste.map(p => "    " + JSON.stringify({
    id: p.id, ad: p.ad, duzey: p.duzey, puanTuru: p.puanTuru, duzeyPuan: p.duzeyPuan,
    aileId: p.aileId, ozelYetenek: !!p.ozelYetenek, programAdet: p.programAdet,
  }));

  const govde = `/* ══════════════════════════════════════════════════════════════════
   KARİYER PUSULAM — DOĞRULANMIŞ PROGRAM KATALOĞU  (ÜRETİLMİŞ DOSYA)
   ──────────────────────────────────────────────────────────────────
   Bu dosya ELLE DÜZENLENMEZ. Üreten betik:
     node ops/kariyer-veri/programlari-guncelle.js

   Kaynaklar
   · YÖK Yükseköğretim Program Atlası — ${atlas.meta.sinav} ${atlas.meta.yil}
     tercih kılavuzu araması (merkezî yerleştirmeli ön lisans + lisans).
   · ÖSYM Yükseköğretim Programları ve Kontenjanları Kılavuzu, Tablo 5
     (özel yetenek sınavıyla öğrenci alan programlar).

   Kayıtlar PROGRAM TÜRÜdür, üniversite bazlı program değildir: aynı
   bölümün farklı üniversitelerdeki kayıtları tek satırda toplanır.
   Kontenjan, taban puan, üniversite ve şehir bilgisi bu araca dâhil
   değildir; öğrenci bunları YÖK Atlas / ÖSYM üzerinden araştırır.

   Alanlar
     id           benzersiz kimlik (addan üretilir)
     ad           resmî program adı
     duzey        ["lisans"] · ["onlisans"] · ikisi birden
     puanTuru     SAY · SÖZ · EA · DİL · TYT · ÖZEL YETENEK (düzeylerin birleşimi;
                  kılavuzda puan türü yayımlanmayan programda boş kalır)
     duzeyPuan    düzey → o düzeyin puan türleri; aynı ad iki düzeyde varsa
                  hangisinin hangi puanla öğrenci aldığı burada durur
     aileId       assets/kariyer-aileler.js içindeki program ailesi
     ozelYetenek  özel yetenek sınavıyla öğrenci alıyor mu
     programAdet  kılavuzdaki üniversite programı sayısı (bilgi amaçlı)
   ══════════════════════════════════════════════════════════════════ */
(function (kok) {
  "use strict";

  var VERI = {
    sinav: ${JSON.stringify(atlas.meta.sinav)},
    yil: ${atlas.meta.yil},
    uretildi: ${JSON.stringify(bugun)},
    kayitSayisi: ${atlas.kayitSayisi},
    kaynaklar: [
      { ad: "YÖK Yükseköğretim Program Atlası", url: "https://yokatlas.yok.gov.tr/" },
      { ad: "ÖSYM Yükseköğretim Programları ve Kontenjanları Kılavuzu (Tablo 5)", url: "https://www.osym.gov.tr/" }
    ]
  };

  var PROGRAMLAR = [
${satirlar.join(",\n")}
  ];

  kok.KP_PROGRAMLAR = { surum: 1, veri: VERI, liste: PROGRAMLAR };
  if (typeof module !== "undefined" && module.exports) module.exports = kok.KP_PROGRAMLAR;
})(typeof window !== "undefined" ? window : globalThis);
`;
  fs.writeFileSync(CIKTI, govde, "utf8");
  console.log("\nYazıldı: " + path.relative(KOK, CIKTI) + " (" + (govde.length / 1024).toFixed(0) + " KB)");
})().catch(e => { console.error("\nHATA:", e.message); process.exit(1); });
