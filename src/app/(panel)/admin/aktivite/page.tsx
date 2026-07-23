import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import AktivitePaneli, { type Aktivite } from "../AktivitePaneli";

export const metadata: Metadata = { title: "Aktivite Merkezi – Kaynak Akademi" };

const CEVRIMICI_PENCERE_DK = 5;

function zamanStr(t: Date): string {
  const gunFmt = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const saatFmt = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
  });
  const gun = gunFmt.format(t);
  return (gun === gunFmt.format(new Date()) ? "Bugün" : gun) + " · " + saatFmt.format(t);
}

function goreliZaman(t: Date): string {
  const sn = Math.max(0, Math.round((Date.now() - t.getTime()) / 1000));
  if (sn < 60) return "az önce";
  const dk = Math.round(sn / 60);
  if (dk < 60) return `${dk} dk önce`;
  return `${Math.round(dk / 60)} sa önce`;
}

function tarayiciKisalt(ua: string): string {
  if (!ua) return "";
  const tarayici = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("OPR/") || ua.includes("Opera")
      ? "Opera"
      : ua.includes("Firefox/")
        ? "Firefox"
        : ua.includes("Chrome/")
          ? "Chrome"
          : ua.includes("Safari/")
            ? "Safari"
            : ua.includes("curl")
              ? "curl"
              : "Diğer";
  const sistem = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Android")
      ? "Android"
      : ua.includes("iPhone") || ua.includes("iPad")
        ? "iOS"
        : ua.includes("Mac OS")
          ? "macOS"
          : ua.includes("Linux")
            ? "Linux"
            : "";
  return sistem ? `${tarayici} · ${sistem}` : tarayici;
}

export default async function AktiviteSayfasi() {
  await aktifKullanici("admin");

  const simdi = new Date();
  const cevrimiciEsigi = new Date(simdi.getTime() - CEVRIMICI_PENCERE_DK * 60_000);
  const son24s = new Date(simdi.getTime() - 24 * 60 * 60_000);
  const bugunBasi = new Date(simdi);
  bugunBasi.setHours(0, 0, 0, 0);

  const [cevrimici, girisler, son24sAktif, toplamKullanici, bugunGirisler] =
    await Promise.all([
      prisma.kullanici.findMany({
        where: { sonGorulme: { gte: cevrimiciEsigi } },
        orderBy: { sonGorulme: "desc" },
        select: { id: true, ad: true, kullanici: true, rol: true, sonGorulme: true },
      }),
      prisma.girisKaydi.findMany({
        take: 50,
        orderBy: { zaman: "desc" },
        include: { kullanici: { select: { ad: true, kullanici: true, rol: true } } },
      }),
      prisma.kullanici.count({ where: { sonGorulme: { gte: son24s } } }),
      prisma.kullanici.count(),
      prisma.girisKaydi.findMany({
        where: { zaman: { gte: bugunBasi } },
        select: { kullaniciId: true },
        distinct: ["kullaniciId"],
      }),
    ]);

  const aktivite: Aktivite = {
    cevrimici: cevrimici.map((k) => ({
      id: k.id,
      ad: k.ad,
      kullanici: k.kullanici,
      rol: k.rol,
      sonGorulme: k.sonGorulme ? goreliZaman(k.sonGorulme) : "",
    })),
    girisler: girisler.map((g) => ({
      id: g.id,
      ad: g.kullanici.ad,
      kullanici: g.kullanici.kullanici,
      rol: g.kullanici.rol,
      zaman: zamanStr(g.zaman),
      ip: g.ip,
      tarayici: tarayiciKisalt(g.tarayici),
    })),
    sayilar: {
      cevrimici: cevrimici.length,
      bugunGiris: bugunGirisler.length,
      son24sAktif,
      toplamKullanici,
    },
  };

  return (
    <main className="container" style={{ maxWidth: 1160, paddingBottom: 40 }}>
      <div className="panel-bas">
        <h1>
          Aktivite <span>Merkezi</span>
        </h1>
        <p>Anlık kullanıcı durumunu ve son giriş kayıtlarını tek ekrandan izleyin.</p>
      </div>
      <AktivitePaneli veri={aktivite} />
    </main>
  );
}
