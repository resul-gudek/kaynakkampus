"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ControlBar, LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import s from "./ders-odasi.module.css";

const Tahta = dynamic(() => import("./Tahta"), {
  ssr: false,
  loading: () => <div className={s.tahtaYukleniyor}>Tahta yükleniyor…</div>,
});

type Baglanti = { url: string; token: string };

export default function DersOdasi({
  oturumId,
  baslik,
  moderator,
}: {
  oturumId: string;
  baslik: string;
  moderator: boolean;
}) {
  const [baglanti, setBaglanti] = useState<Baglanti | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sekme, setSekme] = useState<"video" | "tahta">("video");
  // Tahta bir kez açıldıktan sonra takılı kalır: sahne durumu ve veri kanalı
  // dinleyicisi sekme değişiminde kaybolmaz.
  const [tahtaAcildi, setTahtaAcildi] = useState(false);

  async function katil() {
    setYukleniyor(true);
    setHata(null);
    try {
      const yanit = await fetch(`/api/canli-ders/${oturumId}/katil`, { method: "POST" });
      const veri = await yanit.json().catch(() => null);
      if (!yanit.ok || !veri?.token || !veri?.url) {
        throw new Error(veri?.hata ?? "Canlı ders odası açılamadı.");
      }
      setBaglanti({ url: veri.url, token: veri.token });
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Canlı ders odası açılamadı.");
    } finally {
      setYukleniyor(false);
    }
  }

  if (!baglanti) {
    return (
      <div className={s.baslat}>
        {hata && <p className={s.baglantiHata}>{hata}</p>}
        <button className="btn btn-primary" onClick={katil} disabled={yukleniyor}>
          {yukleniyor ? "Bağlanılıyor…" : moderator ? "Dersi Başlat" : "Derse Katıl"}
        </button>
      </div>
    );
  }

  return (
    <div className={s.kaplama} data-lk-theme="default">
      <LiveKitRoom
        serverUrl={baglanti.url}
        token={baglanti.token}
        connect
        audio={false}
        video={false}
        options={{ adaptiveStream: true, dynacast: true }}
        onDisconnected={() => {
          setBaglanti(null);
          setSekme("video");
          setTahtaAcildi(false);
        }}
        className={s.oda}
      >
        <header className={s.ustCubuk}>
          <div className={s.dersBilgi}>
            <b>{baslik}</b>
            <span>{moderator ? "Öğretmen" : "Öğrenci"}</span>
          </div>
          <nav className={s.sekmeler}>
            <button
              type="button"
              className={sekme === "video" ? s.sekmeAktif : s.sekmeDugme}
              onClick={() => setSekme("video")}
            >
              🎥 Video
            </button>
            <button
              type="button"
              className={sekme === "tahta" ? s.sekmeAktif : s.sekmeDugme}
              onClick={() => {
                setSekme("tahta");
                setTahtaAcildi(true);
              }}
            >
              ✏️ Tahta
            </button>
          </nav>
        </header>

        <div className={s.govde}>
          <div className={sekme === "video" ? s.videoAlan : s.gizli}>
            <VideoConference />
          </div>
          {tahtaAcildi && (
            <div className={sekme === "tahta" ? s.tahtaAlan : s.gizli}>
              <div className={s.tahta}>
                <Tahta moderator={moderator} />
              </div>
              <div className={s.altCubuk}>
                <ControlBar variation="minimal" />
              </div>
            </div>
          )}
        </div>
      </LiveKitRoom>
    </div>
  );
}
