import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { bugunIstanbul } from "@/lib/kullanim-sayaci";
import stil from "../admin.module.css";

export const metadata: Metadata = { title: "Site Kullanımı – Kaynak Kampüs" };

/* Anonim kullanım sayaçları ekranı — public sitedeki oyun/etkinlik/araç
   kullanımını GÜNLÜK ADET olarak gösterir. Kayıtlar kişisel veri içermez
   (bkz. src/lib/kullanim-sayaci.ts); burada da yalnızca sayılar vardır. */

const GUN_SAYISI = 30;

/** Tablo kolonları — olay anahtarı → ekran başlığı (sıra ekran sırasıdır) */
const KOLONLAR: [string, string][] = [
  ["sayfa", "Sayfa"],
  ["oyun", "Oyun"],
  ["etkinlik", "Etkinlik"],
  ["odev", "Ödev"],
  ["bep", "BEP"],
  ["ders-programi", "Ders Prog."],
];

function gunEtiket(gun: Date, bugun: Date): string {
  if (gun.getTime() === bugun.getTime()) return "Bugün";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "UTC", // gün değerleri UTC gece yarısı olarak saklanır
    day: "2-digit",
    month: "2-digit",
    weekday: "short",
  }).format(gun);
}

export default async function KullanimSayfasi() {
  await aktifKullanici("admin");

  const bugun = bugunIstanbul();
  const baslangic = new Date(bugun);
  baslangic.setUTCDate(baslangic.getUTCDate() - (GUN_SAYISI - 1));

  const satirlar = await prisma.kullanimSayaci.findMany({
    where: { gun: { gte: baslangic } },
    orderBy: { gun: "desc" },
  });

  /* Günlük döküm: gün → olay → adet */
  const gunluk = new Map<number, Map<string, number>>();
  /* Detay dökümleri: en çok oynanan oyunlar / indirilen etkinlikler (30 gün) */
  const oyunlar = new Map<string, number>();
  const etkinlikler = new Map<string, number>();
  const bugunToplam = new Map<string, number>();

  for (const s of satirlar) {
    const g = s.gun.getTime();
    const olaylar = gunluk.get(g) ?? new Map<string, number>();
    olaylar.set(s.olay, (olaylar.get(s.olay) ?? 0) + s.sayi);
    gunluk.set(g, olaylar);

    if (g === bugun.getTime()) bugunToplam.set(s.olay, (bugunToplam.get(s.olay) ?? 0) + s.sayi);
    if (s.olay === "oyun" && s.detay) oyunlar.set(s.detay, (oyunlar.get(s.detay) ?? 0) + s.sayi);
    if (s.olay === "etkinlik" && s.detay)
      etkinlikler.set(s.detay, (etkinlikler.get(s.detay) ?? 0) + s.sayi);
  }

  const gunler = [...gunluk.keys()].sort((a, b) => b - a).map((t) => new Date(t));
  const enCok = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const enCokOyun = enCok(oyunlar);
  const enCokEtkinlik = enCok(etkinlikler);
  const otuzGunToplam = satirlar.reduce((t, s) => t + s.sayi, 0);

  return (
    <main className="container" style={{ maxWidth: 1160, paddingBottom: 40 }}>
      <div className="panel-bas">
        <h1>
          Site <span>Kullanımı</span>
        </h1>
        <p>
          Oyunlar, etkinlikler ve araçların günlük kullanım sayıları. Sayaçlar anonimdir; kişisel
          veri tutulmaz.
        </p>
      </div>

      <div className={stil.bolum}>
        <h2>
          📊 <span>Bugün</span>
        </h2>
        <div className={stil.statSatir}>
          <div className={stil.statKutu}>
            <b>{bugunToplam.get("oyun") ?? 0}</b>
            <small>Oyun başlatma</small>
          </div>
          <div className={stil.statKutu}>
            <b>{bugunToplam.get("etkinlik") ?? 0}</b>
            <small>Etkinlik indirme</small>
          </div>
          <div className={stil.statKutu}>
            <b>
              {(bugunToplam.get("odev") ?? 0) +
                (bugunToplam.get("bep") ?? 0) +
                (bugunToplam.get("ders-programi") ?? 0)}
            </b>
            <small>Araç kullanımı (ödev + BEP + program)</small>
          </div>
          <div className={stil.statKutu}>
            <b>{bugunToplam.get("sayfa") ?? 0}</b>
            <small>Sayfa görüntüleme</small>
          </div>
          <div className={stil.statKutu}>
            <b>{otuzGunToplam}</b>
            <small>Son {GUN_SAYISI} gün toplam olay</small>
          </div>
        </div>
      </div>

      <div className={stil.bolum}>
        <h2>
          🗓 <span>Günlük Döküm</span> (son {GUN_SAYISI} gün)
        </h2>
        {gunler.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: ".86rem", padding: "8px 4px" }}>
            Henüz kayıt yok — sayaçlar site kullanıldıkça dolmaya başlar.
          </p>
        ) : (
          <div className={stil.tabloSarici}>
            <table className={stil.tablo}>
              <thead>
                <tr>
                  <th>Gün</th>
                  {KOLONLAR.map(([, baslik]) => (
                    <th key={baslik} style={{ textAlign: "right" }}>
                      {baslik}
                    </th>
                  ))}
                  <th style={{ textAlign: "right" }}>Toplam</th>
                </tr>
              </thead>
              <tbody>
                {gunler.map((gun) => {
                  const olaylar = gunluk.get(gun.getTime())!;
                  const toplam = [...olaylar.values()].reduce((t, n) => t + n, 0);
                  return (
                    <tr key={gun.getTime()}>
                      <td>
                        <b>{gunEtiket(gun, bugun)}</b>
                      </td>
                      {KOLONLAR.map(([olay, baslik]) => (
                        <td key={olay} data-label={baslik} style={{ textAlign: "right" }}>
                          {olaylar.get(olay) ?? 0}
                        </td>
                      ))}
                      <td data-label="Toplam" style={{ textAlign: "right" }}>
                        <b>{toplam}</b>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={stil.bolum}>
        <h2>
          🎮 <span>En Çok Oynanan Oyunlar</span> (son {GUN_SAYISI} gün)
        </h2>
        {enCokOyun.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: ".86rem", padding: "8px 4px" }}>
            Henüz oyun başlatma kaydı yok.
          </p>
        ) : (
          <div className={stil.tabloSarici}>
            <table className={stil.tablo}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Oyun</th>
                  <th style={{ textAlign: "right" }}>Başlatma</th>
                </tr>
              </thead>
              <tbody>
                {enCokOyun.map(([ad, sayi], i) => (
                  <tr key={ad}>
                    <td>{i + 1}</td>
                    <td data-label="Oyun">
                      <b>{ad}</b>
                    </td>
                    <td data-label="Başlatma" style={{ textAlign: "right" }}>
                      {sayi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={stil.bolum}>
        <h2>
          📄 <span>En Çok İndirilen Etkinlikler</span> (son {GUN_SAYISI} gün)
        </h2>
        {enCokEtkinlik.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: ".86rem", padding: "8px 4px" }}>
            Henüz etkinlik indirme kaydı yok.
          </p>
        ) : (
          <div className={stil.tabloSarici}>
            <table className={stil.tablo}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Etkinlik</th>
                  <th style={{ textAlign: "right" }}>İndirme</th>
                </tr>
              </thead>
              <tbody>
                {enCokEtkinlik.map(([ad, sayi], i) => (
                  <tr key={ad}>
                    <td>{i + 1}</td>
                    <td data-label="Etkinlik">
                      <b>{ad}</b>
                    </td>
                    <td data-label="İndirme" style={{ textAlign: "right" }}>
                      {sayi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
