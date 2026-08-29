"use client";

import { useActionState, useEffect, useRef } from "react";
import { iletisimMesajiGonder, type IletisimSonuc } from "./actions";
import s from "./iletisim.module.css";

const ILETISIM_ILK_SONUC: IletisimSonuc = { durum: "bos" };

export default function IletisimFormu() {
  const [sonuc, eylem, bekliyor] = useActionState(iletisimMesajiGonder, ILETISIM_ILK_SONUC);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (sonuc.durum === "basarili") form.current?.reset();
  }, [sonuc.durum]);

  return (
    <form ref={form} action={eylem} className={s.form} noValidate>
      <div className={s.ikiSutun}>
        <div className={s.alan}>
          <label htmlFor="iletisim-ad">Ad soyad</label>
          <input id="iletisim-ad" name="ad" type="text" autoComplete="name" maxLength={100} required aria-invalid={!!sonuc.alanlar?.ad} aria-describedby={sonuc.alanlar?.ad ? "iletisim-ad-hata" : undefined} />
          {sonuc.alanlar?.ad && <span id="iletisim-ad-hata" className={s.alanHata}>{sonuc.alanlar.ad}</span>}
        </div>
        <div className={s.alan}>
          <label htmlFor="iletisim-eposta">E-posta</label>
          <input id="iletisim-eposta" name="eposta" type="email" autoComplete="email" maxLength={254} required aria-invalid={!!sonuc.alanlar?.eposta} aria-describedby={sonuc.alanlar?.eposta ? "iletisim-eposta-hata" : undefined} />
          {sonuc.alanlar?.eposta && <span id="iletisim-eposta-hata" className={s.alanHata}>{sonuc.alanlar.eposta}</span>}
        </div>
      </div>

      <div className={s.alan}>
        <label htmlFor="iletisim-konu">Konu</label>
        <input id="iletisim-konu" name="konu" type="text" maxLength={150} required aria-invalid={!!sonuc.alanlar?.konu} aria-describedby={sonuc.alanlar?.konu ? "iletisim-konu-hata" : undefined} />
        {sonuc.alanlar?.konu && <span id="iletisim-konu-hata" className={s.alanHata}>{sonuc.alanlar.konu}</span>}
      </div>

      <div className={s.alan}>
        <label htmlFor="iletisim-mesaj">Mesajınız</label>
        <textarea id="iletisim-mesaj" name="mesaj" rows={7} maxLength={5000} required aria-invalid={!!sonuc.alanlar?.mesaj} aria-describedby={sonuc.alanlar?.mesaj ? "iletisim-mesaj-hata" : "iletisim-mesaj-ipucu"} />
        {sonuc.alanlar?.mesaj ? <span id="iletisim-mesaj-hata" className={s.alanHata}>{sonuc.alanlar.mesaj}</span> : <span id="iletisim-mesaj-ipucu" className={s.ipucu}>En fazla 5.000 karakter.</span>}
      </div>

      <div className={s.tuzak} aria-hidden="true">
        <label htmlFor="iletisim-telefon">Telefon</label>
        <input id="iletisim-telefon" name="telefon" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {sonuc.mesaj && (
        <p className={sonuc.durum === "basarili" ? s.basarili : s.formHata} role={sonuc.durum === "hata" ? "alert" : "status"} aria-live="polite">
          {sonuc.mesaj}
        </p>
      )}

      <div className={s.formAlt}>
        <p>Göndererek bilgilerinizin mesajınıza yanıt vermek amacıyla kullanılmasını kabul edersiniz.</p>
        <button type="submit" disabled={bekliyor}>{bekliyor ? "Gönderiliyor…" : "Mesajı gönder"}</button>
      </div>
    </form>
  );
}
