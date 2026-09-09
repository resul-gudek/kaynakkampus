import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";

/* BEP'in müfredat kaynağı `public/assets/mufredat.js`, aynı ders-sınıf
   bilgisini ALTI ayrı yapıda tutuyor:

     UNITELER[ders][sinif]        → resmî ünite/tema listesi
     KAZANIMLAR["ders-sinif"]     → ünite → resmî öğrenme çıktıları
     KUNYE["ders-sinif"]          → kaynak künyesi (program adı, yıl, PDF)
     PROGRAM["ders-sinif"]        → ünite listesinin geldiği program sürümü
     PROGRAM_DURUMU[sinif]        → 2026-2027 sınıf düzeyi geçiş tablosu
     PROGRAM_ISTISNA["ders-sinif"]→ sınıf kuralından ders bazlı sapma

   Bir kayıt bir yapıda olup ötekinde eksik kalınca ders SESSİZCE kaybolur ya
   da YANLIŞ PROGRAM SÜRÜMÜNE düşer. İki kez yaşandı: Din Kültürü 4. sınıfta
   veri hazır olduğu hâlde arayüzden seçilemiyordu; Almanca 9/10/11 yalnızca
   "9-11 sınıfları TYMM'dir" kuralına bakılarak TYMM işaretlenmişti, oysa
   TYMM'nin ortaöğretim Almanca programı hiç yayımlanmamıştır.

   Dosya bir IIFE'dir ve `window.MUFREDAT`'a yazar; testte sahte bir `window`
   ile çalıştırılır. İç yapılar zaten `_` önekiyle dışa veriliyor, bu yüzden
   metin ayrıştırmaya gerek yoktur. */

type Kunye = {
  programTuru: string;
  programAdi: string;
  programYili: number;
  uygulamaEgitimYili: string;
  kaynakPdf: string;
  kaynakUrl: string;
  kaynakKapsami: string;
  veriDerinligi: string;
};
type Kazanim = { k: string; kod?: string };
type Mufredat = {
  programDurumu(sinif: number | string, ders?: string): string;
  tymmMi(sinif: number | string, ders?: string): boolean;
  programIstisnasi(ders: string, sinif: number | string): { program: string; gerekce: string } | null;
  kaynakKunyesi(ders: string, sinif: number | string): Kunye | null;
  uniteListesi(ders: string, sinif: number | string): string[];
  kazanimListesi(ders: string, sinif: number | string, unite: string): Kazanim[];
  _uniteler: Record<string, Record<string, string[]>>;
  _kazanimlar: Record<string, Record<string, Kazanim[]>>;
  _kunye: Record<string, Kunye>;
  _program: Record<string, string>;
  _programDurumu: Record<string, string>;
  _istisna: Record<string, { program: string; gerekce: string }>;
};

function yukle(): Mufredat {
  const kaynak = readFileSync(resolve(process.cwd(), "public/assets/mufredat.js"), "utf8");
  const pencere: { MUFREDAT?: Mufredat } = {};
  runInNewContext(kaynak, { window: pencere });
  if (!pencere.MUFREDAT) throw new Error("mufredat.js window.MUFREDAT yazmadı");
  return pencere.MUFREDAT;
}

const M = yukle();
const SURUMLER = ["tymm", "onceki"];

/** UNITELER'i dolu olan her ders-sınıf — "aktif" kayıt budur. */
const AKTIF: { ders: string; sinif: number; anahtar: string }[] = [];
for (const ders of Object.keys(M._uniteler)) {
  for (const sinif of Object.keys(M._uniteler[ders])) {
    if (M._uniteler[ders][sinif]?.length) {
      AKTIF.push({ ders, sinif: Number(sinif), anahtar: ders + "-" + sinif });
    }
  }
}
const AKTIF_ANAHTAR = new Set(AKTIF.map((x) => x.anahtar));

