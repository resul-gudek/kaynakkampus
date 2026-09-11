/* ══════════════════════════════════════════════════════════════════
   ÇEKİRDEK KRİTER DENETİMİ
   ──────────────────────────────────────────────────────────────────
   Kullanım:  node ops/kariyer-veri/cekirdek-denetle.js

   assets/kariyer-aileler.js içindeki `cekirdek` alanlarını ölçer.
   Çekirdek kriterlerin işe yaraması tek bir şeye bağlıdır: AYIRT
   EDİCİ olmaları. Herkeste bulunan bir kriter hiçbir şeyi ayırmaz;
   bu betik onu yakalar.

   Denetlenen kurallar
     1. Etkin her ailenin çekirdeği var ve en az 3 kriter taşıyor.
     2. Kriter anahtarları geçerli (boyut/koşul adları ölçekte var).
     3. "calisma" kriteri ailenin kendi profilinde tanımlı ve KUTUPTA
        (≤35 ya da ≥65) — orta değer ayırt edici değildir.
     4. "kosul" kriterlerinin toplam ağırlığı çekirdeğin ≤ 1/3'ü.
        (İşaretlenmemiş koşul tam karşılama sayılır; aksi hâlde aile
        haksız destek toplar.)
     5. Hiçbir kriter ailelerin YAYGINLIK_TAVANI'ndan fazlasında
        geçmiyor — geçiyorsa o kriter genel özelliktir, çekirdekten
        çıkarılmalı.
     6. İki ailenin çekirdek kümesi birebir aynı değil.

   Hata varsa çıkış kodu 1'dir.
   ══════════════════════════════════════════════════════════════════ */
"use strict";
var path = require("path");
var KOK = path.join(__dirname, "..", "..");
global.window = global;
require(path.join(KOK, "public/assets/kariyer-olcek.js"));
require(path.join(KOK, "public/assets/kariyer-aileler.js"));
require(path.join(KOK, "public/assets/kariyer-programlar.js"));

var OLCEK = global.KP_OLCEK, AILE = global.KP_AILELER, PRG = global.KP_PROGRAMLAR;

/* Bir kriter ailelerin bu kadarından fazlasında geçerse artık
   "ayırt edici" değil, genel özelliktir. */
var YAYGINLIK_TAVANI = 0.40;
var EN_AZ_KRITER = 3;
var KOSUL_AGIRLIK_PAYI = 1 / 3;

var hatalar = [], uyarilar = [];

/* Katalogda programı olan aileler — motor da yalnız bunları puanlar */
var PROGRAMLI = {};
PRG.liste.forEach(function (p) { PROGRAMLI[p.aileId] = true; });
var etkin = AILE.liste.filter(function (f) { return f.aktif !== false && PROGRAMLI[f.id]; });

var sayim = {}, imzalar = {};

