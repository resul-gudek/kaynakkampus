"use client";

/* 🗂 Etkinlikler — PDF arşivi yönetimi.

   Ekran bir DOSYA YÖNETİCİSİDİR, form yığını değil: üstte Geri / Yeni
   Klasör / Yeni PDF, altında kırıntı yolu, sonra kare kartlar. Ekleme ve
   düzenleme küçük bir kip pencerede yapılır; liste hep görünür kalır.

   Ağacın tamamı sunucudan tek seferde gelir; klasöre girmek yalnız adres
   parametresini değiştirir (?klasor=<id>) — her tıklamada sorgu yok.

   Bu modül bir takvim DEĞİLDİR: tarih, saat, yer, kategori yoktur. */

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { hizala } from "@/lib/kaydirma";
import { MAX_DOSYA_BOYUT, IZINLI_TURLER } from "@/lib/dosya-tanim";
import {
  altlari,
  boyutMetni,
  dugumleriAra,
  etkinlikIndirUrl,
  etkinlikKapakUrl,
  etkinlikPanelUrl,
  etkinlikPdfUrl,
  ETKINLIK_KAPAK_ACCEPT,
  ETKINLIK_PDF_ACCEPT,
  kirintiYolu,
  pdfSayisi,
  type EtkinlikDugumu,
} from "@/lib/etkinlik";
import { ETKINLIK_AD_MAX, ETKINLIK_DURUMLARI, ETKINLIK_DURUM_ETIKETLERI } from "@/lib/sabitler";
import {
  dugumSil,
  dugumSirala,
  dugumTasi,
  dugumYenidenAdlandir,
  durumDegistir,
  kapakSil,
  klasorEkle,
  pdfEkle,
  pdfGuncelle,
} from "@/actions/etkinlik";
import { Uyari } from "@/components/ui/uyari";
import KlasorIkonu from "@/components/etkinlik/KlasorIkonu";
import s from "./etkinlik.module.css";

const KAPAK_MB = Math.round(MAX_DOSYA_BOYUT / 1024 / 1024);
const KAPAK_MIME = Object.keys(IZINLI_TURLER.image);

type Kip = { tur: "pdf-ekle" } | { tur: "pdf-duzenle"; dugum: EtkinlikDugumu } | { tur: "tasi"; dugum: EtkinlikDugumu } | null;

