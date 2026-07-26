import { describe, expect, it } from "vitest";
import {
  KocOgrenciDegerlendirmeSemasi,
  OgrenciKocDegerlendirmeSemasi,
} from "./dogrulama";

const kocOgrGecerli = {
  zamaninda: "evet",
  hazirlikli: "kismen",
  katilim: 4,
  dikkat: 3,
  anlama: 5,
  gucluYonler: "Problem çözme",
  zorlandigi: "Türev",
  tekrarKonular: "Limit",
  yapilacaklar: "10 soru",
  genelYorum: "İyi bir ders oldu",
  puan: 4,
};

const ogrKocGecerli = {
  anlasilir: 5,
  hiz: "uygun",
  sorulara: 4,
  rahat: 5,
  verimli: 4,
  anlatimYorum: "Çok açıklayıcıydı",
  gorus: "Teşekkürler",
  puan: 5,
};

describe("KocOgrenciDegerlendirmeSemasi", () => {
  it("geçerli veriyi kabul eder", () => {
    const s = KocOgrenciDegerlendirmeSemasi.parse(kocOgrGecerli);
    expect(s.katilim).toBe(4);
    expect(s.zamaninda).toBe("evet");
    expect(s.puan).toBe(4);
  });

  it("yazılı alanlar boş bırakılabilir", () => {
    const s = KocOgrenciDegerlendirmeSemasi.parse({
      zamaninda: "hayir",
      hazirlikli: "hayir",
      katilim: 1,
      dikkat: 1,
      anlama: 1,
      puan: 1,
    });
    expect(s.gucluYonler).toBe("");
    expect(s.genelYorum).toBe("");
  });

  it("puan 0 (seçilmemiş) reddedilir", () => {
    expect(() => KocOgrenciDegerlendirmeSemasi.parse({ ...kocOgrGecerli, puan: 0 })).toThrow();
  });

  it("puan 6 (aralık dışı) reddedilir", () => {
    expect(() => KocOgrenciDegerlendirmeSemasi.parse({ ...kocOgrGecerli, katilim: 6 })).toThrow();
  });

  it("geçersiz seçim değeri reddedilir", () => {
    expect(() =>
      KocOgrenciDegerlendirmeSemasi.parse({ ...kocOgrGecerli, zamaninda: "belki" })
    ).toThrow();
  });

  it("string puanı sayıya çevirir (coerce)", () => {
    const s = KocOgrenciDegerlendirmeSemasi.parse({ ...kocOgrGecerli, dikkat: "5" });
    expect(s.dikkat).toBe(5);
  });
});

describe("OgrenciKocDegerlendirmeSemasi", () => {
  it("geçerli veriyi kabul eder", () => {
    const s = OgrenciKocDegerlendirmeSemasi.parse(ogrKocGecerli);
    expect(s.anlasilir).toBe(5);
    expect(s.hiz).toBe("uygun");
    expect(s.puan).toBe(5);
  });

  it("geçersiz hız değeri reddedilir", () => {
    expect(() => OgrenciKocDegerlendirmeSemasi.parse({ ...ogrKocGecerli, hiz: "orta" })).toThrow();
  });

  it("aralık dışı puan reddedilir", () => {
    expect(() => OgrenciKocDegerlendirmeSemasi.parse({ ...ogrKocGecerli, puan: 0 })).toThrow();
  });
});
