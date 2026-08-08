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
  sinavAdiCoz,
  sutunlariEsle,
  type CanliSinav,
  type Duyuru,
  type Sinav,
} from "./sinav-takvimi";

/* ÖSYM takvim tablosunun YAYINDAKİ biçimi (8 Ağustos 2026'da osym.gov.tr'den
   birebir alınmıştır): BEŞ sütun — "Ön Başvuru Tarihi" sütunu yok. Ad hücresi
   <br> ile üç parçalıdır: kısaltma | uzun ad | sınav kodu. Başvuru ve geç
   başvuru hücrelerinde iki tarih (başlangıç + 23:59'lu bitiş) yan yana gelir.

   NOT: Bu düzen daha önce 6 sütunluydu ve testler uydurma 6 sütunlu HTML
   kullandığı için sütun kaybı yayında fark edilmedi. Artık fikstür gerçek
   sayfadan alınır; ayrıca eski/başka düzenler için de ayrı testler var. */
const OSYM_TABLO = `
<table>
  <tr> <th>S&#x131;nav Ad&#x131;</th> <th>S&#x131;nav Tarihi</th> <th>Ba&#x15F;vuru Tarihi</th> <th>Ge&#xE7; Ba&#x15F;vuru Tarihi</th> <th>Sonu&#xE7; Tarihi</th> </tr>
  <tr data-yil="2026"> <td><b>e-YDS</b> <br />  <br />Elektronik Yabanc&#x131; Dil S&#x131;nav&#x131; <br /> <br /> e-YDS 2026/1 &#x130;ngilizce</td> <td>24.01.2026</td> <td> 07.01.2026 14:00<br>15.01.2026 23:59 </td> <td></td> <td> 24.01.2026 </td> </tr>
  <tr data-yil="2026"> <td><b>KPSS</b> <br />  <br />Kamu Personel Se&#xE7;me S&#x131;nav&#x131; <br /> <br /> 2026-KPSS &#xD6;n Lisans</td> <td>04.10.2026 10:15</td> <td> 29.07.2026 09:45<br>10.08.2026 23:59 </td> <td>19.08.2026<br>20.08.2026 23:59</td> <td> 30.10.2026 </td> </tr>
  <tr data-yil="2026"> <td><b>&#xD6;ZYES</b> <br />  <br />&#xD6;zel Yetenek Sporcu S&#x131;nav&#x131; <br /> <br /> 2026-&#xD6;ZYES</td> <td>15.08.2026<br>18.08.2026</td> <td> 23.07.2026 14:30<br>28.07.2026 23:59 </td> <td>30.07.2026<br>30.07.2026 23:59</td> <td> 09.09.2026 </td> </tr>
</table>`;

describe("osymTakvimiAyristir", () => {
  const sinavlar = osymTakvimiAyristir(OSYM_TABLO);

  it("YAYINDAKİ beş sütunlu tabloyu okur (regresyon: 6 sütun şartı tüm satırları atıyordu)", () => {
    expect(sinavlar).toHaveLength(3);
    expect(sinavlar.map((s) => s.ad)).toEqual([
      "e-YDS 2026/1 İngilizce",
      "2026-KPSS Ön Lisans",
      "2026-ÖZYES",
    ]);
  });

  it("ad hücresinin son parçasını sınav adı, ortasını açıklama yapar", () => {
    const kpss = sinavlar.find((s) => s.ad === "2026-KPSS Ön Lisans")!;
    expect(kpss.id).toBe("2026-kpss-on-lisans");
    expect(kpss.not).toBe("Kamu Personel Seçme Sınavı");
  });

  it("başvuru hücresindeki iki tarihi başlangıç ve bitiş olarak ayırır", () => {
    const kpss = sinavlar.find((s) => s.ad === "2026-KPSS Ön Lisans")!;
    expect(kpss.basvuruBas).toBe("2026-07-29");
    expect(kpss.basvuruBit).toBe("2026-08-10");
  });

  it("sınav saatini ayrı alana çıkarır, tarihi ISO'ya çevirir", () => {
    const kpss = sinavlar.find((s) => s.ad === "2026-KPSS Ön Lisans")!;
    expect(kpss.sinavTarihi).toBe("2026-10-04");
    expect(kpss.sinavSaati).toBe("10:15");
    expect(kpss.sinavBitis).toBeNull();
    expect(kpss.sonucTarihi).toBe("2026-10-30");
  });

  it("geç başvurunun SON gününü alır (23:59'lu satır)", () => {
    const kpss = sinavlar.find((s) => s.ad === "2026-KPSS Ön Lisans")!;
    expect(kpss.gecBasvuruBas).toBe("2026-08-19");
    expect(kpss.gecBasvuru).toBe("2026-08-20");
  });

  it("iki güne yayılan sınavda bitiş tarihini doldurur", () => {
    const ozyes = sinavlar.find((s) => s.ad === "2026-ÖZYES")!;
    expect(ozyes.sinavTarihi).toBe("2026-08-15");
    expect(ozyes.sinavBitis).toBe("2026-08-18");
  });

  it("bulunmayan sütunu null yazmaz — birleştirmede çekirdeği ezmesin", () => {
    const kpss = sinavlar.find((s) => s.ad === "2026-KPSS Ön Lisans")!;
    expect("onBasvuruBas" in kpss).toBe(false);
  });

  it("boş geç başvuru hücresinde alan null olur", () => {
    const eyds = sinavlar.find((s) => s.ad.startsWith("e-YDS"))!;
    expect(eyds.gecBasvuru).toBeNull();
  });

  it("tablo yoksa boş dizi döner (sayfa yapısı değişirse çökmesin)", () => {
    expect(osymTakvimiAyristir("<p>tablo yok</p>")).toEqual([]);
  });
});

