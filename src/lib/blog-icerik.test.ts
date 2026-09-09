import { describe, expect, it } from "vitest";
import {
  blogIcerikNormalle,
  duzMetinHtml,
  guvenliBaglanti,
  htmlMi,
  htmlTemizle,
} from "./blog-icerik";

/* Blog gövdesi nereden gelirse gelsin tek biçime iner:
   p · h2 · h3 · strong · em · ul · ol · li · a · blockquote · br
   Bu dosya "dışarıdan gelen ne olursa olsun" savını sınar. */

/** Çıktıda izinli etiketlerden başkası kalmamalı */
function etiketler(html: string): string[] {
  return [...html.matchAll(/<\/?([a-z0-9]+)/gi)].map((e) => e[1].toLowerCase());
}
const IZINLI = ["p", "h2", "h3", "strong", "em", "ul", "ol", "li", "a", "blockquote", "br"];

describe("htmlTemizle · biçim atma", () => {
  it("font-family, font-size, renk ve zemini atar", () => {
    const html = htmlTemizle(
      '<p style="font-family:Calibri;font-size:22pt;color:#ff0000;background:#ff0">Metin</p>'
    );
    expect(html).toBe("<p>Metin</p>");
  });

  it("span ve div sarmalayıcılarını söker, metni korur", () => {
    expect(htmlTemizle('<div class="x"><span id="y">Merhaba</span> dünya</div>')).toBe(
      "<p>Merhaba dünya</p>"
    );
  });

  it("class, id, dir, lang, data-* ve olay özniteliklerini atar", () => {
    const html = htmlTemizle(
      '<p class="MsoNormal" dir="rtl" data-x="1" onclick="kotu()" onmouseover="x">Metin</p>'
    );
    expect(html).toBe("<p>Metin</p>");
  });

  it("izinli olmayan etiketleri (h1, hr, img, table) biçime indirger", () => {
    const html = htmlTemizle("<h1>Başlık</h1><hr><img src='x.png'><h4>Alt</h4>");
    expect(html).toBe("<h2>Başlık</h2><h3>Alt</h3>");
  });

  it("yalnız izinli etiketleri üretir", () => {
    const karisik =
      '<article><h1 style="color:red">A</h1><table><tr><td>hücre</td><td>iki</td></tr></table>' +
      '<figure><img src="a.png"><figcaption>alt yazı</figcaption></figure><hr>' +
      "<pre><code>kod</code></pre></article>";
    for (const t of etiketler(htmlTemizle(karisik))) expect(IZINLI).toContain(t);
  });
});

describe("htmlTemizle · güvenlik", () => {
  it("script etiketini içeriğiyle birlikte atar", () => {
    expect(htmlTemizle("<p>Önce</p><script>alert(1)</script><p>Sonra</p>")).toBe(
      "<p>Önce</p><p>Sonra</p>"
    );
    expect(htmlTemizle("<script>alert(1)</script>")).toBe("");
  });

  it("style ve iframe bloklarını içeriğiyle atar", () => {
    expect(htmlTemizle("<style>p{color:red}</style><p>x</p>")).toBe("<p>x</p>");
    expect(htmlTemizle('<iframe src="https://kotu.co"></iframe><p>x</p>')).toBe("<p>x</p>");
  });

  it("javascript: ve data: bağlantısını bağlantı yapmaz, metni bırakır", () => {
    for (const kotu of [
      '<a href="javascript:alert(1)">tıkla</a>',
      '<a href="data:text/html;base64,PHNjcmlwdD4=">tıkla</a>',
      '<a href="vbscript:msgbox">tıkla</a>',
      '<a href="java\tscript:alert(1)">tıkla</a>',
    ]) {
      const html = htmlTemizle(kotu);
      expect(html).not.toContain("<a");
      expect(html).toContain("tıkla");
    }
  });

  it("kapatılmamış ve bozuk etiketlerde dengeli çıktı verir", () => {
    const html = htmlTemizle("<p><strong>a<em>b</p><ul><li>c");
    expect(html).toBe("<p><strong>a<em>b</em></strong></p><ul><li>c</li></ul>");
  });

  it("metindeki < > & işaretlerini kaçırır (enjeksiyon yok)", () => {
    const html = htmlTemizle("<p>5 < 7 & 3 > 1</p>");
    expect(html).toBe("<p>5 &lt; 7 &amp; 3 &gt; 1</p>");
    expect(htmlTemizle("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>")).toBe(
      "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>"
    );
  });

  it("geçerli varlıkları iki kez kaçırmaz", () => {
    expect(htmlTemizle("<p>Kaynak &amp; Kampüs &uuml; &#39;</p>")).toBe(
      "<p>Kaynak &amp; Kampüs &uuml; &#39;</p>"
    );
  });

  it("HTML yorumlarını ve Word koşullu bloklarını atar", () => {
    expect(htmlTemizle("<!--[if !supportLists]--><p>x</p><!--yorum-->")).toBe("<p>x</p>");
  });
});

