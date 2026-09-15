import { describe, expect, it } from "vitest";
import {
  EGITIMLER,
  KoclukSemasi,
  OzelDersSemasi,
  basvuruBolumleri,
  egitimUygunMu,
  koclukBolumleri,
  ozelDersBolumleri,
  sinifBasligi,
  sinifEtiketi,
  telefonNormalle,
  uygunEgitimler,
} from "./egitim-basvurusu";

describe("sınıf etiketleri", () => {
  it("metin içi küçük, başlıkta büyük harf", () => {
    expect(sinifEtiketi("2")).toBe("2. sınıf");
    expect(sinifEtiketi("okul_oncesi")).toBe("Okul öncesi");
    expect(sinifBasligi("2")).toBe("2. Sınıf");
    expect(sinifBasligi("okul_oncesi")).toBe("Okul Öncesi");
  });
});

describe("telefonNormalle", () => {
  it("Türkiye mobil numaralarını tek biçime çevirir", () => {
    expect(telefonNormalle("05321234567")).toBe("0532 123 45 67");
    expect(telefonNormalle("0532 123 45 67")).toBe("0532 123 45 67");
    expect(telefonNormalle("+90 532 123 45 67")).toBe("0532 123 45 67");
    expect(telefonNormalle("0090 532 123 45 67")).toBe("0532 123 45 67");
    expect(telefonNormalle("532-123-45-67")).toBe("0532 123 45 67");
    expect(telefonNormalle("(0532) 123 45 67")).toBe("0532 123 45 67");
  });
  it("sabit hatları kabul eder", () => {
    expect(telefonNormalle("0212 555 12 34")).toBe("0212 555 12 34");
    expect(telefonNormalle("+90 312 555 12 34")).toBe("0312 555 12 34");
  });
  it("geçersiz numaraları reddeder", () => {
    expect(telefonNormalle("")).toBeNull();
    expect(telefonNormalle("123")).toBeNull();
    expect(telefonNormalle("0532 123 45")).toBeNull(); // kısa
    expect(telefonNormalle("0532 123 45 678")).toBeNull(); // uzun
    expect(telefonNormalle("0132 123 45 67")).toBeNull(); // 1xx alan kodu yok
    expect(telefonNormalle("0632 123 45 67")).toBeNull(); // 6xx yok
    expect(telefonNormalle("+44 7700 900123")).toBeNull(); // yurt dışı
    expect(telefonNormalle("abc")).toBeNull();
  });
});

describe("egitimUygunMu — yaş/sınıf kuralları", () => {
  it("diller 6–18 yaş", () => {
    expect(egitimUygunMu("ingilizce", 5, "okul_oncesi")).toBe(false);
    expect(egitimUygunMu("ingilizce", 6, "1")).toBe(true);
    expect(egitimUygunMu("almanca", 18, "12")).toBe(true);
    expect(egitimUygunMu("almanca", 19, "12")).toBe(false);
  });
  it("ilkokul ders desteği yalnız 1–4. sınıf", () => {
    expect(egitimUygunMu("ilkokul_destek", 6, "okul_oncesi")).toBe(false);
    expect(egitimUygunMu("ilkokul_destek", 7, "1")).toBe(true);
    expect(egitimUygunMu("ilkokul_destek", 10, "4")).toBe(true);
    expect(egitimUygunMu("ilkokul_destek", 11, "5")).toBe(false);
  });
  it("din ve Kur’an her kademede", () => {
    expect(egitimUygunMu("din_kuran", 4, "okul_oncesi")).toBe(true);
    expect(egitimUygunMu("din_kuran", 17, "12")).toBe(true);
  });
  it("değerler eğitimi okul öncesi + ilkokul", () => {
    expect(egitimUygunMu("degerler", 5, "okul_oncesi")).toBe(true);
    expect(egitimUygunMu("degerler", 9, "4")).toBe(true);
    expect(egitimUygunMu("degerler", 10, "5")).toBe(false);
  });
  it("uygunEgitimler yalnız uygun olanları verir", () => {
    expect(uygunEgitimler(5, "okul_oncesi")).toEqual(["din_kuran", "degerler"]);
    expect(uygunEgitimler(8, "2")).toEqual([...EGITIMLER]);
    expect(uygunEgitimler(16, "10")).toEqual(["ingilizce", "almanca", "din_kuran"]);
    expect(uygunEgitimler(25, "12")).toEqual(["din_kuran"]);
  });
});

const ozelDersTaban = {
  ogrenciAd: "Ayşe Yılmaz",
  yas: "8",
  sinif: "2",
  egitim: "ingilizce",
  seviye: "Başlangıç",
  amac: "Okul derslerine destek",
  basvuran: "veli",
  iletisimAd: "Fatma Yılmaz",
  telefon: "0532 123 45 67",
  eposta: "Fatma@Ornek.com",
  gunler: ["Salı", "Perşembe"],
  saatler: "Hafta içi 18.00 sonrası",
  kvkkOnay: true,
};

