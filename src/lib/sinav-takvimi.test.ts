import { describe, expect, it } from "vitest";
import {
  baslikDuzelt,
  birlestir,
  harmanla,
  kimlik,
  mebDuyurulariAyristir,
  mebTakvimBaglantisi,
  metneCevir,
  odsgmDuyurulariAyristir,
  osymDuyurulariAyristir,
  osymTakvimiAyristir,
  type Duyuru,
  type Sinav,
} from "./sinav-takvimi";

/* ÖSYM takvim sayfasındaki tablonun gerçek biçimi: başlık satırı + altı
   sütun. Başvuru/geç başvuru hücrelerinde iki tarih (başlangıç–bitiş) ve
   saat bilgisi bir arada gelir. */
const OSYM_TABLO = `
<table>
  <tr>
    <th>Sınav Adı</th><th>Sınav Tarihi</th><th>Ön Başvuru Tarihi</th>
    <th>Başvuru Tarihi</th><th>Geç Başvuru Tarihi</th><th>Sonuç Tarihi</th>
  </tr>
  <tr>
    <td>2026-MS&#xDC;</td><td>01.03.2026 10:15</td><td>&nbsp;</td>
    <td>05.01.2026 10:30 29.01.2026 23:59</td>
    <td>03.02.2026 03.02.2026 23:59</td><td>24.03.2026</td>
  </tr>
  <tr>
    <td>2026-YKS 1. Oturum (TYT)</td><td>20.06.2026</td><td></td>
    <td>06.02.2026 02.03.2026</td>
    <td>10.03.2026 12.03.2026 23:59</td><td>21.07.2026 06:00</td>
  </tr>
  <tr>
    <td>2026-&#xD6;ZYES</td><td>15.08.2026 18.08.2026</td><td></td>
    <td>23.07.2026 14:30 28.07.2026 23:59</td>
    <td>30.07.2026 30.07.2026 23:59</td><td>09.09.2026</td>
  </tr>
  <tr>
    <td>2026-GUY (&#xD6;N BA&#x15E;VURU)</td><td>07.03.2026</td>
    <td>14.01.2026 10:00 21.01.2026 23:59</td><td></td><td></td><td>30.01.2026</td>
  </tr>
</table>`;

describe("osymTakvimiAyristir", () => {
  const sinavlar = osymTakvimiAyristir(OSYM_TABLO);

  it("başlık satırını atlayıp tüm sınav satırlarını okur", () => {
    expect(sinavlar).toHaveLength(4);
    expect(sinavlar.map((s) => s.ad)).toContain("2026-MSÜ");
  });

  it("başvuru hücresindeki iki tarihi başlangıç ve bitiş olarak ayırır", () => {
    const msu = sinavlar.find((s) => s.ad === "2026-MSÜ")!;
    expect(msu.basvuruBas).toBe("2026-01-05");
    expect(msu.basvuruBit).toBe("2026-01-29");
  });

  it("sınav saatini ayrı alana çıkarır, tarihi ISO'ya çevirir", () => {
    const msu = sinavlar.find((s) => s.ad === "2026-MSÜ")!;
    expect(msu.sinavTarihi).toBe("2026-03-01");
    expect(msu.sinavSaati).toBe("10:15");
    expect(msu.sinavBitis).toBeNull();
  });

  it("geç başvurunun SON gününü alır (23:59'lu satır)", () => {
    const yks = sinavlar.find((s) => s.ad.startsWith("2026-YKS"))!;
    expect(yks.gecBasvuruBas).toBe("2026-03-10");
    expect(yks.gecBasvuru).toBe("2026-03-12");
    expect(yks.sonucTarihi).toBe("2026-07-21");
  });

  it("iki güne yayılan sınavda bitiş tarihini doldurur", () => {
    const ozyes = sinavlar.find((s) => s.ad === "2026-ÖZYES")!;
    expect(ozyes.sinavTarihi).toBe("2026-08-15");
    expect(ozyes.sinavBitis).toBe("2026-08-18");
  });

  it("ön başvuru sütununu ayrı tutar", () => {
    const guy = sinavlar.find((s) => s.ad.includes("GUY"))!;
    expect(guy.onBasvuruBas).toBe("2026-01-14");
    expect(guy.onBasvuruBit).toBe("2026-01-21");
    expect(guy.basvuruBas).toBeNull();
  });

  it("tablo yoksa boş dizi döner (sayfa yapısı değişirse çökmesin)", () => {
    expect(osymTakvimiAyristir("<p>tablo yok</p>")).toEqual([]);
  });
});

