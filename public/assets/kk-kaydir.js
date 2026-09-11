/* ── KAYNAK KAMPÜS · KAYDIRMA (SCROLL) DAVRANIŞI ─────────────────────
   Site genelinde tek ortak kaydırma katmanı. Çok adımlı her akış (oyun
   seçimleri, testler, sihirbazlar, soru ekranları) bu dosyayı kullanır;
   kendi scrollTo kodunu yazmaz.

   Çözülen problem: "seç → sayfanın en üstüne fırla → tekrar aşağı kaydır".
   Ekran değiştiğinde kullanıcı çalışma alanında kalmalı, hero/navbar'a
   geri gönderilmemeli.

   Üç senaryo ayrılır:
     A. Gerçekten yeni bir sayfaya geçiş → tarayıcı normal davranır
        (buraya karışmıyoruz; gerekirse KKKaydir.basaGit() açıkça çağrılır).
     B. Aynı akışta içerik değişimi → çalışma alanı korunur; hedef zaten
        görünüyorsa hiç kımıldanmaz.
     C. Yeni adım ekran dışında → yalnız gerektiği kadar kaydırılır ve
        hedefin başlangıcı yapışkan başlığın ALTINA hizalanır.

   Dışa açılan API:
     KKKaydir.hizala(hedef, sec)   → B/C: çalışma alanına/adıma hizala
     KKKaydir.adim(hedef, sec)     → hizala'nın anlamlı takma adı
     KKKaydir.gorunurKil(hedef,s)  → yalnız ekran dışındaysa en az kaydırma
     KKKaydir.konumuKoru(ciz, capa)→ yeniden çizim sırasında göz hizasını tut
     KKKaydir.basaGit(sec)         → bilinçli olarak sayfanın tepesine
     KKKaydir.ustBosluk()          → yapışkan başlık yüksekliği (px, ölçülür)
     KKKaydir.olc()                → ölçümü tazele (yerleşim elle değiştiyse)

   sec (hepsi isteğe bağlı):
     bosluk     hedefin üstünde bırakılacak ek pay (px, varsayılan 12)
     zorla      true ise hedef görünse de hizalanır
     davranis   "smooth" | "auto" (varsayılan: smooth, azalt-hareket'te auto)
     kap        kaydırılacak kap (varsayılan: pencere)

   ÖLÇÜ SABİT DEĞİL: yapışkan başlığın yüksekliği her seferinde ölçülür.
   Telefon, tablet, akıllı tahta ve duyuru şeridi açık/kapalı durumlarında
   aynı kod doğru sonucu verir — sabit pixel değeri yoktur.

   Ek olarak html'e scroll-padding-top yazılır: bu tek satır sayesinde
   sayfadaki BÜTÜN #bağlantı sıçramaları ve scrollIntoView çağrıları da
   başlığın altına hizalanır (başlık artık içeriği örtmez).
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  if (window.KKKaydir) return;              // sayfa iki kez bağlarsa tek örnek

  var VARSAYILAN_BOSLUK = 12;               // hedefin üstünde nefes payı
  var TOLERANS = 6;                         // bu kadar sapma "hizalı" sayılır
  var onbellek = { ust: -1, gecerli: false };

  function az() {                           // kullanıcı hareketi azaltmış mı
    try {
      return window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return false; }
  }

  function davranisSec(sec) {
    if (sec && sec.davranis) return sec.davranis;
    return az() ? 'auto' : 'smooth';
  }

  function eleman(hedef) {
    if (!hedef) return null;
    if (typeof hedef === 'string') return document.querySelector(hedef);
    if (hedef.nodeType === 1) return hedef;
    return null;
  }

  /* ── Yapışkan başlık ölçümü ───────────────────────────────────────
     Seçici listesi tutmuyoruz: gövdenin sığ katmanları taranır ve
     position:sticky/fixed olup tepeye yapışanlar toplanır. Böylece
     .site-header, panel üst barı ve sonradan eklenen herhangi bir
     yapışkan şerit kendiliğinden hesaba katılır.

     Ölçülen şey "şu anki yeri" değil, YAPIŞTIĞINDA kaplayacağı yerdir:
     sayfa başındayken yapışkan başlığın üstünde duyuru şeridi olabilir
     ve o an tepede görünmez — ama kaydırma bittiğinde tepeyi kaplar.
     Bu ayrım olmadan hizalanan içerik başlığın altında kalıyordu.

     İki koruma var:
       · top payı 0 olmayanlar (mobil çekmece: inset 72px 0 0 0, kenar
         çubuğu: top var(--ustbar-h)) sayılmaz — içeriği örtmezler.
       · viewport'un %40'ından yüksek olanlar atlanır: açık bir kip
         pencere ya da perde başlık sanılmasın. */
  var TARAMA_SINIRI = 400;    // gezilecek en fazla düğüm (başlıklar sığ durur)

  /* Yapışkan başlık adayları: gövdenin sığ katmanları + şu an tepede
     duran her şey. Sığ tarama şart, çünkü sayfa başındayken yapışkan
     başlık henüz tepeye yapışmamış olabilir (üstünde duyuru şeridi
     vardır) ve nokta okuması onu göremez. */
  function adaylar() {
    var liste = [], sayac = 0;
    function gez(el, derinlik) {
      var c = el.children, i;
      for (i = 0; i < c.length; i++) {
        if (sayac >= TARAMA_SINIRI) return;
        var t = c[i].tagName;
        if (t === 'SCRIPT' || t === 'STYLE' || t === 'LINK' || t === 'TEMPLATE') continue;
        liste.push(c[i]); sayac++;
        if (derinlik > 0) gez(c[i], derinlik - 1);
      }
    }
    if (document.body) gez(document.body, 3);
    if (document.elementsFromPoint) {
      var gen = window.innerWidth || 0;
      var xler = [Math.round(gen / 2), 6, Math.max(0, gen - 6)], k, j;
      for (k = 0; k < xler.length; k++) {
        var yigin;
        try { yigin = document.elementsFromPoint(xler[k], 1) || []; }
        catch (e) { yigin = []; }
        for (j = 0; j < yigin.length; j++) liste.push(yigin[j]);
      }
    }
    return liste;
  }

  /* Bir adayın "yapıştığında" viewport tepesinde kaplayacağı yükseklik.
     Yapışmamış (sticky) bir başlık için bu, top payı + kendi boyudur;
     sabit (fixed) bir başlık için zaten bulunduğu yerdir. Örtmeyenler
     ve perde/kip pencere gibi büyük katmanlar 0 döner. */
  function adayPayi(el, yuk) {
    if (!el || el === document.body || el === document.documentElement) return 0;
    var stil;
    try { stil = window.getComputedStyle(el); } catch (e) { return 0; }
    var kon = stil.position;
    if (kon !== 'fixed' && kon !== 'sticky') return 0;
    if (stil.visibility === 'hidden' || stil.display === 'none') return 0;
    var r = el.getBoundingClientRect();
    if (!r.height || !r.width) return 0;
    if (yuk && r.height > yuk * 0.4) return 0;          // perde / kip pencere
    var t = parseFloat(stil.top);
    if (!isFinite(t) || t > 4 || t < -1) return 0;      // tepeye yapışmıyor
    if (kon === 'fixed') return r.top > 4 ? 0 : r.bottom;
    return Math.max(0, t) + r.height;                   // sticky: yapışınca
  }

  function olcUst() {
    var yuk = window.innerHeight || 0;
    var liste = adaylar(), en = 0, i;
    for (i = 0; i < liste.length; i++) {
      var p = adayPayi(liste[i], yuk);
      if (p > en) en = p;
    }
    return Math.max(0, Math.round(en));
  }

  function ustBosluk() {
    if (!onbellek.gecerli) {
      onbellek.ust = olcUst();
      onbellek.gecerli = true;
      /* Yerel #bağlantı sıçramaları ve scrollIntoView çağrıları da
         aynı payı kullansın (site-tema.css / globals.css okur). */
      try {
        document.documentElement.style.setProperty(
          '--kk-yapiskan-ust', onbellek.ust + 'px');
      } catch (e) { /* stil yazılamıyorsa hizalama yine JS ile çalışır */ }
    }
    return onbellek.ust;
  }

  function olc() { onbellek.gecerli = false; return ustBosluk(); }

  /* Ölçüm kaydırma konumundan bağımsızdır (yapışkan başlığın YAPIŞTIĞINDA
     kaplayacağı yer okunur), bu yüzden scroll'da tazelemek gerekmez.
     Yerleşimi değiştiren olaylarda bayrak düşer, ilk kullanımda ölçülür. */
  function bayatla() { onbellek.gecerli = false; }
  window.addEventListener('resize', bayatla);
  window.addEventListener('orientationchange', bayatla);
  document.addEventListener('kk-yerlesim-degisti', bayatla);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', bayatla);
  }

  /* ── Kap yardımcıları ─────────────────────────────────────────────
     Varsayılan kap penceredir. Kendi içinde kayan bir kap verilirse
     (panel gövdesi, liste kutusu) aynı mantık orada uygulanır. */
  function kapYuksekligi(kap) {
    return kap ? kap.clientHeight : (window.innerHeight || 0);
  }
  function kapUstu(kap) {
    return kap ? kap.getBoundingClientRect().top : 0;
  }
  function kapKonumu(kap) {
    if (kap) return kap.scrollTop;
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }
  function kapKaydir(kap, y, davranis) {
    y = Math.max(0, Math.round(y));
    if (kap) {
      if (kap.scrollTo) { try { kap.scrollTo({ top: y, behavior: davranis }); return; } catch (e) {} }
      kap.scrollTop = y;
      return;
    }
    if (window.scrollTo) {
      try { window.scrollTo({ top: y, behavior: davranis }); return; } catch (e) {}
    }
    window.scrollTo(0, y);
  }

  /**
   * B/C senaryosu — çalışma alanına ya da yeni adıma hizala.
   *
   * Hedef, yapışkan başlığın hemen altına gelecek şekilde hizalanır; ama
   * yalnız gerektiğinde:
   *   · zaten hizalıysa (tolerans içinde) kımıldanmaz,
   *   · hedef bütünüyle görünüyorsa kımıldanmaz,
   *   · aksi hâlde en az kaydırma ile hedefin başı görünür kılınır.
   * Hiçbir durumda "sayfanın tepesine git" davranışı üretmez.
   *
   * @returns {boolean} kaydırma yapıldıysa true
   */
  function hizala(hedef, sec) {
    var el = eleman(hedef);
    if (!el) return false;
    sec = sec || {};
    var kap = eleman(sec.kap) || null;
    var pay = (typeof sec.bosluk === 'number' ? sec.bosluk : VARSAYILAN_BOSLUK);
    var ust = kapUstu(kap) + (kap ? 0 : ustBosluk()) + pay;
    var r = el.getBoundingClientRect();
    var dip = kapUstu(kap) + kapYuksekligi(kap);

    if (!sec.zorla) {
      if (Math.abs(r.top - ust) <= TOLERANS) return false;   // hizalı
      if (r.top >= ust && r.bottom <= dip) return false;     // bütünüyle görünür
    }
    kapKaydir(kap, kapKonumu(kap) + r.top - ust, davranisSec(sec));
    return true;
  }

  /**
   * C senaryosu — yalnız ekran dışında kalıyorsa en az kaydırma.
   * Hedefin üstü görünüyorsa hiç dokunmaz (uzun içerikte başa çekmez).
   */
  function gorunurKil(hedef, sec) {
    var el = eleman(hedef);
    if (!el) return false;
    sec = sec || {};
    var kap = eleman(sec.kap) || null;
    var pay = (typeof sec.bosluk === 'number' ? sec.bosluk : VARSAYILAN_BOSLUK);
    var ust = kapUstu(kap) + (kap ? 0 : ustBosluk()) + pay;
    var dip = kapUstu(kap) + kapYuksekligi(kap);
    var r = el.getBoundingClientRect();

    if (r.top >= ust && r.top < dip) return false;   // başı görünüyor: yeter
    if (r.top < ust) {                                // yukarıda kaldı
      kapKaydir(kap, kapKonumu(kap) + r.top - ust, davranisSec(sec));
      return true;
    }
    /* Aşağıda: sığıyorsa dibe yasla, sığmıyorsa başını hizala */
    if (r.height <= dip - ust) {
      kapKaydir(kap, kapKonumu(kap) + r.bottom - dip + pay, davranisSec(sec));
    } else {
      kapKaydir(kap, kapKonumu(kap) + r.top - ust, davranisSec(sec));
    }
    return true;
  }

  /**
   * Yeniden çizim sırasında göz hizasını koru.
   *
   * innerHTML değişince içerik kısalırsa tarayıcı kaydırma konumunu
   * kırpar; kullanıcı istemeden yukarı savrulur. `capa` olarak verilen
   * eleman (seçici vermek en güvenlisi: çizimden sonra yenisi bulunur)
   * çizim öncesindeki ekran hizasında tutulur.
   *
   * @param {Function} ciz   içeriği değiştiren işlev
   * @param {string|Element} capa  hizası korunacak eleman ya da seçicisi
   */
  function konumuKoru(ciz, capa) {
    var oncekiEl = eleman(capa);
    var oncekiTop = oncekiEl ? oncekiEl.getBoundingClientRect().top : null;
    var sonuc = ciz();
    if (oncekiTop == null) return sonuc;
    var yeniEl = eleman(capa);
    if (!yeniEl) return sonuc;
    var fark = yeniEl.getBoundingClientRect().top - oncekiTop;
    if (Math.abs(fark) > 1) kapKaydir(null, kapKonumu(null) + fark, 'auto');
    return sonuc;
  }

  /** A senaryosu — bilinçli olarak sayfanın tepesine (nadiren gerekir). */
  function basaGit(sec) {
    kapKaydir(eleman(sec && sec.kap) || null, 0, davranisSec(sec));
  }

  window.KKKaydir = {
    hizala: hizala,
    adim: hizala,                 // akış adımları için anlamlı ad
    gorunurKil: gorunurKil,
    konumuKoru: konumuKoru,
    basaGit: basaGit,
    ustBosluk: ustBosluk,
    olc: olc
  };

  /* ── Güvenlik ağı: boş çapa sıçramaları ───────────────────────────
     href="#" bağlantıları sayfayı tepeye atar ve adrese "#" yazar.
     Yer tutucu/işlevsiz bağlantılarda bu sıçrama engellenir; gerçek
     hedefi olan (#bolum) bağlantılara dokunulmaz. */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href="#"]') : null;
    if (a) e.preventDefault();
  });

  /* İlk ölçüm: yerleşim oturduktan sonra scroll-padding yazılsın ki
     sayfaya #bağlantı ile girildiğinde de başlık içeriği örtmesin. */
  function ilkOlcum() { onbellek.gecerli = false; ustBosluk(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ilkOlcum);
  } else {
    ilkOlcum();
  }
  window.addEventListener('load', ilkOlcum);
})();