export default function EtkinlikYonetim({
  dugumler,
  acikKlasor,
}: {
  dugumler: EtkinlikDugumu[];
  acikKlasor: string | null;
}) {
  const router = useRouter();
  /* Klasör geçişinde hizalanacak çalışma alanı (araç çubuğundan aşağısı) */
  const alanRef = useRef<HTMLDivElement>(null);
  /* Klasöre girme isteği; yeni içerik geldiğinde (acikKlasor değişince) uygulanır */
  const hizalanacak = useRef(false);
  const [arama, setArama] = useState("");
  const [kip, setKip] = useState<Kip>(null);
  const [bekliyor, baslat] = useTransition();

  const kirinti = useMemo(() => kirintiYolu(dugumler, acikKlasor), [dugumler, acikKlasor]);

  /* Klasör içeriği geldikten sonra çalışma alanına hizala: kullanıcı sayfa
     başlığına değil dosya yöneticisinin başına gelir, alan görünüyorsa hiç
     kımıldanmaz (lib/kaydirma.ts). */
  useEffect(() => {
    if (!hizalanacak.current) return;
    hizalanacak.current = false;
    hizala(alanRef.current);
  }, [acikKlasor]);
  const ustKlasor = kirinti.length > 1 ? kirinti[kirinti.length - 2].id : null;

  /* Arama varsa TÜM ağaçta arar (klasör sınırı aşılır); yoksa yalnız
     bulunulan klasörün içi listelenir. */
  const gorunen = useMemo(() => {
    if (arama.trim()) return dugumleriAra(dugumler, arama);
    return altlari(dugumler, acikKlasor);
  }, [dugumler, acikKlasor, arama]);

  const klasorler = gorunen.filter((d) => d.tur === "klasor");
  const pdfler = gorunen.filter((d) => d.tur === "pdf");
  const toplamPdf = dugumler.filter((d) => d.tur === "pdf").length;
  const yayindaPdf = dugumler.filter((d) => d.tur === "pdf" && d.durum === "yayinda").length;
  const toplamKlasor = dugumler.filter((d) => d.tur === "klasor").length;

  function calistir(islem: () => Promise<{ hata?: string; tamam?: boolean }>) {
    baslat(async () => {
      const sonuc = await islem();
      if (sonuc.hata) Uyari.hata(sonuc.hata);
      else router.refresh();
    });
  }

  function git(klasorId: string | null) {
    setArama("");
    // scroll: false — Next'in tepeye çekmesi kapalı; hizalamayı biz yaparız
    router.push(etkinlikPanelUrl(klasorId), { scroll: false });
    hizalanacak.current = true;   // hizalama yeni içerik gelince yapılır
  }

  async function yeniKlasor() {
    const ad = await Uyari.sor("Klasör adı:", {
      baslik: "Yeni klasör",
      yerTutucu: "Örn. Matematik",
    });
    const temiz = String(ad ?? "").trim();
    if (!temiz) return;
    calistir(() => klasorEkle(acikKlasor, temiz));
  }

  async function yenidenAdlandir(d: EtkinlikDugumu) {
    const ad = await Uyari.sor(d.tur === "klasor" ? "Klasörün yeni adı:" : "Etkinliğin yeni başlığı:", {
      baslik: "Yeniden adlandır",
      varsayilan: d.ad,
    });
    const temiz = String(ad ?? "").trim();
    if (!temiz || temiz === d.ad) return;
    calistir(() => dugumYenidenAdlandir(d.id, temiz));
  }

  async function sil(d: EtkinlikDugumu) {
    const icerik = d.tur === "klasor" ? pdfSayisi(dugumler, d.id) : 0;
    const altToplam =
      d.tur === "klasor" ? dugumler.filter((x) => x.ustId === d.id).length : 0;

    /* Dolu klasörde ÇİFT onay: önce ne kaybedileceği yazılır, sonra
       "içeriğiyle birlikte" ikinci kez onaylatılır. */
    if (d.tur === "klasor" && altToplam > 0) {
      const ilk = await Uyari.onay(
        `“${d.ad}” klasörünün içinde ${altToplam} kayıt var${icerik ? ` (${icerik} PDF)` : ""}. ` +
          "Klasörü silmek İÇİNDEKİ HER ŞEYİ de siler.",
        { baslik: "Klasör boş değil", onayEtiketi: "Devam et", tehlikeli: true }
      );
      if (!ilk) return;
      const ikinci = await Uyari.onay(
        "Bu işlem geri alınamaz. Klasör, alt klasörleri ve içindeki tüm PDF dosyaları kalıcı olarak silinecek.",
        { baslik: `“${d.ad}” içeriğiyle silinsin mi?`, onayEtiketi: "Hepsini Sil", tehlikeli: true }
      );
      if (!ikinci) return;
      calistir(() => dugumSil(d.id, true));
      return;
    }

    const kabul = await Uyari.onay(
      d.tur === "klasor"
        ? "Boş klasör silinecek."
        : "Etkinlik ve PDF dosyası kalıcı olarak silinecek. Bu işlem geri alınamaz.",
      { baslik: `“${d.ad}” silinsin mi?`, onayEtiketi: "Sil", tehlikeli: true }
    );
    if (!kabul) return;
    calistir(() => dugumSil(d.id, true));
  }

  return (
    <main className="container">
      <div className="panel-bas">
        <h1>
          🗂 <span>Etkinlik</span> Arşivi
        </h1>
        <p>
          Sınıf ve ders klasörleri altında PDF çalışma kâğıtlarını düzenle. Klasöre gir, klasör aç
          ya da PDF yükle, yayınla.
        </p>
      </div>

      <div className="stat-grid">
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#F3ECEE" }}>🗂</div>
          <div><b>{toplamKlasor}</b><small>Klasör</small></div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#FBF1F3" }}>📄</div>
          <div><b>{toplamPdf}</b><small>PDF Etkinlik</small></div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#f0fdf4" }}>📢</div>
          <div><b>{yayindaPdf}</b><small>Yayında</small></div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#eff6ff" }}>📝</div>
          <div><b>{toplamPdf - yayindaPdf}</b><small>Taslak</small></div>
        </div>
      </div>

      {/* ── Araç çubuğu ── */}
      <div className={s.cubuk} ref={alanRef}>
        <button
          type="button"
          className={s.aracDugme}
          disabled={bekliyor || (!acikKlasor && !arama)}
          onClick={() => (arama ? setArama("") : git(ustKlasor))}
        >
          ← Geri
        </button>
        <button
          type="button"
          className={`${s.aracDugme} ${s.birincil}`}
          disabled={bekliyor}
          onClick={() => void yeniKlasor()}
        >
          🗂 Yeni Klasör
        </button>
        <button
          type="button"
          className={`${s.aracDugme} ${s.birincil}`}
          disabled={bekliyor}
          onClick={() => setKip({ tur: "pdf-ekle" })}
        >
          📄 Yeni PDF Etkinliği
        </button>
        <div className={s.aramaKutu}>
          <span aria-hidden>🔍</span>
          <input
            type="search"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Tüm arşivde ara…"
            aria-label="Etkinlik arşivinde ara"
          />
          {!!arama && (
            <button type="button" onClick={() => setArama("")} aria-label="Aramayı temizle">✕</button>
          )}
        </div>
        <Link href="/etkinlikler" target="_blank" className={s.aracBaglanti}>
          Ziyaretçi görünümü ↗
        </Link>
      </div>

      {/* ── Kırıntı yolu ── */}
      <nav className={s.kirinti} aria-label="Konum">
        <button type="button" onClick={() => git(null)} disabled={bekliyor}>
          Etkinlikler
        </button>
        {kirinti.map((k, i) => (
          <span key={k.id} className={s.kirintiParca}>
            <span aria-hidden>›</span>
            {i === kirinti.length - 1 ? (
              <b>{k.ad}</b>
            ) : (
              <button type="button" onClick={() => git(k.id)} disabled={bekliyor}>
                {k.ad}
              </button>
            )}
          </span>
        ))}
        {!!arama && <span className={s.kirintiParca}><span aria-hidden>›</span><b>“{arama}” araması</b></span>}
      </nav>

      {/* ── Izgara ── */}
      {!gorunen.length ? (
        <div className={s.bos}>
          <span aria-hidden>{arama ? "🔎" : "🗂"}</span>
          <b>{arama ? "Aramaya uyan kayıt yok." : "Bu klasör boş."}</b>
          <p>
            {arama
              ? "Arama sözcüğünü kısaltmayı deneyin."
              : "“Yeni Klasör” ile alt klasör açabilir ya da “Yeni PDF Etkinliği” ile dosya yükleyebilirsiniz."}
          </p>
        </div>
      ) : (
        <div className={s.izgara}>
          {klasorler.map((d, i) => (
            <KlasorKarti
              key={d.id}
              dugum={d}
              icerik={pdfSayisi(dugumler, d.id)}
              yol={arama ? kirintiYolu(dugumler, d.ustId).map((k) => k.ad).join(" › ") : ""}
              ilk={i === 0}
              son={i === klasorler.length - 1}
              bekliyor={bekliyor}
              siralanabilir={!arama}
              onAc={() => git(d.id)}
              onAd={() => void yenidenAdlandir(d)}
              onTasi={() => setKip({ tur: "tasi", dugum: d })}
              onSirala={(yon) => calistir(() => dugumSirala(d.id, yon))}
              onDurum={(durum) => calistir(() => durumDegistir(d.id, durum))}
              onSil={() => void sil(d)}
            />
          ))}
          {pdfler.map((d, i) => (
            <PdfKarti
              key={d.id}
              dugum={d}
              yol={arama ? kirintiYolu(dugumler, d.ustId).map((k) => k.ad).join(" › ") : ""}
              ilk={i === 0}
              son={i === pdfler.length - 1}
              bekliyor={bekliyor}
              siralanabilir={!arama}
              onDuzenle={() => setKip({ tur: "pdf-duzenle", dugum: d })}
              onAd={() => void yenidenAdlandir(d)}
              onTasi={() => setKip({ tur: "tasi", dugum: d })}
              onSirala={(yon) => calistir(() => dugumSirala(d.id, yon))}
              onDurum={(durum) => calistir(() => durumDegistir(d.id, durum))}
              onKapakSil={() => calistir(() => kapakSil(d.id))}
              onSil={() => void sil(d)}
            />
          ))}
        </div>
      )}

      {(kip?.tur === "pdf-ekle" || kip?.tur === "pdf-duzenle") && (
        <PdfKip
          mevcut={kip.tur === "pdf-duzenle" ? kip.dugum : undefined}
          ustId={acikKlasor}
          konum={kirinti.map((k) => k.ad).join(" › ") || "Etkinlikler"}
          onKapat={() => setKip(null)}
          onBitti={() => {
            setKip(null);
            router.refresh();
          }}
        />
      )}

      {kip?.tur === "tasi" && (
        <TasiKip
          dugum={kip.dugum}
          dugumler={dugumler}
          bekliyor={bekliyor}
          onKapat={() => setKip(null)}
          onTasi={(hedef) => {
            setKip(null);
            calistir(() => dugumTasi(kip.dugum.id, hedef));
          }}
        />
      )}
    </main>
  );
}

