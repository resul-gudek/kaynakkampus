import type { Metadata } from "next";
import { aktifKullanici } from "@/lib/oturum";

export const metadata: Metadata = { title: "Koç Paneli – Kaynak Akademi" };

export default async function KocPanel() {
  const koc = await aktifKullanici("koc");
  return (
    <main className="container">
      <div className="panel-bas">
        <h1>
          Merhaba, <span>{koc.ad}</span> 👋
        </h1>
        <p>Koç paneli Faz 4&apos;te dolacak.</p>
      </div>
    </main>
  );
}
