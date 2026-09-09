"use client";

/* ═══════════════════════════════════════════════════════════════
   BLOG İÇERİK EDİTÖRÜ — kontrollü biçimlendirme

   Araç çubuğunda YALNIZ şunlar vardır: paragraf, H2, H3, kalın, italik,
   madde listesi, numaralı liste, bağlantı, alıntı. Yazı tipi, punto,
   renk, zemin gibi seçenekler bilerek YOKTUR — yazının görünümü
   kurumsaldır, yazıdan yazıya değişmez.

   Ana başlık (H1) buraya YAZILMAZ: yazının başlığı ayrı "Başlık"
   alanından gelir ve sayfada tek H1 olarak basılır.

   Dışarıdan yapıştırılan içerik (Word, Google Docs, WhatsApp, ChatGPT…)
   panoya konulduğu biçimiyle DEĞİL, lib/blog-icerik.ts'ten geçirilmiş
   hâliyle eklenir: font-family, punto, renk, zemin, inline style ve
   gereksiz span/div sarmalayıcıları düşer.

   Yazı alanı yayındaki gövdeyle aynı .blog-content sınıfını kullanır;
   editörde görünen tipografi yayında görünenle birebir aynıdır.

   Not: biçimlendirme document.execCommand ile yapılır. API "deprecated"
   sayılır ama contenteditable için tüm güncel tarayıcılarda çalışan tek
   yerleşik yol budur; üretilen düzensiz işaretleme zaten her kayıtta
   (ve alandan çıkarken) normalleştiriciden geçtiği için kalıcı olmaz.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";
import { blogIcerikNormalle } from "@/lib/blog-icerik";
import { Uyari } from "@/components/ui/uyari";
import s from "./blog-editor.module.css";

type BlokTuru = "p" | "h2" | "h3" | "blockquote";

interface Durum {
  blok: BlokTuru | "";
  kalin: boolean;
  egik: boolean;
  maddeli: boolean;
  sirali: boolean;
  baglanti: boolean;
}

const BOS_DURUM: Durum = {
  blok: "",
  kalin: false,
  egik: false,
  maddeli: false,
  sirali: false,
  baglanti: false,
};

export default function BlogEditor({
  ad = "icerik",
  baslangic = "",
  onDegisim,
}: {
  /** Form alanı adı (gizli input) */
  ad?: string;
  /** Düzenlenecek içerik — eski kayıtlardaki düz metin de olabilir */
  baslangic?: string;
  /** Normalleştirilmiş içerik (sayaç/özet önizlemesi için, gecikmeli) */
  onDegisim?: (icerik: string) => void;
}) {
  const alanRef = useRef<HTMLDivElement>(null);
  const gizliRef = useRef<HTMLInputElement>(null);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [durum, setDurum] = useState<Durum>(BOS_DURUM);

  /* Eski kayıtlar (markdown-lite düz metin) editöre HTML olarak yüklenir;
     böylece ilk kaydetmede yeni standarda geçerler. */
  const [ilkHtml] = useState(() => blogIcerikNormalle(baslangic));

  /* ── Form ile eşitleme ───────────────────────────────────────
     Gizli alan her tuşta ham hâliyle güncellenir (ucuz); sayaç ve özet
     önizlemesi için normalleştirme geciktirilir. Sunucu kaydederken
     zaten yeniden normalleştirir — tek doğruluk kaynağı orasıdır. */
  const esitle = useCallback(() => {
    const alan = alanRef.current;
    const gizli = gizliRef.current;
    if (!alan || !gizli) return;
    gizli.value = alan.innerHTML;
    if (!onDegisim) return;
    if (zamanlayici.current) clearTimeout(zamanlayici.current);
    zamanlayici.current = setTimeout(() => onDegisim(blogIcerikNormalle(alan.innerHTML)), 250);
  }, [onDegisim]);

  /* Başlangıç içeriği DOM'a ELLE yazılır; JSX'te dangerouslySetInnerHTML
     KULLANILMAZ. Kullanılsaydı her yeniden çizimde (imleç oynayınca bile)
     React o özniteliği yeniden uygular ve yazılanları siler — alan React
     tarafından yönetilmemeli, yalnız tarayıcı ve bu bileşen dokunmalı. */
  const yuklendi = useRef(false);
  useEffect(() => {
    const alan = alanRef.current;
    if (!alan || yuklendi.current) return;
    yuklendi.current = true;
    alan.innerHTML = ilkHtml;
    esitle();
  }, [ilkHtml, esitle]);

  useEffect(
    () => () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
    },
    []
  );

  /* ── Seçimdeki biçimi araç çubuğuna yansıt ─────────────────── */
  const durumTazele = useCallback(() => {
    const alan = alanRef.current;
    if (!alan || typeof window === "undefined") return;
    const secim = window.getSelection();
    const dugum = secim?.anchorNode;
    if (!dugum || !alan.contains(dugum)) return;

    let blok: BlokTuru | "" = "";
    let baglanti = false;
    let e: HTMLElement | null =
      dugum.nodeType === 1 ? (dugum as HTMLElement) : dugum.parentElement;
    while (e && e !== alan) {
      const etiket = e.tagName.toLowerCase();
      if (etiket === "a") baglanti = true;
      if (!blok && (etiket === "p" || etiket === "h2" || etiket === "h3" || etiket === "blockquote"))
        blok = etiket as BlokTuru;
      e = e.parentElement;
    }

    const sorgu = (komut: string) => {
      try {
        return document.queryCommandState(komut);
      } catch {
        return false;
      }
    };
    const yeni: Durum = {
      blok,
      baglanti,
      kalin: sorgu("bold"),
      egik: sorgu("italic"),
      maddeli: sorgu("insertUnorderedList"),
      sirali: sorgu("insertOrderedList"),
    };
    // İmleç her oynadığında yeniden çizmemek için değişiklik denetimi
    setDurum((eski) =>
      (Object.keys(yeni) as (keyof Durum)[]).every((k) => eski[k] === yeni[k]) ? eski : yeni
    );
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", durumTazele);
    return () => document.removeEventListener("selectionchange", durumTazele);
  }, [durumTazele]);

  /* Tarayıcı varsayılanı kimi yerde <div> ve style'lı işaretleme üretir;
     ikisi de kapatılır. */
  useEffect(() => {
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
      document.execCommand("styleWithCSS", false, "false");
    } catch {
      /* tarayıcı desteklemiyorsa çıktı yine normalleştirmeden geçer */
    }
  }, []);

  /* ── Komutlar ─────────────────────────────────────────────── */
  function komut(ad: string, deger?: string) {
    alanRef.current?.focus();
    try {
      document.execCommand(ad, false, deger);
    } catch {
      /* desteklenmeyen komut sessizce atlanır */
    }
    esitle();
    durumTazele();
  }

  function blokYap(hedef: BlokTuru) {
    // Aynı biçime ikinci kez basmak paragrafa döndürür
    komut("formatBlock", durum.blok === hedef && hedef !== "p" ? "p" : hedef);
  }

  async function baglantiYap() {
    if (durum.baglanti) {
      komut("unlink");
      return;
    }
    const secim = window.getSelection();
    if (!secim || secim.isCollapsed) {
      Uyari.bildir("Önce bağlantı yapılacak metni seçin.", { tur: "uyari" });
      return;
    }
    // Pencere açılırken seçim kaybolur; aralık saklanıp geri konur
    const aralik = secim.getRangeAt(0).cloneRange();
    const cevap = await Uyari.sor("Bağlantı adresi:", {
      baslik: "Bağlantı ekle",
      yerTutucu: "https://…",
      varsayilan: "https://",
    });
    const adres = String(cevap ?? "").trim();
    alanRef.current?.focus();
    const yeni = window.getSelection();
    yeni?.removeAllRanges();
    yeni?.addRange(aralik);
    if (!adres || adres === "https://") return;
    komut("createLink", adres);
  }

  /* ── Yapıştırma / sürükle-bırak ───────────────────────────── */
  function icerikEkle(html: string) {
    if (!html) return;
    alanRef.current?.focus();
    try {
      document.execCommand("insertHTML", false, html);
    } catch {
      /* eklenemezse pano içeriği yok sayılır */
    }
    esitle();
  }

  function yapistir(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const pano = e.clipboardData;
    const html = pano.getData("text/html");
    const duz = pano.getData("text/plain");
    icerikEkle(blogIcerikNormalle(html || duz));
  }

  function birak(e: React.DragEvent<HTMLDivElement>) {
    const html = e.dataTransfer.getData("text/html");
    const duz = e.dataTransfer.getData("text/plain");
    if (!html && !duz) return; // dosya sürüklenmiş; tarayıcıya bırakılmaz
    e.preventDefault();
    icerikEkle(blogIcerikNormalle(html || duz));
  }

  /** Alandan çıkarken gövde tek biçime indirgenir (yazar sonucu görsün) */
  function ayril() {
    const alan = alanRef.current;
    if (!alan) return;
    const temiz = blogIcerikNormalle(alan.innerHTML);
    if (temiz !== alan.innerHTML) alan.innerHTML = temiz;
    esitle();
    if (onDegisim) onDegisim(temiz);
  }

  return (
    <div className={s.sarmal}>
      <div className={s.cubuk} role="toolbar" aria-label="Biçimlendirme">
        <Dugme etiket="Paragraf" baslik="Paragraf" etkin={durum.blok === "p"} tiklama={() => blokYap("p")} />
        <Dugme etiket="H2" baslik="Ara başlık (H2)" etkin={durum.blok === "h2"} ek={s.baslik2} tiklama={() => blokYap("h2")} />
        <Dugme etiket="H3" baslik="Alt başlık (H3)" etkin={durum.blok === "h3"} ek={s.baslik3} tiklama={() => blokYap("h3")} />
        <span className={s.ayrac} aria-hidden />
        <Dugme etiket="B" baslik="Kalın" etkin={durum.kalin} ek={s.kalin} tiklama={() => komut("bold")} />
        <Dugme etiket="I" baslik="İtalik" etkin={durum.egik} ek={s.egik} tiklama={() => komut("italic")} />
        <span className={s.ayrac} aria-hidden />
        <Dugme etiket="• Liste" baslik="Madde işaretli liste" etkin={durum.maddeli} tiklama={() => komut("insertUnorderedList")} />
        <Dugme etiket="1. Liste" baslik="Numaralı liste" etkin={durum.sirali} tiklama={() => komut("insertOrderedList")} />
        <span className={s.ayrac} aria-hidden />
        <Dugme
          etiket="🔗 Bağlantı"
          baslik={durum.baglanti ? "Bağlantıyı kaldır" : "Bağlantı ekle"}
          etkin={durum.baglanti}
          tiklama={() => void baglantiYap()}
        />
        <Dugme etiket="❝ Alıntı" baslik="Alıntı" etkin={durum.blok === "blockquote"} tiklama={() => blokYap("blockquote")} />
      </div>

      {/* Okuma sütunu 740px'te ortalanır; kenardaki boşluğa tıklamak da
          imleci yazı alanına götürsün */}
      <div className={s.kutu} onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          alanRef.current?.focus();
        }
      }}>
        <div
          ref={alanRef}
          className={`${s.alan} blog-content`}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Yazı içeriği"
          data-yer-tutucu="Yazınızı buraya yazın ya da yapıştırın…"
          spellCheck
          onInput={esitle}
          onPaste={yapistir}
          onDrop={birak}
          onBlur={ayril}
          onKeyUp={durumTazele}
          onMouseUp={durumTazele}
        />
      </div>

      {/* Forma giden değer; sunucu kaydederken yeniden normalleştirir */}
      <input ref={gizliRef} type="hidden" name={ad} />
    </div>
  );
}

/* ── Araç çubuğu düğmesi ──────────────────────────────────── */
function Dugme({
  etiket,
  baslik,
  etkin,
  tiklama,
  ek,
}: {
  etiket: string;
  baslik: string;
  etkin: boolean;
  tiklama: () => void;
  ek?: string;
}) {
  return (
    <button
      type="button"
      className={`${s.dugme} ${etkin ? s.etkin : ""} ${ek ?? ""}`}
      title={baslik}
      aria-label={baslik}
      aria-pressed={etkin}
      // Odak yazı alanında kalsın; yoksa seçim kaybolur
      onMouseDown={(e) => e.preventDefault()}
      onClick={tiklama}
    >
      {etiket}
    </button>
  );
}