etkin.forEach(function (f) {
  var c = f.cekirdek || [];
  if (c.length < EN_AZ_KRITER) {
    hatalar.push(f.id + ": çekirdek kriter sayısı " + c.length + " (en az " + EN_AZ_KRITER + ")");
    return;
  }
  var toplamAgirlik = 0, kosulAgirlik = 0, imza = [];

  c.forEach(function (k, i) {
    var w = k.w || OLCEK.PUANLAMA.cekirdek.agirlikVarsayilan;
    var eksenler = ["ilgi", "calisma", "deger", "yol", "kosul"].filter(function (e) { return k[e]; });
    if (eksenler.length !== 1) {
      hatalar.push(f.id + " kriter #" + (i + 1) + ": tam olarak bir eksen anahtarı olmalı (" + eksenler.join(",") + ")");
      return;
    }
    var eksen = eksenler[0], id = k[eksen];
    var sozluk = eksen === "kosul" ? OLCEK.KOSULLAR : OLCEK.BOYUTLAR[eksen];
    if (!sozluk[id]) hatalar.push(f.id + ": bilinmeyen " + eksen + " anahtarı “" + id + "”");

    if (eksen === "calisma") {
      var hedef = f.calisma[id];
      if (hedef == null) {
        hatalar.push(f.id + ": çekirdekteki calisma boyutu “" + id + "” ailenin calisma profilinde yok");
      } else if (hedef > 35 && hedef < 65) {
        hatalar.push(f.id + ": calisma “" + id + "” = " + hedef + " — kutupta değil, ayırt edici olmaz");
      }
    }
    if (eksen === "kosul") {
      kosulAgirlik += w;
      // Koşul çekirdekte ise ailenin kosullar listesinde de bulunmalı:
      // orada olmayan bir koşulu "bu alanda sık karşılaşılır" saymak tutarsız olur.
      if ((f.kosullar || []).indexOf(id) < 0) {
        uyarilar.push(f.id + ": “" + id + "” çekirdekte ama kosullar listesinde yok");
      }
    }
    if (eksen === "ilgi" && f.ilgi[id] == null) {
      uyarilar.push(f.id + ": çekirdekteki ilgi boyutu “" + id + "” ailenin ilgi profilinde yok");
    }
    if (eksen === "yol" && f.yol[id] == null) {
      uyarilar.push(f.id + ": çekirdekteki yol boyutu “" + id + "” ailenin yol profilinde yok");
    }
    toplamAgirlik += w;
    // Yaygınlık sayımında "calisma" kriteri KUTBUYLA birlikte sayılır:
    // uygulamalilik≤35 (teorik) ile uygulamalilik≥65 (uygulamalı) zıt
    // taleplerdir, aynı kriter sayılmaları yaygınlık ölçümünü bozar.
    var anahtar = eksen + ":" + id +
      (eksen === "calisma" ? (f.calisma[id] <= 50 ? "(sol)" : "(sağ)") : "");
    sayim[anahtar] = (sayim[anahtar] || 0) + 1;
    imza.push(anahtar);
  });

  if (kosulAgirlik > toplamAgirlik * KOSUL_AGIRLIK_PAYI + 1e-9) {
    hatalar.push(f.id + ": koşul ağırlığı " + kosulAgirlik + "/" + toplamAgirlik +
      " — çekirdeğin üçte birini geçiyor");
  }

  var im = imza.slice().sort().join("|");
  if (imzalar[im]) hatalar.push(f.id + " ile " + imzalar[im] + ": çekirdek kümeleri birebir aynı");
  else imzalar[im] = f.id;
});

/* Yaygınlık — bir kriter kaç ailede geçiyor */
var tavan = Math.floor(etkin.length * YAYGINLIK_TAVANI);
var yaygin = Object.keys(sayim).filter(function (k) { return sayim[k] > tavan; })
  .sort(function (a, b) { return sayim[b] - sayim[a]; });
yaygin.forEach(function (k) {
  hatalar.push("“" + k + "” " + sayim[k] + "/" + etkin.length +
    " ailenin çekirdeğinde — genel özellik sayılır (tavan " + tavan + ")");
});

/* ── Rapor ── */
console.log("Etkin aile: " + etkin.length + " · çekirdek tanımlı: " +
  etkin.filter(function (f) { return (f.cekirdek || []).length; }).length);
console.log("Ayrı kriter: " + Object.keys(sayim).length + " · yaygınlık tavanı: " + tavan + " aile");

var enSik = Object.keys(sayim).sort(function (a, b) { return sayim[b] - sayim[a] || a.localeCompare(b); }).slice(0, 8);
console.log("En sık kullanılan kriterler:");
enSik.forEach(function (k) { console.log("  " + String(sayim[k]).padStart(2) + "×  " + k); });

if (uyarilar.length) {
  console.log("\nUYARI (" + uyarilar.length + ")");
  uyarilar.forEach(function (u) { console.log("  · " + u); });
}
if (hatalar.length) {
  console.log("\nHATA (" + hatalar.length + ")");
  hatalar.forEach(function (h) { console.log("  ✗ " + h); });
  process.exit(1);
}
console.log("\nBütün çekirdek kuralları sağlanıyor.");
