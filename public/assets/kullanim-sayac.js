/* ── KAYNAK KAMPÜS · ANONİM KULLANIM SAYACI ───────────────────────────
   /api/olay ucuna { olay, detay } yollar; sunucu yalnızca gün + olay +
   detay başına bir SAYI tutar. Çerez kullanılmaz, kişisel veri (IP,
   kimlik, tarayıcı) kaydedilmez — bu yüzden çerez onayına bağlı değildir.
   GA4 yüklüyse (assets/analitik.js) aynı olay gtag'e de iletilir; orada
   Consent Mode kullanıcının çerez tercihini kendiliğinden uygular.

   Kullanım:
     <script src="assets/kullanim-sayac.js" data-sayfa="oyunlar" defer></script>
       → yüklenişte bir "sayfa" olayı otomatik gönderilir (detay: data-sayfa)
     window.KKSayac.gonder("oyun", "Kelime Avcısı")
       → sayfa içi eylemler böyle sayılır (olay adları: src/lib/kullanim-sayaci.ts)
   ------------------------------------------------------------------ */
(function () {
  var UC = "/api/olay";

  function gonder(olay, detay) {
    try {
      var veri = JSON.stringify({ olay: olay, detay: detay || "" });
      var yollandi = false;
      if (navigator.sendBeacon) {
        yollandi = navigator.sendBeacon(UC, new Blob([veri], { type: "application/json" }));
      }
      if (!yollandi && window.fetch) {
        fetch(UC, {
          method: "POST",
          body: veri,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(function () {});
      }
      if (typeof window.gtag === "function") {
        window.gtag("event", olay, { detay: detay || "" });
      }
    } catch (e) {
      /* sayaç asla sayfayı bozmaz */
    }
  }

  window.KKSayac = { gonder: gonder };

  var betik = document.currentScript;
  var sayfa = betik && betik.getAttribute("data-sayfa");
  if (sayfa) gonder("sayfa", sayfa);
})();