/* Sütunlar konuma göre değil BAŞLIK ADINA göre eşlenir; ÖSYM sütun
   ekler/çıkarır ya da sırasını değiştirirse ayrıştırma çalışmaya devam eder. */
describe("osymTakvimiAyristir · sütun düzeni değişimleri", () => {
  it("Ön Başvuru sütunlu ESKİ altı sütunlu düzeni de okur", () => {
    const eski = `<table>
      <tr><th>Sınav Adı</th><th>Sınav Tarihi</th><th>Ön Başvuru Tarihi</th>
          <th>Başvuru Tarihi</th><th>Geç Başvuru Tarihi</th><th>Sonuç Tarihi</th></tr>
      <tr><td>2026-GUY</td><td>07.03.2026</td>
          <td>14.01.2026 10:00<br>21.01.2026 23:59</td><td></td><td></td><td>30.01.2026</td></tr>
    </table>`;
    const [guy] = osymTakvimiAyristir(eski);
    expect(guy.onBasvuruBas).toBe("2026-01-14");
    expect(guy.onBasvuruBit).toBe("2026-01-21");
    expect(guy.basvuruBas).toBeNull();
    expect(guy.sonucTarihi).toBe("2026-01-30");
  });

  it("sütun sırası değişse de doğru alanı okur", () => {
    const karisik = `<table>
      <tr><th>Sonuç Tarihi</th><th>Sınav Adı</th><th>Geç Başvuru Tarihi</th>
          <th>Başvuru Tarihi</th><th>Sınav Tarihi</th></tr>
      <tr><td>30.10.2026</td><td>2026-ALES/3</td><td>21.10.2026</td>
          <td>07.10.2026<br>15.10.2026</td><td>29.11.2026</td></tr>
    </table>`;
    const [ales] = osymTakvimiAyristir(karisik);
    expect(ales.ad).toBe("2026-ALES/3");
    expect(ales.sinavTarihi).toBe("2026-11-29");
    expect(ales.basvuruBas).toBe("2026-10-07");
    expect(ales.basvuruBit).toBe("2026-10-15");
    expect(ales.gecBasvuru).toBe("2026-10-21");
    expect(ales.sonucTarihi).toBe("2026-10-30");
  });

  it("başlık satırı tanınmazsa hücre sayısına göre yedek düzene döner", () => {
    const basliksiz = `<table>
      <tr><td>2026-DGS</td><td>19.07.2026</td><td>15.05.2026<br>02.06.2026</td><td>11.06.2026</td><td>13.08.2026</td></tr>
    </table>`;
    const [dgs] = osymTakvimiAyristir(basliksiz);
    expect(dgs.sinavTarihi).toBe("2026-07-19");
    expect(dgs.basvuruBit).toBe("2026-06-02");
    expect(dgs.sonucTarihi).toBe("2026-08-13");
  });

  it("ad sütunu bulunamazsa boş döner (yanlış veri üretmez)", () => {
    const alakasiz = `<table>
      <tr><th>Şehir</th><th>Nüfus</th><th>Bölge</th></tr>
      <tr><td>Ankara 2026</td><td>5</td><td>İç Anadolu</td></tr>
    </table>`;
    expect(osymTakvimiAyristir(alakasiz)).toEqual([]);
  });
});

