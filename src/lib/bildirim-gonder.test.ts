import { describe, expect, it } from "vitest";
import {
  BILDIRIM_METIN_MAX,
  BildirimGonderSemasi,
  alicilariCoz,
  gonderenGruplari,
  gonderebilirMi,
  grupEtiketi,
  hedefOzeti,
  metinKisalt,
} from "./bildirim-gonder";

const adaylar = [
  { id: "o1", rol: "ogrenci", ad: "Ali" },
  { id: "o2", rol: "ogrenci", ad: "Ayşe" },
  { id: "v1", rol: "veli", ad: "Veli Bey" },
  { id: "t1", rol: "ogretmen", ad: "Öğretmen" },
  { id: "k1", rol: "koc", ad: "Koç" },
];

describe("gonderenGruplari / gonderebilirMi", () => {
  it("yönetici dört grubu da seçebilir", () => {
    expect(gonderenGruplari("admin")).toEqual(["ogrenciler", "veliler", "ogretmenler", "koclar"]);
  });
  it("koç ve öğretmen yalnız öğrenci + veli gruplarını görür", () => {
    expect(gonderenGruplari("koc")).toEqual(["ogrenciler", "veliler"]);
    expect(gonderenGruplari("ogretmen")).toEqual(["ogrenciler", "veliler"]);
  });
  it("öğrenci ve veli gönderim yapamaz", () => {
    expect(gonderebilirMi("ogrenci")).toBe(false);
    expect(gonderebilirMi("veli")).toBe(false);
    expect(gonderebilirMi("admin")).toBe(true);
  });
});

describe("grupEtiketi", () => {
  it("eğitmende sahiplik dili kullanır, yöneticide 'Tüm …'", () => {
    expect(grupEtiketi("ogrenciler", "koc")).toBe("Öğrencilerim");
    expect(grupEtiketi("veliler", "ogretmen")).toBe("Öğrencilerimin velileri");
    expect(grupEtiketi("veliler", "admin")).toBe("Tüm veliler");
  });
});

describe("alicilariCoz", () => {
  const admin = { id: "a1", rol: "admin" };

  it("grup seçimi o roldeki tüm adayları alır", () => {
    const s = alicilariCoz(adaylar, { gruplar: ["ogrenciler"], kisiler: [] }, admin);
    expect(s.alicilar.map((a) => a.id)).toEqual(["o1", "o2"]);
    expect(s.bilinmeyen).toEqual([]);
  });

  it("grup + kişi birleşimi tekrarsızdır", () => {
    const s = alicilariCoz(adaylar, { gruplar: ["ogrenciler"], kisiler: ["o1", "v1", "v1"] }, admin);
    expect(s.alicilar.map((a) => a.id).sort()).toEqual(["o1", "o2", "v1"]);
  });

  it("aday kümesinde olmayan kişi 'bilinmeyen' olarak döner, sessizce düşmez", () => {
    const s = alicilariCoz(adaylar, { gruplar: [], kisiler: ["o1", "yok"] }, admin);
    expect(s.alicilar.map((a) => a.id)).toEqual(["o1"]);
    expect(s.bilinmeyen).toEqual(["yok"]);
  });

  it("gönderen kendini alıcı yapamaz", () => {
    const s = alicilariCoz(adaylar, { gruplar: ["koclar"], kisiler: ["k1"] }, { id: "k1", rol: "admin" });
    expect(s.alicilar).toEqual([]);
    expect(s.bilinmeyen).toEqual(["k1"]);
  });

  it("eğitmenin rolüne kapalı grup yok sayılır ve raporlanır", () => {
    const s = alicilariCoz(
      adaylar,
      { gruplar: ["ogretmenler", "ogrenciler"], kisiler: [] },
      { id: "k1", rol: "koc" }
    );
    expect(s.alicilar.map((a) => a.id)).toEqual(["o1", "o2"]);
    expect(s.yetkisizGruplar).toEqual(["ogretmenler"]);
  });
});

describe("BildirimGonderSemasi", () => {
  it("geçerli girdiyi kabul eder ve metni kırpar", () => {
    const v = BildirimGonderSemasi.parse({ metin: "  Yarın ders yok.  ", ikon: "📢", gruplar: ["veliler"] });
    expect(v.metin).toBe("Yarın ders yok.");
    expect(v.kisiler).toEqual([]);
  });
  it("alıcısız gönderimi reddeder", () => {
    const r = BildirimGonderSemasi.safeParse({ metin: "Merhaba", ikon: "📢" });
    expect(r.success).toBe(false);
  });
  it("uzun metni ve bilinmeyen ikonu reddeder", () => {
    expect(
      BildirimGonderSemasi.safeParse({ metin: "a".repeat(BILDIRIM_METIN_MAX + 1), ikon: "📢", gruplar: ["veliler"] })
        .success
    ).toBe(false);
    expect(BildirimGonderSemasi.safeParse({ metin: "Merhaba", ikon: "🦄", gruplar: ["veliler"] }).success).toBe(false);
  });
});

describe("hedefOzeti / metinKisalt", () => {
  it("grup ve kişi sayısını birleştirir", () => {
    expect(hedefOzeti({ gruplar: ["veliler"], kisiler: [] }, "admin")).toBe("Tüm veliler");
    expect(hedefOzeti({ gruplar: ["ogrenciler"], kisiler: ["a", "b", "b"] }, "koc")).toBe("Öğrencilerim + 2 kişi");
    expect(hedefOzeti({ gruplar: [], kisiler: ["a"] }, "admin")).toBe("1 kişi");
  });
  it("uzun metni üç noktayla kısaltır", () => {
    expect(metinKisalt("kısa")).toBe("kısa");
    expect(metinKisalt("x".repeat(100), 20)).toHaveLength(20);
    expect(metinKisalt("x".repeat(100), 20).endsWith("…")).toBe(true);
  });
});