describe("kimlik", () => {
  it("Türkçe sınav adından kararlı bir kimlik üretir", () => {
    expect(kimlik("2026-YÖKDİL/2")).toBe("2026-yokdil-2");
    expect(kimlik("2026-İOKBS (Bursluluk Sınavı)")).toBe("2026-iokbs-bursluluk-sinavi");
  });

  it("aynı ad için her zaman aynı sonucu verir", () => {
    expect(kimlik("2026-MSÜ")).toBe(kimlik("2026-MSÜ"));
  });
});

describe("metneCevir", () => {
  it("etiketleri atar, varlıkları çözer, boşlukları tekiller", () => {
    expect(metneCevir("<td> 2026-KPSS &#x130;lan&nbsp;&amp;  Duyuru </td>")).toBe("2026-KPSS İlan & Duyuru");
  });
});

describe("baslikDuzelt", () => {
  it("tamamı büyük MEB başlığını okunur hâle getirir", () => {
    expect(baslikDuzelt("YERLEŞTİRME SONUÇLARI AÇIKLANDI")).toBe("Yerleştirme Sonuçları Açıklandı");
  });

  it("sınav kısaltmalarını büyük bırakır", () => {
    expect(baslikDuzelt("LGS KAPSAMINDAKİ MERKEZÎ SINAV SONUÇLARI AÇIKLANDI"))
      .toBe("LGS Kapsamındaki Merkezî Sınav Sonuçları Açıklandı");
    expect(baslikDuzelt("2026 KPSS VE ALES BAŞVURULARI")).toBe("2026 KPSS ve ALES Başvuruları");
  });

  it("parantez içindeki kısaltmayı da korur", () => {
    expect(baslikDuzelt("BURSLULUK SINAVI (İOKBS) BAŞVURULARI BAŞLADI"))
      .toBe("Bursluluk Sınavı (İOKBS) Başvuruları Başladı");
  });

  it("bağlaçları küçük bırakır ama baştaki sözcüğü büyütür", () => {
    expect(baslikDuzelt("VE İLE BAŞLAYAN SINAV")).toBe("Ve ile Başlayan Sınav");
  });

  it("karışık yazılmış başlığa dokunmaz", () => {
    const s = "LGS sonuçları açıklandı";
    expect(baslikDuzelt(s)).toBe(s);
  });
});

describe("osymDuyurulariAyristir", () => {
  const html = `
    <a href="/2026-ales2-temel-soru-kitapcigi-ve-cevap-anahtari-yayimlandi">2026-ALES/2: Temel Soru Kitapçığı ve Cevap Anahtarı Yayımlandı</a>
    <a href="/2026-yks-tercihlerin-alinmasi">2026-YKS: Tercihlerin Alınması ve tercih süreci hakkında duyuru</a>
    <a href="https://ais.osym.gov.tr">Aday İşlemleri Sistemi https://ais.osym.gov.tr</a>
    <a href="/kurumsal-kimlik-ve-tanitim-brosuru-sayfasi">Kurumsal kimlik ve tanıtım broşürü hakkında bilgilendirme</a>
    <a href="/2026-yks-tercihlerin-alinmasi">2026-YKS: Tercihlerin Alınması ve tercih süreci hakkında duyuru</a>`;
  const duyurular = osymDuyurulariAyristir(html);

  it("yalnız sınavla ilgili duyuruları alır", () => {
    expect(duyurular).toHaveLength(2);
    expect(duyurular.every((d) => /ALES|YKS/.test(d.baslik))).toBe(true);
  });

  it("göreli adresleri tam adrese çevirir", () => {
    expect(duyurular[0].url).toBe("https://www.osym.gov.tr/2026-ales2-temel-soru-kitapcigi-ve-cevap-anahtari-yayimlandi");
    expect(duyurular[0].kaynak).toBe("osym.gov.tr");
  });

  it("aynı başlığı iki kez eklemez", () => {
    const yks = duyurular.filter((d) => d.baslik.includes("YKS"));
    expect(yks).toHaveLength(1);
  });

  it("sistem/dış bağlantıları duyuru saymaz", () => {
    expect(duyurular.some((d) => d.url.includes("ais.osym"))).toBe(false);
  });
});

