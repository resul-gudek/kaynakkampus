import { describe, expect, it } from "vitest";
import {
  altAgac,
  altHaritasi,
  altindaMi,
  altlari,
  boyutMetni,
  dugumDerinligi,
  dugumEsliyor,
  dugumKarsilastir,
  dugumleriAra,
  dugumleriSirala,
  etkinlikIndirUrl,
  etkinlikPdfUrl,
  etkinlikSlugGecerli,
  etkinlikYolUrl,
  kirintiYolu,
  klasorMu,
  pdfMu,
  pdfSayisi,
} from "./etkinlik";

/* Etkinlik arşivi bir AĞAÇTIR: klasör ve PDF aynı düğüm tablosundadır.
   Testler ağaç yürüyüşünü, sıralama kuralını ve "klasör kendi içine
   taşınamaz" emniyetini korur. Takvim (tarih/saat/yer) kavramı YOKTUR. */

/** Örnek arşiv:
 *   İlkokul
 *     2. Sınıf
 *       Türkçe          → okuma.pdf (yayında), dikte.pdf (taslak)
 *       Matematik       → (boş)
 *   Lise
 *     9. Sınıf          → deneme.pdf (yayında)
 */
const dugum = (
  id: string,
  ustId: string | null,
  tur: "klasor" | "pdf",
  ad: string,
  sira = 0,
  durum = "yayinda"
) => ({ id, ustId, tur, ad, sira, durum });

const AGAC = [
  dugum("ilkokul", null, "klasor", "İlkokul", 1),
  dugum("lise", null, "klasor", "Lise", 2),
  dugum("s2", "ilkokul", "klasor", "2. Sınıf", 1),
  dugum("turkce", "s2", "klasor", "Türkçe", 1),
  dugum("matematik", "s2", "klasor", "Matematik", 2),
  dugum("okuma", "turkce", "pdf", "Okuma Metni", 1),
  dugum("dikte", "turkce", "pdf", "Dikte Çalışması", 2, "taslak"),
  dugum("s9", "lise", "klasor", "9. Sınıf", 1),
  dugum("deneme", "s9", "pdf", "Deneme Sınavı", 1),
];

describe("düğüm türü", () => {
  it("klasör ve PDF'i ayırır", () => {
    expect(klasorMu({ tur: "klasor" })).toBe(true);
    expect(klasorMu({ tur: "pdf" })).toBe(false);
    expect(pdfMu({ tur: "pdf" })).toBe(true);
  });
});

describe("sıralama", () => {
  it("klasörler her zaman PDF'lerden önce gelir", () => {
    const karisik = [
      dugum("a", null, "pdf", "A dosya", 1),
      dugum("b", null, "klasor", "B klasör", 5),
    ];
    expect(dugumleriSirala(karisik).map((d) => d.id)).toEqual(["b", "a"]);
  });

  it("aynı türde önce sıra, sonra ad", () => {
    const liste = [
      dugum("c", null, "klasor", "Ceviz", 2),
      dugum("a", null, "klasor", "Armut", 1),
      dugum("b", null, "klasor", "Badem", 1),
    ];
    expect(dugumleriSirala(liste).map((d) => d.id)).toEqual(["a", "b", "c"]);
  });

  it("Türkçe sıralama kullanır (ı, ö, ş, ü)", () => {
    const liste = [
      dugum("u", null, "klasor", "Üzüm", 0),
      dugum("i", null, "klasor", "Incir", 0),
      dugum("s", null, "klasor", "Şeftali", 0),
    ];
    expect(dugumleriSirala(liste).map((d) => d.ad)).toEqual(["Incir", "Şeftali", "Üzüm"]);
  });

  it("karşılaştırıcı simetriktir", () => {
    const a = dugum("a", null, "klasor", "A", 1);
    const b = dugum("b", null, "pdf", "B", 1);
    expect(dugumKarsilastir(a, b)).toBeLessThan(0);
    expect(dugumKarsilastir(b, a)).toBeGreaterThan(0);
    expect(dugumKarsilastir(a, a)).toBe(0);
  });
});

