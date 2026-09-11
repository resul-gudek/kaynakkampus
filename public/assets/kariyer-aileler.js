/* ══════════════════════════════════════════════════════════════════
   KARİYER PUSULAM — PROGRAM AİLELERİ
   ──────────────────────────────────────────────────────────────────
   Eşleştirme bölüm bazında değil, PROGRAM AİLESİ bazında yapılır.
   Her ailenin dört ayrı profili vardır:

     ilgi     → alanın ağırlıklı olarak hangi ilgi/yeteneklere dayandığı
     calisma  → alanın tipik çalışma koşulu (0 = sol kutup, 100 = sağ kutup;
                kutuplar assets/kariyer-olcek.js içindeki kaydıraçlarla aynı)
     deger    → alanın öğrenciye tipik olarak sunabildiği değerler
     yol      → alana giden yolun talep ettiği emek

   cekirdek → ailenin ÇEKİRDEK KRİTERLERİ: onu komşu ailelerden
              gerçekten ayıran, üniversitedeki eğitim yapısı ya da
              mesleğin günlük işleyişiyle doğrudan ilişkili özellikler.
              Ana eşleşmeden SONRA çalışan ikinci kontrol katmanı
              bunları kullanır (motorda bölüm 3b).

              Yazım kuralları — hepsini
              `node ops/kariyer-veri/cekirdek-denetle.js` ölçer;
              yeni aile eklerken ya da çekirdek değiştirirken çalıştır:
              · Genel özellik yazılmaz. Sözel beceri, iletişim,
                hitabet, insanlara yardım etme gibi onlarca alanla
                uyuşan nitelikler çekirdeğe girmez; onlar ana
                eşleşmede zaten karşılığını bulur. Çekirdek AYIRT
                EDİCİ olanı tutar.
              · Biçimler:
                  { ilgi: "arastirma", w: 3 }
                  { calisma: "hareketlilik" }   → hedef, ailenin kendi
                    calisma profilinden okunur; ayrıca yazılmaz
                  { yol: "egitimSonrasiEgitim" }
                  { deger: "bilgiUretme" }
                  { kosul: "yogunOkumaYazma" }  → o koşula açıklık
                w (1–4) kriterin ağırlığıdır, yazılmazsa 1'dir.
              · "kosul" kriterlerinin toplam ağırlığı çekirdeğin
                üçte birini geçmemeli: işaretlenmemiş koşul tam
                karşılama sayıldığı için aksi hâlde aile haksız
                destek toplar.
              · "calisma" kriteri ailenin kendi profilinde kutupta
                olmalı (≤35 ya da ≥65); orta değer ayırt edici değildir.

   kosullar → Bölüm 10'daki "istemediğim koşullar" etiketlerinden
              bu alanda gerçekten sık karşılaşılanlar. Eleme için değil,
              öğrenciye açık uyarı göstermek için kullanılır.
   dersler  → yalnız "mevcut akademik hazırlık" göstergesi içindir;
              kariyer uyum puanına KATILMAZ.

   alan     → üst aile. YALNIZ gruplama ve sunum katmanıdır; hiçbir
              puana girmez. Aynı üst ailedeki aileler birbirinin
              kopyası gibi puanlanmaz: her biri kendi ilgi/çalışma/
              değer/yol profili ve kendi çekirdek kriterleriyle ayrı
              ayrı ölçülür. Üst ailenin yüksek eşleşmesi, içindeki
              her ailenin yüksek eşleştiği anlamına gelmez.

   Değerler tek tek okunabilir olsun diye elle yazılmıştır; profil
   güncellemek için yalnız bu dosyayı değiştirmek yeterlidir.
   Programların hangi aileye bağlı olduğu ayrı dosyadadır:
   assets/kariyer-programlar.js (resmî kaynaktan üretilir).
   ══════════════════════════════════════════════════════════════════ */
