"use client";

/* 🎬 Video Dersler — öğretmen/yönetici yönetim ekranı.
   Video ekleme, düzenleme, yayın durumu değiştirme, atama ve dosya yönetimi.

   Video DOSYASI iki adımda gider: önce kayıt server action ile oluşturulur,
   sonra dosya /api/video-ders/[id]/yukle rotasına XHR ile akıtılır (yükleme
   yüzdesi gösterilebilsin ve büyük dosya belleğe alınmasın diye). */

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { bugun, tarihStr } from "@/lib/hesap";
import { IZINLI_TURLER, MAX_DOSYA_BOYUT, MAX_VIDEO_BOYUT } from "@/lib/dosya-tanim";
import {
  EK_ACCEPT,
  KAPAK_ACCEPT,
  MAX_EK,
  VIDEO_ACCEPT,
  boyutMetni,
  ekUrl,
  kapakUrl,
  sureMetni,
  yuklemeUrl,
} from "@/lib/video-ders";
import {
  VIDEO_DURUMLARI,
  VIDEO_DURUM_ETIKETLERI,
  VIDEO_MAX_GOREV,
  type VideoDurum,
} from "@/lib/sabitler";
import {
  videoDersDurum,
  videoDersEkle,
  videoDersGuncelle,
  videoDersSil,
  videoEkSil,
} from "@/actions/video-ders";
import s from "./video-dersler.module.css";

export interface VideoSatir {
  id: string;
  baslik: string;
  ders: string;
  konu: string;
  aciklama: string;
  islenenKonular: string;
  ogretmenNotu: string;
  tarih: string;
  sure: number;
  kaynakTur: string;
  adres: string;
  dosyaAd: string;
  dosyaVar: boolean;
  dosyaBoyut: number;
  kapakVar: boolean;
  durum: string;
  ogretmenId: string;
  ogretmenAd: string;
  ekler: { id: string; ad: string; tur: string; boyut: number }[];
  gorevler: string[];
  ogrenciIdler: string[];
  sinifIdler: string[];
  izlemeOzeti: { izleyen: number; tamamlayan: number };
}

export interface Secenekler {
  ogrenciler: { id: string; ad: string; sinif: string }[];
  siniflar: { id: string; ad: string; ders: string; uyeSayisi: number }[];
  ogretmenler: { id: string; ad: string; brans: string }[];
}

const VIDEO_MB = Math.round(MAX_VIDEO_BOYUT / 1024 / 1024);
const EK_MB = Math.round(MAX_DOSYA_BOYUT / 1024 / 1024);
const VIDEO_MIME = Object.keys(IZINLI_TURLER.video);

export default function VideoYonetim({
  yonetici,
  kendiId,
  videolar,
  secenekler,
}: {
  yonetici: boolean;
  kendiId: string;
  videolar: VideoSatir[];
  secenekler: Secenekler;
}) {
  const router = useRouter();
  /* null = form kapalı, "yeni" = ekleme, aksi halde düzenlenen video kimliği */
  const [form, setForm] = useState<string | null>(null);
  const [bekliyor, baslat] = useTransition();

  const yayinda = videolar.filter((v) => v.durum === "yayinda").length;
  const taslak = videolar.filter((v) => v.durum === "taslak").length;
  const eksikKaynak = videolar.filter(
    (v) => (v.kaynakTur === "dosya" ? !v.dosyaVar : !v.adres)
  ).length;

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
          🎬 Video <span>Dersler</span>
        </h1>
        <p>
          {yonetici
            ? "Ders videolarını yükle, öğretmen ve öğrenci ataması yap, yayın durumunu yönet."
            : "Kaydettiğin ders videolarını yükle, öğrencilerine ata ve yayın durumunu yönet."}
        </p>
      </div>

      <div className="stat-grid">
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#F3ECEE" }}>🎬</div>
          <div><b>{videolar.length}</b><small>Toplam Video</small></div>
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
          <div className="stat-ikon" style={{ background: "#fef2f2" }}>⚠</div>
          <div><b>{eksikKaynak}</b><small>Kaynağı Eksik</small></div>
        </div>
      </div>

      <section className={s.ustEylem}>
        <div>
          <h2>Video kütüphanesi</h2>
          <p>
            Yayına alınan videolar, atandığı öğrencilerin “Video Derslerim” sekmesinde görünür.
            Gizli videolar listelenmez, yalnız bağlantıyla açılır.
          </p>
        </div>
        <button
          className="btn btn-primary btn-kucuk"
          onClick={() => setForm((x) => (x === "yeni" ? null : "yeni"))}
        >
          {form === "yeni" ? "Formu Kapat" : "＋ Yeni Video"}
        </button>
      </section>

      {form === "yeni" && (
        <VideoFormu
          key="yeni"
          yonetici={yonetici}
          kendiId={kendiId}
          secenekler={secenekler}
          onKapat={() => setForm(null)}
        />
      )}

      <div className={s.liste}>
        {videolar.length ? (
          videolar.map((video) =>
            form === video.id ? (
              <VideoFormu
                key={video.id}
                mevcut={video}
                yonetici={yonetici}
                kendiId={kendiId}
                secenekler={secenekler}
                onKapat={() => setForm(null)}
              />
            ) : (
              <Satir
                key={video.id}
                video={video}
                secenekler={secenekler}
                bekliyor={bekliyor}
                onDuzenle={() => setForm(video.id)}
                calistir={calistir}
              />
            )
          )
        ) : (
          <div className={s.bos}>
            <span>🎬</span>
            <b>Henüz video ders yok.</b>
            <p>“＋ Yeni Video” ile ilk ders videonu ekleyebilirsin.</p>
          </div>
        )}
      </div>
    </main>
  );
}

