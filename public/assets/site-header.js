/* ── KAYNAK AKADEMİ · ORTAK SİTE MENÜSÜ DAVRANIŞI ────────────────────
   Hamburger açma/kapama, açılır menüler ("Araçlar", "Blog & Haberler")
   ve aktif bağlantı işaretleme. Tüm public sayfalarda aynı dosya
   kullanılır.
   ------------------------------------------------------------------ */
(function () {
  var burger = document.querySelector('.sh-burger');
  var drawer = document.querySelector('.sh-drawer');
  var drops  = [].slice.call(document.querySelectorAll('.sh-drop'));

  function kapatAcilirlar(haric) {
    drops.forEach(function (d) {
      if (d === haric) return;
      d.classList.remove('sh-open');
      var b = d.querySelector('button');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }

  /* ── Mobil çekmece ─────────────────────────────────────────────── */
  function setDrawer(open) {
    if (!burger || !drawer) return;
    drawer.classList.toggle('sh-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('sh-lock', open);
  }

  if (burger && drawer) {
    burger.setAttribute('aria-expanded', 'false');
    burger.addEventListener('click', function () {
      setDrawer(!drawer.classList.contains('sh-open'));
    });
    // bağlantıya tıklanınca kapat (aynı sayfa içi #bağlantılarda da gerekli)
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) setDrawer(false);
    });
    // masaüstü genişliğine geçilirse çekmeceyi kapat (CSS ile aynı eşik)
    var wide = window.matchMedia('(min-width: 1280px)');
    (wide.addEventListener ? wide.addEventListener.bind(wide, 'change') : wide.addListener.bind(wide))(function (e) {
      if (e.matches) setDrawer(false);
    });
  }

  /* ── Açılır menüler ────────────────────────────────────────────── */
  drops.forEach(function (drop) {
    var dropBtn = drop.querySelector('button');
    if (!dropBtn) return;
    dropBtn.setAttribute('aria-expanded', 'false');
    dropBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !drop.classList.contains('sh-open');
      kapatAcilirlar(drop);                     // aynı anda tek menü açık kalır
      drop.classList.toggle('sh-open', open);
      dropBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  if (drops.length) {
    document.addEventListener('click', function (e) {
      var ic = drops.some(function (d) { return d.contains(e.target); });
      if (!ic) kapatAcilirlar(null);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    setDrawer(false);
    kapatAcilirlar(null);
  });

  /* ── Aktif bağlantı ────────────────────────────────────────────── */
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-header a[href], .sh-drawer a[href]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    var target = href.split('#')[0].split('/').pop();
    if (!target) return;                       // "index.html#..." kökü hariç
    if (href.indexOf('#') > -1 && target === 'index.html' && here !== 'index.html') return;
    if (target !== here) return;
    if (href.indexOf('#') > -1 && here === 'index.html') return;  // ana sayfa içi çapa
    a.classList.add('sh-active');
    var parentDrop = a.closest('.sh-drop');
    if (parentDrop) parentDrop.classList.add('sh-has-active');
  });
})();
