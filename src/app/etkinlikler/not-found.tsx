import Link from "next/link";
import s from "./etkinlik.module.css";

/* Etkinlik arşivine özel 404: olmayan ya da yayından kaldırılmış bir klasör
   adresine gelen ziyaretçiyi kör bir sayfada bırakmaz; kabuk korunur. */
export default function EtkinlikBulunamadi() {
  return (
    <main>
      <section className={s.sahneBas}>
        <div className="container">
          <span className={s.rozet}>🗂 Etkinlik Arşivi</span>
          <h1>
            Bu klasörü <span>bulamadık</span>
          </h1>
          <p>
            Aradığınız klasör kaldırılmış ya da adres yanlış yazılmış olabilir. Arşivin başından
            gezinmeye devam edebilirsiniz.
          </p>
        </div>
      </section>

      <section className={s.govde}>
        <div className="container">
          <div className={s.bos}>
            <span aria-hidden>🔎</span>
            <b>Klasör bulunamadı.</b>
            <p>Sınıf ve ders klasörlerine arşiv ana sayfasından ulaşabilirsiniz.</p>
          </div>
          <Link href="/etkinlikler" className="btn btn-primary">
            Etkinlik arşivi →
          </Link>
        </div>
      </section>
    </main>
  );
}