/* ── Ortak kart eylemleri ─────────────────────────────────── */
function KartEylemleri({
  dugum,
  bekliyor,
  siralanabilir,
  ilk,
  son,
  onSirala,
  onAd,
  onTasi,
  onDurum,
  onSil,
  ekstra,
}: {
  dugum: EtkinlikDugumu;
  bekliyor: boolean;
  siralanabilir: boolean;
  ilk: boolean;
  son: boolean;
  onSirala: (yon: "yukari" | "asagi") => void;
  onAd: () => void;
  onTasi: () => void;
  onDurum: (durum: string) => void;
  onSil: () => void;
  ekstra?: React.ReactNode;
}) {
  return (
    <div className={s.kartAlt}>
      {siralanabilir && (
        <span className={s.siraGrup}>
          <button
            type="button"
            className={s.mini}
            disabled={bekliyor || ilk}
            title="Öne al"
            aria-label={`${dugum.ad} — öne al`}
            onClick={() => onSirala("yukari")}
          >
            ◀
          </button>
          <button
            type="button"
            className={s.mini}
            disabled={bekliyor || son}
            title="Geri al"
            aria-label={`${dugum.ad} — geri al`}
            onClick={() => onSirala("asagi")}
          >
            ▶
          </button>
        </span>
      )}
      <button type="button" className={s.mini} disabled={bekliyor} title="Yeniden adlandır" onClick={onAd}>
        ✎
      </button>
      <button type="button" className={s.mini} disabled={bekliyor} title="Taşı" onClick={onTasi}>
        ⇄
      </button>
      {ekstra}
      <select
        className={s.durumSecim}
        value={dugum.durum}
        disabled={bekliyor}
        aria-label={`${dugum.ad} yayın durumu`}
        onChange={(e) => onDurum(e.target.value)}
      >
        {ETKINLIK_DURUMLARI.map((d) => (
          <option key={d} value={d}>{ETKINLIK_DURUM_ETIKETLERI[d]}</option>
        ))}
      </select>
      <button
        type="button"
        className={`${s.mini} ${s.tehlike}`}
        disabled={bekliyor}
        title="Sil"
        aria-label={`${dugum.ad} — sil`}
        onClick={onSil}
      >
        🗑
      </button>
    </div>
  );
}

