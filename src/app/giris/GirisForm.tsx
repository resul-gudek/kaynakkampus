"use client";

import { useActionState, useState } from "react";
import { girisYapAction, type GirisSonuc } from "./actions";
import stil from "./giris.module.css";

const ROLLER = [
  { rol: "koc", etiket: "🎓 Öğretmen" },
  { rol: "ogrenci", etiket: "📚 Öğrenci" },
  { rol: "admin", etiket: "🛠️ Yönetici" },
];

export default function GirisForm() {
  const [rol, setRol] = useState("koc");
  const [sonuc, eylem, bekliyor] = useActionState<GirisSonuc | undefined, FormData>(
    girisYapAction,
    undefined
  );

  return (
    <>
      <div className={stil.rolSecim} role="tablist">
        {ROLLER.map((r) => (
          <button
            key={r.rol}
            type="button"
            role="tab"
            aria-selected={rol === r.rol}
            className={rol === r.rol ? stil.rolBtnAktif : stil.rolBtn}
            onClick={() => setRol(r.rol)}
          >
            {r.etiket}
          </button>
        ))}
      </div>

      {sonuc?.hata && <div className={stil.hataKutu}>{sonuc.hata}</div>}

      <form action={eylem} autoComplete="off">
        <input type="hidden" name="rol" value={rol} />
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
