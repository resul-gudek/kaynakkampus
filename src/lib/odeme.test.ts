import { describe, expect, it } from "vitest";
import { OdemeSemasi } from "./dogrulama";
import {
  KOCA_ACIK_OGRENCI_ALANLARI,
  KOCA_KAPALI,
  KOC_ODEME_ALANLARI,
  OGRENCIYE_KAPALI,
  OGRENCI_ODEME_ALANLARI,
  kocDurumu,
  kocOzeti,
  ogrenciBazliOzet,
  ogrenciDurumRozeti,
  ogrenciDurumu,
  ogrenciOzeti,
  platformPayi,
  tutarStr,
  yoneticiOzeti,
  yontemi,
  type KocOdemeSatiri,
  type OgrenciOdemeSatiri,
  type YoneticiOdemeSatiri,
} from "./odeme";

/* ═══════════════════════════════════════════════════════════════
   Modülün asıl güvencesi rol ayrımıdır: bu testler kırılırsa
   bir tarafın karşı bacağı görmesi mümkün hale gelmiş demektir.
   ═══════════════════════════════════════════════════════════════ */

describe("rol bazlı alan listeleri", () => {
  it("öğrenci sorgusu öğretmen payını / komisyonu / yönetici notunu seçmez", () => {
    const secilen = Object.keys(OGRENCI_ODEME_ALANLARI);
    for (const kapali of OGRENCIYE_KAPALI) {
      expect(secilen).not.toContain(kapali);
    }
  });

  it("öğretmen sorgusu öğrencinin ödediği tutarı ve kimliğini seçmez", () => {
    const secilen = Object.keys(KOC_ODEME_ALANLARI);
    for (const kapali of KOCA_KAPALI) {
      expect(secilen).not.toContain(kapali);
    }
  });

  it("öğretmen sorgusu öğrenci ilişkisinden YALNIZ adı çeker", () => {
    // Öğretmen kimin için ödeme aldığını görür; ilişkiye finansal ya da
    // kişisel bir alan eklenirse (telefon, eposta, tutar...) bu test kırılır.
    expect(Object.keys(KOC_ODEME_ALANLARI.ogrenci.select)).toEqual([
      ...KOCA_ACIK_OGRENCI_ALANLARI,
    ]);
  });

  it("öğrenci ilişkisi tüm kaydı (select'siz) çekmez", () => {
    // `ogrenci: true` yazılırsa öğrencinin tüm kolonları gelirdi
    expect(typeof KOC_ODEME_ALANLARI.ogrenci).toBe("object");
    expect(KOC_ODEME_ALANLARI.ogrenci).toHaveProperty("select");
  });

  it("platform payı kolon olarak hiçbir listede yoktur (hesaplanır)", () => {
    const tumSecilen = [...Object.keys(OGRENCI_ODEME_ALANLARI), ...Object.keys(KOC_ODEME_ALANLARI)];
    expect(tumSecilen).not.toContain("platformTutar");
    expect(tumSecilen).not.toContain("platform");
  });

  it("öğretmen listesi öğrenci bacağının finansal kolonlarını taşımaz", () => {
    // "ogrenci" ile başlayan tek giriş ad taşıyan ilişki olmalı;
    // ogrenciTutar / ogrenciDurum / ogrenciOdemeTarihi sızmamalı
    const sizan = Object.keys(KOC_ODEME_ALANLARI).filter((k) => k.startsWith("ogrenci"));
    expect(sizan).toEqual(["ogrenci"]);
  });

  it("öğrenci listesi öğretmen bacağının hiçbir kolonunu taşımaz", () => {
    const sizan = Object.keys(OGRENCI_ODEME_ALANLARI).filter((k) => k.startsWith("koc"));
    expect(sizan).toEqual([]);
  });
});

describe("platformPayi", () => {
  it("öğrenci tutarından öğretmen payını düşer", () => {
    expect(platformPayi({ ogrenciTutar: 1200, kocTutar: 800 })).toBe(400);
  });

  it("öğretmen payı yoksa tamamı platformda kalır", () => {
    expect(platformPayi({ ogrenciTutar: 500, kocTutar: 0 })).toBe(500);
  });
});

