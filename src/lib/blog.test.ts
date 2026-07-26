import { describe, expect, it } from "vitest";
import { BlogYaziSemasi } from "./dogrulama";
import {
  etiketleriAyir,
  etiketleriBirlestir,
  icerigiAyristir,
  kategoriEtiketi,
  okumaSuresi,
  ozetUret,
  satirIciAyristir,
  slugGecerli,
  slugla,
  yayinTarihiMetni,
  yazilariSuz,
} from "./blog";

/* Blog adresleri SEO uyumlu olmalı: Türkçe karakterler ascii karşılıklarına
   çevrilir, sonuçta yalnız [a-z0-9-] kalır. */
describe("slugla", () => {
  it("Türkçe başlığı ascii slug'a çevirir", () => {
    expect(slugla("Verimli Ders Çalışma Yöntemleri")).toBe("verimli-ders-calisma-yontemleri");
  });

  it("büyük İ/I ve ğ/ş/ü harflerini doğru dönüştürür", () => {
    expect(slugla("İYİ BİR ÖĞRETMEN ŞÖYLE ÇALIŞIR")).toBe("iyi-bir-ogretmen-soyle-calisir");
  });

  it("noktalama ve fazla boşlukları tek tireye indirir", () => {
    expect(slugla("  LGS 2026: Nasıl?  Çalışmalı!!  ")).toBe("lgs-2026-nasil-calismali");
  });

  it("baştaki/sondaki tireleri atar ve 90 karakteri geçmez", () => {
    const uzun = slugla("a".repeat(200));
    expect(uzun.length).toBe(90);
    expect(uzun.startsWith("-")).toBe(false);
    expect(uzun.endsWith("-")).toBe(false);
  });

  it("harf içermeyen girdide boş döner (sunucu 'yazi' ile karşılar)", () => {
    expect(slugla("!!! ???")).toBe("");
  });
});

describe("slugGecerli", () => {
  it("yalnız küçük harf, rakam ve aradaki tireleri kabul eder", () => {
    expect(slugGecerli("verimli-ders-calisma-yontemleri")).toBe(true);
    expect(slugGecerli("lgs-2026")).toBe(true);
  });

  it("büyük harf, boşluk, çift tire ve baş/son tireyi reddeder", () => {
    for (const kotu of ["Buyuk-Harf", "bosluk var", "cift--tire", "-bas", "son-", "türkçe"]) {
      expect(slugGecerli(kotu)).toBe(false);
    }
  });

  it("rota parametresindeki yol geçişi denemelerini reddeder", () => {
    expect(slugGecerli("../../etc/passwd")).toBe(false);
    expect(slugGecerli("a/b")).toBe(false);
  });
});

describe("etiketleriAyir", () => {
  it("virgülle ayırır, kırpar ve tekrarları atar", () => {
    expect(etiketleriAyir(" ders çalışma, motivasyon ,ders çalışma, ")).toEqual([
      "ders çalışma",
      "motivasyon",
    ]);
  });

  it("tekrar kontrolü tr-TR duyarlıdır", () => {
    expect(etiketleriAyir("LGS, lgs")).toEqual(["LGS"]);
  });

  it("birleştirme tur atlatmasında bozulmaz", () => {
    const liste = ["LGS", "motivasyon"];
    expect(etiketleriAyir(etiketleriBirlestir(liste))).toEqual(liste);
  });
});

describe("okumaSuresi", () => {
  it("boş içerikte 0, kısa içerikte en az 1 dakika döner", () => {
    expect(okumaSuresi("")).toBe(0);
    expect(okumaSuresi("Tek cümlelik kısa bir yazı.")).toBe(1);
  });

  it("kelime sayısıyla ölçeklenir", () => {
    expect(okumaSuresi("kelime ".repeat(950))).toBe(5);
  });
});

describe("ozetUret", () => {
  it("işaretleri atıp tek satıra indirir", () => {
    expect(ozetUret("## Başlık\n\n- **madde** bir\n- [bağlantı](https://a.co) iki")).toBe(
      "Başlık madde bir bağlantı iki"
    );
  });

  it("uzun metni kelime sınırında keser ve üç nokta ekler", () => {
    const ozet = ozetUret("kelime ".repeat(100), 50);
    expect(ozet.length).toBeLessThanOrEqual(51);
    expect(ozet.endsWith("…")).toBe(true);
    expect(ozet).not.toContain("kelim…");
  });
});

