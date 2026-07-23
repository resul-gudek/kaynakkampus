import type { Metadata } from "next";
import { aktifKullanici } from "@/lib/oturum";

export const metadata: Metadata = { title: "Bildirimler – Kaynak Akademi" };

export default async function BildirimlerPage() {
  await aktifKullanici();
  return (
    <main className="container">
      <div className="panel-bas">
        <h1>
          <span>Bildirimler</span>
        </h1>
        <p>Bildirim listesi Faz 6&apos;da dolacak.</p>
      </div>
    </main>
  );
}
