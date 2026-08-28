/* ── KAYNAK KAMPÜS · ÇEREZ ONAY BANDI ────────────────────────────────
   Tüm public sayfalarda aynı dosya kullanılır; stil kendi içindedir.
   Karar localStorage'da tutulur (anahtar: kkCerezOnay). Google Consent
   Mode v2 varsayılanları "denied" olarak burada kurulur — ileride
   AdSense/GA betiği eklendiğinde ek ayar gerekmeden tercihe uyar.

   Dışa açılan API:
     window.KKCerez.durum()        → 'tum' | 'zorunlu' | null (karar yok)
     window.KKCerez.reklamOnayliMi() → boolean
     window.KKCerez.tercihAc()     → bandı yeniden gösterir (politika sayfası kullanır)
   Karar anında document üzerinde 'kk-cerez-karar' olayı yayınlanır
   (event.detail.karar). Reklam betiği yüklemeyi buna bağlayın.
   ------------------------------------------------------------------ */
(function () {
  var ANAHTAR = 'kkCerezOnay';
  var SURUM = 1; // politika metni önemli ölçüde değişirse artır → yeniden sorulur

  /* ── Google Consent Mode v2: gtag yüklenmeden ÖNCE varsayılan "denied" ── */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });

  function oku() {
    try {
      var ham = localStorage.getItem(ANAHTAR);
      if (!ham) return null;
      var k = JSON.parse(ham);
      if (!k || k.surum !== SURUM) return null;
      return k;
    } catch (e) { return null; }
  }

  function yaz(karar) {
    try {
      localStorage.setItem(ANAHTAR, JSON.stringify({ karar: karar, surum: SURUM, tarih: new Date().toISOString() }));
    } catch (e) { /* gizli pencere vb. — banner her ziyarette çıkar, sorun değil */ }
  }

  function uygula(karar) {
    if (karar === 'tum') {
      gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted'
      });
    }
    try {
      document.dispatchEvent(new CustomEvent('kk-cerez-karar', { detail: { karar: karar } }));
    } catch (e) { /* eski tarayıcı */ }
  }

  /* ── Bant ──────────────────────────────────────────────────────── */
  var bant = null;

  function kapat() {
    if (bant && bant.parentNode) bant.parentNode.removeChild(bant);
    bant = null;
  }

  function goster() {
    if (bant) return;

    if (!document.getElementById('kkCerezStil')) {
      var stil = document.createElement('style');
      stil.id = 'kkCerezStil';
      stil.textContent =
        '.kk-cerez{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;' +
          'max-width:680px;margin:0 auto;background:#fff;color:#2F343D;' +
          'border:1px solid rgba(122,32,53,.15);border-radius:14px;' +
          'box-shadow:0 12px 40px rgba(122,32,53,.18);padding:18px 20px;' +
          'font:400 .88rem/1.6 "Figtree","Poppins",system-ui,sans-serif;}' +
        '.kk-cerez p{margin:0 0 12px;}' +
        '.kk-cerez a{color:#7A2035;font-weight:600;text-decoration:underline;}' +
        '.kk-cerez-btnlar{display:flex;gap:10px;flex-wrap:wrap;}' +
        '.kk-cerez button{cursor:pointer;border-radius:10px;padding:9px 18px;' +
          'font:600 .85rem/1 "Figtree","Poppins",system-ui,sans-serif;transition:opacity .15s;}' +
        '.kk-cerez button:hover{opacity:.85;}' +
        '.kk-cerez-kabul{background:#7A2035;color:#fff;border:1.5px solid #7A2035;}' +
        '.kk-cerez-red{background:#fff;color:#7A2035;border:1.5px solid #C98792;}' +
        '@media (max-width:560px){.kk-cerez{left:10px;right:10px;bottom:10px;padding:15px 16px;}' +
          '.kk-cerez button{flex:1;padding:11px 10px;}}' +
        '@media print{.kk-cerez{display:none!important;}}';
      document.head.appendChild(stil);
    }

    bant = document.createElement('div');
    bant.className = 'kk-cerez';
    bant.setAttribute('role', 'dialog');
    bant.setAttribute('aria-label', 'Çerez tercihleri');
    bant.innerHTML =
      '<p>Sitemizde oturumunuz için zorunlu çerezler kullanılır. İzin verirseniz reklam ve ' +
      'analiz amaçlı üçüncü taraf çerezleri de kullanılabilir. Ayrıntılar: ' +
      '<a href="/gizlilik.html">Gizlilik ve Çerez Politikası</a></p>' +
      '<div class="kk-cerez-btnlar">' +
        '<button type="button" class="kk-cerez-kabul">Tümünü Kabul Et</button>' +
        '<button type="button" class="kk-cerez-red">Yalnızca Zorunlu Çerezler</button>' +
      '</div>';

    bant.querySelector('.kk-cerez-kabul').addEventListener('click', function () {
      yaz('tum'); uygula('tum'); kapat();
    });
    bant.querySelector('.kk-cerez-red').addEventListener('click', function () {
      yaz('zorunlu'); uygula('zorunlu'); kapat();
    });

    document.body.appendChild(bant);
  }

  window.KKCerez = {
    durum: function () { var k = oku(); return k ? k.karar : null; },
    reklamOnayliMi: function () { var k = oku(); return !!k && k.karar === 'tum'; },
    tercihAc: function () { kapat(); goster(); }
  };

  function basla() {
    var kayit = oku();
    if (kayit) { uygula(kayit.karar); return; }
    goster();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', basla);
  } else {
    basla();
  }
})();
