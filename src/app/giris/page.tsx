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
          <h1>
            Panele <span>Giriş Yap</span>
          </h1>
          <p className={stil.alt}>Hesap türünü seç, bilgilerinle giriş yap.</p>

          <GirisForm />

          <div className={stil.demoKutu}>
            <strong>Demo hesaplar:</strong>
            <br />
            Öğretmen → <code>koc1</code> / <code>1234</code>
            <br />
            Öğrenci → <code>ogrenci1</code> / <code>1234</code>
          </div>
        </div>
      </main>
    </>
  );
}
