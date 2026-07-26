"use client";

/* 🎬 Video ders detayı — oynatıcı, ders bilgileri, dosyalar, görevler ve
   öğrencinin kişisel not kutusu.

   İlerleme takibi: yalnız sunucudan akan <video> için konum okunabilir
   (gömülü YouTube/Vimeo'da iframe içine erişilemez). O yüzden ilerleme
   periyodik olarak (İLERLEME_ARALIK) kaydedilir ve her kaynak türünde
   elle "tamamlandı" işaretleme düğmesi bulunur. */

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { tarihStr } from "@/lib/hesap";
import {
  TAMAMLANMA_ESIGI,
  boyutMetni,
  ekUrl,
  ilerlemeIzlenebilir,
  konumMetni,
  oynatilabilir,
  satirlar,
  sureMetni,
  type VideoKaynagi,
} from "@/lib/video-ders";
import { VIDEO_IZLEME_ETIKETLERI, type VideoIzlemeDurum } from "@/lib/sabitler";
import { videoIlerlemeKaydet, videoNotKaydet, videoTamamlandi } from "@/actions/video-ders";
import s from "./detay.module.css";

interface Video {
  id: string;
  baslik: string;
  ders: string;
  konu: string;
  aciklama: string;
  islenenKonular: string;
  ogretmenNotu: string;
  tarih: string;
  sure: number;
  ogretmenAd: string;
  ogretmenBrans: string;
  ekler: { id: string; ad: string; tur: string; boyut: number }[];
  gorevler: { id: string; metin: string }[];
}

interface Izleme {
  durum: VideoIzlemeDurum;
  yuzde: number;
  saniye: number;
  notlar: string;
}

/** İlerleme kaydı sıklığı (sn) — her timeupdate'te sunucuya gidilmez */
const ILERLEME_ARALIK = 15;