describe("BEP müfredat kaynağı: yapılar birbirini tutuyor", () => {
  it("mufredat.js yüklendi ve altı yapının hepsi okunabiliyor", () => {
    expect(AKTIF.length, "hiç aktif ders-sınıf yok").toBeGreaterThan(50);
    for (const ad of ["_uniteler", "_kazanimlar", "_kunye", "_program", "_programDurumu", "_istisna"] as const) {
      expect(Object.keys(M[ad]).length, `${ad} boş`).toBeGreaterThan(0);
    }
  });

  it("1) UNITELER olan her ders-sınıf için geçerli bir program sürümü hesaplanıyor", () => {
    const kotu: string[] = [];
    for (const { ders, sinif, anahtar } of AKTIF) {
      const pd = M.programDurumu(sinif, ders);
      if (!SURUMLER.includes(pd)) kotu.push(`${anahtar}: "${pd}"`);
    }
    expect(kotu, `geçersiz program sürümü: ${kotu.join(", ")}`).toEqual([]);
  });

  it("2) PROGRAM + PROGRAM_ISTISNA birlikte programDurumu() ile aynı sonucu veriyor", () => {
    const fark: string[] = [];
    for (const { ders, sinif, anahtar } of AKTIF) {
      const pd = M.programDurumu(sinif, ders);
      const pr = M._program[anahtar];
      if (pr && pr !== pd) fark.push(`${anahtar}: PROGRAM=${pr} ≠ programDurumu=${pd}`);
      /* İstisna varsa programDurumu onu izlemeli ve PROGRAM da onunla uyumlu olmalı */
      const ist = M._istisna[anahtar];
      if (ist) {
        if (pd !== ist.program) fark.push(`${anahtar}: istisna=${ist.program} ≠ programDurumu=${pd}`);
        if (pr && pr !== ist.program) fark.push(`${anahtar}: istisna=${ist.program} ≠ PROGRAM=${pr}`);
      }
    }
    expect(fark, fark.join(" | ")).toEqual([]);
  });

  it("3) tymmMi() ile programDurumu() çelişmiyor", () => {
    const celiski: string[] = [];
    for (const { ders, sinif, anahtar } of AKTIF) {
      const pd = M.programDurumu(sinif, ders);
      const t = M.tymmMi(sinif, ders);
      if (t !== (pd === "tymm")) celiski.push(`${anahtar}: programDurumu=${pd} ama tymmMi=${t}`);
    }
    expect(celiski, celiski.join(" | ")).toEqual([]);
  });

  it("4) aktif her ders-sınıfın kaynak künyesi var", () => {
    const eksik = AKTIF.filter((x) => !M._kunye[x.anahtar]).map((x) => x.anahtar);
    expect(eksik, `künyesi olmayan: ${eksik.join(", ")}`).toEqual([]);
  });

  it("5) KUNYE'deki program bilgisi program sürümüyle çelişmiyor", () => {
    const fark: string[] = [];
    for (const { ders, sinif, anahtar } of AKTIF) {
      const kn = M._kunye[anahtar];
      if (!kn) continue;
      const pd = M.programDurumu(sinif, ders);
      if (kn.programTuru !== pd) fark.push(`${anahtar}: KUNYE=${kn.programTuru} ≠ programDurumu=${pd}`);
      /* Künye eksiksiz olmalı: kaynağı gösteremeyen künye işe yaramaz */
      for (const alan of ["programAdi", "kaynakPdf", "kaynakUrl"] as const) {
        if (!kn[alan]) fark.push(`${anahtar}: künyede ${alan} boş`);
      }
      /* Resmî kaynak iki MEB alan adında barınır: önceki programlar
         mufredat.meb.gov.tr, TYMM programları tymm.meb.gov.tr. Üçüncü taraf
         adres künyeye girmemeli. */
      if (!/^https:\/\/[a-z]+\.meb\.gov\.tr\//.test(kn.kaynakUrl)) {
        fark.push(`${anahtar}: kaynakUrl resmî MEB alan adı değil (${kn.kaynakUrl})`);
      }
    }
    expect(fark, fark.join(" | ")).toEqual([]);
  });

  it("6) PROGRAM'da kayıtlı olup UNITELER'i olmayan ders-sınıf yok", () => {
    const olu = Object.keys(M._program).filter((k) => !AKTIF_ANAHTAR.has(k));
    expect(olu, `ünite listesi olmayan PROGRAM kaydı: ${olu.join(", ")}`).toEqual([]);
  });

  it("7) UNITELER'i olup PROGRAM ya da künye kaydı olmayan ders-sınıf yok", () => {
    const eksik: string[] = [];
    for (const { anahtar } of AKTIF) {
      if (!M._program[anahtar]) eksik.push(`${anahtar}: PROGRAM yok`);
      if (!M._kunye[anahtar]) eksik.push(`${anahtar}: KUNYE yok`);
    }
    expect(eksik, eksik.join(" | ")).toEqual([]);
  });

  it("8) KAZANIMLAR yalnızca kendi program sürümünün ünitelerine bağlı", () => {
    /* NEDEN ÜNİTE ADI ÜZERİNDEN: iki program sürümü aynı dersin ünitelerini
       FARKLI adlandırır. Bir ders-sınıf sürüm değiştirip kazanımları
       güncellenmezse, eski sürümün ünite adları burada açığa çıkar. Bu, "ait
       olmadığı sürümden kazanım okuma" durumunun ölçülebilir imzasıdır.
       KOD BİÇİMİNDEN sınıf çıkarmak DENENDİ ve BIRAKILDI: ink-12 ("1.1",
       "2.3") ile TDE ("A.2.1") ünite içi numaralama kullanıyor, bu yüzden
       naif çıkarım doğru veride 33 yanlış alarm üretiyordu. */
    const sorun: string[] = [];
    for (const anahtar of Object.keys(M._kazanimlar)) {
      if (!AKTIF_ANAHTAR.has(anahtar)) { sorun.push(`${anahtar}: KAZANIMLAR var ama aktif ders-sınıf değil`); continue; }
      const i = anahtar.lastIndexOf("-");
      const ders = anahtar.slice(0, i), sinif = anahtar.slice(i + 1);
      const uniteler = new Set(M._uniteler[ders]?.[sinif] ?? []);
      for (const unite of Object.keys(M._kazanimlar[anahtar])) {
        if (!uniteler.has(unite)) sorun.push(`${anahtar} › "${unite}" UNITELER'de yok`);
      }
    }
    expect(sorun, sorun.join(" | ")).toEqual([]);
  });

  it("8b) kazanımı olmayan ders-sınıf künyesinde bunu bildiriyor", () => {
    /* Kazanım metni yoksa BEP beceri havuzuna düşer; künye bunu
       `veriDerinligi: "unite"` diye söylemeli, yoksa çıktı kazanım
       varmış gibi sunulur. */
    const yanlis: string[] = [];
    for (const { anahtar } of AKTIF) {
      const kn = M._kunye[anahtar];
      if (!kn) continue;
      const kazanimVar = !!M._kazanimlar[anahtar];
      if (!kazanimVar && kn.veriDerinligi !== "unite") {
        yanlis.push(`${anahtar}: kazanım yok ama veriDerinligi="${kn.veriDerinligi}"`);
      }
      if (kazanimVar && kn.veriDerinligi === "unite") {
        yanlis.push(`${anahtar}: kazanım var ama veriDerinligi="unite"`);
      }
    }
    expect(yanlis, yanlis.join(" | ")).toEqual([]);
  });

  it("9) aynı ders-sınıf iki program sürümünü birden aktif göstermiyor", () => {
    const celiski: string[] = [];
    for (const { ders, sinif, anahtar } of AKTIF) {
      const kaynaklar = [
        ["programDurumu", M.programDurumu(sinif, ders)],
        ["PROGRAM", M._program[anahtar]],
        ["KUNYE", M._kunye[anahtar]?.programTuru],
        ["istisna", M._istisna[anahtar]?.program],
      ].filter(([, v]) => v) as [string, string][];
      const benzersiz = new Set(kaynaklar.map(([, v]) => v));
      if (benzersiz.size > 1) {
        celiski.push(`${anahtar}: ${kaynaklar.map(([a, v]) => a + "=" + v).join(", ")}`);
      }
    }
    expect(celiski, celiski.join(" | ")).toEqual([]);
  });

  it("10) her PROGRAM_ISTISNA kaydı geçerli ve gerekçeli", () => {
    const sorun: string[] = [];
    for (const [anahtar, ist] of Object.entries(M._istisna)) {
      if (!SURUMLER.includes(ist.program)) sorun.push(`${anahtar}: geçersiz program "${ist.program}"`);
      if (!ist.gerekce || ist.gerekce.trim().length < 10) sorun.push(`${anahtar}: gerekçe yok/çok kısa`);
      if (!AKTIF_ANAHTAR.has(anahtar)) sorun.push(`${anahtar}: istisna var ama aktif ders-sınıf değil`);
    }
    expect(sorun, sorun.join(" | ")).toEqual([]);
  });

  it("11) sınıf düzeyi geçiş tablosu 2026-2027 ile uyumlu", () => {
    /* 2026-2027: 1-2-3 / 5-6-7 / 9-10-11 TYMM; 4, 8 ve 12 önceki program. */
    expect(M._programDurumu).toEqual({
      1: "tymm", 2: "tymm", 3: "tymm", 4: "onceki",
      5: "tymm", 6: "tymm", 7: "tymm", 8: "onceki",
      9: "tymm", 10: "tymm", 11: "tymm", 12: "onceki",
    });
  });
});

