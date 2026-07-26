import { describe, expect, it } from "vitest";
import { SureliTestSemasi } from "./dogrulama";
import {
  TESLIM_TOLERANS_SN,
  bitisSiniriHesapla,
  cevaplariAyristir,
  gecenSaniye,
  kalanSaniye,
  seceneklerAyristir,
  sureBitti,
  sureEtiketi,
  sureMetni,
  teslimKabul,
  testPuanla,
} from "./sureli-test";

const SORULAR = [
  { id: "s1", sira: 1, dogru: "A" },
  { id: "s2", sira: 2, dogru: "B" },
  { id: "s3", sira: 3, dogru: "C" },
  { id: "s4", sira: 4, dogru: "D" },
];

describe("testPuanla", () => {
  it("doğru / yanlış / boş sayar ve yüzdeyi hesaplar", () => {
    const s = testPuanla(SORULAR, { s1: "A", s2: "C", s3: "C" });
    expect(s).toEqual({ dogru: 2, yanlis: 1, bos: 1, yuzde: 50 });
  });

  it("hiç cevap verilmemişse hepsi boştur", () => {
    expect(testPuanla(SORULAR, {})).toEqual({ dogru: 0, yanlis: 0, bos: 4, yuzde: 0 });
  });

  it("tam doğruda yüzde 100", () => {
    const s = testPuanla(SORULAR, { s1: "A", s2: "B", s3: "C", s4: "D" });
    expect(s).toEqual({ dogru: 4, yanlis: 0, bos: 0, yuzde: 100 });
  });

  it("yüzdeyi en yakın tam sayıya yuvarlar", () => {
    // 3 soruda 1 doğru → %33.33
    expect(testPuanla(SORULAR.slice(0, 3), { s1: "A" }).yuzde).toBe(33);
  });

  it("soru listesinde olmayan cevapları saymaz", () => {
    const s = testPuanla(SORULAR.slice(0, 2), { s1: "A", s9: "E" });
    expect(s).toEqual({ dogru: 1, yanlis: 0, bos: 1, yuzde: 50 });
  });

  it("sorusuz testte yüzde 0", () => {
    expect(testPuanla([], {})).toEqual({ dogru: 0, yanlis: 0, bos: 0, yuzde: 0 });
  });
});

describe("cevaplariAyristir", () => {
  it("geçerli JSON'u haritaya çevirir", () => {
    expect(cevaplariAyristir('{"s1":"A","s2":"E"}')).toEqual({ s1: "A", s2: "E" });
  });

  it("bozuk JSON, dizi ve boş değerde {} döner", () => {
    expect(cevaplariAyristir("{bozuk")).toEqual({});
    expect(cevaplariAyristir("[1,2]")).toEqual({});
    expect(cevaplariAyristir("")).toEqual({});
    expect(cevaplariAyristir(null)).toEqual({});
  });

  it("şık harfi olmayan değerleri atar", () => {
    expect(cevaplariAyristir('{"s1":"A","s2":"Z","s3":3}')).toEqual({ s1: "A" });
  });
});

describe("seceneklerAyristir", () => {
  it("JSON diziyi string listesine çevirir", () => {
    expect(seceneklerAyristir('["2","4","6"]')).toEqual(["2", "4", "6"]);
  });

  it("bozuk veride [] döner", () => {
    expect(seceneklerAyristir("{}")).toEqual([]);
    expect(seceneklerAyristir("bozuk")).toEqual([]);
  });
});

