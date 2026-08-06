import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { ROL_ANASAYFA } from "@/lib/auth.config";
import { rolTurleri, tercihHaritasi } from "@/lib/bildirim-tercih";
import BildirimListe, { type BildirimGorunum } from "./BildirimListe";
import BildirimAyarlari, { type CihazGorunum } from "./BildirimAyarlari";
import stil from "./bildirimler.module.css";

export const metadata: Metadata = { title: "Bildirimler – Kaynak Kampüs" };

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

/* "Mozilla/5.0 (Windows NT 10.0; …) Chrome/151…" → "Windows · Chrome" */
function cihazAdi(userAgent: string): string {
  const ua = userAgent || "";
  const sistem = /Android/i.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/i.test(ua)
      ? "iPhone / iPad"
      : /Windows/i.test(ua)
        ? "Windows"
        : /Macintosh|Mac OS X/i.test(ua)
          ? "Mac"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Bilinmeyen cihaz";
  // Sıra önemli: Edge/Opera kendilerini Chrome olarak da tanıtır
  const tarayici = /Edg\//i.test(ua)
    ? "Edge"
    : /OPR\/|Opera/i.test(ua)
      ? "Opera"
      : /SamsungBrowser/i.test(ua)
        ? "Samsung Internet"
        : /Chrome\//i.test(ua)
          ? "Chrome"
          : /Firefox\//i.test(ua)
            ? "Firefox"
            : /Safari\//i.test(ua)
              ? "Safari"
              : "";
  return tarayici ? `${sistem} · ${tarayici}` : sistem;
}

export default async function BildirimlerPage() {
  const kullanici = await aktifKullanici();

  const [kayitlar, tercihKayitlari, abonelikler] = await Promise.all([
    prisma.bildirim.findMany({
      where: { aliciId: kullanici.id },
      orderBy: { tarih: "desc" },
    }),
    prisma.bildirimTercih.findMany({
      where: { kullaniciId: kullanici.id },
      select: { tur: true, push: true },
    }),
    prisma.pushAbonelik.findMany({
      where: { kullaniciId: kullanici.id },
      orderBy: { olusturma: "desc" },
      select: { id: true, tarayici: true, olusturma: true },
    }),
  ]);

  const turler = rolTurleri(kullanici.rol);
  const tercihler = tercihHaritasi(tercihKayitlari);
  const cihazlar: CihazGorunum[] = abonelikler.map((a) => ({
    id: a.id,
    ad: cihazAdi(a.tarayici),
    eklendi: new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(a.olusturma),
  }));

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
      {turler.length > 0 && (
        <BildirimAyarlari turler={turler} tercihler={tercihler} cihazlar={cihazlar} />
      )}
    </main>
  );
}
