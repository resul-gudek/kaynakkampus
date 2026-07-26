"use client";

/* 📰 Blog — yönetici içerik ekranı.
   Yazı ekleme, düzenleme, taslak/yayın durumu, kapak görseli ve silme.

   Blog kullanıcı sistemine bağlı değildir: yazar alanı serbest metindir,
   yayındaki yazıları herkes oturum açmadan okur. */

import { useMemo, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MAX_DOSYA_BOYUT, IZINLI_TURLER } from "@/lib/dosya-tanim";
import {
  BLOG_KAPAK_ACCEPT,
  blogKapakUrl,
  blogYaziUrl,
  etiketleriAyir,
  kategoriEtiketi,
  kategoriIkonu,
  okumaSuresi,
  ozetUret,
  slugla,
} from "@/lib/blog";
import {
  BLOG_DURUMLARI,
  BLOG_DURUM_ETIKETLERI,
  BLOG_KATEGORILERI,
  BLOG_KATEGORI_ETIKETLERI,
  BLOG_MAX_ETIKET,
} from "@/lib/sabitler";
import {
  blogKapakSil,
  blogYaziDurum,
  blogYaziEkle,
  blogYaziGuncelle,
  blogYaziSil,
} from "@/actions/blog";
import s from "./blog.module.css";

export interface BlogSatir {
  id: string;
  slug: string;
  baslik: string;
  ozet: string;
  icerik: string;
  kategori: string;
  etiketler: string;
  seoAciklama: string;
  yazarAd: string;
  durum: string;
  yayinTarihi: string;
  okuma: number;
  kapakVar: boolean;
  kapakAd: string;
  guncelleme: string;
}

const KAPAK_MB = Math.round(MAX_DOSYA_BOYUT / 1024 / 1024);
const KAPAK_MIME = Object.keys(IZINLI_TURLER.image);

export default function BlogYonetim({
  yazilar,
  varsayilanYazar,
}: {
  yazilar: BlogSatir[];
  varsayilanYazar: string;
}) {
  const router = useRouter();
  /* null = form kapalı, "yeni" = ekleme, aksi halde düzenlenen yazı kimliği */
  const [form, setForm] = useState<string | null>(null);
  const [arama, setArama] = useState("");
  const [durumSuzgeci, setDurumSuzgeci] = useState("");
  const [bekliyor, baslat] = useTransition();

  const yayinda = yazilar.filter((y) => y.durum === "yayinda").length;
  const taslak = yazilar.filter((y) => y.durum === "taslak").length;
  const kapaksiz = yazilar.filter((y) => !y.kapakVar).length;

  const gorunen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr-TR");
    return yazilar.filter((y) => {
      if (durumSuzgeci && y.durum !== durumSuzgeci) return false;
      if (!q) return true;
      return [y.baslik, y.slug, y.etiketler, kategoriEtiketi(y.kategori)]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(q);
    });
  }, [yazilar, arama, durumSuzgeci]);

  function calistir(islem: () => Promise<{ hata?: string; tamam?: boolean }>) {
    baslat(async () => {
      const sonuc = await islem();
      if (sonuc.hata) alert(sonuc.hata);
      else router.refresh();
    });
  }

  return (
    <main className="container">
      <div className="panel-bas">
        <h1>
          📰 <span>Blog</span> Yönetimi
        </h1>
        <p>
          Herkese açık blog yazılarını hazırla, taslakta beklet, yayına al ya da yayından kaldır.
        </p>
      </div>

      <div className="stat-grid">
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#F3ECEE" }}>📰</div>
          <div><b>{yazilar.length}</b><small>Toplam Yazı</small></div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#f0fdf4" }}>📢</div>
          <div><b>{yayinda}</b><small>Yayında</small></div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#FBF1F3" }}>📝</div>
          <div><b>{taslak}</b><small>Taslak</small></div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#fef2f2" }}>🖼</div>
          <div><b>{kapaksiz}</b><small>Kapağı Yok</small></div>
        </div>
      </div>

      <section className={s.ustEylem}>
        <div>
          <h2>Blog yazıları</h2>
          <p>
            Yayına alınan yazılar <Link href="/blog">/blog</Link> sayfasında herkese görünür;
            taslaklar yalnız burada durur. Adresler başlıktan üretilir ve SEO uyumludur
            (örn. <code>/blog/verimli-ders-calisma-yontemleri</code>).
          </p>
        </div>
        <button
          className="btn btn-primary btn-kucuk"
          onClick={() => setForm((x) => (x === "yeni" ? null : "yeni"))}
        >
          {form === "yeni" ? "Formu Kapat" : "＋ Yeni Yazı"}
        </button>
      </section>

      {form === "yeni" && (
        <YaziFormu
          key="yeni"
          varsayilanYazar={varsayilanYazar}
          onKapat={() => setForm(null)}
        />
      )}

      {yazilar.length > 0 && (
        <div className={s.suzgec}>
          <input
            type="search"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Başlık, adres, etiket ara…"
            aria-label="Yazılarda ara"
          />
          <select
            value={durumSuzgeci}
            onChange={(e) => setDurumSuzgeci(e.target.value)}
            aria-label="Durum süzgeci"
          >
            <option value="">Tüm durumlar</option>
            {BLOG_DURUMLARI.map((d) => (
              <option key={d} value={d}>{BLOG_DURUM_ETIKETLERI[d]}</option>
            ))}
          </select>
        </div>
      )}

      <div className={s.liste}>
        {yazilar.length === 0 ? (
          <div className={s.bos}>
            <span>📰</span>
            <b>Henüz blog yazısı yok.</b>
            <p>“＋ Yeni Yazı” ile ilk yazını ekleyebilirsin.</p>
          </div>
        ) : gorunen.length === 0 ? (
          <div className={s.bos}>
            <span>🔎</span>
            <b>Süzgece uyan yazı bulunamadı.</b>
            <p>Arama sözcüğünü kısaltmayı ya da durum süzgecini sıfırlamayı dene.</p>
          </div>
        ) : (
          gorunen.map((yazi) =>
            form === yazi.id ? (
              <YaziFormu
                key={yazi.id}
                mevcut={yazi}
                varsayilanYazar={varsayilanYazar}
                onKapat={() => setForm(null)}
              />
            ) : (
              <Satir
                key={yazi.id}
                yazi={yazi}
                bekliyor={bekliyor}
                onDuzenle={() => setForm(yazi.id)}
                calistir={calistir}
              />
            )
          )
        )}
      </div>
    </main>
  );
}

