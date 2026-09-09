import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createContext, runInContext } from "node:vm";

/* Akıllı Ödev'in müfredat verisi TEK bir yapıda durmuyor; aynı ders/sınıf
   bilgisinin parçaları dört ayrı yerde tutuluyor:

     LEVELS[kademe].subjects  → dersin hangi kademede LİSTELENDİĞİ
     AVAIL[ders]              → dersin hangi sınıflarda OKUTULDUĞU
     AVAIL_NOTE[ders]         → pasif görünen sınıflar için gerekçe metni
     UNITS[ders][sınıf]       → ünite/tema listesi

   Biri eksik kalınca ders SESSİZCE kaybolur: bir kez Din Kültürü 4. sınıfta
   AVAIL izin verdiği ve UNITS dolu olduğu hâlde LEVELS listesinde bulunmadığı
   için arayüzden hiç seçilemedi ve AVAIL_NOTE'taki "4. sınıfta başlar"
   açıklaması hiç görünmedi. Bu testler o sınıf kusurunu tekrar etmeye karşı
   kilittir. Ayrıca UNIT_BANK ve KAPSAM kayıtlarının UNITS'te karşılığı
   olduğunu doğrular — karşılığı olmayan kayıt ölüdür, soru üretimine hiç
   girmez ama bakım sırasında "var" sanılır.

   Veri statik HTML'in içinde gömülü olduğu için sayfa metninden okunur;
   ayrıştırma yalnızca bu dört yapıyı hedefler, motor koduna dokunmaz. */

const SAYFA = resolve(process.cwd(), "public/odev-olustur.html");

function kaynak(): string {
  return readFileSync(SAYFA, "utf8");
}

/** `const AD = { ... };` bloğunu süslü parantez sayarak çıkarır.
 *  Dizge içindeki parantezler ve yorumlar atlanır — soru metinlerinde
 *  hem `{`/`}` hem de apostrof bolca geçiyor. */