describe("mebDuyurulariAyristir", () => {
  const html = `
    <a href="/lgs-yerlestirme-sonuclari-aciklandi/haber/41557/tr">LGS YERLEŞTİRME SONUÇLARI AÇIKLANDI</a>
    <a href="/argem-lisesi-ogrencilerinden-cifte-basari/haber/41570/tr">ARGEM LİSESİ ÖĞRENCİLERİNDEN ÇİFTE BAŞARI</a>
    <a href="/bursluluk-sinavi-basvurulari-basladi/haber/41000/tr"><img alt="BURSLULUK SINAVI BAŞVURULARI BAŞLADI" /></a>`;
  const duyurular = mebDuyurulariAyristir(html);

  it("sınavla ilgisiz haberi süzer", () => {
    expect(duyurular.some((d) => d.baslik.includes("Argem"))).toBe(false);
  });

  it("görsel alt metnini başlık olarak kullanabilir", () => {
    expect(duyurular.some((d) => d.baslik.includes("Bursluluk"))).toBe(true);
  });

  it("başlıkları okunur hâle getirir ve tam adres üretir", () => {
    const lgs = duyurular.find((d) => d.baslik.includes("LGS"))!;
    expect(lgs.url).toBe("https://www.meb.gov.tr/lgs-yerlestirme-sonuclari-aciklandi/haber/41557/tr");
    expect(lgs.kaynak).toBe("meb.gov.tr");
  });
});

/* ODSGM ana sayfası aynı haberi birkaç biçimde bağlar: kısa başlık,
   kırpılmış özet ("[...]") ve listede tarih önekli hâli. */
describe("odsgmDuyurulariAyristir", () => {
  const html = `
    <a href="/www/lgs-yerlestirme-sonuclari-aciklandi/icerik/1714/tr">LGS YERLEŞTİRME SONUÇLARI AÇIKLANDI</a>
    <a href="/www/lgs-yerlestirme-sonuclari-aciklandi/icerik/1714/tr">Liselere Geçiş Sistemi kapsamındaki yerleştirme sonuçları erişime [...] açıldı</a>
    <a href="/www/2026-udsp-yabanci-dil-sinavi-sonuclari/icerik/1702/tr">14 May 2026 12:00 2026 UDSP YABANCI DİL YETERLİLİK YAZILI SINAVI SONUÇLARI AÇIKLANDI</a>
    <a href="/www/temmuz-ayi-e-bulteni/icerik/1712/tr">Temmuz ayı e-bülteni yayımlandı, genel müdürlük çalışmaları</a>`;
  const duyurular = odsgmDuyurulariAyristir(html);

  it("adres başına tek duyuru bırakır ve başlık gibi olanı seçer", () => {
    const lgs = duyurular.filter((d) => d.url.includes("1714"));
    expect(lgs).toHaveLength(1);
    expect(lgs[0].baslik).toBe("LGS Yerleştirme Sonuçları Açıklandı");
  });

  it("başlığın önündeki tarih önekini atar", () => {
    const udsp = duyurular.find((d) => d.url.includes("1702"))!;
    expect(udsp.baslik.startsWith("2026 UDSP")).toBe(true);
  });

  it("sınavla ilgisiz duyuruyu almaz", () => {
    expect(duyurular.some((d) => d.url.includes("1712"))).toBe(false);
  });

  it("kaynak adı odsgm olarak işaretlenir", () => {
    expect(duyurular.every((d) => d.kaynak === "odsgm.meb.gov.tr")).toBe(true);
  });
});

describe("harmanla", () => {
  const d = (baslik: string, kaynak: string): Duyuru => ({ baslik, url: "https://x/" + baslik, kaynak });

  it("iki kaynağı dönüşümlü sıralar", () => {
    const sonuc = harmanla([d("A1", "osym"), d("A2", "osym")], [d("B1", "meb"), d("B2", "meb")]);
    expect(sonuc.map((x) => x.baslik)).toEqual(["A1", "B1", "A2", "B2"]);
  });

  it("bir liste tükenince diğerini sürdürür", () => {
    const sonuc = harmanla([d("A1", "osym")], [d("B1", "meb"), d("B2", "meb")]);
    expect(sonuc.map((x) => x.baslik)).toEqual(["A1", "B1", "B2"]);
  });

  it("aynı başlık iki kaynakta geçse bir kez alır", () => {
    const sonuc = harmanla([d("LGS sonuçları", "osym")], [d("lgs sonuçları", "meb")]);
    expect(sonuc).toHaveLength(1);
  });
});

describe("mebTakvimBaglantisi", () => {
  it("en yeni yılın sınav uygulama takvimini seçer", () => {
    const html = `
      <a href="/dosya/2026_SINAV_TAKVIMI.pdf">2026 Yılı Sınav Uygulama Takvimi</a>
      <a href="/dosya/2027_SINAV_TAKVIMI.pdf">2027 Yılı Sınav Uygulama Takvimi</a>`;
    const b = mebTakvimBaglantisi(html)!;
    expect(b.ad).toContain("2027");
    expect(b.url).toBe("https://odsgm.meb.gov.tr/dosya/2027_SINAV_TAKVIMI.pdf");
  });

  it("takvim bağlantısı yoksa null döner", () => {
    expect(mebTakvimBaglantisi('<a href="/x">Bülten</a>')).toBeNull();
  });
});

