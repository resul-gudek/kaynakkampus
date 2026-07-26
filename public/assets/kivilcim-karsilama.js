/* Kıvılcım — site karşılama widget'ı
   ────────────────────────────────────────────────────────────────
   Statik sayfalara tek satırla eklenir:

     <script src="assets/kivilcim-karsilama.js" defer
             data-baslik="..." data-metin="..."
             data-eylem="..." data-eylem-href="..."
             data-ikincil="..." data-ikincil-href="..."></script>

   Kendi stilini ve işaretlemesini kendisi enjekte eder; sayfanın
   CSS'ine dokunmaz (tüm sınıflar kv- önekli).

   Uyulan maskot kuralları (bkz. maskot sunumu, tur 04):
   · Sürtünme anında görünür — burada "ilk ziyaret" o an.
   · En fazla iki cümle, birinci tekil şahıs yok.
   · Balonda tıklanacak bir şey var.
   · Tek seferlik 260 ms hareket; prefers-reduced-motion'da hiç yok.
   · Kapatılabilir ve kapatma hatırlanır. */

(function () {
  "use strict";

  var betik = document.currentScript;
  var d = (betik && betik.dataset) || {};

  var AYAR = {
    baslik: d.baslik || "Kaynak Kampüs'e hoş geldiniz.",
    metin: d.metin || "Programları inceleyebilir ya da hemen ön kayıt bırakabilirsiniz.",
    eylem: d.eylem || "Aramıza katıl",
    eylemHref: d.eylemHref || "/basvuru",
    ikincil: d.ikincil || "",
    ikincilHref: d.ikincilHref || "",
    gecikme: parseInt(d.gecikme || "1400", 10),
    anahtar: d.anahtar || "kk-kivilcim-karsilama",
  };

  /* ── Kıvılcım rig'i ────────────────────────────────────────────
     Gövde + yüz ayrı katman. gagaAcik=true konuşan hâli verir. */
  function kivilcimSvg(gagaAcik, tekRenk) {
    var g = tekRenk
      ? { govde: "currentColor", gul: "currentColor", gulAc: "currentColor", krem: "var(--kv-oyuk)", bebek: "currentColor" }
      : { govde: "#7A2035", gul: "#C98792", gulAc: "#E3BFC5", krem: "#FAF7F5", bebek: "#5E1728" };
    var solukluk = tekRenk ? ' opacity=".5"' : "";

    var tuy =
      '<path id="kvTuy" d="M0 0C7-16 9-40 0-64C-9-40-7-16 0 0Z" fill="currentColor"/>';

    var gaga = gagaAcik
      ? '<path d="M91 124C95 123 105 123 109 124C107 130 104 133 100 133C96 133 93 130 91 124Z" fill="' + g.gulAc + '"/>' +
        '<path d="M92 137C96 136 104 136 108 137C106 144 104 148 100 148C96 148 94 144 92 137Z" fill="' + g.gulAc + '"/>'
      : '<path d="M91 126C95 125 105 125 109 126C107 134 104 139 100 139C96 139 93 134 91 126Z" fill="' + g.gulAc + '"/>';

    return (
      '<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">' +
      "<defs>" + tuy + "</defs>" +
      // kuyruk
      '<g transform="translate(100,158)"' + solukluk + ' style="color:' + g.gul + '">' +
      '<use href="#kvTuy" transform="rotate(156) scale(.4)"/>' +
      '<use href="#kvTuy" transform="rotate(180) scale(.5)"/>' +
      '<use href="#kvTuy" transform="rotate(204) scale(.4)"/>' +
      "</g>" +
      // kanatlar
      '<g' + solukluk + '>' +
      '<ellipse cx="58" cy="138" rx="28" ry="19" transform="rotate(-22 58 138)" fill="' + g.gul + '"/>' +
      '<ellipse cx="142" cy="138" rx="28" ry="19" transform="rotate(22 142 138)" fill="' + g.gul + '"/>' +
      "</g>" +
      // sorguç = kıvılcım
      '<g transform="translate(100,64)" style="color:' + g.gul + '">' +
      '<use href="#kvTuy" transform="rotate(-30) scale(.46)"/>' +
      '<use href="#kvTuy" transform="rotate(0) scale(.62)"/>' +
      '<use href="#kvTuy" transform="rotate(30) scale(.46)"/>' +
      "</g>" +
      // gövde
      '<path d="M100 64C129 64 152 87 152 116C152 148 129 170 100 170C71 170 48 148 48 116C48 87 71 64 100 64Z" fill="' + g.govde + '"/>' +
      // ayaklar
      '<g fill="' + g.gulAc + '"' + solukluk + '>' +
      '<rect x="74" y="165" width="15" height="12" rx="6"/>' +
      '<rect x="111" y="165" width="15" height="12" rx="6"/>' +
      "</g>" +
      // yüz katmanı
      '<circle cx="81" cy="107" r="16" fill="' + g.krem + '"/>' +
      '<circle cx="119" cy="107" r="16" fill="' + g.krem + '"/>' +
      '<circle cx="83" cy="110" r="8" fill="' + g.bebek + '"/>' +
      '<circle cx="121" cy="110" r="8" fill="' + g.bebek + '"/>' +
      (tekRenk
        ? ""
        : '<circle cx="79.4" cy="106.4" r="3.2" fill="#fff"/><circle cx="117.4" cy="106.4" r="3.2" fill="#fff"/>') +
      gaga +
      "</svg>"
    );
  }

  /* ── Stil ──────────────────────────────────────────────────── */
  var CSS = [
    ".kv-kok{position:fixed;right:20px;bottom:20px;z-index:90;",
    "font-family:'Poppins',system-ui,sans-serif;display:flex;flex-direction:column;",
    "align-items:flex-end;gap:12px;pointer-events:none}",
    ".kv-kok>*{pointer-events:auto}",

    /* kart */
    ".kv-kart{width:360px;max-width:calc(100vw - 40px);background:#fff;",
    "border:1px solid #E2D6D5;border-radius:14px;box-shadow:0 12px 40px rgba(122,32,53,.16);",
    "padding:16px;display:flex;gap:12px;position:relative;",
    "opacity:0;transform:translateY(10px);transition:opacity .26s ease,transform .26s ease}",
    ".kv-kart[data-acik='1']{opacity:1;transform:none}",
    ".kv-kart[hidden]{display:none}",

    /* maskot yuvası */
    ".kv-yuva{width:52px;height:52px;flex:none;border-radius:50%;background:#FAF7F5;",
    "display:grid;place-items:center;overflow:hidden}",
    ".kv-yuva svg{width:52px;height:52px;display:block;margin-bottom:-6px}",

    /* metin */
    ".kv-govde{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}",
    ".kv-ad{font-family:'Cormorant Garamond',Georgia,serif;font-size:.72rem;",
    "letter-spacing:.14em;text-transform:uppercase;color:#C98792;font-weight:600}",
    ".kv-baslik{font-size:.95rem;font-weight:600;color:#2F343D;line-height:1.35;margin:0}",
    ".kv-metin{font-size:.85rem;color:#574E52;line-height:1.5;margin:0}",

    /* eylemler */
    ".kv-eylemler{display:flex;flex-wrap:wrap;gap:8px;margin-top:7px}",
    ".kv-btn{display:inline-flex;align-items:center;justify-content:center;",
    "font:600 .8rem/1 inherit;padding:9px 12px;border-radius:50px;cursor:pointer;white-space:nowrap;",
    "border:1px solid transparent;text-decoration:none;transition:background .2s,color .2s}",
    ".kv-btn-bir{background:#7A2035;color:#fff}",
    ".kv-btn-bir:hover{background:#5E1728}",
    ".kv-btn-iki{background:transparent;color:#7A2035;border-color:#E2D6D5}",
    ".kv-btn-iki:hover{background:#FAF7F5}",

    /* kapat */
    ".kv-kapat{position:absolute;top:8px;right:8px;width:28px;height:28px;",
    "border:0;background:transparent;border-radius:50%;cursor:pointer;color:#857A7E;",
    "display:grid;place-items:center;font:400 18px/1 inherit;transition:background .2s,color .2s}",
    ".kv-kapat:hover{background:#FAF7F5;color:#2F343D}",

    /* başlatıcı — tam renkli maskot, krem yuva, bordo halka */
    ".kv-baslatici{width:58px;height:58px;border-radius:50%;cursor:pointer;",
    "background:#FAF7F5;border:2px solid #7A2035;box-shadow:0 6px 22px rgba(122,32,53,.22);",
    "display:grid;place-items:center;overflow:hidden;padding:0;",
    "transition:background .2s,transform .2s,box-shadow .2s}",
    ".kv-baslatici:hover{background:#fff;transform:translateY(-2px);box-shadow:0 10px 26px rgba(122,32,53,.3)}",
    ".kv-baslatici svg{width:48px;height:48px;display:block;margin-bottom:-6px}",

    /* odak */
    ".kv-kok :focus-visible{outline:2px solid #7A2035;outline-offset:2px}",

    /* mobil — telefonda ekranın üçte birini kaplamaması için sıkışır:
       küçük yuva, dar iç boşluk, butonlar tek satırda paylaşır. */
    "@media (max-width:520px){.kv-kok{right:12px;left:12px;bottom:12px;align-items:stretch;gap:10px}",
    ".kv-kart{width:auto;padding:13px;gap:10px}",
    ".kv-yuva,.kv-yuva svg{width:42px;height:42px}",
    ".kv-baslik{font-size:.92rem}.kv-metin{font-size:.8rem;line-height:1.45}",
    ".kv-govde{gap:3px}.kv-eylemler{margin-top:9px;gap:7px}",
    ".kv-btn{flex:1 1 auto;padding:10px 8px;font-size:.78rem}",
    ".kv-kapat{top:5px;right:5px}",
    ".kv-baslatici{align-self:flex-end;width:52px;height:52px}",
    ".kv-baslatici svg{width:44px;height:44px}}",

    /* hareket azaltma */
    "@media (prefers-reduced-motion:reduce){.kv-kart{transition:none;transform:none}",
    ".kv-baslatici,.kv-btn,.kv-kapat{transition:none}",
    ".kv-baslatici:hover{transform:none}}",
  ].join("");

  /* ── Kurulum ───────────────────────────────────────────────── */
  function kur() {
    if (document.querySelector(".kv-kok")) return;

    var stil = document.createElement("style");
    stil.textContent = CSS;
    document.head.appendChild(stil);

    var kok = document.createElement("div");
    kok.className = "kv-kok";

    var kart = document.createElement("div");
    kart.className = "kv-kart";
    kart.setAttribute("role", "region");
    kart.setAttribute("aria-label", "Kıvılcım karşılama");
    // Otomatik açılışta odak çalınmaz; ekran okuyucu yine haber alır.
    kart.setAttribute("aria-live", "polite");
    kart.hidden = true;
    kart.tabIndex = -1;

    var eylemler =
      '<a class="kv-btn kv-btn-bir" href="' + AYAR.eylemHref + '">' + AYAR.eylem + "</a>" +
      (AYAR.ikincil
        ? '<a class="kv-btn kv-btn-iki" href="' + AYAR.ikincilHref + '">' + AYAR.ikincil + "</a>"
        : "");

    kart.innerHTML =
      '<button class="kv-kapat" type="button" aria-label="Karşılamayı kapat">&times;</button>' +
      '<div class="kv-yuva">' + kivilcimSvg(true, false) + "</div>" +
      '<div class="kv-govde">' +
      '<p class="kv-ad">Kıvılcım</p>' +
      '<p class="kv-baslik">' + AYAR.baslik + "</p>" +
      '<p class="kv-metin">' + AYAR.metin + "</p>" +
      '<div class="kv-eylemler">' + eylemler + "</div>" +
      "</div>";

    var baslatici = document.createElement("button");
    baslatici.type = "button";
    baslatici.className = "kv-baslatici";
    baslatici.setAttribute("aria-label", "Kıvılcım'ı aç");
    baslatici.setAttribute("aria-expanded", "false");
    baslatici.innerHTML = kivilcimSvg(false, false);

    kok.appendChild(kart);
    kok.appendChild(baslatici);
    document.body.appendChild(kok);

    /* ── Durum ── */
    // odaklan: yalnızca kullanıcı başlatıcıya bastığında true.
    // Otomatik karşılamada odağı çalmak, sayfayı klavyeyle okuyan
    // birini yerinden atar — o yüzden orada odak taşınmaz.
    function ac(odaklan) {
      kart.hidden = false;
      // hidden kalkarken geçişin çalışması için bir kare bekle
      requestAnimationFrame(function () {
        kart.dataset.acik = "1";
      });
      baslatici.setAttribute("aria-expanded", "true");
      baslatici.setAttribute("aria-label", "Kıvılcım'ı kapat");
      if (odaklan) kart.focus();
    }

    function kapat(hatirla) {
      delete kart.dataset.acik;
      baslatici.setAttribute("aria-expanded", "false");
      baslatici.setAttribute("aria-label", "Kıvılcım'ı aç");
      var azHareket = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var gizle = function () { kart.hidden = true; };
      if (azHareket) gizle();
      else window.setTimeout(gizle, 260);
      if (hatirla) {
        try { localStorage.setItem(AYAR.anahtar, "kapali"); } catch (e) { /* özel mod */ }
      }
    }

    baslatici.addEventListener("click", function () {
      if (kart.hidden) ac(true);
      else kapat(true);
    });

    kart.querySelector(".kv-kapat").addEventListener("click", function () {
      kapat(true);
      baslatici.focus();
    });

    // eylem tıklanınca da kapanmış say — bir daha karşılamaz
    Array.prototype.forEach.call(kart.querySelectorAll(".kv-btn"), function (a) {
      a.addEventListener("click", function () {
        try { localStorage.setItem(AYAR.anahtar, "kapali"); } catch (e) { /* özel mod */ }
      });
    });

    kok.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !kart.hidden) {
        kapat(true);
        baslatici.focus();
      }
    });

    /* ── İlk ziyaret mi? ── */
    var kapatilmis = false;
    try { kapatilmis = localStorage.getItem(AYAR.anahtar) === "kapali"; } catch (e) { /* özel mod */ }
    if (!kapatilmis) {
      window.setTimeout(function () { ac(false); }, AYAR.gecikme);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", kur);
  } else {
    kur();
  }
})();
