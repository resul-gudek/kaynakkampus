/* ═══════════════════════════════════════════════════════════════
   Kaynak Akademi – Koçluk Sistemi Veri Katmanı
   Tarayıcı içi (localStorage) demo veri katmanı.
   giris.html, koc-panel.html ve ogrenci-panel.html tarafından kullanılır.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  "use strict";

  const VERI_KEY = "ka_kocluk_v1";
  const OTURUM_KEY = "ka_oturum_v1";

  /* ── Sınav / ders tanımları ──────────────────────────────── */
  /* Deneme girişinde kullanılan ders listeleri ve soru sayıları */
  const DENEME_DERSLERI = {
    TYT: [
      { ders: "Türkçe", soru: 40 }, { ders: "Sosyal Bilimler", soru: 20 },
      { ders: "Temel Matematik", soru: 40 }, { ders: "Fen Bilimleri", soru: 20 }
    ],
    AYT: [
      { ders: "Matematik", soru: 40 }, { ders: "Fizik", soru: 14 },
      { ders: "Kimya", soru: 13 }, { ders: "Biyoloji", soru: 13 },
      { ders: "Edebiyat", soru: 24 }, { ders: "Tarih", soru: 10 }, { ders: "Coğrafya", soru: 6 }
    ],
    LGS: [
      { ders: "Türkçe", soru: 20 }, { ders: "Matematik", soru: 20 },
      { ders: "Fen Bilimleri", soru: 20 }, { ders: "İnkılap Tarihi", soru: 10 },
      { ders: "Din Kültürü", soru: 10 }, { ders: "İngilizce", soru: 10 }
    ],
    "Branş": [{ ders: "Branş", soru: 40 }]
  };
  /* Başlangıç seviye formundaki öz değerlendirme ders listeleri */
  const PROFIL_DERSLERI = {
    YKS: ["Türkçe / Edebiyat", "Matematik", "Geometri", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya"],
    LGS: ["Türkçe", "Matematik", "Fen Bilimleri", "İnkılap Tarihi", "Din Kültürü", "İngilizce"]
  };
  /* Net hesabı: LGS'de 3, YKS'de 4 yanlış bir doğruyu götürür */
  function netHesapla(tur, dogru, yanlis) {
    const bolen = tur === "LGS" ? 3 : 4;
    return Math.round((dogru - yanlis / bolen) * 100) / 100;
  }

  /* ── Yardımcılar ─────────────────────────────────────────── */
  function uid() {
    return "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }
  function bugun() {
    return new Date().toISOString().slice(0, 10);
  }
  /* Bugünden n gün ileri/geri ISO tarih (demo verisi ve planlamada kullanılır) */
  function gunKaydir(n) {
    const t = new Date();
    t.setDate(t.getDate() + n);
    return t.toISOString().slice(0, 10);
  }
  /* "2026-07-20" → "20.07.2026" */
  function tarihStr(iso) {
    const p = String(iso || "").split("-");
    return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : (iso || "");
  }
  /* Şu an: "2026-07-20 14:35" (bildirim zaman damgası) */
  function simdiStr() {
    const t = new Date();
    return t.toISOString().slice(0, 10) + " " +
      String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0");
  }

  /* ── Başlangıç (demo) verisi ─────────────────────────────── */
  function tohumVerisi() {
    const kocId = "koc_demo_1";
    const ogr1 = "ogr_demo_1";
    const ogr2 = "ogr_demo_2";
    const ogr3 = "ogr_demo_3";
    return {
      users: [
        { id: kocId, rol: "koc", ad: "Ayşe Yılmaz", kullanici: "koc1", sifre: "1234", brans: "Öğretmen / Rehberlik" },
        { id: ogr1, rol: "ogrenci", ad: "Elif Demir", kullanici: "ogrenci1", sifre: "1234", sinif: "12. Sınıf", hedef: "YKS – Tıp", kocId: kocId, telefon: "905001112233", veliTelefon: "905004445566", profil: demoProfil() },
        { id: ogr2, rol: "ogrenci", ad: "Mert Kaya", kullanici: "ogrenci2", sifre: "1234", sinif: "8. Sınıf", hedef: "LGS – Fen Lisesi", kocId: kocId, telefon: "905007778899", veliTelefon: "905001231234" },
        { id: ogr3, rol: "ogrenci", ad: "Zeynep Arslan", kullanici: "ogrenci3", sifre: "1234", sinif: "11. Sınıf", hedef: "YKS – Hukuk", kocId: null, telefon: "", veliTelefon: "" }
      ],
      odevler: [
        { id: uid(), ogrenciId: ogr1, kocId: kocId, ders: "Matematik", konu: "Türev – Uygulamaları", aciklama: "Kaynak kitaptan türev alma kuralları testi çözülecek.", kaynak: "Karekök AYT Matematik", soruSayisi: 60, sonTarih: bugun(), durum: "bekliyor", olusturma: bugun() },
        { id: uid(), ogrenciId: ogr1, kocId: kocId, ders: "Biyoloji", konu: "Hücre Bölünmeleri", aciklama: "Konu tekrarı + 40 soru.", kaynak: "3D Biyoloji", soruSayisi: 40, sonTarih: bugun(), durum: "tamamlandi", olusturma: bugun() },
        { id: uid(), ogrenciId: ogr2, kocId: kocId, ders: "Fen Bilimleri", konu: "Basınç", aciklama: "Ünite değerlendirme testi.", kaynak: "Tonguç LGS", soruSayisi: 30, sonTarih: bugun(), durum: "bekliyor", olusturma: bugun() }
      ],
      takip: [
        { id: uid(), ogrenciId: ogr1, kocId: kocId, gun: "Pazartesi", gorev: "TYT Matematik: 50 soru + yanlış analizi", tamamlandi: true },
        { id: uid(), ogrenciId: ogr1, kocId: kocId, gun: "Salı", gorev: "AYT Fizik: Vektörler konu tekrarı (2 saat)", tamamlandi: false },
        { id: uid(), ogrenciId: ogr1, kocId: kocId, gun: "Çarşamba", gorev: "Paragraf: 30 soru (süre tutarak)", tamamlandi: false },
        { id: uid(), ogrenciId: ogr2, kocId: kocId, gun: "Pazartesi", gorev: "LGS Türkçe: 20 paragraf sorusu", tamamlandi: false }
      ],
      denemeler: [
        {
          id: uid(), ogrenciId: ogr1, ad: "3D TYT Deneme 4", tur: "TYT", tarih: bugun(), net: 82.5,
          dersler: [
            { ders: "Türkçe", dogru: 32, yanlis: 6, bos: 2, net: 30.5, yanlisKonular: ["Paragraf", "Sözcükte Anlam"] },
            { ders: "Sosyal Bilimler", dogru: 14, yanlis: 4, bos: 2, net: 13, yanlisKonular: ["Coğrafya – İklim"] },
            { ders: "Temel Matematik", dogru: 26, yanlis: 8, bos: 6, net: 24, yanlisKonular: ["Problemler", "Üslü Sayılar"] },
            { ders: "Fen Bilimleri", dogru: 16, yanlis: 4, bos: 0, net: 15, yanlisKonular: ["Fizik – Basınç"] }
          ]
        },
        {
          id: uid(), ogrenciId: ogr1, ad: "3D TYT Deneme 5", tur: "TYT", tarih: bugun(), net: 88.25,
          dersler: [
            { ders: "Türkçe", dogru: 34, yanlis: 5, bos: 1, net: 32.75, yanlisKonular: ["Paragraf"] },
            { ders: "Sosyal Bilimler", dogru: 15, yanlis: 3, bos: 2, net: 14.25, yanlisKonular: ["Tarih – Kurtuluş Savaşı"] },
            { ders: "Temel Matematik", dogru: 28, yanlis: 6, bos: 6, net: 26.5, yanlisKonular: ["Problemler"] },
            { ders: "Fen Bilimleri", dogru: 15, yanlis: 1, bos: 4, net: 14.75, yanlisKonular: ["Kimya – Karışımlar"] }
          ]
        },
        {
          id: uid(), ogrenciId: ogr2, ad: "Tonguç LGS Deneme 2", tur: "LGS", tarih: bugun(), net: 65,
          dersler: [
            { ders: "Türkçe", dogru: 15, yanlis: 3, bos: 2, net: 14, yanlisKonular: ["Paragraf", "Fiilimsiler"] },
            { ders: "Matematik", dogru: 12, yanlis: 6, bos: 2, net: 10, yanlisKonular: ["Üslü İfadeler", "Kareköklü İfadeler"] },
            { ders: "Fen Bilimleri", dogru: 14, yanlis: 3, bos: 3, net: 13, yanlisKonular: ["Basınç"] },
            { ders: "İnkılap Tarihi", dogru: 9, yanlis: 0, bos: 1, net: 9, yanlisKonular: [] },
            { ders: "Din Kültürü", dogru: 10, yanlis: 0, bos: 0, net: 10, yanlisKonular: [] },
            { ders: "İngilizce", dogru: 9, yanlis: 0, bos: 1, net: 9, yanlisKonular: [] }
          ]
        }
      ],
      yol: demoYol(kocId, ogr1, ogr2),
      ozelDersler: [
        { id: uid(), ogrenciId: ogr1, kocId: kocId, ders: "Matematik", konu: "Limit ve Süreklilik", tarih: gunKaydir(-7), saat: "18:00", sure: 90, ucret: 800, odendi: true, durum: "yapildi", olusturan: "koc", mesaj: "", redNotu: "", not: "Limit kavramını iyi oturttu; süreklilikte ek örnek çözülecek.", odev: "Limit karma test – 30 soru" },
        { id: uid(), ogrenciId: ogr1, kocId: kocId, ders: "Matematik", konu: "Türev – Tanım ve Kurallar", tarih: gunKaydir(-2), saat: "18:00", sure: 90, ucret: 800, odendi: false, durum: "yapildi", olusturan: "koc", mesaj: "", redNotu: "", not: "Türev alma kurallarında belirgin hızlandı.", odev: "" },
        { id: uid(), ogrenciId: ogr1, kocId: kocId, ders: "Matematik", konu: "Türev – Uygulamaları", tarih: gunKaydir(3), saat: "18:00", sure: 90, ucret: 800, odendi: false, durum: "planlandi", olusturan: "koc", mesaj: "", redNotu: "", not: "", odev: "" },
        { id: uid(), ogrenciId: ogr1, kocId: kocId, ders: "Geometri", konu: "Üçgende Alan", tarih: gunKaydir(5), saat: "19:00", sure: 60, ucret: 0, odendi: false, durum: "talep", olusturan: "ogrenci", mesaj: "Denemelerde üçgen sorularında çok yanlışım çıkıyor hocam, bu konuya birlikte bakabilir miyiz?", redNotu: "", not: "", odev: "" },
        { id: uid(), ogrenciId: ogr2, kocId: kocId, ders: "Fen Bilimleri", konu: "Basınç", tarih: gunKaydir(1), saat: "17:00", sure: 60, ucret: 500, odendi: false, durum: "planlandi", olusturan: "koc", mesaj: "", redNotu: "", not: "", odev: "" },
        { id: uid(), ogrenciId: ogr2, kocId: kocId, ders: "Matematik", konu: "Kareköklü İfadeler", tarih: gunKaydir(4), saat: "17:30", sure: 60, ucret: 500, odendi: false, durum: "talep", olusturan: "koc", mesaj: "", redNotu: "", not: "", odev: "" }
      ]
    };
  }

  /* Demo başlangıç seviye profili */
  function demoProfil() {
    return {
      sinav: "YKS", gunlukSaat: 4, tarih: bugun(),
      notlar: "Sayısal ağırlıklı çalışıyor; paragraf hızını artırmak istiyor.",
      dersler: [
        { ders: "Türkçe / Edebiyat", seviye: "Orta", bilinen: ["Sözcükte Anlam", "Cümlede Anlam"], eksik: ["Paragraf"] },
        { ders: "Matematik", seviye: "Orta", bilinen: ["Temel Kavramlar", "Sayı Basamakları"], eksik: ["Problemler", "Üslü Sayılar"] },
        { ders: "Geometri", seviye: "Zayıf", bilinen: [], eksik: ["Üçgenler", "Açılar"] },
        { ders: "Fizik", seviye: "Orta", bilinen: ["Hareket"], eksik: ["Basınç"] },
        { ders: "Kimya", seviye: "İyi", bilinen: ["Atom", "Periyodik Sistem"], eksik: ["Karışımlar"] },
        { ders: "Biyoloji", seviye: "İyi", bilinen: ["Hücre", "Canlıların Sınıflandırılması"], eksik: [] }
      ]
    };
  }

  /* Demo yol haritası adımları (oyunlaştırılmış ilerleme) */
  function demoYol(kocId, ogr1, ogr2) {
    return [
      { id: uid(), ogrenciId: ogr1, kocId: kocId, sira: 1, ders: "Matematik", konu: "Temel Kavramlar", hedef: "Konu tekrarı + 60 soru", xp: 50, tamamlandi: true },
      { id: uid(), ogrenciId: ogr1, kocId: kocId, sira: 2, ders: "Matematik", konu: "Sayı Basamakları", hedef: "Konu tekrarı + 50 soru", xp: 50, tamamlandi: true },
      { id: uid(), ogrenciId: ogr1, kocId: kocId, sira: 3, ders: "Matematik", konu: "Bölme – Bölünebilme", hedef: "40 soru + yanlış analizi", xp: 60, tamamlandi: false },
      { id: uid(), ogrenciId: ogr1, kocId: kocId, sira: 4, ders: "Matematik", konu: "Rasyonel Sayılar", hedef: "Konu tekrarı + 50 soru", xp: 50, tamamlandi: false },
      { id: uid(), ogrenciId: ogr1, kocId: kocId, sira: 5, ders: "Matematik", konu: "Eşitsizlikler", hedef: "40 soru + 1 branş denemesi", xp: 80, tamamlandi: false },
      { id: uid(), ogrenciId: ogr2, kocId: kocId, sira: 1, ders: "Fen Bilimleri", konu: "Kuvvet ve Hareket", hedef: "Konu tekrarı + 30 soru", xp: 50, tamamlandi: false },
      { id: uid(), ogrenciId: ogr2, kocId: kocId, sira: 2, ders: "Fen Bilimleri", konu: "Basınç", hedef: "30 soru + deney videosu", xp: 60, tamamlandi: false }
    ];
  }

  /* ── Veri okuma / yazma ──────────────────────────────────── */
  function veri() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(VERI_KEY)); } catch (e) { d = null; }
    if (!d || !Array.isArray(d.users)) {
      d = tohumVerisi();
      kaydet(d);
    }
    /* Eski kayıtlar için migrasyon: yol haritası ve telefon alanları */
    if (!Array.isArray(d.yol)) {
      const koc = d.users.find(x => x.rol === "koc");
      const ogrler = d.users.filter(x => x.rol === "ogrenci");
      d.yol = (koc && ogrler.length)
        ? demoYol(koc.id, ogrler[0].id, (ogrler[1] || ogrler[0]).id)
        : [];
      const tohum = tohumVerisi().users;
      d.users.forEach(u => {
        if (u.rol !== "ogrenci") return;
        const t = tohum.find(x => x.kullanici === u.kullanici);
        if (u.telefon === undefined) u.telefon = t ? t.telefon : "";
        if (u.veliTelefon === undefined) u.veliTelefon = t ? t.veliTelefon : "";
      });
      kaydet(d);
    }
    /* Sürüm 2: başlangıç profili + ders bazında deneme detayı */
    if (!d.surum || d.surum < 2) {
      const elif = d.users.find(x => x.kullanici === "ogrenci1");
      if (elif && !elif.profil) elif.profil = demoProfil();
      const taze = tohumVerisi().denemeler;
      d.denemeler.forEach(dn => {
        if (!dn.dersler) {
          const t = taze.find(x => x.ad === dn.ad && x.tur === dn.tur);
          if (t) dn.dersler = t.dersler;
        }
      });
      d.surum = 2;
      kaydet(d);
    }
    /* Sürüm 3: özel ders kayıtları (demo kullanıcılar varsa örnek derslerle) */
    if (!Array.isArray(d.ozelDersler)) {
      const koc = d.users.find(x => x.rol === "koc");
      const o1 = d.users.find(x => x.kullanici === "ogrenci1");
      const o2 = d.users.find(x => x.kullanici === "ogrenci2");
      d.ozelDersler = (koc && o1)
        ? tohumVerisi().ozelDersler.map(x => Object.assign({}, x, {
            kocId: koc.id,
            ogrenciId: x.ogrenciId === "ogr_demo_2" ? (o2 ? o2.id : o1.id) : o1.id
          }))
        : [];
      d.surum = 3;
      kaydet(d);
    }
    /* Sürüm 4: karşılıklı onay akışı (talep/öneri) alanları */
    if (!d.surum || d.surum < 4) {
      d.ozelDersler.forEach(x => {
        if (!x.olusturan) x.olusturan = "koc";
        if (x.mesaj === undefined) x.mesaj = "";
        if (x.redNotu === undefined) x.redNotu = "";
      });
      d.surum = 4;
      kaydet(d);
    }
    /* Sürüm 5: bildirimler — bekleyen taleplerden başlangıç bildirimleri üretilir */
    if (!Array.isArray(d.bildirimler)) {
      d.bildirimler = [];
      d.ozelDersler.filter(x => x.durum === "talep").forEach(x => {
        const o = d.users.find(u => u.id === x.ogrenciId);
        const m = x.ders + (x.konu ? " – " + x.konu : "") + " · " + tarihStr(x.tarih) + (x.saat ? " " + x.saat : "");
        const hedef = { tur: "ozel", ogrenciId: x.ogrenciId, kayitId: x.id };
        if (x.olusturan === "ogrenci") {
          d.bildirimler.push({ id: uid(), aliciId: x.kocId, ikon: "🙋", metin: (o ? o.ad : "Öğrenci") + " özel ders talebi gönderdi: " + m, hedef: hedef, tarih: simdiStr(), okundu: false });
        } else {
          d.bildirimler.push({ id: uid(), aliciId: x.ogrenciId, ikon: "📨", metin: "Öğretmenin özel ders önerdi: " + m + " · Onayın bekleniyor.", hedef: hedef, tarih: simdiStr(), okundu: false });
        }
      });
      d.surum = 5;
      kaydet(d);
    }
    /* Sürüm 6: eski bildirimlere hedef bağla (metinden ilgili özel ders kaydı bulunur) */
    if (!d.surum || d.surum < 6) {
      d.bildirimler.forEach(b => {
        if (b.hedef !== undefined && b.hedef !== null) return;
        const x = d.ozelDersler.find(x =>
          b.metin.indexOf(x.ders + (x.konu ? " – " + x.konu : "")) !== -1);
        b.hedef = x ? { tur: "ozel", ogrenciId: x.ogrenciId, kayitId: x.id } : null;
      });
      d.surum = 6;
      kaydet(d);
    }
    return d;
  }
  function kaydet(d) {
    localStorage.setItem(VERI_KEY, JSON.stringify(d));
  }

  /* ── Oturum ──────────────────────────────────────────────── */
  function girisYap(kullanici, sifre, rol) {
    const u = veri().users.find(x =>
      x.kullanici === String(kullanici).trim().toLowerCase() &&
      x.sifre === sifre && x.rol === rol);
    if (!u) return null;
    localStorage.setItem(OTURUM_KEY, JSON.stringify({ userId: u.id, rol: u.rol }));
    return u;
  }
  function oturum() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(OTURUM_KEY)); } catch (e) { s = null; }
    if (!s) return null;
    const u = veri().users.find(x => x.id === s.userId);
    return u || null;
  }
  function cikisYap() {
    localStorage.removeItem(OTURUM_KEY);
    location.href = "giris.html";
  }
  /* Sayfa koruması: yanlış rol ya da oturum yoksa girişe yönlendirir. */
  function korumali(rol) {
    const u = oturum();
    if (!u || u.rol !== rol) { location.href = "giris.html"; return null; }
    return u;
  }

  /* ── Uygulama menüsü (öğretmen / öğrenci ayrı) ───────────────
     Yeni bir panel sayfası eklendikçe sadece buraya bir satır
     eklemek yeterli; koc-panel/ogrenci-panel/bildirimler bu
     listeyi menuCiz() üzerinden okur. */
  const MENU = {
    koc: [
      { href: "koc-panel.html", ikon: "🎓", ad: "Panelim" },
      { href: "odev-olustur.html", ikon: "📝", ad: "Ödev Oluştur" },
      { href: "bep-olustur.html", ikon: "📋", ad: "BEP Oluştur" },
      { href: "bildirimler.html", ikon: "🔔", ad: "Bildirimler", bildirim: true },
    ],
    ogrenci: [
      { href: "ogrenci-panel.html", ikon: "🏠", ad: "Panelim" },
      { href: "bildirimler.html", ikon: "🔔", ad: "Bildirimler", bildirim: true },
    ],
  };
  /* kutu: menünün çizileceği <nav> öğesi, kullanici: oturum sahibi,
     aktifSayfa: örn. "koc-panel.html" (o bağlantı aktif işaretlenir). */
  function menuCiz(kutu, kullanici, aktifSayfa) {
    if (!kutu || !kullanici) return;
    const kalemler = MENU[kullanici.rol] || [];
    const okunmamis = bildirimOkunmamis(kullanici.id);
    kutu.innerHTML = kalemler.map(m => {
      const aktif = m.href === aktifSayfa;
      const rozet = m.bildirim && okunmamis
        ? `<span class="menu-rozet">${okunmamis > 99 ? "99+" : okunmamis}</span>` : "";
      return `<a href="${m.href}" class="menu-link${aktif ? " aktif" : ""}">${m.ikon} ${m.ad}${rozet}</a>`;
    }).join("");
  }

  /* ── Kullanıcı işlemleri ─────────────────────────────────── */
  function ogrenciEkle(kocId, bilgi) {
    const d = veri();
    if (d.users.some(x => x.kullanici === bilgi.kullanici)) {
      return { hata: "Bu kullanıcı adı zaten kayıtlı." };
    }
    const yeni = {
      id: uid(), rol: "ogrenci", ad: bilgi.ad,
      kullanici: String(bilgi.kullanici).trim().toLowerCase(), sifre: bilgi.sifre,
      sinif: bilgi.sinif || "", hedef: bilgi.hedef || "", kocId: kocId,
      telefon: telefonDuzelt(bilgi.telefon), veliTelefon: telefonDuzelt(bilgi.veliTelefon)
    };
    d.users.push(yeni);
    kaydet(d);
    return { ogrenci: yeni };
  }
  function atanmamisOgrenciler() {
    return veri().users.filter(x => x.rol === "ogrenci" && !x.kocId);
  }
  function ogrenciAta(ogrenciId, kocId) {
    const d = veri();
    const o = d.users.find(x => x.id === ogrenciId);
    if (o) { o.kocId = kocId; kaydet(d); }
  }
  function ogrencilerim(kocId) {
    return veri().users.filter(x => x.rol === "ogrenci" && x.kocId === kocId);
  }
  function kullanici(id) {
    return veri().users.find(x => x.id === id) || null;
  }
  /* Telefonu WhatsApp (wa.me) biçimine çevirir: 05xx… → 905xx… */
  function telefonDuzelt(t) {
    let s = String(t || "").replace(/\D/g, "");
    if (!s) return "";
    if (s.startsWith("0")) s = "9" + s;
    if (s.length === 10 && s.startsWith("5")) s = "90" + s;
    return s;
  }
  function telefonGuncelle(ogrenciId, alanlar) {
    const d = veri();
    const o = d.users.find(x => x.id === ogrenciId);
    if (!o) return;
    if (alanlar.telefon !== undefined) o.telefon = telefonDuzelt(alanlar.telefon);
    if (alanlar.veliTelefon !== undefined) o.veliTelefon = telefonDuzelt(alanlar.veliTelefon);
    kaydet(d);
  }

  /* ── Ödev işlemleri ──────────────────────────────────────── */
  function odevler(filtre) {
    return veri().odevler.filter(o =>
      (!filtre.ogrenciId || o.ogrenciId === filtre.ogrenciId) &&
      (!filtre.kocId || o.kocId === filtre.kocId));
  }
  function odevEkle(o) {
    const d = veri();
    const kayit = Object.assign({ id: uid(), durum: "bekliyor", olusturma: bugun() }, o);
    d.odevler.push(kayit);
    kaydet(d);
    bildirimEkle(kayit.ogrenciId, "📘",
      "Yeni ödev: " + kayit.ders + " – " + kayit.konu +
      (kayit.sonTarih ? " · Son tarih: " + tarihStr(kayit.sonTarih) : ""),
      { tur: "odev", ogrenciId: kayit.ogrenciId, kayitId: kayit.id });
  }
  function odevSil(id) {
    const d = veri();
    d.odevler = d.odevler.filter(x => x.id !== id);
    kaydet(d);
  }
  function odevDurum(id, durum) {
    const d = veri();
    const o = d.odevler.find(x => x.id === id);
    if (!o) return;
    const eski = o.durum;
    o.durum = durum;
    kaydet(d);
    if (durum === "tamamlandi" && eski !== "tamamlandi") {
      const ogrAd = (kullanici(o.ogrenciId) || {}).ad || "Öğrenci";
      bildirimEkle(o.kocId, "✅", ogrAd + " bir ödevi tamamladı: " + o.ders + " – " + o.konu,
        { tur: "odev", ogrenciId: o.ogrenciId, kayitId: o.id });
    }
  }

  /* ── Takip listesi işlemleri ─────────────────────────────── */
  function takipListesi(filtre) {
    return veri().takip.filter(t =>
      (!filtre.ogrenciId || t.ogrenciId === filtre.ogrenciId) &&
      (!filtre.kocId || t.kocId === filtre.kocId));
  }
  function takipEkle(t) {
    const d = veri();
    d.takip.push(Object.assign({ id: uid(), tamamlandi: false }, t));
    kaydet(d);
  }
  function takipSil(id) {
    const d = veri();
    d.takip = d.takip.filter(x => x.id !== id);
    kaydet(d);
  }
  function takipDurum(id, tamamlandi) {
    const d = veri();
    const t = d.takip.find(x => x.id === id);
    if (t) { t.tamamlandi = tamamlandi; kaydet(d); }
  }

  /* ── Başlangıç seviye profili ────────────────────────────── */
  function profilKaydet(ogrenciId, profil) {
    const d = veri();
    const o = d.users.find(x => x.id === ogrenciId);
    if (!o) return;
    o.profil = Object.assign({ tarih: bugun() }, profil);
    kaydet(d);
  }

  /* ── Zayıf konu analizi ──────────────────────────────────────
     Denemelerdeki "yanlış yapılan konular" + başlangıç formundaki
     eksik konuları birleştirip sıklığa göre sıralar. */
  function zayifKonular(ogrenciId) {
    const sayac = {};
    function ekle(ders, konu, kaynak) {
      const k = String(konu || "").trim();
      if (!k) return;
      const anahtar = (ders + "||" + k).toLowerCase();
      if (!sayac[anahtar]) sayac[anahtar] = { ders: ders, konu: k, kez: 0, kaynaklar: [] };
      sayac[anahtar].kez++;
      if (sayac[anahtar].kaynaklar.indexOf(kaynak) === -1) sayac[anahtar].kaynaklar.push(kaynak);
    }
    denemeler(ogrenciId).forEach(dn =>
      (dn.dersler || []).forEach(dr =>
        (dr.yanlisKonular || []).forEach(k => ekle(dr.ders, k, "deneme"))));
    const u = kullanici(ogrenciId);
    if (u && u.profil) {
      (u.profil.dersler || []).forEach(pd =>
        (pd.eksik || []).forEach(k => ekle(pd.ders, k, "başlangıç formu")));
    }
    return Object.keys(sayac).map(k => sayac[k])
      .sort((a, b) => b.kez - a.kez || a.ders.localeCompare(b.ders, "tr"));
  }

  /* ── Deneme sonuçları ────────────────────────────────────── */
  function denemeler(ogrenciId) {
    return veri().denemeler
      .filter(x => x.ogrenciId === ogrenciId)
      .sort((a, b) => a.tarih.localeCompare(b.tarih));
  }
  function denemeEkle(dn) {
    const d = veri();
    d.denemeler.push(Object.assign({ id: uid() }, dn));
    kaydet(d);
  }
  function denemeSil(id) {
    const d = veri();
    d.denemeler = d.denemeler.filter(x => x.id !== id);
    kaydet(d);
  }

  /* ── Yol haritası (oyunlaştırılmış ilerleme) ─────────────── */
  function yolAdimlari(ogrenciId) {
    return veri().yol
      .filter(x => x.ogrenciId === ogrenciId)
      .sort((a, b) => a.sira - b.sira);
  }
  function yolEkle(adim) {
    const d = veri();
    const mevcut = d.yol.filter(x => x.ogrenciId === adim.ogrenciId);
    const sira = mevcut.length ? Math.max.apply(null, mevcut.map(x => x.sira)) + 1 : 1;
    d.yol.push(Object.assign({ id: uid(), sira: sira, xp: 50, tamamlandi: false }, adim));
    kaydet(d);
  }
  function yolSil(id) {
    const d = veri();
    d.yol = d.yol.filter(x => x.id !== id);
    kaydet(d);
  }
  /* Sadece sıradaki (aktif) adım tamamlanabilir; geri alma son tamamlanan adımda geçerlidir. */
  function yolTamamla(id, tamamlandi) {
    const d = veri();
    const a = d.yol.find(x => x.id === id);
    if (a) { a.tamamlandi = tamamlandi; kaydet(d); }
  }
  /* Her adımın oyun durumu: tamamlandi | aktif | kilitli */
  function yolDurumlu(ogrenciId) {
    const liste = yolAdimlari(ogrenciId);
    let aktifVerildi = false;
    return liste.map(a => {
      let durum = "tamamlandi";
      if (!a.tamamlandi) {
        durum = aktifVerildi ? "kilitli" : "aktif";
        aktifVerildi = true;
      }
      return Object.assign({}, a, { durum: durum });
    });
  }
  function xpOzet(ogrenciId) {
    const liste = yolAdimlari(ogrenciId);
    const tamamlanan = liste.filter(x => x.tamamlandi);
    const xp = tamamlanan.reduce((t, x) => t + (x.xp || 50), 0);
    const seviye = Math.floor(xp / 100) + 1;
    const yuzde = liste.length ? Math.round(100 * tamamlanan.length / liste.length) : 0;
    const rozetler = [];
    if (tamamlanan.length >= 1) rozetler.push({ ikon: "🚀", ad: "İlk Adım" });
    if (tamamlanan.length >= 3) rozetler.push({ ikon: "🔥", ad: "3 Adım Serisi" });
    if (liste.length && yuzde >= 50) rozetler.push({ ikon: "🌗", ad: "Yarı Yol" });
    if (xp >= 300) rozetler.push({ ikon: "💎", ad: "300 XP Kulübü" });
    if (liste.length && yuzde === 100) rozetler.push({ ikon: "🏆", ad: "Yol Tamamlandı" });
    return {
      xp: xp, seviye: seviye,
      seviyeIci: xp % 100, // bir sonraki seviyeye ilerleme (0-99)
      tamamlanan: tamamlanan.length, toplam: liste.length,
      yuzde: yuzde, rozetler: rozetler
    };
  }

  /* ── Bildirimler ─────────────────────────────────────────── */
  /* hedef: { tur: "ozel"|"odev", ogrenciId, kayitId } — tıklayınca ilgili kayda gitmek için */
  function bildirimEkle(aliciId, ikon, metin, hedef) {
    if (!aliciId) return;
    const d = veri();
    d.bildirimler.unshift({ id: uid(), aliciId: aliciId, ikon: ikon, metin: metin, hedef: hedef || null, tarih: simdiStr(), okundu: false });
    if (d.bildirimler.length > 200) d.bildirimler.length = 200; // eski kayıtlar taşmasın
    kaydet(d);
  }
  function bildirimler(aliciId) {
    return veri().bildirimler.filter(b => b.aliciId === aliciId);
  }
  function bildirimOkunmamis(aliciId) {
    return bildirimler(aliciId).filter(b => !b.okundu).length;
  }
  function bildirimOkundu(id, okundu) {
    const d = veri();
    const b = d.bildirimler.find(x => x.id === id);
    if (b) { b.okundu = okundu === undefined ? true : okundu; kaydet(d); }
  }
  function bildirimTumunuOkundu(aliciId) {
    const d = veri();
    d.bildirimler.forEach(b => { if (b.aliciId === aliciId) b.okundu = true; });
    kaydet(d);
  }
  function bildirimSil(id) {
    const d = veri();
    d.bildirimler = d.bildirimler.filter(x => x.id !== id);
    kaydet(d);
  }
  function bildirimTemizle(aliciId) {
    const d = veri();
    d.bildirimler = d.bildirimler.filter(x => x.aliciId !== aliciId);
    kaydet(d);
  }

  /* ── Özel ders işlemleri ─────────────────────────────────── */
  /* Bildirim metinlerinde kullanılan kısa ders tanımı */
  function ozelDersMetni(x) {
    return x.ders + (x.konu ? " – " + x.konu : "") + " · " + tarihStr(x.tarih) + (x.saat ? " " + x.saat : "");
  }
  function ozelDersler(filtre) {
    filtre = filtre || {};
    return veri().ozelDersler
      .filter(x =>
        (!filtre.ogrenciId || x.ogrenciId === filtre.ogrenciId) &&
        (!filtre.kocId || x.kocId === filtre.kocId))
      .sort((a, b) => (a.tarih + "T" + (a.saat || "")).localeCompare(b.tarih + "T" + (b.saat || "")));
  }
  function ozelDersEkle(x) {
    const d = veri();
    const kayit = Object.assign(
      { id: uid(), durum: "planlandi", olusturan: "koc", odendi: false, mesaj: "", redNotu: "", not: "", odev: "", olusturma: bugun() }, x);
    d.ozelDersler.push(kayit);
    kaydet(d);
    /* Karşı tarafı bilgilendir */
    const m = ozelDersMetni(kayit);
    const ogrAd = (kullanici(kayit.ogrenciId) || {}).ad || "Öğrenci";
    const hedef = { tur: "ozel", ogrenciId: kayit.ogrenciId, kayitId: kayit.id };
    if (kayit.durum === "talep") {
      if (kayit.olusturan === "ogrenci") bildirimEkle(kayit.kocId, "🙋", ogrAd + " özel ders talebi gönderdi: " + m, hedef);
      else bildirimEkle(kayit.ogrenciId, "📨", "Öğretmenin özel ders önerdi: " + m + " · Onayın bekleniyor.", hedef);
    } else if (kayit.durum === "planlandi" && kayit.olusturan === "koc") {
      bildirimEkle(kayit.ogrenciId, "📅", "Öğretmenin özel ders planladı: " + m, hedef);
    }
  }
  function ozelDersSil(id) {
    const d = veri();
    d.ozelDersler = d.ozelDersler.filter(x => x.id !== id);
    kaydet(d);
  }
  function ozelDersGuncelle(id, alanlar) {
    const d = veri();
    const x = d.ozelDersler.find(y => y.id === id);
    if (!x) return;
    const eskiDurum = x.durum;
    const eskiOdendi = x.odendi;
    ["ders", "konu", "tarih", "saat", "sure", "ucret", "durum", "odendi", "not", "odev", "olusturan", "mesaj", "redNotu"].forEach(k => {
      if (alanlar[k] !== undefined) x[k] = alanlar[k];
    });
    kaydet(d);
    /* Durum değişimlerinde ilgili tarafı bilgilendir */
    const m = ozelDersMetni(x);
    const ogrAd = (kullanici(x.ogrenciId) || {}).ad || "Öğrenci";
    const hedef = { tur: "ozel", ogrenciId: x.ogrenciId, kayitId: x.id };
    if (alanlar.durum !== undefined && x.durum !== eskiDurum) {
      if (eskiDurum === "talep" && x.durum === "planlandi") {
        if (x.olusturan === "ogrenci") bildirimEkle(x.ogrenciId, "✅", "Özel ders talebin onaylandı: " + m + (+x.ucret ? " · " + x.ucret + " ₺" : ""), hedef);
        else bildirimEkle(x.kocId, "✅", ogrAd + " ders önerini onayladı: " + m, hedef);
      } else if (x.durum === "reddedildi") {
        const neden = x.redNotu ? " · Neden: " + x.redNotu : "";
        if (x.olusturan === "ogrenci") bildirimEkle(x.ogrenciId, "❌", "Özel ders talebin reddedildi: " + m + neden, hedef);
        else bildirimEkle(x.kocId, "❌", ogrAd + " ders önerini reddetti: " + m + neden, hedef);
      } else if (x.durum === "yapildi") {
        bildirimEkle(x.ogrenciId, "🎓", "Dersin yapıldı olarak işaretlendi: " + m + (x.odev ? " · Ders ödevi: " + x.odev : ""), hedef);
      } else if (x.durum === "iptal") {
        bildirimEkle(x.ogrenciId, "🚫", "Özel dersin iptal edildi: " + m, hedef);
      }
    }
    if (alanlar.odendi === true && !eskiOdendi) {
      bildirimEkle(x.ogrenciId, "💰", "Ders ödemen kaydedildi: " + m + (+x.ucret ? " · " + x.ucret + " ₺" : ""), hedef);
    }
  }
  /* Özel ders özeti: yapılan/planlı sayısı, toplam saat, bekleyen ödeme, sıradaki ders */
  function ozelDersOzet(filtre) {
    const liste = ozelDersler(filtre);
    const yapilan = liste.filter(x => x.durum === "yapildi");
    const planli = liste.filter(x => x.durum === "planlandi");
    const simdi = bugun();
    const gelecek = planli.filter(x => x.tarih >= simdi);
    const toplamDk = yapilan.reduce((t, x) => t + (+x.sure || 0), 0);
    const talepler = liste.filter(x => x.durum === "talep");
    return {
      toplam: liste.length,
      yapilan: yapilan.length,
      planlanan: planli.length,
      toplamSaat: Math.round(toplamDk / 6) / 10,
      bekleyenUcret: yapilan.filter(x => !x.odendi).reduce((t, x) => t + (+x.ucret || 0), 0),
      sonraki: gelecek.length ? gelecek[0] : null,
      gecikenPlan: planli.filter(x => x.tarih < simdi).length,
      /* Onay bekleyenler: öğrencinin talebi koçun, koçun önerisi öğrencinin onayını bekler */
      onayBekleyenKoc: talepler.filter(x => x.olusturan === "ogrenci").length,
      onayBekleyenOgr: talepler.filter(x => x.olusturan === "koc").length
    };
  }

  /* ── Özet istatistik ─────────────────────────────────────── */
  function ogrenciOzet(ogrenciId) {
    const od = odevler({ ogrenciId });
    const tk = takipListesi({ ogrenciId });
    const dn = denemeler(ogrenciId);
    const yolOz = xpOzet(ogrenciId);
    const odevTamam = od.filter(x => x.durum === "tamamlandi").length;
    const takipTamam = tk.filter(x => x.tamamlandi).length;
    return {
      odevToplam: od.length, odevTamam: odevTamam,
      odevYuzde: od.length ? Math.round(100 * odevTamam / od.length) : 0,
      takipToplam: tk.length, takipTamam: takipTamam,
      takipYuzde: tk.length ? Math.round(100 * takipTamam / tk.length) : 0,
      sonNet: dn.length ? dn[dn.length - 1].net : null,
      netFarki: dn.length >= 2 ? +(dn[dn.length - 1].net - dn[dn.length - 2].net).toFixed(2) : null,
      yolYuzde: yolOz.yuzde, xp: yolOz.xp, seviye: yolOz.seviye
    };
  }

  global.KA = {
    girisYap, oturum, cikisYap, korumali, menuCiz, MENU,
    ogrenciEkle, atanmamisOgrenciler, ogrenciAta, ogrencilerim, kullanici,
    telefonDuzelt, telefonGuncelle,
    odevler, odevEkle, odevSil, odevDurum,
    takipListesi, takipEkle, takipSil, takipDurum,
    denemeler, denemeEkle, denemeSil,
    ozelDersler, ozelDersEkle, ozelDersSil, ozelDersGuncelle, ozelDersOzet,
    bildirimler, bildirimEkle, bildirimOkundu, bildirimTumunuOkundu, bildirimSil, bildirimTemizle, bildirimOkunmamis,
    profilKaydet, zayifKonular,
    yolAdimlari, yolEkle, yolSil, yolTamamla, yolDurumlu, xpOzet,
    ogrenciOzet, bugun, gunKaydir, tarihStr,
    DENEME_DERSLERI, PROFIL_DERSLERI, netHesapla
  };
})(window);