export default function VideoDetay({
  video,
  kaynak,
  izleme,
}: {
  video: Video;
  kaynak: VideoKaynagi;
  izleme: Izleme;
}) {
  const [durum, setDurum] = useState<VideoIzlemeDurum>(izleme.durum);
  const konular = satirlar(video.islenenKonular);

  return (
    <main className="container">
      <div className={s.ustSatir}>
        <Link href="/ogrenci/videolar" className={s.geri}>
          ← Video Derslerim
        </Link>
        <span className={`${s.durumRozet} ${s[durum]}`}>{VIDEO_IZLEME_ETIKETLERI[durum]}</span>
      </div>

      <div className={s.duzen}>
        <div>
          <Oynatici
            videoId={video.id}
            kaynak={kaynak}
            baslangicSaniye={durum === "tamamlandi" ? 0 : izleme.saniye}
            onIlerleme={(yeni) => setDurum((eski) => (eski === "tamamlandi" ? eski : yeni))}
          />

          <section className={s.bilgi}>
            <h1>{video.baslik}</h1>
            <p className={s.dersSatir}>
              {video.ders}
              {video.konu ? ` · ${video.konu}` : ""}
            </p>
            <div className={s.meta}>
              <span className="tag">
                👩‍🏫 {video.ogretmenAd}
                {video.ogretmenBrans ? ` · ${video.ogretmenBrans}` : ""}
              </span>
              <span className="tag">📅 {tarihStr(video.tarih)}</span>
              {video.sure > 0 && <span className="tag">⏱ {sureMetni(video.sure)}</span>}
            </div>
            {video.aciklama && <p className={s.aciklama}>{video.aciklama}</p>}

            <TamamlaDugmesi
              videoId={video.id}
              durum={durum}
              onDegisti={setDurum}
              elleGerekli={!ilerlemeIzlenebilir(kaynak)}
            />
          </section>

          <KisiselNot videoId={video.id} baslangic={izleme.notlar} />
        </div>

        <aside className={s.yan}>
          {konular.length > 0 && (
            <section className={s.kutu}>
              <h2>📚 Derste işlenen konular</h2>
              <ul className={s.konuListe}>
                {konular.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </section>
          )}

          {video.ogretmenNotu && (
            <section className={s.kutu}>
              <h2>✍️ Öğretmenin notları</h2>
              <p className={s.notMetni}>{video.ogretmenNotu}</p>
            </section>
          )}

          {video.ekler.length > 0 && (
            <section className={s.kutu}>
              <h2>📎 Ders dosyaları</h2>
              <div className={s.ekListe}>
                {video.ekler.map((ek) => (
                  <a
                    key={ek.id}
                    className={s.ek}
                    href={ekUrl(ek.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span aria-hidden="true">{ek.tur.startsWith("image/") ? "🖼" : "📄"}</span>
                    <div>
                      <b>{ek.ad}</b>
                      <small>{boyutMetni(ek.boyut)}</small>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {video.gorevler.length > 0 && (
            <section className={s.kutu}>
              <h2>📝 Videoyla bağlantılı görevler</h2>
              <ol className={s.gorevListe}>
                {video.gorevler.map((g) => (
                  <li key={g.id}>{g.metin}</li>
                ))}
              </ol>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}

/* ── Oynatıcı ─────────────────────────────────────────────────
   Dosya kaynağı <video> ile oynar ve ilerleme kaydedilir; YouTube/Vimeo
   iframe ile gömülür; tanınmayan adres yeni sekmede açılır. */
function Oynatici({
  videoId,
  kaynak,
  baslangicSaniye,
  onIlerleme,
}: {
  videoId: string;
  kaynak: VideoKaynagi;
  baslangicSaniye: number;
  onIlerleme: (durum: VideoIzlemeDurum) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sonKayitRef = useRef(0);
  const [devamUyarisi, setDevamUyarisi] = useState(baslangicSaniye > 10);

  /* Bırakılan yerden devam: metadata yüklendikten sonra konum ayarlanır */
  useEffect(() => {
    const el = videoRef.current;
    if (!el || baslangicSaniye <= 10) return;
    function konumla() {
      if (el && Number.isFinite(el.duration) && baslangicSaniye < el.duration - 5) {
        el.currentTime = baslangicSaniye;
      }
    }
    if (el.readyState >= 1) konumla();
    else el.addEventListener("loadedmetadata", konumla, { once: true });
  }, [baslangicSaniye]);

  function kaydet(zorla = false) {
    const el = videoRef.current;
    if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return;
    const saniye = Math.floor(el.currentTime);
    if (!zorla && saniye - sonKayitRef.current < ILERLEME_ARALIK) return;
    sonKayitRef.current = saniye;
    const yuzde = Math.min(100, Math.round((el.currentTime / el.duration) * 100));
    // Eşik sunucuda da uygulanır; buradaki hesap yalnız rozeti anında günceller
    onIlerleme(yuzde >= TAMAMLANMA_ESIGI ? "tamamlandi" : "izleniyor");
    // Ateşle-ve-unut: ilerleme kaydı başarısız olsa da izleme kesilmemeli
    void videoIlerlemeKaydet({ videoId, saniye, yuzde });
  }

  if (kaynak.tur === "yok") {
    return (
      <div className={s.oynatilamaz}>
        <span aria-hidden="true">🎬</span>
        <b>Video kaynağı henüz hazır değil.</b>
        <p>Öğretmenin videoyu yüklemesi tamamlandığında burada oynatılabilecek.</p>
      </div>
    );
  }

  if (kaynak.tur === "harici") {
    return (
      <div className={s.oynatilamaz}>
        <span aria-hidden="true">🔗</span>
        <b>Bu video başka bir sitede yayınlanıyor.</b>
        <p>Panelde gömülemediği için yeni sekmede açılır.</p>
        <a className="btn btn-primary btn-kucuk" href={kaynak.adres} target="_blank" rel="noopener noreferrer">
          Videoyu aç
        </a>
      </div>
    );
  }

  if (!oynatilabilir(kaynak)) return null;

  if (kaynak.tur !== "dosya") {
    return (
      <div className={s.cerceve}>
        <iframe
          src={kaynak.adres}
          title="Ders videosu"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <>
      <div className={s.cerceve}>
        <video
          ref={videoRef}
          controls
          controlsList="nodownload"
          preload="metadata"
          playsInline
          src={kaynak.adres}
          onTimeUpdate={() => kaydet()}
          onPause={() => kaydet(true)}
          onEnded={() => kaydet(true)}
        />
      </div>
      {devamUyarisi && (
        <p className={s.devam}>
          ⏱ Bu videoyu {konumMetni(baslangicSaniye)} konumunda bırakmıştın; oradan devam ediyor.
          <button type="button" onClick={() => setDevamUyarisi(false)}>Tamam</button>
        </p>
      )}
    </>
  );
}

/* ── Elle tamamlama ─────────────────────────────────────────── */
function TamamlaDugmesi({
  videoId,
  durum,
  onDegisti,
  elleGerekli,
}: {
  videoId: string;
  durum: VideoIzlemeDurum;
  onDegisti: (d: VideoIzlemeDurum) => void;
  elleGerekli: boolean;
}) {
  const [bekliyor, baslat] = useTransition();
  const tamam = durum === "tamamlandi";

  function degistir() {
    baslat(async () => {
      const sonuc = await videoTamamlandi(videoId, !tamam);
      if (sonuc.hata) alert(sonuc.hata);
      else onDegisti(tamam ? "izlenmedi" : "tamamlandi");
    });
  }

  return (
    <div className={s.tamamlaSatir}>
      <button
        type="button"
        className={`btn ${tamam ? "btn-outline" : "btn-primary"} btn-kucuk`}
        disabled={bekliyor}
        onClick={degistir}
      >
        {bekliyor ? "Kaydediliyor…" : tamam ? "↺ Tamamlandı işaretini kaldır" : "✓ İzledim, tamamlandı"}
      </button>
      {elleGerekli && !tamam && (
        <small>Bu video gömülü oynatıldığı için ilerleme otomatik takip edilemiyor.</small>
      )}
    </div>
  );
}

/* ── Kişisel not ─────────────────────────────────────────────
   Yalnız öğrencinin kendisi görür; öğretmene/yöneticiye gösterilmez. */
function KisiselNot({ videoId, baslangic }: { videoId: string; baslangic: string }) {
  const [metin, setMetin] = useState(baslangic);
  const [kayitli, setKayitli] = useState(baslangic);
  const [bilgi, setBilgi] = useState("");
  const [bekliyor, baslat] = useTransition();
  const degisti = metin !== kayitli;

  function kaydet() {
    baslat(async () => {
      const sonuc = await videoNotKaydet({ videoId, notlar: metin });
      if (sonuc.hata) {
        setBilgi(sonuc.hata);
        return;
      }
      setKayitli(metin);
      setBilgi("Notun kaydedildi.");
    });
  }

  return (
    <section className={s.notKutu}>
      <div className={s.notBas}>
        <h2>🗒 Kendi notlarım</h2>
        <small>Bu notları yalnızca sen görürsün.</small>
      </div>
      <textarea
        rows={5}
        value={metin}
        placeholder={"Örn. “Bu konuyu tekrar etmeliyim.”\n“Üçüncü soruyu anlamadım.”\n“Öğretmene sormam gereken bir yer var.”"}
        onChange={(e) => {
          setMetin(e.target.value);
          setBilgi("");
        }}
      />
      <div className={s.notAlt}>
        <button
          type="button"
          className="btn btn-primary btn-kucuk"
          disabled={bekliyor || !degisti}
          onClick={kaydet}
        >
          {bekliyor ? "Kaydediliyor…" : "Notu Kaydet"}
        </button>
        {degisti && !bekliyor && <small className={s.uyari}>Kaydedilmemiş değişiklik var.</small>}
        {bilgi && <small>{bilgi}</small>}
      </div>
    </section>
  );
}