describe("yayinTarihiMetni", () => {
  it("tarihi Türkçe ay adıyla yazar", () => {
    expect(yayinTarihiMetni(new Date("2026-03-12T10:00:00Z"))).toBe("12 Mart 2026");
  });

  it("boş / geçersiz tarihte boş döner", () => {
    expect(yayinTarihiMetni(null)).toBe("");
    expect(yayinTarihiMetni("gecersiz")).toBe("");
  });
});

/* Liste sayfasındaki süzme; kategori ve arama birlikte uygulanır. */
describe("yazilariSuz", () => {
  const yazilar = [
    { baslik: "Verimli Ders Çalışma", ozet: "Pomodoro tekniği", kategori: "sinav-ders-calisma", etiketler: "LGS, plan" },
    { baslik: "Ebeveyn Rehberi", ozet: "Sınav kaygısı", kategori: "ebeveyn-rehberi", etiketler: "kaygı" },
    { baslik: "Öğretmen Notları", ozet: "Sınıf yönetimi", kategori: "ogretmen-rehberi", etiketler: "sınıf" },
  ];

  it("süzgeç yoksa hepsini döner", () => {
    expect(yazilariSuz(yazilar, "", "")).toHaveLength(3);
  });

  it("kategoriye göre süzer", () => {
    expect(yazilariSuz(yazilar, "", "ebeveyn-rehberi").map((y) => y.baslik)).toEqual([
      "Ebeveyn Rehberi",
    ]);
  });

  it("başlık, özet ve etikette arar", () => {
    expect(yazilariSuz(yazilar, "pomodoro", "")).toHaveLength(1);
    expect(yazilariSuz(yazilar, "kaygı", "")).toHaveLength(1);
    expect(yazilariSuz(yazilar, "lgs", "")).toHaveLength(1);
  });

  it("kategori adı üzerinden de bulur", () => {
    expect(yazilariSuz(yazilar, "sınav ve ders", "")).toHaveLength(1);
  });

  it("Türkçe karakter / büyük-küçük harf farkını yok sayar", () => {
    expect(yazilariSuz(yazilar, "CALISMA", "")).toHaveLength(1);
    expect(yazilariSuz(yazilar, "ögretmen", "")).toHaveLength(1);
  });

  it("çok kelimeli aramada her kelimeyi arar", () => {
    expect(yazilariSuz(yazilar, "verimli pomodoro", "")).toHaveLength(1);
    expect(yazilariSuz(yazilar, "verimli sınıf", "")).toHaveLength(0);
  });

  it("kategori ve aramayı birlikte uygular", () => {
    expect(yazilariSuz(yazilar, "pomodoro", "ebeveyn-rehberi")).toHaveLength(0);
  });
});

/* İçerik markdown-lite olarak saklanır; HTML kabul edilmez (XSS yüzeyi
   açmamak için) — ayrıştırıcı düz metin olarak taşır. */
describe("icerigiAyristir", () => {
  it("boş satırla ayrılan paragrafları böler", () => {
    const bloklar = icerigiAyristir("Birinci paragraf.\n\nİkinci paragraf.");
    expect(bloklar).toHaveLength(2);
    expect(bloklar[0]).toMatchObject({ tur: "paragraf" });
  });

  it("aynı paragrafın satırlarını birleştirir", () => {
    const bloklar = icerigiAyristir("İlk satır\nikinci satır");
    expect(bloklar).toHaveLength(1);
    expect(bloklar[0]).toMatchObject({
      tur: "paragraf",
      parcalar: [{ tur: "metin", deger: "İlk satır ikinci satır" }],
    });
  });

  it("## ve ### başlıklarını seviyesiyle tanır", () => {
    const bloklar = icerigiAyristir("## Ana\n### Alt");
    expect(bloklar[0]).toMatchObject({ tur: "baslik", seviye: 2 });
    expect(bloklar[1]).toMatchObject({ tur: "baslik", seviye: 3 });
  });

  it("sırasız ve sıralı listeleri ayrı bloklar yapar", () => {
    const bloklar = icerigiAyristir("- bir\n- iki\n\n1. üç\n2. dört");
    expect(bloklar[0]).toMatchObject({ tur: "liste", sirali: false });
    expect(bloklar[1]).toMatchObject({ tur: "liste", sirali: true });
    if (bloklar[0].tur === "liste") expect(bloklar[0].maddeler).toHaveLength(2);
  });

  it("alıntı ve ayırıcıyı tanır", () => {
    const bloklar = icerigiAyristir("> alıntı satırı\n\n---\n\nson paragraf");
    expect(bloklar.map((b) => b.tur)).toEqual(["alinti", "ayirici", "paragraf"]);
  });

  it("HTML etiketini düz metin olarak taşır (enjeksiyon yok)", () => {
    const bloklar = icerigiAyristir("<script>alert(1)</script>");
    expect(bloklar[0]).toMatchObject({
      tur: "paragraf",
      parcalar: [{ tur: "metin", deger: "<script>alert(1)</script>" }],
    });
  });
});

