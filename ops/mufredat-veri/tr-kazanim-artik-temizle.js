#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   TÜRKÇE KAZANIM METİNLERİNDEKİ PDF AYRIŞTIRMA ARTIKLARINI TEMİZLER
   ═══════════════════════════════════════════════════════════════════════════

   public/assets/mufredat.js'in üreticisi yoktur; dosyanın kendisi kaynaktır.
   Bu yüzden düzeltmeler elle değil, yeniden çalıştırılabilir ve kendi kendini
   denetleyen betiklerle yapılır (bkz. mat4-unite-duzelt.js).

   ── Kusur ──────────────────────────────────────────────────────────────────
   TYMM Türkçe programı PDF'inden veri çıkarılırken bir kazanımın metnine,
   PDF'te hemen ardından gelen satır yapışmış. İki biçimi var:

     A) Bölüm başlığı yapışmış — bir bölümün SON kazanımında:
        «… söz varlığını geliştirmeye yönelik çözümleme yapabilme Okuma»
        «… beden dilini kullanabilme Yazma»
     B) Kazanım metni yerine programın AÇIKLAMA paragrafı geçmiş:
        «kapsamında yapılır. Öğrencilerin konuşma ve yazma sürecini …»
     D) Alt madde yapışmış:
        «Konuşmalarında içerik oluşturabilme ı) Konuşmalarında benzetmelere…»

   ── Düzeltme ölçütleri (metin UYDURULMAZ, yalnızca yapışan kısım atılır) ───
   ÖLÇÜT 1 — kod ikizi: Bir metin, AYNI ders-sınıf içinde AYNI kodun sağlam
   (artıksız) metni tek ve belirli olduğunda onunla değiştirilir. Türkçe
   programında bir kazanım kodunun metni temadan temaya değişmez.

   ÖLÇÜT 2 — çıplak bölüm başlığı: Metin geçerli bir kazanım biçimiyle
   («…abilme» / «…ebilme») bitip ardına çıplak bir bölüm adı yapışmışsa o
   ad silinir. Ölçüldü: tr-* içindeki 984 kaydın hiçbirinde meşru bir metin
   çıplak bölüm adıyla bitmiyor — TYMM kayıtları «…abilme/…ebilme», 2018
   kayıtları ise noktayla biter. Bu ölçüt, kodun sağlam ikizi olmayan
   (her ünitede aynı artıkla geçen) kayıtları kurtarır.

   Bu ölçüt bilerek dardır ve şunları DIŞARIDA bırakır:
     • tde-9/10/11 — kod metni temaya göre değişir («"Yaşamın İzinde"
       temasında…»), yani aynı kod ≠ aynı metin. Karşılaştırma geçersiz.
     • bio-9, cog-9, ing-7/9/10/11, mat-11, tde-9/10 — bozuk kayıtların
       sağlam karşılığı veride YOK. Bunlar resmî PDF'ten alınmalıdır;
       betik dokunmaz, sonunda listeler.
     • tr-2'deki söyleyiş farkları («Dinledikleri ile» / «Dinledikleri/
       izledikleri ile») — hangisinin resmî olduğu veriden bilinemez.

   Kullanım:  node ops/mufredat-veri/tr-kazanim-artik-temizle.js [--dene]
              --dene  yazmadan yalnız raporlar
   ═══════════════════════════════════════════════════════════════════════════ */
"use strict";

const fs = require("fs");
const path = require("path");

const DOSYA = path.join(__dirname, "..", "..", "public", "assets", "mufredat.js");
const DENE = process.argv.indexOf("--dene") >= 0;

/* Yalnız Türkçe: kod metninin temadan bağımsız olduğu tek ders ailesi. */
const KAPSAM = /^tr-\d+$/;

/* Bir kazanımın sonuna yapışabilen bölüm başlıkları (kapalı küme). */
const BASLIK_SONU = /\s+(Dinleme\/İzleme|Dinleme|İzleme|Okuma|Yazma|Konuşma)\s*$/;
/* Geçerli TYMM kazanım bitişi — ÖLÇÜT 2 için güvence. */
const KAZANIM_BITISI = /(abilme|ebilme)$/;
/* Alt madde yapışması: «… oluşturabilme ı) Konuşmalarında …» */
const ALT_MADDE = /\s+[a-zçğıöşü]\)\s.*$/;

