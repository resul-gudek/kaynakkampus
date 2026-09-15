import type { Metadata } from "next";
import Link from "next/link";
import KoclukFormu from "../KoclukFormu";
import s from "../egitim-basvurusu.module.css";

export const metadata: Metadata = {
  title: "Eğitim Koçluğu Başvurusu – Kaynak Kampüs",
  description:
    "Ders çalışma düzeni, planlama, hedef belirleme ve akademik takip için eğitim koçluğu başvurusu yapın; sizinle iletişime geçelim.",
  alternates: { canonical: "/egitim-basvurusu/egitim-koclugu" },
};

export default function KoclukBasvuruSayfasi() {
  return (
    <>
      <section className={`${s.hero} ${s.heroDar}`}>
        <div className="container">
          <Link href="/egitim-basvurusu" className={s.geriBag}>
            <span aria-hidden="true">←</span> Eğitim türünü değiştir
          </Link>
          <h1>Eğitim Koçluğu Başvurusu</h1>
          <p>Dört kısa adım; yaklaşık iki dakika sürer. Bilgileriniz yalnız başvurunuzu değerlendirmek için kullanılır.</p>
        </div>
      </section>
      <section className={s.formGovde}>
        <div className="container">
          <KoclukFormu />
        </div>
      </section>
    </>
  );
}
