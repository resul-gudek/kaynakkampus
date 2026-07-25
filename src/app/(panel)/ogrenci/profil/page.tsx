import type { Metadata } from "next";
import { aktifKullanici } from "@/lib/oturum";
import { profilAyristir } from "@/lib/hesap";
import ProfilBolumu from "@/components/ogrenci/ProfilBolumu";

export const metadata: Metadata = { title: "Seviye Formum – Kaynak Akademi" };

export default async function ProfilSayfasi() {
  const ogrenci = await aktifKullanici("ogrenci");

  return (
    <main className="container">
      <ProfilBolumu ogrenciId={ogrenci.id} profil={profilAyristir(ogrenci.profil)} />
    </main>
  );
}
