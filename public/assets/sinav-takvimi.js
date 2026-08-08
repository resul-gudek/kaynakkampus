/* ══════════════════════════════════════════════════════════════════════
   Güncel Sınav Takvimi — istemci tarafı durum motoru ve çizim katmanı

   Veri sırası:
     1) /api/sinav-takvimi      → ÖSYM tablosu + MEB duyuruları, sunucuda
                                  taze çekilir (CORS sorunu yok)
     2) assets/sinav-takvimi.json → çekirdek dosya (Next çalışmıyorsa)
     3) localStorage önbelleği   → ikisi de yoksa son bilinen veri

   Durum etiketleri tarihlerden HESAPLANIR; veride tutulmaz. Böylece
   takvim güncellenmese bile "Başvurular Açık → Kapandı → Sonuç Açıklandı"
   geçişleri kendiliğinden doğru olur.

   Kullanım — işaretlemede kap elemanına data-kk-sinav yazmak yeterli:
     <div data-kk-sinav="serit"  data-adet="6"></div>
     <div data-kk-sinav="duyurular" data-adet="6"></div>
     <div data-kk-sinav="liste"></div>          (detay sayfası)
     <div data-kk-sinav="ozet"></div>
     <span data-kk-sinav="canli"></span>
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var API = "/api/sinav-takvimi";
  var CEKIRDEK = "assets/sinav-takvimi.json";
  var ONBELLEK_ANAHTAR = "kk-sinav-takvimi";
  var ONBELLEK_TTL = 12 * 60 * 60 * 1000; // 12 saat
  var DETAY_SAYFA = "sinav-takvimi.html";

  /* ══════════ SINIFLANDIRMA ══════════
     Sınav adından grup/simge/kitle çıkarılır. ÖSYM takvimine yeni bir
     sınav eklendiğinde de doğru gruba düşsün diye desen tabanlı; sıra
     önemlidir (ilk uyan kazanır). */
  var SINIFLAR = [
    { grup: "yokdil", ad: "YÖKDİL", ikon: "📖", kitle: "Akademik dil", onemli: true, desen: /Y[ÖO]KD[İI]L/i },
    { grup: "yds", ad: "YDS / e-YDS", ikon: "🌍", kitle: "Yabancı dil", onemli: true, desen: /\bYDS\b|e-YDS|YDTS|e-TEP|\bTEP\b/i },
    { grup: "yks", ad: "YKS", ikon: "🎓", kitle: "12. sınıf ve mezun", onemli: true, desen: /\bYKS\b|\bTYT\b|\bAYT\b/i },
    { grup: "msu", ad: "MSÜ", ikon: "🎖️", kitle: "Lise son ve mezun", onemli: true, desen: /MS[ÜU]\b/ },
    { grup: "lgs", ad: "LGS", ikon: "🏫", kitle: "8. sınıf", onemli: true, desen: /\bLGS\b/i },
    { grup: "iokbs", ad: "İOKBS", ikon: "🎯", kitle: "5–11. sınıf", onemli: true, desen: /[İI]OKBS|Burslulu/i },
    { grup: "ags", ad: "AGS / ÖABT", ikon: "👩‍🏫", kitle: "Öğretmen adayı", onemli: true, desen: /\bAGS\b|[ÖO]ABT/i },
    { grup: "ekpss", ad: "EKPSS", ikon: "♿", kitle: "Engelli kamu adayı", onemli: true, desen: /EKPSS/i },
    { grup: "kpss", ad: "KPSS", ikon: "🏛️", kitle: "Kamu adayı", onemli: true, desen: /KPSS|DHBT/i },
    { grup: "ales", ad: "ALES", ikon: "📐", kitle: "Lisansüstü aday", onemli: true, desen: /ALES/i },
    { grup: "dgs", ad: "DGS", ikon: "🪜", kitle: "Ön lisans mezunu", onemli: true, desen: /\bDGS\b/i },
    { grup: "tus", ad: "TUS", ikon: "🩺", kitle: "Tıp mezunu", onemli: true, desen: /\bTUS\b/i },
    { grup: "dus", ad: "DUS", ikon: "🦷", kitle: "Diş hekimliği mezunu", onemli: true, desen: /\bDUS\b/i },
    { grup: "uzmanlik", ad: "Uzmanlık / STS", ikon: "🧬", kitle: "Sağlık meslekleri", onemli: false, desen: /YDUS|\bEUS\b|\bSTS\b/i },
    { grup: "yos", ad: "YÖS", ikon: "✈️", kitle: "Uluslararası öğrenci", onemli: false, desen: /Y[ÖO]S\b/i },
    { grup: "hukuk", ad: "HMGS", ikon: "⚖️", kitle: "Hukuk mezunu", onemli: false, desen: /HMGS/i },
    { grup: "meb", ad: "MEB Merkezî Sınav", ikon: "🏫", kitle: "MEB sınavları", onemli: true, desen: /\bMEB\b|A[çc][ıi]k\s*[ÖO][ğg]retim|A[ÖO][OL]|EKYS/i },
    { grup: "diger", ad: "Diğer", ikon: "📋", kitle: "Kurum sınavı", onemli: false, desen: /.?/ },
  ];

  function siniflandir(ad) {
    for (var i = 0; i < SINIFLAR.length; i++) {
      if (SINIFLAR[i].desen.test(ad)) return SINIFLAR[i];
    }
    return SINIFLAR[SINIFLAR.length - 1];
  }

  /* ══════════ TARİH YARDIMCILARI ══════════ */
  var AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

  /** "2026-08-06" → yerel saat diliminde gün başı Date (UTC kaymasını önler) */
  function tarih(iso) {
    if (!iso || typeof iso !== "string") return null;
    var p = iso.slice(0, 10).split("-");
    if (p.length !== 3) return null;
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return isNaN(d.getTime()) ? null : d;
  }

  function bugun() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function gunFark(a, b) {
    return Math.round((b - a) / 86400000);
  }

  function gunYaz(iso) {
    var d = tarih(iso);
    return d ? d.getDate() + " " + AYLAR[d.getMonth()] + " " + d.getFullYear() : "";
  }

  function gunAdi(iso) {
    var d = tarih(iso);
    return d ? GUNLER[d.getDay()] : "";
  }

  /** Tek gün ya da aralık: "19–20 Aralık 2026", "5 Ocak – 29 Ocak 2026" */
  function araligiYaz(bas, bit) {
    if (!bas) return null;
    if (!bit || bit === bas) return gunYaz(bas);
    var a = tarih(bas), b = tarih(bit);
    if (!a || !b) return gunYaz(bas);
    if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
      return a.getDate() + "–" + gunYaz(bit);
    }
    if (a.getFullYear() === b.getFullYear()) {
      return a.getDate() + " " + AYLAR[a.getMonth()] + " – " + gunYaz(bit);
    }
    return gunYaz(bas) + " – " + gunYaz(bit);
  }

  function kalanYaz(gun) {
    if (gun === 0) return "bugün";
    if (gun === 1) return "yarın";
    if (gun < 0) return Math.abs(gun) + " gün önce";
    return gun + " gün kaldı";
  }

  /* ══════════ DURUM MOTORU ══════════ */
  var DURUMLAR = {
    "takvim-bekleniyor": "Takvim Bekleniyor",
    "basvuru-yaklasiyor": "Başvuru Yaklaşıyor",
    "acik": "Başvurular Açık",
    "gec": "Geç Başvuru Dönemi",
    "kapandi": "Başvurular Kapandı",
    "yaklasan": "Yaklaşıyor",
    "planlandi": "Takvimde",
    "gun": "Sınav Günü",
    "sonuc-bekleniyor": "Sonuç Bekleniyor",
    "sonuc-aciklandi": "Sonuç Açıklandı",
  };

  /** Sınavın bugüne göre durumu: { kod, ad } */
  function durum(s, T) {
    T = T || bugun();
    if (s.bekleyen) return { kod: "takvim-bekleniyor", ad: DURUMLAR["takvim-bekleniyor"] };

    var sinav = tarih(s.sinavTarihi);
    var sinavSon = tarih(s.sinavBitis) || sinav;
    var sonuc = tarih(s.sonucTarihi);
    var basB = tarih(s.basvuruBas);
    var basS = tarih(s.basvuruBit) || basB;
    var gecS = tarih(s.gecBasvuru);

    if (!sinav && !basB) return { kod: "takvim-bekleniyor", ad: DURUMLAR["takvim-bekleniyor"] };

    if (sonuc && T >= sonuc) return { kod: "sonuc-aciklandi", ad: DURUMLAR["sonuc-aciklandi"] };
    if (sinavSon && T > sinavSon) return { kod: "sonuc-bekleniyor", ad: DURUMLAR["sonuc-bekleniyor"] };
    if (sinav && T >= sinav && T <= sinavSon) return { kod: "gun", ad: DURUMLAR["gun"] };

    // Sınav ileride — başvuru penceresine bak
    if (basB && T < basB) return { kod: "basvuru-yaklasiyor", ad: DURUMLAR["basvuru-yaklasiyor"] };
    if (basB && basS && T >= basB && T <= basS) return { kod: "acik", ad: DURUMLAR["acik"] };
    if (gecS && basS && T > basS && T <= gecS) return { kod: "gec", ad: DURUMLAR["gec"] };

    var kalan = sinav ? gunFark(T, sinav) : null;
    if (kalan !== null && kalan <= 30) return { kod: "yaklasan", ad: DURUMLAR["yaklasan"] };
    if (!basB) return { kod: "planlandi", ad: DURUMLAR["planlandi"] };
    return { kod: "kapandi", ad: DURUMLAR["kapandi"] };
  }

  /** Bugünden sonraki ilk kilometre taşı: { ad, tarih, kalan } */
  function sonrakiAsama(s, T) {
    T = T || bugun();
    var adaylar = [
      { ad: "Başvurular başlıyor", iso: s.onBasvuruBas || s.basvuruBas },
      { ad: "Başvuru son gün", iso: s.basvuruBit },
      { ad: "Geç başvuru son gün", iso: s.gecBasvuru },
      { ad: "Sınav günü", iso: s.sinavTarihi },
      { ad: "Sonuç açıklanıyor", iso: s.sonucTarihi },
    ];
    for (var i = 0; i < adaylar.length; i++) {
      var d = tarih(adaylar[i].iso);
      if (d && d >= T) return { ad: adaylar[i].ad, iso: adaylar[i].iso, kalan: gunFark(T, d) };
    }
    return null;
  }

  /** Yaklaşan sınavlar — sonraki aşamasına göre sıralı */
  function yaklasanlar(sinavlar, secenek) {
    secenek = secenek || {};
    var T = bugun();
    var liste = [];
    for (var i = 0; i < sinavlar.length; i++) {
      var s = sinavlar[i];
      if (secenek.onemli && !siniflandir(s.ad).onemli) continue;
      var a = sonrakiAsama(s, T);
      if (!a) continue;
      liste.push({ sinav: s, asama: a });
    }
    liste.sort(function (x, y) {
      if (x.asama.kalan !== y.asama.kalan) return x.asama.kalan - y.asama.kalan;
      return x.sinav.ad.localeCompare(y.sinav.ad, "tr");
    });
    // Aynı sınav grubundan tek kayıt (12 e-YDS oturumu listeyi boğmasın)
    if (secenek.tekilGrup) {
      var gorulen = {}, tekil = [];
      for (var j = 0; j < liste.length; j++) {
        var g = siniflandir(liste[j].sinav.ad).grup;
        if (gorulen[g]) continue;
        gorulen[g] = true;
        tekil.push(liste[j]);
      }
      liste = tekil;
    }
    // adet 0 olabilir (hiç kart istenmeyen bloklar) — bu yüzden null denetimi
    return secenek.adet == null ? liste : liste.slice(0, secenek.adet);
  }

  /* ══════════ VERİ YÜKLEME ══════════ */
  var veriSozu = null;

  function onbellegeYaz(veri) {
    try {
      localStorage.setItem(ONBELLEK_ANAHTAR, JSON.stringify({ zaman: Date.now(), veri: veri }));
    } catch { /* kota dolu olabilir — önemsiz */ }
  }

  function onbellektenOku() {
    try {
      var k = JSON.parse(localStorage.getItem(ONBELLEK_ANAHTAR));
      if (k && k.veri && k.veri.sinavlar && Date.now() - k.zaman < ONBELLEK_TTL) return k.veri;
    } catch { /* bozuk kayıt */ }
    return null;
  }

  function getir(url) {
    return fetch(url, { headers: { Accept: "application/json" } }).then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.json();
    });
  }

  function gecerli(v) {
    return v && Array.isArray(v.sinavlar) && v.sinavlar.length > 0;
  }

  /** Veriyi bir kez yükler; sonraki çağrılar aynı sözü döndürür */
  function yukle() {
    if (veriSozu) return veriSozu;
    veriSozu = getir(API)
      .then(function (v) {
        if (!gecerli(v)) throw new Error("boş yanıt");
        onbellegeYaz(v);
        return v;
      })
      .catch(function () {
        return getir(CEKIRDEK).then(function (v) {
          if (!gecerli(v)) throw new Error("boş çekirdek");
          v.canli = false;
          v.kaynak = "cekirdek";
          onbellegeYaz(v);
          return v;
        });
      })
      .catch(function () {
        var o = onbellektenOku();
        if (o) { o.canli = false; o.kaynak = "onbellek"; return o; }
        return { sinavlar: [], duyurular: [], canli: false, kaynak: "yok", kaynaklar: [] };
      });
    return veriSozu;
  }

  /* ══════════ ÇİZİM YARDIMCILARI ══════════ */
  function kacir(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function rozetHtml(d) {
    return '<span class="st-rozet st-d-' + d.kod + '">' + kacir(d.ad) + "</span>";
  }

  function tarihSatiri(etiket, deger, etkin, alt) {
    return '<div class="st-tarih" data-etkin="' + (etkin ? "evet" : "hayir") + '">' +
      "<dt>" + kacir(etiket) + "</dt>" +
      "<dd>" + (deger ? kacir(deger) : '<span class="st-yok">—</span>') +
      (alt ? "<small>" + kacir(alt) + "</small>" : "") +
      "</dd></div>";
  }

  /** Ana sayfa/detay sayfası sınav kartı */
  function kartHtml(s) {
    var sinif = siniflandir(s.ad);
    var d = durum(s);
    var asama = sonrakiAsama(s);

    var basvuru = araligiYaz(s.basvuruBas, s.basvuruBit);
    var sinavStr = araligiYaz(s.sinavTarihi, s.sinavBitis);

    var sayac = "";
    if (asama) {
      sayac = '<div class="st-sayac">' +
        '<span class="st-sayac-sayi">' + (asama.kalan === 0 ? "Bugün" : asama.kalan) + "</span>" +
        '<span class="st-sayac-not">' +
        (asama.kalan === 0 ? kacir(asama.ad.toLocaleLowerCase("tr")) : "gün · " + kacir(asama.ad.toLocaleLowerCase("tr"))) +
        "</span></div>";
    } else if (s.bekleyen && s.beklenenDonem) {
      sayac = '<div class="st-sayac"><span class="st-sayac-not">Beklenen dönem: <b>' +
        kacir(s.beklenenDonem) + "</b></span></div>";
    }

    return '<button type="button" class="st-kart" data-sinav-id="' + kacir(s.id) + '"' +
      ' aria-label="' + kacir(s.ad) + " — " + kacir(d.ad) + ' (detayları gör)">' +
      '<div class="st-kart-ust">' +
        '<span class="st-kart-ikon" aria-hidden="true">' + sinif.ikon + "</span>" +
        '<span class="st-kart-basliklar">' +
          '<span class="st-kart-ad">' + kacir(s.ad) + "</span>" +
          '<span class="st-kart-alt"><span>' + kacir(s.kurum) + "</span><span>" + kacir(sinif.kitle) + "</span></span>" +
        "</span>" +
      "</div>" +
      '<span class="st-kart-durum">' + rozetHtml(d) + "</span>" +
      sayac +
      '<dl class="st-tarihler">' +
        tarihSatiri("Başvuru", basvuru, d.kod === "acik") +
        (s.gecBasvuru ? tarihSatiri("Geç başvuru", gunYaz(s.gecBasvuru), d.kod === "gec") : "") +
        tarihSatiri("Sınav", sinavStr, d.kod === "gun" || d.kod === "yaklasan",
          s.sinavTarihi ? gunAdi(s.sinavTarihi) + (s.sinavSaati ? " · " + s.sinavSaati : "") : null) +
        tarihSatiri("Sonuç", s.sonucTarihi ? gunYaz(s.sonucTarihi) : null,
          d.kod === "sonuc-bekleniyor" || d.kod === "sonuc-aciklandi") +
      "</dl>" +
      '<span class="st-kart-ayak"><span>' + kacir(sinif.ad) + '</span><span class="st-detay">Detaylar →</span></span>' +
      "</button>";
  }

  function iskeletHtml(adet) {
    var h = "";
    for (var i = 0; i < adet; i++) {
      h += '<div class="st-kart st-iskelet" aria-hidden="true">' +
        '<div class="st-iskelet-satir" style="width:62%;height:20px"></div>' +
        '<div class="st-iskelet-satir" style="width:38%"></div>' +
        '<div class="st-iskelet-satir" style="width:88%"></div>' +
        '<div class="st-iskelet-satir" style="width:74%"></div>' +
        '<div class="st-iskelet-satir" style="width:52%"></div>' +
        "</div>";
    }
    return h;
  }

  /* ══════════ DETAY PENCERESİ ══════════ */
  var pencere = null;

  function pencereKur() {
    if (pencere) return pencere;
    pencere = document.createElement("dialog");
    pencere.className = "st-pencere st-scope";
    pencere.innerHTML = '<div class="st-pencere-ic">' +
      '<button type="button" class="st-pencere-kapat" aria-label="Kapat">✕</button>' +
      '<div data-alan="govde"></div></div>';
    pencere.querySelector(".st-pencere-kapat").addEventListener("click", function () { pencere.close(); });
    pencere.addEventListener("click", function (e) {
      // Arka plana tıklayınca kapat (içeriğe tıklayınca kapanmasın)
      if (e.target === pencere) pencere.close();
    });
    document.body.appendChild(pencere);
    return pencere;
  }

  function detayGoster(s) {
    var p = pencereKur();
    var sinif = siniflandir(s.ad);
    var d = durum(s);
    var asama = sonrakiAsama(s);

    p.querySelector('[data-alan="govde"]').innerHTML =
      '<div class="st-kart-ust" style="margin-bottom:12px">' +
        '<span class="st-kart-ikon" aria-hidden="true">' + sinif.ikon + "</span>" +
        "<span><h3>" + kacir(s.ad) + "</h3>" +
        '<div class="st-pencere-kurum">' + kacir(s.kurum) + " · " + kacir(sinif.kitle) + "</div></span>" +
      "</div>" +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px">' +
        rozetHtml(d) +
        (asama ? '<span class="st-sayac-not">' + kacir(asama.ad) + " · " + kacir(kalanYaz(asama.kalan)) + "</span>" : "") +
      "</div>" +
      '<dl class="st-tarihler" style="margin-bottom:14px">' +
        (s.onBasvuruBas ? tarihSatiri("Ön başvuru", araligiYaz(s.onBasvuruBas, s.onBasvuruBit), false) : "") +
        tarihSatiri("Başvuru tarihleri", araligiYaz(s.basvuruBas, s.basvuruBit), d.kod === "acik") +
        tarihSatiri("Geç başvuru", s.gecBasvuru ? araligiYaz(s.gecBasvuruBas, s.gecBasvuru) : null, d.kod === "gec") +
        tarihSatiri("Sınav tarihi", araligiYaz(s.sinavTarihi, s.sinavBitis), d.kod === "gun",
          s.sinavTarihi ? gunAdi(s.sinavTarihi) + (s.sinavSaati ? " · saat " + s.sinavSaati : "") : null) +
        tarihSatiri("Sonuç açıklanma", s.sonucTarihi ? gunYaz(s.sonucTarihi) : null,
          d.kod === "sonuc-bekleniyor" || d.kod === "sonuc-aciklandi") +
      "</dl>" +
      (s.not ? '<p class="st-pencere-not" style="margin-bottom:14px">' + kacir(s.not) + "</p>" : "") +
      '<div class="st-pencere-eylemler">' +
        '<a class="btn btn-primary" href="' + kacir(s.kaynakUrl) + '" target="_blank" rel="noopener noreferrer">' +
          "Resmî duyuruya git →</a>" +
        '<button type="button" class="btn btn-outline" data-kapat="evet">Kapat</button>' +
      "</div>";

    p.querySelector('[data-kapat="evet"]').addEventListener("click", function () { p.close(); });
    if (typeof p.showModal === "function") p.showModal();
    else p.setAttribute("open", "");
  }

  /* ══════════ KAP ÇİZİCİLERİ ══════════ */

  /** Kart tıklamalarını kaba bir kez bağla */
  function kartlariBagla(kap, sinavlar, mod) {
    kap.addEventListener("click", function (e) {
      var d = e.target.closest("[data-sinav-id]");
      if (!d) return;
      var s = null;
      for (var i = 0; i < sinavlar.length; i++) {
        if (sinavlar[i].id === d.getAttribute("data-sinav-id")) { s = sinavlar[i]; break; }
      }
      if (!s) return;
      if (mod === "baglanti") {
        location.href = DETAY_SAYFA + "#" + encodeURIComponent(s.id);
      } else {
        detayGoster(s);
      }
    });
  }

  function seritCiz(kap, veri) {
    var adet = Number(kap.getAttribute("data-adet") || 6);
    var mod = kap.getAttribute("data-mod") || "baglanti";
    var liste = yaklasanlar(veri.sinavlar, { onemli: true, tekilGrup: true, adet: adet });

    if (!liste.length) {
      kap.innerHTML = '<div class="st-bos"><div class="st-bos-ikon">🗓️</div>' +
        "<p>Şu an için yaklaşan sınav bulunmuyor. Yeni takvim yayımlandığında burada görünecek.</p></div>";
      return;
    }
    kap.innerHTML = liste.map(function (k) { return kartHtml(k.sinav); }).join("");
    kartlariBagla(kap, veri.sinavlar, mod);
  }

  function duyuruKartlariCiz(kap, veri) {
    var adet = Number(kap.getAttribute("data-adet") || 6);
    var oneCikanNiteligi = kap.getAttribute("data-one-cikan");
    var oneCikanAdet = oneCikanNiteligi == null ? 3 : Number(oneCikanNiteligi);
    if (isNaN(oneCikanAdet) || oneCikanAdet < 0) oneCikanAdet = 3;
    var kartlar = [];

    /* 1) Yaklaşan sınavlar öne çıkarılır. data-one-cikan="0" verildiğinde bu
       blok atlanır — sınavlar aynı bölümdeki takvim şeridinde zaten görünüyorsa
       kartlarda tekrarlanmasın diye (bkz. ana sayfa). */
    var yakin = yaklasanlar(veri.sinavlar, { onemli: true, tekilGrup: true, adet: oneCikanAdet });
    yakin.forEach(function (k) {
      var s = k.sinav, sinif = siniflandir(s.ad), d = durum(s);
      var satirlar = [];
      if (s.basvuruBas) satirlar.push("Başvuru: " + araligiYaz(s.basvuruBas, s.basvuruBit));
      if (s.gecBasvuru) satirlar.push("Geç başvuru: " + gunYaz(s.gecBasvuru));
      if (s.sinavTarihi) satirlar.push("Sınav: " + araligiYaz(s.sinavTarihi, s.sinavBitis));
      if (s.sonucTarihi) satirlar.push("Sonuç: " + gunYaz(s.sonucTarihi));

      kartlar.push('<article class="st-duyuru st-one-cikan">' +
        '<div class="st-duyuru-ust">' +
          '<span class="st-duyuru-tur">' + sinif.ikon + " Yaklaşan sınav</span>" +
          '<span class="st-one-cikan-etiket">' + kacir(kalanYaz(k.asama.kalan).toLocaleUpperCase("tr")) + "</span>" +
        "</div>" +
        '<div class="st-duyuru-govde">' +
          '<div class="st-duyuru-baslik">' + kacir(s.ad) + "</div>" +
          "<div>" + rozetHtml(d) + "</div>" +
          '<div class="st-duyuru-metin">' + kacir(satirlar.join(" · ")) + "</div>" +
        "</div>" +
        '<div class="st-duyuru-ayak"><span>' + kacir(s.kurum) + "</span>" +
          '<a href="' + DETAY_SAYFA + "#" + encodeURIComponent(s.id) + '">Sınav detayları →</a></div>' +
        "</article>");
    });

    // 2) ÖSYM / MEB duyuruları
    var duyurular = (veri.duyurular || []).slice(0, Math.max(0, adet - kartlar.length));
    duyurular.forEach(function (d) {
      var mebMi = /meb\.gov\.tr/.test(d.kaynak || d.url);
      kartlar.push('<article class="st-duyuru">' +
        '<div class="st-duyuru-ust">' +
          '<span class="st-duyuru-tur">' + (mebMi ? "🏛️ MEB duyurusu" : "📌 ÖSYM duyurusu") + "</span>" +
        "</div>" +
        '<div class="st-duyuru-govde">' +
          '<div class="st-duyuru-baslik">' + kacir(d.baslik) + "</div>" +
        "</div>" +
        '<div class="st-duyuru-ayak"><span>' + kacir(d.kaynak) + "</span>" +
          '<a href="' + kacir(d.url) + '" target="_blank" rel="noopener noreferrer">Duyuruyu oku →</a></div>' +
        "</article>");
    });

    // 3) Duyuru gelmediyse yerini yaklaşan sınavlarla tamamla
    if (kartlar.length < adet) {
      var ek = yaklasanlar(veri.sinavlar, { onemli: true, tekilGrup: true, adet: adet })
        .slice(oneCikanAdet, oneCikanAdet + (adet - kartlar.length));
      ek.forEach(function (k) {
        var s = k.sinav, sinif = siniflandir(s.ad);
        kartlar.push('<article class="st-duyuru">' +
          '<div class="st-duyuru-ust"><span class="st-duyuru-tur">' + sinif.ikon + " Takvimde</span></div>" +
          '<div class="st-duyuru-govde">' +
            '<div class="st-duyuru-baslik">' + kacir(s.ad) + "</div>" +
            "<div>" + rozetHtml(durum(s)) + "</div>" +
            '<div class="st-duyuru-metin">' + kacir(k.asama.ad + " · " + gunYaz(k.asama.iso)) + "</div>" +
          "</div>" +
          '<div class="st-duyuru-ayak"><span>' + kacir(s.kurum) + "</span>" +
            '<a href="' + DETAY_SAYFA + "#" + encodeURIComponent(s.id) + '">Sınav detayları →</a></div>' +
          "</article>");
      });
    }

    kap.innerHTML = kartlar.length
      ? kartlar.join("")
      : '<div class="st-bos"><div class="st-bos-ikon">📰</div><p>Duyurular şu an yüklenemedi. ' +
        '<a href="haberler.html" style="color:inherit;text-decoration:underline">Haberler sayfasına</a> göz atabilirsin.</p></div>';
  }

  function canliCiz(kap, veri) {
    var tazeMi = !!veri.canli;
    var zaman = "";
    if (veri.guncellenme) {
      var d = new Date(veri.guncellenme);
      if (!isNaN(d.getTime())) {
        zaman = d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) +
          (veri.canli ? " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "");
      }
    }
    kap.className = "st-canli";
    kap.setAttribute("data-canli", tazeMi ? "evet" : "hayir");
    kap.innerHTML = '<span class="st-canli-nokta"></span>' +
      (tazeMi
        ? "ÖSYM &amp; MEB ile eşitlendi" + (zaman ? " · " + kacir(zaman) : "")
        : "Kayıtlı takvim" + (zaman ? " · " + kacir(zaman) : ""));
    kap.title = tazeMi
      ? "Takvim ÖSYM ve MEB'in güncel yayınlarından otomatik alındı."
      : "Kaynaklara şu an ulaşılamadı; son bilinen takvim gösteriliyor.";
  }

  function ozetCiz(kap, veri) {
    var T = bugun();
    var sayim = { acik: 0, yaklasan: 0, sonuc: 0, toplam: 0 };
    veri.sinavlar.forEach(function (s) {
      var d = durum(s, T);
      sayim.toplam++;
      if (d.kod === "acik" || d.kod === "gec") sayim.acik++;
      if (d.kod === "yaklasan" || d.kod === "gun") sayim.yaklasan++;
      if (d.kod === "sonuc-bekleniyor") sayim.sonuc++;
    });
    var kutular = [
      { sayi: sayim.acik, ad: "Başvurusu açık sınav" },
      { sayi: sayim.yaklasan, ad: "30 gün içindeki sınav" },
      { sayi: sayim.sonuc, ad: "Sonuç bekleyen sınav" },
      { sayi: sayim.toplam, ad: "Takvimdeki sınav" },
    ];
    kap.innerHTML = kutular.map(function (k) {
      return '<div class="st-ozet-kutu"><div class="st-ozet-sayi">' + k.sayi +
        '</div><div class="st-ozet-ad">' + k.ad + "</div></div>";
    }).join("");
  }

  /** Detay sayfası: filtreli tam liste */
  function listeCiz(kap, veri) {
    var durumSecim = "hepsi";
    var grupSecim = "hepsi";
    var arama = "";
    var izgara = document.createElement("div");
    izgara.className = "st-izgara";

    var grupKap = document.querySelector('[data-kk-sinav="grup-filtre"]');
    var durumKap = document.querySelector('[data-kk-sinav="durum-filtre"]');
    var aramaGirdi = document.querySelector('[data-kk-sinav="arama"]');
    var sayimAlan = document.querySelector('[data-kk-sinav="sayim"]');

    kap.innerHTML = "";
    kap.appendChild(izgara);

    function suzulen() {
      var T = bugun();
      return veri.sinavlar.filter(function (s) {
        var sinif = siniflandir(s.ad);
        if (grupSecim !== "hepsi" && sinif.grup !== grupSecim) return false;
        if (durumSecim === "yaklasan" && !sonrakiAsama(s, T)) return false;
        if (durumSecim === "acik") {
          var k = durum(s, T).kod;
          if (k !== "acik" && k !== "gec") return false;
        }
        if (durumSecim === "gecmis" && sonrakiAsama(s, T)) return false;
        if (arama) {
          var metin = (s.ad + " " + s.kurum + " " + sinif.ad + " " + sinif.kitle).toLocaleLowerCase("tr");
          if (metin.indexOf(arama.toLocaleLowerCase("tr")) === -1) return false;
        }
        return true;
      }).sort(function (a, b) {
        // Yaklaşanlar tarih sırasıyla önce, geçmişler en yeniden eskiye
        var aa = sonrakiAsama(a, T), ba = sonrakiAsama(b, T);
        if (aa && ba) return aa.kalan - ba.kalan;
        if (aa) return -1;
        if (ba) return 1;
        return String(b.sinavTarihi || "").localeCompare(String(a.sinavTarihi || ""));
      });
    }

    function ciz() {
      var liste = suzulen();
      izgara.innerHTML = liste.length
        ? liste.map(function (s) { return kartHtml(s); }).join("")
        : '<div class="st-bos"><div class="st-bos-ikon">🔍</div><p>Bu ölçütlere uyan sınav bulunamadı.</p></div>';
      if (sayimAlan) {
        sayimAlan.textContent = liste.length + " sınav gösteriliyor (toplam " + veri.sinavlar.length + ")";
      }
    }

    // Grup çipleri — veride bulunan gruplardan üretilir
    if (grupKap) {
      var sayim = {};
      veri.sinavlar.forEach(function (s) {
        var g = siniflandir(s.ad);
        sayim[g.grup] = sayim[g.grup] || { ad: g.ad, ikon: g.ikon, n: 0 };
        sayim[g.grup].n++;
      });
      var sirali = SINIFLAR.filter(function (s) { return sayim[s.grup]; });
      grupKap.innerHTML = '<button type="button" class="st-cip" data-grup="hepsi" aria-pressed="true">Tümü <small>(' +
        veri.sinavlar.length + ")</small></button>" +
        sirali.map(function (s) {
          return '<button type="button" class="st-cip" data-grup="' + s.grup + '" aria-pressed="false">' +
            s.ikon + " " + kacir(s.ad) + " <small>(" + sayim[s.grup].n + ")</small></button>";
        }).join("");
      grupKap.addEventListener("click", function (e) {
        var b = e.target.closest("[data-grup]");
        if (!b) return;
        grupSecim = b.getAttribute("data-grup");
        grupKap.querySelectorAll("[data-grup]").forEach(function (x) {
          x.setAttribute("aria-pressed", String(x === b));
        });
        ciz();
      });
    }

    if (durumKap) {
      durumKap.addEventListener("click", function (e) {
        var b = e.target.closest("[data-durum]");
        if (!b) return;
        durumSecim = b.getAttribute("data-durum");
        durumKap.querySelectorAll("[data-durum]").forEach(function (x) {
          x.setAttribute("aria-pressed", String(x === b));
        });
        ciz();
      });
    }

    if (aramaGirdi) {
      aramaGirdi.addEventListener("input", function (e) {
        arama = e.target.value.trim();
        ciz();
      });
    }

    kartlariBagla(kap, veri.sinavlar, "pencere");
    ciz();

    // Adresteki #kimlik varsa o sınavın detayını aç
    function hashAc() {
      var id = decodeURIComponent((location.hash || "").replace(/^#/, ""));
      if (!id) return;
      for (var i = 0; i < veri.sinavlar.length; i++) {
        if (veri.sinavlar[i].id === id) { detayGoster(veri.sinavlar[i]); return; }
      }
    }
    hashAc();
    window.addEventListener("hashchange", hashAc);
  }

  /* ══════════ BAŞLATMA ══════════ */
  var CIZICILER = {
    serit: seritCiz,
    duyurular: duyuruKartlariCiz,
    liste: listeCiz,
    ozet: ozetCiz,
    canli: canliCiz,
  };

  function baslat() {
    var kaplar = [].slice.call(document.querySelectorAll("[data-kk-sinav]"));
    var cizilecek = kaplar.filter(function (k) { return CIZICILER[k.getAttribute("data-kk-sinav")]; });
    if (!cizilecek.length) return;

    // Yükleme sırasında iskelet göster
    cizilecek.forEach(function (k) {
      var tur = k.getAttribute("data-kk-sinav");
      if (tur === "serit" || tur === "liste") {
        k.innerHTML = iskeletHtml(tur === "liste" ? 6 : Number(k.getAttribute("data-adet") || 3));
      }
    });

    yukle().then(function (veri) {
      if (!veri.sinavlar.length) {
        cizilecek.forEach(function (k) {
          if (k.getAttribute("data-kk-sinav") === "canli") { canliCiz(k, veri); return; }
          k.innerHTML = '<div class="st-bos"><div class="st-bos-ikon">📡</div>' +
            "<p>Sınav takvimi şu an yüklenemedi. Sayfayı yenileyerek tekrar deneyebilirsin.</p></div>";
        });
        return;
      }
      cizilecek.forEach(function (k) {
        try {
          CIZICILER[k.getAttribute("data-kk-sinav")](k, veri);
        } catch {
          // Tek bir blok çizilemezse sayfanın kalanı ayakta kalsın
          k.innerHTML = '<div class="st-bos"><p>Bu bölüm görüntülenemedi.</p></div>';
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", baslat);
  } else {
    baslat();
  }

  /* Dışa açılan yüzey — başka sayfalar da kullanabilir */
  window.KKSinav = {
    yukle: yukle,
    durum: durum,
    siniflandir: siniflandir,
    sonrakiAsama: sonrakiAsama,
    yaklasanlar: yaklasanlar,
    kartHtml: kartHtml,
    detayGoster: detayGoster,
    baslat: baslat,
    DURUMLAR: DURUMLAR,
  };
})();
