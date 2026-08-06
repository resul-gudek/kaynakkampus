import { describe, expect, it } from "vitest";
import {
  BILDIRIM_TURLERI,
  bildirimYolu,
  pushBaslik,
  pushIzinli,
  rolTurleri,
  tercihHaritasi,
  tercihTuru,
  turGecerli,
} from "./bildirim-tercih";

/* Tercih kaydı OLMAYAN tür açık sayılır (opt-out). Bu, yeni bir bildirim
   türü eklendiğinde mevcut kullanıcıların sessizce bildirimsiz kalmasını
   önleyen kilit davranıştır. */
describe("tercihHaritasi", () => {
  it("kayıt yoksa tüm türleri açık döner", () => {
    const harita = tercihHaritasi([]);
    for (const t of BILDIRIM_TURLERI) expect(harita[t]).toBe(true);
  });

  it("yalnız kayıtlı türü kapatır, diğerleri açık kalır", () => {
    const harita = tercihHaritasi([{ tur: "odev", push: false }]);
    expect(harita.odev).toBe(false);
    expect(harita.oturum).toBe(true);
    expect(harita.genel).toBe(true);
  });

  it("bilinmeyen türü yok sayar (eski/bozuk kayıt haritayı bozmaz)", () => {
    const harita = tercihHaritasi([
      { tur: "kaldirilmis-tur", push: false },
      { tur: "test", push: false },
    ]);
    expect(harita.test).toBe(false);
    expect(Object.keys(harita).sort()).toEqual([...BILDIRIM_TURLERI].sort());
  });

  it("açıkça açık kaydı da doğru okur", () => {
    expect(tercihHaritasi([{ tur: "video", push: true }]).video).toBe(true);
  });
});

describe("tercihTuru", () => {
  it("bilinen hedefTur'u aynen döner", () => {
    expect(tercihTuru("odev")).toBe("odev");
    expect(tercihTuru("oturum")).toBe("oturum");
  });

  it("hedefi olmayan bildirimi genel sayar", () => {
    expect(tercihTuru(null)).toBe("genel");
    expect(tercihTuru(undefined)).toBe("genel");
    expect(tercihTuru("")).toBe("genel");
  });

  it("tanımsız türü genel sayar", () => {
    expect(tercihTuru("bilinmeyen")).toBe("genel");
  });
});

describe("turGecerli", () => {
  it("yalnız tanımlı türleri kabul eder", () => {
    expect(turGecerli("odev")).toBe(true);
    expect(turGecerli("genel")).toBe(true);
    expect(turGecerli("odevler")).toBe(false);
    expect(turGecerli(null)).toBe(false);
    expect(turGecerli(42)).toBe(false);
  });
});

/* pushIzinli, kuyruk gönderiminin kapısıdır: yanlış true dönerse kullanıcı
   kapattığı bildirimi alır, yanlış false dönerse ödevini kaçırır. */
describe("pushIzinli", () => {
  it("tercih yoksa gönderime izin verir", () => {
    expect(pushIzinli("odev", [])).toBe(true);
  });

  it("kullanıcı o türü kapattıysa engeller", () => {
    expect(pushIzinli("odev", [{ tur: "odev", push: false }])).toBe(false);
  });

  it("başka tür kapalıysa etkilenmez", () => {
    expect(pushIzinli("oturum", [{ tur: "odev", push: false }])).toBe(true);
  });

  it("hedefsiz bildirimi genel tercihine bağlar", () => {
    expect(pushIzinli(null, [{ tur: "genel", push: false }])).toBe(false);
    expect(pushIzinli(null, [{ tur: "odev", push: false }])).toBe(true);
  });
});

describe("rolTurleri", () => {
  it("öğrenciye video dersleri gösterir", () => {
    expect(rolTurleri("ogrenci").map((t) => t.tur)).toContain("video");
  });

  it("koça video dersi tercihi göstermez (bildirim koça düşmez)", () => {
    expect(rolTurleri("koc").map((t) => t.tur)).not.toContain("video");
  });

  it("yöneticiye yalnız genel bildirimleri gösterir", () => {
    expect(rolTurleri("admin").map((t) => t.tur)).toEqual(["genel"]);
  });

  it("tanımsız rol için boş liste döner", () => {
    expect(rolTurleri("veli")).toEqual([]);
  });
});

