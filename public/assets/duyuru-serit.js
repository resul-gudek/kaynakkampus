/* ── KAYNAK KAMPÜS · ÜST DUYURU ŞERİDİ ───────────────────────────────
   Tüm public sayfalarda menünün üstünde durur ve belli aralıklarla
   farklı bir duyuru gösterir. İlk duyuru sayfanın kendi HTML'inde
   yazılıdır; bu dosya yalnız döndürme, duraklatma ve kapatmayı yürütür.

   Bağlantılar kök göreli ("/oyunlar.html") yazılır ki şerit hangi
   dizindeki sayfada olursa olsun doğru yere gitsin.

   Next tarafındaki ikizi: src/components/site/DuyuruSerit.tsx
   (duyuru listesi iki yerde de aynı tutulmalı)
   ------------------------------------------------------------------ */
(function () {
  var SURE = 6500;          // bir duyurunun ekranda kalma süresi (ms)
  var GECIS = 350;          // solma süresi — CSS'teki .gecis ile aynı

  /* Sosyal hesaplar — alt bilgideki bağlantılarla aynı olmalı */
  var SOSYAL = [
    { ad: "Instagram", url: "https://www.instagram.com/kaynakkampus",
      yol: '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="17.3" cy="6.7" r="1.3" fill="currentColor"/>' },
    { ad: "TikTok", url: "https://www.tiktok.com/@kaynakkampus",
      yol: '<path fill="currentColor" d="M16.6 3h-3.1v12.3a3.3 3.3 0 1 1-2.9-3.3v-3.1a6.4 6.4 0 1 0 6 6.4V9.6a7.3 7.3 0 0 0 4.2 1.3V7.8a4.2 4.2 0 0 1-4.2-4.2Z"/>' },
    { ad: "Facebook", url: "https://www.facebook.com/share/1F1ie32qbu/",
      yol: '<path fill="currentColor" d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06Z"/>' },
  ];

  function sosyalHtml() {
    var baglar = SOSYAL.map(function (s) {
      return '<a href="' + s.url + '" target="_blank" rel="noopener noreferrer" aria-label="' + s.ad + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true">' + s.yol + '</svg></a>';
    }).join("");
    return '<span class="duyuru-sosyal">' + baglar + "</span>";
  }

  /* Sırayla gösterilecek duyurular. İlki sayfanın HTML'indekiyle aynıdır. */
  var DUYURULAR = [
    '🗓️ ÖSYM ve MEB sınav takvimi her gün güncelleniyor — <a href="/sinav-takvimi.html">güncel tarihlere bak</a>',
    "Bizi takip edin " + sosyalHtml(),
    '🎮 Kademe, sınıf ve konuya göre yüzlerce eğitim oyunu — <a href="/oyunlar.html">oynamaya başla</a>',
    '🧭 Hangi yöntemle daha rahat öğreniyorsun? <a href="/coklu-zeka-testi.html">Çoklu Zekâ Testi</a> ücretsiz',
    '📝 Ödev, BEP ve haftalık ders programı dakikalar içinde — <a href="/odev-olustur.html">araçları dene</a>',
    '📰 ÖSYM ve MEB duyuruları tek sayfada — <a href="/haberler.html">son haberlere bak</a>',
  ];

  var serit = document.getElementById("duyuruSerit");
  if (!serit) return;
  var akis = serit.querySelector("[data-duyuru-akis]");
  var kapat = serit.querySelector("[data-duyuru-kapat]");

  /* Kapatılmışsa hiç gösterme (bu tarayıcıda hatırlanır) */
  var kapali = false;
  try { kapali = localStorage.getItem("kk-duyuru-kapali") === "1"; } catch (e) { /* gizli mod */ }
  if (kapali) return;
  serit.hidden = false;

  if (kapat) {
    kapat.addEventListener("click", function () {
      serit.hidden = true;
      dur();
      try { localStorage.setItem("kk-duyuru-kapali", "1"); } catch (e) { /* yok say */ }
    });
  }

  if (!akis || DUYURULAR.length < 2) return;

  /* Hareket azaltma isteniyorsa tek duyuruda kalınır */
  var azHareket = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  if (azHareket && azHareket.matches) return;

  var sira = 0, sayac = null, durakla = false;

  function ilerle() {
    if (durakla || document.hidden) return;         // sekme arkadayken boşuna dönme
    sira = (sira + 1) % DUYURULAR.length;
    serit.classList.add("gecis");
    setTimeout(function () {
      akis.innerHTML = DUYURULAR[sira];
      serit.classList.remove("gecis");
    }, GECIS);
  }

  function basla() { if (!sayac) sayac = setInterval(ilerle, SURE); }
  function dur() { clearInterval(sayac); sayac = null; }

  /* Okurken ya da bağlantıya odaklanmışken duyuru altından kaymasın */
  serit.addEventListener("mouseenter", function () { durakla = true; });
  serit.addEventListener("mouseleave", function () { durakla = false; });
  serit.addEventListener("focusin", function () { durakla = true; });
  serit.addEventListener("focusout", function () { durakla = false; });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) dur(); else basla();
  });

  basla();
})();
