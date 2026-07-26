import { describe, expect, it } from "vitest";
import { basvuruDogrula, MulakatPlanlaSemasi } from "./dogrulama-basvuru";

const kvkk = { kvkkOnay: true, acikRizaOnay: true };

describe("basvuruDogrula — öğretmen", () => {
  it("geçerli asgari veriyi kabul eder ve kart alanlarını türetir", () => {
    const s = basvuruDogrula("ogretmen", {
      ad: "Ayşe",
      soyad: "Yılmaz",
      telefon: "05551112233",
      brans: "Matematik",
      eposta: "AYSE@ORNEK.COM",
      sehir: "Ankara",
      ...kvkk,
    });
    expect(s.tur).toBe("ogretmen");
    expect(s.kart.ad).toBe("Ayşe Yılmaz");
    expect(s.kart.eposta).toBe("ayse@ornek.com"); // normalize
    expect(s.kart.sehir).toBe("Ankara");
  });

  it("KVKK onayı yoksa reddeder", () => {
    expect(() =>
      basvuruDogrula("ogretmen", {
        ad: "A",
        soyad: "B",
        telefon: "0555",
        brans: "Fizik",
        kvkkOnay: false,
        acikRizaOnay: true,
      })
    ).toThrow();
  });

  it("zorunlu branş boşsa reddeder", () => {
    expect(() =>
      basvuruDogrula("ogretmen", { ad: "A", soyad: "B", telefon: "0555", brans: "", ...kvkk })
    ).toThrow();
  });
});

describe("basvuruDogrula — öğrenci (veli kuralı)", () => {
  const taban = {
    ad: "Can",
    soyad: "Demir",
    telefon: "05551112233",
    ...kvkk,
  };

  it("18 yaş altı ise veli bilgileri zorunludur", () => {
    expect(() => basvuruDogrula("ogrenci", { ...taban, yas18Alti: true })).toThrow();
  });

  it("18 yaş altı + veli bilgileri dolu ise kabul eder", () => {
    const s = basvuruDogrula("ogrenci", {
      ...taban,
      yas18Alti: true,
      veliAd: "Elif Demir",
      veliTelefon: "05559998877",
      veliOnay: true,
    });
    expect(s.kart.ad).toBe("Can Demir");
  });

  it("okul türü İlkokul ise veli zorunlu olur", () => {
    expect(() => basvuruDogrula("ogrenci", { ...taban, okulTuru: "İlkokul" })).toThrow();
  });

  it("reşit öğrenci veli bilgisi olmadan geçerlidir", () => {
    const s = basvuruDogrula("ogrenci", { ...taban, okulTuru: "Lise", yas18Alti: false });
    expect(s.tur).toBe("ogrenci");
  });
});

describe("basvuruDogrula — genel", () => {
  it("bilinmeyen tür reddedilir", () => {
    expect(() => basvuruDogrula("mudur", { ...kvkk })).toThrow();
  });
});

describe("MulakatPlanlaSemasi", () => {
  it("geçerli tarih/saat kabul eder, varsayılan süre 30", () => {
    const v = MulakatPlanlaSemasi.parse({
      basvuruId: "abc",
      tarih: "2026-08-01",
      saat: "14:30",
      tur: "online",
    });
    expect(v.sure).toBe(30);
    expect(v.tur).toBe("online");
  });

  it("geçersiz saat reddedilir", () => {
    expect(() =>
      MulakatPlanlaSemasi.parse({ basvuruId: "abc", tarih: "2026-08-01", saat: "25:99" })
    ).toThrow();
  });
});
