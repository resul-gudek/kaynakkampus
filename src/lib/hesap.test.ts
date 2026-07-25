import { describe, expect, it } from "vitest";
import {
  gunKaydir,
  isoTarih,
  kullaniciAdiNormalize,
  netHesapla,
  ogrenciOzet,
  ozelDersMetni,
  ozelDersOzet,
  profilAyristir,
  tarihNesnesi,
  tarihStr,
  telefonDuzelt,
  yanlisKonulariAyristir,
  yolDurumlu,
  xpOzet,
  zayifKonular,
  type DenemeSatir,
  type OzelDersSatir,
  type YolAdimiSatir,
} from "./hesap";

/* ── Tarih yardımcıları ───────────────────────────────────── */

describe("isoTarih", () => {
  it("Date → YYYY-MM-DD", () => {
    expect(isoTarih(new Date("2026-07-25T00:00:00.000Z"))).toBe("2026-07-25");
  });
  it("dizgeyi ilk 10 karaktere kısaltır", () => {
    expect(isoTarih("2026-07-25T13:40:00")).toBe("2026-07-25");
  });
  it("null/undefined → boş dizge", () => {
    expect(isoTarih(null)).toBe("");
    expect(isoTarih(undefined)).toBe("");
  });
});

describe("tarihStr", () => {
  it("ISO → GG.AA.YYYY", () => {
    expect(tarihStr("2026-07-25")).toBe("25.07.2026");
    expect(tarihStr(new Date("2026-01-05T00:00:00.000Z"))).toBe("05.01.2026");
  });
  it("boş girdi boş kalır", () => {
    expect(tarihStr(null)).toBe("");
  });
});

describe("tarihNesnesi", () => {
  it("ISO dizgeyi UTC gece yarısı Date'e çevirir", () => {
    const d = tarihNesnesi("2026-07-25");
    expect(d.toISOString()).toBe("2026-07-25T00:00:00.000Z");
  });
  it("tarihNesnesi ↔ isoTarih tur-dönüşü kayıpsız", () => {
    expect(isoTarih(tarihNesnesi("2026-12-31"))).toBe("2026-12-31");
  });
});

describe("gunKaydir", () => {
  it("0 gün kayması bugünü verir", () => {
    expect(gunKaydir(0)).toBe(new Date().toISOString().slice(0, 10));
  });
  it("ileri/geri simetriktir", () => {
    const ileri = tarihNesnesi(gunKaydir(3)).getTime();
    const geri = tarihNesnesi(gunKaydir(-3)).getTime();
    const bugun = tarihNesnesi(gunKaydir(0)).getTime();
    expect(ileri - bugun).toBe(3 * 86_400_000);
    expect(bugun - geri).toBe(3 * 86_400_000);
  });
});

/* ── Net hesabı ───────────────────────────────────────────── */

describe("netHesapla", () => {
  it("YKS/TYT: 4 yanlış 1 doğru götürür", () => {
    expect(netHesapla("TYT", 40, 4)).toBe(39);
    expect(netHesapla("AYT", 20, 8)).toBe(18);
  });
  it("LGS: 3 yanlış 1 doğru götürür", () => {
    expect(netHesapla("LGS", 20, 3)).toBe(19);
  });
  it("yanlış yoksa net = doğru", () => {
    expect(netHesapla("TYT", 30, 0)).toBe(30);
  });
  it("iki ondalığa yuvarlar", () => {
    expect(netHesapla("TYT", 10, 1)).toBe(9.75);
    expect(netHesapla("LGS", 10, 1)).toBe(9.67);
  });
});

/* ── Telefon ──────────────────────────────────────────────── */

describe("telefonDuzelt", () => {
  it("0'lı numarayı 90'a çevirir", () => {
    expect(telefonDuzelt("0500 111 22 33")).toBe("905001112233");
  });
  it("10 haneli 5'li numaraya 90 ekler", () => {
    expect(telefonDuzelt("5001112233")).toBe("905001112233");
  });
  it("boş/geçersiz → boş", () => {
    expect(telefonDuzelt("")).toBe("");
    expect(telefonDuzelt(null)).toBe("");
  });
});

/* ── Kullanıcı adı normalizasyonu (İ/ı tuzağı) ────────────── */

describe("kullaniciAdiNormalize", () => {
  it("Türkçe büyük İ → i (nokta korunur)", () => {
    expect(kullaniciAdiNormalize("İLKER")).toBe("ilker");
  });
  it("büyük I → ı", () => {
    expect(kullaniciAdiNormalize("KOCI")).toBe("kocı");
  });
  it("boşlukları kırpar", () => {
    expect(kullaniciAdiNormalize("  Koc1  ")).toBe("koc1");
  });
});

/* ── JSON ayrıştırıcılar ──────────────────────────────────── */

