"use client";

/* 🎬 Video Derslerim — kart listesi + filtreleme.
   Filtreler istemcide çalışır: öğrenciye atanmış video sayısı sayfalama
   gerektirecek boyutta değil, her filtre değişiminde sunucuya gitmek
   gereksiz gecikme olur. */

import Link from "next/link";
import { useMemo, useState } from "react";
import { tarihStr } from "@/lib/hesap";
import { kapakUrl, sureMetni } from "@/lib/video-ders";
import { VIDEO_IZLEME_ETIKETLERI, type VideoIzlemeDurum } from "@/lib/sabitler";
import BosDurum from "@/components/maskot/BosDurum";
import s from "./videolar.module.css";

export interface VideoKart {
  id: string;
  baslik: string;
  ders: string;
  konu: string;
  aciklama: string;
  ogretmenAd: string;
  tarih: string; // "YYYY-MM-DD"
  sure: number; // dakika
  kapakVar: boolean;
  ekSayisi: number;
  gorevSayisi: number;
  izlemeDurum: VideoIzlemeDurum;
  yuzde: number;
}

const TUMU = "";

export default function VideoListesi({ videolar }: { videolar: VideoKart[] }) {
  const [arama, setArama] = useState("");
  const [ders, setDers] = useState(TUMU);
  const [konu, setKonu] = useState(TUMU);
  const [ogretmen, setOgretmen] = useState(TUMU);
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [durum, setDurum] = useState<VideoIzlemeDurum | "">(TUMU);

  /* Filtre seçenekleri veriden türer; ders seçiliyse konu listesi o derse iner */
  const dersler = useMemo(() => tekilSirali(videolar.map((v) => v.ders)), [videolar]);
  const ogretmenler = useMemo(() => tekilSirali(videolar.map((v) => v.ogretmenAd)), [videolar]);
  const konular = useMemo(
    () =>
      tekilSirali(
        videolar.filter((v) => (ders ? v.ders === ders : true)).map((v) => v.konu).filter(Boolean)
      ),
    [videolar, ders]
  );

  const suzulmus = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr-TR");
    return videolar.filter((v) => {
      if (q && !v.baslik.toLocaleLowerCase("tr-TR").includes(q)) return false;
      if (ders && v.ders !== ders) return false;
      if (konu && v.konu !== konu) return false;
      if (ogretmen && v.ogretmenAd !== ogretmen) return false;
      if (baslangic && v.tarih < baslangic) return false;
      if (bitis && v.tarih > bitis) return false;
      if (durum && v.izlemeDurum !== durum) return false;
      return true;
    });
  }, [videolar, arama, ders, konu, ogretmen, baslangic, bitis, durum]);

  const izlenmeyen = videolar.filter((v) => v.izlemeDurum === "izlenmedi").length;
  const tamamlanan = videolar.filter((v) => v.izlemeDurum === "tamamlandi").length;
  const toplamDk = videolar.reduce((t, v) => t + (v.sure || 0), 0);
  const filtreVar = !!(arama || ders || konu || ogretmen || baslangic || bitis || durum);

  function filtreleriSifirla() {
    setArama("");
    setDers(TUMU);
    setKonu(TUMU);
    setOgretmen(TUMU);
    setBaslangic("");
    setBitis("");
    setDurum(TUMU);
  }

  return (
    <main className="container">
      <div className="panel-bas">
        <h1>
          🎬 Video <span>Derslerim</span>
        </h1>
        <p>Kaydedilmiş derslerini dilediğin zaman yeniden izle, notlarını ve dosyalarını incele.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#F3ECEE" }}>🎬</div>
          <div><b>{videolar.length}</b><small>Toplam Video</small></div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#FBF1F3" }}>🆕</div>
          <div><b>{izlenmeyen}</b><small>İzlenmemiş</small></div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#f0fdf4" }}>✅</div>
          <div><b>{tamamlanan}</b><small>Tamamlanan</small></div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#eff6ff" }}>⏱</div>
          <div><b>{sureMetni(toplamDk) || "—"}</b><small>Toplam Süre</small></div>
        </div>
      </div>

      {videolar.length > 0 && (
        <section className={s.filtreler}>
          <label className={s.arama}>
            <span>🔍</span>
            <input
              type="search"
              value={arama}
              placeholder="Video başlığında ara…"
              onChange={(e) => setArama(e.target.value)}
            />
          </label>
          <div className={s.filtreIzgara}>
            <label>
              <span>Ders</span>
              <select
                value={ders}
                onChange={(e) => {
                  setDers(e.target.value);
                  setKonu(TUMU); // ders değişince konu listesi geçersiz kalır
                }}
              >
                <option value={TUMU}>Tümü</option>
                {dersler.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <label>
              <span>Konu</span>
              <select value={konu} onChange={(e) => setKonu(e.target.value)} disabled={!konular.length}>
                <option value={TUMU}>Tümü</option>
                {konular.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <label>
              <span>Öğretmen</span>
              <select value={ogretmen} onChange={(e) => setOgretmen(e.target.value)}>
                <option value={TUMU}>Tümü</option>
                {ogretmenler.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <label>
              <span>İzlenme durumu</span>
              <select
                value={durum}
                onChange={(e) => setDurum(e.target.value as VideoIzlemeDurum | "")}
              >
                <option value={TUMU}>Tümü</option>
                <option value="izlenmedi">{VIDEO_IZLEME_ETIKETLERI.izlenmedi}</option>
                <option value="izleniyor">{VIDEO_IZLEME_ETIKETLERI.izleniyor}</option>
                <option value="tamamlandi">{VIDEO_IZLEME_ETIKETLERI.tamamlandi}</option>
              </select>
            </label>
            <label>
              <span>Başlangıç tarihi</span>
              <input type="date" value={baslangic} max={bitis || undefined} onChange={(e) => setBaslangic(e.target.value)} />
            </label>
            <label>
              <span>Bitiş tarihi</span>
              <input type="date" value={bitis} min={baslangic || undefined} onChange={(e) => setBitis(e.target.value)} />
            </label>
          </div>
          {filtreVar && (
            <div className={s.filtreAlt}>
              <span className="tag">{suzulmus.length} video eşleşti</span>
              <button type="button" className={s.metinButon} onClick={filtreleriSifirla}>
                Filtreleri temizle
              </button>
            </div>
          )}
        </section>
      )}

      {videolar.length === 0 ? (
        <BosDurum
          ifade="sakin"
          baslik="Henüz video dersin yok."
          metin="Öğretmenin bir ders videosu yayınladığında burada görünecek."
        />
      ) : suzulmus.length === 0 ? (
        <BosDurum
          ifade="sakin"
          baslik="Bu filtrelerle video bulunamadı."
          metin="Aramayı değiştir ya da filtreleri temizle."
          maskot={false}
        />
      ) : (
        <div className={s.izgara}>
          {suzulmus.map((v) => <Kart key={v.id} video={v} />)}
        </div>
      )}
    </main>
  );
}

function Kart({ video }: { video: VideoKart }) {
  const rozet = video.izlemeDurum;
  return (
    <Link href={`/ogrenci/videolar/${video.id}`} className={s.kart}>
      <div className={s.kapak}>
        {video.kapakVar ? (
          /* Kapaklar public dizinde değil; API'den akar → next/image kullanılmaz */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={kapakUrl(video.id)} alt="" loading="lazy" />
        ) : (
          <span className={s.kapakYok} aria-hidden="true">🎬</span>
        )}
        {video.sure > 0 && <span className={s.sure}>{sureMetni(video.sure)}</span>}
        <span className={`${s.rozet} ${s[rozet]}`}>{VIDEO_IZLEME_ETIKETLERI[rozet]}</span>
        {rozet === "izleniyor" && video.yuzde > 0 && (
          <span className={s.ilerleme} aria-hidden="true">
            <i style={{ width: `${Math.min(100, video.yuzde)}%` }} />
          </span>
        )}
      </div>
      <div className={s.govde}>
        <h2>{video.baslik}</h2>
        <p className={s.dersSatir}>
          {video.ders}
          {video.konu ? ` · ${video.konu}` : ""}
        </p>
        {video.aciklama && <p className={s.aciklama}>{video.aciklama}</p>}
        <div className={s.meta}>
          <span className="tag">👩‍🏫 {video.ogretmenAd}</span>
          <span className="tag">📅 {tarihStr(video.tarih)}</span>
          {video.ekSayisi > 0 && <span className="tag">📎 {video.ekSayisi} doküman</span>}
          {video.gorevSayisi > 0 && <span className="tag">📝 {video.gorevSayisi} görev</span>}
        </div>
      </div>
    </Link>
  );
}

/** Tekilleştirip Türkçe sıralar (filtre açılır listeleri) */
function tekilSirali(degerler: string[]): string[] {
  return [...new Set(degerler.filter(Boolean))].sort((a, b) => a.localeCompare(b, "tr"));
}