/* ── Klasör kartı ─────────────────────────────────────────── */
function KlasorKarti({
  dugum,
  icerik,
  yol,
  ilk,
  son,
  bekliyor,
  siralanabilir,
  onAc,
  onAd,
  onTasi,
  onSirala,
  onDurum,
  onSil,
}: {
  dugum: EtkinlikDugumu;
  icerik: number;
  yol: string;
  ilk: boolean;
  son: boolean;
  bekliyor: boolean;
  siralanabilir: boolean;
  onAc: () => void;
  onAd: () => void;
  onTasi: () => void;
  onSirala: (yon: "yukari" | "asagi") => void;
  onDurum: (durum: string) => void;
  onSil: () => void;
}) {
  return (
    <article className={`${s.kart} ${s.klasorKart} ${dugum.durum === "taslak" ? s.taslakKart : ""}`}>
      <button type="button" className={s.kartAc} onClick={onAc} disabled={bekliyor}>
        <KlasorIkonu className={s.klasorIkon} boyut={54} />
        <span className={s.kartBaslik}>{dugum.ad}</span>
        <span className={s.kartNot}>
          {icerik ? `${icerik} PDF` : "boş"}
          {dugum.durum === "taslak" ? " · taslak" : ""}
        </span>
        {yol && <span className={s.kartYol}>{yol}</span>}
      </button>
      <KartEylemleri
        dugum={dugum}
        bekliyor={bekliyor}
        siralanabilir={siralanabilir}
        ilk={ilk}
        son={son}
        onSirala={onSirala}
        onAd={onAd}
        onTasi={onTasi}
        onDurum={onDurum}
        onSil={onSil}
      />
    </article>
  );
}

