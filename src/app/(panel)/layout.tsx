import { prisma } from "@/lib/prisma";
import { signOut } from "@/lib/auth";
import { aktifKullanici } from "@/lib/oturum";
import { rolNavigasyonu, ROL_ETIKETLERI } from "@/lib/navigasyon";
import type { Rol } from "@/lib/sabitler";
import PanelKabuk from "@/components/panel/PanelKabuk";
import PushKur from "@/components/panel/PushKur";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const kullanici = await aktifKullanici();
  const rol = kullanici.rol as Rol;
  const bildirimliRol = rol === "koc" || rol === "ogrenci";
  const [okunmamis, okunmamisMesaj] = await Promise.all([
    bildirimliRol
      ? prisma.bildirim.count({ where: { aliciId: kullanici.id, okundu: false } })
      : Promise.resolve(0),
    bildirimliRol
      ? prisma.mesaj.count({ where: { aliciId: kullanici.id, okundu: false } })
      : Promise.resolve(0),
  ]);

  async function cikisYap() {
    "use server";
    await signOut({ redirectTo: "/giris" });
  }

  return (
    <PanelKabuk
      kullanici={{ ad: kullanici.ad, etiket: ROL_ETIKETLERI[rol] }}
      kalemler={rolNavigasyonu(rol)}
      okunmamis={okunmamis}
      okunmamisMesaj={okunmamisMesaj}
      cikisAction={cikisYap}
    >
      {children}
      {bildirimliRol && <PushKur />}
    </PanelKabuk>
  );
}
