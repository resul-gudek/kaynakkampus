"use client";

/* ── UYARI / ONAY KATMANI · PENCERE ──────────────────────────────────
   uyari.ts'e gelen istekleri çizer. Kök layout'ta bir kez monte edilir;
   uygulamanın her yerinden Uyari.hata / Uyari.onay / Uyari.sor çağrılabilir.

   Native <dialog> kullanılır: Esc, odak hapsi ve arka plan karartması
   tarayıcıdan gelir. Aynı anda birden çok istek gelirse kuyruğa alınır
   (showModal açık pencerede hata verir).
   ------------------------------------------------------------------ */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  uyariIsleyicisiKur,
  type SeritIstek,
  type UyariIstek,
  type UyariTuru,
} from "./uyari";
import s from "./uyari.module.css";

const TURLER: Record<UyariTuru, { ikon: string; baslik: string }> = {
  bilgi: { ikon: "ℹ️", baslik: "Bilgi" },
  basari: { ikon: "✅", baslik: "Tamam" },
  uyari: { ikon: "⚠️", baslik: "Dikkat" },
  hata: { ikon: "⛔", baslik: "İşlem tamamlanamadı" },
  onay: { ikon: "❓", baslik: "Onay gerekiyor" },
  sor: { ikon: "✏️", baslik: "Bilgi gerekiyor" },
};

const SERIT_IKON = { bilgi: "ℹ️", basari: "✓", uyari: "⚠️", hata: "⛔" } as const;