function blok(metin: string, ad: string): string {
  const bas = metin.indexOf(`const ${ad} = {`);
  if (bas < 0) throw new Error(`${ad} bulunamadı`);
  let i = metin.indexOf("{", bas);
  const basI = i;
  let derinlik = 0;
  let tirnak: string | null = null;
  let kacis = false;
  for (; i < metin.length; i++) {
    const c = metin[i];
    if (tirnak) {
      if (kacis) kacis = false;
      else if (c === "\\") kacis = true;
      else if (c === tirnak) tirnak = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { tirnak = c; continue; }
    if (c === "/" && metin[i + 1] === "*") { i = metin.indexOf("*/", i) + 1; continue; }
    if (c === "/" && metin[i + 1] === "/") { i = metin.indexOf("\n", i); continue; }
    if (c === "{") derinlik++;
    else if (c === "}") { derinlik--; if (derinlik === 0) return metin.slice(basI, i + 1); }
  }
  throw new Error(`${ad} bloğu kapanmadı`);
}

/** Bir bloğun içindeki `anahtar: { … }` alt bloğunu çıkarır. */
function altBlok(govde: string, anahtar: string): string | null {
  for (const desen of [`"${anahtar}": {`, `${anahtar}: {`]) {
    const bas = govde.indexOf(desen);
    if (bas < 0) continue;
    let i = govde.indexOf("{", bas + desen.length - 1);
    const basI = i;
    let derinlik = 0;
    let tirnak: string | null = null;
    let kacis = false;
    for (; i < govde.length; i++) {
      const c = govde[i];
      if (tirnak) {
        if (kacis) kacis = false;
        else if (c === "\\") kacis = true;
        else if (c === tirnak) tirnak = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") { tirnak = c; continue; }
      if (c === "/" && govde[i + 1] === "*") { i = govde.indexOf("*/", i) + 1; continue; }
      if (c === "{") derinlik++;
      else if (c === "}") { derinlik--; if (derinlik === 0) return govde.slice(basI, i + 1); }
    }
  }
  return null;
}

/** Yorumları söker (dizge içindekilere dokunmadan). Bir tanımlayıcının koddan
 *  gerçekten okunup okunmadığını saymak için gerekir: açıklama blokları o
 *  addan söz ettiği için ham metinde saymak yanıltır. */
function yorumsuz(kaynak: string): string {
  let out = "";
  let tirnak: string | null = null;
  let kacis = false;
  for (let i = 0; i < kaynak.length; i++) {
    const c = kaynak[i];
    if (tirnak) {
      out += c;
      if (kacis) kacis = false;
      else if (c === "\\") kacis = true;
      else if (c === tirnak) tirnak = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { tirnak = c; out += c; continue; }
    if (c === "/" && kaynak[i + 1] === "*") { const s = kaynak.indexOf("*/", i); i = s < 0 ? kaynak.length : s + 1; continue; }
    if (c === "/" && kaynak[i + 1] === "/") { const s = kaynak.indexOf("\n", i); i = s < 0 ? kaynak.length : s - 1; continue; }
    out += c;
  }
  return out;
}

/** `[` konumundan başlayarak dengeli diziyi döndürür (dizge içi atlanır). */
function altDizi(govde: string, basI: number): string | null {
  let derinlik = 0;
  let tirnak: string | null = null;
  let kacis = false;
  for (let i = basI; i < govde.length; i++) {
    const c = govde[i];
    if (tirnak) {
      if (kacis) kacis = false;
      else if (c === "\\") kacis = true;
      else if (c === tirnak) tirnak = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { tirnak = c; continue; }
    if (c === "/" && govde[i + 1] === "*") { i = govde.indexOf("*/", i) + 1; continue; }
    if (c === "[") derinlik++;
    else if (c === "]") { derinlik--; if (derinlik === 0) return govde.slice(basI, i + 1); }
  }
  return null;
}

/** Bir üst düzey anahtar listesi: { "mat-4": {...}, tr: {...} } → ["mat-4","tr"] */
function ustAnahtarlar(blokMetni: string): string[] {
  const govde = blokMetni.slice(1, -1);
  const out: string[] = [];
  let derinlik = 0;
  let tirnak: string | null = null;
  let kacis = false;
  let satirBasi = true;
  let tampon = "";
  for (let i = 0; i < govde.length; i++) {
    const c = govde[i];
    if (tirnak) {
      if (kacis) kacis = false;
      else if (c === "\\") kacis = true;
      else if (c === tirnak) tirnak = null;
      if (derinlik === 0 && satirBasi) tampon += c;
      continue;
    }
    if (c === "/" && govde[i + 1] === "*") { i = govde.indexOf("*/", i) + 1; continue; }
    if (c === "/" && govde[i + 1] === "/") { i = govde.indexOf("\n", i); continue; }
    if (c === '"' || c === "'" || c === "`") {
      tirnak = c;
      if (derinlik === 0 && satirBasi) tampon += c;
      continue;
    }
    if (c === "[") derinlik++;
    else if (c === "]") derinlik--;
    else if (c === "{") derinlik++;
    else if (c === "}") derinlik--;
    else if (derinlik === 0 && c === ":") {
      const ad = tampon.trim().replace(/^["'`]|["'`]$/g, "");
      if (ad) out.push(ad);
      tampon = "";
      satirBasi = false;
    } else if (derinlik === 0 && c === ",") { tampon = ""; satirBasi = true; }
    else if (derinlik === 0 && satirBasi) tampon += c;
  }
  return out;
}

const metin = kaynak();

/* LEVELS: kademe → { grades:[…], subjects:[…] } */
const LEVELS: Record<string, { grades: number[]; subjects: string[] }> = {};
for (const m of blok(metin, "LEVELS").matchAll(
  /(\w+):\s*\{[^}]*?grades:\s*\[([^\]]*)\][^}]*?subjects:\s*\[([^\]]*)\]/g,
)) {
  LEVELS[m[1]] = {
    grades: m[2].split(",").map((x) => Number(x.trim())).filter((n) => !Number.isNaN(n)),
    subjects: [...m[3].matchAll(/"([^"]+)"/g)].map((x) => x[1]),
  };
}

/* AVAIL: ders → sınıf listesi */
const AVAIL: Record<string, number[]> = {};
for (const m of blok(metin, "AVAIL").matchAll(/(\w+):\s*\[([\d,\s]*)\]/g)) {
  AVAIL[m[1]] = m[2].split(",").map((x) => Number(x.trim())).filter((n) => !Number.isNaN(n));
}

const AVAIL_NOTE: Record<string, string> = {};
for (const m of blok(metin, "AVAIL_NOTE").matchAll(/(\w+):\s*"([^"]*)"/g)) {
  AVAIL_NOTE[m[1]] = m[2];
}

/* UNITS: ders → sınıf → ünite adları */
const UNITS: Record<string, Record<string, string[]>> = {};
{
  const govde = blok(metin, "UNITS");
  for (const ders of ustAnahtarlar(govde)) {
    const icerik = altBlok(govde, ders);
    if (!icerik) continue;
    UNITS[ders] = {};
    /* Sınıf dizileri girinti deseniyle DEĞİL köşeli parantez sayarak
       çıkarılır: girintiye bağlı bir regex bazı sınıfları sessizce atlıyor
       ve test "UNITS yok" diye yanlış alarm veriyordu. */
    for (const g of icerik.matchAll(/(\d+):\s*\[/g)) {
      const dizi = altDizi(icerik, g.index! + g[0].length - 1);
      if (dizi === null) continue;
      const adlar = [
        ...dizi.matchAll(/(?:^|[[\s,{])"((?:[^"\\]|\\.)*)"/g),
        ...dizi.matchAll(/u:\s*"((?:[^"\\]|\\.)*)"/g),
      ].map((x) => x[1]);
      UNITS[ders][g[1]] = [...new Set(adlar)];
    }
  }
}

/* ALM_TEMA: Almanca Themenkreis kütüğü (ad → Niveaustufe/TK). */
interface AlmTema { u: string; tr: string; ns: string; tk: string | null }
const ALM_TEMA: AlmTema[] = (() => {
  const m = metin.match(/const ALM_TEMA = \[([\s\S]*?)\n\];/);
  if (!m) throw new Error("ALM_TEMA bulunamadı");
  return [...m[1].matchAll(
    /\{\s*u:\s*"([^"]+)",\s*tr:\s*"([^"]+)",\s*ns:\s*"([^"]+)",\s*tk:\s*(?:"([^"]+)"|null)\s*\}/g,
  )].map((x) => ({ u: x[1], tr: x[2], ns: x[3], tk: x[4] ?? null }));
})();