describe("satirIciAyristir", () => {
  it("kalın, eğik ve bağlantı parçalarını çıkarır", () => {
    expect(satirIciAyristir("**kalın** ve *eğik* ve [site](https://kaynak.co/x)")).toEqual([
      { tur: "kalin", deger: "kalın" },
      { tur: "metin", deger: " ve " },
      { tur: "egik", deger: "eğik" },
      { tur: "metin", deger: " ve " },
      { tur: "baglanti", deger: "site", adres: "https://kaynak.co/x" },
    ]);
  });

  it("javascript: gibi güvensiz adresi bağlantıya çevirmez", () => {
    for (const kotu of ["[tıkla](javascript:alert(1))", "[tıkla](data:text/html;base64,x)"]) {
      const parcalar = satirIciAyristir(kotu);
      // Bağlantı üretilmez; metin düz yazı olarak kalır
      expect(parcalar.some((p) => p.tur === "baglanti")).toBe(false);
      expect(parcalar.map((p) => p.deger).join("")).toContain("tıkla");
    }
  });
});

describe("kategoriEtiketi", () => {
  it("anahtarı okunur etikete çevirir", () => {
    expect(kategoriEtiketi("egitim-koclugu")).toBe("Eğitim Koçluğu");
  });

  it("bilinmeyen anahtarda çökmez", () => {
    expect(kategoriEtiketi("olmayan-kategori")).toBe("olmayan-kategori");
  });
});

/* Yazma sınırındaki doğrulama — Prisma sqlserver enum tutmadığı için
   kategori/durum yalnız burada ve CHECK constraint'te sınırlanır. */
describe("BlogYaziSemasi", () => {
  const temel = { baslik: "Test yazısı", icerik: "Gövde metni", kategori: "egitim" };

  it("asgari alanlarla geçer ve varsayılanları doldurur", () => {
    const v = BlogYaziSemasi.parse(temel);
    expect(v.durum).toBe("taslak");
    expect(v.slug).toBe("");
    expect(v.etiketler).toEqual([]);
  });

  it("geçersiz kategoriyi reddeder", () => {
    expect(() => BlogYaziSemasi.parse({ ...temel, kategori: "uydurma" })).toThrow();
  });

  it("geçersiz slug biçimini reddeder, geçerlisini kabul eder", () => {
    expect(() => BlogYaziSemasi.parse({ ...temel, slug: "Büyük Harfli" })).toThrow();
    expect(BlogYaziSemasi.parse({ ...temel, slug: "gecerli-adres" }).slug).toBe("gecerli-adres");
  });

  it("boş içerik ve çok kısa başlığı reddeder", () => {
    expect(() => BlogYaziSemasi.parse({ ...temel, icerik: "" })).toThrow();
    expect(() => BlogYaziSemasi.parse({ ...temel, baslik: "ab" })).toThrow();
  });

  it("etiket sayısı tavanını uygular", () => {
    const cok = Array.from({ length: 11 }, (_, i) => `etiket${i}`);
    expect(() => BlogYaziSemasi.parse({ ...temel, etiketler: cok })).toThrow();
  });

  it("yayın tarihi boş ya da ISO gün biçiminde olabilir", () => {
    expect(BlogYaziSemasi.parse({ ...temel, yayinTarihi: "" }).yayinTarihi).toBe("");
    expect(BlogYaziSemasi.parse({ ...temel, yayinTarihi: "2026-03-12" }).yayinTarihi).toBe("2026-03-12");
    expect(() => BlogYaziSemasi.parse({ ...temel, yayinTarihi: "12.03.2026" })).toThrow();
  });
});