describe("tutarStr", () => {
  it("binlik ayırıcı ve para birimi ekler", () => {
    expect(tutarStr(1250)).toBe("1.250 ₺");
    expect(tutarStr(0)).toBe("0 ₺");
  });
});

/* ── Toplamlar: iptal edilen kalem hiçbir toplama girmez ── */

const ogr = (
  tutar: number,
  durum: OgrenciOdemeSatiri["durum"],
  id = String(tutar)
): OgrenciOdemeSatiri => ({
  id,
  tarih: "2026-08-01",
  aciklama: "",
  tutar,
  durum,
  odemeTarihi: durum === "odendi" ? "2026-08-02" : "",
  yontem: "",
});

describe("ogrenciOzeti", () => {
  it("ödenen ve bekleyen tutarı ayırır", () => {
    const ozet = ogrenciOzeti([ogr(1000, "odendi"), ogr(600, "bekliyor")]);
    expect(ozet).toEqual({ adet: 2, toplam: 1600, odenen: 1000, bekleyen: 600 });
  });

  it("iptal edilen kalemi toplamların dışında bırakır", () => {
    const ozet = ogrenciOzeti([ogr(1000, "odendi"), ogr(400, "iptal")]);
    expect(ozet).toEqual({ adet: 1, toplam: 1000, odenen: 1000, bekleyen: 0 });
  });

  it("kayıt yoksa sıfırlar", () => {
    expect(ogrenciOzeti([])).toEqual({ adet: 0, toplam: 0, odenen: 0, bekleyen: 0 });
  });
});

const koc = (tutar: number, durum: KocOdemeSatiri["durum"]): KocOdemeSatiri => ({
  id: String(tutar),
  tarih: "2026-08-01",
  ogrenciAd: "Elif Demir",
  aciklama: "",
  tutar,
  durum,
  odemeTarihi: durum === "odendi" ? "2026-08-03" : "",
});

describe("kocOzeti", () => {
  it("hazırlanıyor durumunu bekleyen alacağa yazar", () => {
    const ozet = kocOzeti([koc(800, "odendi"), koc(500, "hazirlaniyor"), koc(200, "bekliyor")]);
    expect(ozet).toEqual({ adet: 3, toplam: 1500, odenen: 800, bekleyen: 700 });
  });
});

const yon = (
  o: Partial<YoneticiOdemeSatiri> & { ogrenciTutar: number; kocTutar: number }
): YoneticiOdemeSatiri => ({
  id: "k1",
  tarih: "2026-08-01",
  aciklama: "",
  ogrenciId: "o1",
  ogrenciAd: "Ayşe",
  kocId: "k",
  kocAd: "Mehmet",
  ogrenciDurum: "bekliyor",
  ogrenciOdemeTarihi: "",
  yontem: "",
  kocDurum: "bekliyor",
  kocOdemeTarihi: "",
  platformTutar: o.ogrenciTutar - o.kocTutar,
  yoneticiNotu: "",
  ...o,
});

describe("yoneticiOzeti", () => {
  it("üç tutarı ve tahsil/ödeme durumlarını toplar", () => {
    const ozet = yoneticiOzeti([
      yon({ ogrenciTutar: 1200, kocTutar: 800, ogrenciDurum: "odendi", kocDurum: "odendi" }),
      yon({ ogrenciTutar: 1000, kocTutar: 600, ogrenciDurum: "bekliyor", kocDurum: "hazirlaniyor" }),
    ]);
    expect(ozet).toEqual({
      adet: 2,
      ogrenciToplam: 2200,
      ogrenciTahsil: 1200,
      kocToplam: 1400,
      kocOdenen: 800,
      platform: 800,
    });
  });

  it("iptal edilen kalemi hiçbir toplama katmaz", () => {
    const ozet = yoneticiOzeti([
      yon({ ogrenciTutar: 1000, kocTutar: 700, ogrenciDurum: "odendi", kocDurum: "odendi" }),
      yon({ ogrenciTutar: 900, kocTutar: 600, ogrenciDurum: "iptal" }),
    ]);
    expect(ozet.ogrenciToplam).toBe(1000);
    expect(ozet.kocToplam).toBe(700);
    expect(ozet.platform).toBe(300);
  });
});