/* ALM_HAT'ın etkin hattındaki sınıf → Niveaustufe eşlemesi. */
const ALM_SEVIYE: Record<string, string> = (() => {
  const hat = metin.match(/const ALM_AKTIF_HAT = "(\w+)";/);
  if (!hat) throw new Error("ALM_AKTIF_HAT bulunamadı");
  const govde = altBlok(blok(metin, "ALM_HAT"), hat[1]);
  if (!govde) throw new Error(`ALM_HAT.${hat[1]} yok`);
  const sv = govde.match(/seviye:\s*\{([^}]*)\}/);
  if (!sv) throw new Error("seviye tablosu yok");
  const out: Record<string, string> = {};
  for (const m of sv[1].matchAll(/(\d+):\s*"([^"]+)"/g)) out[m[1]] = m[2];
  return out;
})();

/* Almanca sınıf listesi artık literal DEĞİL, motorda kütükten türetiliyor.
   Test de aynı kuralı uygular; yoksa UNITS.alm boş görünür ve buradaki
   bütün ortak denetimler (ölü kayıt, AVAIL uyumu…) Almancayı atlar. */
UNITS.alm = {};
for (const [g, ns] of Object.entries(ALM_SEVIYE)) {
  UNITS.alm[g] = ALM_TEMA.filter((t) => t.ns === ns).map((t) => t.u);
}

/** Bir UNIT_BANK/KAPSAM anahtarının hangi ünite adlarını kapsadığı.
 *  Almanca anahtarları sınıf değil SEVİYE taşır ("alm-A1.1"). */
function anahtarinUniteleri(ders: string, sinif: string): string[] | null {
  if (ders === "alm") {
    const temalar = ALM_TEMA.filter((t) => t.ns === sinif).map((t) => t.u);
    return temalar.length ? temalar : null;
  }
  return UNITS[ders]?.[sinif] ?? null;
}

