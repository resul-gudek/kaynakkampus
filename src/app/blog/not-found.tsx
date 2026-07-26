import Link from "next/link";
import s from "./blog.module.css";

/* Blog bölümüne özel 404: yayından kaldırılmış ya da hiç var olmamış bir
   yazı adresine gelen ziyaretçiyi kör bir sayfada bırakmaz, blog kabuğu
   (üst menü + alt bilgi) korunur. */
export default function BlogBulunamadi() {
  return (
    <main>
      <section className={s.sahneBas}>
        <div className="container">
          <span className={s.rozet}>📰 Kaynak Kampüs Blog</span>
          <h1>
            Bu yazıyı <span>bulamadık</span>
          </h1>
          <p>
            Aradığınız yazı taşınmış, yayından kaldırılmış ya da adres yanlış yazılmış olabilir.
            Tüm yazılara göz atarak aradığınız içeriği bulabilirsiniz.
          </p>
        </div>
      </section>

      <section className={s.govde}>
        <div className="container">
          <div className={s.bos}>
            <span aria-hidden>🔎</span>
            <b>Yazı bulunamadı.</b>
            <p>Blog ana sayfasından kategorilere göz atabilir ya da arama yapabilirsiniz.</p>
          </div>
          <Link href="/blog" className="btn btn-primary">
            Tüm blog yazıları →
          </Link>
        </div>
      </section>
    </main>
  );
}
