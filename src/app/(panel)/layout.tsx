import { prisma } from "@/lib/prisma";
import { signOut } from "@/lib/auth";
import { aktifKullanici } from "@/lib/oturum";
import { rolNavigasyonu, ROL_ETIKETLERI } from "@/lib/navigasyon";
import type { Rol } from "@/lib/sabitler";
import PanelKabuk from "@/components/panel/PanelKabuk";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const kullanici = await aktifKullanici();
  const rol = kullanici.rol as Rol;
  const okunmamis =
    rol === "admin"
      ? 0
      : await prisma.bildirim.count({ where: { aliciId: kullanici.id, okundu: false } });

  async function cikisYap() {
    "use server";
    await signOut({ redirectTo: "/giris" });
  }

  return (
    <PanelKabuk
      kullanici={{ ad: kullanici.ad, etiket: ROL_ETIKETLERI[rol] }}
      kalemler={rolNavigasyonu(rol)}
      okunmamis={okunmamis}
      cikisAction={cikisYap}
    >
      {children}
    </PanelKabuk>
  );
}