describe("müfredat veri yapıları birbirini tutuyor", () => {
  it("dört yapı da okunabildi", () => {
    expect(Object.keys(LEVELS).length).toBeGreaterThan(0);
    expect(Object.keys(AVAIL).length).toBeGreaterThan(0);
    expect(Object.keys(UNITS).length).toBeGreaterThan(0);
  });

  it("UNITS'te tanımlı her ders bir kademede LİSTELENİYOR", () => {
    const listeli = new Set(Object.values(LEVELS).flatMap((l) => l.subjects));
    const kayip = Object.keys(UNITS).filter((s) => !listeli.has(s));
    expect(kayip, `UNITS'te var ama hiçbir LEVELS.subjects listesinde yok: ${kayip.join(", ")}`)
      .toEqual([]);
  });

  it("LEVELS'te listelenen her dersin AVAIL ve UNITS kaydı var", () => {
    const eksik: string[] = [];
    for (const [kademe, l] of Object.entries(LEVELS)) {
      for (const s of l.subjects) {
        if (!AVAIL[s]) eksik.push(`${kademe}/${s}: AVAIL yok`);
        if (!UNITS[s]) eksik.push(`${kademe}/${s}: UNITS yok`);
      }
    }
    expect(eksik, eksik.join(" | ")).toEqual([]);
  });

  it("AVAIL izin veren her ders-sınıf için ünite listesi dolu", () => {
    const bos: string[] = [];
    for (const [s, siniflar] of Object.entries(AVAIL)) {
      if (!UNITS[s]) continue;
      for (const g of siniflar) {
        if (!UNITS[s][String(g)]?.length) bos.push(`${s}-${g}`);
      }
    }
    expect(bos, `AVAIL açık ama ünite listesi boş: ${bos.join(", ")}`).toEqual([]);
  });

  it("ünite listesi olan her ders-sınıfa AVAIL izin veriyor", () => {
    const erisilemez: string[] = [];
    for (const [s, siniflar] of Object.entries(UNITS)) {
      for (const g of Object.keys(siniflar)) {
        if (!siniflar[g].length) continue;
        if (!AVAIL[s]?.includes(Number(g))) erisilemez.push(`${s}-${g}`);
      }
    }
    expect(erisilemez, `ünite var ama AVAIL kapalı: ${erisilemez.join(", ")}`).toEqual([]);
  });

  it("AVAIL izin veren her sınıf, dersin listelendiği bir kademede bulunuyor", () => {
    const disarida: string[] = [];
    for (const [s, siniflar] of Object.entries(AVAIL)) {
      const kapsanan = new Set(
        Object.values(LEVELS).filter((l) => l.subjects.includes(s)).flatMap((l) => l.grades),
      );
      for (const g of siniflar) if (!kapsanan.has(g)) disarida.push(`${s}-${g}`);
    }
    expect(disarida, `AVAIL açık ama hiçbir kademede seçilemez: ${disarida.join(", ")}`)
      .toEqual([]);
  });

  it("AVAIL_NOTE gerçeği yansıtıyor (ölü ya da çelişkili not yok)", () => {
    const sorun: string[] = [];
    for (const [s, not] of Object.entries(AVAIL_NOTE)) {
      if (!AVAIL[s]) { sorun.push(`${s}: not var, ders yok`); continue; }
      const kapsanan = Object.values(LEVELS)
        .filter((l) => l.subjects.includes(s))
        .flatMap((l) => l.grades);
      if (!kapsanan.some((g) => !AVAIL[s].includes(g)))
        sorun.push(`${s}: not hiçbir sınıfta gösterilemez (ölü metin)`);
      const baslar = not.match(/(\d+)\.\s*sınıfta başlar/);
      if (baslar && Math.min(...AVAIL[s]) !== Number(baslar[1]))
        sorun.push(`${s}: not "${baslar[1]}. sınıfta başlar", AVAIL en küçük ${Math.min(...AVAIL[s])}`);
      const aralik = not.match(/(\d+)\s*-\s*(\d+)\.\s*sınıflarda okutulur/);
      if (aralik) {
        const bek = [];
        for (let i = Number(aralik[1]); i <= Number(aralik[2]); i++) bek.push(i);
        const zorunlu = AVAIL[s].filter((g) => g <= 8);
        if (bek.join(",") !== zorunlu.join(","))
          sorun.push(`${s}: not "${aralik[1]}-${aralik[2]}", AVAIL [${zorunlu.join(",")}]`);
      }
    }
    expect(sorun, sorun.join(" | ")).toEqual([]);
  });

  it("bazı sınıflarda pasif görünen her dersin gerekçe notu var", () => {
    const notsuz: string[] = [];
    for (const [s, siniflar] of Object.entries(AVAIL)) {
      const kapsanan = Object.values(LEVELS)
        .filter((l) => l.subjects.includes(s))
        .flatMap((l) => l.grades);
      if (kapsanan.some((g) => !siniflar.includes(g)) && !AVAIL_NOTE[s]) notsuz.push(s);
    }
    expect(notsuz, `pasif gösteriliyor ama gerekçesi yok: ${notsuz.join(", ")}`).toEqual([]);
  });

  it("aynı sınıfta yinelenen ünite adı yok", () => {
    const yineleyen: string[] = [];
    for (const [s, siniflar] of Object.entries(UNITS)) {
      for (const [g, adlar] of Object.entries(siniflar)) {
        if (new Set(adlar).size !== adlar.length) yineleyen.push(`${s}-${g}`);
      }
    }
    expect(yineleyen, yineleyen.join(", ")).toEqual([]);
  });

  it("UNIT_BANK ve KAPSAM kayıtlarının UNITS'te karşılığı var (ölü kayıt yok)", () => {
    const olu: string[] = [];
    for (const yapi of ["UNIT_BANK", "KAPSAM"]) {
      const govde = blok(metin, yapi);
      for (const anahtar of ustAnahtarlar(govde)) {
        const kesme = anahtar.lastIndexOf("-");
        const ders = anahtar.slice(0, kesme);
        const sinif = anahtar.slice(kesme + 1);
        /* Almanca anahtarı sınıf değil Niveaustufe taşır ("alm-A1.1"); karşılığı
           UNITS'ten değil tema kütüğünden çözülür. */
        const kapsanan = anahtarinUniteleri(ders, sinif);
        if (!kapsanan) { olu.push(`${yapi}/${anahtar}: ${ders}/${sinif} karşılığı yok`); continue; }
        /* Blok içindeki ünite adı anahtarlarını çıkar ve karşılaştır.
           Karşılığı olmayan ad, hiç kullanılmayan (ölü) kayıt demektir. */
        const parca = altBlok(govde, anahtar);
        if (!parca) continue;
        const tanimli = new Set(kapsanan);
        for (const ad of ustAnahtarlar(parca)) {
          if (!tanimli.has(ad)) olu.push(`${yapi}/${anahtar} → "${ad}" UNITS'te yok`);
        }
      }
    }
    expect(olu, olu.join(" | ")).toEqual([]);
  });

  it("ARSIV_BANK gerçekten park hâlinde (üretime sızmıyor, UNITS'te görünmüyor)", () => {
    /* Sınıf dışı çıkan soru blokları silinmek yerine ARSIV_BANK'a taşınıyor.
       İki şey birden doğru olmalı: (1) arşivdeki başlıklar öğrenciye
       gösterilen UNITS listesinde BULUNMAMALI, (2) motor arşivi hiç
       OKUMAMALI — okursa "kaldırdık" dediğimiz içerik kâğıda geri gelir. */
    if (metin.indexOf("const ARSIV_BANK") < 0) return;      // arşiv yoksa denetlenecek şey de yok
    const govde = blok(metin, "ARSIV_BANK");
    for (const anahtar of ustAnahtarlar(govde)) {
      const kesme = anahtar.lastIndexOf("-");
      const ders = anahtar.slice(0, kesme), sinif = anahtar.slice(kesme + 1);
      const parca = altBlok(govde, anahtar);
      if (!parca) continue;
      const gorunen = new Set(UNITS[ders]?.[sinif] ?? []);
      for (const ad of ustAnahtarlar(parca)) {
        expect(gorunen.has(ad), `arşivdeki "${ad}" hâlâ UNITS[${ders}][${sinif}] içinde`).toBe(false);
      }
    }
    /* Tanım dışında ARSIV_BANK'a yapılan her atıf onu üretime bağlar.
       Sayım YORUMSUZ metin üzerinde yapılır: açıklama blokları arşivden
       söz ettiği için satır-içi yorum deseni aramak yetmiyordu. */
    const atif = [...yorumsuz(metin).matchAll(/ARSIV_BANK/g)].length;
    expect(atif, `ARSIV_BANK koda ${atif - 1} kez daha geçiyor — arşiv üretime sızmış olur`)
      .toBe(1);
  });

  it("bütün rastgelelik tek kaynaktan geçiyor (test tohumu işe yarasın)", () => {
    /* Regresyon taraması ancak üretim deterministik hâle getirilebilirse
       güvenilir olur. `KKRastgele.tohumla(n)` yalnızca BÜTÜN rastgelelik
       `rastgele()` üzerinden akarsa çalışır; koda doğrudan bir
       `Math.random()` sızarsa tohum o çağrıyı bağlamaz ve tarama yeniden
       gürültülü olur. Tek meşru geçiş, varsayılan kaynağın kendisidir. */
    const govde = metin.slice(metin.indexOf("/* ═══════════════ YARDIMCILAR"));
    const dogrudan = [...govde.matchAll(/Math\.random\(\)/g)].length;
    const varsayilan = [...govde.matchAll(/rastgeleKaynak = Math\.random/g)].length;
    expect(varsayilan, "varsayılan rastgelelik kaynağı tanımlı değil").toBeGreaterThan(0);
    expect(dogrudan, `rastgele() dışına kaçmış ${dogrudan} adet Math.random() çağrısı var`)
      .toBe(0);
    expect(govde).toContain("KKRastgele");
  });

  it("2026-2027 program geçişi tablosu koda uyuyor", () => {
    const m = metin.match(/const TYMM_SINIFLARI = new Set\(\[([\d,\s]+)\]\)/);
    expect(m, "TYMM_SINIFLARI bulunamadı").not.toBeNull();
    const kodda = m![1].split(",").map((x) => Number(x.trim())).sort((a, b) => a - b);
    /* 2026-2027: 1-2-3 / 5-6-7 / 9-10-11 Türkiye Yüzyılı Maarif Modeli;
       4, 8 ve 12. sınıflar önceki öğretim programıyla devam ediyor. */
    expect(kodda).toEqual([1, 2, 3, 5, 6, 7, 9, 10, 11]);
  });
});

