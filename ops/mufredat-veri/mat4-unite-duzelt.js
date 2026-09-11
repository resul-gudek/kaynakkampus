#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   mat-4 ÜNİTE EŞLEŞTİRMESİNİ DÜZELTEN ÜRETİCİ ADIMI

   NEDEN VAR
   ---------
   public/assets/mufredat.js başlığı «bu dosya elle yazılmaz, resmî MEB
   belgelerinden üretilir» der; ancak depoda bu dosyayı üreten bir betik
   bulunmuyor — dosyanın kendisi kayıt kaynağıdır ve geçmişte doğrudan
   düzenlenmiştir. Bu betik, o eksik üretici adımının «mat-4» parçasını
   yerine koyar: elle düzenleme yerine YENİDEN ÇALIŞTIRILABİLİR, kendi
   kendini denetleyen bir dönüşüm uygular.

   NE YAPAR
   --------
   4. sınıf Matematik (MEB 2018 Matematik Dersi Öğretim Programı, 1-8)
   kazanımları KAZANIMLAR["mat-4"] içinde dört öbeğe toplanmış, ama bu
   öbeklere alt öğrenme alanı adlarının ilk dördü verilmişti:

     "Doğal Sayılar"                  ← aslında bütün M.4.1.* (sayılar)
     "Doğal Sayılarla Toplama İşlemi" ← aslında M.4.2.* (geometri)
     "Doğal Sayılarla Çıkarma İşlemi" ← aslında M.4.3.* (ölçme)
     "Doğal Sayılarla Çarpma İşlemi"  ← aslında M.4.4.* (veri işleme)

   Sonuç: UNITELER.mat[4] içinde tanımlı 16 başlığın 12'si boş dönüyor,
   dolu olan 4'ü de yanlış kazanımları veriyordu.

   Bu betik kazanımları KODLARINA göre yeniden öbekler: M.4.<alan>.<alt alan>
   ikilisi, aşağıdaki KOD_UNITE tablosuyla resmî alt öğrenme alanı adına
   eşlenir. KAZANIM METİNLERİNE VE KODLARINA DOKUNULMAZ; yalnızca hangi
   başlığın altında durdukları değişir. mat-4 dışındaki hiçbir sınıf/ders
   verisi okunmaz bile.

   GÜVENLİK AĞI
   ------------
   Aşağıdaki koşullardan biri bozulursa betik yazmayı reddeder:
     • bir kazanım kodu KOD_UNITE tablosunda yoksa,
     • bir hedef başlık UNITELER.mat[4] listesinde yoksa,
     • dönüşüm öncesi/sonrası kazanım sayısı ya da kod kümesi değişirse,
     • aynı kod iki kez geçerse.

   KULLANIM
   --------
     node ops/mufredat-veri/mat4-unite-duzelt.js          → yazar
     node ops/mufredat-veri/mat4-unite-duzelt.js --dene   → yalnız rapor
   Betik ETKİSİZDİR (idempotent): ikinci çalıştırmada dosya değişmez.
   ═══════════════════════════════════════════════════════════════════════════ */
"use strict";
const fs = require("fs");
const path = require("path");

const HEDEF = path.join(__dirname, "..", "..", "public", "assets", "mufredat.js");
const DENE = process.argv.includes("--dene");

/* M.4.<öğrenme alanı>.<alt öğrenme alanı> → resmî alt öğrenme alanı adı.
   Burada yeni ad UYDURULMAZ: adların tamamı depoda zaten kayıtlı olan
   başlıklardır (UNITELER.mat[4] ve odev-olustur.html içindeki UNITS.mat[4]).

   «Uzamsal İlişkiler» başlığı UNITELER.mat[4] listesinde EKSİKTİ; bu yüzden
   M.4.2.2 (ayna simetrisi) ile M.4.2.3 (düzlem ve açı) tek başlık altında
   kalıyordu. Başlık, odev-olustur.html'in bağımsız olarak tuttuğu ve resmî
   programa dayanan 17 başlıklı mat/4 listesinden alınır; oradaki sırası da
   aynıdır (Geometrik Cisimler ve Şekiller → Uzamsal İlişkiler → Geometride
   Temel Kavramlar). Eksikse EKSIK_BASLIK ile listeye eklenir. */
