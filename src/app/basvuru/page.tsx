import type { Metadata } from "next";
import Link from "next/link";
import stil from "./basvuru.module.css";

export const metadata: Metadata = {
  title: "Aramıza Katıl – Kaynak Kampüs",
  description:
    "Kaynak Kampüs'e öğretmen, öğrenci veya eğitim koçu olarak katılmak için ön mülakat başvuru formunu doldurun.",
};

const SECENEKLER = [
  {
    tur: "ogretmen",
    ikon: "👩‍🏫",
    baslik: "Öğretmen olarak başvur",
    aciklama:
      "Branşınız, deneyiminiz ve uygunluğunuzla ilgili ön mülakat formunu doldurun; belge ve tanıtım videonuzu paylaşın.",
  },
  {
    tur: "ogrenci",
    ikon: "🎓",
    baslik: "Öğrenci olarak başvur",
    aciklama:
      "Eğitim ihtiyacınızı, hedeflerinizi ve uygunluğunuzu paylaşın; size en uygun desteği planlayalım.",
  },
  {
    tur: "koc",
    ikon: "🧭",
    baslik: "Eğitim koçu olarak başvur",
    aciklama:
      "Koçluk deneyiminizi, çalıştığınız yaş gruplarını ve yaklaşımınızı anlatın; ön mülakat sürecine katılın.",
  },
] as const;

export default function BasvuruSecimPage() {
  return (
    <div className={stil.giris}>
      <h1 className={stil.girisBaslik}>
        Aramıza <span>Katıl</span>
      </h1>
      <p className={stil.girisAlt}>
        Nasıl katılmak istediğinizi seçin. Seçiminize uygun ön mülakat formunu birkaç aşamada
        doldurabilirsiniz.
      </p>

      <div className={stil.secimGrid}>
        {SECENEKLER.map((s) => (
          <div key={s.tur} className={stil.secimKart}>
            <span className={stil.secimIkon}>{s.ikon}</span>
            <h3>{s.baslik}</h3>
            <p>{s.aciklama}</p>
            <Link href={`/basvuru/${s.tur}`} className="btn btn-primary">
              Başvuruya Başla →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
