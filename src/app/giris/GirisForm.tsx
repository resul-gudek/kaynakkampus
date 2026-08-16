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

export default function GirisForm() {
  const [tur, setTur] = useState("egitimci");
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

      {sonuc?.hata && <div className={stil.hataKutu}>{sonuc.hata}</div>}

      <form action={eylem} autoComplete="off">
        <input type="hidden" name="tur" value={tur} />
        <div className={stil.formGrup}>
          <label htmlFor="kullanici">Kullanıcı Adı</label>
          <input type="text" id="kullanici" name="kullanici" placeholder="kullanıcı adınız" required />
        </div>
        <div className={stil.formGrup}>
          <label htmlFor="sifre">Şifre</label>
          <input type="password" id="sifre" name="sifre" placeholder="••••••" required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={bekliyor}>
          {bekliyor ? "Giriş yapılıyor…" : "Giriş Yap →"}
        </button>
      </form>
    </>
  );
}
