import { prisma } from "@/lib/prisma";
import { signOut } from "@/lib/auth";
import { aktifKullanici } from "@/lib/oturum";
import { rolNavigasyonu, ROL_ETIKETLERI } from "@/lib/navigasyon";
import { egitmenMi, type Rol } from "@/lib/sabitler";
import PanelKabuk from "@/components/panel/PanelKabuk";
import PushKur from "@/components/panel/PushKur";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const kullanici = await aktifKullanici();
  const rol = kullanici.rol as Rol;
  /* Bildirim: eğitmen (koç/öğretmen), öğrenci ve yönetici (yöneticiye ders
     değerlendirmeleri düşer). Cihaz push'u bildirim alan her rolde açıktır;
     mesajlaşma yalnız eğitmen/öğrenci. */
  const bildirimliRol = egitmenMi(rol) || rol === "ogrenci" || rol === "admin";
  const dersRolu = egitmenMi(rol) || rol === "ogrenci";
  const [okunmamis, okunmamisMesaj] = await Promise.all([
    bildirimliRol
      ? prisma.bildirim.count({ where: { aliciId: kullanici.id, okundu: false } })
      : Promise.resolve(0),
    dersRolu
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