/* ── PDF kartı ────────────────────────────────────────────── */
function PdfKarti({
  dugum,
  yol,
  ilk,
  son,
  bekliyor,
  siralanabilir,
  onDuzenle,
  onAd,
  onTasi,
  onSirala,
  onDurum,
  onKapakSil,
  onSil,
}: {
  dugum: EtkinlikDugumu;
  yol: string;
  ilk: boolean;
  son: boolean;
  bekliyor: boolean;
  siralanabilir: boolean;
  onDuzenle: () => void;
  onAd: () => void;
  onTasi: () => void;
  onSirala: (yon: "yukari" | "asagi") => void;
  onDurum: (durum: string) => void;
  onKapakSil: () => void;
  onSil: () => void;
}) {
  return (
    <article className={`${s.kart} ${dugum.durum === "taslak" ? s.taslakKart : ""}`}>
      <a
        className={s.kartAc}
        href={etkinlikPdfUrl(dugum.id)}
        target="_blank"
        rel="noreferrer"
        title="PDF'i yeni sekmede aç"
      >
        <span className={s.onizleme}>
          {dugum.kapakVar ? (
            /* Görsel API rotasından gelir (public dizinde değil) */
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={etkinlikKapakUrl(dugum.id)} alt="" />
          ) : (
            <span className={s.pdfIkon} aria-hidden>PDF</span>
          )}
        </span>
        <span className={s.kartBaslik}>{dugum.ad}</span>
        <span className={s.kartNot}>
          {boyutMetni(dugum.dosyaBoyut) || "dosya yok"}
          {dugum.durum === "taslak" ? " · taslak" : ""}
        </span>
        {yol && <span className={s.kartYol}>{yol}</span>}
      </a>

      <div className={s.pdfEylem}>
        <a className={s.mini} href={etkinlikPdfUrl(dugum.id)} target="_blank" rel="noreferrer" title="Görüntüle">
          👁
        </a>
        <a className={s.mini} href={etkinlikIndirUrl(dugum.id)} title="İndir">
          ⬇
        </a>
        <button type="button" className={s.mini} disabled={bekliyor} title="PDF / kapak değiştir" onClick={onDuzenle}>
          ⇪
        </button>
      </div>

      <KartEylemleri
        dugum={dugum}
        bekliyor={bekliyor}
        siralanabilir={siralanabilir}
        ilk={ilk}
        son={son}
        onSirala={onSirala}
        onAd={onAd}
        onTasi={onTasi}
        onDurum={onDurum}
        onSil={onSil}
        ekstra={
          dugum.kapakVar ? (
            <button
              type="button"
              className={s.mini}
              disabled={bekliyor}
              title="Ön izleme görselini kaldır"
              onClick={onKapakSil}
            >
              🚫
            </button>
          ) : undefined
        }
      />
    </article>
  );
}