/* Almanca C aşaması — "Zahlen und Uhrzeit" resmî bir Themenkreis değildi;
   içeriği A1.1/TK1 (Zahlen bis 20 → Informationen zur Person) ile A1.1/TK4
   (Uhrzeit und Tageszeit → Tägliches Leben) arasında dağıtıldı, 20 üstü
   çıplak sayılar arşive alındı. Aşağıdaki vakalar başlığın tema listesine
   geri sızmasına ve taşınan içeriğin resmî kapsam maddesini yitirmesine
   karşı kilittir. */
describe("Almanca temaları resmî Themenkreis yapısına uyuyor", () => {
  const KALDIRILAN = "Zahlen und Uhrzeit";
  const SEVIYE_ANAHTARLARI = ["alm-A1.1", "alm-A1.2"];

  it("kaldırılan başlık hiçbir üretim yapısında kalmadı", () => {
    for (const ad of ["UNIT_BANK", "KAPSAM"]) {
      for (const anahtar of SEVIYE_ANAHTARLARI) {
        const parca = altBlok(blok(metin, ad), anahtar);
        expect(parca, `${ad}[${anahtar}] okunamadı`).not.toBeNull();
        expect(ustAnahtarlar(parca!), `${ad} içinde kaldırılan tema duruyor`)
          .not.toContain(KALDIRILAN);
      }
    }
    for (const sinif of ["9", "10", "11", "12"]) {
      expect(UNITS.alm?.[sinif] ?? []).not.toContain(KALDIRILAN);
    }
  });

  it("güvenle atanamayan sayı soruları silinmedi, arşivde duruyor", () => {
    /* 20 üstü çıplak sayılar TK1'in "bis 20" sınırına girmiyor; fiyat ya da
       miktar bağlamı da taşımadıkları için Einkaufen / Essen und Trinken
       gerekçelendirilemedi. Karar verilemeyen soru silinmez, park edilir. */
    const parca = altBlok(blok(metin, "ARSIV_BANK"), "alm-9");
    expect(parca, "ARSIV_BANK[alm-9] yok").not.toBeNull();
    expect(ustAnahtarlar(parca!)).toContain(KALDIRILAN);
  });

  it("taşınan içeriğin resmî kapsam maddesi yerinde", () => {
    /* Kapsam maddesi düşerse sorular üretime girmeye devam eder ama kâğıt
       kazanım etiketini yitirir — sessiz kayıp olur, bu yüzden kilitli. */
    const kapsam = blok(metin, "KAPSAM");
    const satir = (govde: string, ara: string) =>
      govde.split("\n").find((l) => l.indexOf(ara) >= 0);

    /* İki tema da A1.1 olduğu için ikisinin kapsamı da aynı seviye anahtarında. */
    const a11 = altBlok(kapsam, "alm-A1.1");
    expect(a11, "KAPSAM[alm-A1.1] okunamadı").not.toBeNull();

    const sayi = satir(a11!, "Zahlen bis 20");
    expect(sayi, "TK1 sayı maddesi yok").toBeTruthy();
    expect(sayi!).toContain("A1.1/TK1");

    const saat = satir(a11!, "Uhrzeit und Tageszeit");
    expect(saat, "TK4 saat maddesi yok").toBeTruthy();
    expect(saat!).toContain("A1.1/TK4");
  });
});