describe("ogrenciBazliOzet", () => {
  it("öğrenci başına ödediği / öğretmene giden / platformda kalanı ayırır", () => {
    const dokum = ogrenciBazliOzet([
      yon({ ogrenciTutar: 1000, kocTutar: 700, ogrenciDurum: "odendi" }),
      yon({ ogrenciTutar: 500, kocTutar: 300, ogrenciDurum: "bekliyor" }),
      yon({ ogrenciId: "o2", ogrenciAd: "Can", ogrenciTutar: 2000, kocTutar: 1200 }),
    ]);
    // en yüksek tutarlı öğrenci başta
    expect(dokum.map((d) => d.ogrenciAd)).toEqual(["Can", "Ayşe"]);
    const ayse = dokum.find((d) => d.ogrenciId === "o1")!;
    expect(ayse).toMatchObject({
      adet: 2,
      ogrenciToplam: 1500,
      tahsil: 1000,
      bekleyen: 500,
      kocToplam: 1000,
      platform: 500,
    });
  });
});

describe("durum daraltma", () => {
  it("tanınmayan değer bekliyor sayılır", () => {
    expect(ogrenciDurumu("uydurma")).toBe("bekliyor");
    expect(kocDurumu("uydurma")).toBe("bekliyor");
    expect(yontemi("uydurma")).toBe("");
  });

  it("geçerli değerler korunur", () => {
    expect(ogrenciDurumu("iptal")).toBe("iptal");
    expect(kocDurumu("hazirlaniyor")).toBe("hazirlaniyor");
    expect(yontemi("havale")).toBe("havale");
  });

  it("rozet türü ödendi/bekleyen/iptal ayrımını verir", () => {
    expect(ogrenciDurumRozeti("odendi")).toBe("olumlu");
    expect(ogrenciDurumRozeti("bekliyor")).toBe("bekleyen");
    expect(ogrenciDurumRozeti("iptal")).toBe("notr");
  });
});

describe("OdemeSemasi", () => {
  const gecerli = {
    ogrenciId: "o1",
    kocId: "k1",
    tarih: "2026-08-01",
    ogrenciTutar: "1200",
    kocTutar: "800",
  };

  it("tutarları sayıya çevirir ve varsayılan durumları uygular", () => {
    const veri = OdemeSemasi.parse(gecerli);
    expect(veri.ogrenciTutar).toBe(1200);
    expect(veri.kocTutar).toBe(800);
    expect(veri.ogrenciDurum).toBe("bekliyor");
    expect(veri.kocDurum).toBe("bekliyor");
    expect(veri.yontem).toBe("");
  });

  it("öğretmen payı öğrenci tutarını aşamaz", () => {
    expect(() => OdemeSemasi.parse({ ...gecerli, kocTutar: "1500" })).toThrow();
  });

  it("öğretmen seçilmeden pay girilemez", () => {
    expect(() => OdemeSemasi.parse({ ...gecerli, kocId: "" })).toThrow();
  });

  it("öğretmensiz kalemde pay sıfırsa geçerlidir", () => {
    const veri = OdemeSemasi.parse({ ...gecerli, kocId: "", kocTutar: "0" });
    expect(veri.kocId).toBe("");
    expect(veri.kocTutar).toBe(0);
  });

  it("negatif tutar ve bozuk tarih reddedilir", () => {
    expect(() => OdemeSemasi.parse({ ...gecerli, ogrenciTutar: "-5", kocTutar: "0" })).toThrow();
    expect(() => OdemeSemasi.parse({ ...gecerli, tarih: "01.08.2026" })).toThrow();
  });
});