describe("sinavAdiCoz", () => {
  it("üç parçalı hücrede son parçayı ad, ortayı açıklama yapar", () => {
    const r = sinavAdiCoz("<b>ALES</b> <br /> <br />Akademik Personel Sınavı <br /> <br /> 2026-ALES/3");
    expect(r.ad).toBe("2026-ALES/3");
    expect(r.aciklama).toBe("Akademik Personel Sınavı");
  });

  it("tek parçalı eski biçimde tüm metni ad sayar", () => {
    const r = sinavAdiCoz("2026-MS&#xDC;");
    expect(r.ad).toBe("2026-MSÜ");
    expect(r.aciklama).toBeNull();
  });

  it("boş hücrede boş ad döner", () => {
    expect(sinavAdiCoz("<br /> <br />")).toEqual({ ad: "", aciklama: null });
  });
});

describe("sutunlariEsle", () => {
  it("ön/geç başvuruyu düz başvurudan ayırır", () => {
    const h = sutunlariEsle([
      "Sınav Adı", "Sınav Tarihi", "Ön Başvuru Tarihi", "Başvuru Tarihi", "Geç Başvuru Tarihi", "Sonuç Tarihi",
    ])!;
    expect(h).toEqual({ ad: 0, sinav: 1, onBasvuru: 2, basvuru: 3, gec: 4, sonuc: 5 });
  });

  it("beş sütunlu yayın düzenini eşler", () => {
    const h = sutunlariEsle(["Sınav Adı", "Sınav Tarihi", "Başvuru Tarihi", "Geç Başvuru Tarihi", "Sonuç Tarihi"])!;
    expect(h).toEqual({ ad: 0, sinav: 1, basvuru: 2, gec: 3, sonuc: 4 });
  });

  it("ad sütunu yoksa null döner", () => {
    expect(sutunlariEsle(["Sınav Tarihi", "Sonuç Tarihi"])).toBeNull();
  });

  it("hiç tarih sütunu yoksa null döner", () => {
    expect(sutunlariEsle(["Sınav Adı", "Açıklama"])).toBeNull();
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

  /* Canlı tabloda BULUNMAYAN sütun (ör. "Ön Başvuru" kaldırıldığında) alanı
     hiç taşımaz; çekirdekteki değeri silmemesi gerekir. */
  it("canlı satırda hiç olmayan alan çekirdekteki değeri ezmez", () => {
    const cekirdek = [sinav({ ad: "2026-GUY", onBasvuruBas: "2026-01-14", onBasvuruBit: "2026-01-21" })];
    const canli: CanliSinav[] = [
      { id: kimlik("2026-GUY"), ad: "2026-GUY", kurum: "ÖSYM", kaynakUrl: "x", sinavTarihi: "2026-03-07" },
    ];
    const [g] = birlestir(cekirdek, canli);
    expect(g.onBasvuruBas).toBe("2026-01-14");
    expect(g.onBasvuruBit).toBe("2026-01-21");
    expect(g.sinavTarihi).toBe("2026-03-07");
  });

  it("canlı satır alanı açıkça null verdiyse (sütun var, hücre boş) günceller", () => {
    const cekirdek = [sinav({ ad: "2026-GUY", gecBasvuru: "2026-02-10" })];
    const canli: CanliSinav[] = [
      { id: kimlik("2026-GUY"), ad: "2026-GUY", kurum: "ÖSYM", kaynakUrl: "x", gecBasvuru: null },
    ];
    expect(birlestir(cekirdek, canli)[0].gecBasvuru).toBeNull();
  });

  it("canlıda yeni çıkan satırda eksik alanlar null olur (undefined sızmaz)", () => {
    const canli: CanliSinav[] = [
      { id: "2027-yks", ad: "2027-YKS", kurum: "ÖSYM", kaynakUrl: "x", sinavTarihi: "2027-06-19" },
    ];
    const [y] = birlestir([], canli);
    expect(y.onBasvuruBas).toBeNull();
    expect(y.basvuruBit).toBeNull();
    expect(Object.values(y).includes(undefined)).toBe(false);
  });

  it("bozuk yerineDesen ayarı çökmeye yol açmaz", () => {
    const cekirdek = [sinav({ ad: "Yer tutucu", bekleyen: true, yerineDesen: "[" })];
    expect(() => birlestir(cekirdek, [])).not.toThrow();
  });
});
