import type { Metadata } from "next";
import Link from "next/link";
import OzelDersFormu from "../OzelDersFormu";
import s from "../egitim-basvurusu.module.css";

export const metadata: Metadata = {
  title: "Özel Ders Başvurusu – Kaynak Kampüs",
  description:
    "İngilizce, Almanca, ilkokul ders desteği, Din ve Kur’an eğitimi veya değerler eğitimi için özel ders başvurusu yapın; sizinle iletişime geçelim.",
  alternates: { canonical: "/egitim-basvurusu/ozel-ders" },
};

export default function OzelDersBasvuruSayfasi() {
  return (
    <>
      <section className={`${s.hero} ${s.heroDar}`}>
        <div className="container">
          <Link href="/egitim-basvurusu" className={s.geriBag}>
            <span aria-hidden="true">←</span> Eğitim türünü değiştir
          </Link>
          <h1>Özel Ders Başvurusu</h1>
          <p>Dört kısa adım; yaklaşık iki dakika sürer. Bilgileriniz yalnız başvurunuzu değerlendirmek için kullanılır.</p>
        </div>
      </section>
      <section className={s.formGovde}>
        <div className="container">
          <OzelDersFormu />
        </div>
      </section>
    </>
  );
}