/* ── Birleştirme ────────────────────────────────────────────────────── */
function sinav(p: Partial<Sinav> & { ad: string }): Sinav {
  return {
    id: kimlik(p.ad),
    kurum: "ÖSYM",
    sinavTarihi: null, sinavSaati: null, sinavBitis: null,
    onBasvuruBas: null, onBasvuruBit: null,
    basvuruBas: null, basvuruBit: null,
    gecBasvuruBas: null, gecBasvuru: null,
    sonucTarihi: null,
    kaynakUrl: "https://www.osym.gov.tr/Sayfa/SinavTakvimi",
    ...p,
  };
}

describe("birlestir", () => {
  it("canlı tarih çekirdek tarihi ezer", () => {
    const cekirdek = [sinav({ ad: "2026-ALES/3", sinavTarihi: "2026-11-29" })];
    const canli = [sinav({ ad: "2026-ALES/3", sinavTarihi: "2026-12-06" })];
    expect(birlestir(cekirdek, canli)[0].sinavTarihi).toBe("2026-12-06");
  });

  it("çekirdekteki elle yazılmış notu korur", () => {
    const cekirdek = [sinav({ ad: "2026-ALES/3", not: "Elle girilen açıklama" })];
    const canli = [sinav({ ad: "2026-ALES/3", sinavTarihi: "2026-11-29" })];
    expect(birlestir(cekirdek, canli)[0].not).toBe("Elle girilen açıklama");
  });

  it("canlıda çıkan yeni sınavı listeye ekler (yeni yıl takvimi)", () => {
    const cekirdek = [sinav({ ad: "2026-YKS 1. Oturum (TYT)", sinavTarihi: "2026-06-20" })];
    const canli = [
      sinav({ ad: "2026-YKS 1. Oturum (TYT)", sinavTarihi: "2026-06-20" }),
      sinav({ ad: "2027-YKS 1. Oturum (TYT)", sinavTarihi: "2027-06-19" }),
    ];
    const sonuc = birlestir(cekirdek, canli);
    expect(sonuc).toHaveLength(2);
    expect(sonuc.map((s) => s.ad)).toContain("2027-YKS 1. Oturum (TYT)");
  });

  it("karşılığı yayımlanan yer tutucuyu listeden düşürür", () => {
    const cekirdek = [
      sinav({ ad: "2027-YKS (TYT / AYT / YDT)", bekleyen: true, yerineDesen: "^\\s*2027-YKS" }),
    ];
    const canli = [sinav({ ad: "2027-YKS 1. Oturum (TYT)", sinavTarihi: "2027-06-19" })];
    const sonuc = birlestir(cekirdek, canli);
    expect(sonuc).toHaveLength(1);
    expect(sonuc[0].ad).toBe("2027-YKS 1. Oturum (TYT)");
  });

  it("karşılığı yayımlanmayan yer tutucuyu korur", () => {
    const cekirdek = [
      sinav({ ad: "2027-LGS Kapsamındaki Merkezî Sınav", kurum: "MEB", bekleyen: true, yerineDesen: "2027-LGS" }),
    ];
    const canli = [sinav({ ad: "2026-ALES/3", sinavTarihi: "2026-11-29" })];
    expect(birlestir(cekirdek, canli).map((s) => s.ad)).toContain("2027-LGS Kapsamındaki Merkezî Sınav");
  });

  it("MEB satırları ÖSYM tablosunda olmasa da korunur", () => {
    const cekirdek = [sinav({ ad: "2026-İOKBS (Bursluluk Sınavı)", kurum: "MEB", sinavTarihi: "2026-04-26" })];
    const canli = [sinav({ ad: "2026-ALES/3", sinavTarihi: "2026-11-29" })];
    expect(birlestir(cekirdek, canli)).toHaveLength(2);
  });

  it("sonucu sınav tarihine göre sıralar, tarihsizleri sona atar", () => {
    const cekirdek = [
      sinav({ ad: "Tarihsiz Sınav", bekleyen: true }),
      sinav({ ad: "2026-Aralık", sinavTarihi: "2026-12-01" }),
      sinav({ ad: "2026-Ocak", sinavTarihi: "2026-01-15" }),
    ];
    const sonuc = birlestir(cekirdek, []);
    expect(sonuc.map((s) => s.ad)).toEqual(["2026-Ocak", "2026-Aralık", "Tarihsiz Sınav"]);
  });

  it("bozuk yerineDesen ayarı çökmeye yol açmaz", () => {
    const cekirdek = [sinav({ ad: "Yer tutucu", bekleyen: true, yerineDesen: "[" })];
    expect(() => birlestir(cekirdek, [])).not.toThrow();
  });
});