export default function UyariKatmani() {
  const [aktif, setAktif] = useState<UyariIstek | null>(null);
  const [deger, setDeger] = useState("");
  const [seritler, setSeritler] = useState<SeritIstek[]>([]);
  const kuyruk = useRef<UyariIstek[]>([]);
  /* Açık isteğin ref ikizi: bitir() güncelleyici dışında okur */
  const aktifRef = useRef<UyariIstek | null>(null);
  const pencereRef = useRef<HTMLDialogElement>(null);
  const girdiRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const onayRef = useRef<HTMLButtonElement>(null);
  const iptalRef = useRef<HTMLButtonElement>(null);

  /* İstekleri al: pencere doluysa kuyruğa, boşsa doğrudan aç */
  useEffect(() => {
    uyariIsleyicisiKur({
      pencere: (istek) => {
        if (aktifRef.current) {
          kuyruk.current.push(istek);
          return;
        }
        aktifRef.current = istek;
        setDeger(istek.varsayilan ?? "");
        setAktif(istek);
      },
      serit: (istek) => setSeritler((l) => [...l, istek]),
    });
    return () => uyariIsleyicisiKur(null);
  }, []);

  /* Kip pencereyi aç/kapat ve odağı yerleştir */
  useEffect(() => {
    const pencere = pencereRef.current;
    if (!pencere) return;
    if (aktif && !pencere.open) {
      pencere.showModal();
      /* showModal odağı ilk odaklanabilir öğeye taşır; nereye düşeceğini
         burada belirliyoruz. Geri alınamaz işlemde odak bilerek "Vazgeç"te:
         Enter'a basmak silmeye yol açmaz. React'in autoFocus'u showModal'dan
         önce çalıştığı için yeterli değil. */
      const g = girdiRef.current;
      if (g) {
        g.focus();
        g.select();
      } else if (aktif.tehlikeli && iptalRef.current) {
        iptalRef.current.focus();
      } else {
        onayRef.current?.focus();
      }
    } else if (!aktif && pencere.open) {
      pencere.close();
    }
  }, [aktif]);

  /* Çözümleme state güncelleyicisinin İÇİNDE yapılmaz: React geliştirme
     kipinde güncelleyiciyi iki kez çağırır, Promise iki kez çözülürdü. */
  const bitir = useCallback(
    (onaylandi: boolean) => {
      const istek = aktifRef.current;
      if (!istek) return;
      aktifRef.current = null;

      if (istek.tur === "onay") istek.cozumle(onaylandi);
      else if (istek.tur === "sor") istek.cozumle(onaylandi ? deger : null);
      else istek.cozumle(undefined);

      const sonraki = kuyruk.current.shift() ?? null;
      /* Sıradaki isteğe geçmeden pencere kapanmalı: showModal açık
         pencerede hata verir; kapanınca açma efekti yeniden çalışır. */
      if (sonraki) {
        pencereRef.current?.close();
        setDeger(sonraki.varsayilan ?? "");
      }
      aktifRef.current = sonraki;
      setAktif(sonraki);
    },
    [deger]
  );

  const seritKapat = useCallback((anahtar: number) => {
    setSeritler((l) => l.filter((x) => x.anahtar !== anahtar));
  }, []);

  const istek = aktif;
  const on = istek ? TURLER[istek.tur] : TURLER.bilgi;
  const onayli = istek?.tur === "onay" || istek?.tur === "sor";

  return (
    <>
      <dialog
        ref={pencereRef}
        className={s.pencere}
        data-tur={istek?.tur}
        aria-labelledby="uyari-baslik"
        onCancel={(e) => {
          e.preventDefault(); // kapanışı state yönetir
          bitir(false);
        }}
        onClick={(e) => {
          // Backdrop tıklaması: hedef doğrudan <dialog>'un kendisidir
          if (e.target === pencereRef.current) bitir(false);
        }}
      >
        {istek && (
          <>
            <div className={s.bas}>
              <span className={s.ikon} aria-hidden="true">
                {istek.ikon || on.ikon}
              </span>
              <div>
                <h2 className={s.baslik} id="uyari-baslik">
                  {istek.baslik || on.baslik}
                </h2>
                {istek.altBaslik && <small className={s.altBaslik}>{istek.altBaslik}</small>}
              </div>
            </div>

            {istek.mesaj && <p className={s.metin}>{istek.mesaj}</p>}

            {istek.tur === "sor" &&
              (istek.cokSatir ? (
                <textarea
                  ref={girdiRef as React.RefObject<HTMLTextAreaElement>}
                  className={s.girdi}
                  value={deger}
                  placeholder={istek.yerTutucu}
                  aria-label={istek.mesaj || istek.baslik || "Değer"}
                  onChange={(e) => setDeger(e.target.value)}
                />
              ) : (
                <input
                  ref={girdiRef as React.RefObject<HTMLInputElement>}
                  className={s.girdi}
                  type="text"
                  value={deger}
                  placeholder={istek.yerTutucu}
                  aria-label={istek.mesaj || istek.baslik || "Değer"}
                  onChange={(e) => setDeger(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault(); // prompt() davranışı: Enter onaylar
                      bitir(true);
                    }
                  }}
                />
              ))}

            <div className={s.altSira}>
              {onayli && (
                <button
                  type="button"
                  ref={iptalRef}
                  className={`${s.dugme} ${s.ikincil}`}
                  onClick={() => bitir(false)}
                >
                  {istek.iptalEtiketi || "Vazgeç"}
                </button>
              )}
              <button
                type="button"
                ref={onayRef}
                className={`${s.dugme} ${s.birincil} ${istek.tehlikeli ? s.tehlikeli : ""}`}
                onClick={() => bitir(true)}
              >
                {istek.onayEtiketi || (onayli ? "Devam et" : "Tamam")}
              </button>
            </div>
          </>
        )}
      </dialog>

      {seritler.length > 0 && (
        <div className={s.seritKap} role="status" aria-live="polite">
          {seritler.map((x) => (
            <Serit key={x.anahtar} istek={x} kapat={seritKapat} />
          ))}
        </div>
      )}
    </>
  );
}

function Serit({ istek, kapat }: { istek: SeritIstek; kapat: (anahtar: number) => void }) {
  const tur = istek.tur || "bilgi";
  useEffect(() => {
    const zaman = setTimeout(() => kapat(istek.anahtar), Math.max(1200, istek.sure || 3200));
    return () => clearTimeout(zaman);
  }, [istek.anahtar, istek.sure, kapat]);

  return (
    <div className={s.serit} data-tur={tur} onClick={() => kapat(istek.anahtar)}>
      <span className={s.seritIkon} aria-hidden="true">
        {istek.ikon || SERIT_IKON[tur]}
      </span>
      <span>{istek.mesaj}</span>
    </div>
  );
}