describe("yanlisKonulariAyristir", () => {
  it("geçerli JSON dizisini çözer", () => {
    expect(yanlisKonulariAyristir('["Paragraf","Türev"]')).toEqual(["Paragraf", "Türev"]);
  });
  it("bozuk JSON → boş dizi", () => {
    expect(yanlisKonulariAyristir("{bozuk")).toEqual([]);
    expect(yanlisKonulariAyristir(null)).toEqual([]);
  });
});

describe("profilAyristir", () => {
  it("dersler dizisi olan JSON'ı Profil'e çevirir", () => {
    const p = profilAyristir('{"sinav":"YKS","dersler":[{"ders":"Matematik","seviye":"Orta","bilinen":[],"eksik":["Türev"]}]}');
    expect(p?.sinav).toBe("YKS");
    expect(p?.dersler[0].eksik).toEqual(["Türev"]);
  });
  it("dersler dizisi yoksa null", () => {
    expect(profilAyristir('{"sinav":"YKS"}')).toBeNull();
    expect(profilAyristir(null)).toBeNull();
  });
});

/* ── Yol haritası oyun durumu ─────────────────────────────── */

const yol = (id: string, sira: number, xp: number, tamamlandi: boolean): YolAdimiSatir => ({
  id, sira, xp, tamamlandi, ders: "Matematik", konu: "Konu " + sira, hedef: "",
});

describe("yolDurumlu", () => {
  it("yalnız ilk tamamlanmamış adım aktif, sonrakiler kilitli", () => {
    const sonuc = yolDurumlu([
      yol("a", 1, 50, true),
      yol("b", 2, 50, false),
      yol("c", 3, 50, false),
    ]);
    expect(sonuc.map((x) => x.durum)).toEqual(["tamamlandi", "aktif", "kilitli"]);
  });
  it("hepsi tamamlanmışsa aktif/kilitli yok", () => {
    const sonuc = yolDurumlu([yol("a", 1, 50, true), yol("b", 2, 50, true)]);
    expect(sonuc.every((x) => x.durum === "tamamlandi")).toBe(true);
  });
  it("sıra karışık gelse de sıralar", () => {
    const sonuc = yolDurumlu([yol("c", 3, 50, false), yol("a", 1, 50, true)]);
    expect(sonuc.map((x) => x.sira)).toEqual([1, 3]);
  });
});

/* ── XP / rozet özeti ─────────────────────────────────────── */

describe("xpOzet", () => {
  it("XP toplamı, seviye ve yüzde", () => {
    const oz = xpOzet([yol("a", 1, 50, true), yol("b", 2, 50, true), yol("c", 3, 60, false)]);
    expect(oz.xp).toBe(100);
    expect(oz.seviye).toBe(2); // floor(100/100)+1
    expect(oz.tamamlanan).toBe(2);
    expect(oz.toplam).toBe(3);
    expect(oz.yuzde).toBe(67); // round(100*2/3)
  });
  it("boş yol haritasında sıfırlar", () => {
    const oz = xpOzet([]);
    expect(oz.xp).toBe(0);
    expect(oz.seviye).toBe(1);
    expect(oz.yuzde).toBe(0);
    expect(oz.rozetler).toEqual([]);
  });
  it("rozet eşiklerini uygular", () => {
    const adimlar = Array.from({ length: 6 }, (_, i) => yol("a" + i, i + 1, 60, true));
    const oz = xpOzet(adimlar); // 6 adım, 360 XP, %100
    const adlar = oz.rozetler.map((r) => r.ad);
    expect(adlar).toContain("İlk Adım");
    expect(adlar).toContain("3 Adım Serisi");
    expect(adlar).toContain("300 XP Kulübü");
    expect(adlar).toContain("Yol Tamamlandı");
  });
});

/* ── Zayıf konu analizi ───────────────────────────────────── */

describe("zayifKonular", () => {
  const deneme = (dersler: { ders: string; yanlisKonular: string[] }[]): DenemeSatir => ({
    id: "d", ad: "Deneme", tur: "TYT", tarih: new Date("2026-07-01T00:00:00.000Z"), net: 0,
    dersler: dersler.map((x) => ({
      ders: x.ders, dogru: 0, yanlis: 0, bos: 0, net: 0,
      yanlisKonular: JSON.stringify(x.yanlisKonular),
    })),
  });

  it("sıklığa göre azalan sıralar ve deneme+profil kaynaklarını birleştirir", () => {
    const denemeler = [
      deneme([{ ders: "Matematik", yanlisKonular: ["Türev", "Limit"] }]),
      deneme([{ ders: "Matematik", yanlisKonular: ["Türev"] }]),
    ];
    const profil = {
      sinav: "YKS", gunlukSaat: 4, tarih: "2026-07-01", notlar: "",
      dersler: [{ ders: "Matematik", seviye: "Zayıf", bilinen: [], eksik: ["Türev"] }],
    };
    const sonuc = zayifKonular(denemeler, profil);
    expect(sonuc[0].konu).toBe("Türev");
    expect(sonuc[0].kez).toBe(3); // 2 deneme + 1 profil
    expect(sonuc[0].kaynaklar).toEqual(["deneme", "başlangıç formu"]);
    expect(sonuc.find((z) => z.konu === "Limit")?.kez).toBe(1);
  });

  it("profil yoksa yalnız denemelerden üretir", () => {
    const sonuc = zayifKonular([deneme([{ ders: "Fizik", yanlisKonular: ["Basınç"] }])], null);
    expect(sonuc).toHaveLength(1);
    expect(sonuc[0]).toMatchObject({ ders: "Fizik", konu: "Basınç", kez: 1 });
  });
});