/* ── Almanca program hattı (D aşaması) ─────────────────────────────────
   Almanca programı temaları SINIFA değil NIVEAUSTUFE'ye bağlar. Kaynak
   Kampüs'ün varsayılan hattı "2. yabancı dil – hazırlık sınıfı yok"tur:
   9–10 → A1.1, 11–12 → A1.2. Elle tutulan sınıf listesi bu ilişkiyi
   kaybettiği için A2.1–B1.2 temaları (Arbeit und Berufe, Medien, Kultur,
   Umwelt) 12. sınıfta görünüyordu. Liste artık kütükten türetiliyor;
   aşağıdakiler o temaların geri sızmasına karşı kilittir. */
describe("Almanca varsayılan program hattı doğru", () => {
  const HAT_SEVIYELERI = ["A1.1", "A1.2"];
  const HAT_DISI = ["Arbeit und Berufe", "Medien", "Kultur", "Umwelt"];

  it("sınıf → Niveaustufe eşlemesi varsayılan hatta uyuyor", () => {
    expect(ALM_SEVIYE).toEqual({ 9: "A1.1", 10: "A1.1", 11: "A1.2", 12: "A1.2" });
  });

  it("kütükteki her tema hattın seviyesinde", () => {
    /* Bir A2/B teması kütüğe eklenirse sessizce listeye girer; burada düşer. */
    for (const t of ALM_TEMA) {
      expect(HAT_SEVIYELERI, `"${t.u}" seviyesi hat dışı: ${t.ns}`).toContain(t.ns);
    }
    expect(ALM_TEMA.length).toBeGreaterThan(0);
  });

  it("9–10 yalnız A1.1, 11–12 yalnız A1.2 gösteriyor", () => {
    for (const [sinif, ns] of Object.entries(ALM_SEVIYE)) {
      const gorunen = UNITS.alm[sinif] ?? [];
      expect(gorunen.length, `${sinif}. sınıf boş`).toBeGreaterThan(0);
      for (const ad of gorunen) {
        const t = ALM_TEMA.find((x) => x.u === ad);
        expect(t, `"${ad}" kütükte yok`).toBeTruthy();
        expect(t!.ns, `${sinif}. sınıfta ${t!.ns} teması: "${ad}"`).toBe(ns);
      }
    }
    /* Aynı seviyedeki iki sınıf aynı listeyi görür. */
    expect(UNITS.alm["9"]).toEqual(UNITS.alm["10"]);
    expect(UNITS.alm["11"]).toEqual(UNITS.alm["12"]);
  });

  it("üst seviye dört tema hiçbir sınıfta görünmüyor", () => {
    for (const sinif of Object.keys(ALM_SEVIYE)) {
      for (const ad of HAT_DISI) {
        expect(UNITS.alm[sinif] ?? [], `${sinif}. sınıfta "${ad}"`).not.toContain(ad);
      }
    }
    for (const ad of HAT_DISI) {
      expect(ALM_TEMA.map((t) => t.u), `"${ad}" kütüğe geri girmiş`).not.toContain(ad);
    }
  });

  it("üst seviye temalar silinmedi, Niveaustufe'siyle saklandı", () => {
    /* Hazırlık sınıflı hat açıldığında yeniden kullanılacaklar; seviye bilgisi
       kaybolursa hangi hatta ait oldukları bir daha bilinemez. */
    const govde = altBlok(blok(metin, "PROGRAM_DISI_BANK"), "alm");
    expect(govde, "PROGRAM_DISI_BANK.alm yok").not.toBeNull();
    const kayitlar = [...govde!.matchAll(/"([^"]+)": \{\s*[\r\n]+\s*ns: "([^"]+)"/g)]
      .map((m) => [m[1], m[2]]);
    expect(Object.fromEntries(kayitlar)).toEqual({
      "Arbeit und Berufe": "A2.1",
      "Medien": "A2.2",
      "Kultur": "B1.1",
      "Umwelt": "B1.2",
    });
    /* Sorular gerçekten duruyor mu (boş kabuk bırakılmadı mı)? */
    let toplam = 0;
    for (const [ad] of kayitlar) {
      const kayit = altBlok(govde!, ad);
      expect(kayit, `"${ad}" kaydı okunamadı`).not.toBeNull();
      const soru = (kayit!.match(/\{ty:/g) ?? []).length;
      expect(soru, `"${ad}" soruları boş`).toBeGreaterThan(0);
      toplam += soru;
    }
    /* Dört temanın toplamı: hat dışına çıkarılan soru sayısı. */
    expect(toplam).toBe(111);
  });

  it("PROGRAM_DISI_BANK üretime bağlı değil", () => {
    /* ARSIV_BANK'la aynı kural: tanım dışında bir atıf onu üretime bağlar. */
    const atif = [...yorumsuz(metin).matchAll(/PROGRAM_DISI_BANK/g)].length;
    expect(atif, `PROGRAM_DISI_BANK koda ${atif - 1} kez daha geçiyor`).toBe(1);
  });

  it("her kütük teması bir seviye bankasına düşüyor", () => {
    /* Tema listede görünüp bankası bulunmazsa üretim boş kâğıt verir. */
    const bankalar: Record<string, string[]> = {};
    for (const ns of HAT_SEVIYELERI) {
      const parca = altBlok(blok(metin, "UNIT_BANK"), `alm-${ns}`);
      expect(parca, `UNIT_BANK[alm-${ns}] yok`).not.toBeNull();
      bankalar[ns] = ustAnahtarlar(parca!);
    }
    for (const t of ALM_TEMA) {
      expect(bankalar[t.ns], `"${t.u}" bankası yok`).toContain(t.u);
    }
    /* Ters yön: bankada kütükte olmayan tema kalmasın. */
    for (const ns of HAT_SEVIYELERI) {
      for (const ad of bankalar[ns]) {
        expect(ALM_TEMA.map((t) => t.u), `UNIT_BANK[alm-${ns}] içinde ölü "${ad}"`).toContain(ad);
      }
    }
  });
});

/* ── Kapsam eşleştirmesinde harf durumu ────────────────────────────────
   Bu blok metin araması yapmaz: normalizasyon ve eşleştirme fonksiyonlarını
   sayfadan söküp node:vm içinde GERÇEKTEN çalıştırır, çünkü kusur kaynağın
   nasıl yazıldığında değil nasıl davrandığındaydı.

   Kusur: karşılaştırma metni her derste `toLocaleLowerCase("tr")` ile
   küçültülüyordu. Türkçede doğru olan bu davranış ("IŞIK" → "ışık") Latin
   alfabeli yabancı dil derslerinde büyük "I" harfini "ı"ya çevirdiği için
   "Ich heiße" → "ıch heiße" oluyor, KAPSAM'ın "ich heiße" anahtarı hiç
   tutmuyordu. Karşı yönde de bir tuzak var: Türkçe büyük "İ" Unicode
   küçültmesinde "i" + birleşen nokta (U+0307) olarak açılır ve terim
   süzgeci o noktayı düşürünce iki taraf yine ayrışır. */
describe("kapsam eşleştirmesi harf durumunu dile göre çözüyor", () => {
  /** `function AD(...) { … }` gövdesini süslü parantez sayarak söker. */
  function fonksiyon(ad: string): string {
    const bas = metin.indexOf(`function ${ad}(`);
    if (bas < 0) throw new Error(`${ad} bulunamadı`);
    let i = metin.indexOf("{", bas);
    const basI = bas;
    let derinlik = 0;
    let tirnak: string | null = null;
    let kacis = false;
    for (; i < metin.length; i++) {
      const c = metin[i];
      if (tirnak) {
        if (kacis) kacis = false;
        else if (c === "\\") kacis = true;
        else if (c === tirnak) tirnak = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") { tirnak = c; continue; }
      if (c === "/" && metin[i + 1] === "*") { i = metin.indexOf("*/", i) + 1; continue; }
      if (c === "/" && metin[i + 1] === "/") { i = metin.indexOf("\n", i); continue; }
      if (c === "{") derinlik++;
      else if (c === "}") { derinlik--; if (derinlik === 0) return metin.slice(basI, i + 1); }
    }
    throw new Error(`${ad} gövdesi kapanmadı`);
  }

  /** Tek satırlık `const AD = …;` bildirimi. */
  function sabit(ad: string): string {
    const m = metin.match(new RegExp(`^const ${ad} = .*$`, "m"));
    if (!m) throw new Error(`${ad} bulunamadı`);
    return m[0];
  }

  /* Motorun gerçek kodu; `st` dışarıdan verilir ki ders değiştirilebilsin. */
  const sandik: {
    st: { subject: string };
    normalMetin: (s: string, dil: string) => string;
    karsilastirmaDili: (subject?: string) => string;
    kapsamEtiketi: (q: Record<string, unknown>, kapsam: KapsamMaddesi[]) => number;
  } = createContext({ st: { subject: "alm" } }) as never;
  runInContext([
    sabit("YABANCI_DIL_DERSI"),
    fonksiyon("karsilastirmaDili"),
    fonksiyon("normalMetin"),
    sabit("normalBellek"),
    fonksiyon("normalAnahtar"),
    fonksiyon("kapsamEtiketi"),
  ].join("\n"), sandik as never);

  interface KapsamMaddesi { k: string; kod: string | null; a: string[] }

  /** KAPSAM'daki gerçek maddeleri okur — test kendi kopyasını uydurmasın. */
  function maddeler(dersSinif: string, unite: string): KapsamMaddesi[] {
    const govde = altBlok(blok(metin, "KAPSAM"), dersSinif);
    if (!govde) throw new Error(`KAPSAM[${dersSinif}] yok`);
    const bas = govde.indexOf(`"${unite}": [`);
    if (bas < 0) throw new Error(`${unite} yok`);
    const dizi = altDizi(govde, govde.indexOf("[", bas));
    if (!dizi) throw new Error(`${unite} dizisi kapanmadı`);
    return [...dizi.matchAll(/\{\s*k:\s*"((?:[^"\\]|\\.)*)"\s*,\s*kod:\s*"([^"]*)"\s*,\s*a:\s*\[([^\]]*)\]/g)]
      .map((m) => ({
        k: m[1],
        kod: m[2],
        a: [...m[3].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1].replace(/\\"/g, '"')),
      }));
  }

  it("ders dili doğru seçiliyor", () => {
    expect(sandik.karsilastirmaDili("alm")).toBe("und");
    expect(sandik.karsilastirmaDili("ing")).toBe("und");
    /* Türkçe işleyen bütün dersler eski davranışta kalır. */
    for (const d of ["tr", "tde", "ink", "mat", "din", "fen", "sos", "hay", "fiz", "kim", "bio"]) {
      expect(sandik.karsilastirmaDili(d), `${d} Türkçe olmalı`).toBe("tr");
    }
  });

  it("Almanca metinde büyük I hiçbir yolda ı olmuyor", () => {
    expect(sandik.normalMetin("Ich heiße Anna.", "und")).toBe("ich heiße anna.");
    expect(sandik.normalMetin("Ich stehe um sieben Uhr auf.", "und"))
      .toBe("ich stehe um sieben uhr auf.");
    expect(sandik.normalMetin("Ich heiße Anna.", "und")).not.toContain("ı");
  });

  it("Almanca harfleri ve aksanlar korunuyor", () => {
    /* Silinselerdi "über" ile "uber" aynı sayılır, yanlış madde kazanırdı. */
    const t = sandik.normalMetin("Getränk STRAßE Größe Über", "und");
    expect(t).toBe("getränk straße größe über");
  });

  it("Türkçe küçültme davranışı korunuyor (regresyon)", () => {
    expect(sandik.normalMetin("IŞIK", "tr")).toBe("ışık");
    expect(sandik.normalMetin("İSTANBUL", "tr")).toBe("istanbul");
    expect(sandik.normalMetin("Millî Mücadele", "tr")).toBe("millî mücadele");
  });

  it("Türkçe büyük İ birleşen nokta bırakmıyor", () => {
    /* "İzin verme" Unicode küçültmesinde "i" + U+0307 olur; nokta bazı
       süzgeçlerde düşüp iki tarafı ayırıyor ve İngilizce ünitelerinde
       Türkçe terimlerin eşleşmesini bozuyordu. */
    const t = sandik.normalMetin("İzin verme", "und");
    expect(t).toBe("izin verme");
    expect(t).not.toContain("\u0307");
  });

  it("Ich heiße sorusu TK1 vorstellen maddesine bağlanıyor", () => {
    sandik.st.subject = "alm";
    const kapsam = maddeler("alm-A1.1", "Informationen zur Person");
    const ix = sandik.kapsamEtiketi({ ty: "mc", q: "Ich heiße Anna." }, kapsam);
    expect(ix, "hiçbir maddeye bağlanmadı").toBeGreaterThanOrEqual(0);
    expect(kapsam[ix].k).toContain("vorstellen");
    expect(kapsam[ix].kod).toBe("A1.1/TK1");
  });

  it("Uhrzeit sorusu TK4 kapsamına bağlanıyor", () => {
    sandik.st.subject = "alm";
    const kapsam = maddeler("alm-A1.1", "Tägliches Leben");
    const ix = sandik.kapsamEtiketi({ ty: "mc", q: "Ich stehe um sieben Uhr auf." }, kapsam);
    expect(ix, "hiçbir maddeye bağlanmadı").toBeGreaterThanOrEqual(0);
    expect(kapsam[ix].kod).toBe("A1.1/TK4");
  });

  it("Türkçe derste eşleşme dili değişmiyor (regresyon)", () => {
    /* Aynı kod Türkçe derste çalıştığında Türkçe küçültme kullanılmalı:
       "Işık" terimi "ışık" anahtarıyla eskisi gibi buluşmalı. */
    sandik.st.subject = "fen";
    const kapsam: KapsamMaddesi[] = [{ k: "ışık", kod: "5.1.1", a: ["ışık"] }];
    expect(sandik.kapsamEtiketi({ ty: "tf", q: "Işık doğrusal yolla yayılır." }, kapsam)).toBe(0);
    sandik.st.subject = "alm";
  });
});
