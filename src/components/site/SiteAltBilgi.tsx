import { Fragment } from "react";
import Link from "next/link";
import { BLOG_KATEGORILERI, BLOG_KATEGORI_ETIKETLERI } from "@/lib/sabitler";
import { SITE_MENU, grupMu } from "@/lib/site-menu";
import s from "./site-alt.module.css";

/** İlk dört kategori alt bilgide kısayol olarak listelenir */
const KATEGORI_KISAYOLLARI = BLOG_KATEGORILERI.slice(0, 4);

export default function SiteAltBilgi() {
  return (
    <footer className={s.alt}>
      <div className="container">
        <div className={s.izgara}>
          <div className={s.marka}>
            <div className={s.markaAd}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/kaynak-kampus-logo.png" alt="Kaynak Kampüs Logosu" />
              Kaynak <span>Kampüs</span>
            </div>
            <p>
              Güçlü Kaynak, Sağlam Gelecek. Öğrenciye, öğretmene ve ebeveyne yönelik rehber
              yazılar, çalışma yöntemleri ve etkinlik önerileri.
            </p>
          </div>

          <div className={s.kolon}>
            <h4>Site</h4>
            <ul>
              {/* Gruplar alt bilgide düz listeye açılır (başlık satırı yok) */}
              {SITE_MENU.map((oge) =>
                grupMu(oge) ? (
                  <Fragment key={oge.ad}>
                    {oge.alt.map((k) => (
                      <li key={k.href}>
                        <a href={k.href}>{k.ad}</a>
                      </li>
                    ))}
                  </Fragment>
                ) : (
                  <li key={oge.href}>
                    <Link href={oge.href}>{oge.ad}</Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className={s.kolon}>
            <h4>Blog Kategorileri</h4>
            <ul>
              {KATEGORI_KISAYOLLARI.map((k) => (
                <li key={k}>
                  <Link href={`/blog?kategori=${k}`}>{BLOG_KATEGORI_ETIKETLERI[k]}</Link>
                </li>
              ))}
              <li>
                <Link href="/blog">Tüm yazılar →</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className={s.telif}>© {new Date().getFullYear()} Kaynak Kampüs · Tüm hakları saklıdır.</div>
      </div>
    </footer>
  );
}
