import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { ROL_ANASAYFA } from "@/lib/auth.config";
import BildirimListe, { type BildirimGorunum } from "./BildirimListe";
import stil from "./bildirimler.module.css";

export const metadata: Metadata = { title: "Bildirimler – Kaynak Akademi" };

/* "2026-07-20 14:35" mantığının karşılığı: bugünse "Bugün · 14:35" */
function zamanStr(t: Date): string {
  const istanbul = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const saat = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
  });
  const gun = istanbul.format(t);
  const bugunStr = istanbul.format(new Date());
  return (gun === bugunStr ? "Bugün" : gun) + " · " + saat.format(t);
}

export default async function BildirimlerPage() {
  const kullanici = await aktifKullanici();

  const kayitlar = await prisma.bildirim.findMany({
    where: { aliciId: kullanici.id },
    orderBy: { tarih: "desc" },
  });

  const gorunum: BildirimGorunum[] = kayitlar.map((b) => ({
    id: b.id,
    ikon: b.ikon,
    metin: b.metin,
    zaman: zamanStr(b.tarih),
    okundu: b.okundu,
    hedefTur: b.hedefTur,
    hedefOgrenciId: b.hedefOgrenciId,
    hedefKayitId: b.hedefKayitId,
  }));

  return (
    <main className="container" style={{ maxWidth: 860 }}>
      <div className={stil.panelBas}>
        <h1>
          🔔 <span>Bildirimler</span>
        </h1>
        <Link href={ROL_ANASAYFA[kullanici.rol] ?? "/"} className="btn btn-outline btn-kucuk">
          ← Panele Dön
        </Link>
      </div>
      <BildirimListe bildirimler={gorunum} rol={kullanici.rol} />
    </main>
  );
}
