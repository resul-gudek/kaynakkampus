import DuyuruSerit from "@/components/site/DuyuruSerit";
import SiteBaslik from "@/components/site/SiteBaslik";
import SiteAltBilgi from "@/components/site/SiteAltBilgi";
import SiteOlcum from "@/components/site/SiteOlcum";

/* Public etkinlik arşivi kabuğu — oturum gerektirmez, ziyaretçi yayındaki
   klasörleri gezer ve PDF'leri açar. Rota koruması src/proxy.ts'teki açık
   liste ile yapılır; /etkinlikler o listede YOKTUR, herkese açıktır. */
export default function EtkinlikLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DuyuruSerit />
      <SiteBaslik aktif="/etkinlikler" />
      <SiteOlcum />
      {children}
      <SiteAltBilgi />
    </>
  );
}
