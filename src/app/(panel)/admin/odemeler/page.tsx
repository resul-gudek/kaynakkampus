import type { Metadata } from "next";
import { aktifKullanici } from "@/lib/oturum";
import { odemeTaraflari, yoneticiOdemeleri } from "@/lib/odeme-sunucu";
import OdemeYonetimi from "./OdemeYonetimi";

export const metadata: Metadata = { title: "Ödemeler – Kaynak Kampüs" };

/* Yöneticinin tam finansal görünümü — öğrencinin ödediği tutar, öğretmene
   ödenecek tutar, platforma kalan tutar, durumlar ve geçmiş.
   Rota koruması: proxy.ts "/admin/:path*" + aktifKullanici("admin");
   yazma eylemleri ayrıca actions/odeme.ts içinde rol doğrular. */
export default async function AdminOdemelerSayfasi() {
  await aktifKullanici("admin");
  const [odemeler, taraflar] = await Promise.all([yoneticiOdemeleri(), odemeTaraflari()]);

  return (
    <main className="container" style={{ maxWidth: 1300, paddingBottom: 40 }}>
      <div className="panel-bas">
        <h1>
          Öde<span>meler</span>
        </h1>
        <p>
          Öğrenci tahsilatları, öğretmen ödemeleri ve platform payı. Bu sayfadaki finansal
          döküm yalnızca yöneticilere görünür.
        </p>
      </div>
      <OdemeYonetimi
        odemeler={odemeler}
        ogrenciler={taraflar.ogrenciler}
        koclar={taraflar.koclar}
      />
    </main>
  );
}