/* ── Özel ders özeti ──────────────────────────────────────── */

const ders = (o: Partial<OzelDersSatir> & { durum: string }): OzelDersSatir => ({
  id: "x", ders: "Matematik", konu: "", tarih: new Date("2026-01-01T00:00:00.000Z"),
  saat: "18:00", sure: 60, ucret: 0, odendi: false, olusturan: "koc", ...o,
});

describe("ozelDersOzet", () => {
  it("yapılan/planlı sayıları, toplam saat ve bekleyen ücret", () => {
    const oz = ozelDersOzet([
      ders({ durum: "yapildi", sure: 90, ucret: 800, odendi: true }),
      ders({ durum: "yapildi", sure: 60, ucret: 500, odendi: false }),
      ders({ durum: "planlandi", tarih: tarihNesnesi(gunKaydir(5)) }),
    ]);
    expect(oz.yapilan).toBe(2);
    expect(oz.planlanan).toBe(1);
    expect(oz.toplamSaat).toBe(2.5); // (90+60)/60
    expect(oz.bekleyenUcret).toBe(500); // yapılan ama ödenmeyen
  });

  it("sıradaki ders bugün/sonrası ilk planlı derstir", () => {
    const oz = ozelDersOzet([
      ders({ id: "gec", durum: "planlandi", tarih: tarihNesnesi(gunKaydir(-2)) }),
      ders({ id: "yakin", durum: "planlandi", tarih: tarihNesnesi(gunKaydir(2)) }),
    ]);
    expect(oz.sonraki?.id).toBe("yakin");
    expect(oz.gecikenPlan).toBe(1);
  });

  it("onay bekleyen talepleri oluşturana göre ayırır", () => {
    const oz = ozelDersOzet([
      ders({ durum: "talep", olusturan: "ogrenci" }),
      ders({ durum: "talep", olusturan: "koc" }),
    ]);
    expect(oz.onayBekleyenKoc).toBe(1); // öğrenci açtı → koç onaylayacak
    expect(oz.onayBekleyenOgr).toBe(1); // koç açtı → öğrenci onaylayacak
  });
});

describe("ozelDersMetni", () => {
  it("ders – konu · tarih saat biçimi", () => {
    expect(ozelDersMetni({ ders: "Matematik", konu: "Türev", tarih: "2026-07-25", saat: "18:00" }))
      .toBe("Matematik – Türev · 25.07.2026 18:00");
  });
  it("konu ve saat yoksa kısalır", () => {
    expect(ozelDersMetni({ ders: "Fizik", konu: "", tarih: "2026-07-25", saat: "" }))
      .toBe("Fizik · 25.07.2026");
  });
});

/* ── Öğrenci genel özeti ──────────────────────────────────── */

describe("ogrenciOzet", () => {
  it("ödev/takip yüzdeleri, son net ve net farkı", () => {
    const oz = ogrenciOzet(
      [{ durum: "tamamlandi" }, { durum: "bekliyor" }, { durum: "tamamlandi" }],
      [{ tamamlandi: true }, { tamamlandi: false }],
      [
        { id: "1", ad: "D1", tur: "TYT", tarih: new Date("2026-07-01T00:00:00.000Z"), net: 80 },
        { id: "2", ad: "D2", tur: "TYT", tarih: new Date("2026-07-10T00:00:00.000Z"), net: 88.5 },
      ],
      [yol("a", 1, 50, true), yol("b", 2, 50, false)]
    );
    expect(oz.odevYuzde).toBe(67); // 2/3
    expect(oz.takipYuzde).toBe(50);
    expect(oz.sonNet).toBe(88.5);
    expect(oz.netFarki).toBe(8.5);
    expect(oz.seviye).toBe(1);
  });

  it("tek deneme varken net farkı null", () => {
    const oz = ogrenciOzet([], [], [
      { id: "1", ad: "D1", tur: "TYT", tarih: new Date("2026-07-01T00:00:00.000Z"), net: 70 },
    ], []);
    expect(oz.sonNet).toBe(70);
    expect(oz.netFarki).toBeNull();
  });

  it("veri yoksa yüzdeler sıfır, netler null", () => {
    const oz = ogrenciOzet([], [], [], []);
    expect(oz.odevYuzde).toBe(0);
    expect(oz.takipYuzde).toBe(0);
    expect(oz.sonNet).toBeNull();
    expect(oz.netFarki).toBeNull();
  });
});