const KOD_UNITE = {
  "M.4.1.1": "Doğal Sayılar",
  "M.4.1.2": "Doğal Sayılarla Toplama İşlemi",
  "M.4.1.3": "Doğal Sayılarla Çıkarma İşlemi",
  "M.4.1.4": "Doğal Sayılarla Çarpma İşlemi",
  "M.4.1.5": "Doğal Sayılarla Bölme İşlemi",
  "M.4.1.6": "Kesirler",
  "M.4.1.7": "Kesirlerle İşlemler",
  "M.4.2.1": "Geometrik Cisimler ve Şekiller",
  "M.4.2.2": "Uzamsal İlişkiler",
  "M.4.2.3": "Geometride Temel Kavramlar",
  "M.4.3.1": "Uzunluk Ölçme",
  "M.4.3.2": "Çevre Ölçme",
  "M.4.3.3": "Alan Ölçme",
  "M.4.3.4": "Zaman Ölçme",
  "M.4.3.5": "Tartma",
  "M.4.3.6": "Sıvı Ölçme",
  "M.4.4.1": "Veri Toplama ve Değerlendirme",
};

/* UNITELER.mat[4] listesinde eksik olan başlık: hangi başlığın HEMEN ARDINA
   ekleneceğiyle birlikte. Sıra, odev-olustur.html'deki resmî sırayla aynıdır. */
const EKSIK_BASLIK = [
  { ad: "Uzamsal İlişkiler", sonra: "Geometrik Cisimler ve Şekiller" },
];

function dur(mesaj){ console.error("HATA: " + mesaj); process.exit(1); }

let kaynak = fs.readFileSync(HEDEF, "utf8");
const satirSonu = kaynak.indexOf("\r\n") >= 0 ? "\r\n" : "\n";

/* ---- 0) UNITELER.mat[4]: eksik başlığı doğru konuma ekle ---------------- */
function uniteSatiriniDuzelt(metin){
  const unBas = metin.indexOf("const UNITELER = {");
  if (unBas < 0) dur("UNITELER bloğu bulunamadı.");
  const matBas = metin.indexOf(satirSonu + "    mat: {", unBas);
  if (matBas < 0) dur("UNITELER.mat bloğu bulunamadı.");
  const matBit = metin.indexOf(satirSonu + "    },", matBas);
  const satirBas = metin.indexOf(satirSonu + "      4: [", matBas);
  if (satirBas < 0 || satirBas > matBit) dur("UNITELER.mat[4] satırı bulunamadı.");
  const satirBit = metin.indexOf(satirSonu, satirBas + satirSonu.length);
  const eski = metin.slice(satirBas + satirSonu.length, satirBit);
  const adlar = [];
  eski.replace(/"((?:[^"\\]|\\.)*)"/g, function (t, ic){ adlar.push(ic.replace(/\\"/g, '"')); return t; });
  let degisti = false;
  EKSIK_BASLIK.forEach(function (e) {
    if (adlar.indexOf(e.ad) >= 0) return;
    const ix = adlar.indexOf(e.sonra);
    if (ix < 0) dur("«" + e.sonra + "» başlığı listede yok; «" + e.ad + "» nereye eklenecek belirsiz.");
    adlar.splice(ix + 1, 0, e.ad);
    degisti = true;
  });
  if (!degisti) return metin;
  const yeniSatir = '      4: [' + adlar.map(function (a) {
    return '"' + a.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  }).join(", ") + '],';
  return metin.slice(0, satirBas + satirSonu.length) + yeniSatir + metin.slice(satirBit);
}
const uniteliKaynak = uniteSatiriniDuzelt(kaynak);
const uniteEklendi = uniteliKaynak !== kaynak;
kaynak = uniteliKaynak;

