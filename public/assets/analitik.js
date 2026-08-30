/* ── KAYNAK KAMPÜS · GA4 YÜKLEYİCİ ────────────────────────────────────
   Google Analytics 4 betiğini yükler. OLCUM_KIMLIGI boş bırakıldığı
   sürece HİÇBİR ŞEY yapmaz — kimlik Google Analytics'te mülk açılınca
   buraya yazılır (biçim: "G-XXXXXXXXXX").

   cerez-onay.js'ten SONRA eklenmelidir: Consent Mode v2 varsayılanları
   ("denied") önce dataLayer'a girer; GA4 bu tercihe kendiliğinden uyar,
   kullanıcı "Tümünü Kabul Et" demedikçe çerez yazmaz.
   ------------------------------------------------------------------ */
(function () {
  var OLCUM_KIMLIGI = ""; // ← GA4 ölçüm kimliği buraya (örn. "G-AB12CD34EF")

  if (!OLCUM_KIMLIGI) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + OLCUM_KIMLIGI;
  document.head.appendChild(s);

  window.gtag("js", new Date());
  window.gtag("config", OLCUM_KIMLIGI);
})();