describe("süre hesapları", () => {
  const baslangic = new Date("2026-07-26T10:00:00.000Z");

  it("bitiş sınırı = başlangıç + süre (dk)", () => {
    expect(bitisSiniriHesapla(baslangic, 20).toISOString()).toBe("2026-07-26T10:20:00.000Z");
  });

  it("kalan saniye geri sayar, bitince 0'da durur", () => {
    const sinir = bitisSiniriHesapla(baslangic, 20);
    expect(kalanSaniye(sinir, new Date("2026-07-26T10:05:00.000Z"))).toBe(900);
    expect(kalanSaniye(sinir, new Date("2026-07-26T10:25:00.000Z"))).toBe(0);
  });

  it("geçen saniye negatif olmaz", () => {
    expect(gecenSaniye(baslangic, new Date("2026-07-26T10:07:30.000Z"))).toBe(450);
    expect(gecenSaniye(baslangic, new Date("2026-07-26T09:00:00.000Z"))).toBe(0);
  });

  it("süre sınırı geçildiğinde biter", () => {
    const sinir = bitisSiniriHesapla(baslangic, 20);
    expect(sureBitti(sinir, new Date("2026-07-26T10:19:59.000Z"))).toBe(false);
    expect(sureBitti(sinir, new Date("2026-07-26T10:20:01.000Z"))).toBe(true);
  });

  it("teslim, tolerans payı içinde kabul edilir", () => {
    const sinir = bitisSiniriHesapla(baslangic, 20);
    const tolerransIci = new Date(sinir.getTime() + (TESLIM_TOLERANS_SN - 1) * 1000);
    const tolerransDisi = new Date(sinir.getTime() + (TESLIM_TOLERANS_SN + 1) * 1000);
    expect(teslimKabul(sinir, tolerransIci)).toBe(true);
    expect(teslimKabul(sinir, tolerransDisi)).toBe(false);
  });
});

describe("süre biçimlendirme", () => {
  it("dakika:saniye, saat gerekirse saat:dakika:saniye", () => {
    expect(sureMetni(0)).toBe("00:00");
    expect(sureMetni(65)).toBe("01:05");
    expect(sureMetni(1200)).toBe("20:00");
    expect(sureMetni(3725)).toBe("1:02:05");
  });

  it("negatif değeri 00:00 sayar", () => {
    expect(sureMetni(-5)).toBe("00:00");
  });

  it("test süresi etiketi", () => {
    expect(sureEtiketi(20)).toBe("20 dk");
    expect(sureEtiketi(60)).toBe("1 sa");
    expect(sureEtiketi(90)).toBe("1 sa 30 dk");
  });
});

/* ── Test oluşturma şeması ── */

const soru = (dogru = "A") => ({ metin: "2+2 kaçtır?", secenekler: ["3", "4", "5"], dogru });
const testGirdi = {
  ad: "Limit Testi",
  ders: "Matematik",
  konu: "Limit",
  seviye: "12. Sınıf",
  soruSayisi: 2,
  sure: 20,
  sorular: [soru("A"), soru("B")],
  ogrenciIdler: ["ogr1"],
};

describe("SureliTestSemasi", () => {
  it("geçerli testi kabul eder", () => {
    const t = SureliTestSemasi.parse(testGirdi);
    expect(t.sorular).toHaveLength(2);
    expect(t.sure).toBe(20);
  });

  it("soru sayısı ile soru satırı sayısı tutmazsa reddeder", () => {
    expect(() => SureliTestSemasi.parse({ ...testGirdi, soruSayisi: 3 })).toThrow();
  });

  it("süresiz / sıfır süreli testi reddeder", () => {
    expect(() => SureliTestSemasi.parse({ ...testGirdi, sure: 0 })).toThrow();
  });

  it("doğru cevap seçenek aralığının dışındaysa reddeder", () => {
    // 3 seçenek var (A, B, C) ama doğru cevap D
    expect(() =>
      SureliTestSemasi.parse({ ...testGirdi, soruSayisi: 1, sorular: [soru("D")] })
    ).toThrow();
  });

  it("boş seçeneği reddeder", () => {
    expect(() =>
      SureliTestSemasi.parse({
        ...testGirdi,
        soruSayisi: 1,
        sorular: [{ metin: "Soru", secenekler: ["4", ""], dogru: "A" }],
      })
    ).toThrow();
  });

  it("tek seçenekli soruyu reddeder", () => {
    expect(() =>
      SureliTestSemasi.parse({
        ...testGirdi,
        soruSayisi: 1,
        sorular: [{ metin: "Soru", secenekler: ["4"], dogru: "A" }],
      })
    ).toThrow();
  });

  it("soru metni boşsa reddeder", () => {
    expect(() =>
      SureliTestSemasi.parse({
        ...testGirdi,
        soruSayisi: 1,
        sorular: [{ metin: "  ", secenekler: ["3", "4"], dogru: "A" }],
      })
    ).toThrow();
  });

  it("öğrenci seçilmemiş test kabul edilir (sonra atanabilir)", () => {
    const t = SureliTestSemasi.parse({ ...testGirdi, ogrenciIdler: undefined });
    expect(t.ogrenciIdler).toEqual([]);
  });
});
