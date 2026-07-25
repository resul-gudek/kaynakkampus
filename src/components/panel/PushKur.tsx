"use client";

import { useEffect, useState } from "react";
import { pushAboneOl } from "@/actions/push";

/* Cihaz push bildirimleri opt-in düğmesi. Desteklenmiyorsa, VAPID anahtarı
   yoksa ya da zaten abone olunmuşsa hiçbir şey göstermez. Yalnız kullanıcı
   izin vermeden önce küçük bir "bildirimleri aç" hapı çıkar. */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function b64ToUint8(base64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const ham = atob(b);
  const arr = new Uint8Array(new ArrayBuffer(ham.length));
  for (let i = 0; i < ham.length; i++) arr[i] = ham.charCodeAt(i);
  return arr;
}

type Durum = "gizli" | "hazir" | "calisiyor" | "acildi" | "hata";

export default function PushKur() {
  const [durum, setDurum] = useState<Durum>("gizli");
  const [hata, setHata] = useState("");

  useEffect(() => {
    const destek =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    if (!destek || !PUBLIC_KEY) return;
    if (Notification.permission === "denied") return; // engellenmiş: gösterme

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((mevcut) => {
        // Zaten abone ve izin verilmişse düğmeyi gösterme
        if (mevcut && Notification.permission === "granted") return;
        setDurum("hazir");
      })
      .catch(() => {
        /* SW kaydı başarısız (ör. güvenli olmayan bağlam) → sessizce gizle */
      });
  }, []);

  async function ac() {
    setDurum("calisiyor");
    setHata("");
    try {
      const izin = await Notification.requestPermission();
      if (izin !== "granted") {
        setDurum(izin === "denied" ? "gizli" : "hazir");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const abonelik = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToUint8(PUBLIC_KEY!),
      });
      const j = abonelik.toJSON();
      const sonuc = await pushAboneOl({
        endpoint: abonelik.endpoint,
        p256dh: j.keys?.p256dh ?? "",
        auth: j.keys?.auth ?? "",
        tarayici: navigator.userAgent.slice(0, 400),
      });
      if (sonuc.hata) {
        setHata(sonuc.hata);
        setDurum("hata");
        return;
      }
      setDurum("acildi");
      setTimeout(() => setDurum("gizli"), 4000);
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Bildirim açılamadı.");
      setDurum("hata");
    }
  }

  if (durum === "gizli") return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: 10,
        maxWidth: 320,
        padding: "12px 14px",
        borderRadius: 14,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-lg, var(--shadow))",
        fontSize: ".82rem",
      }}
    >
      {durum === "acildi" ? (
        <span>✅ Cihaz bildirimleri açıldı.</span>
      ) : (
        <>
          <span style={{ flex: 1 }}>
            🔔 Ders hatırlatmalarını bu cihaza <b>push bildirim</b> olarak al.
            {durum === "hata" && hata && (
              <span style={{ display: "block", color: "#dc2626", marginTop: 4 }}>{hata}</span>
            )}
          </span>
          <button
            type="button"
            className="btn btn-primary btn-kucuk"
            disabled={durum === "calisiyor"}
            onClick={ac}
          >
            {durum === "calisiyor" ? "…" : "Aç"}
          </button>
        </>
      )}
    </div>
  );
}
