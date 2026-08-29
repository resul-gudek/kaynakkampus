import Link from "next/link";
import { ILETISIM_EPOSTA } from "@/lib/site";
import SosyalIkonlar from "./SosyalIkonlar";
import s from "./site-alt.module.css";

/* Ana sayfadaki (public/index.html) .site-alt bloğunun React ikizi —
   kolon ve bağlantı listesi orayla AYNI tutulmalıdır. */

export default function SiteAltBilgi() {
  return (
    <footer className={s.alt}>
      <div className="container">
        <div className={s.izgara}>
          <div className={s.marka}>
            <div className={s.markaAd}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/kaynak-kampus-logo-64.png"
                srcSet="/assets/kaynak-kampus-logo-64.png 1x, /assets/kaynak-kampus-logo-128.webp 2x"
                width={64}
                height={64}
                loading="lazy"
                alt="Kaynak Kampüs Logosu"
              />
              Kaynak <span>Kampüs</span>
            </div>
            <p>
              Güçlü Kaynak, Sağlam Gelecek. Öğrenciye, öğretmene ve ebeveyne yönelik ücretsiz
              araçlar, rehber yazılar ve güncel sınav takvimi.
            </p>
            <div className={s.iletisim}>
              <span>Bize ulaşın</span>
              <a className={s.eposta} href={`mailto:${ILETISIM_EPOSTA}`}>{ILETISIM_EPOSTA}</a>
              <Link className={s.mesajGonder} href="/iletisim">Formdan mesaj gönder →</Link>
            </div>
            <div className={s.sosyalBlok}>
              <span className={s.sosyalBaslik}>Bizi takip edin</span>
              <SosyalIkonlar className={s.sosyal} />
            </div>
          </div>

          <div className={s.kolon}>
            <h4>Araçlar</h4>
            <ul>
              <li><a href="/coklu-zeka-testi.html">Çoklu Zekâ Testi</a></li>
              <li><a href="/oyunlar.html">Eğitim Oyunları</a></li>
              <li><a href="/odev-olustur.html">Ödev Oluştur</a></li>
              <li><a href="/bep-olustur.html">BEP Oluştur</a></li>
              <li><a href="/ders-programi.html">Ders Programı</a></li>
              {/* Etkinlikler menüden gizli (kullanıcı kararı) — statik alt bilgide de hidden */}
              <li hidden><a href="/etkinlikler.html">Etkinlikler</a></li>
            </ul>
          </div>

          <div className={s.kolon}>
            <h4>Sınavlar</h4>
            <ul>
              <li><a href="/sinav-takvimi.html">Sınav Takvimi</a></li>
              <li><a href="/sinav-takvimi.html#2027-lgs-bekleniyor">LGS Hazırlık</a></li>
              <li><a href="/sinav-takvimi.html#2027-yks-bekleniyor">YKS Hazırlık</a></li>
              <li><a href="/haberler.html">Haberler</a></li>
            </ul>
          </div>

          <div className={s.kolon}>
            <h4>Kurum</h4>
            <ul>
              <li><a href="/hakkimizda.html">Hakkımızda</a></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/basvuru">Aramıza Katıl</Link></li>
              <li><Link href="/giris">Giriş Yap</Link></li>
              <li><a href="/gizlilik.html">Gizlilik ve Çerezler</a></li>
            </ul>
          </div>
        </div>

        <div className={s.telif}>
          <span>© {new Date().getFullYear()} Kaynak Kampüs · Tüm hakları saklıdır.</span>
          <span>Türkiye&apos;de 🇹🇷 ile tasarlandı</span>
        </div>
      </div>
    </footer>
  );
}
