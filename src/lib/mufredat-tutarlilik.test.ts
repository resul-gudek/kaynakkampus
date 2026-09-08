import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
        if (!UNITS[ders]?.[sinif]) { olu.push(`${yapi}/${anahtar}: UNITS[${ders}][${sinif}] yok`); continue; }
        /* Blok içindeki ünite adı anahtarlarını çıkar ve UNITS ile karşılaştır.
           Karşılığı olmayan ad, hiç kullanılmayan (ölü) kayıt demektir. */
        const parca = altBlok(govde, anahtar);
        if (!parca) continue;
        const tanimli = new Set(UNITS[ders][sinif]);
        for (const ad of ustAnahtarlar(parca)) {
          if (!tanimli.has(ad)) olu.push(`${yapi}/${anahtar} → "${ad}" UNITS'te yok`);
        }
      }
    }
    expect(olu, olu.join(" | ")).toEqual([]);
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
