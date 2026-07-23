import type { Metadata } from "next";
import { aktifKullanici } from "@/lib/oturum";

export const metadata: Metadata = { title: "Yönetim – Kaynak Akademi" };

export default async function AdminPanel() {
  const admin = await aktifKullanici("admin");
  return (
    <main className="container">
      <div className="panel-bas">
        <h1>
          Yönetim <span>Paneli</span>
        </h1>
        <p>Hoş geldin, {admin.ad}. Koç yönetimi Faz 7&apos;de dolacak.</p>
      </div>
    </main>
  );
}