describe("htmlTemizle · bağlantı", () => {
  it("http(s) bağlantısını yeni sekmeye açar", () => {
    expect(htmlTemizle('<p><a href="https://meb.gov.tr">MEB</a></p>')).toBe(
      '<p><a href="https://meb.gov.tr" target="_blank" rel="noopener noreferrer nofollow">MEB</a></p>'
    );
  });

  it("site içi adrese target eklemez", () => {
    expect(htmlTemizle('<p><a href="/blog">Blog</a></p>')).toBe('<p><a href="/blog">Blog</a></p>');
  });

  it("bağlantı öznitelik enjeksiyonunu kaçırır", () => {
    const html = htmlTemizle('<a href=\'https://a.co/?x="><script>alert(1)</script>\'>x</a>');
    expect(html).not.toContain("<script");
    expect(html).toContain("&quot;");
  });

  it("mailto ve tel geçer, protokolsüz alan adı https olur", () => {
    expect(guvenliBaglanti("mailto:bilgi@kaynakkampus.com")).toBe("mailto:bilgi@kaynakkampus.com");
    expect(guvenliBaglanti("tel:+905000000000")).toBe("tel:+905000000000");
    expect(guvenliBaglanti("kaynakkampus.com/blog")).toBe("https://kaynakkampus.com/blog");
    expect(guvenliBaglanti("javascript:alert(1)")).toBeNull();
    expect(guvenliBaglanti("//kotu.co")).toBeNull();
  });
});

describe("htmlTemizle · Word / Google Docs yapıştırması", () => {
  it("Docs'un font-weight:normal sarmalını kalın saymaz", () => {
    const docs =
      '<b style="font-weight:normal" id="docs-internal-guid-1">' +
      '<p dir="ltr"><span style="font-size:11pt;font-family:Arial;color:#000">Düz metin</span></p>' +
      "</b>";
    expect(htmlTemizle(docs)).toBe("<p>Düz metin</p>");
  });

  it("style ile yazılmış kalın ve eğiği kurtarır", () => {
    const docs =
      '<p><span style="font-weight:700">Kalın</span> ve ' +
      '<span style="font-style:italic">eğik</span> ve ' +
      '<span style="font-weight:bold;font-style:italic">ikisi</span></p>';
    expect(htmlTemizle(docs)).toBe(
      "<p><strong>Kalın</strong> ve <em>eğik</em> ve <strong><em>ikisi</em></strong></p>"
    );
  });

  it("Word'ün MsoListParagraph maddelerini gerçek listeye çevirir", () => {
    const word =
      '<p class=MsoListParagraph><span style="font-family:Symbol">·</span> Birinci</p>' +
      "<p class=MsoListParagraph>• İkinci</p>";
    expect(htmlTemizle(word)).toBe("<ul><li>Birinci</li><li>İkinci</li></ul>");
  });

  it("madde işaretiyle başlayan tek paragrafı listeye çevirmez", () => {
    expect(htmlTemizle("<p>- yalnız bir satır</p>")).toBe("<p>- yalnız bir satır</p>");
  });

  it("1'den başlamayan numaralı paragrafları listeye çevirmez", () => {
    expect(htmlTemizle("<p>12. sınıf öğrencileri</p><p>11. sınıf öğrencileri</p>")).toBe(
      "<p>12. sınıf öğrencileri</p><p>11. sınıf öğrencileri</p>"
    );
  });

  it("&nbsp; ve fazla boşlukları tek boşluğa indirir", () => {
    expect(htmlTemizle("<p>bir&nbsp;&nbsp; iki \n\t üç</p>")).toBe("<p>bir iki üç</p>");
  });

  it("madde içindeki paragrafı kaptan çıkarmaz", () => {
    expect(htmlTemizle("<ul><li><p>madde</p></li></ul>")).toBe("<ul><li>madde</li></ul>");
  });

  it("iç içe listeyi tek düzeye indirir", () => {
    expect(htmlTemizle("<ul><li>a<ul><li>b</li></ul></li><li>c</li></ul>")).toBe(
      "<ul><li>a</li><li>b</li><li>c</li></ul>"
    );
  });

  it("çift <br> paragrafı böler, tek <br> satır atlatır", () => {
    expect(htmlTemizle("<p>bir<br><br>iki</p>")).toBe("<p>bir</p><p>iki</p>");
    expect(htmlTemizle("<p>bir<br>iki</p>")).toBe("<p>bir<br>iki</p>");
  });

  it("boş paragrafları atar", () => {
    expect(htmlTemizle("<p></p><p>&nbsp;</p><p><br></p><p>dolu</p>")).toBe("<p>dolu</p>");
  });

  it("kapsız gelen çıplak metni paragrafa alır", () => {
    expect(htmlTemizle("çıplak metin<b>kalın</b>")).toBe("<p>çıplak metin<strong>kalın</strong></p>");
  });
});

