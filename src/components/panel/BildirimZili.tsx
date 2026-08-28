"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, CheckCircle2 } from "lucide-react";
import { bildirimTumunuOkundu } from "@/actions/bildirim";

export interface ZilBildirim {
  id: string;
  ikon: string;
  metin: string;
  zaman: string;
  okundu: boolean;
}

/* Üst bar bildirim zili — hatem-crm'deki açılır bildirim listesinin karşılığı.
   Son bildirimler sunucu layout'unda çekilip prop olarak gelir; açılırdaki
   "tümünü okundu" server action ile işlenir. */
export default function BildirimZili({
  sayi,
  bildirimler,
}: {
  sayi: number;
  bildirimler: ZilBildirim[];
}) {
  const [acik, setAcik] = useState(false);
  const kapRef = useRef<HTMLDivElement>(null);
  const [bekliyor, baslat] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!acik) return;
    const kapat = (e: MouseEvent) => {
      if (kapRef.current && !kapRef.current.contains(e.target as Node)) setAcik(false);
    };
    document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, [acik]);

  const tumunuOkundu = () =>
    baslat(async () => {
      await bildirimTumunuOkundu();
      router.refresh();
    });

  return (
    <div className="zil-kap" ref={kapRef}>
      <button
        type="button"
        className="ustbar-buton"
        onClick={() => setAcik((a) => !a)}
        aria-expanded={acik}
        aria-label="Bildirimler"
        title="Bildirimler"
      >
        <Bell size={18} />
        {sayi > 0 && <span className="menu-rozet zil-rozet">{sayi > 9 ? "9+" : sayi}</span>}
      </button>

      {acik && (
        <div className="zil-acilir">
          <div className="zil-acilir-bas">
            <b>Bildirimler</b>
            {sayi > 0 && (
              <span className="zil-acilir-sag">
                <button type="button" onClick={tumunuOkundu} disabled={bekliyor}>
                  <CheckCheck size={13} /> Tümünü okundu işaretle
                </button>
                <span className="zil-yeni">{sayi} yeni</span>
              </span>
            )}
          </div>

          {bildirimler.length === 0 ? (
            <div className="zil-bos">
              <CheckCircle2 size={22} />
              <span>Bekleyen bildirim yok</span>
            </div>
          ) : (
            <div className="zil-liste">
              {bildirimler.map((b) => (
                <Link
                  key={b.id}
                  href="/bildirimler"
                  className={`zil-kalem${b.okundu ? "" : " yeni"}`}
                  onClick={() => setAcik(false)}
                >
                  <span className="zil-kalem-ikon" aria-hidden="true">{b.ikon}</span>
                  <span className="zil-kalem-govde">
                    <span className="zil-kalem-metin">{b.metin}</span>
                    <small>{b.zaman}</small>
                  </span>
                  {!b.okundu && <span className="zil-kalem-nokta" aria-hidden="true" />}
                </Link>
              ))}
            </div>
          )}

          <div className="zil-acilir-alt">
            <Link href="/bildirimler" onClick={() => setAcik(false)}>
              Tüm bildirimleri gör →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