/* ── Liste satırı ─────────────────────────────────────────── */
function Satir({
  yazi,
  bekliyor,
  onDuzenle,
  calistir,
}: {
  yazi: BlogSatir;
  bekliyor: boolean;
  onDuzenle: () => void;
  calistir: (islem: () => Promise<{ hata?: string; tamam?: boolean }>) => void;
}) {
  const etiketler = etiketleriAyir(yazi.etiketler);
  const adres = blogYaziUrl(yazi.slug);

  return (
    <article className={s.kart}>
      <div className={s.kapak}>
        {yazi.kapakVar ? (
          /* Kapak API rotasından gelir (public dizinde değil) */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={blogKapakUrl(yazi.id)} alt="" />
        ) : (
          <span aria-hidden>{kategoriIkonu(yazi.kategori)}</span>
        )}
      </div>

      <div className={s.govde}>
        <div className={s.baslikSatir}>
          <h3>{yazi.baslik}</h3>
          <span className={`${s.durum} ${yazi.durum === "yayinda" ? s.yayinda : s.taslak}`}>
            {BLOG_DURUM_ETIKETLERI[yazi.durum as keyof typeof BLOG_DURUM_ETIKETLERI] ?? yazi.durum}
          </span>
        </div>
        <div className={s.kategoriSatir}>
          {kategoriIkonu(yazi.kategori)} {kategoriEtiketi(yazi.kategori)}
        </div>
        <div className={s.adres}>
          {yazi.durum === "yayinda" ? (
            <a href={adres} target="_blank" rel="noreferrer">{adres} ↗</a>
          ) : (
            adres
          )}
        </div>
        {yazi.ozet && <p className={s.ozetMetni}>{yazi.ozet}</p>}
        <div className={s.meta}>
          {yazi.yayinTarihi && <span className="tag">📅 {yazi.yayinTarihi}</span>}
          {!!yazi.okuma && <span className="tag">⏱ {yazi.okuma} dk</span>}
          {yazi.yazarAd && <span className="tag">✍️ {yazi.yazarAd}</span>}
          <span className="tag">🕘 {yazi.guncelleme} güncellendi</span>
          {etiketler.slice(0, 4).map((e) => (
            <span key={e} className="tag">#{e}</span>
          ))}
          {etiketler.length > 4 && <span className="tag">+{etiketler.length - 4}</span>}
        </div>
      </div>

      <div className={s.eylem}>
        <label className={s.durumSecim}>
          <span>Yayın durumu</span>
          <select
            value={yazi.durum}
            disabled={bekliyor}
            onChange={(e) => calistir(() => blogYaziDurum(yazi.id, e.target.value))}
          >
            {BLOG_DURUMLARI.map((d) => (
              <option key={d} value={d}>{BLOG_DURUM_ETIKETLERI[d]}</option>
            ))}
          </select>
        </label>
        <button className="btn btn-outline btn-kucuk" disabled={bekliyor} onClick={onDuzenle}>
          Düzenle
        </button>
        {yazi.kapakVar && (
          <button
            className={s.metinButon}
            disabled={bekliyor}
            onClick={() => {
              if (!confirm("Kapak görseli kaldırılsın mı?")) return;
              calistir(() => blogKapakSil(yazi.id));
            }}
          >
            Kapağı kaldır
          </button>
        )}
        <button
          className={`${s.metinButon} ${s.tehlike}`}
          disabled={bekliyor}
          onClick={() => {
            if (!confirm(`“${yazi.baslik}” kalıcı olarak silinsin mi?`)) return;
            calistir(() => blogYaziSil(yazi.id));
          }}
        >
          Sil
        </button>
      </div>
    </article>
  );
}

