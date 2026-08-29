import type { Metadata } from "next";
import DuyuruSerit from "@/components/site/DuyuruSerit";
import SiteBaslik from "@/components/site/SiteBaslik";
import SiteAltBilgi from "@/components/site/SiteAltBilgi";
import { ILETISIM_EPOSTA } from "@/lib/site";
import IletisimFormu from "./IletisimFormu";
import s from "./iletisim.module.css";

export const metadata: Metadata = {
  title: "İletişim – Kaynak Kampüs",
  description: "Kaynak Kampüs'e e-posta veya site iletişim formu üzerinden ulaşın.",
  alternates: { canonical: "/iletisim" },
};

export default function IletisimSayfasi() {
  return (
    <>
      <DuyuruSerit />
      <SiteBaslik aktif="/iletisim" />
      <main>
        <section className={s.hero}>
          <div className="container">
            <span className={s.etiket}>Bize ulaşın</span>
            <h1>Size nasıl yardımcı olabiliriz?</h1>
            <p>Sorularınızı, görüşlerinizi veya iş birliği önerilerinizi bize iletin.</p>
          </div>
        </section>

        <section className={s.govde}>
          <div className={`container ${s.izgara}`}>
            <aside className={s.bilgi}>
              <span className={s.bilgiEtiket}>E-posta</span>
              <a href={`mailto:${ILETISIM_EPOSTA}`}>{ILETISIM_EPOSTA}</a>
              <p>Formu kullanmak istemezseniz doğrudan e-posta gönderebilirsiniz.</p>
            </aside>
            <div className={s.formKart}>
              <h2>Mesaj gönderin</h2>
              <p className={s.formGiris}>Formu doldurun; mesajınız doğrudan ekibimize ulaşsın.</p>
              <IletisimFormu />
            </div>
          </div>
        </section>
      </main>
      <SiteAltBilgi />
    </>
  );
}