/* ---- 1) Dosyayı çalıştırıp mevcut veriyi oku (ayrıştırma yok, gerçek veri) ---- */
const pencere = {};
new Function("window", kaynak)(pencere);
const M = pencere.MUFREDAT;
if (!M) dur("mufredat.js window.MUFREDAT tanımlamadı.");

const baslikListesi = M._uniteler.mat && M._uniteler.mat[4];
if (!Array.isArray(baslikListesi) || !baslikListesi.length) dur("UNITELER.mat[4] bulunamadı.");

const mevcut = M._kazanimlar["mat-4"];
if (!mevcut) dur("KAZANIMLAR[\"mat-4\"] bulunamadı.");

/* ---- 2) Bütün kazanımları tek listeye al, kod → başlık ile yeniden öbekle ---- */
const hepsi = [];
Object.keys(mevcut).forEach(function (baslik) {
  (mevcut[baslik] || []).forEach(function (kz) { hepsi.push(kz); });
});

const gorulenKod = new Set();
const yeni = new Map();
baslikListesi.forEach(function (b) { yeni.set(b, []); });

hepsi.forEach(function (kz) {
  const kod = String(kz.kod || "");
  const m = kod.match(/^(M\.4\.\d+\.\d+)\.\d+$/);
  if (!m) dur("beklenmeyen kazanım kodu: «" + kod + "»");
  const hedef = KOD_UNITE[m[1]];
  if (!hedef) dur("KOD_UNITE tablosunda karşılığı yok: " + m[1] + " (" + kod + ")");
  if (!yeni.has(hedef)) dur("«" + hedef + "» başlığı UNITELER.mat[4] listesinde yok.");
  if (gorulenKod.has(kod)) dur("aynı kazanım kodu iki kez geçiyor: " + kod);
  gorulenKod.add(kod);
  yeni.get(hedef).push(kz);
});

/* Aynı alt alan içinde kazanımlar kod sırasında kalsın */
const kodSira = function (a, b) {
  const p = function (k){ return String(k.kod).split(".").map(Number).slice(1); };
  const x = p(a), y = p(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++){
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
  }
  return 0;
};
yeni.forEach(function (liste) { liste.sort(kodSira); });

/* ---- 3) Değişmezlik denetimleri ---- */
let yeniToplam = 0;
yeni.forEach(function (l) { yeniToplam += l.length; });
if (yeniToplam !== hepsi.length)
  dur("kazanım sayısı değişti: " + hepsi.length + " → " + yeniToplam);
if (gorulenKod.size !== hepsi.length)
  dur("benzersiz kod sayısı kazanım sayısıyla uyuşmuyor.");