/* ── Liste satırı ─────────────────────────────────────────── */
function Satir({
  video,
  secenekler,
  bekliyor,
  onDuzenle,
  calistir,
}: {
  video: VideoSatir;
  secenekler: Secenekler;
  bekliyor: boolean;
  onDuzenle: () => void;
  calistir: (islem: () => Promise<{ hata?: string; tamam?: boolean }>) => void;
}) {
  const kaynakVar = video.kaynakTur === "dosya" ? video.dosyaVar : !!video.adres;
  const sinifAdlari = video.sinifIdler
    .map((id) => secenekler.siniflar.find((x) => x.id === id)?.ad)
    .filter(Boolean);

  return (
    <article className={s.kart}>
      <div className={s.kapak}>
        {video.kapakVar ? (
          /* Kapaklar public dizinde değil; API'den akar → next/image kullanılmaz */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={kapakUrl(video.id)} alt="" loading="lazy" />
        ) : (
          <span aria-hidden="true">🎬</span>
        )}
      </div>

      <div className={s.govde}>
        <div className={s.baslikSatir}>
          <h3>{video.baslik}</h3>
          <span className={`${s.durum} ${s[video.durum] ?? ""}`}>
            {VIDEO_DURUM_ETIKETLERI[video.durum as VideoDurum] ?? video.durum}
          </span>
        </div>
        <p className={s.dersSatir}>
          {video.ders}
          {video.konu ? ` · ${video.konu}` : ""} · {video.ogretmenAd}
        </p>
        <div className={s.meta}>
          <span className="tag">📅 {tarihStr(video.tarih)}</span>
          {video.sure > 0 && <span className="tag">⏱ {sureMetni(video.sure)}</span>}
          <span className="tag">
            {video.kaynakTur === "dosya"
              ? `🎞 Dosya${video.dosyaVar ? ` · ${boyutMetni(video.dosyaBoyut)}` : ""}`
              : "🔗 Bağlantı"}
          </span>
          {video.ekler.length > 0 && <span className="tag">📎 {video.ekler.length} doküman</span>}
          {video.gorevler.length > 0 && <span className="tag">📝 {video.gorevler.length} görev</span>}
        </div>
        <div className={s.meta}>
          <span className="tag">
            👥 {video.ogrenciIdler.length} öğrenci
            {sinifAdlari.length ? ` · 🏫 ${sinifAdlari.join(", ")}` : ""}
          </span>
          <span className="tag">
            👁 {video.izlemeOzeti.izleyen} izledi · ✅ {video.izlemeOzeti.tamamlayan} tamamladı
          </span>
        </div>
        {!kaynakVar && (
          <p className={s.uyari}>
            ⚠ Bu videonun kaynağı eksik: yayına almadan önce dosya yükleyin ya da bağlantı girin.
          </p>
        )}
      </div>

      <div className={s.eylem}>
        <label className={s.durumSecim}>
          <span>Yayın durumu</span>
          <select
            value={video.durum}
            disabled={bekliyor}
            onChange={(e) => calistir(() => videoDersDurum(video.id, e.target.value))}
          >
            {VIDEO_DURUMLARI.map((d) => (
              <option key={d} value={d}>{VIDEO_DURUM_ETIKETLERI[d]}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn-outline btn-kucuk" onClick={onDuzenle}>
          Düzenle
        </button>
        <button
          type="button"
          className={`${s.metinButon} ${s.tehlike}`}
          disabled={bekliyor}
          onClick={() => {
            if (confirm(`“${video.baslik}” videosu ve tüm dosyaları silinsin mi?`)) {
              calistir(() => videoDersSil(video.id));
            }
          }}
        >
          Sil
        </button>
      </div>
    </article>
  );
}

/* ── Ekleme / düzenleme formu ─────────────────────────────── */
function VideoFormu({
  mevcut,
  yonetici,
  kendiId,
  secenekler,
  onKapat,
}: {
  mevcut?: VideoSatir;
  yonetici: boolean;
  kendiId: string;
  secenekler: Secenekler;
  onKapat: () => void;
}) {
  const router = useRouter();
  const duzenleme = !!mevcut;

  const [kaynakTur, setKaynakTur] = useState(mevcut?.kaynakTur ?? "baglanti");
  const [videoDosyasi, setVideoDosyasi] = useState<File | null>(null);
  const [sure, setSure] = useState(String(mevcut?.sure ?? ""));
  const [ogrenciIdler, setOgrenciIdler] = useState<string[]>(mevcut?.ogrenciIdler ?? []);
  const [sinifIdler, setSinifIdler] = useState<string[]>(mevcut?.sinifIdler ?? []);
  const [ogrenciArama, setOgrenciArama] = useState("");
  const [hata, setHata] = useState("");
  const [yuzde, setYuzde] = useState<number | null>(null);
  const [bekliyor, setBekliyor] = useState(false);
  const [ekBekliyor, baslatEk] = useTransition();

  const suzulmusOgrenciler = useMemo(() => {
    const q = ogrenciArama.trim().toLocaleLowerCase("tr-TR");
    if (!q) return secenekler.ogrenciler;
    return secenekler.ogrenciler.filter((o) => o.ad.toLocaleLowerCase("tr-TR").includes(q));
  }, [secenekler.ogrenciler, ogrenciArama]);

  function videoSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0] ?? null;
    setHata("");
    if (!dosya) {
      setVideoDosyasi(null);
      return;
    }
    if (!VIDEO_MIME.includes((dosya.type || "").toLowerCase())) {
      setHata(`"${dosya.name}" desteklenmiyor; MP4 veya WebM olmalı.`);
      e.target.value = "";
      return;
    }
    if (dosya.size > MAX_VIDEO_BOYUT) {
      setHata(`"${dosya.name}" çok büyük (en fazla ${VIDEO_MB} MB).`);
      e.target.value = "";
      return;
    }
    setVideoDosyasi(dosya);
    // Süre alanı boşsa dosyanın gerçek süresinden (dk) doldurulur
    if (!sure) sureyiOku(dosya).then((dk) => dk && setSure(String(dk)));
  }

  function hedefDegistir(liste: string[], id: string): string[] {
    return liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id];
  }

  async function gonder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHata("");
    const form = e.currentTarget;
    const fd = new FormData(form);

    if (!ogrenciIdler.length && !sinifIdler.length) {
      setHata("En az bir öğrenci ya da sınıf seçin.");
      return;
    }
    if (kaynakTur === "dosya" && !videoDosyasi && !mevcut?.dosyaVar) {
      setHata("Video dosyası seçin ya da kaynak türünü bağlantı yapın.");
      return;
    }
    // Çoklu alanlar: seçim durumu React'te tutulduğu için elle eklenir
    fd.delete("kapakOnizleme");
    for (const id of ogrenciIdler) fd.append("ogrenciId", id);
    for (const id of sinifIdler) fd.append("sinifId", id);
    for (const g of satirlaraBol(String(fd.get("gorevlerMetni") ?? ""))) fd.append("gorev", g);
    fd.delete("gorevlerMetni");
    fd.set("sure", sure || "0");
    if (duzenleme) fd.set("id", mevcut.id);

    setBekliyor(true);
    try {
      const sonuc = duzenleme ? await videoDersGuncelle(fd) : await videoDersEkle(fd);
      if (sonuc.hata || !sonuc.id) {
        setHata(sonuc.hata ?? "Video kaydedilemedi.");
        return;
      }
      // Kayıt hazır; büyük video dosyası ayrı rotaya akıtılır
      if (kaynakTur === "dosya" && videoDosyasi) {
        setYuzde(0);
        const yuklemeHatasi = await dosyayiYukle(sonuc.id, videoDosyasi, setYuzde);
        setYuzde(null);
        if (yuklemeHatasi) {
          setHata(
            duzenleme
              ? `Bilgiler kaydedildi ama video yüklenemedi: ${yuklemeHatasi}`
              : `Video kaydı oluşturuldu ama dosya yüklenemedi: ${yuklemeHatasi} Kaydı düzenleyip dosyayı yeniden yükleyebilirsiniz.`
          );
          router.refresh();
          return;
        }
      }
      onKapat();
      router.refresh();
    } finally {
      setBekliyor(false);
    }
  }

  const kilitli = bekliyor || yuzde !== null;

  return (
    <form className={s.form} onSubmit={gonder}>
      <div className={s.formBas}>
        <h2>{duzenleme ? "Videoyu düzenle" : "Yeni video ders"}</h2>
        <button type="button" className={s.metinButon} disabled={kilitli} onClick={onKapat}>
          Vazgeç
        </button>
      </div>

      <div className={s.izgara}>
        <label className={s.genis}>
          <span>Video başlığı *</span>
          <input
            name="baslik"
            required
            maxLength={200}
            defaultValue={mevcut?.baslik ?? ""}
            placeholder="Örn. Kesirlerde Toplama İşlemi"
          />
        </label>
        <label>
          <span>Ders *</span>
          <input name="ders" required defaultValue={mevcut?.ders ?? ""} placeholder="Matematik" />
        </label>
        <label>
          <span>Konu</span>
          <input name="konu" defaultValue={mevcut?.konu ?? ""} placeholder="Kesirler" />
        </label>
        {yonetici ? (
          <label>
            <span>Öğretmen *</span>
            <select name="ogretmenId" required defaultValue={mevcut?.ogretmenId ?? ""}>
              <option value="" disabled>Öğretmen seç</option>
              {secenekler.ogretmenler.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.ad}{o.brans ? ` · ${o.brans}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <input type="hidden" name="ogretmenId" value={kendiId} />
        )}
        <label>
          <span>Video tarihi *</span>
          <input name="tarih" type="date" required defaultValue={mevcut?.tarih ?? bugun()} />
        </label>
        <label>
          <span>Süre (dakika)</span>
          <input
            type="number"
            min={0}
            max={600}
            value={sure}
            placeholder="42"
            onChange={(e) => setSure(e.target.value)}
          />
        </label>
        <label>
          <span>Yayın durumu</span>
          <select name="durum" defaultValue={mevcut?.durum ?? "taslak"}>
            {VIDEO_DURUMLARI.map((d) => (
              <option key={d} value={d}>{VIDEO_DURUM_ETIKETLERI[d]}</option>
            ))}
          </select>
        </label>
      </div>

      {/* ── Kaynak ── */}
      <fieldset className={s.kaynak}>
        <legend>Video kaynağı</legend>
        <div className={s.secimSatir}>
          <label className={s.radyo}>
            <input
              type="radio"
              name="kaynakTur"
              value="baglanti"
              checked={kaynakTur === "baglanti"}
              onChange={() => setKaynakTur("baglanti")}
            />
            <span>🔗 Video bağlantısı</span>
          </label>
          <label className={s.radyo}>
            <input
              type="radio"
              name="kaynakTur"
              value="dosya"
              checked={kaynakTur === "dosya"}
              onChange={() => setKaynakTur("dosya")}
            />
            <span>🎞 Video dosyası yükle</span>
          </label>
        </div>

        {kaynakTur === "baglanti" ? (
          <label>
            <span>Bağlantı adresi *</span>
            <input
              name="adres"
              type="url"
              defaultValue={mevcut?.adres ?? ""}
              placeholder="https://www.youtube.com/watch?v=…"
            />
            <small>YouTube ve Vimeo bağlantıları panelde gömülü oynatılır.</small>
          </label>
        ) : (
          <label>
            <span>Video dosyası {mevcut?.dosyaVar ? "(yenisini seçmezsen mevcut dosya korunur)" : "*"}</span>
            <input type="file" accept={VIDEO_ACCEPT} disabled={kilitli} onChange={videoSecildi} />
            <small>
              MP4 veya WebM, en fazla {VIDEO_MB} MB.
              {mevcut?.dosyaVar
                ? ` Mevcut dosya: ${mevcut.dosyaAd || "video"} (${boyutMetni(mevcut.dosyaBoyut)}).`
                : ""}
            </small>
            {videoDosyasi && (
              <small className={s.secilen}>
                Seçilen: {videoDosyasi.name} · {boyutMetni(videoDosyasi.size)}
              </small>
            )}
          </label>
        )}
      </fieldset>

      <div className={s.izgara}>
        <label className={s.genis}>
          <span>Video açıklaması</span>
          <textarea
            name="aciklama"
            rows={3}
            defaultValue={mevcut?.aciklama ?? ""}
            placeholder="Öğrencinin listede göreceği kısa açıklama"
          />
        </label>
        <label className={s.genis}>
          <span>Derste işlenen konular</span>
          <textarea
            name="islenenKonular"
            rows={3}
            defaultValue={mevcut?.islenenKonular ?? ""}
            placeholder={"Her satıra bir konu:\nKesir kavramı\nDenk kesirler"}
          />
        </label>
        <label className={s.genis}>
          <span>Öğretmen notları</span>
          <textarea
            name="ogretmenNotu"
            rows={3}
            defaultValue={mevcut?.ogretmenNotu ?? ""}
            placeholder="Öğrencinin dikkat etmesi gerekenler"
          />
        </label>
        <label className={s.genis}>
          <span>Videoyla bağlantılı görevler</span>
          <textarea
            name="gorevlerMetni"
            rows={3}
            defaultValue={(mevcut?.gorevler ?? []).join("\n")}
            placeholder={`Her satıra bir görev (en çok ${VIDEO_MAX_GOREV}):\nKitaptan 12–20. soruları çöz`}
          />
        </label>
      </div>

      {/* ── Dosyalar ── */}
      <div className={s.izgara}>
        <label>
          <span>Kapak görseli</span>
          <input type="file" name="kapak" accept={KAPAK_ACCEPT} disabled={kilitli} />
          <small>
            En fazla {EK_MB} MB.{mevcut?.kapakVar ? " Yenisini seçersen eski kapak silinir." : ""}
          </small>
        </label>
        <label>
          <span>Ek dosyalar</span>
          <input type="file" name="ek" accept={EK_ACCEPT} multiple disabled={kilitli} />
          <small>PDF/Word/görsel, dosya başına {EK_MB} MB, video başına {MAX_EK} dosya.</small>
        </label>
      </div>

      {duzenleme && mevcut.ekler.length > 0 && (
        <div className={s.ekliDosyalar}>
          <b>Yüklenmiş dosyalar</b>
          <div className={s.ekListe}>
            {mevcut.ekler.map((ek) => (
              <span key={ek.id} className={s.ekEtiket}>
                <a href={ekUrl(ek.id)} target="_blank" rel="noopener noreferrer">
                  📄 {ek.ad}
                </a>
                <button
                  type="button"
                  title="Dosyayı sil"
                  disabled={ekBekliyor || kilitli}
                  onClick={() => {
                    if (!confirm(`“${ek.ad}” silinsin mi?`)) return;
                    baslatEk(async () => {
                      const sonuc = await videoEkSil(ek.id);
                      if (sonuc.hata) alert(sonuc.hata);
                      else router.refresh();
                    });
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Atama ── */}
      <fieldset className={s.kaynak}>
        <legend>Öğrenci / grup seçimi *</legend>
        <div className={s.atamaIzgara}>
          <div>
            <div className={s.atamaBas}>
              <b>Öğrenciler</b>
              <span>{ogrenciIdler.length} seçili</span>
            </div>
            <input
              className={s.aramaKutu}
              type="search"
              value={ogrenciArama}
              placeholder="Öğrenci ara…"
              onChange={(e) => setOgrenciArama(e.target.value)}
            />
            <div className={s.secimListe}>
              {suzulmusOgrenciler.length ? (
                suzulmusOgrenciler.map((o) => (
                  <label key={o.id} className={s.onay}>
                    <input
                      type="checkbox"
                      checked={ogrenciIdler.includes(o.id)}
                      onChange={() => setOgrenciIdler((x) => hedefDegistir(x, o.id))}
                    />
                    <span>{o.ad}{o.sinif ? ` · ${o.sinif}` : ""}</span>
                  </label>
                ))
              ) : (
                <p className={s.miniBos}>Eşleşen öğrenci yok.</p>
              )}
            </div>
          </div>
          <div>
            <div className={s.atamaBas}>
              <b>Online sınıflar</b>
              <span>{sinifIdler.length} seçili</span>
            </div>
            <div className={s.secimListe}>
              {secenekler.siniflar.length ? (
                secenekler.siniflar.map((x) => (
                  <label key={x.id} className={s.onay}>
                    <input
                      type="checkbox"
                      checked={sinifIdler.includes(x.id)}
                      onChange={() => setSinifIdler((v) => hedefDegistir(v, x.id))}
                    />
                    <span>{x.ad} · {x.ders} ({x.uyeSayisi} öğrenci)</span>
                  </label>
                ))
              ) : (
                <p className={s.miniBos}>Henüz online sınıf yok.</p>
              )}
            </div>
            <p className={s.ipucu}>
              Sınıf seçilirse video, o sınıfa sonradan katılan öğrencilere de görünür.
            </p>
          </div>
        </div>
      </fieldset>

      {yuzde !== null && (
        <div className={s.yuklemeSatir}>
          <div className={s.yuklemeCubuk}>
            <i style={{ width: `${yuzde}%` }} />
          </div>
          <span>Video yükleniyor… %{yuzde}</span>
        </div>
      )}
      {hata && <p className={s.hata}>{hata}</p>}

      <div className={s.formAlt}>
        <button className="btn btn-primary btn-kucuk" disabled={kilitli}>
          {kilitli ? "Kaydediliyor…" : duzenleme ? "Değişiklikleri Kaydet" : "Videoyu Kaydet"}
        </button>
        <button type="button" className="btn btn-outline btn-kucuk" disabled={kilitli} onClick={onKapat}>
          Kapat
        </button>
      </div>
    </form>
  );
}

/* ── Yardımcılar ─────────────────────────────────────────── */

/** Video dosyasını akış rotasına XHR ile gönderir (yükleme yüzdesi için).
    Hata mesajı döner; null → başarılı. */
function dosyayiYukle(
  videoId: string,
  dosya: File,
  ilerleme: (yuzde: number) => void
): Promise<string | null> {
  return new Promise((coz) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", yuklemeUrl(videoId));
    xhr.setRequestHeader("Content-Type", dosya.type);
    // Türkçe karakterli dosya adı başlıkta güvenle taşınsın
    xhr.setRequestHeader("x-dosya-adi", encodeURIComponent(dosya.name));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) ilerleme(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        coz(null);
        return;
      }
      try {
        coz(String(JSON.parse(xhr.responseText)?.hata ?? "Video yüklenemedi."));
      } catch {
        coz("Video yüklenemedi.");
      }
    };
    xhr.onerror = () => coz("Bağlantı hatası nedeniyle video yüklenemedi.");
    xhr.onabort = () => coz("Yükleme iptal edildi.");
    xhr.send(dosya);
  });
}

/** Seçilen video dosyasının süresini dakikaya çevirir (metadata okunamazsa 0) */
function sureyiOku(dosya: File): Promise<number> {
  return new Promise((coz) => {
    const adres = URL.createObjectURL(dosya);
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      const dk = Number.isFinite(el.duration) ? Math.max(1, Math.round(el.duration / 60)) : 0;
      URL.revokeObjectURL(adres);
      coz(dk);
    };
    el.onerror = () => {
      URL.revokeObjectURL(adres);
      coz(0);
    };
    el.src = adres;
  });
}

/** Çok satırlı metni temizlenmiş satır dizisine böler */
function satirlaraBol(metin: string): string[] {
  return metin
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, VIDEO_MAX_GOREV);
}
