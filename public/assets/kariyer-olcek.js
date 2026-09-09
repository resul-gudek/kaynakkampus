/* ══════════════════════════════════════════════════════════════════
   KARİYER PUSULAM — ÖLÇÜM KATMANI
   ──────────────────────────────────────────────────────────────────
   Bu dosya yalnız VERİ tutar: kariyer boyutları, "Kendimi Keşfet"
   bölümleri ve her seçeneğin hangi boyuta kaç puan eklediği.
   Hesaplama yapmaz — motor assets/kariyer-motor.js içindedir.

   Tasarım kuralları
   · Ağırlıklar burada, tek yerde durur; motorda ya da arayüzde
     dağınık "magic number" yoktur.
   · Boyutlar dört eksene ayrılır: ilgi · çalışma · değer · yol.
     Her boyut yalnız bir eksene aittir; çift sayım olmaz.
   · Bölüm 3 (iyi olduğum alanlar) bilerek hiçbir kariyer boyutuna
     puan yazmaz: mevcut ders başarısı "akademik hazırlık" olarak
     ayrı tutulur, kariyer uyumunu etkilemez.
   · Hiçbir yerde rastgelelik yoktur; aynı cevaplar aynı sonucu verir.
   ══════════════════════════════════════════════════════════════════ */
(function (kok) {
  "use strict";

  /* ── 1. KARİYER BOYUTLARI ──────────────────────────────────────
     Anahtar → ekranda görünen ad. Eksen sırası rapor sırasıdır. */
  var BOYUTLAR = {
    ilgi: {
      sozelIfade: "Sözel ifade",
      yaziliIfade: "Yazılı ifade",
      dilYatkinligi: "Dil yatkınlığı",
      sayisalDusunme: "Sayısal düşünme",
      mantiksalDusunme: "Mantıksal düşünme",
      analitikDusunme: "Analitik düşünme",
      arastirma: "Araştırma",
      problemCozme: "Problem çözme",
      gorselDusunme: "Görsel düşünme",
      mekansalDusunme: "Mekânsal düşünme",
      tasarim: "Tasarım",
      yaraticilik: "Yaratıcılık",
      elBecerisi: "El becerisi",
      bedenselBeceri: "Bedensel beceri",
      teknoloji: "Teknoloji",
      ogretme: "Öğretme ve anlatma",
      aktifDinleme: "Aktif dinleme",
      empati: "İnsan odaklılık",
      sosyalEtkilesim: "Sosyal etkileşim",
      ikna: "İkna",
      liderlik: "Liderlik",
      organizasyon: "Organizasyon",
      planlama: "Planlama",
      detayOdaklilik: "Detay odaklılık",
      krizCozme: "Kriz anında çözüm",
      dogaIlgisi: "Doğa ve açık alan",
      canliBilimleri: "Canlılar ve sağlık",
      muzikRitim: "Müzik ve ritim",
    },
    calisma: {
      hareketlilik: "Masa başı ↔ Hareketli",
      yerCesitliligi: "Tek iş yeri ↔ Farklı yerler",
      insanEtkilesimi: "Bireysel ↔ İnsanlarla yoğun",
      gorevDegiskenligi: "Sabit görevler ↔ Değişen görevler",
      saatEsnekligi: "Düzenli saat ↔ Esnek saat",
      ortamCanliligi: "Sessiz ortam ↔ Hareketli ortam",
      uygulamalilik: "Teorik ↔ Uygulamalı",
      yontemOzgurlugu: "Belirli kurallar ↔ Kendi yöntemim",
      riskAcikligi: "Güvenli ↔ Riskli ama fırsatlı",
      seyahat: "Yerleşik ↔ Seyahatli",
      girisimcilik: "Çalışan ↔ Girişimci",
      ekipYonetimi: "Az insan sorumluluğu ↔ Ekip yönetme",
    },
    deger: {
      ozelHayat: "Özel hayata zaman",
      isGuvencesi: "İş güvencesi",
      yuksekGelir: "Yüksek kazanç",
      kariyerYukselme: "Kariyerde yükselme",
      prestij: "Prestij",
      toplumsalFayda: "Topluma fayda",
      bagimsizlik: "Bağımsızlık",
      surekliOgrenme: "Sürekli öğrenme",
      insanlaraYardim: "İnsanlara yardım",
      bilgiUretme: "Bilgi üretme",
      somutUretim: "Somut sonuç ve üretim",
      yaraticiOzgurluk: "Yaratıcı özgürlük",
      duzen: "Düzen ve öngörülebilirlik",
    },
    yol: {
      uzunEgitim: "Uzun üniversite eğitimi",
      egitimSonrasiEgitim: "Mezuniyet sonrası eğitim",
      zorSinav: "Zor sınav süreçleri",
      yogunTempo: "Yoğun çalışma temposu",
      rekabetOrtami: "Rekabetçi ortam",
      sehirDegisimi: "Şehir değiştirme",
      yurtdisi: "Yurt dışında yaşama",
      dusukBaslangic: "Düşük başlangıç geliri",
      belirsizlik: "Belirsiz kariyer yolu",
    },
  };

  /* ── 2. İSTEMEDİĞİM KOŞULLAR ───────────────────────────────────
     Bölüm 10'un seçenekleri; program aileleri aynı etiketleri taşır. */
  var KOSULLAR = {
    geceNobet: "Gece çalışmak / nöbet",
    kanHastalik: "Kan ve hastalık ortamı",
    yogunInsan: "Yoğun insan ilişkisi",
    surekliMasa: "Sürekli masa başı",
    surekliAyakta: "Sürekli ayakta olmak",
    yogunMatematik: "Çok yoğun matematik",
    yogunOkumaYazma: "Yoğun okuma / yazma",
    surekliSeyahat: "Sürekli seyahat",
    belirsizGelir: "Belirsiz gelir",
    cokUzunEgitim: "Çok uzun eğitim",
    fizikselYorucu: "Fiziksel olarak yorucu iş",
    yuksekStres: "Yüksek stres",
    surekliSatis: "Sürekli satış / ikna",
    cocuklarla: "Çocuklarla sürekli çalışmak",
    hastalarla: "Hastalarla çalışmak",
    musteriIliskisi: "Sürekli müşteri ilişkileri",
    cokRekabetci: "Çok rekabetçi ortam",
    cokRutin: "Çok rutin işler",
    surekliDegisen: "Sürekli değişen işler",
    buyukEkipYonetimi: "Büyük ekipleri yönetmek",
    yalnizCalisma: "Yalnız çalışmak",
  };

  /* ── 3. AKADEMİK ALANLAR (Bölüm 3) ─────────────────────────────
     Kariyer uyumuna KATILMAZ; yalnız "mevcut akademik hazırlık"
     göstergesi olarak kullanılır. */
  var DERSLER = {
    turkce: "Türkçe", edebiyat: "Edebiyat", matematik: "Matematik",
    geometri: "Geometri", fizik: "Fizik", kimya: "Kimya", biyoloji: "Biyoloji",
    tarih: "Tarih", cografya: "Coğrafya", felsefe: "Felsefe",
    yabanciDil: "Yabancı dil", bilgisayar: "Bilgisayar / yazılım",
    gorselSanatlar: "Görsel sanatlar", muzik: "Müzik", spor: "Spor",
    sunum: "Sunum", yaziYazma: "Yazı yazma", arastirma: "Araştırma",
    proje: "Proje hazırlama", grupCalismasi: "Grup çalışması",
    elBecerileri: "El becerileri", organizasyon: "Organizasyon",
  };

  /* Kısaltmalar — seçenek tablolarını okunur tutmak için */
  function p() {                                   // p("sozelIfade",3,"ikna",1)
    var o = {}, i;
    for (i = 0; i < arguments.length; i += 2) o[arguments[i]] = arguments[i + 1];
    return o;
  }

  /* ── 4. BÖLÜMLER ───────────────────────────────────────────────
     tip: coklu | duzey | ders | kaydirac | onem | engel
     Kıvılcım metinleri yönlendirmez; yalnız nasıl düşünüleceğini anlatır. */
  var BOLUMLER = [
    {
      id: "hoslandiklarim",
      baslik: "Yapmaktan Hoşlandıklarım",
      tip: "coklu",
      eksen: "ilgi",
      soru: "Hangilerini yapmaktan gerçekten hoşlanırsın?",
      yardim: "Birden fazla seçenek işaretleyebilirsin.",
      kivilcim: "Bir şeyi iyi yapmakla onu yapmaktan hoşlanmak aynı şey değildir. Burada gerçekten keyif aldığın şeyleri düşün.",
      enAz: 3,
      serbest: "Listede olmayan ama yapmaktan hoşlandığın bir şey var mı?",
      secenekler: [
        { id: "okumak", ad: "Okumak", p: p("yaziliIfade", 2, "arastirma", 2, "dilYatkinligi", 1) },
        { id: "arastirmak", ad: "Araştırmak", p: p("arastirma", 3, "analitikDusunme", 2) },
        { id: "yazmak", ad: "Yazmak", p: p("yaziliIfade", 3, "yaraticilik", 1) },
        { id: "hikaye", ad: "Hikâye oluşturmak", p: p("yaraticilik", 3, "yaziliIfade", 2) },
        { id: "konusmak", ad: "İnsanlarla konuşmak", p: p("sosyalEtkilesim", 3, "sozelIfade", 2) },
        { id: "dinlemek", ad: "İnsanları dinlemek", p: p("aktifDinleme", 3, "empati", 2) },
        { id: "anlatmak", ad: "Bir şey anlatmak", p: p("sozelIfade", 3, "ogretme", 2) },
        { id: "ogretmek", ad: "Birilerine öğretmek", p: p("ogretme", 3, "sozelIfade", 2, "empati", 1) },
        { id: "problem", ad: "Problem çözmek", p: p("problemCozme", 3, "mantiksalDusunme", 2) },
        { id: "sayilar", ad: "Sayılarla uğraşmak", p: p("sayisalDusunme", 3, "analitikDusunme", 1) },
        { id: "deney", ad: "Deney yapmak", p: p("arastirma", 3, "canliBilimleri", 1, "detayOdaklilik", 1) },
        { id: "teknoloji", ad: "Bilgisayar/teknolojiyle uğraşmak", p: p("teknoloji", 3, "mantiksalDusunme", 2) },
        { id: "tasarlamak", ad: "Tasarım yapmak", p: p("tasarim", 3, "gorselDusunme", 2, "yaraticilik", 1) },
        { id: "cizmek", ad: "Çizmek", p: p("gorselDusunme", 3, "elBecerisi", 1, "yaraticilik", 1) },
        { id: "video", ad: "Fotoğraf/video üretmek", p: p("gorselDusunme", 3, "yaraticilik", 2, "teknoloji", 1) },
        { id: "elIsi", ad: "El işi yapmak", p: p("elBecerisi", 3, "detayOdaklilik", 1) },
        { id: "insaEtmek", ad: "Bir şey inşa etmek", p: p("mekansalDusunme", 3, "elBecerisi", 2, "problemCozme", 1) },
        { id: "tamir", ad: "Tamir etmek", p: p("elBecerisi", 3, "problemCozme", 2, "teknoloji", 1) },
        { id: "yemek", ad: "Yemek yapmak", p: p("elBecerisi", 2, "yaraticilik", 2, "detayOdaklilik", 1) },
        { id: "organizasyon", ad: "Organizasyon yapmak", p: p("organizasyon", 3, "planlama", 2) },
        { id: "plan", ad: "Plan hazırlamak", p: p("planlama", 3, "organizasyon", 2) },
        { id: "yonlendirme", ad: "Bir grubu yönlendirmek", p: p("liderlik", 3, "sosyalEtkilesim", 1) },
        { id: "yardim", ad: "İnsanlara yardımcı olmak", p: p("empati", 3, "aktifDinleme", 1) },
        { id: "cocuk", ad: "Çocuklarla ilgilenmek", p: p("empati", 3, "ogretme", 2, "sosyalEtkilesim", 1) },
        { id: "hayvan", ad: "Hayvanlarla ilgilenmek", p: p("canliBilimleri", 3, "dogaIlgisi", 2) },
        { id: "doga", ad: "Doğada olmak", p: p("dogaIlgisi", 3) },
        { id: "spor", ad: "Spor yapmak", p: p("bedenselBeceri", 3) },
        { id: "muzik", ad: "Müzikle uğraşmak", p: p("muzikRitim", 3, "yaraticilik", 1) },
        { id: "sahne", ad: "Sahne/sunum yapmak", p: p("sozelIfade", 3, "sosyalEtkilesim", 2, "yaraticilik", 1) },
        { id: "dil", ad: "Yeni diller öğrenmek", p: p("dilYatkinligi", 3, "sozelIfade", 1) },
        { id: "kesif", ad: "Yeni yerler keşfetmek", p: p("dogaIlgisi", 2, "sosyalEtkilesim", 1) },
        { id: "satis", ad: "Satış/ikna", p: p("ikna", 3, "sosyalEtkilesim", 2) },
        { id: "proje", ad: "Proje üretmek", p: p("planlama", 2, "organizasyon", 2, "yaraticilik", 2) },
      ],
    },

    {
      id: "yeteneklerim",
      baslik: "Bana Doğal Gelen Yetenekler",
      tip: "duzey",
      eksen: "ilgi",
      soru: "Bunlardan hangileri sana diğer insanlara göre daha doğal geliyor?",
      yardim: "Seçtiğin her yetenek için sana ne kadar uyduğunu da işaretle.",
      kivilcim: "Çok çalışarak öğrendiğin şeylerden ziyade, sana doğal veya kolay geldiğini düşündüğün şeyleri seç.",
      enAz: 3,
      duzeyler: [
        { id: 1, ad: "Bana biraz uygun", carpan: 0.6 },
        { id: 2, ad: "Bana uygun", carpan: 1 },
        { id: 3, ad: "Bana çok uygun", carpan: 1.5 },
      ],
      serbest: "Listede olmayan bir yeteneğin var mı?",
      secenekler: [
        { id: "dilOgrenme", ad: "Dil öğrenmek", p: p("dilYatkinligi", 3) },
        { id: "kelime", ad: "Kelimeleri doğru kullanmak", p: p("yaziliIfade", 2, "dilYatkinligi", 2) },
        { id: "sozluIfade", ad: "Kendimi sözlü ifade etmek", p: p("sozelIfade", 3) },
        { id: "yaziliIfade", ad: "Kendimi yazılı ifade etmek", p: p("yaziliIfade", 3) },
        { id: "anlatma", ad: "İnsanlara bir konuyu anlatmak", p: p("ogretme", 3, "sozelIfade", 2) },
        { id: "dinleme", ad: "İnsanları dinlemek", p: p("aktifDinleme", 3) },
        { id: "duyguFark", ad: "İnsanların duygu ve davranışlarını fark etmek", p: p("empati", 3, "aktifDinleme", 1) },
        { id: "sayiDusunme", ad: "Sayılarla düşünmek", p: p("sayisalDusunme", 3) },
        { id: "mantik", ad: "Mantık yürütmek", p: p("mantiksalDusunme", 3) },
        { id: "problem", ad: "Problem çözmek", p: p("problemCozme", 3) },
        { id: "oruntu", ad: "Örüntü fark etmek", p: p("analitikDusunme", 2, "mantiksalDusunme", 2) },
        { id: "arastirma", ad: "Araştırmak", p: p("arastirma", 3) },
        { id: "karsilastirma", ad: "Bilgileri karşılaştırmak", p: p("analitikDusunme", 3) },
        { id: "detay", ad: "Detay fark etmek", p: p("detayOdaklilik", 3) },
        { id: "buyukResim", ad: "Büyük resmi görmek", p: p("analitikDusunme", 2, "planlama", 2) },
        { id: "gorsel", ad: "Görsel düşünmek", p: p("gorselDusunme", 3) },
        { id: "mekansal", ad: "Mekânsal düşünmek", p: p("mekansalDusunme", 3) },
        { id: "cizim", ad: "Çizmek", p: p("gorselDusunme", 2, "elBecerisi", 2) },
        { id: "tasarim", ad: "Tasarlamak", p: p("tasarim", 3, "yaraticilik", 1) },
        { id: "elBeceri", ad: "El becerileri", p: p("elBecerisi", 3) },
        { id: "koordinasyon", ad: "Bedensel koordinasyon", p: p("bedenselBeceri", 3) },
        { id: "ritim", ad: "Ritim/müzik", p: p("muzikRitim", 3) },
        { id: "organize", ad: "Organize etmek", p: p("organizasyon", 3) },
        { id: "planlama", ad: "Planlamak", p: p("planlama", 3) },
        { id: "ikna", ad: "İnsanları ikna etmek", p: p("ikna", 3) },
        { id: "liderlik", ad: "Liderlik/inisiyatif almak", p: p("liderlik", 3) },
        { id: "kriz", ad: "Kriz anında çözüm üretmek", p: p("krizCozme", 3) },
        { id: "fikir", ad: "Yaratıcı fikir üretmek", p: p("yaraticilik", 3) },
        { id: "ezber", ad: "Ezberlemek", p: p("detayOdaklilik", 2) },
        { id: "hatirlama", ad: "Hatırlamak", p: p("detayOdaklilik", 2) },
        { id: "gozlem", ad: "Gözlem yapmak", p: p("detayOdaklilik", 2, "arastirma", 2) },
        { id: "coklu", ad: "Birden fazla işi koordine etmek", p: p("organizasyon", 3, "planlama", 1) },
      ],
    },

    {
      id: "iyiAlanlar",
      baslik: "Şu Anda İyi Olduğum Alanlar",
      tip: "ders",
      eksen: "akademik",
      soru: "Bugünkü seviyeni nasıl değerlendirirsin?",
      yardim: "Buradaki cevaplar kariyer uyumunu etkilemez; yalnız mevcut akademik hazırlığını gösterir.",
      kivilcim: "Bugünkü seviyeni düşün. Buradaki cevapların gelecekte ne yapabileceğine sınır koymaz.",
      enAz: 5,
      duzeyler: [
        { id: 1, ad: "Zorlanıyorum", puan: 25 },
        { id: 2, ad: "Orta", puan: 50 },
        { id: 3, ad: "İyiyim", puan: 75 },
        { id: 4, ad: "Çok iyiyim", puan: 100 },
      ],
      secenekler: Object.keys(DERSLER).map(function (k) { return { id: k, ad: DERSLER[k] }; }),
    },

    {
      id: "farkEdilen",
      baslik: "Başkalarının Bende Fark Ettiği Özellikler",
      tip: "coklu",
      eksen: "ilgi",
      soru: "İnsanlardan kendim hakkında sık sık şunları duyarım…",
      yardim: "Sık duyduğun yorumları işaretle.",
      kivilcim: "Bazen başkaları bizde bizim fark etmediğimiz güçlü yönleri görebilir. Sık duyduğun yorumları düşün.",
      enAz: 2,
      serbest: "Bunun dışında insanlardan sık duyduğun bir özellik var mı?",
      secenekler: [
        { id: "dinliyorsun", ad: "İyi dinliyorsun.", p: p("aktifDinleme", 3) },
        { id: "ifade", ad: "Kendini güzel ifade ediyorsun.", p: p("sozelIfade", 3) },
        { id: "anlatiyorsun", ad: "İyi anlatıyorsun.", p: p("sozelIfade", 2, "ogretme", 2) },
        { id: "ogretiyorsun", ad: "İyi öğretiyorsun.", p: p("ogretme", 3) },
        { id: "iletisim", ad: "İnsanlarla kolay iletişim kuruyorsun.", p: p("sosyalEtkilesim", 3) },
        { id: "anliyorsun", ad: "İnsanları iyi anlıyorsun.", p: p("empati", 3) },
        { id: "pratik", ad: "Çok pratiksin.", p: p("krizCozme", 2, "problemCozme", 2) },
        { id: "cozum", ad: "Sorun çıktığında çözüm buluyorsun.", p: p("krizCozme", 3, "problemCozme", 2) },
        { id: "mantikli", ad: "Mantıklı düşünüyorsun.", p: p("mantiksalDusunme", 3) },
        { id: "detay", ad: "Detayları hemen fark ediyorsun.", p: p("detayOdaklilik", 3) },
        { id: "yaratici", ad: "Yaratıcısın.", p: p("yaraticilik", 3) },
        { id: "yaziyorsun", ad: "Güzel yazıyorsun.", p: p("yaziliIfade", 3) },
        { id: "cizim", ad: "Çizimin/tasarımın iyi.", p: p("gorselDusunme", 2, "tasarim", 2) },
        { id: "elBeceri", ad: "El becerilerin iyi.", p: p("elBecerisi", 3) },
        { id: "sayilar", ad: "Sayılarla aran iyi.", p: p("sayisalDusunme", 3) },
        { id: "dil", ad: "Dil konusunda yeteneklisin.", p: p("dilYatkinligi", 3) },
        { id: "organize", ad: "İyi organize ediyorsun.", p: p("organizasyon", 3) },
        { id: "sorumluluk", ad: "Sorumluluk sahibisin.", p: p("planlama", 2, "detayOdaklilik", 1) },
        { id: "motive", ad: "İnsanları motive ediyorsun.", p: p("liderlik", 2, "sosyalEtkilesim", 2) },
        { id: "ikna", ad: "İkna kabiliyetin yüksek.", p: p("ikna", 3) },
        { id: "lider", ad: "Liderlik ediyorsun.", p: p("liderlik", 3) },
        { id: "sabir", ad: "Sabırlısın.", p: p("detayOdaklilik", 2, "empati", 1) },
        { id: "soguk", ad: "Soğukkanlısın.", p: p("krizCozme", 3) },
        { id: "gozlem", ad: "Gözlem gücün yüksek.", p: p("detayOdaklilik", 2, "arastirma", 2) },
      ],
    },

    {
      id: "calismaHayati",
      baslik: "Çalışma Hayatım Nasıl Olsun?",
      tip: "kaydirac",
      eksen: "calisma",
      soru: "Her satırda kendini nerede görüyorsun?",
      yardim: "Ortayı da seçebilirsin; ikisi de sana uyuyorsa ortada bırak.",
      kivilcim: "Bir mesleğin adı kadar, o mesleği her gün hangi koşullarda yaptığın da önemlidir.",
      enAz: 6,
      secenekler: [
        { id: "hareketlilik", sol: "Masa başı", sag: "Hareketli" },
        { id: "yerCesitliligi", sol: "Tek bir iş yeri", sag: "Farklı yerlerde çalışma" },
        { id: "insanEtkilesimi", sol: "Bireysel çalışma", sag: "İnsanlarla yoğun iletişim" },
        { id: "gorevDegiskenligi", sol: "Sabit görevler", sag: "Her gün değişen görevler" },
        { id: "saatEsnekligi", sol: "Düzenli çalışma saatleri", sag: "Esnek çalışma saatleri" },
        { id: "ortamCanliligi", sol: "Sessiz ortam", sag: "Hareketli/sosyal ortam" },
        { id: "uygulamalilik", sol: "Teorik çalışma", sag: "Uygulamalı çalışma" },
        { id: "yontemOzgurlugu", sol: "Belirli kurallar", sag: "Kendi yöntemimi oluşturma" },
        { id: "riskAcikligi", sol: "Güvenli/öngörülebilir", sag: "Riskli ama fırsatı yüksek" },
        { id: "seyahat", sol: "Yerleşik çalışma", sag: "Seyahat içeren çalışma" },
        { id: "girisimcilik", sol: "Çalışan olarak çalışma", sag: "Girişimci/kendi işimi kurma" },
        { id: "ekipYonetimi", sol: "Daha az insan sorumluluğu", sag: "Ekip yönetme" },
      ],
    },

    {
      id: "yasamBeklentileri",
      baslik: "Gelecekte Nasıl Bir Yaşam İstiyorum?",
      tip: "onem",
      eksen: "deger",
      soru: "Her madde senin için ne kadar önemli?",
      yardim: "1 = hiç önemli değil · 5 = çok önemli",
      kivilcim: "Meslek yalnızca iş saatlerinden ibaret değildir. Nasıl bir hayat kurmak istediğini de düşün.",
      enAz: 8,
      secenekler: [
        { id: "aileZaman", ad: "Aileme ve özel hayatıma zaman ayırabilmek", p: p("ozelHayat", 3) },
        { id: "duzenliSaat", ad: "Düzenli çalışma saatleri", p: p("duzen", 3, "ozelHayat", 1) },
        { id: "sehir", ad: "Belirli bir şehirde yaşayabilmek", p: p("duzen", 2, "isGuvencesi", 1) },
        { id: "yurtdisi", ad: "Yurt dışında çalışma ihtimali", p: p("kariyerYukselme", 2, "surekliOgrenme", 1) },
        { id: "seyahat", ad: "Seyahat edebilmek", p: p("bagimsizlik", 1, "kariyerYukselme", 1) },
        { id: "esnek", ad: "Esnek çalışma", p: p("bagimsizlik", 3, "ozelHayat", 1) },
        { id: "guvence", ad: "İş güvencesi", p: p("isGuvencesi", 3) },
        { id: "prestij", ad: "Prestij", p: p("prestij", 3) },
        { id: "fayda", ad: "Topluma fayda sağlamak", p: p("toplumsalFayda", 3) },
        { id: "bagimsiz", ad: "Bağımsız olabilmek", p: p("bagimsizlik", 3) },
        { id: "ogrenme", ad: "Sürekli öğrenmek", p: p("surekliOgrenme", 3) },
        { id: "yukselme", ad: "Kariyerde yükselmek", p: p("kariyerYukselme", 3) },
        { id: "rahat", ad: "Rahat ve öngörülebilir hayat", p: p("duzen", 3, "ozelHayat", 1) },
        { id: "hareketli", ad: "Hareketli ve değişken hayat", p: p("bagimsizlik", 2, "surekliOgrenme", 1) },
        { id: "sosyalCevre", ad: "Sosyal çevresi geniş bir çalışma hayatı", p: p("prestij", 1, "toplumsalFayda", 1) },
        { id: "kendimeZaman", ad: "Kendime zaman ayırabilmek", p: p("ozelHayat", 3) },
      ],
    },

    {
      id: "maddiBeklentiler",
      baslik: "Mesleğimden Maddi Beklentilerim",
      tip: "onem",
      eksen: "deger",
      soru: "Her madde senin için ne kadar doğru?",
      yardim: "1 = hiç · 5 = tamamen",
      kivilcim: "Para tek ölçüt değildir ama gerçek hayatın bir parçasıdır. Senin için ne kadar önemli olduğunu dürüstçe değerlendir.",
      enAz: 4,
      secenekler: [
        { id: "yuksekKazanc", ad: "Yüksek kazanç potansiyeli benim için önemlidir.", p: p("yuksekGelir", 3) },
        { id: "duzenliGelir", ad: "Düzenli gelir benim için önemlidir.", p: p("isGuvencesi", 2, "duzen", 2) },
        { id: "guvence", ad: "İş güvencesi benim için önemlidir.", p: p("isGuvencesi", 3) },
        { id: "gelirArtisi", ad: "Kariyer ilerledikçe gelirimin ciddi biçimde artmasını isterim.", p: p("kariyerYukselme", 3, "yuksekGelir", 1) },
        { id: "kendiIsim", ad: "Kendi işimi kurarak gelirimi artırabilmek isterim.", p: p("bagimsizlik", 3, "yuksekGelir", 1) },
        { id: "risk", ad: "Yüksek gelir ihtimali için belirli ölçüde risk alabilirim.", p: p("yuksekGelir", 2, "bagimsizlik", 1) },
        { id: "dusukBaslangic", ad: "Başlangıçta düşük gelirle başlayıp zamanla yükselmeyi kabul edebilirim.", p: p("kariyerYukselme", 2, "surekliOgrenme", 1) },
      ],
    },

    {
      id: "meslekiDegerler",
      baslik: "Bir Meslekte Benim İçin Ne Önemli?",
      tip: "onem",
      eksen: "deger",
      soru: "Her madde senin için ne kadar önemli?",
      yardim: "1 = hiç önemli değil · 5 = çok önemli",
      kivilcim: "İki meslek sana aynı derecede uygun görünebilir. Seni mutlu edecek şeyi bazen değerlerin belirler.",
      enAz: 8,
      secenekler: [
        { id: "yardim", ad: "İnsanlara yardımcı olmak", p: p("insanlaraYardim", 3) },
        { id: "bilgiUretme", ad: "Bilgi üretmek", p: p("bilgiUretme", 3) },
        { id: "ogretme", ad: "Bir şey öğretmek", p: p("insanlaraYardim", 2, "bilgiUretme", 1) },
        { id: "problem", ad: "Problem çözmek", p: p("somutUretim", 2, "bilgiUretme", 1) },
        { id: "uretmek", ad: "Üretmek", p: p("somutUretim", 3) },
        { id: "yaratici", ad: "Yaratıcı olmak", p: p("yaraticiOzgurluk", 3) },
        { id: "ozgur", ad: "Özgür olmak", p: p("bagimsizlik", 3) },
        { id: "guvende", ad: "Güvende olmak", p: p("isGuvencesi", 3) },
        { id: "gelir", ad: "Yüksek gelir", p: p("yuksekGelir", 3) },
        { id: "prestij", ad: "Prestij", p: p("prestij", 3) },
        { id: "fayda", ad: "Toplumsal fayda", p: p("toplumsalFayda", 3) },
        { id: "insanlarla", ad: "İnsanlarla çalışmak", p: p("insanlaraYardim", 2) },
        { id: "yonetmek", ad: "Yönetmek", p: p("kariyerYukselme", 2, "prestij", 1) },
        { id: "ogrenme", ad: "Sürekli öğrenmek", p: p("surekliOgrenme", 3) },
        { id: "rekabet", ad: "Rekabet", p: p("kariyerYukselme", 2, "yuksekGelir", 1) },
        { id: "bagimsizlik", ad: "Bağımsızlık", p: p("bagimsizlik", 3) },
        { id: "yenilik", ad: "Yenilik", p: p("yaraticiOzgurluk", 2, "surekliOgrenme", 2) },
        { id: "duzen", ad: "Düzen", p: p("duzen", 3) },
        { id: "somut", ad: "Somut sonuç görmek", p: p("somutUretim", 3) },
      ],
    },

    {
      id: "emek",
      baslik: "Hedefim İçin Neleri Göze Alabilirim?",
      tip: "onem",
      eksen: "yol",
      soru: "Her madde senin için ne kadar mümkün?",
      yardim: "1 = benim için çok zor · 5 = kesinlikle yapabilirim",
      kivilcim: "Bir mesleği istemekle, o mesleğe giden yolu istemek bazen farklı şeylerdir.",
      enAz: 6,
      secenekler: [
        { id: "uzunEgitim", ad: "Uzun bir üniversite eğitimi alabilirim.", p: p("uzunEgitim", 3) },
        { id: "sonrasi", ad: "Üniversiteden sonra da eğitim almaya devam edebilirim.", p: p("egitimSonrasiEgitim", 3) },
        { id: "sinav", ad: "Zor sınav süreçlerine hazırlanabilirim.", p: p("zorSinav", 3) },
        { id: "dersTempo", ad: "Yoğun ders çalışma temposuna uyabilirim.", p: p("zorSinav", 2, "yogunTempo", 1) },
        { id: "calismaSaati", ad: "Yoğun çalışma saatlerini kabul edebilirim.", p: p("yogunTempo", 3) },
        { id: "rekabet", ad: "Rekabetçi bir ortamda çalışabilirim.", p: p("rekabetOrtami", 3) },
        { id: "sehir", ad: "Gerektiğinde başka şehre taşınabilirim.", p: p("sehirDegisimi", 3) },
        { id: "yurtdisi", ad: "Gerektiğinde yurt dışında yaşayabilirim.", p: p("yurtdisi", 3) },
        { id: "dusukGelir", ad: "Başlangıçta daha düşük gelirle çalışabilirim.", p: p("dusukBaslangic", 3) },
        { id: "gelisim", ad: "Sürekli kendimi geliştirmem gereken bir meslek bana uygundur.", p: p("egitimSonrasiEgitim", 2, "yogunTempo", 1) },
        { id: "belirsizlik", ad: "Belirsizliğin belirli ölçüde olduğu kariyer yollarını değerlendirebilirim.", p: p("belirsizlik", 3) },
      ],
    },

    {
      id: "istemediklerim",
      baslik: "Çalışma Hayatımda İstemediğim Şeyler",
      tip: "engel",
      eksen: "kosul",
      soru: "Bunlardan hangileri senin için sorun olur?",
      yardim: "Sorun olmayanları boş bırak.",
      kivilcim: "Ne istemediğini bilmek de en az ne istediğini bilmek kadar değerlidir.",
      enAz: 0,
      duzeyler: [
        { id: "esnek", ad: "Tercih etmem ama gerektiğinde olabilir" },
        { id: "kesin", ad: "Benim için kesin engel" },
      ],
      secenekler: Object.keys(KOSULLAR).map(function (k) { return { id: k, ad: KOSULLAR[k] }; }),
    },
  ];

  /* ── 5. PUANLAMA AYARLARI ──────────────────────────────────────
     Tüm ağırlıklar burada; motorda sabit sayı yoktur. */
  var PUANLAMA = {
    // Dört eksenin genel uyuma katkısı (toplamı 1 olmalı)
    eksenAgirlik: { ilgi: 0.40, calisma: 0.25, deger: 0.20, yol: 0.15 },

    // İlgi profili ölçeklenirken bölünen değer: en yüksek KAÇ ham puanın
    // ortalaması 100 kabul edilecek. 1 yazılırsa yalnız tepe boyut 100 olur
    // ve profil aşırı sivrilir; 3 daha okunur bir dağılım verir.
    ilgiOlcekTepe: 3,

    // Kaydıraç konumu (1–5) → 0–100
    kaydiracPuan: { 1: 0, 2: 25, 3: 50, 4: 75, 5: 100 },
    kaydiracVarsayilan: 3,

    // Önem ölçeği (1–5) → 0–100
    onemPuan: { 1: 0, 2: 25, 3: 50, 4: 75, 5: 100 },

    // "Kesin engel" işaretlenen koşul aileyle çakışırsa uygulanan ceza.
    // Eleme değildir; sıralamayı hafifçe etkiler, uyarı her hâlükârda çıkar.
    kesinEngelCezasi: 6,
    kesinEngelCezaTavani: 12,
    esnekEngelCezasi: 0,          // "tercih etmem" puanı düşürmez, yalnız uyarır

    // Bir aile bir değeri hiç bildirmemişse o değeri ortalama düzeyde
    // sunuyor kabul ederiz. Bunsuz, bildirmeyen aileler cezadan kaçar ve
    // dürüstçe düşük değer yazan aileler haksız yere geri düşerdi.
    degerVarsayilan: 45,

    // Cevaplanmamış eksen için yansız değer
    yansizPuan: 50,

    // Uyum seviyeleri (alt sınır dahil, büyükten küçüğe okunur)
    seviyeler: [
      { alt: 78, ad: "Çok güçlü eşleşme", sinif: "cok-guclu" },
      { alt: 66, ad: "Güçlü eşleşme", sinif: "guclu" },
      { alt: 54, ad: "Orta eşleşme", sinif: "orta" },
      { alt: 42, ad: "Keşfetmeye değer", sinif: "kesif" },
      { alt: 0, ad: "Daha düşük eşleşme", sinif: "dusuk" },
    ],

    // Sonuç ekranında ilk açılışta gösterilecek aile sayısı
    ilkGosterim: 5,

    // "Neden sana yakın?" cümlesinde kullanılacak en fazla boyut sayısı
    gerekceBoyutSayisi: 4,
    // Bir boyutun gerekçeye girmesi için öğrencinin en az bu puanı alması gerekir
    gerekceEsigi: 55,
    // Ailenin o boyuta verdiği önem en az bu olmalı
    aileOnemEsigi: 60,
  };

  /* ── 6. GEÇERLİLİK KURALLARI ───────────────────────────────────
     Analiz başlamadan önce aranan asgari cevaplar; eksikse hangi
     bölüme gidileceği ve kullanıcıya ne söyleneceği burada. */
  var GECERLILIK = BOLUMLER.filter(function (b) { return b.enAz > 0; }).map(function (b) {
    return {
      bolum: b.id,
      enAz: b.enAz,
      mesaj: b.baslik + " bölümünde en az " + b.enAz + " maddeyi değerlendirmen gerekiyor.",
    };
  });

  kok.KP_OLCEK = {
    surum: 1,
    BOYUTLAR: BOYUTLAR,
    KOSULLAR: KOSULLAR,
    DERSLER: DERSLER,
    BOLUMLER: BOLUMLER,
    PUANLAMA: PUANLAMA,
    GECERLILIK: GECERLILIK,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = kok.KP_OLCEK;
})(typeof window !== "undefined" ? window : globalThis);