describe("pushBaslik", () => {
  it("türe göre anlamlı başlık üretir", () => {
    expect(pushBaslik("oturum")).toContain("Canlı ders");
    expect(pushBaslik("odev")).toContain("Ödev");
  });

  it("hedefsiz bildirimde genel başlığa düşer", () => {
    expect(pushBaslik(null)).toContain("Kaynak Kampüs");
  });
});

/* bildirimYolu, BildirimListe.tikla() ile aynı hedefleri üretmelidir;
   ayrışırsa push'a tıklayan kullanıcı listedekinden başka yere gider. */
describe("bildirimYolu", () => {
  const bos = { hedefTur: null, hedefOgrenciId: null, hedefKayitId: null };

  it("hedefi olmayan bildirimi bildirim kutusuna yönlendirir", () => {
    expect(bildirimYolu(bos, "ogrenci")).toBe("/bildirimler");
  });

  it("kayıt kimliği eksikse hedefe gitmeye çalışmaz", () => {
    expect(bildirimYolu({ ...bos, hedefTur: "oturum" }, "koc")).toBe("/bildirimler");
  });

  it("canlı derse doğrudan gider", () => {
    expect(bildirimYolu({ ...bos, hedefTur: "oturum", hedefKayitId: "o1" }, "ogrenci")).toBe(
      "/canli-ders/o1"
    );
  });

  it("sınıfı siniflar sayfasında açar", () => {
    expect(bildirimYolu({ ...bos, hedefTur: "sinif", hedefKayitId: "s1" }, "koc")).toBe(
      "/siniflar?sinif=s1"
    );
  });

  it("süreli testi role göre ayırır", () => {
    const b = { ...bos, hedefTur: "test", hedefKayitId: "t1" };
    expect(bildirimYolu(b, "koc")).toBe("/koc/testler?kayit=t1");
    expect(bildirimYolu(b, "ogrenci")).toBe("/ogrenci/testler?kayit=t1");
  });

  it("video dersi öğrenci detay sayfasına götürür", () => {
    expect(bildirimYolu({ ...bos, hedefTur: "video", hedefKayitId: "v1" }, "ogrenci")).toBe(
      "/ogrenci/videolar/v1"
    );
  });

  it("ödevi koç için öğrenci detayındaki ödev sekmesine götürür", () => {
    expect(
      bildirimYolu({ hedefTur: "odev", hedefOgrenciId: "og1", hedefKayitId: "k1" }, "koc")
    ).toBe("/koc/ogrenciler?ogrenci=og1&sekme=odevler&kayit=k1");
  });

  it("ödevi öğrenci için kendi ödev sayfasına götürür", () => {
    expect(
      bildirimYolu({ hedefTur: "odev", hedefOgrenciId: "og1", hedefKayitId: "k1" }, "ogrenci")
    ).toBe("/ogrenci/odevler?kayit=k1");
  });

  it("özel dersi ozel sekmesine götürür", () => {
    expect(
      bildirimYolu({ hedefTur: "ozel", hedefOgrenciId: "og1", hedefKayitId: "k1" }, "koc")
    ).toBe("/koc/ogrenciler?ogrenci=og1&sekme=ozel&kayit=k1");
    expect(
      bildirimYolu({ hedefTur: "ozel", hedefOgrenciId: "og1", hedefKayitId: "k1" }, "ogrenci")
    ).toBe("/ogrenci/ozel-dersler?kayit=k1");
  });

  it("kimlikleri adres için kaçışlar", () => {
    expect(bildirimYolu({ ...bos, hedefTur: "oturum", hedefKayitId: "a b&c" }, "ogrenci")).toBe(
      "/canli-ders/a%20b%26c"
    );
  });
});