/* ── PDF ekleme / düzenleme kipi ──────────────────────────── */
function PdfKip({
  mevcut,
  ustId,
  konum,
  onKapat,
  onBitti,
}: {
  mevcut?: EtkinlikDugumu;
  ustId: string | null;
  konum: string;
  onKapat: () => void;
  onBitti: () => void;
}) {
  const duzenleme = !!mevcut;
  const [ad, setAd] = useState(mevcut?.ad ?? "");
  const [durum, setDurum] = useState(mevcut?.durum ?? "taslak");
  const [kapakOnizleme, setKapakOnizleme] = useState<string | null>(null);
  const [pdfAdi, setPdfAdi] = useState("");
  const [hata, setHata] = useState("");
  const [bekliyor, setBekliyor] = useState(false);

  function pdfSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0] ?? null;
    setHata("");
    setPdfAdi("");
    if (!dosya) return;
    if ((dosya.type || "").toLowerCase() !== "application/pdf") {
      setHata(`"${dosya.name}" bir PDF değil.`);
      e.target.value = "";
      return;
    }
    if (dosya.size > MAX_DOSYA_BOYUT) {
      setHata(`"${dosya.name}" çok büyük (en fazla ${KAPAK_MB} MB).`);
      e.target.value = "";
      return;
    }
    setPdfAdi(`${dosya.name} · ${boyutMetni(dosya.size)}`);
    // Başlık boşsa dosya adından öneri üret
    if (!ad.trim()) setAd(dosya.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim());
  }

  function kapakSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0] ?? null;
    setHata("");
    if (!dosya) {
      setKapakOnizleme(null);
      return;
    }
    if (!KAPAK_MIME.includes((dosya.type || "").toLowerCase())) {
      setHata(`"${dosya.name}" desteklenmiyor; JPG, PNG ya da WebP olmalı.`);
      e.target.value = "";
      setKapakOnizleme(null);
      return;
    }
    if (dosya.size > MAX_DOSYA_BOYUT) {
      setHata(`"${dosya.name}" çok büyük (en fazla ${KAPAK_MB} MB).`);
      e.target.value = "";
      setKapakOnizleme(null);
      return;
    }
    setKapakOnizleme(URL.createObjectURL(dosya));
  }

  async function gonder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHata("");
    const fd = new FormData(e.currentTarget);
    if (!ad.trim()) {
      setHata("Başlık gerekli.");
      return;
    }
    if (duzenleme) fd.set("id", mevcut.id);
    else if (ustId) fd.set("ustId", ustId);

    setBekliyor(true);
    try {
      const sonuc = duzenleme ? await pdfGuncelle(fd) : await pdfEkle(fd);
      if (sonuc.hata) {
        setHata(sonuc.hata);
        return;
      }
      onBitti();
    } finally {
      setBekliyor(false);
    }
  }

  return (
    <div className={s.kipZemin} role="dialog" aria-modal="true" aria-label={duzenleme ? "Etkinliği düzenle" : "Yeni PDF etkinliği"}>
      <form className={s.kip} onSubmit={gonder}>
        <div className={s.kipBas}>
          <h2>{duzenleme ? "PDF etkinliğini düzenle" : "Yeni PDF etkinliği"}</h2>
          <button type="button" className={s.mini} onClick={onKapat} disabled={bekliyor} aria-label="Kapat">
            ✕
          </button>
        </div>

        <p className={s.kipKonum}>Konum: <b>{konum}</b></p>

        <label className={s.alan}>
          <span>Başlık *</span>
          <input
            name="ad"
            required
            maxLength={ETKINLIK_AD_MAX}
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            placeholder="Örn. Kesirler – Çalışma Kâğıdı 1"
          />
        </label>

        <label className={s.alan}>
          <span>PDF dosyası {duzenleme ? "(değiştirmek için seç)" : "*"}</span>
          <input
            type="file"
            name="pdf"
            accept={ETKINLIK_PDF_ACCEPT}
            required={!duzenleme}
            onChange={pdfSecildi}
          />
          <small>
            {pdfAdi ||
              (duzenleme && mevcut?.dosyaVar
                ? `Yüklü: ${mevcut.dosyaAd || "dosya.pdf"} · ${boyutMetni(mevcut.dosyaBoyut)} — yeni dosya seçmezsen korunur.`
                : `Yalnız PDF · en fazla ${KAPAK_MB} MB`)}
          </small>
        </label>

        <div className={s.kapakAlan}>
          <div className={s.kapakOnizleme}>
            {kapakOnizleme ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={kapakOnizleme} alt="Seçilen ön izleme" />
            ) : mevcut?.kapakVar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={etkinlikKapakUrl(mevcut.id)} alt="Mevcut ön izleme" />
            ) : (
              <span aria-hidden>PDF</span>
            )}
          </div>
          <label className={s.alan}>
            <span>Ön izleme görseli (isteğe bağlı)</span>
            <input type="file" name="kapak" accept={ETKINLIK_KAPAK_ACCEPT} onChange={kapakSecildi} />
            <small>
              Kare ya da kareye yakın görsel önerilir. Yüklenmezse kartta kurumsal PDF görseli
              gösterilir.
            </small>
          </label>
        </div>

        <label className={s.alan}>
          <span>Yayın durumu</span>
          <select name="durum" value={durum} onChange={(e) => setDurum(e.target.value)}>
            {ETKINLIK_DURUMLARI.map((d) => (
              <option key={d} value={d}>{ETKINLIK_DURUM_ETIKETLERI[d]}</option>
            ))}
          </select>
          <small>
            {durum === "yayinda"
              ? "Kaydettiğin an ziyaretçi arşivinde görünür."
              : "Yalnız bu panelde görünür."}
          </small>
        </label>

        {hata && <div className={s.hata}>{hata}</div>}

        <div className={s.kipAlt}>
          <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
            {bekliyor ? "Kaydediliyor…" : duzenleme ? "Değişiklikleri Kaydet" : "Etkinliği Yükle"}
          </button>
          <button type="button" className="btn btn-outline btn-kucuk" disabled={bekliyor} onClick={onKapat}>
            Vazgeç
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Taşıma kipi ──────────────────────────────────────────── */
function TasiKip({
  dugum,
  dugumler,
  bekliyor,
  onKapat,
  onTasi,
}: {
  dugum: EtkinlikDugumu;
  dugumler: EtkinlikDugumu[];
  bekliyor: boolean;
  onKapat: () => void;
  onTasi: (hedefId: string | null) => void;
}) {
  /* Hedef listesi: tüm klasörler, ama kendisi ve alt ağacı HARİÇ —
     bir klasör kendi içine taşınırsa dal ağaçtan kopar. */
  const hedefler = useMemo(() => {
    const yasak = new Set<string>([dugum.id]);
    let eklendi = true;
    while (eklendi) {
      eklendi = false;
      for (const d of dugumler) {
        if (d.ustId && yasak.has(d.ustId) && !yasak.has(d.id)) {
          yasak.add(d.id);
          eklendi = true;
        }
      }
    }
    return dugumler
      .filter((d) => d.tur === "klasor" && !yasak.has(d.id))
      .map((d) => ({
        id: d.id,
        etiket: kirintiYolu(dugumler, d.id).map((k) => k.ad).join(" › "),
      }))
      .sort((a, b) => a.etiket.localeCompare(b.etiket, "tr"));
  }, [dugum, dugumler]);

  const [hedef, setHedef] = useState<string>(dugum.ustId ?? "");

  return (
    <div className={s.kipZemin} role="dialog" aria-modal="true" aria-label="Taşı">
      <div className={s.kip}>
        <div className={s.kipBas}>
          <h2>“{dugum.ad}” taşı</h2>
          <button type="button" className={s.mini} onClick={onKapat} aria-label="Kapat">✕</button>
        </div>

        <label className={s.alan}>
          <span>Hedef klasör</span>
          <select value={hedef} onChange={(e) => setHedef(e.target.value)} disabled={bekliyor}>
            <option value="">Etkinlikler (kök)</option>
            {hedefler.map((h) => (
              <option key={h.id} value={h.id}>{h.etiket}</option>
            ))}
          </select>
          <small>
            {dugum.tur === "klasor"
              ? "Klasör, içindeki her şeyle birlikte taşınır. Kendi alt klasörlerine taşınamaz."
              : "Etkinlik seçtiğin klasöre taşınır."}
          </small>
        </label>

        <div className={s.kipAlt}>
          <button
            type="button"
            className="btn btn-primary btn-kucuk"
            disabled={bekliyor || (hedef || null) === (dugum.ustId ?? null)}
            onClick={() => onTasi(hedef || null)}
          >
            Taşı
          </button>
          <button type="button" className="btn btn-outline btn-kucuk" onClick={onKapat} disabled={bekliyor}>
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