/** Metin kazanım değil, PDF'ten sızmış açıklama/artık mı? */
function artikliMi(t) {
  return BASLIK_SONU.test(t) || ALT_MADDE.test(t) || bozukParagrafMi(t);
}
function bozukParagrafMi(t) {
  return /^[a-zçğıöşü]/.test(t)          /* küçük harfle başlıyor: cümle ortası */
    || /kapsamında yapılır/.test(t)      /* program açıklama paragrafı */
    || /-$/.test(t.trim());              /* satır sonu tirelemesi */
}

function yukle(kaynak) {
  const w = {};
  new Function("window", kaynak)(w);
  return w.MUFREDAT;
}

function main() {
  const kaynak = fs.readFileSync(DOSYA, "utf8");
  const M = yukle(kaynak);
  const K = M._kazanimlar;

  /* ── 1) Her ders-sınıf + kod için sağlam metni belirle ── */
  const duzeltme = [];      /* { dersSinif, kod, bozuk, dogru, adet } */
  const dokunulmayan = [];  /* sağlam karşılığı olmayan bozuk kayıtlar */

  Object.keys(K).forEach(dersSinif => {
    const uniteler = K[dersSinif];
    const koda = {};
    Object.keys(uniteler).forEach(u => (uniteler[u] || []).forEach(z => {
      if (!z || !z.kod) return;
      (koda[z.kod] = koda[z.kod] || []).push(z.k);
    }));

    Object.keys(koda).forEach(kod => {
      const metinler = koda[kod];
      const bozuklar = [...new Set(metinler.filter(artikliMi))];
      if (!bozuklar.length) return;

      if (!KAPSAM.test(dersSinif)) {
        bozuklar.forEach(b => dokunulmayan.push({ dersSinif, kod, metin: b,
          neden: "kapsam dışı ders (kod metni temaya göre değişebilir)" }));
        return;
      }

      const saglamlar = [...new Set(metinler.filter(t => !artikliMi(t)))];
      if (saglamlar.length !== 1) {
        /* ÖLÇÜT 2: kod ikizi yok — yalnız çıplak bölüm başlığı silinebilir. */
        bozuklar.forEach(b => {
          const temiz = b.replace(BASLIK_SONU, "").trim();
          if (temiz !== b && KAZANIM_BITISI.test(temiz)) {
            duzeltme.push({ dersSinif, kod, bozuk: b, dogru: temiz,
              adet: metinler.filter(t => t === b).length, olcut: 2 });
          } else {
            dokunulmayan.push({ dersSinif, kod, metin: b,
              neden: saglamlar.length ? "birden çok sağlam metin (" + saglamlar.length + ")"
                : "veride sağlam karşılık yok" });
          }
        });
        return;
      }

      const dogru = saglamlar[0];
      bozuklar.forEach(bozuk => {
        /* Ek güvence: artık temizlenince sağlam metnin aynısı çıkmalı ya da
           bozuk kayıt bir açıklama paragrafı olmalı. */
        const temiz = bozuk.replace(BASLIK_SONU, "").replace(ALT_MADDE, "").trim();
        if (temiz !== dogru && !bozukParagrafMi(bozuk)) {
          dokunulmayan.push({ dersSinif, kod, metin: bozuk,
            neden: "temizlenmiş metin sağlam metinle örtüşmüyor" });
          return;
        }
        duzeltme.push({ dersSinif, kod, bozuk, dogru,
          adet: metinler.filter(t => t === bozuk).length, olcut: 1 });
      });
    });
  });

  /* ── 2) Kaynak metinde birebir değiştir ── */
  let yeni = kaynak, degisen = 0;
  duzeltme.forEach(d => {
    const eski = '{ k: ' + JSON.stringify(d.bozuk) + ', kod: ' + JSON.stringify(d.kod) + ' }';
    const yerine = '{ k: ' + JSON.stringify(d.dogru) + ', kod: ' + JSON.stringify(d.kod) + ' }';
    const kac = yeni.split(eski).length - 1;
    if (kac !== d.adet) {
      throw new Error("kaynakta beklenen kayıt bulunamadı (" + d.dersSinif + " " + d.kod +
        "): beklenen " + d.adet + ", bulunan " + kac);
    }
    yeni = yeni.split(eski).join(yerine);
    degisen += kac;
  });

  /* ── 3) Kendi kendini denetleme ── */
  const M2 = yukle(yeni);
  const K2 = M2._kazanimlar;

  const say = o => Object.keys(o).reduce((t, dk) =>
    t + Object.keys(o[dk]).reduce((s, u) => s + (o[dk][u] || []).length, 0), 0);
  if (say(K) !== say(K2)) throw new Error("kazanım sayısı değişti: " + say(K) + " → " + say(K2));

  const kodlar = o => Object.keys(o).map(dk => Object.keys(o[dk]).map(u =>
    (o[dk][u] || []).map(z => dk + "|" + u + "|" + (z.kod || "")).join(";")).join(";")).join(";");
  if (kodlar(K) !== kodlar(K2)) throw new Error("kod/ünite yerleşimi değişti");

  let kalan = 0;
  Object.keys(K2).forEach(dk => {
    if (!KAPSAM.test(dk)) return;
    Object.keys(K2[dk]).forEach(u => (K2[dk][u] || []).forEach(z => {
      if (z && z.k && artikliMi(z.k)) { kalan++; console.log("  KALAN ARTIK: " + dk + " " + z.kod + " «" + z.k + "»"); }
    }));
  });

  /* ── 4) Rapor ── */
  const ozet = {};
  duzeltme.forEach(d => { ozet[d.dersSinif] = (ozet[d.dersSinif] || 0) + d.adet; });
  console.log("Düzeltilen kayıt: " + degisen + "  (" +
    Object.keys(ozet).sort().map(k => k + ":" + ozet[k]).join("  ") + ")");
  console.log("Türkçe'de kalan artık: " + kalan + (kalan ? "  !!! " : "  ✓"));
  console.log("Kazanım sayısı ve kod/ünite yerleşimi değişmedi ✓");

  /* Atılan alt madde metinleri sessizce kaybolmasın: veri şemasında alt madde
     (açıklama) için alan yok, bu yüzden metin veriden çıkıyor. Şema ileride
     açıklamaları taşıyacak biçimde genişletilirse buradan geri konabilir. */
  const atilanAltMadde = duzeltme
    .filter(d => ALT_MADDE.test(d.bozuk) && !bozukParagrafMi(d.bozuk))
    .map(d => ({ kod: d.dersSinif + " " + d.kod,
      metin: (d.bozuk.match(ALT_MADDE) || [""])[0].trim() }));
  if (atilanAltMadde.length) {
    console.log("");
    console.log("VERİDEN ÇIKAN ALT MADDE (şemada karşılığı yok, kayda geçsin):");
    atilanAltMadde.forEach(x => console.log("  " + x.kod + ": «" + x.metin + "»"));
  }

  if (dokunulmayan.length) {
    console.log("");
    console.log("DOKUNULMAYAN (resmî PDF'ten alınmalı, metin uydurulmaz): " + dokunulmayan.length);
    const grup = {};
    dokunulmayan.forEach(x => {
      const a = x.dersSinif + " — " + x.neden;
      (grup[a] = grup[a] || []).push(x.kod);
    });
    Object.keys(grup).sort().forEach(a =>
      console.log("  " + a + ": " + [...new Set(grup[a])].join(", ")));
  }

  if (DENE) { console.log("\n(--dene: dosya yazılmadı)"); return; }
  if (!degisen) { console.log("\nDeğişiklik yok; dosya yazılmadı."); return; }
  fs.writeFileSync(DOSYA, yeni);
  console.log("\n" + path.relative(process.cwd(), DOSYA) + " yazıldı.");
}

main();