describe("duzMetinHtml · eski kayıtlar (markdown-lite)", () => {
  it("başlık, paragraf, liste ve alıntıyı çevirir", () => {
    const html = duzMetinHtml(
      "## Ara başlık\n\nParagraf.\n\n- bir\n- iki\n\n1. üç\n\n> alıntı\n\n### Alt başlık"
    );
    expect(html).toBe(
      "<h2>Ara başlık</h2><p>Paragraf.</p><ul><li>bir</li><li>iki</li></ul>" +
        "<ol><li>üç</li></ol><blockquote>alıntı</blockquote><h3>Alt başlık</h3>"
    );
  });

  it("**kalın**, *eğik* ve bağlantıyı çevirir", () => {
    expect(duzMetinHtml("**kalın** ve *eğik* ve [MEB](https://meb.gov.tr)")).toBe(
      '<p><strong>kalın</strong> ve <em>eğik</em> ve <a href="https://meb.gov.tr/">MEB</a></p>'
    );
  });

  it("düz metindeki HTML'i metin olarak kaçırır", () => {
    expect(duzMetinHtml("<script>alert(1)</script>")).toBe(
      "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>"
    );
  });
});

describe("blogIcerikNormalle", () => {
  it("HTML ile düz metni ayırt eder", () => {
    expect(htmlMi("<p>x</p>")).toBe(true);
    expect(htmlMi("## Başlık\n\nDüz metin")).toBe(false);
    expect(blogIcerikNormalle("## Başlık\n\nMetin")).toBe("<h2>Başlık</h2><p>Metin</p>");
    expect(blogIcerikNormalle("<h1>Başlık</h1><p>Metin</p>")).toBe("<h2>Başlık</h2><p>Metin</p>");
  });

  it("boş içerikte boş dizge döner", () => {
    expect(blogIcerikNormalle("")).toBe("");
    expect(blogIcerikNormalle("   \n  ")).toBe("");
    expect(blogIcerikNormalle("<p>  </p>")).toBe("");
  });

  it("sabit noktalıdır: ikinci geçiş çıktıyı değiştirmez", () => {
    const ornekler = [
      "## Başlık\n\nParagraf **kalın**.\n\n- bir\n- iki\n\n> alıntı",
      '<div style="font-size:20px"><h1>A</h1><p>b<br><br>c</p><ul><li>d</li></ul></div>',
      "<p>• bir</p><p>• iki</p>",
      '<p><a href="https://a.co">x</a></p>',
      "Düz metin\n\nİkinci paragraf",
    ];
    for (const o of ornekler) {
      const bir = blogIcerikNormalle(o);
      expect(blogIcerikNormalle(bir)).toBe(bir);
    }
  });

  it("uzun ve karışık yapıştırmada da yalnız izinli etiket üretir", () => {
    const karisik = `
      <html><head><style>b{color:red}</style></head><body>
      <h1 style="font-family:Georgia">Ana başlık</h1>
      <p class=MsoNormal><o:p></o:p><span lang=TR style='font-size:12.0pt;color:#1F497D'>Word metni</span></p>
      <table border=1><tr><td>Hücre</td><td>İki</td></tr></table>
      <ol><li>Bir</li><li>İki</li></ol>
      <blockquote><p>Alıntı</p></blockquote>
      <a href="javascript:void(0)" onclick="x()">tuzak</a>
      <script>fetch('/kotu')</script>
      </body></html>`;
    const html = blogIcerikNormalle(karisik);
    for (const t of etiketler(html)) expect(IZINLI).toContain(t);
    expect(html).not.toContain("style");
    expect(html).not.toContain("javascript");
    expect(html).toContain("Word metni");
    expect(html).toContain("<ol><li>Bir</li><li>İki</li></ol>");
    expect(html).toContain("<h2>Ana başlık</h2>");
  });
});
