/* Boş durum — Kıvılcım'ın panelde göründüğü ilk yer.

   Maskot kuralları (bkz. maskot sunumu, tur 04):
   · Sürtünme anında görünür; boş liste tam olarak o an.
   · En fazla iki cümle, birinci tekil şahıs yok.
   · Tıklanacak bir şey varsa balonda tek eylem olur.
   · Maskot dekoratiftir (aria-hidden); anlamı metin taşır.

   Sunucu bileşeni. Kendi eylemini yönetmesi gereken çağıranlar
   (onClick vb.) eylem yerine children geçebilir. */

import Link from "next/link";
import Kivilcim, { type Ifade } from "./Kivilcim";
import s from "./maskot.module.css";

type Props = {
  baslik: string;
  /** İkinci cümle. Kısa tut; boş liste ekranı okunmuyor. */
  metin?: string;
  ifade?: Ifade;
  boyut?: number;
  eylem?: { etiket: string; href: string };
  /** Maskot istenmeyen yerlerde (aynı ekranda ikinci boş durum) kapatılabilir. */
  maskot?: boolean;
  children?: React.ReactNode;
};

export default function BosDurum({
  baslik,
  metin,
  ifade = "sakin",
  boyut = 76,
  eylem,
  maskot = true,
  children,
}: Props) {
  return (
    <div className={s.bos}>
      {maskot && <Kivilcim ifade={ifade} boyut={boyut} />}
      <p className={s.baslik}>{baslik}</p>
      {metin && <p className={s.metin}>{metin}</p>}
      {eylem && (
        <Link className={s.eylem} href={eylem.href}>
          {eylem.etiket}
        </Link>
      )}
      {children}
    </div>
  );
}
