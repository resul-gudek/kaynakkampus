"use client";

import { useActionState, useState } from "react";
import { girisYapAction, type GirisSonuc } from "./actions";
import stil from "./giris.module.css";

/* Hesap türü giriş bilgisinin parçasıdır (bkz. lib/auth.ts): seçilen sekme
   hesabın türüyle eşleşmeli. Tür bir ROL DEĞİL, rol kümesidir — "Eğitimci"
   sekmesinden hem eğitim koçu hem öğretmen girer ve ikisi de aynı eğitimci
   paneline düşer. Roller yönetici panelinde ayrı yönetilmeye devam eder. */
const TURLER = [
  { tur: "egitimci", etiket: "🎓 Eğitimci" },
  { tur: "ogrenci", etiket: "📚 Öğrenci" },
  { tur: "admin", etiket: "🛠️ Yönetici" },
];

function KullaniciIkon() {
  return (
    <svg className={stil.girdiIkon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.6-3.4 4.6-5 8-5s6.4 1.6 8 5" />
    </svg>
  );
}

function KilitIkon() {
  return (
    <svg className={stil.girdiIkon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function GozIkon({ acik }: { acik: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {acik && <path d="M4 4l16 16" />}
    </svg>
  );
}

export default function GirisForm() {
  const [tur, setTur] = useState("egitimci");
  const [sifreAcik, setSifreAcik] = useState(false);
  const [sonuc, eylem, bekliyor] = useActionState<GirisSonuc | undefined, FormData>(
    girisYapAction,
    undefined
  );

  return (
    <>
      <div className={stil.rolSecim} role="tablist">
        {TURLER.map((t) => (
          <button
            key={t.tur}
            type="button"
            role="tab"
            aria-selected={tur === t.tur}
            className={tur === t.tur ? stil.rolBtnAktif : stil.rolBtn}
            onClick={() => setTur(t.tur)}
          >
            {t.etiket}
          </button>
        ))}
      </div>

      {sonuc?.hata && (
        <div className={stil.hataKutu} role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3 2.5 20h19L12 3Z" />
            <path d="M12 10v4.5" />
            <path d="M12 17.4v.1" />
          </svg>
          {sonuc.hata}
        </div>
      )}

      <form action={eylem} autoComplete="off">
        <input type="hidden" name="tur" value={tur} />
        <div className={stil.formGrup}>
          <label htmlFor="kullanici">Kullanıcı Adı</label>
          <div className={stil.girdiSarici}>
            <KullaniciIkon />
            <input
              type="text"
              id="kullanici"
              name="kullanici"
              className={stil.girdi}
              placeholder="kullanıcı adınız"
              required
            />
          </div>
        </div>
        <div className={stil.formGrup}>
          <label htmlFor="sifre">Şifre</label>
          <div className={stil.girdiSarici}>
            <KilitIkon />
            <input
              type={sifreAcik ? "text" : "password"}
              id="sifre"
              name="sifre"
              className={stil.girdiSifre}
              placeholder="••••••"
              required
            />
            <button
              type="button"
              className={stil.sifreGoz}
              onClick={() => setSifreAcik((a) => !a)}
              aria-label={sifreAcik ? "Şifreyi gizle" : "Şifreyi göster"}
            >
              <GozIkon acik={sifreAcik} />
            </button>
          </div>
        </div>
        <button type="submit" className={`btn btn-primary ${stil.girisBtn}`} disabled={bekliyor}>
          {bekliyor ? (
            <>
              <span className={stil.spinner} aria-hidden="true" />
              Giriş yapılıyor…
            </>
          ) : (
            "Giriş Yap →"
          )}
        </button>
      </form>
    </>
  );
}
