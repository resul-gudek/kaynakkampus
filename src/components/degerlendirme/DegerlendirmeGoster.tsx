/* Salt-okunur değerlendirme özeti. Server bileşenlerinde de kullanılabilir
   (istemci-özel API yok). Öğrenci/öğretmen/veli/admin yüzeylerinde ortak.

   mod="ozet": yalnızca puan/seçim alanları ve genel puan gösterilir, serbest
   metin yorumlar gizlenir. Veli yüzeyinde kullanılır — bkz. gizlilik kuralı
   (yazarın metin yorumları yalnızca yönetimde tam görünür). */

import { alanlarByYon, genelPuanEtiketi, secenekEtiketi, type DegerlendirmeS } from "./alanlar";
import s from "./degerlendirme.module.css";

function YildizSalt({ puan }: { puan: number }) {
  const n = Math.max(0, Math.min(5, Math.round(puan)));
  return (
    <span className={s.yildizSalt} aria-label={`${n}/5`}>
      {"★".repeat(n)}
      <span className={s.yildizSaltBos}>{"★".repeat(5 - n)}</span>
    </span>
  );
}

export default function DegerlendirmeGoster({
  deger,
  mod = "tam",
}: {
  deger: DegerlendirmeS;
  mod?: "tam" | "ozet";
}) {
  const alanlar = alanlarByYon(deger.yon);

  return (
    <div className={s.ozet}>
      {alanlar.map((a) => {
        const v = deger.veri[a.anahtar];
        const bos = v === undefined || v === null || v === "";
        if (a.tip === "metin") {
          if (bos || mod === "ozet") return null;
          return (
            <div key={a.anahtar} className={s.satir}>
              <span className={s.satirEtiket}>{a.etiket}</span>
              <span className={`${s.satirDeger} ${s.metinDeger}`}>{String(v)}</span>
            </div>
          );
        }
        return (
          <div key={a.anahtar} className={s.satir}>
            <span className={s.satirEtiket}>{a.etiket}</span>
            <span className={s.satirDeger}>
              {a.tip === "puan" ? (
                <YildizSalt puan={Number(v) || 0} />
              ) : (
                <span className={s.rozetSecim}>{secenekEtiketi(a, v)}</span>
              )}
            </span>
          </div>
        );
      })}
      <div className={s.genelSatir}>
        <span>{genelPuanEtiketi(deger.yon)}</span>
        <YildizSalt puan={deger.puan} />
      </div>
    </div>
  );
}