/* ── Ekleme / düzenleme formu ─────────────────────────────── */
function YaziFormu({
  mevcut,
  varsayilanYazar,
  onKapat,
}: {
  mevcut?: BlogSatir;
  varsayilanYazar: string;
  onKapat: () => void;
}) {
  const router = useRouter();
  const duzenleme = !!mevcut;

  const [baslik, setBaslik] = useState(mevcut?.baslik ?? "");
  const [slug, setSlug] = useState(mevcut?.slug ?? "");
  const [icerik, setIcerik] = useState(mevcut?.icerik ?? "");
  const [ozet, setOzet] = useState(mevcut?.ozet ?? "");
  const [seoAciklama, setSeoAciklama] = useState(mevcut?.seoAciklama ?? "");
  const [etiketler, setEtiketler] = useState(mevcut?.etiketler ?? "");
  const [durum, setDurum] = useState(mevcut?.durum ?? "taslak");
  const [kapakOnizleme, setKapakOnizleme] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [bekliyor, setBekliyor] = useState(false);

  /* Adres alanı elle doldurulmadıysa başlıktan türetilir */
  const etkinSlug = slug.trim() || slugla(baslik);
  const etiketListesi = etiketleriAyir(etiketler);
  const okuma = okumaSuresi(icerik);

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

    if (etiketListesi.length > BLOG_MAX_ETIKET) {
      setHata(`En çok ${BLOG_MAX_ETIKET} etiket girebilirsiniz.`);
      return;
    }
    fd.set("slug", slug.trim());
    if (duzenleme) fd.set("id", mevcut.id);

    setBekliyor(true);
    try {
      const sonuc = duzenleme ? await blogYaziGuncelle(fd) : await blogYaziEkle(fd);
      if (sonuc.hata) {
        setHata(sonuc.hata);
        return;
      }
      onKapat();
      router.refresh();
    } finally {
      setBekliyor(false);
    }
  }

  return (
    <form className={s.form} onSubmit={gonder}>
      <div className={s.formBas}>
        <h2>{duzenleme ? "Yazıyı düzenle" : "Yeni blog yazısı"}</h2>
        <button type="button" className={s.metinButon} disabled={bekliyor} onClick={onKapat}>
          Vazgeç
        </button>
      </div>

      <div className={s.izgara}>
        <label className={s.genis}>
          <span>Başlık *</span>
          <input
            name="baslik"
            required
            maxLength={200}
            value={baslik}
            onChange={(e) => setBaslik(e.target.value)}
            placeholder="Örn. Verimli Ders Çalışma Yöntemleri"
          />
        </label>

        <label className={s.orta}>
          <span>SEO adresi</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            maxLength={90}
            placeholder="verimli-ders-calisma-yontemleri"
          />
          <div className={s.adresOnizleme}>
            Adres: <code>/blog/{etkinSlug || "…"}</code>
          </div>
          <small>Boş bırakılırsa başlıktan üretilir. Çakışırsa sonuna sayı eklenir.</small>
        </label>

        <label>
          <span>Kategori *</span>
          <select name="kategori" required defaultValue={mevcut?.kategori ?? ""}>
            <option value="" disabled>Kategori seç</option>
            {BLOG_KATEGORILERI.map((k) => (
              <option key={k} value={k}>{BLOG_KATEGORI_ETIKETLERI[k]}</option>
            ))}
          </select>
        </label>

        <label className={s.genis}>
          <span>Kısa açıklama (kartlarda görünür)</span>
          <textarea
            name="ozet"
            rows={2}
            maxLength={400}
            value={ozet}
            onChange={(e) => setOzet(e.target.value)}
            placeholder="Yazının bir-iki cümlelik özeti…"
          />
          <div className={`${s.sayacMetni} ${ozet.length > 400 ? s.tasti : ""}`}>
            {ozet.length}/400
          </div>
          {!ozet.trim() && !!icerik.trim() && (
            <small>Boş bırakılırsa içerikten üretilir: “{ozetUret(icerik, 110)}”</small>
          )}
        </label>

        <label className={s.genis}>
          <span>İçerik *</span>
          <textarea
            name="icerik"
            required
            rows={16}
            maxLength={60000}
            value={icerik}
            onChange={(e) => setIcerik(e.target.value)}
            placeholder={"## Ara başlık\n\nParagraf metni…\n\n- Madde bir\n- Madde iki\n\n> Öne çıkan alıntı"}
          />
          <div className={s.sayacMetni}>
            {icerik.length.toLocaleString("tr-TR")} karakter
            {okuma ? ` · ~${okuma} dk okuma` : ""}
          </div>
        </label>
      </div>

      <div className={s.yardim}>
        <b>Biçimlendirme:</b> <code>## Ara başlık</code> · <code>### Alt başlık</code> ·{" "}
        <code>- madde</code> · <code>1. sıralı madde</code> · <code>&gt; alıntı</code> ·{" "}
        <code>---</code> ayırıcı · <code>**kalın**</code> · <code>*eğik*</code> ·{" "}
        <code>[bağlantı metni](https://…)</code>. Boş satır yeni paragraf başlatır. Güvenlik
        gereği HTML etiketleri kabul edilmez, düz metin olarak gösterilir.
      </div>

      <div className={s.kapakAlan}>
        <div className={s.kapakOnizleme}>
          {kapakOnizleme ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={kapakOnizleme} alt="Seçilen kapak önizlemesi" />
          ) : mevcut?.kapakVar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={blogKapakUrl(mevcut.id)} alt="Mevcut kapak" />
          ) : (
            <span aria-hidden>🖼</span>
          )}
        </div>
        <label>
          <span>Kapak görseli</span>
          <input type="file" name="kapak" accept={BLOG_KAPAK_ACCEPT} onChange={kapakSecildi} />
          <small>
            JPG, PNG ya da WebP · en fazla {KAPAK_MB} MB · 16:9 en boy oranı önerilir.
            {duzenleme && mevcut?.kapakVar
              ? " Yeni dosya seçmezsen mevcut kapak korunur."
              : ""}
          </small>
        </label>
      </div>

      <div className={s.izgara}>
        <label className={s.orta}>
          <span>Etiketler</span>
          <input
            name="etiketler"
            value={etiketler}
            onChange={(e) => setEtiketler(e.target.value)}
            placeholder="ders çalışma, motivasyon, LGS"
          />
          <small>
            Virgülle ayır · en çok {BLOG_MAX_ETIKET} etiket
            {etiketListesi.length ? ` · şu an ${etiketListesi.length}` : ""}
          </small>
        </label>
        <label>
          <span>Yazar</span>
          <input
            name="yazarAd"
            maxLength={120}
            defaultValue={mevcut?.yazarAd ?? varsayilanYazar}
            placeholder="Kaynak Kampüs"
          />
          <small>Serbest metin; kullanıcı hesabına bağlanmaz.</small>
        </label>

        <label className={s.genis}>
          <span>SEO açıklaması (meta description)</span>
          <textarea
            name="seoAciklama"
            rows={2}
            maxLength={300}
            value={seoAciklama}
            onChange={(e) => setSeoAciklama(e.target.value)}
            placeholder="Arama sonuçlarında görünecek açıklama (150-160 karakter önerilir)…"
          />
          <div className={`${s.sayacMetni} ${seoAciklama.length > 160 ? s.tasti : ""}`}>
            {seoAciklama.length}/300 · önerilen üst sınır 160
          </div>
          <small>Boş bırakılırsa kısa açıklama kullanılır.</small>
        </label>

        <label>
          <span>Yayın durumu</span>
          <select name="durum" value={durum} onChange={(e) => setDurum(e.target.value)}>
            {BLOG_DURUMLARI.map((d) => (
              <option key={d} value={d}>{BLOG_DURUM_ETIKETLERI[d]}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Yayın tarihi</span>
          <input type="date" name="yayinTarihi" defaultValue={mevcut?.yayinTarihi ?? ""} />
          <small>
            {durum === "yayinda"
              ? "Boş bırakılırsa kaydettiğin an damgalanır."
              : "Taslakta tarih zorunlu değildir."}
          </small>
        </label>
      </div>

      {hata && <div className={s.hata}>{hata}</div>}

      <div className={s.formAlt}>
        <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
          {bekliyor ? "Kaydediliyor…" : duzenleme ? "Değişiklikleri Kaydet" : "Yazıyı Kaydet"}
        </button>
        <button
          type="button"
          className="btn btn-outline btn-kucuk"
          disabled={bekliyor}
          onClick={onKapat}
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