/* ---- 4) Yeni "mat-4" bloğunu üret ---- */
const kacir = function (s){ return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"'); };
const satir = [];
satir.push('    "mat-4": {');
baslikListesi.forEach(function (baslik) {
  const liste = yeni.get(baslik) || [];
  if (!liste.length) return;                 /* kazanımı olmayan başlık yazılmaz */
  satir.push('      "' + kacir(baslik) + '": [');
  liste.forEach(function (kz) {
    satir.push('        { k: "' + kacir(kz.k) + '", kod: "' + kacir(kz.kod) + '" },');
  });
  satir.push("      ],");
});
satir.push("    },");
const yeniBlok = satir.join(satirSonu);

/* ---- 5) Dosyadaki eski bloğu bul ve değiştir ---- */
const bas = kaynak.indexOf('    "mat-4": {');
if (bas < 0) dur('kaynakta \'    "mat-4": {\' bloğu bulunamadı.');
const sonrakiBas = kaynak.indexOf('    "mat-5": {', bas);
if (sonrakiBas < 0) dur('"mat-4" bloğunun sonu bulunamadı ("mat-5" yok).');
const bit = kaynak.lastIndexOf("    },", sonrakiBas);
if (bit < 0 || bit < bas) dur('"mat-4" bloğunun kapanışı bulunamadı.');
const eskiBlok = kaynak.slice(bas, bit + "    },".length);

if (eskiBlok === yeniBlok && !uniteEklendi){
  console.log("mat-4 zaten doğru eşleşmiş; dosya değiştirilmedi.");
  process.exit(0);
}

const cikti = kaynak.slice(0, bas) + yeniBlok + kaynak.slice(bit + "    },".length);

/* ---- 6) Üretilen dosyayı yazmadan önce çalıştırıp doğrula ---- */
const denemePencere = {};
try { new Function("window", cikti)(denemePencere); }
catch (e){ dur("üretilen dosya çalıştırılamadı: " + e.message); }
const Y = denemePencere.MUFREDAT;
let dogrulananToplam = 0;
baslikListesi.forEach(function (b) {
  const kz = Y.kazanimListesi("mat", 4, b);
  dogrulananToplam += kz.length;
  const onek = new Set(kz.map(function (k){ return String(k.kod).match(/^(M\.4\.\d+\.\d+)\./)[1]; }));
  onek.forEach(function (o) {
    if (KOD_UNITE[o] !== b) dur("üretilen dosyada «" + b + "» altında " + o + " kodu var.");
  });
});
if (dogrulananToplam !== hepsi.length)
  dur("üretilen dosyada kazanım sayısı tutmuyor: " + dogrulananToplam);

/* Diğer sınıf ve derslerin ÜNİTE listeleri de değişmemeli */
Object.keys(M._uniteler).forEach(function (d) {
  Object.keys(M._uniteler[d]).forEach(function (sn) {
    if (d === "mat" && sn === "4") return;
    if (JSON.stringify(M._uniteler[d][sn]) !== JSON.stringify(Y._uniteler[d][sn]))
      dur("mat-4 dışında ünite listesi değişti: " + d + "-" + sn);
  });
});

/* Diğer sınıf ve dersler değişmemeli */
const eskiAnahtar = Object.keys(M._kazanimlar).sort();
const yeniAnahtar = Object.keys(Y._kazanimlar).sort();
if (eskiAnahtar.join("|") !== yeniAnahtar.join("|")) dur("KAZANIMLAR anahtar kümesi değişti.");
eskiAnahtar.forEach(function (a) {
  if (a === "mat-4") return;
  if (JSON.stringify(M._kazanimlar[a]) !== JSON.stringify(Y._kazanimlar[a]))
    dur("mat-4 dışında veri değişti: " + a);
});

/* ---- 7) Rapor ---- */
if (uniteEklendi){
  console.log("UNITELER.mat[4]: eksik başlık eklendi → " +
    EKSIK_BASLIK.map(function (e){ return "«" + e.ad + "» («" + e.sonra + "» sonrası)"; }).join(", "));
  console.log("");
}
console.log("mat-4 · yeni başlık → kazanım dağılımı");
baslikListesi.forEach(function (b, i) {
  const kz = Y.kazanimListesi("mat", 4, b);
  const kodlar = kz.map(function (k){ return k.kod; });
  const araligi = kodlar.length ? kodlar[0] + " – " + kodlar[kodlar.length - 1] : "—";
  console.log("  " + String(i + 1).padStart(2) + ". " + b.padEnd(34) +
    String(kz.length).padStart(3) + " kazanım   " + araligi);
});
console.log("  toplam: " + dogrulananToplam + " kazanım (değişmedi)");

if (DENE){ console.log("\n--dene: dosya yazılmadı."); process.exit(0); }
fs.writeFileSync(HEDEF, cikti);
console.log("\npublic/assets/mufredat.js yeniden üretildi.");
