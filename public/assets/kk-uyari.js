/* ── KAYNAK KAMPÜS · UYARI / ONAY PENCERELERİ ────────────────────────
   Tarayıcının alert() / confirm() / prompt() kutularının yerini alan tek
   ortak katman. Tüm public sayfalarda aynı dosya kullanılır; stil kendi
   içindedir (site-tema.css token'larını okur, yoksa yedek değere düşer).

   Dışa açılan API — hepsi Promise döndürür:
     KKUyari.bilgi(mesaj, sec)   → Promise<void>     bilgilendirme
     KKUyari.basari(mesaj, sec)  → Promise<void>     olumlu sonuç
     KKUyari.uyari(mesaj, sec)   → Promise<void>     dikkat / eksik girdi
     KKUyari.hata(mesaj, sec)    → Promise<void>     başarısız işlem
     KKUyari.onay(mesaj, sec)    → Promise<boolean>  confirm() karşılığı
     KKUyari.sor(mesaj, sec)     → Promise<string|null>  prompt() karşılığı
     KKUyari.bildir(mesaj, sec)  → void   kısa ömürlü şerit (kesintisiz bilgi)
     KKUyari.kapat()             → açık pencereyi iptal ederek kapatır

   sec (hepsi isteğe bağlı):
     baslik, altBaslik, ikon, onayEtiketi, iptalEtiketi,
     tehlikeli  (onay: birincil düğme kırmızı olur — geri alınamaz işlem)
     varsayilan, yerTutucu, cokSatir  (yalnız sor)
     sure       (yalnız bildir; ms, varsayılan 3200)

   Kullanım — confirm/prompt eşdeğerleri async'e döner:
     if (!(await KKUyari.onay("Silinsin mi?"))) return;
     var ad = await KKUyari.sor("Adın?", { varsayilan: "" });

   window.alert ayrıca bu katmana bağlanır (güvenlik ağı: gözden kaçan ya da
   sonradan eklenen alert çağrıları da düzgün pencereyle çıkar). Tarayıcının
   özgün kutusu KKUyari.yerelUyari ile erişilebilir kalır. confirm/prompt
   eşzamanlı değer döndürdüğü için ezilemez — çağrı yerleri await'e çevrilir.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  if (window.KKUyari) return; // sayfa iki kez bağlarsa tek örnek kalsın

  var TURLER = {
    bilgi:  { ikon: 'ℹ️', baslik: 'Bilgi' },
    basari: { ikon: '✅', baslik: 'Tamam' },
    uyari:  { ikon: '⚠️', baslik: 'Dikkat' },
    hata:   { ikon: '⛔', baslik: 'İşlem tamamlanamadı' },
    onay:   { ikon: '❓', baslik: 'Onay gerekiyor' },
    sor:    { ikon: '✏️', baslik: 'Bilgi gerekiyor' }
  };

  /* ── Stil ─────────────────────────────────────────────────────────
     Statik sayfalar tek temalı (açık) olduğu için renkler sabit; ölçü ve
     yazı tipleri site-tema.css token'larından gelir, token yoksa yedek. */
  var STIL = [
    '.kk-uyari-pencere{',
    /* Sayfa reset'leri "* { margin:0 }" yazdığında tarayıcının
       kip pencereyi ortalayan margin:auto kuralı eziliyor — burada geri verilir.
       height:fit-content şart: inset:0 dikeyde yayılmayı tetikler. */
    '  position:fixed;inset:0;margin:auto;height:fit-content;',
    '  width:min(460px,calc(100vw - 32px));max-height:calc(100vh - 40px);overflow:auto;',
    '  box-sizing:border-box;padding:24px;border:1px solid var(--duman,#E4DBD9);',
    /* --radius-lg: site-tema.css bu yarıçapı kip pencere için ayırıyor */
    '  border-radius:var(--radius-lg,24px);background:var(--beyaz,#fff);',
    '  color:var(--grafit,#55474C);box-shadow:0 18px 48px rgba(31,20,26,.22);',
    '  font-family:var(--font-govde,ui-sans-serif,system-ui,sans-serif);',
    '  font-size:var(--text-body,16px);line-height:1.5;text-align:left;',
    '}',
    '.kk-uyari-pencere::backdrop{background:rgba(31,20,26,.55);backdrop-filter:blur(2px);}',
    '.kk-uyari-pencere[open]{animation:kkUyariGir .18s ease-out;}',
    '@keyframes kkUyariGir{from{opacity:0;transform:translateY(10px) scale(.98);}to{opacity:1;transform:none;}}',
    '@media (prefers-reduced-motion:reduce){.kk-uyari-pencere[open]{animation:none;}}',

    '.kk-uyari-bas{display:flex;gap:14px;align-items:flex-start;}',
    '.kk-uyari-ikon{',
    '  flex:0 0 auto;width:42px;height:42px;border-radius:var(--radius-sm,12px);',
    '  background:var(--gul-sis,#F6EDEF);font-size:20px;line-height:1;',
    '  display:flex;align-items:center;justify-content:center;',
    '}',
    '.kk-uyari-pencere[data-tur="hata"] .kk-uyari-ikon{background:#FDECEA;}',
    '.kk-uyari-pencere[data-tur="basari"] .kk-uyari-ikon{background:#E9F5EE;}',
    '.kk-uyari-pencere[data-tur="uyari"] .kk-uyari-ikon{background:#FDF3E0;}',
    '.kk-uyari-baslik{',
    '  margin:0;font-family:var(--font-baslik,inherit);font-weight:700;',
    '  font-size:var(--text-subheading,20px);line-height:1.25;',
    '  letter-spacing:-.3px;color:var(--murekkep,#1F141A);',
    '}',
    '.kk-uyari-alt{display:block;margin-top:3px;font-size:var(--text-caption,12px);color:var(--kursun,#7C6F73);}',
    '.kk-uyari-metin{margin:14px 0 0;font-size:var(--text-body,16px);color:var(--grafit,#55474C);white-space:pre-line;}',
    '.kk-uyari-metin b,.kk-uyari-metin strong{color:var(--murekkep,#1F141A);}',

    '.kk-uyari-girdi{',
    '  display:block;width:100%;box-sizing:border-box;margin-top:14px;padding:11px 13px;',
    '  border:1px solid var(--duman,#E4DBD9);border-radius:var(--radius-sm,12px);',
    '  font-family:inherit;font-size:var(--text-body,16px);color:var(--murekkep,#1F141A);',
    '  background:var(--beyaz,#fff);',
    '}',
    'textarea.kk-uyari-girdi{min-height:92px;resize:vertical;line-height:1.5;}',
    '.kk-uyari-girdi:focus{outline:2px solid var(--murekkep,#1F141A);outline-offset:1px;border-color:var(--murekkep,#1F141A);}',

    '.kk-uyari-alt-sira{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:22px;}',
    '.kk-uyari-dugme{',
    '  display:inline-flex;align-items:center;justify-content:center;',
    '  padding:11px 20px;border-radius:var(--radius-sm,12px);border:1px solid transparent;',
    '  font-family:inherit;font-size:var(--text-small,14px);font-weight:600;line-height:1.2;',
    '  cursor:pointer;white-space:nowrap;transition:background .2s,color .2s,border-color .2s;',
    '}',
    '.kk-uyari-dugme.birincil{background:var(--murekkep,#1F141A);color:#fff;}',
    '.kk-uyari-dugme.birincil:hover{background:#322028;}',
    '.kk-uyari-dugme.birincil.tehlikeli{background:var(--kirmizi,#C0392B);}',
    '.kk-uyari-dugme.birincil.tehlikeli:hover{background:#9E2E22;}',
    '.kk-uyari-dugme.ikincil{background:transparent;color:var(--murekkep,#1F141A);border-color:var(--duman,#E4DBD9);}',
    '.kk-uyari-dugme.ikincil:hover{background:var(--sis,#F6F1F0);border-color:var(--murekkep,#1F141A);}',
    '@media (max-width:460px){',
    '  .kk-uyari-pencere{padding:20px;}',
    '  .kk-uyari-alt-sira{flex-direction:column-reverse;}',
    '  .kk-uyari-dugme{width:100%;}',
    '}',

    /* ── Kısa ömürlü şerit (bildir) ── */
    '.kk-serit-kap{',
    '  position:fixed;z-index:2147483000;left:50%;bottom:24px;transform:translateX(-50%);',
    '  display:flex;flex-direction:column;gap:8px;align-items:center;',
    '  width:max-content;max-width:calc(100vw - 32px);pointer-events:none;',
    '}',
    '.kk-serit{',
    '  display:flex;gap:10px;align-items:center;box-sizing:border-box;',
    '  padding:12px 18px;border-radius:var(--radius-sm,12px);',
    '  background:var(--murekkep,#1F141A);color:#fff;',
    '  font-family:var(--font-govde,ui-sans-serif,system-ui,sans-serif);',
    '  font-size:var(--text-small,14px);line-height:1.4;font-weight:500;',
    '  box-shadow:0 10px 28px rgba(31,20,26,.28);',
    '  animation:kkSeritGir .2s ease-out;pointer-events:auto;',
    '}',
    '.kk-serit[data-tur="hata"]{background:var(--kirmizi,#C0392B);}',
    '.kk-serit[data-tur="basari"]{background:var(--yesil,#2F8F5B);}',
    '.kk-serit[data-tur="uyari"]{background:var(--bordo,#7A2035);}',
    '.kk-serit-ikon{flex:0 0 auto;font-size:15px;line-height:1;}',
    '.kk-serit.cikiyor{animation:kkSeritCik .2s ease-in forwards;}',
    '@keyframes kkSeritGir{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}',
    '@keyframes kkSeritCik{from{opacity:1;transform:none;}to{opacity:0;transform:translateY(8px);}}',
    '@media (prefers-reduced-motion:reduce){.kk-serit,.kk-serit.cikiyor{animation:none;}}'
  ].join('');

  var stilBagli = false;
  function stilKur() {
    if (stilBagli) return;
    stilBagli = true;
    var s = document.createElement('style');
    s.id = 'kk-uyari-stil';
    s.textContent = STIL;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ── Pencere ──────────────────────────────────────────────────────
     Tek <dialog> yeniden kullanılır; eşzamanlı gelen istekler kuyruğa
     alınır (showModal açık pencerede hata verir). */
  var pencere = null, o = null;           // o: pencere içindeki öğeler
  var aktif = null, kuyruk = [], onceOdak = null;

  function pencereKur() {
    if (pencere) return;
    stilKur();
    pencere = document.createElement('dialog');
    pencere.className = 'kk-uyari-pencere';
    pencere.setAttribute('aria-labelledby', 'kk-uyari-baslik');
    pencere.innerHTML =
      '<form method="dialog" class="kk-uyari-form">' +
      '  <div class="kk-uyari-bas">' +
      '    <span class="kk-uyari-ikon" aria-hidden="true"></span>' +
      '    <div>' +
      '      <h2 class="kk-uyari-baslik" id="kk-uyari-baslik"></h2>' +
      '      <small class="kk-uyari-alt" hidden></small>' +
      '    </div>' +
      '  </div>' +
      '  <p class="kk-uyari-metin"></p>' +
      '  <span class="kk-uyari-girdi-yuva"></span>' +
      '  <div class="kk-uyari-alt-sira">' +
      '    <button type="button" class="kk-uyari-dugme ikincil" data-eylem="iptal" hidden></button>' +
      '    <button type="button" class="kk-uyari-dugme birincil" data-eylem="onay"></button>' +
      '  </div>' +
      '</form>';
    o = {
      ikon:  pencere.querySelector('.kk-uyari-ikon'),
      bas:   pencere.querySelector('.kk-uyari-baslik'),
      alt:   pencere.querySelector('.kk-uyari-alt'),
      metin: pencere.querySelector('.kk-uyari-metin'),
      yuva:  pencere.querySelector('.kk-uyari-girdi-yuva'),
      iptal: pencere.querySelector('[data-eylem="iptal"]'),
      onay:  pencere.querySelector('[data-eylem="onay"]'),
      girdi: null
    };
    o.onay.addEventListener('click', function () { bitir(true); });
    o.iptal.addEventListener('click', function () { bitir(false); });
    /* Esc ve backdrop: iptal sayılır (confirm'de false, sor'da null) */
    pencere.addEventListener('cancel', function (e) { e.preventDefault(); bitir(false); });
    pencere.addEventListener('click', function (e) { if (e.target === pencere) bitir(false); });
    pencere.addEventListener('keydown', function (e) {
      /* Tek satırlı girdide Enter onaylar (native prompt davranışı) */
      if (e.key === 'Enter' && o.girdi && o.girdi.tagName === 'INPUT') {
        e.preventDefault();
        bitir(true);
      }
    });
    document.body.appendChild(pencere);
  }

  function goster(istek) {
    if (aktif) { kuyruk.push(istek); return; }
    aktif = istek;
    pencereKur();

    var on = TURLER[istek.tur] || TURLER.bilgi;
    pencere.dataset.tur = istek.tur;
    o.ikon.textContent = istek.ikon || on.ikon;
    o.bas.textContent = istek.baslik || on.baslik;
    o.alt.textContent = istek.altBaslik || '';
    o.alt.hidden = !istek.altBaslik;
    o.metin.textContent = istek.mesaj == null ? '' : String(istek.mesaj);
    o.metin.hidden = !o.metin.textContent;

    /* Girdi (yalnız sor) */
    o.yuva.textContent = '';
    o.girdi = null;
    if (istek.tur === 'sor') {
      var g = document.createElement(istek.cokSatir ? 'textarea' : 'input');
      g.className = 'kk-uyari-girdi';
      if (!istek.cokSatir) g.type = 'text';
      g.value = istek.varsayilan == null ? '' : String(istek.varsayilan);
      if (istek.yerTutucu) g.placeholder = istek.yerTutucu;
      g.setAttribute('aria-label', o.metin.textContent || o.bas.textContent);
      o.yuva.appendChild(g);
      o.girdi = g;
    }

    var onayli = istek.tur === 'onay' || istek.tur === 'sor';
    o.onay.textContent = istek.onayEtiketi || (onayli ? 'Devam et' : 'Tamam');
    o.onay.classList.toggle('tehlikeli', !!istek.tehlikeli);
    o.iptal.textContent = istek.iptalEtiketi || 'Vazgeç';
    o.iptal.hidden = !onayli;

    onceOdak = document.activeElement;
    pencere.showModal();
    /* Girdi varsa metni seçili aç (native prompt gibi). Geri alınamaz işlemde
       odak bilerek "Vazgeç"te durur: Enter'a basmak silmeye yol açmaz. */
    if (o.girdi) { o.girdi.focus(); o.girdi.select(); }
    else if (istek.tehlikeli && !o.iptal.hidden) { o.iptal.focus(); }
    else { o.onay.focus(); }
  }

  function bitir(onaylandi) {
    if (!aktif) return;
    var istek = aktif;
    aktif = null;
    var sonuc;
    if (istek.tur === 'onay') sonuc = !!onaylandi;
    else if (istek.tur === 'sor') sonuc = onaylandi ? (o.girdi ? o.girdi.value : '') : null;
    else sonuc = undefined;

    if (pencere.open) pencere.close();
    if (onceOdak && onceOdak.focus) { try { onceOdak.focus(); } catch (e) { /* sökülmüş öğe */ } }
    onceOdak = null;

    istek.cozumle(sonuc);
    if (kuyruk.length) goster(kuyruk.shift());
  }

  function istekKur(tur, mesaj, sec) {
    sec = sec || {};
    return new Promise(function (cozumle) {
      var istek = {
        tur: tur, mesaj: mesaj, cozumle: cozumle,
        baslik: sec.baslik, altBaslik: sec.altBaslik, ikon: sec.ikon,
        onayEtiketi: sec.onayEtiketi, iptalEtiketi: sec.iptalEtiketi,
        tehlikeli: sec.tehlikeli,
        varsayilan: sec.varsayilan, yerTutucu: sec.yerTutucu, cokSatir: sec.cokSatir
      };
      /* Betik <head>'den çalışırsa body henüz yoktur */
      if (document.body) goster(istek);
      else document.addEventListener('DOMContentLoaded', function () { goster(istek); }, { once: true });
    });
  }

  /* ── Şerit (bildir) ───────────────────────────────────────────────
     Akışı kesmeyen kısa bilgi: "kopyalandı", "kaydedildi" gibi. Tam ekran
     (akıllı tahta) sırasında şerit tam ekran öğesinin içine takılır; yoksa
     üst katmanın altında kalıp görünmez. */
  var SERIT_IKON = { bilgi: 'ℹ️', basari: '✓', uyari: '⚠️', hata: '⛔' };
  function bildir(mesaj, sec) {
    sec = sec || {};
    stilKur();
    var kok = document.fullscreenElement || document.body;
    if (!kok) return;
    var kap = kok.querySelector(':scope > .kk-serit-kap');
    if (!kap) {
      kap = document.createElement('div');
      kap.className = 'kk-serit-kap';
      kap.setAttribute('role', 'status');
      kap.setAttribute('aria-live', 'polite');
      kok.appendChild(kap);
    }
    var tur = sec.tur || 'bilgi';
    var el = document.createElement('div');
    el.className = 'kk-serit';
    el.dataset.tur = tur;
    var ikon = document.createElement('span');
    ikon.className = 'kk-serit-ikon';
    ikon.setAttribute('aria-hidden', 'true');
    ikon.textContent = sec.ikon || SERIT_IKON[tur] || SERIT_IKON.bilgi;
    var yazi = document.createElement('span');
    yazi.textContent = mesaj == null ? '' : String(mesaj);
    el.appendChild(ikon);
    el.appendChild(yazi);
    kap.appendChild(el);

    var kapandi = false;
    function kaldir() {
      if (kapandi) return;
      kapandi = true;
      el.classList.add('cikiyor');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        if (kap.parentNode && !kap.children.length) kap.parentNode.removeChild(kap);
      }, 220);
    }
    el.addEventListener('click', kaldir);
    setTimeout(kaldir, Math.max(1200, sec.sure || 3200));
  }

  window.KKUyari = {
    bilgi:  function (m, s) { return istekKur('bilgi', m, s); },
    basari: function (m, s) { return istekKur('basari', m, s); },
    uyari:  function (m, s) { return istekKur('uyari', m, s); },
    hata:   function (m, s) { return istekKur('hata', m, s); },
    onay:   function (m, s) { return istekKur('onay', m, s); },
    sor:    function (m, s) { return istekKur('sor', m, s); },
    bildir: bildir,
    kapat:  function () { if (aktif) bitir(false); },
    yerelUyari: window.alert.bind(window)
  };

  /* Güvenlik ağı: gözden kaçan alert() çağrıları da düzgün pencereyle çıksın.
     Tek fark, çağrı yerinin beklemeyip devam etmesi — mevcut kullanımların
     hepsi mesajdan sonra akışı bitirdiği için sorun çıkarmaz. */
  window.alert = function (mesaj) { istekKur('bilgi', mesaj, {}); };
})();