describe("BEP müfredat kaynağı: geçmişte yaşanan hatalar", () => {
  it("REGRESYON — Din Kültürü 4. sınıf eksiksiz kayıtlı", () => {
    /* Bir kez veri hazır olduğu hâlde ders arayüzden seçilemedi. Burada
       kaynak tarafının eksiksizliği kilitlenir; arayüz tarafını
       mufredat-tutarlilik.test.ts korur. */
    expect(M.uniteListesi("din", 4).length, "din-4 ünite listesi boş").toBeGreaterThan(0);
    expect(M.kaynakKunyesi("din", 4), "din-4 künyesi yok").not.toBeNull();
    expect(M.programDurumu(4, "din")).toBe("onceki");
    expect(M.tymmMi(4, "din")).toBe(false);
  });

  it("REGRESYON — Almanca 9, 10, 11 TYMM'ye düşmüyor", () => {
    /* TYMM'nin ORTAÖĞRETİM Almanca programı yayımlanmamıştır; TYMM Almanca
       yalnız 5-8 içindir. Sınıf düzeyi kuralı bu üç sınıfı TYMM sayar, bu
       yüzden PROGRAM_ISTISNA olmadan yanlış sürüme düşerler. */
    for (const sinif of [9, 10, 11]) {
      expect(M.tymmMi(sinif, "alm"), `alm-${sinif} TYMM görünüyor`).toBe(false);
      expect(M.programDurumu(sinif, "alm"), `alm-${sinif}`).toBe("onceki");
      expect(M.programIstisnasi("alm", sinif), `alm-${sinif} istisnası yok`).not.toBeNull();
    }
  });

  it("REGRESYON — Almanca 9-12 TTKB PID 333 kaynağına bağlı", () => {
    for (const sinif of [9, 10, 11, 12]) {
      const kn = M.kaynakKunyesi("alm", sinif);
      expect(kn, `alm-${sinif} künyesi yok`).not.toBeNull();
      expect(kn!.programTuru, `alm-${sinif}`).toBe("onceki");
      /* PID 333'ün PDF kimliği: 2018120203443473-almanca dOp.pdf */
      expect(kn!.kaynakPdf, `alm-${sinif} yanlış kaynak`).toContain("2018120203443473");
      expect(kn!.kaynakUrl).toContain("mufredat.meb.gov.tr");
      expect(M.programDurumu(sinif, "alm"), `alm-${sinif}`).toBe("onceki");
    }
  });
});
