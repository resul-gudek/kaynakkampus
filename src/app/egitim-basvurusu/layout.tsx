import DuyuruSerit from "@/components/site/DuyuruSerit";
import SiteAltBilgi from "@/components/site/SiteAltBilgi";
import SiteBaslik from "@/components/site/SiteBaslik";
import SiteOlcum from "@/components/site/SiteOlcum";

/* Eğitim Başvurusu kabuğu — public site başlığı ve alt bilgisiyle sarılır.
   Oturum gerektirmez; panellerden bağımsızdır (bkz. lib/egitim-basvurusu.ts). */
export default function EgitimBasvurusuLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteOlcum />
      <DuyuruSerit />
      <SiteBaslik />
      <main>{children}</main>
      <SiteAltBilgi />
    </>
  );
}