describe("OzelDersSemasi", () => {
  it("geçerli başvuruyu normalize eder", () => {
    const s = OzelDersSemasi.safeParse(ozelDersTaban);
    expect(s.success).toBe(true);
    if (!s.success) return;
    expect(s.data.yas).toBe(8);
    expect(s.data.eposta).toBe("fatma@ornek.com");
    expect(s.data.telefon).toBe("0532 123 45 67");
    expect(s.data.dersler).toEqual([]);
    expect(s.data.ekBilgi).toBe("");
  });
  it("yaş/sınıfa uymayan eğitimi reddeder (istemcide gizlenen sunucuda da geçmez)", () => {
    const s = OzelDersSemasi.safeParse({ ...ozelDersTaban, egitim: "ilkokul_destek", sinif: "7", yas: "13", dersler: ["Matematik"] });
    expect(s.success).toBe(false);
    if (s.success) return;
    expect(s.error.issues.some((i) => i.path[0] === "egitim")).toBe(true);
  });
  it("dil için seviye ve amaç zorunlu", () => {
    const s = OzelDersSemasi.safeParse({ ...ozelDersTaban, seviye: undefined, amac: undefined });
    expect(s.success).toBe(false);
    if (s.success) return;
    const yollar = s.error.issues.map((i) => String(i.path[0]));
    expect(yollar).toContain("seviye");
    expect(yollar).toContain("amac");
  });
  it("ilkokul desteği için en az bir ders", () => {
    const s = OzelDersSemasi.safeParse({ ...ozelDersTaban, egitim: "ilkokul_destek", dersler: [] });
    expect(s.success).toBe(false);
  });
  it("din ve Kur’an için ihtiyaç zorunlu, değerler için ek soru yok", () => {
    expect(OzelDersSemasi.safeParse({ ...ozelDersTaban, egitim: "din_kuran" }).success).toBe(false);
    expect(OzelDersSemasi.safeParse({ ...ozelDersTaban, egitim: "din_kuran", ihtiyac: "Sure ve dualar" }).success).toBe(true);
    expect(OzelDersSemasi.safeParse({ ...ozelDersTaban, egitim: "degerler", seviye: undefined, amac: undefined }).success).toBe(true);
  });
  it("KVKK onayı ve geçerli telefon şart", () => {
    expect(OzelDersSemasi.safeParse({ ...ozelDersTaban, kvkkOnay: false }).success).toBe(false);
    expect(OzelDersSemasi.safeParse({ ...ozelDersTaban, telefon: "12345" }).success).toBe(false);
  });
});

const koclukTaban = {
  ogrenciAd: "Mehmet Kaya",
  yas: 16,
  sinif: "11",
  konular: ["Zaman yönetimi", "Diğer"],
  konuDiger: "Sınav kaygısı",
  zorlayan: "Programa uymak",
  basvuran: "ogrenci",
  iletisimAd: "Mehmet Kaya",
  telefon: "+90 555 111 22 33",
  eposta: "mehmet@ornek.com",
  kvkkOnay: true,
};

describe("KoclukSemasi", () => {
  it("geçerli başvuruyu kabul eder ve boş alanları doldurur", () => {
    const s = KoclukSemasi.safeParse(koclukTaban);
    expect(s.success).toBe(true);
    if (!s.success) return;
    expect(s.data.gunler).toEqual([]);
    expect(s.data.okul).toBe("");
    expect(s.data.telefon).toBe("0555 111 22 33");
  });
  it("en az bir konu ister", () => {
    expect(KoclukSemasi.safeParse({ ...koclukTaban, konular: [] }).success).toBe(false);
  });
});

describe("bölümler (mail + yönetim detayı)", () => {
  it("özel ders bölümleri boş satırları atar, Diğer açıklamasını birleştirir", () => {
    const v = OzelDersSemasi.parse({ ...ozelDersTaban, amac: "Diğer", amacDiger: "Yurt dışı hazırlık" });
    const b = ozelDersBolumleri(v);
    expect(b.map((x) => x.baslik)).toEqual(["Öğrenci", "Eğitim seçimi", "İletişim", "Uygunluk"]);
    const egitim = b[1].satirlar;
    expect(egitim.find((s) => s.etiket === "Dersi alma amacı")?.deger).toBe("Diğer: Yurt dışı hazırlık");
    expect(b[0].satirlar.find((s) => s.etiket === "Sınıf")?.deger).toBe("2. sınıf");
    // ek bilgi boş → satır yok
    expect(b[3].satirlar.some((s) => s.etiket === "Ek bilgi")).toBe(false);
  });
  it("koçluk bölümleri", () => {
    const b = koclukBolumleri(KoclukSemasi.parse(koclukTaban));
    expect(b[1].satirlar[0].deger).toBe("Zaman yönetimi, Diğer: Sınav kaygısı");
    // günler/saatler boş → Uygunluk bölümü düşer
    expect(b.map((x) => x.baslik)).toEqual(["Öğrenci", "Koçluk ihtiyacı", "İletişim"]);
  });
  it("basvuruBolumleri şemaya uymayan eski veriyi ham gösterir", () => {
    const b = basvuruBolumleri("ozel_ders", { ogrenciAd: "X", eskiAlan: "y", bos: "" });
    expect(b[0].baslik).toBe("Başvuru verisi");
    expect(b[0].satirlar.map((s) => s.etiket)).toEqual(["ogrenciAd", "eskiAlan"]);
  });
});
