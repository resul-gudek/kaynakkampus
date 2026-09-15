import type { Metadata } from "next";
import Link from "next/link";
import s from "./egitim-basvurusu.module.css";

export const metadata: Metadata = {
  title: "Eğitim Başvurusu – Kaynak Kampüs",
  description:
    "Özel ders (İngilizce, Almanca, ilkokul ders desteği, Din ve Kur’an eğitimi, değerler eğitimi) veya eğitim koçluğu için kısa başvuru formunu doldurun; sizinle iletişime geçelim.",
  alternates: { canonical: "/egitim-basvurusu" },
};

const KARTLAR = [
  {
    href: "/egitim-basvurusu/ozel-ders",
    etiket: "Bireysel ders",
    baslik: "Özel Ders Başvurusu",
    aciklama: "Öğrencinin yaşına ve sınıfına uygun eğitimi seçin; seviyesine göre ders planı için sizinle görüşelim.",
    konular: ["İngilizce", "Almanca", "İlkokul Ders Desteği", "Din ve Kur’an Eğitimi", "Değerler Eğitimi"],
    ikon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M9 7h7M9 11h5" />
      </svg>
    ),
  },
  {
    href: "/egitim-basvurusu/egitim-koclugu",
    etiket: "Süreç desteği",
    baslik: "Eğitim Koçluğu Başvurusu",
    aciklama: "Çalışma düzeni, hedef ve takip için öğrenciyle birlikte yürüyen bir koçluk süreci planlayalım.",
    konular: ["Planlama", "Hedef Belirleme", "Çalışma Düzeni", "Akademik Takip"],
    ikon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5z" />
      </svg>
    ),
  },
];

export default function EgitimBasvurusuSayfasi() {
  return (
    <>
      <section className={s.hero}>
        <div className="container">
          <span className={s.etiket}>Başvuru</span>
          <h1>Eğitim Başvurusu</h1>
          <p>
            İhtiyacınıza uygun eğitim desteğini seçerek kısa başvuru formunu doldurun. Başvurunuzu
            inceledikten sonra sizinle iletişime geçelim.
          </p>
        </div>
      </section>

      <section className={s.govde}>
        <div className="container">
          <div className={s.secimIzgara}>
            {KARTLAR.map((k) => (
              <Link key={k.href} href={k.href} className={s.secimKart}>
                <div className={s.secimUst}>
                  <span className={s.secimEtiket}>{k.etiket}</span>
                  <span className={s.secimIkon}>{k.ikon}</span>
                </div>
                <h2>{k.baslik}</h2>
                <p>{k.aciklama}</p>
                <ul className={s.konuListe} aria-label="Kapsam">
                  {k.konular.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <span className={s.secimEylem}>
                  Başvuruya başla <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
          <p className={s.altNot}>
            Formu doldurmadan önce sormak istediğiniz bir şey varsa <Link href="/iletisim">iletişim formundan</Link> yazabilirsiniz.
          </p>
        </div>
      </section>
    </>
  );
}
