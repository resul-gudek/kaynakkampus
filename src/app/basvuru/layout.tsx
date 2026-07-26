import Link from "next/link";
import stil from "./basvuru.module.css";

/* Public başvuru kabuğu — oturum gerektirmez. */
export default function BasvuruLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className={stil.ustBar}>
        <div className={`container ${stil.ustBarIc}`}>
          <Link href="/" className={stil.logo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/kaynak-kampus-logo.png" alt="Kaynak Kampüs" />
            Kaynak <span>Kampüs</span>
          </Link>
          <Link href="/giris" className={stil.geriLink}>
            Giriş Yap →
          </Link>
        </div>
      </header>
      <main className={stil.sahne}>
        <div className="container">{children}</div>
      </main>
    </>
  );
}
