import type { Metadata } from "next";
import { aktifKullanici } from "@/lib/oturum";

export const metadata: Metadata = { title: "Öğrenci Paneli – Kaynak Akademi" };

export default async function OgrenciPanel() {
  const ogrenci = await aktifKullanici("ogrenci");
  return (
    <main className="container">
      <div className="panel-bas">
        <h1>
          Merhaba, <span>{ogrenci.ad}</span> 👋
        </h1>
        <p>Öğrenci paneli Faz 5&apos;te dolacak.</p>
      </div>
    </main>
  );
}
