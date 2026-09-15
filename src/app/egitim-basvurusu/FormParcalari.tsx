"use client";

/* Eğitim Başvurusu formlarının ortak parçaları: adım göstergesi, alan
   sarmalayıcı, kart biçiminde seçenekler, gün çipleri, gezinme düğmeleri,
   KVKK onayı ve başarı ekranı. İki form (özel ders / koçluk) yalnız bunları
   kullanır; görünüm tek yerden değişir. */

import type { ReactNode } from "react";
import s from "./egitim-basvurusu.module.css";

/* ── Adım göstergesi ─────────────────────────────────────────── */

export function AdimGosterge({ adimlar, aktif }: { adimlar: readonly string[]; aktif: number }) {
  const yuzde = Math.round(((aktif + 1) / adimlar.length) * 100);
  return (
    <div className={s.adimlar} aria-live="polite">
      <div className={s.adimUst}>
        <span className={s.adimSayac}>
          Adım {aktif + 1} / {adimlar.length}
        </span>
        <span className={s.adimAdi}>{adimlar[aktif]}</span>
      </div>
      <div
        className={s.ray}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={adimlar.length}
        aria-valuenow={aktif + 1}
        aria-label="Başvuru adımı"
      >
        <div className={s.dolu} style={{ width: `${yuzde}%` }} />
      </div>
      <ol className={s.adimListe} style={{ "--adim-sayisi": adimlar.length } as React.CSSProperties}>
        {adimlar.map((ad, i) => (
          <li key={ad} className={i === aktif ? s.adimAktif : i < aktif ? s.adimGecti : undefined}>
            <span className={s.adimNo}>{i < aktif ? "✓" : i + 1}</span>
            <span>{ad}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ── Alan sarmalayıcı ────────────────────────────────────────── */

export function Alan({
  id,
  etiket,
  zorunlu,
  ipucu,
  hata,
  children,
  grup,
}: {
  id: string;
  etiket: ReactNode;
  zorunlu?: boolean;
  ipucu?: string;
  hata?: string;
  children: ReactNode;
  /** true → başlık <label> değil, grup başlığı olur (radyo/onay kutusu grupları) */
  grup?: boolean;
}) {
  const baslikIcerik = (
    <>
      {etiket}
      {zorunlu && (
        <span className={s.zorunlu} aria-hidden="true">
          *
        </span>
      )}
    </>
  );
  return (
    <div className={s.alan} data-alan={id} role={grup ? "group" : undefined} aria-labelledby={grup ? `${id}-baslik` : undefined}>
      {grup ? (
        <span id={`${id}-baslik`} className={s.alanBaslik}>
          {baslikIcerik}
        </span>
      ) : (
        <label id={`${id}-baslik`} htmlFor={id} className={s.alanBaslik}>
          {baslikIcerik}
        </label>
      )}
      {children}
      {hata ? (
        <span id={`${id}-hata`} className={s.alanHata} role="alert">
          {hata}
        </span>
      ) : ipucu ? (
        <span id={`${id}-ipucu`} className={s.ipucu}>
          {ipucu}
        </span>
      ) : null}
    </div>
  );
}

/** aria bağları: hata varsa hata, yoksa ipucu metnine işaret eder */
export function ariaBag(id: string, hata?: string, ipucu?: string) {
  return {
    "aria-invalid": hata ? true : undefined,
    "aria-describedby": hata ? `${id}-hata` : ipucu ? `${id}-ipucu` : undefined,
  } as const;
}

/* ── Kart biçiminde seçenekler ───────────────────────────────── */

export interface Secenek {
  deger: string;
  etiket: string;
  aciklama?: string;
}

const Isaret = ({ kare }: { kare?: boolean }) => (
  <span className={`${s.isaret} ${kare ? s.isaretKare : ""}`} aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L20 7" />
    </svg>
  </span>
);

/** Tekli seçim (radyo) — büyük dokunma hedefli kartlar */
export function RadyoKartlar({
  ad,
  secenekler,
  deger,
  onChange,
  hata,
  tekSutun,
}: {
  ad: string;
  secenekler: readonly Secenek[];
  deger: string;
  onChange: (v: string) => void;
  hata?: string;
  tekSutun?: boolean;
}) {
  return (
    <div className={`${s.secenekler} ${tekSutun ? s.secenekTek : ""} ${hata ? s.secenekHata : ""}`}>
      {secenekler.map((o) => (
        <label key={o.deger} className={s.secenek}>
          <input
            type="radio"
            name={ad}
            value={o.deger}
            checked={deger === o.deger}
            onChange={() => onChange(o.deger)}
          />
          <Isaret />
          <span className={s.secenekMetin}>
            <b>{o.etiket}</b>
            {o.aciklama && <small>{o.aciklama}</small>}
          </span>
        </label>
      ))}
    </div>
  );
}

/** Çoklu seçim (onay kutusu) — aynı kart görünümü */
export function OnayKartlar({
  ad,
  secenekler,
  deger,
  onChange,
  hata,
  tekSutun,
}: {
  ad: string;
  secenekler: readonly Secenek[];
  deger: string[];
  onChange: (v: string[]) => void;
  hata?: string;
  tekSutun?: boolean;
}) {
  const degistir = (d: string) =>
    onChange(deger.includes(d) ? deger.filter((x) => x !== d) : [...deger, d]);
  return (
    <div className={`${s.secenekler} ${tekSutun ? s.secenekTek : ""} ${hata ? s.secenekHata : ""}`}>
      {secenekler.map((o) => (
        <label key={o.deger} className={s.secenek}>
          <input
            type="checkbox"
            name={ad}
            value={o.deger}
            checked={deger.includes(o.deger)}
            onChange={() => degistir(o.deger)}
            aria-invalid={hata ? true : undefined}
          />
          <Isaret kare />
          <span className={s.secenekMetin}>
            <b>{o.etiket}</b>
            {o.aciklama && <small>{o.aciklama}</small>}
          </span>
        </label>
      ))}
    </div>
  );
}

/** Gün çipleri — kompakt çoklu seçim */
export function Cipler({
  ad,
  secenekler,
  deger,
  onChange,
}: {
  ad: string;
  secenekler: readonly string[];
  deger: string[];
  onChange: (v: string[]) => void;
}) {
  const degistir = (d: string) =>
    onChange(deger.includes(d) ? deger.filter((x) => x !== d) : [...deger, d]);
  return (
    <div className={s.cipler}>
      {secenekler.map((d) => (
        <label key={d} className={s.cip}>
          <input type="checkbox" name={ad} value={d} checked={deger.includes(d)} onChange={() => degistir(d)} />
          {d}
        </label>
      ))}
    </div>
  );
}

/* ── KVKK onayı ──────────────────────────────────────────────── */

export function KvkkOnay({
  id,
  deger,
  onChange,
  hata,
}: {
  id: string;
  deger: boolean;
  onChange: (v: boolean) => void;
  hata?: string;
}) {
  return (
    <div className={s.alan} data-alan={id}>
      <label className={`${s.onay} ${hata ? s.onayHata : ""}`}>
        <input
          id={id}
          type="checkbox"
          checked={deger}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={hata ? true : undefined}
          aria-describedby={hata ? `${id}-hata` : undefined}
        />
        <span>
          Bu formda paylaştığım kişisel verilerin (öğrenci ve iletişim bilgileri) Kaynak Kampüs tarafından
          yalnızca başvurumu değerlendirmek ve benimle iletişime geçmek amacıyla, 6698 sayılı KVKK ve{" "}
          <a href="/gizlilik.html#veriler" target="_blank" rel="noopener noreferrer">
            Gizlilik Politikası
          </a>{" "}
          doğrultusunda işlenmesini kabul ediyorum. <span className={s.zorunlu}>*</span>
        </span>
      </label>
      {hata && (
        <span id={`${id}-hata`} className={s.alanHata} role="alert">
          {hata}
        </span>
      )}
    </div>
  );
}

/* ── Gezinme ─────────────────────────────────────────────────── */

export function Gezinme({
  geri,
  sonAdim,
  gonderiliyor,
  gonderMetni,
}: {
  geri?: () => void;
  sonAdim: boolean;
  gonderiliyor: boolean;
  gonderMetni: string;
}) {
  return (
    <div className={s.gezinme}>
      {geri ? (
        <button type="button" className={`${s.dugme} ${s.dugmeCizgili}`} onClick={geri} disabled={gonderiliyor}>
          ← Geri
        </button>
      ) : (
        <span />
      )}
      <button type="submit" className={`${s.dugme} ${s.dugmeDolu}`} disabled={gonderiliyor} aria-busy={gonderiliyor}>
        {gonderiliyor ? (
          <>
            <span className={s.donen} aria-hidden="true" /> Gönderiliyor…
          </>
        ) : sonAdim ? (
          gonderMetni
        ) : (
          <>
            Devam et <span aria-hidden="true">→</span>
          </>
        )}
      </button>
    </div>
  );
}

/* ── Genel hata ──────────────────────────────────────────────── */

export function FormHata({ mesaj }: { mesaj: string }) {
  if (!mesaj) return null;
  return (
    <p className={s.formHata} role="alert">
      <span aria-hidden="true">!</span>
      <span>{mesaj}</span>
    </p>
  );
}

/* ── Başarı ekranı ───────────────────────────────────────────── */

export function BasariEkrani() {
  return (
    <div className={s.basari} role="status" aria-live="polite">
      <span className={s.basariIkon} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12 5 5L20 7" />
        </svg>
      </span>
      <h2>Başvurunuz Alındı!</h2>
      <p>Bilgilerinizi aldık. Başvurunuzu inceleyerek en kısa sürede sizinle iletişime geçeceğiz.</p>
      <div className={s.basariEylem}>
        {/* Ana sayfa statik public/index.html'dir; Next yönlendirmesi değil düz bağlantı */}
        <a href="/" className={`${s.dugme} ${s.dugmeDolu}`}>
          Ana Sayfaya Dön
        </a>
      </div>
    </div>
  );
}