(function (kok) {
  "use strict";

  var AILELER = [
    /* ───────────────────────── DİL, İLETİŞİM VE KÜLTÜR ───────── */
    {
      id: "dil-edebiyat-ceviri", ad: "Dil, Edebiyat ve Çeviri", alan: "Dil, İletişim ve Kültür",
      ozet: "Dilleri, metinleri ve kültürleri derinlemesine inceleyen; çeviri, editörlük, yayıncılık ve araştırma yollarına açılan alan.",
      ilgi: { dilYatkinligi: 100, sozelIfade: 85, yaziliIfade: 90, arastirma: 75, detayOdaklilik: 70, yaraticilik: 60, analitikDusunme: 55 },
      calisma: { hareketlilik: 25, insanEtkilesimi: 45, gorevDegiskenligi: 45, uygulamalilik: 35, saatEsnekligi: 60, seyahat: 40 },
      deger: { surekliOgrenme: 85, bilgiUretme: 75, yaraticiOzgurluk: 65, ozelHayat: 65, bagimsizlik: 60, isGuvencesi: 45, yuksekGelir: 35 },
      yol: { uzunEgitim: 55, egitimSonrasiEgitim: 60, yogunTempo: 45, dusukBaslangic: 60, belirsizlik: 55, yurtdisi: 45 },
      cekirdek: [
        { ilgi: "dilYatkinligi", w: 3 }, { ilgi: "yaziliIfade", w: 2 },
        { kosul: "yogunOkumaYazma", w: 2 }, { calisma: "hareketlilik" },
      ],
      kosullar: ["yogunOkumaYazma", "surekliMasa"],
      dersler: ["yabanciDil", "edebiyat", "turkce", "yaziYazma", "arastirma"],
    },
    {
      id: "iletisim-medya", ad: "İletişim, Medya ve Yayıncılık", alan: "Dil, İletişim ve Kültür",
      ozet: "Haber, program, film ve dijital içerik üretimi; olayları izleyip anlaşılır biçimde aktarma üzerine kurulu alan.",
      ilgi: { sozelIfade: 85, yaziliIfade: 85, yaraticilik: 80, sosyalEtkilesim: 75, arastirma: 70, gorselDusunme: 65, krizCozme: 60, organizasyon: 55 },
      calisma: { hareketlilik: 70, yerCesitliligi: 70, insanEtkilesimi: 80, gorevDegiskenligi: 80, saatEsnekligi: 75, ortamCanliligi: 75, uygulamalilik: 75, seyahat: 65 },
      deger: { yaraticiOzgurluk: 80, surekliOgrenme: 70, toplumsalFayda: 65, kariyerYukselme: 55, ozelHayat: 35, isGuvencesi: 35 },
      yol: { yogunTempo: 80, rekabetOrtami: 75, dusukBaslangic: 75, belirsizlik: 75, sehirDegisimi: 60 },
      cekirdek: [
        { ilgi: "yaraticilik", w: 2 }, { ilgi: "arastirma" },
        { calisma: "gorevDegiskenligi", w: 2 }, { yol: "yogunTempo", w: 2 },
        { kosul: "belirsizGelir" },
      ],
      kosullar: ["yuksekStres", "surekliDegisen", "belirsizGelir", "geceNobet", "cokRekabetci"],
      dersler: ["turkce", "yaziYazma", "sunum", "arastirma", "gorselSanatlar"],
    },
    {
      id: "reklam-halkla-iliskiler", ad: "Reklam, Halkla İlişkiler ve Pazarlama", alan: "Dil, İletişim ve Kültür",
      ozet: "Marka, kampanya ve iletişim stratejileri; insanları ikna etme ve bir mesajı doğru kitleye ulaştırma üzerine kurulu alan.",
      ilgi: { ikna: 90, sosyalEtkilesim: 85, yaraticilik: 80, sozelIfade: 80, organizasyon: 70, analitikDusunme: 60, yaziliIfade: 60, planlama: 60 },
      calisma: { hareketlilik: 60, insanEtkilesimi: 90, gorevDegiskenligi: 75, ortamCanliligi: 80, uygulamalilik: 75, girisimcilik: 65, ekipYonetimi: 65, riskAcikligi: 60 },
      deger: { kariyerYukselme: 75, yaraticiOzgurluk: 70, yuksekGelir: 60, bagimsizlik: 55, surekliOgrenme: 60, isGuvencesi: 35 },
      yol: { yogunTempo: 75, rekabetOrtami: 80, dusukBaslangic: 65, belirsizlik: 60 },
      cekirdek: [
        { ilgi: "ikna", w: 3 }, { ilgi: "yaraticilik", w: 2 },
        { kosul: "surekliSatis", w: 2 }, { calisma: "insanEtkilesimi" },
        { yol: "rekabetOrtami" },
      ],
      kosullar: ["surekliSatis", "yogunInsan", "musteriIliskisi", "cokRekabetci", "yuksekStres"],
      dersler: ["turkce", "sunum", "gorselSanatlar", "grupCalismasi", "yaziYazma"],
    },
    {
      id: "kultur-miras", ad: "Kültür Mirası, Arkeoloji ve Müzecilik", alan: "Dil, İletişim ve Kültür",
      ozet: "Geçmişin izlerini bulma, belgeleme ve koruma; kazı alanından müze ve arşive uzanan alan.",
      ilgi: { arastirma: 95, detayOdaklilik: 90, analitikDusunme: 75, elBecerisi: 65, gorselDusunme: 60, dogaIlgisi: 55, yaziliIfade: 60, mekansalDusunme: 55 },
      calisma: { hareketlilik: 55, yerCesitliligi: 60, insanEtkilesimi: 35, gorevDegiskenligi: 40, uygulamalilik: 70, seyahat: 60 },
      deger: { bilgiUretme: 90, toplumsalFayda: 70, surekliOgrenme: 80, duzen: 60, ozelHayat: 55, yuksekGelir: 25, isGuvencesi: 45 },
      yol: { uzunEgitim: 60, egitimSonrasiEgitim: 70, dusukBaslangic: 80, belirsizlik: 70, sehirDegisimi: 65 },
      cekirdek: [
        { ilgi: "arastirma", w: 3 }, { ilgi: "detayOdaklilik", w: 2 },
        { ilgi: "elBecerisi" }, { calisma: "insanEtkilesimi" },
        { yol: "dusukBaslangic" },
      ],
      kosullar: ["belirsizGelir", "fizikselYorucu", "cokRutin"],
      dersler: ["tarih", "cografya", "arastirma", "yabanciDil", "elBecerileri"],
    },

    /* ───────────────────────── EĞİTİM VE İNSAN GELİŞİMİ ──────── */
    {
      id: "egitim-ogretmenlik", ad: "Eğitim ve Öğretmenlik", alan: "Eğitim ve İnsan Gelişimi",
      ozet: "Bir konuyu bilmekten çok, onu başkasına öğretebilmek üzerine kurulu; her branşta karşılığı olan alan.",
      ilgi: { ogretme: 100, sozelIfade: 85, empati: 80, sosyalEtkilesim: 75, planlama: 70, organizasyon: 65, aktifDinleme: 70, yaraticilik: 60 },
      calisma: { hareketlilik: 55, yerCesitliligi: 25, insanEtkilesimi: 90, gorevDegiskenligi: 45, saatEsnekligi: 25, ortamCanliligi: 75, uygulamalilik: 70, yontemOzgurlugu: 55 },
      deger: { insanlaraYardim: 90, toplumsalFayda: 90, isGuvencesi: 80, ozelHayat: 70, duzen: 75, surekliOgrenme: 65, yuksekGelir: 30 },
      yol: { uzunEgitim: 50, zorSinav: 70, egitimSonrasiEgitim: 55, yogunTempo: 55, sehirDegisimi: 75 },
      cekirdek: [
        { ilgi: "ogretme", w: 3 }, { calisma: "insanEtkilesimi", w: 2 },
        { kosul: "cocuklarla", w: 2 }, { yol: "zorSinav" },
        { yol: "sehirDegisimi" },
      ],
      kosullar: ["cocuklarla", "yogunInsan", "surekliAyakta"],
      dersler: ["turkce", "sunum", "grupCalismasi", "proje", "arastirma"],
    },
    {
      id: "cocuk-aile", ad: "Çocuk ve Aile Hizmetleri", alan: "Eğitim ve İnsan Gelişimi",
      ozet: "Çocuğun gelişimini izleme, destekleme ve aileyle birlikte çalışma üzerine kurulu alan.",
      ilgi: { empati: 95, ogretme: 80, aktifDinleme: 85, sosyalEtkilesim: 70, detayOdaklilik: 65, yaraticilik: 60, organizasyon: 55, canliBilimleri: 50 },
      calisma: { hareketlilik: 65, insanEtkilesimi: 90, gorevDegiskenligi: 55, saatEsnekligi: 35, ortamCanliligi: 80, uygulamalilik: 80 },
      deger: { insanlaraYardim: 95, toplumsalFayda: 85, isGuvencesi: 60, duzen: 60, ozelHayat: 60, yuksekGelir: 25 },
      yol: { uzunEgitim: 35, yogunTempo: 50, dusukBaslangic: 70 },
      cekirdek: [
        { ilgi: "empati", w: 2 }, { ilgi: "ogretme" },
        { ilgi: "aktifDinleme" }, { kosul: "cocuklarla", w: 2 },
        { calisma: "uygulamalilik" },
      ],
      kosullar: ["cocuklarla", "yogunInsan", "surekliAyakta", "belirsizGelir"],
      dersler: ["turkce", "biyoloji", "grupCalismasi", "sunum", "gorselSanatlar"],
    },
    {
      id: "psikoloji-davranis", ad: "İnsan ve Davranış Bilimleri", alan: "Eğitim ve İnsan Gelişimi",
      ozet: "İnsanın nasıl düşündüğünü, hissettiğini ve davrandığını araştıran; danışmanlık ve araştırma yollarına açılan alan.",
      ilgi: { aktifDinleme: 100, empati: 95, arastirma: 80, analitikDusunme: 80, sozelIfade: 70, detayOdaklilik: 70, sayisalDusunme: 55, yaziliIfade: 60 },
      calisma: { hareketlilik: 30, insanEtkilesimi: 80, gorevDegiskenligi: 50, saatEsnekligi: 55, ortamCanliligi: 35, uygulamalilik: 55, girisimcilik: 55 },
      deger: { insanlaraYardim: 95, bilgiUretme: 80, toplumsalFayda: 80, surekliOgrenme: 85, bagimsizlik: 60, prestij: 55, isGuvencesi: 45 },
      yol: { uzunEgitim: 70, egitimSonrasiEgitim: 90, zorSinav: 75, yogunTempo: 60, rekabetOrtami: 65, dusukBaslangic: 70 },
      cekirdek: [
        { ilgi: "aktifDinleme", w: 2 }, { ilgi: "arastirma", w: 2 },
        { ilgi: "analitikDusunme", w: 2 }, { yol: "egitimSonrasiEgitim", w: 2 },
        { calisma: "hareketlilik" }, { kosul: "cokUzunEgitim" },
      ],
      kosullar: ["yogunInsan", "yuksekStres", "cokUzunEgitim", "surekliMasa"],
      dersler: ["biyoloji", "matematik", "turkce", "felsefe", "arastirma"],
    },
    {
      id: "sosyal-hizmet", ad: "Sosyal Hizmet ve İnsan Desteği", alan: "Eğitim ve İnsan Gelişimi",
      ozet: "Dezavantajlı durumdaki birey ve ailelerle doğrudan çalışan; hak, destek ve kaynakları buluşturan alan.",
      ilgi: { empati: 100, aktifDinleme: 90, sosyalEtkilesim: 80, organizasyon: 70, krizCozme: 75, sozelIfade: 70, planlama: 60, yaziliIfade: 55 },
      calisma: { hareketlilik: 70, yerCesitliligi: 70, insanEtkilesimi: 95, gorevDegiskenligi: 70, saatEsnekligi: 40, uygulamalilik: 85, seyahat: 55 },
      deger: { insanlaraYardim: 100, toplumsalFayda: 95, isGuvencesi: 70, duzen: 50, ozelHayat: 45, yuksekGelir: 25 },
      yol: { uzunEgitim: 45, yogunTempo: 70, sehirDegisimi: 75, dusukBaslangic: 65 },
      cekirdek: [
        { ilgi: "empati", w: 2 }, { ilgi: "krizCozme", w: 2 },
        { calisma: "uygulamalilik", w: 2 }, { kosul: "yogunInsan", w: 2 },
        { yol: "sehirDegisimi" },
      ],
      kosullar: ["yogunInsan", "yuksekStres", "hastalarla"],
      dersler: ["turkce", "felsefe", "grupCalismasi", "arastirma", "sunum"],
    },

    /* ───────────────────────── HUKUK, KAMU VE YÖNETİM ────────── */
    {
      id: "hukuk-adalet", ad: "Hukuk ve Adalet", alan: "Hukuk, Kamu ve Yönetim",
      ozet: "Kuralları yorumlama, savunma kurma ve uyuşmazlık çözme üzerine kurulu; metinle ve insanla aynı anda çalışılan alan.",
      ilgi: { analitikDusunme: 95, mantiksalDusunme: 90, sozelIfade: 90, yaziliIfade: 85, detayOdaklilik: 85, arastirma: 80, ikna: 80 },
      calisma: { hareketlilik: 35, insanEtkilesimi: 75, gorevDegiskenligi: 55, saatEsnekligi: 45, uygulamalilik: 55, girisimcilik: 60, riskAcikligi: 50 },
      deger: { prestij: 85, isGuvencesi: 70, yuksekGelir: 70, toplumsalFayda: 75, bagimsizlik: 70, surekliOgrenme: 75, duzen: 65 },
      yol: { uzunEgitim: 75, egitimSonrasiEgitim: 80, zorSinav: 90, yogunTempo: 85, rekabetOrtami: 85, dusukBaslangic: 70 },
      cekirdek: [
        { ilgi: "analitikDusunme", w: 2 }, { ilgi: "mantiksalDusunme", w: 2 },
        { kosul: "yogunOkumaYazma", w: 2 }, { yol: "zorSinav", w: 2 },
        { yol: "rekabetOrtami" }, { calisma: "hareketlilik" },
      ],
      kosullar: ["yogunOkumaYazma", "yuksekStres", "cokRekabetci", "surekliMasa"],
      dersler: ["turkce", "edebiyat", "tarih", "felsefe", "yaziYazma"],
    },
    {
      id: "siyaset-kamu", ad: "Siyaset, Kamu Yönetimi ve Uluslararası İlişkiler", alan: "Hukuk, Kamu ve Yönetim",
      ozet: "Devletin, kurumların ve ülkeler arası ilişkilerin nasıl işlediğini inceleyen; kamu ve diplomasi yollarına açılan alan.",
      ilgi: { analitikDusunme: 85, arastirma: 80, sozelIfade: 80, yaziliIfade: 80, organizasyon: 70, planlama: 70, dilYatkinligi: 65, ikna: 65 },
      calisma: { hareketlilik: 30, insanEtkilesimi: 70, gorevDegiskenligi: 50, saatEsnekligi: 35, uygulamalilik: 45, seyahat: 55, ekipYonetimi: 60 },
      deger: { isGuvencesi: 80, toplumsalFayda: 80, prestij: 70, duzen: 75, surekliOgrenme: 70, kariyerYukselme: 60, yuksekGelir: 45 },
      yol: { uzunEgitim: 55, zorSinav: 85, yogunTempo: 55, sehirDegisimi: 75, rekabetOrtami: 70 },
      cekirdek: [
        { ilgi: "analitikDusunme", w: 2 }, { ilgi: "arastirma", w: 2 },
        { ilgi: "yaziliIfade" }, { yol: "zorSinav", w: 2 },
        { calisma: "hareketlilik" }, { kosul: "yogunOkumaYazma" },
      ],
      kosullar: ["surekliMasa", "yogunOkumaYazma", "cokRekabetci"],
      dersler: ["tarih", "cografya", "turkce", "yabanciDil", "arastirma"],
    },
    {
      id: "isletme-yonetim", ad: "İşletme, Yönetim ve Organizasyon", alan: "Hukuk, Kamu ve Yönetim",
      ozet: "Bir kurumun kaynaklarını, insanlarını ve süreçlerini yönetme üzerine kurulu; hemen her sektörde karşılığı olan alan.",
      ilgi: { organizasyon: 90, planlama: 90, liderlik: 80, analitikDusunme: 75, sosyalEtkilesim: 70, ikna: 70, sayisalDusunme: 65, problemCozme: 65 },
      calisma: { hareketlilik: 35, insanEtkilesimi: 80, gorevDegiskenligi: 60, saatEsnekligi: 45, uygulamalilik: 60, girisimcilik: 70, ekipYonetimi: 85, riskAcikligi: 60 },
      deger: { kariyerYukselme: 85, yuksekGelir: 75, bagimsizlik: 65, duzen: 65, isGuvencesi: 55, prestij: 60, surekliOgrenme: 60 },
      yol: { uzunEgitim: 45, yogunTempo: 75, rekabetOrtami: 80, sehirDegisimi: 65, belirsizlik: 55 },
      cekirdek: [
        { ilgi: "organizasyon", w: 2 }, { ilgi: "planlama", w: 2 },
        { ilgi: "liderlik", w: 2 }, { calisma: "ekipYonetimi", w: 2 },
        { yol: "rekabetOrtami" },
      ],
      kosullar: ["surekliMasa", "buyukEkipYonetimi", "cokRekabetci", "yuksekStres"],
      dersler: ["matematik", "turkce", "sunum", "organizasyon", "grupCalismasi"],
    },
    {
      id: "ekonomi-finans", ad: "Ekonomi, Finans ve Ticaret", alan: "Hukuk, Kamu ve Yönetim",
      ozet: "Para, piyasa ve ticaretin nasıl işlediğini sayılarla okuyan; banka, finans ve dış ticaret yollarına açılan alan.",
      ilgi: { sayisalDusunme: 90, analitikDusunme: 90, mantiksalDusunme: 80, detayOdaklilik: 80, arastirma: 70, planlama: 70, ikna: 55 },
      calisma: { hareketlilik: 20, insanEtkilesimi: 60, gorevDegiskenligi: 50, saatEsnekligi: 35, uygulamalilik: 55, riskAcikligi: 60, ekipYonetimi: 55 },
      deger: { yuksekGelir: 85, kariyerYukselme: 80, duzen: 70, isGuvencesi: 60, prestij: 60, surekliOgrenme: 65 },
      yol: { uzunEgitim: 50, zorSinav: 70, yogunTempo: 80, rekabetOrtami: 80, sehirDegisimi: 65 },
      cekirdek: [
        { ilgi: "sayisalDusunme", w: 3 }, { ilgi: "analitikDusunme", w: 2 },
        { kosul: "yogunMatematik", w: 2 }, { calisma: "hareketlilik" },
        { yol: "yogunTempo" },
      ],
      kosullar: ["surekliMasa", "yogunMatematik", "cokRekabetci", "yuksekStres"],
      dersler: ["matematik", "geometri", "turkce", "cografya", "bilgisayar"],
    },
    {
      id: "buro-yonetim-destek", ad: "Büro Yönetimi ve İdari Destek", alan: "Hukuk, Kamu ve Yönetim",
      ozet: "Bir kurumun günlük işleyişini ayakta tutan yazışma, kayıt, iletişim ve koordinasyon işleri.",
      ilgi: { organizasyon: 90, planlama: 80, detayOdaklilik: 85, sosyalEtkilesim: 70, yaziliIfade: 70, teknoloji: 60, sozelIfade: 60 },
      calisma: { hareketlilik: 15, insanEtkilesimi: 70, gorevDegiskenligi: 35, saatEsnekligi: 20, uygulamalilik: 65, yontemOzgurlugu: 25 },
      deger: { duzen: 90, isGuvencesi: 75, ozelHayat: 70, insanlaraYardim: 50, yuksekGelir: 30, kariyerYukselme: 40 },
      yol: { uzunEgitim: 20, yogunTempo: 40, dusukBaslangic: 60 },
      cekirdek: [
        { ilgi: "organizasyon", w: 2 }, { ilgi: "detayOdaklilik", w: 2 },
        { calisma: "hareketlilik", w: 2 }, { calisma: "gorevDegiskenligi", w: 2 },
        { kosul: "cokRutin" },
      ],
      kosullar: ["surekliMasa", "cokRutin", "musteriIliskisi"],
      dersler: ["turkce", "bilgisayar", "organizasyon", "yaziYazma"],
    },

    /* ───────────────────────── SANAT VE TASARIM ──────────────── */
    {
      id: "gorsel-sanatlar", ad: "Görsel Sanatlar", alan: "Sanat ve Tasarım",
      ozet: "Resim, heykel, fotoğraf, animasyon ve grafik gibi görsel anlatım biçimlerini üretme üzerine kurulu alan.",
      ilgi: { gorselDusunme: 100, yaraticilik: 95, tasarim: 85, elBecerisi: 80, detayOdaklilik: 65, mekansalDusunme: 65, teknoloji: 50 },
      calisma: { hareketlilik: 45, insanEtkilesimi: 40, gorevDegiskenligi: 70, saatEsnekligi: 80, uygulamalilik: 90, yontemOzgurlugu: 90, girisimcilik: 70, riskAcikligi: 70 },
      deger: { yaraticiOzgurluk: 100, bagimsizlik: 85, somutUretim: 85, surekliOgrenme: 65, isGuvencesi: 25, yuksekGelir: 35 },
      yol: { uzunEgitim: 45, dusukBaslangic: 85, belirsizlik: 85, rekabetOrtami: 70 },
      cekirdek: [
        { ilgi: "gorselDusunme", w: 3 }, { ilgi: "yaraticilik", w: 2 },
        { calisma: "yontemOzgurlugu" }, { yol: "belirsizlik", w: 2 },
        { yol: "dusukBaslangic" },
      ],
      kosullar: ["belirsizGelir", "cokRekabetci", "yalnizCalisma"],
      dersler: ["gorselSanatlar", "elBecerileri", "proje", "bilgisayar"],
    },
    {
      id: "tasarim", ad: "Tasarım", alan: "Sanat ve Tasarım",
      ozet: "Bir ürünü, arayüzü ya da mesajı hem işe yarar hem güzel hâle getirme; sanat ile mühendisliğin kesiştiği alan.",
      ilgi: { tasarim: 100, gorselDusunme: 95, yaraticilik: 90, problemCozme: 75, teknoloji: 70, mekansalDusunme: 70, detayOdaklilik: 70, planlama: 60 },
      calisma: { hareketlilik: 35, insanEtkilesimi: 60, gorevDegiskenligi: 70, saatEsnekligi: 70, uygulamalilik: 80, yontemOzgurlugu: 80, girisimcilik: 65 },
      deger: { yaraticiOzgurluk: 90, somutUretim: 85, surekliOgrenme: 75, bagimsizlik: 70, kariyerYukselme: 60, yuksekGelir: 55 },
      yol: { uzunEgitim: 45, yogunTempo: 65, rekabetOrtami: 70, dusukBaslangic: 65, belirsizlik: 60 },
      cekirdek: [
        { ilgi: "tasarim", w: 3 }, { ilgi: "gorselDusunme", w: 2 },
        { ilgi: "problemCozme" }, { calisma: "uygulamalilik" },
        { yol: "rekabetOrtami" },
      ],
      kosullar: ["surekliMasa", "cokRekabetci", "yuksekStres"],
      dersler: ["gorselSanatlar", "geometri", "bilgisayar", "proje", "matematik"],
    },
    {
      id: "mimarlik-mekan", ad: "Mimarlık ve Mekânsal Tasarım", alan: "Sanat ve Tasarım",
      ozet: "Yapıları, iç mekânları ve şehirleri tasarlama; estetik ile teknik zorunlulukları birlikte çözme üzerine kurulu alan.",
      ilgi: { mekansalDusunme: 100, gorselDusunme: 90, tasarim: 90, yaraticilik: 80, problemCozme: 75, detayOdaklilik: 75, sayisalDusunme: 65, planlama: 70 },
      calisma: { hareketlilik: 50, yerCesitliligi: 60, insanEtkilesimi: 60, gorevDegiskenligi: 60, saatEsnekligi: 60, uygulamalilik: 80, girisimcilik: 65, seyahat: 50 },
      deger: { yaraticiOzgurluk: 85, somutUretim: 95, prestij: 65, bagimsizlik: 70, kariyerYukselme: 60, yuksekGelir: 55, ozelHayat: 35 },
      yol: { uzunEgitim: 70, yogunTempo: 85, rekabetOrtami: 70, dusukBaslangic: 70, sehirDegisimi: 60 },
      cekirdek: [
        { ilgi: "mekansalDusunme", w: 3 }, { ilgi: "tasarim", w: 2 },
        { yol: "yogunTempo", w: 2 }, { calisma: "uygulamalilik" },
        { kosul: "yogunMatematik" },
      ],
      kosullar: ["yuksekStres", "yogunMatematik", "cokRekabetci"],
      dersler: ["geometri", "matematik", "gorselSanatlar", "fizik", "proje"],
    },
    {
      id: "el-sanatlari", ad: "El Sanatları ve Üretim", alan: "Sanat ve Tasarım",
      ozet: "Geleneksel ve çağdaş el üretimi: seramik, takı, dokuma, tezhip, mobilya gibi elle biçim verilen alanlar.",
      ilgi: { elBecerisi: 100, detayOdaklilik: 90, gorselDusunme: 80, yaraticilik: 80, tasarim: 75, mekansalDusunme: 60 },
      calisma: { hareketlilik: 55, insanEtkilesimi: 30, gorevDegiskenligi: 45, saatEsnekligi: 70, uygulamalilik: 95, yontemOzgurlugu: 75, girisimcilik: 75 },
      deger: { somutUretim: 100, yaraticiOzgurluk: 85, bagimsizlik: 80, duzen: 55, isGuvencesi: 30, yuksekGelir: 35 },
      yol: { uzunEgitim: 25, dusukBaslangic: 80, belirsizlik: 75 },
      cekirdek: [
        { ilgi: "elBecerisi", w: 3 }, { ilgi: "detayOdaklilik", w: 2 },
        { calisma: "uygulamalilik", w: 2 }, { calisma: "insanEtkilesimi" },
        { yol: "dusukBaslangic" },
      ],
      kosullar: ["belirsizGelir", "yalnizCalisma", "cokRutin"],
      dersler: ["elBecerileri", "gorselSanatlar", "proje"],
    },
    {
      id: "tekstil-moda", ad: "Tekstil ve Moda", alan: "Sanat ve Tasarım",
      ozet: "Kumaştan koleksiyona uzanan tasarım ve üretim zinciri; yaratıcılıkla üretim tekniğinin birlikte yürüdüğü alan.",
      ilgi: { tasarim: 90, gorselDusunme: 85, yaraticilik: 85, elBecerisi: 80, detayOdaklilik: 75, planlama: 60, teknoloji: 55 },
      calisma: { hareketlilik: 55, insanEtkilesimi: 55, gorevDegiskenligi: 65, saatEsnekligi: 60, uygulamalilik: 90, girisimcilik: 70, riskAcikligi: 60 },
      deger: { yaraticiOzgurluk: 85, somutUretim: 90, bagimsizlik: 65, kariyerYukselme: 55, yuksekGelir: 45, isGuvencesi: 40 },
      yol: { uzunEgitim: 40, yogunTempo: 70, rekabetOrtami: 70, dusukBaslangic: 70, belirsizlik: 65 },
      cekirdek: [
        { ilgi: "tasarim", w: 2 }, { ilgi: "elBecerisi", w: 2 },
        { ilgi: "gorselDusunme", w: 2 }, { calisma: "uygulamalilik", w: 2 },
        { yol: "rekabetOrtami" },
      ],
      kosullar: ["cokRekabetci", "yuksekStres"],
      dersler: ["gorselSanatlar", "elBecerileri", "proje", "matematik"],
    },
    {
      id: "sahne-sanatlari", ad: "Sahne Sanatları ve Performans", alan: "Sanat ve Tasarım",
      ozet: "Tiyatro, dans, oyunculuk ve sahne tasarımı; seyirci önünde ya da sahne arkasında üretilen alan.",
      ilgi: { sozelIfade: 95, yaraticilik: 95, bedenselBeceri: 80, sosyalEtkilesim: 80, empati: 70, muzikRitim: 60, gorselDusunme: 60, elBecerisi: 55 },
      calisma: { hareketlilik: 90, yerCesitliligi: 75, insanEtkilesimi: 85, gorevDegiskenligi: 85, saatEsnekligi: 85, ortamCanliligi: 90, uygulamalilik: 95, seyahat: 70, riskAcikligi: 80 },
      deger: { yaraticiOzgurluk: 100, somutUretim: 70, bagimsizlik: 75, prestij: 55, isGuvencesi: 20, yuksekGelir: 30 },
      yol: { uzunEgitim: 45, yogunTempo: 85, rekabetOrtami: 90, dusukBaslangic: 90, belirsizlik: 95, sehirDegisimi: 75 },
      cekirdek: [
        { ilgi: "bedenselBeceri", w: 2 }, { ilgi: "yaraticilik", w: 2 },
        { calisma: "ortamCanliligi", w: 2 }, { yol: "belirsizlik", w: 2 },
        { kosul: "belirsizGelir" },
      ],
      kosullar: ["belirsizGelir", "cokRekabetci", "geceNobet", "fizikselYorucu", "surekliDegisen"],
      dersler: ["turkce", "sunum", "muzik", "spor", "gorselSanatlar"],
    },
    {
      id: "muzik", ad: "Müzik", alan: "Sanat ve Tasarım",
      ozet: "Çalgı, ses, besteleme ve müzik bilimi; uzun süreli düzenli çalışma isteyen icra ve üretim alanı.",
      ilgi: { muzikRitim: 100, yaraticilik: 85, detayOdaklilik: 80, elBecerisi: 75, bedenselBeceri: 60, sozelIfade: 55, ogretme: 60 },
      calisma: { hareketlilik: 50, yerCesitliligi: 65, insanEtkilesimi: 55, gorevDegiskenligi: 60, saatEsnekligi: 85, ortamCanliligi: 65, uygulamalilik: 95, yontemOzgurlugu: 75, seyahat: 60 },
      deger: { yaraticiOzgurluk: 95, somutUretim: 70, bagimsizlik: 75, surekliOgrenme: 80, isGuvencesi: 30, yuksekGelir: 30 },
      yol: { uzunEgitim: 60, egitimSonrasiEgitim: 70, yogunTempo: 85, rekabetOrtami: 85, dusukBaslangic: 85, belirsizlik: 85 },
      cekirdek: [
        { ilgi: "muzikRitim", w: 4 }, { ilgi: "detayOdaklilik", w: 2 },
        { calisma: "uygulamalilik" }, { yol: "belirsizlik", w: 2 },
        { kosul: "belirsizGelir" },
      ],
      kosullar: ["belirsizGelir", "cokRekabetci", "geceNobet", "yalnizCalisma"],
      dersler: ["muzik", "elBecerileri", "matematik", "yabanciDil"],
    },

    /* ───────────────────────── MÜHENDİSLİK VE TEKNOLOJİ ──────── */
    {
      id: "bilisim-yazilim", ad: "Bilgisayar, Yazılım ve Bilişim", alan: "Mühendislik ve Teknoloji",
      ozet: "Yazılım, veri, yapay zekâ ve siber güvenlik; soyut problemleri kodla çözme üzerine kurulu alan.",
      ilgi: { teknoloji: 100, mantiksalDusunme: 95, problemCozme: 95, analitikDusunme: 90, sayisalDusunme: 80, detayOdaklilik: 75, yaraticilik: 60, arastirma: 65 },
      calisma: { hareketlilik: 10, yerCesitliligi: 35, insanEtkilesimi: 40, gorevDegiskenligi: 60, saatEsnekligi: 75, ortamCanliligi: 30, uygulamalilik: 75, yontemOzgurlugu: 70, girisimcilik: 65 },
      deger: { yuksekGelir: 85, surekliOgrenme: 95, kariyerYukselme: 80, bagimsizlik: 75, somutUretim: 80, ozelHayat: 60, isGuvencesi: 60 },
      yol: { uzunEgitim: 50, egitimSonrasiEgitim: 75, zorSinav: 65, yogunTempo: 70, rekabetOrtami: 70, yurtdisi: 55 },
      cekirdek: [
        { ilgi: "teknoloji", w: 3 }, { ilgi: "mantiksalDusunme", w: 2 },
        { ilgi: "problemCozme", w: 2 }, { calisma: "hareketlilik" },
        { kosul: "surekliMasa", w: 2 },
      ],
      kosullar: ["surekliMasa", "yogunMatematik", "yalnizCalisma"],
      dersler: ["matematik", "bilgisayar", "fizik", "geometri", "yabanciDil"],
    },
    {
      id: "elektrik-elektronik", ad: "Elektrik ve Elektronik", alan: "Mühendislik ve Teknoloji",
      ozet: "Enerji, devre, kontrol ve otomasyon sistemleri; hem masada tasarlanan hem sahada kurulan alan.",
      ilgi: { teknoloji: 100, mantiksalDusunme: 95, problemCozme: 90, sayisalDusunme: 85, analitikDusunme: 80, detayOdaklilik: 85, elBecerisi: 60, mekansalDusunme: 45 },
      calisma: { hareketlilik: 45, yerCesitliligi: 60, insanEtkilesimi: 45, gorevDegiskenligi: 55, saatEsnekligi: 40, uygulamalilik: 80, seyahat: 50 },
      deger: { somutUretim: 85, yuksekGelir: 70, isGuvencesi: 65, kariyerYukselme: 70, surekliOgrenme: 90, duzen: 60 },
      yol: { uzunEgitim: 55, zorSinav: 70, yogunTempo: 70, sehirDegisimi: 65 },
      cekirdek: [
        { ilgi: "teknoloji", w: 3 }, { ilgi: "mantiksalDusunme", w: 2 },
        { ilgi: "sayisalDusunme", w: 2 }, { calisma: "uygulamalilik" },
        { kosul: "yogunMatematik", w: 2 },
      ],
      kosullar: ["yogunMatematik", "fizikselYorucu", "geceNobet"],
      dersler: ["fizik", "matematik", "bilgisayar", "elBecerileri", "geometri"],
    },
    {
      id: "makine-uretim", ad: "Makine, Üretim ve Malzeme", alan: "Mühendislik ve Teknoloji",
      ozet: "Makine, üretim hattı ve malzeme; bir şeyin nasıl yapıldığını ve nasıl daha iyi yapılabileceğini çözen alan.",
      ilgi: { mekansalDusunme: 95, elBecerisi: 90, problemCozme: 90, sayisalDusunme: 80, teknoloji: 75, detayOdaklilik: 75, mantiksalDusunme: 70, organizasyon: 55 },
      calisma: { hareketlilik: 75, yerCesitliligi: 55, insanEtkilesimi: 45, gorevDegiskenligi: 45, saatEsnekligi: 25, uygulamalilik: 95, ekipYonetimi: 60 },
      deger: { somutUretim: 95, isGuvencesi: 70, yuksekGelir: 65, kariyerYukselme: 65, duzen: 65, surekliOgrenme: 60 },
      yol: { uzunEgitim: 55, zorSinav: 70, yogunTempo: 70, sehirDegisimi: 70 },
      cekirdek: [
        { ilgi: "mekansalDusunme", w: 2 }, { ilgi: "elBecerisi", w: 2 },
        { ilgi: "problemCozme", w: 2 }, { calisma: "uygulamalilik", w: 2 },
        { kosul: "yogunMatematik" }, { kosul: "fizikselYorucu" },
      ],
      kosullar: ["yogunMatematik", "fizikselYorucu", "geceNobet", "surekliAyakta"],
      dersler: ["fizik", "matematik", "geometri", "elBecerileri", "bilgisayar"],
    },
    {
      id: "insaat-yapi", ad: "İnşaat, Yapı ve Harita", alan: "Mühendislik ve Teknoloji",
      ozet: "Bina, yol, köprü ve arazi; projeyi kâğıttan sahaya taşıyan, açık alanda da çalışılan alan.",
      ilgi: { mekansalDusunme: 90, sayisalDusunme: 85, problemCozme: 85, planlama: 80, detayOdaklilik: 80, organizasyon: 70, dogaIlgisi: 55, liderlik: 60 },
      calisma: { hareketlilik: 75, yerCesitliligi: 80, insanEtkilesimi: 65, gorevDegiskenligi: 60, saatEsnekligi: 35, uygulamalilik: 90, seyahat: 70, ekipYonetimi: 70 },
      deger: { somutUretim: 100, yuksekGelir: 65, kariyerYukselme: 65, isGuvencesi: 55, duzen: 55, ozelHayat: 35 },
      yol: { uzunEgitim: 55, zorSinav: 70, yogunTempo: 80, sehirDegisimi: 85, belirsizlik: 55 },
      cekirdek: [
        { ilgi: "mekansalDusunme", w: 2 }, { ilgi: "planlama", w: 2 },
        { calisma: "hareketlilik", w: 2 }, { calisma: "yerCesitliligi" },
        { yol: "sehirDegisimi", w: 2 }, { kosul: "fizikselYorucu" },
      ],
      kosullar: ["fizikselYorucu", "surekliAyakta", "surekliSeyahat", "yogunMatematik"],
      dersler: ["matematik", "geometri", "fizik", "cografya", "proje"],
    },
    {
      id: "endustri-sistem", ad: "Endüstri ve Sistem Yönetimi", alan: "Mühendislik ve Teknoloji",
      ozet: "İnsan, makine ve sürecin birlikte en verimli nasıl çalışacağını tasarlayan; mühendislikle yönetimin kesiştiği alan.",
      ilgi: { analitikDusunme: 95, sayisalDusunme: 90, planlama: 90, organizasyon: 85, problemCozme: 85, mantiksalDusunme: 80, liderlik: 70, teknoloji: 70 },
      calisma: { hareketlilik: 40, insanEtkilesimi: 70, gorevDegiskenligi: 60, saatEsnekligi: 45, uygulamalilik: 70, ekipYonetimi: 80 },
      deger: { kariyerYukselme: 85, yuksekGelir: 75, somutUretim: 70, duzen: 75, surekliOgrenme: 70, isGuvencesi: 60 },
      yol: { uzunEgitim: 55, zorSinav: 75, yogunTempo: 75, rekabetOrtami: 70, sehirDegisimi: 65 },
      cekirdek: [
        { ilgi: "analitikDusunme", w: 2 }, { ilgi: "planlama", w: 2 },
        { ilgi: "sayisalDusunme", w: 2 }, { calisma: "ekipYonetimi" },
        { kosul: "yogunMatematik", w: 2 },
      ],
      kosullar: ["yogunMatematik", "surekliMasa", "buyukEkipYonetimi"],
      dersler: ["matematik", "geometri", "fizik", "organizasyon", "bilgisayar"],
    },
    {
      id: "yer-maden-enerji", ad: "Yer Bilimleri, Maden ve Enerji", alan: "Mühendislik ve Teknoloji",
      ozet: "Yerin altındaki kaynaklar ve enerji sistemleri; sahada, ocakta ve tesiste yürüyen alan.",
      ilgi: { sayisalDusunme: 85, problemCozme: 85, analitikDusunme: 80, dogaIlgisi: 75, mekansalDusunme: 75, detayOdaklilik: 75, teknoloji: 75, elBecerisi: 60 },
      calisma: { hareketlilik: 80, yerCesitliligi: 85, insanEtkilesimi: 45, gorevDegiskenligi: 60, saatEsnekligi: 35, uygulamalilik: 90, seyahat: 80 },
      deger: { yuksekGelir: 75, somutUretim: 85, isGuvencesi: 55, kariyerYukselme: 65, duzen: 45, ozelHayat: 30 },
      yol: { uzunEgitim: 55, yogunTempo: 80, sehirDegisimi: 90, dusukBaslangic: 55, belirsizlik: 60 },
      cekirdek: [
        { ilgi: "dogaIlgisi", w: 2 }, { ilgi: "sayisalDusunme", w: 2 },
        { calisma: "yerCesitliligi", w: 2 }, { yol: "sehirDegisimi", w: 2 },
        { kosul: "fizikselYorucu" }, { kosul: "surekliSeyahat" },
      ],
      kosullar: ["fizikselYorucu", "surekliSeyahat", "geceNobet", "yogunMatematik", "surekliAyakta"],
      dersler: ["fizik", "kimya", "matematik", "cografya", "biyoloji"],
    },
    {
      id: "havacilik", ad: "Havacılık ve Uzay", alan: "Mühendislik ve Teknoloji",
      ozet: "Uçak ve uzay araçlarının tasarımı, bakımı ve işletilmesi; hata payının çok düşük olduğu alan.",
      ilgi: { teknoloji: 90, detayOdaklilik: 95, problemCozme: 85, krizCozme: 85, sayisalDusunme: 80, mekansalDusunme: 75, elBecerisi: 70, planlama: 70 },
      calisma: { hareketlilik: 70, yerCesitliligi: 70, insanEtkilesimi: 60, gorevDegiskenligi: 55, saatEsnekligi: 60, ortamCanliligi: 55, uygulamalilik: 90, seyahat: 85 },
      deger: { prestij: 80, yuksekGelir: 75, somutUretim: 75, kariyerYukselme: 70, duzen: 70, ozelHayat: 35 },
      yol: { uzunEgitim: 60, egitimSonrasiEgitim: 70, zorSinav: 80, yogunTempo: 80, sehirDegisimi: 80, rekabetOrtami: 75 },
      cekirdek: [
        { ilgi: "detayOdaklilik", w: 2 }, { ilgi: "krizCozme", w: 2 },
        { ilgi: "teknoloji", w: 2 }, { calisma: "seyahat" },
        { kosul: "geceNobet", w: 2 }, { yol: "zorSinav" },
      ],
      kosullar: ["geceNobet", "surekliSeyahat", "yuksekStres", "cokRekabetci"],
      dersler: ["fizik", "matematik", "yabanciDil", "geometri", "bilgisayar"],
    },
    {
      id: "denizcilik", ad: "Denizcilik", alan: "Mühendislik ve Teknoloji",
      ozet: "Gemi, liman ve deniz taşımacılığı; uzun süre evden uzakta, ekiple birlikte yürüyen alan.",
      ilgi: { krizCozme: 90, teknoloji: 80, problemCozme: 80, mekansalDusunme: 75, planlama: 75, elBecerisi: 70, liderlik: 70, dogaIlgisi: 65 },
      calisma: { hareketlilik: 85, yerCesitliligi: 95, insanEtkilesimi: 60, gorevDegiskenligi: 60, saatEsnekligi: 55, uygulamalilik: 95, seyahat: 100, ekipYonetimi: 70 },
      deger: { yuksekGelir: 85, somutUretim: 70, kariyerYukselme: 70, prestij: 55, ozelHayat: 15, isGuvencesi: 55 },
      yol: { uzunEgitim: 50, zorSinav: 60, yogunTempo: 90, sehirDegisimi: 95, yurtdisi: 85 },
      cekirdek: [
        { ilgi: "krizCozme", w: 2 }, { ilgi: "mekansalDusunme" },
        { calisma: "seyahat", w: 3 }, { yol: "sehirDegisimi", w: 2 },
        { kosul: "surekliSeyahat", w: 2 },
      ],
      kosullar: ["surekliSeyahat", "geceNobet", "fizikselYorucu", "yalnizCalisma", "yuksekStres"],
      dersler: ["fizik", "matematik", "yabanciDil", "cografya", "spor"],
    },
    {
      id: "teknik-uygulamali", ad: "Teknik ve Uygulamalı Meslekler", alan: "Mühendislik ve Teknoloji",
      // Katalogdaki her program daha özel bir aileye bağlandığı için bu aile
      // şu an boştur. Kural dosyasındaki son çare deseninin hedefi olduğu için
      // tanımlı kalır ama aktif: false ile sonuç, arama ve rapordan çıkarılır.
      aktif: false,
      ozet: "Bir tekniği doğrudan uygulamaya dayanan; kısa sürede mesleğe geçiş sağlayan uygulamalı programlar.",
      ilgi: { elBecerisi: 90, problemCozme: 80, teknoloji: 80, detayOdaklilik: 80, mekansalDusunme: 65 },
      calisma: { hareketlilik: 70, insanEtkilesimi: 40, gorevDegiskenligi: 45, uygulamalilik: 95, saatEsnekligi: 35 },
      deger: { somutUretim: 90, isGuvencesi: 60, duzen: 60, yuksekGelir: 45 },
      yol: { uzunEgitim: 20, yogunTempo: 60, dusukBaslangic: 60 },
      cekirdek: [
        { ilgi: "elBecerisi", w: 3 }, { ilgi: "teknoloji" },
        { ilgi: "problemCozme" }, { calisma: "uygulamalilik", w: 2 },
        { kosul: "fizikselYorucu", w: 2 },
      ],
      kosullar: ["fizikselYorucu", "surekliAyakta", "cokRutin"],
      dersler: ["fizik", "matematik", "elBecerileri", "bilgisayar"],
    },

    /* ───────────────────────── TEMEL BİLİMLER ────────────────── */
    {
      id: "matematik-istatistik", ad: "Matematik ve İstatistik", alan: "Temel Bilimler",
      ozet: "Sayının ve belirsizliğin dilini kuran; finanstan veri bilimine ve akademiye açılan alan.",
      ilgi: { sayisalDusunme: 100, mantiksalDusunme: 100, analitikDusunme: 95, problemCozme: 90, detayOdaklilik: 80, teknoloji: 70, arastirma: 55 },
      calisma: { hareketlilik: 10, insanEtkilesimi: 30, gorevDegiskenligi: 40, saatEsnekligi: 70, ortamCanliligi: 20, uygulamalilik: 20 },
      deger: { bilgiUretme: 95, surekliOgrenme: 90, duzen: 70, bagimsizlik: 65, isGuvencesi: 50, yuksekGelir: 55 },
      yol: { uzunEgitim: 65, egitimSonrasiEgitim: 85, zorSinav: 70, yogunTempo: 65, dusukBaslangic: 65, belirsizlik: 60 },
      cekirdek: [
        { ilgi: "sayisalDusunme", w: 3 }, { ilgi: "mantiksalDusunme", w: 2 },
        { calisma: "uygulamalilik", w: 2 }, { kosul: "yogunMatematik", w: 2 },
        { yol: "egitimSonrasiEgitim" },
      ],
      kosullar: ["yogunMatematik", "surekliMasa", "yalnizCalisma"],
      dersler: ["matematik", "geometri", "fizik", "bilgisayar"],
    },
    {
      id: "fizik-bilimleri", ad: "Fizik ve Uzay Bilimleri", alan: "Temel Bilimler",
      ozet: "Maddenin ve evrenin nasıl işlediğini araştıran; laboratuvarla teorinin birlikte yürüdüğü alan.",
      ilgi: { arastirma: 100, analitikDusunme: 95, sayisalDusunme: 90, problemCozme: 85, mantiksalDusunme: 85, detayOdaklilik: 85, teknoloji: 75, elBecerisi: 55, dogaIlgisi: 45 },
      calisma: { hareketlilik: 35, insanEtkilesimi: 35, gorevDegiskenligi: 45, saatEsnekligi: 65, ortamCanliligi: 25, uygulamalilik: 65 },
      deger: { bilgiUretme: 100, surekliOgrenme: 95, prestij: 55, bagimsizlik: 65, isGuvencesi: 45, yuksekGelir: 40 },
      yol: { uzunEgitim: 70, egitimSonrasiEgitim: 95, zorSinav: 70, yogunTempo: 70, dusukBaslangic: 80, belirsizlik: 70, yurtdisi: 60 },
      cekirdek: [
        { ilgi: "arastirma", w: 2 }, { ilgi: "sayisalDusunme", w: 2 },
        { ilgi: "analitikDusunme" }, { yol: "egitimSonrasiEgitim", w: 3 },
        { kosul: "yogunMatematik", w: 2 },
      ],
      kosullar: ["yogunMatematik", "cokUzunEgitim", "belirsizGelir", "surekliMasa"],
      dersler: ["fizik", "matematik", "geometri", "kimya"],
    },
    {
      id: "kimya-bilimleri", ad: "Kimya ve Kimyasal Bilimler", alan: "Temel Bilimler",
      ozet: "Maddenin dönüşümünü inceleyen; laboratuvar, üretim ve kalite kontrol yollarına açılan alan.",
      ilgi: { arastirma: 90, analitikDusunme: 90, detayOdaklilik: 90, sayisalDusunme: 75, problemCozme: 80, canliBilimleri: 60, elBecerisi: 65 },
      calisma: { hareketlilik: 40, insanEtkilesimi: 35, gorevDegiskenligi: 40, saatEsnekligi: 35, ortamCanliligi: 30, uygulamalilik: 80 },
      deger: { bilgiUretme: 85, somutUretim: 75, surekliOgrenme: 80, isGuvencesi: 55, duzen: 70, yuksekGelir: 45 },
      yol: { uzunEgitim: 60, egitimSonrasiEgitim: 75, zorSinav: 65, yogunTempo: 65, dusukBaslangic: 65 },
      cekirdek: [
        { ilgi: "arastirma", w: 2 }, { ilgi: "detayOdaklilik", w: 2 },
        { ilgi: "analitikDusunme" }, { calisma: "uygulamalilik", w: 2 },
        { yol: "egitimSonrasiEgitim", w: 2 },
      ],
      kosullar: ["cokRutin"],
      dersler: ["kimya", "matematik", "fizik", "biyoloji"],
    },
    {
      id: "biyoloji-yasam", ad: "Biyoloji ve Yaşam Bilimleri", alan: "Temel Bilimler",
      ozet: "Canlıların işleyişini hücreden ekosisteme kadar inceleyen; biyoteknoloji ve araştırma yollarına açılan alan.",
      ilgi: { canliBilimleri: 100, arastirma: 95, analitikDusunme: 85, detayOdaklilik: 85, dogaIlgisi: 70, sayisalDusunme: 65, teknoloji: 60 },
      calisma: { hareketlilik: 40, insanEtkilesimi: 35, gorevDegiskenligi: 45, saatEsnekligi: 50, ortamCanliligi: 25, uygulamalilik: 75 },
      deger: { bilgiUretme: 95, surekliOgrenme: 90, toplumsalFayda: 70, somutUretim: 60, isGuvencesi: 45, yuksekGelir: 40 },
      yol: { uzunEgitim: 65, egitimSonrasiEgitim: 90, zorSinav: 65, yogunTempo: 70, dusukBaslangic: 80, belirsizlik: 70 },
      cekirdek: [
        { ilgi: "canliBilimleri", w: 3 }, { ilgi: "arastirma", w: 2 },
        { calisma: "uygulamalilik" }, { yol: "egitimSonrasiEgitim", w: 2 },
        { kosul: "cokUzunEgitim" },
      ],
      kosullar: ["cokUzunEgitim", "belirsizGelir", "cokRutin"],
      dersler: ["biyoloji", "kimya", "matematik", "arastirma"],
    },

    /* ───────────────────────── SAĞLIK ────────────────────────── */
    {
      id: "tip", ad: "Tıp", alan: "Sağlık",
      ozet: "Hastalığı tanıma ve tedavi etme; uzun eğitimi, nöbeti ve yüksek sorumluluğu olan alan.",
      ilgi: { canliBilimleri: 100, detayOdaklilik: 95, empati: 85, problemCozme: 90, analitikDusunme: 85, krizCozme: 90, aktifDinleme: 80, arastirma: 75 },
      calisma: { hareketlilik: 70, insanEtkilesimi: 90, gorevDegiskenligi: 70, saatEsnekligi: 30, ortamCanliligi: 70, uygulamalilik: 90 },
      deger: { insanlaraYardim: 100, prestij: 90, toplumsalFayda: 95, yuksekGelir: 75, isGuvencesi: 85, surekliOgrenme: 90, ozelHayat: 20 },
      yol: { uzunEgitim: 100, egitimSonrasiEgitim: 100, zorSinav: 100, yogunTempo: 100, rekabetOrtami: 90, sehirDegisimi: 85 },
      cekirdek: [
        { ilgi: "canliBilimleri", w: 3 }, { ilgi: "krizCozme", w: 2 },
        { calisma: "uygulamalilik" }, { yol: "uzunEgitim", w: 2 },
        { yol: "zorSinav", w: 2 }, { kosul: "kanHastalik", w: 2 },
        { kosul: "geceNobet" },
      ],
      kosullar: ["kanHastalik", "hastalarla", "geceNobet", "yuksekStres", "cokUzunEgitim", "yogunInsan", "surekliAyakta"],
      dersler: ["biyoloji", "kimya", "matematik", "fizik", "turkce"],
    },
    {
      id: "dis-hekimligi", ad: "Diş Hekimliği ve Ağız Sağlığı", alan: "Sağlık",
      ozet: "Ağız ve diş sağlığı; el becerisiyle sağlık bilgisinin birlikte kullanıldığı alan.",
      ilgi: { elBecerisi: 100, detayOdaklilik: 95, canliBilimleri: 90, empati: 75, problemCozme: 75, aktifDinleme: 65 },
      calisma: { hareketlilik: 40, insanEtkilesimi: 85, gorevDegiskenligi: 40, saatEsnekligi: 55, uygulamalilik: 95, girisimcilik: 70 },
      deger: { insanlaraYardim: 85, yuksekGelir: 85, prestij: 80, bagimsizlik: 75, isGuvencesi: 75, ozelHayat: 55 },
      yol: { uzunEgitim: 90, egitimSonrasiEgitim: 70, zorSinav: 95, yogunTempo: 80, rekabetOrtami: 80 },
      cekirdek: [
        { ilgi: "elBecerisi", w: 3 }, { ilgi: "detayOdaklilik", w: 2 },
        { ilgi: "canliBilimleri", w: 2 }, { calisma: "uygulamalilik" },
        { yol: "zorSinav", w: 2 }, { kosul: "kanHastalik", w: 2 },
      ],
      kosullar: ["kanHastalik", "hastalarla", "cokUzunEgitim", "cokRutin"],
      dersler: ["biyoloji", "kimya", "elBecerileri", "matematik", "fizik"],
    },
    {
      id: "eczacilik", ad: "Eczacılık", alan: "Sağlık",
      ozet: "İlacın bilimi ve doğru kullanımı; laboratuvar, eczane ve ilaç sanayii yollarına açılan alan.",
      ilgi: { detayOdaklilik: 95, canliBilimleri: 90, arastirma: 80, analitikDusunme: 80, empati: 70, organizasyon: 70, sosyalEtkilesim: 60 },
      calisma: { hareketlilik: 45, insanEtkilesimi: 75, gorevDegiskenligi: 35, saatEsnekligi: 40, uygulamalilik: 80, girisimcilik: 70 },
      deger: { insanlaraYardim: 80, isGuvencesi: 80, yuksekGelir: 70, duzen: 80, bagimsizlik: 70, prestij: 65 },
      yol: { uzunEgitim: 80, zorSinav: 90, egitimSonrasiEgitim: 60, yogunTempo: 70 },
      cekirdek: [
        { ilgi: "detayOdaklilik", w: 3 }, { ilgi: "canliBilimleri", w: 2 },
        { yol: "zorSinav", w: 2 }, { yol: "uzunEgitim" },
        { kosul: "cokRutin" }, { kosul: "surekliAyakta" },
      ],
      kosullar: ["cokUzunEgitim", "surekliAyakta", "musteriIliskisi", "cokRutin"],
      dersler: ["kimya", "biyoloji", "matematik", "fizik"],
    },
    {
      id: "hemsirelik-bakim", ad: "Hemşirelik ve Sağlık Bakımı", alan: "Sağlık",
      ozet: "Hastanın yanında olan, bakımını üstlenen ve iyileşme sürecini yürüten alan.",
      ilgi: { empati: 100, canliBilimleri: 85, krizCozme: 85, detayOdaklilik: 85, aktifDinleme: 85, elBecerisi: 70, organizasyon: 70, bedenselBeceri: 60 },
      calisma: { hareketlilik: 90, insanEtkilesimi: 95, gorevDegiskenligi: 70, saatEsnekligi: 40, ortamCanliligi: 80, uygulamalilik: 95 },
      deger: { insanlaraYardim: 100, toplumsalFayda: 90, isGuvencesi: 85, duzen: 55, ozelHayat: 25, yuksekGelir: 40 },
      yol: { uzunEgitim: 45, zorSinav: 65, yogunTempo: 90, sehirDegisimi: 75, egitimSonrasiEgitim: 55 },
      cekirdek: [
        { ilgi: "empati", w: 2 }, { ilgi: "krizCozme", w: 2 },
        { ilgi: "canliBilimleri", w: 2 }, { calisma: "hareketlilik", w: 2 },
        { kosul: "kanHastalik", w: 2 }, { kosul: "geceNobet" },
      ],
      kosullar: ["kanHastalik", "hastalarla", "geceNobet", "surekliAyakta", "fizikselYorucu", "yuksekStres", "yogunInsan"],
      dersler: ["biyoloji", "kimya", "turkce", "grupCalismasi"],
    },
    {
      id: "terapi-rehabilitasyon", ad: "Terapi ve Rehabilitasyon", alan: "Sağlık",
      ozet: "Hareket, konuşma ve işlev kaybını uzun süreli çalışmayla geri kazandıran alan.",
      ilgi: { empati: 95, canliBilimleri: 85, aktifDinleme: 85, bedenselBeceri: 75, detayOdaklilik: 80, ogretme: 75, problemCozme: 70, elBecerisi: 70 },
      calisma: { hareketlilik: 75, insanEtkilesimi: 90, gorevDegiskenligi: 55, saatEsnekligi: 55, uygulamalilik: 95, girisimcilik: 60 },
      deger: { insanlaraYardim: 100, toplumsalFayda: 85, isGuvencesi: 70, bagimsizlik: 60, ozelHayat: 55, yuksekGelir: 50 },
      yol: { uzunEgitim: 50, zorSinav: 75, yogunTempo: 65, egitimSonrasiEgitim: 60 },
      cekirdek: [
        { ilgi: "empati", w: 2 }, { ilgi: "bedenselBeceri", w: 2 },
        { ilgi: "canliBilimleri", w: 2 }, { calisma: "uygulamalilik", w: 2 },
        { kosul: "hastalarla", w: 2 },
      ],
      kosullar: ["hastalarla", "surekliAyakta", "fizikselYorucu", "yogunInsan"],
      dersler: ["biyoloji", "fizik", "spor", "turkce"],
    },
    {
      id: "saglik-teknolojileri", ad: "Sağlık Teknolojileri ve Teknik Sağlık", alan: "Sağlık",
      ozet: "Görüntüleme, laboratuvar, cihaz ve sağlık verisi; sağlığın teknik omurgasını kuran alan.",
      ilgi: { detayOdaklilik: 95, teknoloji: 85, canliBilimleri: 80, analitikDusunme: 70, elBecerisi: 75, problemCozme: 70, organizasyon: 60 },
      calisma: { hareketlilik: 55, insanEtkilesimi: 60, gorevDegiskenligi: 40, saatEsnekligi: 35, uygulamalilik: 90, yontemOzgurlugu: 25 },
      deger: { insanlaraYardim: 75, isGuvencesi: 75, duzen: 80, somutUretim: 60, yuksekGelir: 45, ozelHayat: 50 },
      yol: { uzunEgitim: 30, yogunTempo: 60, zorSinav: 45, sehirDegisimi: 60 },
      cekirdek: [
        { ilgi: "detayOdaklilik", w: 2 }, { ilgi: "teknoloji", w: 2 },
        { calisma: "uygulamalilik", w: 2 }, { calisma: "yontemOzgurlugu", w: 2 },
        { kosul: "kanHastalik" }, { kosul: "cokRutin" },
      ],
      kosullar: ["kanHastalik", "hastalarla", "geceNobet", "cokRutin", "surekliAyakta"],
      dersler: ["biyoloji", "fizik", "kimya", "bilgisayar", "matematik"],
    },
    {
      id: "veterinerlik", ad: "Veterinerlik ve Hayvan Sağlığı", alan: "Sağlık",
      ozet: "Hayvan sağlığı, üretim ve halk sağlığı; klinikten çiftliğe uzanan alan.",
      ilgi: { canliBilimleri: 100, empati: 80, detayOdaklilik: 85, elBecerisi: 80, dogaIlgisi: 85, problemCozme: 80, krizCozme: 75 },
      calisma: { hareketlilik: 85, yerCesitliligi: 75, insanEtkilesimi: 60, gorevDegiskenligi: 70, saatEsnekligi: 45, uygulamalilik: 95, girisimcilik: 65, seyahat: 60 },
      deger: { insanlaraYardim: 75, somutUretim: 70, bagimsizlik: 70, isGuvencesi: 65, toplumsalFayda: 75, yuksekGelir: 50 },
      yol: { uzunEgitim: 80, zorSinav: 80, yogunTempo: 80, sehirDegisimi: 75 },
      cekirdek: [
        { ilgi: "canliBilimleri", w: 3 }, { ilgi: "dogaIlgisi", w: 2 },
        { calisma: "hareketlilik", w: 2 }, { yol: "uzunEgitim" },
        { kosul: "kanHastalik", w: 2 },
      ],
      kosullar: ["kanHastalik", "geceNobet", "fizikselYorucu", "surekliAyakta", "cokUzunEgitim"],
      dersler: ["biyoloji", "kimya", "matematik", "elBecerileri"],
    },
    {
      id: "beslenme-gida", ad: "Beslenme ve Gıda", alan: "Sağlık",
      ozet: "Gıdanın üretimi, güvenliği ve sağlıkla ilişkisi; laboratuvar, üretim ve danışmanlık yollarına açılan alan.",
      ilgi: { canliBilimleri: 90, detayOdaklilik: 85, arastirma: 75, analitikDusunme: 70, ogretme: 60, empati: 60, organizasyon: 60 },
      calisma: { hareketlilik: 50, insanEtkilesimi: 60, gorevDegiskenligi: 45, saatEsnekligi: 45, uygulamalilik: 85, girisimcilik: 60 },
      deger: { insanlaraYardim: 75, toplumsalFayda: 75, somutUretim: 70, isGuvencesi: 60, duzen: 70, yuksekGelir: 45 },
      yol: { uzunEgitim: 45, zorSinav: 60, yogunTempo: 60, dusukBaslangic: 60 },
      cekirdek: [
        { ilgi: "canliBilimleri", w: 3 }, { ilgi: "detayOdaklilik", w: 2 },
        { ilgi: "arastirma", w: 2 }, { calisma: "uygulamalilik" },
        { kosul: "cokRutin" },
      ],
      kosullar: ["cokRutin", "musteriIliskisi"],
      dersler: ["biyoloji", "kimya", "matematik", "arastirma"],
    },

    /* ───────────────────────── DOĞA, TARIM VE ÇEVRE ──────────── */
    {
      id: "tarim-bitkisel", ad: "Tarım, Bitkisel ve Hayvansal Üretim", alan: "Doğa, Tarım ve Çevre",
      ozet: "Toprak, bitki ve hayvandan üretim; laboratuvar kadar tarlada da yürüyen alan.",
      ilgi: { dogaIlgisi: 100, canliBilimleri: 90, problemCozme: 70, detayOdaklilik: 75, planlama: 70, elBecerisi: 70, teknoloji: 65, organizasyon: 60 },
      calisma: { hareketlilik: 85, yerCesitliligi: 70, insanEtkilesimi: 45, gorevDegiskenligi: 65, saatEsnekligi: 55, uygulamalilik: 95, girisimcilik: 70, seyahat: 55 },
      deger: { somutUretim: 95, bagimsizlik: 75, toplumsalFayda: 75, duzen: 50, isGuvencesi: 50, yuksekGelir: 40 },
      yol: { uzunEgitim: 45, yogunTempo: 70, sehirDegisimi: 85, dusukBaslangic: 70, belirsizlik: 60 },
      cekirdek: [
        { ilgi: "dogaIlgisi", w: 3 }, { ilgi: "canliBilimleri", w: 2 },
        { ilgi: "elBecerisi", w: 2 }, { calisma: "uygulamalilik", w: 2 },
        { kosul: "fizikselYorucu", w: 2 },
      ],
      kosullar: ["fizikselYorucu", "surekliAyakta", "belirsizGelir"],
      dersler: ["biyoloji", "kimya", "cografya", "matematik", "elBecerileri"],
    },
    {
      id: "orman-dogal-kaynak", ad: "Orman ve Doğal Kaynaklar", alan: "Doğa, Tarım ve Çevre",
      ozet: "Ormanın yönetimi, korunması ve ürüne dönüşmesi; büyük ölçüde açık alanda yürüyen alan.",
      ilgi: { dogaIlgisi: 100, canliBilimleri: 85, planlama: 75, mekansalDusunme: 70, analitikDusunme: 70, detayOdaklilik: 70, bedenselBeceri: 60 },
      calisma: { hareketlilik: 95, yerCesitliligi: 85, insanEtkilesimi: 45, gorevDegiskenligi: 60, saatEsnekligi: 50, uygulamalilik: 95, seyahat: 80 },
      deger: { toplumsalFayda: 85, somutUretim: 80, isGuvencesi: 70, bagimsizlik: 65, duzen: 55, yuksekGelir: 40 },
      yol: { uzunEgitim: 50, zorSinav: 65, yogunTempo: 65, sehirDegisimi: 90 },
      cekirdek: [
        { ilgi: "dogaIlgisi", w: 3 }, { ilgi: "canliBilimleri", w: 2 },
        { ilgi: "mekansalDusunme", w: 2 }, { calisma: "hareketlilik", w: 2 },
        { yol: "sehirDegisimi", w: 2 }, { kosul: "fizikselYorucu" },
      ],
      kosullar: ["fizikselYorucu", "surekliAyakta", "surekliSeyahat"],
      dersler: ["biyoloji", "cografya", "kimya", "matematik", "spor"],
    },
    {
      id: "cevre-doga", ad: "Çevre ve Su Bilimleri", alan: "Doğa, Tarım ve Çevre",
      ozet: "Kirlilik, iklim, su ve ekosistem; ölçme, arıtma ve koruma üzerine kurulu alan.",
      ilgi: { dogaIlgisi: 90, analitikDusunme: 85, canliBilimleri: 80, arastirma: 85, problemCozme: 80, detayOdaklilik: 80, sayisalDusunme: 70, teknoloji: 65 },
      calisma: { hareketlilik: 65, yerCesitliligi: 70, insanEtkilesimi: 50, gorevDegiskenligi: 55, saatEsnekligi: 45, uygulamalilik: 80, seyahat: 65 },
      deger: { toplumsalFayda: 95, bilgiUretme: 75, somutUretim: 65, isGuvencesi: 55, surekliOgrenme: 75, yuksekGelir: 40 },
      yol: { uzunEgitim: 55, egitimSonrasiEgitim: 70, zorSinav: 65, yogunTempo: 60, sehirDegisimi: 70 },
      cekirdek: [
        { ilgi: "dogaIlgisi", w: 2 }, { ilgi: "arastirma", w: 2 },
        { ilgi: "analitikDusunme", w: 2 }, { calisma: "yerCesitliligi" },
        { kosul: "yogunMatematik" },
      ],
      kosullar: ["fizikselYorucu", "surekliSeyahat", "yogunMatematik"],
      dersler: ["biyoloji", "kimya", "fizik", "cografya", "matematik"],
    },

    /* ───────────────────────── HİZMET VE UYGULAMA ────────────── */
    {
      id: "gastronomi", ad: "Gastronomi ve Mutfak", alan: "Hizmet ve Uygulama",
      ozet: "Mutfağın hem sanatı hem işletmesi; hızlı tempoda, ayakta ve ekiple yürüyen alan.",
      ilgi: { elBecerisi: 95, yaraticilik: 85, detayOdaklilik: 80, organizasyon: 80, krizCozme: 80, planlama: 70, bedenselBeceri: 65, sosyalEtkilesim: 60 },
      calisma: { hareketlilik: 95, insanEtkilesimi: 70, gorevDegiskenligi: 70, saatEsnekligi: 55, ortamCanliligi: 90, uygulamalilik: 100, girisimcilik: 80, ekipYonetimi: 70 },
      deger: { somutUretim: 100, yaraticiOzgurluk: 80, bagimsizlik: 75, kariyerYukselme: 60, ozelHayat: 20, isGuvencesi: 40 },
      yol: { uzunEgitim: 30, yogunTempo: 95, dusukBaslangic: 80, sehirDegisimi: 70, belirsizlik: 60 },
      cekirdek: [
        { ilgi: "elBecerisi", w: 3 }, { ilgi: "yaraticilik" },
        { ilgi: "krizCozme" }, { calisma: "uygulamalilik", w: 2 },
        { yol: "yogunTempo", w: 2 }, { kosul: "surekliAyakta", w: 2 },
      ],
      kosullar: ["surekliAyakta", "fizikselYorucu", "geceNobet", "yuksekStres", "musteriIliskisi"],
      dersler: ["elBecerileri", "kimya", "organizasyon", "gorselSanatlar"],
    },
    {
      id: "turizm-rehberlik", ad: "Turizm, Konaklama ve Rehberlik", alan: "Hizmet ve Uygulama",
      ozet: "Misafir ağırlama, seyahat ve rehberlik; dil ve insan ilişkilerinin merkezde olduğu alan.",
      ilgi: { sosyalEtkilesim: 95, dilYatkinligi: 85, sozelIfade: 85, organizasyon: 80, empati: 70, krizCozme: 75, planlama: 70, ikna: 65 },
      calisma: { hareketlilik: 85, yerCesitliligi: 85, insanEtkilesimi: 95, gorevDegiskenligi: 75, saatEsnekligi: 60, ortamCanliligi: 90, uygulamalilik: 90, seyahat: 85 },
      deger: { insanlaraYardim: 65, kariyerYukselme: 60, bagimsizlik: 60, somutUretim: 50, ozelHayat: 30, isGuvencesi: 40 },
      yol: { uzunEgitim: 35, yogunTempo: 80, sehirDegisimi: 85, yurtdisi: 70, dusukBaslangic: 75, belirsizlik: 65 },
      cekirdek: [
        { ilgi: "dilYatkinligi", w: 2 }, { ilgi: "sosyalEtkilesim", w: 2 },
        { calisma: "seyahat", w: 2 }, { yol: "sehirDegisimi" },
        { kosul: "musteriIliskisi", w: 2 },
      ],
      kosullar: ["musteriIliskisi", "yogunInsan", "surekliSeyahat", "geceNobet", "surekliAyakta", "belirsizGelir"],
      dersler: ["yabanciDil", "cografya", "tarih", "sunum", "organizasyon"],
    },
    {
      id: "lojistik-ulastirma", ad: "Lojistik ve Ulaştırma", alan: "Hizmet ve Uygulama",
      ozet: "Bir ürünün üreticiden alıcıya kadar izlediği yolun planlanması ve yürütülmesi.",
      ilgi: { planlama: 95, organizasyon: 90, analitikDusunme: 80, problemCozme: 80, sayisalDusunme: 70, krizCozme: 75, detayOdaklilik: 75, teknoloji: 60 },
      calisma: { hareketlilik: 60, yerCesitliligi: 70, insanEtkilesimi: 65, gorevDegiskenligi: 65, saatEsnekligi: 40, uygulamalilik: 80, seyahat: 70, ekipYonetimi: 65 },
      deger: { kariyerYukselme: 70, somutUretim: 65, isGuvencesi: 60, duzen: 70, yuksekGelir: 60, ozelHayat: 40 },
      yol: { uzunEgitim: 35, yogunTempo: 80, sehirDegisimi: 75, rekabetOrtami: 65 },
      cekirdek: [
        { ilgi: "planlama", w: 3 }, { ilgi: "organizasyon", w: 2 },
        { ilgi: "krizCozme" }, { calisma: "yerCesitliligi" },
        { yol: "yogunTempo", w: 2 }, { kosul: "surekliSeyahat" },
      ],
      kosullar: ["surekliSeyahat", "geceNobet", "yuksekStres", "surekliMasa"],
      dersler: ["matematik", "cografya", "bilgisayar", "organizasyon"],
    },
    {
      id: "guvenlik-acil", ad: "Güvenlik, Acil Durum ve Afet", alan: "Hizmet ve Uygulama",
      ozet: "Acil müdahale, afet yönetimi ve güvenlik; kriz anında hızlı ve soğukkanlı çalışma isteyen alan.",
      ilgi: { krizCozme: 100, bedenselBeceri: 80, empati: 75, organizasyon: 80, planlama: 75, problemCozme: 75, liderlik: 70, detayOdaklilik: 70 },
      calisma: { hareketlilik: 95, yerCesitliligi: 80, insanEtkilesimi: 80, gorevDegiskenligi: 85, saatEsnekligi: 45, ortamCanliligi: 85, uygulamalilik: 95, ekipYonetimi: 65 },
      deger: { toplumsalFayda: 95, insanlaraYardim: 95, isGuvencesi: 75, somutUretim: 55, ozelHayat: 25, yuksekGelir: 40 },
      yol: { uzunEgitim: 30, zorSinav: 60, yogunTempo: 90, sehirDegisimi: 80 },
      cekirdek: [
        { ilgi: "krizCozme", w: 3 }, { ilgi: "bedenselBeceri", w: 2 },
        { calisma: "gorevDegiskenligi", w: 2 }, { kosul: "geceNobet", w: 2 },
        { kosul: "fizikselYorucu" },
      ],
      kosullar: ["geceNobet", "kanHastalik", "yuksekStres", "fizikselYorucu", "surekliAyakta", "surekliDegisen"],
      dersler: ["biyoloji", "spor", "cografya", "grupCalismasi"],
    },
    {
      id: "spor-hareket", ad: "Spor ve Hareket", alan: "Hizmet ve Uygulama",
      ozet: "Antrenörlük, spor bilimleri ve spor yönetimi; bedenle ve insanla birlikte çalışılan alan.",
      ilgi: { bedenselBeceri: 100, ogretme: 85, sosyalEtkilesim: 80, liderlik: 80, empati: 70, organizasyon: 70, canliBilimleri: 70, planlama: 65 },
      calisma: { hareketlilik: 100, yerCesitliligi: 70, insanEtkilesimi: 90, gorevDegiskenligi: 65, saatEsnekligi: 65, ortamCanliligi: 90, uygulamalilik: 100, seyahat: 65 },
      deger: { insanlaraYardim: 75, somutUretim: 60, bagimsizlik: 65, toplumsalFayda: 70, isGuvencesi: 40, yuksekGelir: 40 },
      yol: { uzunEgitim: 40, yogunTempo: 75, rekabetOrtami: 80, dusukBaslangic: 75, belirsizlik: 70, sehirDegisimi: 70 },
      cekirdek: [
        { ilgi: "bedenselBeceri", w: 3 }, { ilgi: "ogretme", w: 2 },
        { calisma: "hareketlilik", w: 2 }, { yol: "belirsizlik" },
        { kosul: "fizikselYorucu", w: 2 },
      ],
      kosullar: ["fizikselYorucu", "surekliAyakta", "belirsizGelir", "cokRekabetci", "yogunInsan"],
      dersler: ["spor", "biyoloji", "grupCalismasi", "organizasyon"],
    },

    /* ────────────── İNSAN, TOPLUM VE DÜŞÜNCE BİLİMLERİ ───────── */
    {
      /* id tarihsel olarak "sosyal-beseri"dir ve KORUNUR: üretilmiş
         katalogdaki aileId değerleri ile kullanıcıların kayıtlı favori/açık
         aile durumu bu kimliğe bağlıdır. Görünen ad üst alanla aynıdır,
         çünkü bu aile artık o üst alanın tamamını (sosyal-beşerî bilimler,
         felsefe/düşünce ve ilahiyat programları) tek başına kapsar. */
      id: "sosyal-beseri", ad: "İnsan, Toplum ve Düşünce Bilimleri", alan: "İnsan, Toplum ve Düşünce Bilimleri",
      ozet: "Toplumun, tarihin, mekânın, inanç ve düşünce geleneklerinin nasıl şekillendiğini "
        + "metin ve araştırma üzerinden inceleyen alan.",
      ilgi: { arastirma: 95, analitikDusunme: 85, yaziliIfade: 85, sozelIfade: 75, detayOdaklilik: 75, empati: 65, dogaIlgisi: 50 },
      calisma: { hareketlilik: 30, insanEtkilesimi: 50, gorevDegiskenligi: 45, saatEsnekligi: 65, ortamCanliligi: 30, uygulamalilik: 35 },
      deger: { bilgiUretme: 95, surekliOgrenme: 90, toplumsalFayda: 75, bagimsizlik: 65, ozelHayat: 60, yuksekGelir: 30, isGuvencesi: 45 },
      yol: { uzunEgitim: 60, egitimSonrasiEgitim: 85, zorSinav: 65, dusukBaslangic: 80, belirsizlik: 75 },
      cekirdek: [
        { ilgi: "arastirma", w: 3 }, { ilgi: "yaziliIfade", w: 2 },
        { ilgi: "analitikDusunme", w: 2 }, { calisma: "uygulamalilik" },
        { yol: "egitimSonrasiEgitim", w: 2 }, { kosul: "yogunOkumaYazma", w: 2 },
      ],
      kosullar: ["yogunOkumaYazma", "surekliMasa", "belirsizGelir"],
      dersler: ["tarih", "cografya", "felsefe", "turkce", "arastirma"],
    },
  ];

  /* ══════════ PROGRAM DÜZEYİ ÇEKİRDEK KRİTERLER ══════════

     Ana eşleştirme AİLE düzeyinde kalır (dört eksen, %40/25/20/15) ve bu
     tablo ona hiç karışmaz: sıralamaya, aile puanına ya da seviye
     etiketine etkisi YOKTUR. Yalnız öğrenci ailenin altındaki belirli bir
     bölümü incelediğinde çalışan İKİNCİ bir kontroldür.

     Neden gerekli: "İlahiyat ve Din Bilimleri" daha önce 2 programlık
     bağımsız bir aileydi ve 11 programlık geniş ailelerle aynı düzeyde
     sıralanıyordu. Artık İnsan, Toplum ve Düşünce Bilimleri ailesinin
     içinde bir programdır; kendine özgü akademik gereklilikleri de
     program düzeyinde, açıklayıcı bir katman olarak sorulur.

     Kriter biçimi ailelerdekiyle AYNIDIR (motor aynı kriterKarsilama
     fonksiyonunu kullanır), bu yüzden ayrı bir puanlama mantığı doğmaz.

     Ölçülmeyecek olanlar bilinçli olarak dışarıdadır: kişisel dinî inanç,
     dindarlık, ibadet alışkanlığı, dinî aidiyet ve "yardımseverlik /
     hitabet / genel sosyal beceri" gibi onlarca alana birden uyan genel
     özellikler. Buradaki her kriter yalnız AKADEMİK ve ÇALIŞMA BİÇİMİNE
     ilişkindir. */
  var PROGRAM_CEKIRDEK = {
    ilahiyat: {
      baslik: "İlahiyat özelinde düşünmen gereken noktalar",
      giris: "İlahiyat, bu alanın içinde metin ve kaynak çalışmasının en yoğun "
        + "olduğu programlardan biridir. Aşağıdakiler senin profilinle bu programın "
        + "günlük akademik yapısını karşılaştırır.",
      kriterler: [
        { kosul: "yogunOkumaYazma", w: 3, ad: "Yoğun okuma ve metin çalışmasına açıklık" },
        { ilgi: "arastirma", w: 3, ad: "Araştırma" },
        { ilgi: "detayOdaklilik", w: 2, ad: "Ayrıntılı metin inceleme" },
        { ilgi: "yaziliIfade", w: 2, ad: "Yazılı ifade" },
        { ilgi: "analitikDusunme", w: 2, ad: "Kavramsal ve soyut düşünme" },
        { ilgi: "dilYatkinligi", w: 2, ad: "Kaynak dili öğrenmeye açıklık" },
        { yol: "uzunEgitim", w: 1, ad: "Uzun ve düzenli akademik çalışma" },
      ],
    },
    "islami-ilimler": {
      baslik: "İslami İlimler özelinde düşünmen gereken noktalar",
      giris: "İslami İlimler, kaynak metinlerle doğrudan çalışmayı ve kaynak dili "
        + "öğrenmeyi İlahiyat'tan da ileri düzeyde bekleyen bir programdır.",
      kriterler: [
        { kosul: "yogunOkumaYazma", w: 3, ad: "Yoğun okuma ve metin çalışmasına açıklık" },
        { ilgi: "dilYatkinligi", w: 3, ad: "Kaynak dili öğrenmeye açıklık" },
        { ilgi: "arastirma", w: 3, ad: "Araştırma" },
        { ilgi: "detayOdaklilik", w: 2, ad: "Ayrıntılı metin inceleme" },
        { ilgi: "yaziliIfade", w: 2, ad: "Yazılı ifade" },
        { ilgi: "analitikDusunme", w: 2, ad: "Kavramsal ve soyut düşünme" },
        { yol: "uzunEgitim", w: 1, ad: "Uzun ve düzenli akademik çalışma" },
      ],
    },
  };

  /* Kariyer alanları — sonuç ekranında aileler bu başlıklar altında
     gruplanır. Sıra ekran sırasıdır. */
  var ALANLAR = [
    "Dil, İletişim ve Kültür",
    "Eğitim ve İnsan Gelişimi",
    "Hukuk, Kamu ve Yönetim",
    "Sanat ve Tasarım",
    "Mühendislik ve Teknoloji",
    "Temel Bilimler",
    "Sağlık",
    "Doğa, Tarım ve Çevre",
    "Hizmet ve Uygulama",
    "İnsan, Toplum ve Düşünce Bilimleri",
  ];

  kok.KP_AILELER = { surum: 1, liste: AILELER, alanlar: ALANLAR, programCekirdek: PROGRAM_CEKIRDEK };
  if (typeof module !== "undefined" && module.exports) module.exports = kok.KP_AILELER;
})(typeof window !== "undefined" ? window : globalThis);