describe("ağaç yürüyüşü", () => {
  it("bir klasörün doğrudan içindekileri sıralı verir", () => {
    expect(altlari(AGAC, "s2").map((d) => d.id)).toEqual(["turkce", "matematik"]);
    expect(altlari(AGAC, "turkce").map((d) => d.id)).toEqual(["okuma", "dikte"]);
  });

  it("kök seviyesini null ile verir", () => {
    expect(altlari(AGAC, null).map((d) => d.id)).toEqual(["ilkokul", "lise"]);
  });

  it("alt harita her düğümü tek kez taşır", () => {
    const harita = altHaritasi(AGAC);
    const toplam = [...harita.values()].reduce((n, v) => n + v.length, 0);
    expect(toplam).toBe(AGAC.length);
  });

  it("alt ağaç tüm torunları kapsar, kendini kapsamaz", () => {
    expect(altAgac(AGAC, "ilkokul").map((d) => d.id).sort()).toEqual(
      ["dikte", "matematik", "okuma", "s2", "turkce"].sort()
    );
    expect(altAgac(AGAC, "okuma")).toEqual([]);
  });

  it("kırıntı yolu kökten düğüme kadar zinciri verir", () => {
    expect(kirintiYolu(AGAC, "okuma").map((d) => d.ad)).toEqual([
      "İlkokul",
      "2. Sınıf",
      "Türkçe",
      "Okuma Metni",
    ]);
    expect(kirintiYolu(AGAC, null)).toEqual([]);
  });

  it("derinliği kökten sayar", () => {
    expect(dugumDerinligi(AGAC, "ilkokul")).toBe(1);
    expect(dugumDerinligi(AGAC, "turkce")).toBe(3);
    expect(dugumDerinligi(AGAC, null)).toBe(0);
  });

  it("bozuk veri döngü yaratsa bile sonsuza girmez", () => {
    // a → b → a (veri bozulması); yürüyüş sınırlı adımda durmalı
    const dongulu = [dugum("a", "b", "klasor", "A"), dugum("b", "a", "klasor", "B")];
    expect(kirintiYolu(dongulu, "a").length).toBeLessThan(20);
  });
});

describe("altindaMi — klasör kendi içine taşınamaz", () => {
  it("kendisini ve tüm torunlarını yasaklar", () => {
    expect(altindaMi(AGAC, "ilkokul", "ilkokul")).toBe(true);
    expect(altindaMi(AGAC, "ilkokul", "turkce")).toBe(true);
    expect(altindaMi(AGAC, "ilkokul", "okuma")).toBe(true);
  });

  it("kardeş ve üst klasörlere izin verir", () => {
    expect(altindaMi(AGAC, "ilkokul", "lise")).toBe(false);
    expect(altindaMi(AGAC, "turkce", "ilkokul")).toBe(false);
    expect(altindaMi(AGAC, "turkce", null)).toBe(false);
  });
});

describe("pdfSayisi", () => {
  it("alt ağaçtaki tüm PDF'leri sayar", () => {
    expect(pdfSayisi(AGAC, "ilkokul")).toBe(2);
    expect(pdfSayisi(AGAC, "matematik")).toBe(0);
    expect(pdfSayisi(AGAC, "lise")).toBe(1);
  });

  it("istenirse yalnız yayındakileri sayar (taslak elenir)", () => {
    expect(pdfSayisi(AGAC, "turkce", true)).toBe(1);
    expect(pdfSayisi(AGAC, "turkce", false)).toBe(2);
  });
});

describe("adresler", () => {
  it("kök ve iç klasör adresini kurar", () => {
    expect(etkinlikYolUrl([])).toBe("/etkinlikler");
    expect(etkinlikYolUrl(["ilkokul", "2-sinif", "turkce"])).toBe(
      "/etkinlikler/ilkokul/2-sinif/turkce"
    );
  });

  it("PDF görüntüleme ve indirme adresleri ayrıdır", () => {
    expect(etkinlikPdfUrl("abc")).toBe("/api/etkinlik/pdf/abc");
    expect(etkinlikIndirUrl("abc")).toBe("/api/etkinlik/pdf/abc?indir=1");
  });

  it("slug biçimini denetler", () => {
    expect(etkinlikSlugGecerli("2-sinif")).toBe(true);
    expect(etkinlikSlugGecerli("Türkçe")).toBe(false);
    expect(etkinlikSlugGecerli("bos--slug")).toBe(false);
    expect(etkinlikSlugGecerli("")).toBe(false);
  });
});

describe("boyutMetni", () => {
  it("bayt, KB ve MB'yi okunur yazar", () => {
    expect(boyutMetni(0)).toBe("");
    expect(boyutMetni(512)).toBe("512 B");
    expect(boyutMetni(2048)).toBe("2 KB");
    expect(boyutMetni(1_572_864)).toBe("1,5 MB");
    expect(boyutMetni(12 * 1024 * 1024)).toBe("12 MB");
  });
});

describe("arama", () => {
  it("boş aramada hepsini döner", () => {
    expect(dugumleriAra(AGAC, "")).toHaveLength(AGAC.length);
  });

  it("Türkçe karakter ve büyük-küçük harf farkını yok sayar", () => {
    expect(dugumleriAra(AGAC, "TURKCE").map((d) => d.id)).toEqual(["turkce"]);
    expect(dugumleriAra(AGAC, "dikte")).toHaveLength(1);
  });

  it("çok kelimeli aramada her kelimeyi arar", () => {
    expect(dugumEsliyor({ ad: "Deneme Sınavı" }, "deneme sinav")).toBe(true);
    expect(dugumEsliyor({ ad: "Deneme Sınavı" }, "deneme okuma")).toBe(false);
  });

  it("arama klasör sınırını aşar (tüm ağaçta arar)", () => {
    expect(dugumleriAra(AGAC, "sınıf").map((d) => d.id).sort()).toEqual(["s2", "s9"]);
  });
});
