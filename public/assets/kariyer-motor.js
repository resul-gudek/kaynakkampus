/* ══════════════════════════════════════════════════════════════════
   KARİYER PUSULAM — EŞLEŞTİRME MOTORU
   ──────────────────────────────────────────────────────────────────
   Tamamen deterministik: aynı cevaplar her zaman aynı sonucu verir.
   Yapay zekâ, dış servis ya da rastgelelik yoktur.

   Akış
     cevaplar → profilCikar()  → dört eksenli öğrenci profili
     profil   → aileleriPuanla() → program ailesi uyumları
     aile     → programlar()    → o ailedeki doğrulanmış bölümler

   Puanlama kuralları (ağırlıklar assets/kariyer-olcek.js içindedir)
     ilgi    : ailenin önem verdiği boyutlarda öğrencinin ağırlıklı ortalaması
     calisma : ailenin tipik konumu ile öğrenci tercihi arasındaki uzaklık
     deger   : öğrencinin önemsediği ama alanın sunmadığı değerlerin açığı
     yol     : alanın talep ettiği emeğin öğrencinin toleransını aşan kısmı

   Bölüm 3 (ders başarısı) hiçbir uyum puanına girmez; ayrı bir
   "akademik hazırlık" göstergesi olarak döner.
   ══════════════════════════════════════════════════════════════════ */
