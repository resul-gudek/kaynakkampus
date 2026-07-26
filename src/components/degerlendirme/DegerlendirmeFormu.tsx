"use client";

/* Ders sonrası değerlendirme formu — yön (kocOgrenci / ogrenciKoc) meta'dan
   çizilir. Mevcut kayıt varsa alanlar dolu gelir (düzenleme). */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { degerlendirmeKaydet } from "@/actions/degerlendirme";
import { alanlarByYon, genelPuanEtiketi, type DegerlendirmeS } from "./alanlar";
import Yildiz from "./Yildiz";
import s from "./degerlendirme.module.css";

type Cevaplar = Record<string, string | number>;

function ilkDeger(mevcut: DegerlendirmeS | undefined): Cevaplar {
  const c: Cevaplar = {};
  if (mevcut) {
    for (const [k, v] of Object.entries(mevcut.veri)) {
      if (typeof v === "string" || typeof v === "number") c[k] = v;
    }
    c.puan = mevcut.puan || 0;
  }
  return c;
}

export default function DegerlendirmeFormu({
  ozelDersId,
  yon,
  mevcut,
  onKapat,
}: {
  ozelDersId: string;
  yon: string;
  mevcut?: DegerlendirmeS;
  onKapat?: () => void;
}) {
  const router = useRouter();
  const alanlar = alanlarByYon(yon);
  const [cevaplar, setCevaplar] = useState<Cevaplar>(() => ilkDeger(mevcut));
  const [bekliyor, baslat] = useTransition();

  function ayarla(anahtar: string, deger: string | number) {
    setCevaplar((c) => ({ ...c, [anahtar]: deger }));
  }

  function gonder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    baslat(async () => {
      const sonuc = await degerlendirmeKaydet(ozelDersId, cevaplar);
      if (sonuc.hata) {
        alert(sonuc.hata);
        return;
      }
      onKapat?.();
      router.refresh();
    });
  }

  return (
    <form className={s.form} onSubmit={gonder}>
      <div className={s.izgara}>
        {alanlar.map((a) => (
          <div key={a.anahtar} className={s.grup}>
            <label htmlFor={a.tip === "puan" ? undefined : `${yon}-${a.anahtar}`}>{a.etiket}</label>
            {a.tip === "puan" && (
              <Yildiz
                ad={a.etiket}
                deger={Number(cevaplar[a.anahtar]) || 0}
                onDegisim={(v) => ayarla(a.anahtar, v)}
                devreDisi={bekliyor}
              />
            )}
            {a.tip === "secim" && (
              <select
                id={`${yon}-${a.anahtar}`}
                value={String(cevaplar[a.anahtar] ?? "")}
                onChange={(e) => ayarla(a.anahtar, e.target.value)}
                disabled={bekliyor}
                required
              >
                <option value="" disabled>
                  Seçiniz…
                </option>
                {a.secenekler?.map((o) => (
                  <option key={o.deger} value={o.deger}>
                    {o.etiket}
                  </option>
                ))}
              </select>
            )}
            {a.tip === "metin" && (
              <textarea
                id={`${yon}-${a.anahtar}`}
                value={String(cevaplar[a.anahtar] ?? "")}
                onChange={(e) => ayarla(a.anahtar, e.target.value)}
                disabled={bekliyor}
                rows={2}
              />
            )}
          </div>
        ))}
      </div>

      <div className={`${s.grup} ${s.genelPuan}`}>
        <label>{genelPuanEtiketi(yon)}</label>
        <Yildiz
          ad={genelPuanEtiketi(yon)}
          deger={Number(cevaplar.puan) || 0}
          onDegisim={(v) => ayarla("puan", v)}
          devreDisi={bekliyor}
        />
      </div>

      <div className={s.formAlt}>
        <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
          {mevcut ? "Değerlendirmeyi Güncelle" : "Değerlendirmeyi Kaydet"}
        </button>
        {onKapat && (
          <button
            type="button"
            className="btn btn-outline btn-kucuk"
            disabled={bekliyor}
            onClick={onKapat}
          >
            Vazgeç
          </button>
        )}
      </div>
    </form>
  );
}
