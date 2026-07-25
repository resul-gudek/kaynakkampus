"use client";

// Bu modül DersOdasi içinden ssr:false ile yüklenir; Excalidraw yalnızca
// tarayıcıda değerlendirilir. Senkron tek yönlüdür: öğretmen çizer, sahne
// LiveKit veri kanalı üzerinden parçalara bölünerek öğrencilere yayınlanır.
// Geç katılan öğrenci "istek" mesajıyla güncel sahneyi ister.

import { useCallback, useEffect, useRef } from "react";
import { useDataChannel } from "@livekit/components-react";
import {
  CaptureUpdateAction,
  Excalidraw,
  getSceneVersion,
  restoreElements,
} from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

// LiveKit güvenilir veri paketi sınırı ~15KiB; JSON parçaları bunun altında kalır.
const PARCA_BOYU = 12_000;
const YAYIN_ARALIGI_MS = 300;

type TahtaMesaji =
  | { t: "istek" }
  | { t: "sahne"; id: string; parca: number; toplam: number; veri: string };

const kodla = (mesaj: TahtaMesaji) => new TextEncoder().encode(JSON.stringify(mesaj));

export default function Tahta({ moderator }: { moderator: boolean }) {
  const api = useRef<ExcalidrawImperativeAPI | null>(null);
  const sonSurum = useRef(-1);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sahneSayac = useRef(0);
  const gelenParcalar = useRef(
    new Map<string, { toplam: number; parcalar: Map<number, string> }>()
  );
  const yayinlaRef = useRef<(hemen?: boolean) => void>(() => {});

  const { send } = useDataChannel("tahta", (mesaj) => {
    let veri: TahtaMesaji;
    try {
      veri = JSON.parse(new TextDecoder().decode(mesaj.payload));
    } catch {
      return;
    }

    if (veri.t === "istek") {
      if (moderator) yayinlaRef.current(true);
      return;
    }

    if (veri.t === "sahne" && !moderator) {
      let kayit = gelenParcalar.current.get(veri.id);
      if (!kayit) {
        kayit = { toplam: veri.toplam, parcalar: new Map() };
        gelenParcalar.current.set(veri.id, kayit);
      }
      kayit.parcalar.set(veri.parca, veri.veri);
      if (kayit.parcalar.size < kayit.toplam) return;

      gelenParcalar.current.delete(veri.id);
      try {
        const metin = Array.from({ length: kayit.toplam }, (_, i) => kayit.parcalar.get(i)).join("");
        api.current?.updateScene({
          elements: restoreElements(JSON.parse(metin), null),
          captureUpdate: CaptureUpdateAction.NEVER,
        });
      } catch {
        // Bozuk/eksik sahne yoksayılır; bir sonraki tam yayın durumu düzeltir.
      }
    }
  });
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const yayinla = useCallback((hemen = false) => {
    const gonder = () => {
      const elemanlar = api.current?.getSceneElements();
      if (!elemanlar) return;
      sonSurum.current = getSceneVersion(elemanlar);
      const metin = JSON.stringify(elemanlar);
      const id = `s${sahneSayac.current++}`;
      const toplam = Math.max(1, Math.ceil(metin.length / PARCA_BOYU));
      for (let i = 0; i < toplam; i++) {
        sendRef.current(
          kodla({
            t: "sahne",
            id,
            parca: i,
            toplam,
            veri: metin.slice(i * PARCA_BOYU, (i + 1) * PARCA_BOYU),
          }),
          { reliable: true }
        );
      }
    };

    if (hemen) {
      if (zamanlayici.current) {
        clearTimeout(zamanlayici.current);
        zamanlayici.current = null;
      }
      gonder();
      return;
    }
    if (zamanlayici.current) return;
    zamanlayici.current = setTimeout(() => {
      zamanlayici.current = null;
      gonder();
    }, YAYIN_ARALIGI_MS);
  }, []);
  useEffect(() => {
    yayinlaRef.current = yayinla;
  }, [yayinla]);

  useEffect(() => {
    if (!moderator) sendRef.current(kodla({ t: "istek" }), { reliable: true });
    return () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
    };
  }, [moderator]);

  return (
    <Excalidraw
      excalidrawAPI={(hazirApi) => {
        api.current = hazirApi;
      }}
      viewModeEnabled={!moderator}
      langCode="tr-TR"
      UIOptions={{ tools: { image: false } }}
      onChange={
        moderator
          ? (elemanlar) => {
              if (getSceneVersion(elemanlar) !== sonSurum.current) yayinla();
            }
          : undefined
      }
      initialData={{ appState: { viewBackgroundColor: "#ffffff" } }}
    />
  );
}
