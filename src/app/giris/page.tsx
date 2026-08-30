import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROL_ANASAYFA } from "@/lib/auth.config";
import GirisForm from "./GirisForm";
import stil from "./giris.module.css";

export const metadata: Metadata = { title: "Giriş Yap – Kaynak Kampüs" };

export default async function GirisPage() {
  // Zaten oturum açıksa doğrudan ilgili panele geç (legacy davranışı)
  const oturum = await auth();
  if (oturum?.user?.rol) {
    redirect(ROL_ANASAYFA[oturum.user.rol] ?? "/");
  }

  return (
    <>
      <header className={stil.ustBar}>
        <div className="container">
          <div className={stil.navIc}>
            <Link href="/" className={stil.logo}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/kaynak-kampus-logo.png" alt="Kaynak Kampüs Logosu" className={stil.logoIkon} />
              Kaynak <span>Kampüs</span>
            </Link>
            <Link href="/" className={stil.geriLink}>← Ana Sayfaya Dön</Link>
          </div>
        </div>
      </header>

      <main className={stil.sahne}>
        <div className={stil.kart}>
          <aside className={stil.marka}>
            <div className={stil.markaLogo}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/kaynak-kampus-logo.png" alt="" />
              <b>Kaynak <span>Kampüs</span></b>
            </div>

            <div className={stil.markaSoz}>
              <h2 className={stil.markaBaslik}>Yeniden hoş geldin!</h2>
              <p className={stil.markaMetin}>
                Panele giriş yaparak derslerini, programını ve duyuruları
                tek yerden takip edebilirsin.
              </p>
            </div>

            {/* Dekoratif anka tüyü */}
            <svg className={stil.tuy} viewBox="0 0 200 200" fill="none" aria-hidden="true">
              <path
                d="M172 22C120 30 74 62 52 128l-10 34 32-14c60-28 88-78 100-118l4-14-6 6Z"
                fill="currentColor" opacity=".08"
              />
              <path
                d="M40 164C70 106 118 56 172 24"
                stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity=".16"
              />
              <path
                d="M74 118c14-4 28-12 40-24M94 88c12-4 22-10 30-18M114 62c8-3 15-7 21-12"
                stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".14"
              />
            </svg>
          </aside>

          <section className={stil.formYan}>
            <h1>
              Panele <span>Giriş Yap</span>
            </h1>
            <p className={stil.alt}>Hesap türünü seç, bilgilerinle giriş yap.</p>

            <GirisForm />

            <p className={stil.yardim}>
              Giriş yapamıyor musun? <Link href="/iletisim">Bize ulaş</Link>
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
