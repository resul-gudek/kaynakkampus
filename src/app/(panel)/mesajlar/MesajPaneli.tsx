"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mesajGonder, mesajlariOku } from "@/actions/mesaj";
import s from "./mesajlar.module.css";

export interface Konusma {
  digerId: string;
  ad: string;
  altBilgi: string;
  sonMesaj: string;
  sonZaman: string;
  okunmamis: number;
}

export interface MesajGorunum {
  id: string;
  benden: boolean;
  govde: string;
  zaman: string;
}

function basHarfler(ad: string) {
  return ad
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toLocaleUpperCase("tr-TR");
}

export default function MesajPaneli({
  konusmalar,
  seciliId,
  secili,
  mesajlar,
  okunmamisVar,
}: {
  konusmalar: Konusma[];
  seciliId: string;
  secili: Konusma | null;
  mesajlar: MesajGorunum[];
  okunmamisVar: boolean;
}) {
  const router = useRouter();
  const [bekliyor, baslat] = useTransition();
  const [metin, setMetin] = useState("");
  const [hata, setHata] = useState("");
  const dipRef = useRef<HTMLDivElement>(null);

  /* Açılan konuşmadaki okunmamışları okundu işaretle (rozet düşsün) */
  useEffect(() => {
    if (seciliId && okunmamisVar) {
      mesajlariOku(seciliId).then(() => router.refresh());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seciliId, okunmamisVar]);

  /* Yeni mesaj gelince/görünce en alta kaydır */
  useEffect(() => {
    dipRef.current?.scrollIntoView({ block: "end" });
  }, [mesajlar.length, seciliId]);

  function gonder() {
    const govde = metin.trim();
    if (!govde || !seciliId) return;
    setHata("");
    baslat(async () => {
      const sonuc = await mesajGonder({ aliciId: seciliId, govde });
      if (sonuc.hata) {
        setHata(sonuc.hata);
        return;
      }
      setMetin("");
      router.refresh();
    });
  }

  return (
    <main className={`container ${s.sayfa}`}>
      <div className={s.duzen}>
        {/* ── Konuşma listesi ── */}
        <aside className={`${s.liste} ${seciliId ? s.mobilGizle : ""}`}>
          <div className={s.listeBas}>
            💬 <b>Mesajlar</b>
          </div>
          {konusmalar.length === 0 ? (
            <p className={s.bosNot}>
              Henüz mesajlaşabileceğin biri yok. Bir koça/öğrenciye atandığında burada görünür.
            </p>
          ) : (
            konusmalar.map((k) => (
              <Link
                key={k.digerId}
                href={`/mesajlar?ile=${k.digerId}`}
                className={`${s.konusma} ${k.digerId === seciliId ? s.aktif : ""}`}
                scroll={false}
              >
                <span className="avatar">{basHarfler(k.ad)}</span>
                <div className={s.konusmaGovde}>
                  <div className={s.konusmaUst}>
                    <b>{k.ad}</b>
                    <small>{k.sonZaman}</small>
                  </div>
                  <div className={s.konusmaAlt}>
                    <span className={s.onizleme}>{k.sonMesaj || k.altBilgi}</span>
                    {k.okunmamis > 0 && <span className={s.rozet}>{k.okunmamis}</span>}
                  </div>
                </div>
              </Link>
            ))
          )}
        </aside>

        {/* ── Sohbet ── */}
        <section className={`${s.sohbet} ${!seciliId ? s.mobilGizle : ""}`}>
          {secili ? (
            <>
              <header className={s.sohbetBas}>
                <Link href="/mesajlar" className={s.geriBtn} aria-label="Listeye dön">←</Link>
                <span className="avatar">{basHarfler(secili.ad)}</span>
                <div>
                  <b>{secili.ad}</b>
                  <small>{secili.altBilgi}</small>
                </div>
              </header>

              <div className={s.akis}>
                {mesajlar.length === 0 ? (
                  <p className={s.bosNot}>Henüz mesaj yok. İlk mesajı sen yaz. 👋</p>
                ) : (
                  mesajlar.map((m) => (
                    <div key={m.id} className={`${s.balon} ${m.benden ? s.benden : s.karsi}`}>
                      <p>{m.govde}</p>
                      <span className={s.zaman}>{m.zaman}</span>
                    </div>
                  ))
                )}
                <div ref={dipRef} />
              </div>

              <div className={s.yazma}>
                {hata && <div className={s.hata}>{hata}</div>}
                <div className={s.yazmaSatir}>
                  <textarea
                    value={metin}
                    onChange={(e) => setMetin(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        gonder();
                      }
                    }}
                    placeholder="Mesaj yaz… (Enter ile gönder, Shift+Enter alt satır)"
                    rows={2}
                    maxLength={4000}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={bekliyor || !metin.trim()}
                    onClick={gonder}
                  >
                    {bekliyor ? "…" : "Gönder"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className={s.bosSohbet}>
              <span>💬</span>
              <p>Soldan bir konuşma seçerek mesajlaşmaya başla.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
