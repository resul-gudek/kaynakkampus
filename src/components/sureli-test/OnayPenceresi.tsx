"use client";

/* Ortak onay penceresi — süreli test akışındaki geri dönüşsüz adımlar için
   (test başlatma, test teslim etme) tarayıcı confirm()'i yerine kip pencere.

   Native <dialog> kullanılır: Esc, odak hapsi ve arka plan karartması
   tarayıcıdan gelir. Pencere MONTE EDİLDİĞİNDE açılır, sökülünce tarayıcı
   kendiliğinden kapatır — yani açık/kapalı durumu çağıranın state'inde tutulur:

     {onayAcik && <OnayPenceresi … />}

   İşlem sürerken (islemde) kapatma yolları kilitlenir; hata pencerenin
   içinde gösterilir, alert() kullanılmaz. */

import { useEffect, useRef, type ReactNode } from "react";
import s from "./test.module.css";

export default function OnayPenceresi({
  ikon,
  baslik,
  altBaslik,
  hata,
  islemde,
  onayEtiketi,
  islemdeEtiketi,
  iptalEtiketi = "Vazgeç",
  onOnay,
  onIptal,
  children,
}: {
  ikon: string;
  baslik: string;
  altBaslik?: string;
  /** Sunucudan dönen hata; pencere kapanmaz, içinde gösterilir */
  hata?: string;
  islemde?: boolean;
  onayEtiketi: string;
  islemdeEtiketi: string;
  iptalEtiketi?: string;
  onOnay: () => void;
  onIptal: () => void;
  children: ReactNode;
}) {
  const pencereRef = useRef<HTMLDialogElement>(null);
  const basligiId = "onay-pencere-baslik";

  /* Montajda aç. Sökülürken tarayıcı kip durumunu kendisi bırakır. */
  useEffect(() => {
    const pencere = pencereRef.current;
    if (pencere && !pencere.open) pencere.showModal();
  }, []);

  function kapat() {
    if (!islemde) onIptal();
  }

  return (
    <dialog
      ref={pencereRef}
      className={s.pencere}
      aria-labelledby={basligiId}
      onCancel={(e) => {
        e.preventDefault(); // kapanışı state yönetir
        kapat();
      }}
      onClick={(e) => {
        // Backdrop tıklaması: hedef doğrudan <dialog>'un kendisidir
        if (e.target === pencereRef.current) kapat();
      }}
    >
      <div className={s.pencereBas}>
        <span className={s.pencereIkon} aria-hidden="true">
          {ikon}
        </span>
        <div>
          <h3 id={basligiId}>{baslik}</h3>
          {altBaslik && <small>{altBaslik}</small>}
        </div>
      </div>

      {children}

      {hata && (
        <p className={s.pencereHata} role="alert">
          {hata}
        </p>
      )}

      <div className={s.pencereAlt}>
        <button
          type="button"
          className="btn btn-outline btn-kucuk"
          disabled={islemde}
          onClick={onIptal}
        >
          {iptalEtiketi}
        </button>
        <button
          type="button"
          className="btn btn-primary btn-kucuk"
          disabled={islemde}
          autoFocus
          onClick={onOnay}
        >
          {islemde ? islemdeEtiketi : onayEtiketi}
        </button>
      </div>
    </dialog>
  );
}
