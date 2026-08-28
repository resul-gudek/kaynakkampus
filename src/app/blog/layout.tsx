import DuyuruSerit from "@/components/site/DuyuruSerit";
import SiteBaslik from "@/components/site/SiteBaslik";
import SiteAltBilgi from "@/components/site/SiteAltBilgi";

/* Public blog kabuğu — oturum gerektirmez, ziyaretçi tüm yazıları okur.
   Rota koruması src/proxy.ts'teki açık liste ile yapılır; /blog o listede
   YOKTUR, dolayısıyla herkese açıktır. */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DuyuruSerit />
      <SiteBaslik aktif="/blog" />
      {children}
      <SiteAltBilgi />
    </>
  );
}