(function (kok) {
  "use strict";

  var OLCEK = kok.KP_OLCEK, AILE = kok.KP_AILELER, PRG = kok.KP_PROGRAMLAR;
  if (!OLCEK || !AILE || !PRG) throw new Error("Kariyer Pusulam veri dosyaları yüklenmedi");
  var A = OLCEK.PUANLAMA;

  function bolum(id) {
    for (var i = 0; i < OLCEK.BOLUMLER.length; i++) if (OLCEK.BOLUMLER[i].id === id) return OLCEK.BOLUMLER[i];
    return null;
  }
  function sayi(n) { return Math.max(0, Math.min(100, Math.round(n))); }

  /* ── Aile başına program dizini (bir kez kurulur) ─────────────── */
  var AILE_PROGRAM = {};
  PRG.liste.forEach(function (p) { (AILE_PROGRAM[p.aileId] = AILE_PROGRAM[p.aileId] || []).push(p); });
  var AILE_HARITA = {};
  AILE.liste.forEach(function (f) { AILE_HARITA[f.id] = f; });
  /* Bir aile iki koşuldan biriyle sonuç, arama ve rapor dışında kalır:
     · aktif: false ile açıkça devre dışı bırakılmışsa,
     · katalogda hiç programı yoksa (veri güncellemesi sonrası boş kalmışsa).
     İkinci koşul, aktif işaretini güncellemeyi unutmaya karşı emniyettir. */
  function aileEtkinMi(f) {
    return f.aktif !== false && (AILE_PROGRAM[f.id] || []).length > 0;
  }
  var ETKIN_AILELER = AILE.liste.filter(aileEtkinMi);

  /* ══════════ 1. ÖĞRENCİ PROFİLİ ══════════ */

  /** Bölüm 1/2/4 → ilgi boyutları (0–100; en güçlü boyutlar 100 çevresinde toplanır). */
  function ilgiProfili(cevaplar) {
    var ham = {};
    function yaz(agirliklar, carpan) {
      for (var d in agirliklar) if (Object.prototype.hasOwnProperty.call(agirliklar, d)) {
        ham[d] = (ham[d] || 0) + agirliklar[d] * carpan;
      }
    }
    ["hoslandiklarim", "farkEdilen"].forEach(function (bid) {
      var b = bolum(bid), secili = (cevaplar[bid] && cevaplar[bid].secili) || {};
      b.secenekler.forEach(function (s) { if (secili[s.id]) yaz(s.p, 1); });
    });
    var by = bolum("yeteneklerim"), yc = (cevaplar.yeteneklerim && cevaplar.yeteneklerim.secili) || {};
    by.secenekler.forEach(function (s) {
      var duzey = yc[s.id];
      if (!duzey) return;
      var tanim = by.duzeyler.filter(function (d) { return d.id === duzey; })[0];
      yaz(s.p, tanim ? tanim.carpan : 1);
    });

    // Kendi içinde ölçekleme: az ya da çok seçim yapan öğrenciler
    // karşılaştırılabilir kalsın diye profilin şekli korunur.
    var sirali = [], d;
    for (d in ham) sirali.push(ham[d]);
    sirali.sort(function (a, b) { return b - a; });
    var tepe = sirali.slice(0, A.ilgiOlcekTepe);
    var olcek = tepe.length ? tepe.reduce(function (t, v) { return t + v; }, 0) / tepe.length : 0;
    var profil = {};
    for (d in OLCEK.BOYUTLAR.ilgi) profil[d] = olcek ? sayi((ham[d] || 0) / olcek * 100) : 0;
    return profil;
  }

  /** Bölüm 5 → çalışma tercihleri (0 = sol kutup, 100 = sağ kutup). */
  function calismaProfili(cevaplar) {
    var c = (cevaplar.calismaHayati && cevaplar.calismaHayati.deger) || {}, profil = {}, sayac = 0;
    bolum("calismaHayati").secenekler.forEach(function (s) {
      if (c[s.id] != null) { profil[s.id] = A.kaydiracPuan[c[s.id]]; sayac++; }
    });
    return { profil: profil, cevaplanan: sayac };
  }

  /** Bölüm 6+7+8 → değer önemleri; aynı boyuta birden çok madde varsa ortalanır. */
  function degerProfili(cevaplar) {
    var toplam = {}, adet = {}, sayac = 0;
    ["yasamBeklentileri", "maddiBeklentiler", "meslekiDegerler"].forEach(function (bid) {
      var b = bolum(bid), c = (cevaplar[bid] && cevaplar[bid].deger) || {};
      b.secenekler.forEach(function (s) {
        if (c[s.id] == null) return;
        sayac++;
        var puan = A.onemPuan[c[s.id]];
        for (var d in s.p) if (Object.prototype.hasOwnProperty.call(s.p, d)) {
          // Maddenin boyuta katkı ağırlığı (1–3) ortalamada da kullanılır
          toplam[d] = (toplam[d] || 0) + puan * s.p[d];
          adet[d] = (adet[d] || 0) + s.p[d];
        }
      });
    });
    var profil = {};
    for (var d in OLCEK.BOYUTLAR.deger) profil[d] = adet[d] ? sayi(toplam[d] / adet[d]) : null;
    return { profil: profil, cevaplanan: sayac };
  }

  /** Bölüm 9 → yol/emek toleransları. */
  function yolProfili(cevaplar) {
    var b = bolum("emek"), c = (cevaplar.emek && cevaplar.emek.deger) || {};
    var toplam = {}, adet = {}, sayac = 0;
    b.secenekler.forEach(function (s) {
      if (c[s.id] == null) return;
      sayac++;
      var puan = A.onemPuan[c[s.id]];
      for (var d in s.p) if (Object.prototype.hasOwnProperty.call(s.p, d)) {
        toplam[d] = (toplam[d] || 0) + puan * s.p[d];
        adet[d] = (adet[d] || 0) + s.p[d];
      }
    });
    var profil = {};
    for (var d in OLCEK.BOYUTLAR.yol) profil[d] = adet[d] ? sayi(toplam[d] / adet[d]) : null;
    return { profil: profil, cevaplanan: sayac };
  }

  /** Bölüm 3 → akademik hazırlık (kariyer uyumuna girmez). */
  function akademikProfil(cevaplar) {
    var b = bolum("iyiAlanlar"), c = (cevaplar.iyiAlanlar && cevaplar.iyiAlanlar.deger) || {};
    var profil = {}, sayac = 0;
    b.secenekler.forEach(function (s) {
      if (c[s.id] == null) return;
      var t = b.duzeyler.filter(function (d) { return d.id === c[s.id]; })[0];
      profil[s.id] = t ? t.puan : null;
      sayac++;
    });
    return { profil: profil, cevaplanan: sayac };
  }

  function profilCikar(cevaplar) {
    var calisma = calismaProfili(cevaplar), deger = degerProfili(cevaplar);
    var yol = yolProfili(cevaplar), akademik = akademikProfil(cevaplar);
    return {
      ilgi: ilgiProfili(cevaplar),
      calisma: calisma.profil,
      deger: deger.profil,
      yol: yol.profil,
      akademik: akademik.profil,
      kosullar: (cevaplar.istemediklerim && cevaplar.istemediklerim.secili) || {},
      serbest: {
        hoslandiklarim: (cevaplar.hoslandiklarim && cevaplar.hoslandiklarim.serbest) || "",
        yeteneklerim: (cevaplar.yeteneklerim && cevaplar.yeteneklerim.serbest) || "",
        farkEdilen: (cevaplar.farkEdilen && cevaplar.farkEdilen.serbest) || "",
      },
      cevaplanan: {
        calisma: calisma.cevaplanan, deger: deger.cevaplanan,
        yol: yol.cevaplanan, akademik: akademik.cevaplanan,
      },
    };
  }

  /* ══════════ 2. GEÇERLİLİK ══════════ */

  /** Cevaplanan madde sayısını bölüm tipine göre sayar. */
  function bolumCevapSayisi(b, cevaplar) {
    var c = cevaplar[b.id] || {};
    if (b.tip === "coklu" || b.tip === "duzey" || b.tip === "engel") {
      return Object.keys(c.secili || {}).filter(function (k) { return c.secili[k]; }).length;
    }
    return Object.keys(c.deger || {}).filter(function (k) { return c.deger[k] != null; }).length;
  }

  function eksikler(cevaplar) {
    return OLCEK.GECERLILIK.map(function (k) {
      var b = bolum(k.bolum), adet = bolumCevapSayisi(b, cevaplar);
      return adet >= k.enAz ? null : { bolum: k.bolum, baslik: b.baslik, mesaj: k.mesaj, mevcut: adet, enAz: k.enAz };
    }).filter(Boolean);
  }

  /* ══════════ 3. AİLE UYUMU ══════════ */

  function ilgiUyumu(profil, aile) {
    var toplam = 0, agirlik = 0;
    for (var d in aile.ilgi) if (Object.prototype.hasOwnProperty.call(aile.ilgi, d)) {
      var w = aile.ilgi[d];
      toplam += w * (profil.ilgi[d] || 0);
      agirlik += w;
    }
    return agirlik ? toplam / agirlik : A.yansizPuan;
  }

  function calismaUyumu(profil, aile) {
    var fark = 0, adet = 0;
    for (var d in aile.calisma) if (Object.prototype.hasOwnProperty.call(aile.calisma, d)) {
      if (profil.calisma[d] == null) continue;
      fark += Math.abs(aile.calisma[d] - profil.calisma[d]);
      adet++;
    }
    return adet ? 100 - fark / adet : A.yansizPuan;
  }

  function degerUyumu(profil, aile) {
    // Yalnız öğrencinin önemsediği ama alanın sunmadığı değerler puan düşürür.
    var acik = 0, agirlik = 0;
    for (var d in OLCEK.BOYUTLAR.deger) {
      var istek = profil.deger[d];
      if (istek == null) continue;
      var sunum = aile.deger[d] == null ? A.degerVarsayilan : aile.deger[d];
      var w = istek / 100;
      acik += w * Math.max(0, istek - sunum);
      agirlik += w;
    }
    return agirlik ? 100 - acik / agirlik : A.yansizPuan;
  }

  function yolUyumu(profil, aile) {
    var asim = 0, adet = 0;
    for (var d in aile.yol) if (Object.prototype.hasOwnProperty.call(aile.yol, d)) {
      var tolerans = profil.yol[d];
      if (tolerans == null) continue;
      asim += Math.max(0, aile.yol[d] - tolerans);
      adet++;
    }
    return adet ? 100 - asim / adet : A.yansizPuan;
  }

  /** "Kesin engel" işaretli koşullar: eleme değil, sınırlı ceza + uyarı. */
  function engelCezasi(profil, aile) {
    var kesin = [], esnek = [];
    (aile.kosullar || []).forEach(function (k) {
      var d = profil.kosullar[k];
      if (d === "kesin") kesin.push(k);
      else if (d === "esnek") esnek.push(k);
    });
    var ceza = Math.min(kesin.length * A.kesinEngelCezasi, A.kesinEngelCezaTavani)
      + esnek.length * A.esnekEngelCezasi;
    return { ceza: ceza, kesin: kesin, esnek: esnek };
  }

  function seviye(puan) {
    for (var i = 0; i < A.seviyeler.length; i++) if (puan >= A.seviyeler[i].alt) return A.seviyeler[i];
    return A.seviyeler[A.seviyeler.length - 1];
  }

  /* ── Kural tabanlı açıklamalar (şablon; metin üretilmez, seçilir) ── */

  function gerekceler(profil, aile) {
    var adaylar = [];
    for (var d in aile.ilgi) if (Object.prototype.hasOwnProperty.call(aile.ilgi, d)) {
      var w = aile.ilgi[d], o = profil.ilgi[d] || 0;
      if (w >= A.aileOnemEsigi && o >= A.gerekceEsigi) adaylar.push({ d: d, skor: w * o, ad: OLCEK.BOYUTLAR.ilgi[d] });
    }
    adaylar.sort(function (a, b) { return b.skor - a.skor || a.d.localeCompare(b.d); });
    return adaylar.slice(0, A.gerekceBoyutSayisi).map(function (x) { return x.ad; });
  }

  function celiskiler(profil, aile, engel) {
    var liste = [];

    // 1) Çalışma koşulu farkları
    var calismaFark = [];
    for (var d in aile.calisma) if (Object.prototype.hasOwnProperty.call(aile.calisma, d)) {
      if (profil.calisma[d] == null) continue;
      var fark = aile.calisma[d] - profil.calisma[d];
      if (Math.abs(fark) >= 40) calismaFark.push({ d: d, fark: fark });
    }
    calismaFark.sort(function (a, b) { return Math.abs(b.fark) - Math.abs(a.fark) || a.d.localeCompare(b.d); });
    calismaFark.slice(0, 2).forEach(function (x) {
      var s = bolum("calismaHayati").secenekler.filter(function (o) { return o.id === x.d; })[0];
      var alanTarafi = x.fark > 0 ? s.sag : s.sol;
      var senTarafi = x.fark > 0 ? s.sol : s.sag;
      liste.push({
        tur: "calisma",
        metin: "Bu alan günlük çalışmada daha çok “" + alanTarafi.toLocaleLowerCase("tr") +
          "” tarafındadır; sen “" + senTarafi.toLocaleLowerCase("tr") + "” tarafını işaretledin.",
      });
    });

    // 2) Karşılanmayan değerler
    var degerAcik = [];
    // Uyarı yalnız ailenin AÇIKÇA düşük bildirdiği değerler için çıkar;
    // hiç bildirilmemiş bir değerden uyarı üretmek uydurma olurdu.
    for (var v in aile.deger) if (Object.prototype.hasOwnProperty.call(aile.deger, v)) {
      var istek = profil.deger[v];
      if (istek == null) continue;
      if (istek >= 75 && aile.deger[v] <= 45) degerAcik.push({ d: v, acik: istek - aile.deger[v] });
    }
    degerAcik.sort(function (a, b) { return b.acik - a.acik || a.d.localeCompare(b.d); });
    degerAcik.slice(0, 2).forEach(function (x) {
      liste.push({
        tur: "deger",
        metin: "“" + OLCEK.BOYUTLAR.deger[x.d] + "” senin için önemli görünüyor; bu alanda bunun " +
          "her zaman kolay karşılanmadığı görülür. Alanı araştırırken bu tarafına özellikle bak.",
      });
    });

    // 3) Yolun talebi toleransı aşıyorsa
    var yolAsim = [];
    for (var y in aile.yol) if (Object.prototype.hasOwnProperty.call(aile.yol, y)) {
      var tol = profil.yol[y];
      if (tol == null) continue;
      if (aile.yol[y] >= 70 && tol <= 40) yolAsim.push({ d: y, asim: aile.yol[y] - tol });
    }
    yolAsim.sort(function (a, b) { return b.asim - a.asim || a.d.localeCompare(b.d); });
    yolAsim.slice(0, 2).forEach(function (x) {
      liste.push({
        tur: "yol",
        metin: "Bu alanın yolu genellikle “" + OLCEK.BOYUTLAR.yol[x.d].toLocaleLowerCase("tr") +
          "” gerektirir; sen bunu şu an zorlanacağın bir şey olarak işaretledin.",
      });
    });

    // 4) İstemediğin koşullar
    engel.kesin.forEach(function (k) {
      liste.push({
        tur: "engel",
        metin: "“" + OLCEK.KOSULLAR[k] + "” senin için kesin engel. Bu alanla ilişkili bazı mesleklerde " +
          "bu koşul sık karşılaşılan bir durumdur; günlük çalışma koşullarını özellikle araştırman önemli.",
      });
    });
    engel.esnek.forEach(function (k) {
      liste.push({
        tur: "engel-esnek",
        metin: "“" + OLCEK.KOSULLAR[k] + "” senin tercih etmediğin bir koşul; bu alanda zaman zaman " +
          "karşına çıkabilir.",
      });
    });

    return liste;
  }

  /** Akademik hazırlık — uyum puanından bağımsız, ayrı gösterilir. */
  function akademikHazirlik(profil, aile) {
    var toplam = 0, adet = 0;
    (aile.dersler || []).forEach(function (d) {
      if (profil.akademik[d] == null) return;
      toplam += profil.akademik[d];
      adet++;
    });
    if (!adet) return null;
    var ort = toplam / adet;
    var etiket = ort >= 82 ? "Güçlü" : ort >= 65 ? "İyi" : ort >= 45 ? "Orta" : "Geliştirmeye açık";
    return {
      puan: sayi(ort), etiket: etiket,
      dersler: (aile.dersler || []).filter(function (d) { return profil.akademik[d] != null; })
        .map(function (d) { return { id: d, ad: OLCEK.DERSLER[d], puan: profil.akademik[d] }; }),
    };
  }

  /** Araştırma soruları — ailenin profilinden kurallı biçimde seçilir. */
  function arastirmaSorulari(aile) {
    var s = ["Bu alandaki bölümlerin ders içerikleri birbirinden ne kadar farklı?",
      "Mezunlar hangi işleri yapıyor, ilk iş genelde nerede bulunuyor?"];
    if ((aile.yol.uzunEgitim || 0) >= 70) s.push("Eğitim kaç yıl sürüyor, sonrasında uzmanlık ya da ek sınav gerekiyor mu?");
    if ((aile.yol.zorSinav || 0) >= 75) s.push("Bu alana girmek ve alanda ilerlemek için hangi sınavlar gerekiyor?");
    if ((aile.calisma.seyahat || 0) >= 70 || (aile.yol.sehirDegisimi || 0) >= 80) s.push("Çalışma hayatı hangi şehirlerde ve ne kadar seyahatle geçiyor?");
    if ((aile.deger.isGuvencesi || 0) <= 40) s.push("Bu alanda gelir ne kadar düzenli, serbest çalışma yaygın mı?");
    if ((aile.calisma.girisimcilik || 0) >= 70) s.push("Kendi işini kuran mezunlar ne yapıyor, bu ne kadar yaygın?");
    if ((aile.yol.egitimSonrasiEgitim || 0) >= 80) s.push("Lisans yeterli mi, yoksa yüksek lisans/doktora fiilen şart mı?");
    return s.slice(0, 5);
  }

  /** Bir aileyi öğrenci profiline karşı puanlar. */
  function aileyiPuanla(profil, aile) {
    var e = {
      ilgi: ilgiUyumu(profil, aile),
      calisma: calismaUyumu(profil, aile),
      deger: degerUyumu(profil, aile),
      yol: yolUyumu(profil, aile),
    };
    var engel = engelCezasi(profil, aile);
    var genel = e.ilgi * A.eksenAgirlik.ilgi + e.calisma * A.eksenAgirlik.calisma
      + e.deger * A.eksenAgirlik.deger + e.yol * A.eksenAgirlik.yol - engel.ceza;
    var puan = sayi(genel);
    return {
      aile: aile,
      genel: puan,
      seviye: seviye(puan),
      eksenler: { ilgi: sayi(e.ilgi), calisma: sayi(e.calisma), deger: sayi(e.deger), yol: sayi(e.yol) },
      engel: engel,
      gerekceler: gerekceler(profil, aile),
      celiskiler: celiskiler(profil, aile, engel),
      akademik: akademikHazirlik(profil, aile),
      sorular: arastirmaSorulari(aile),
      programSayisi: (AILE_PROGRAM[aile.id] || []).length,
    };
  }

  /** Bütün aileleri puanlar, uyumu yüksekten düşüğe sıralar. */
  function aileleriPuanla(profil) {
    return ETKIN_AILELER.map(function (f) { return aileyiPuanla(profil, f); })
      .sort(function (a, b) { return b.genel - a.genel || a.aile.ad.localeCompare(b.aile.ad, "tr"); });
  }

  /* ══════════ 4. PROGRAM KATALOĞU ══════════ */

  function programlar(aileId, filtre) {
    var l = (AILE_PROGRAM[aileId] || []).slice();
    if (filtre && filtre.duzey) l = l.filter(function (p) { return p.duzey.indexOf(filtre.duzey) >= 0; });
    if (filtre && filtre.metin) {
      var q = ara(filtre.metin);
      l = l.filter(function (p) { return anahtar(p.ad).indexOf(q) >= 0; });
    }
    return l.sort(function (a, b) { return a.ad.localeCompare(b.ad, "tr"); });
  }

  /* Türkçe duyarsız arama anahtarı */
  var HARF = { ç: "c", ğ: "g", ı: "i", i: "i", İ: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
  function anahtar(s) {
    return String(s).toLocaleLowerCase("tr").replace(/[çğıöşüâîûİi]/g, function (c) { return HARF[c] || c; });
  }
  function ara(s) { return anahtar(String(s).trim()); }

  /** Bölüm arama — ad içinde geçen doğrulanmış programlar.
     Devre dışı ailenin programları aranamaz: o alanı sunmuyorsak
     karşılaştırma da yapamayız. Bugün böyle bir program yok. */
  function programAra(metin, limit) {
    var q = ara(metin);
    if (q.length < 2) return [];
    var sonuc = PRG.liste.filter(function (p) {
      return anahtar(p.ad).indexOf(q) >= 0
        && aileEtkinMi(AILE_HARITA[p.aileId] || { id: p.aileId });
    });
    sonuc.sort(function (a, b) {
      var fa = anahtar(a.ad).indexOf(q), fb = anahtar(b.ad).indexOf(q);
      return fa - fb || a.ad.localeCompare(b.ad, "tr");
    });
    return sonuc.slice(0, limit || 30);
  }

  var DUZEY_ADI = { lisans: "Lisans", onlisans: "Ön lisans" };
  /** "Lisans (EA) / Ön lisans (TYT)" — düzey ve o düzeyin puan türü birlikte.
     Aynı ad iki düzeyde olabildiği için puan türlerini birleştirip yazmak
     yanıltıcı olur; kılavuzda puan türü olmayan programda parantez yazılmaz. */
  function duzeyMetni(prg) {
    return (prg.duzey || []).map(function (d) {
      var t = (prg.duzeyPuan && prg.duzeyPuan[d]) || [];
      return DUZEY_ADI[d] + (t.length ? " (" + t.join(", ") + ")" : "");
    }).join(" / ");
  }

  function programBul(id) {
    for (var i = 0; i < PRG.liste.length; i++) if (PRG.liste[i].id === id) return PRG.liste[i];
    return null;
  }

  kok.KariyerMotor = {
    profilCikar: profilCikar,
    eksikler: eksikler,
    bolumCevapSayisi: bolumCevapSayisi,
    aileleriPuanla: aileleriPuanla,
    aileyiPuanla: aileyiPuanla,
    aileBul: function (id) { return AILE_HARITA[id] || null; },
    programlar: programlar,
    programAra: programAra,
    programBul: programBul,
    duzeyMetni: duzeyMetni,
    etkinAileSayisi: ETKIN_AILELER.length,
    anahtar: anahtar,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = kok.KariyerMotor;
})(typeof window !== "undefined" ? window : globalThis);
