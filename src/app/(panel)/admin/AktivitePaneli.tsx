"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROL_ETIKETLERI } from "@/lib/navigasyon";
import stil from "./admin.module.css";

export interface Aktivite {
  cevrimici: {
    id: string;
    ad: string;
    kullanici: string;
    rol: string;
    sonGorulme: string; // "2 dk önce" gibi hazır metin
  }[];
  girisler: {
    id: string;
    ad: string;
    kullanici: string;
    rol: string;
    zaman: string; // "Bugün · 14:35" gibi hazır metin
    ip: string;
    tarayici: string; // kısaltılmış "Chrome · Windows"
  }[];
  sayilar: {
    cevrimici: number;
    bugunGiris: number;
    son24sAktif: number;
    toplamKullanici: number;
  };
}

/* Koç ve öğretmen ayrı rollerdir; aktivite listesinde de ayrı etiketlenir
   (etiketler tek kaynaktan: lib/navigasyon.ts ROL_ETIKETLERI). */
const ROL_SINIF: Record<string, string> = {
  koc: "rolKoc",
  ogretmen: "rolOgretmen",
  ogrenci: "rolOgrenci",
  admin: "rolAdmin",
  veli: "rolVeli",
};
const ROL_AD: Record<string, string> = ROL_ETIKETLERI;

export default function AktivitePaneli({ veri }: { veri: Aktivite }) {
  const router = useRouter();

  // Canlı görünüm: 30 saniyede bir sunucudan taze veri
  useEffect(() => {
    const sayac = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(sayac);
  }, [router]);

  return (
    <>
      <div className={stil.bolum}>
        <h2>
          📡 <span>Anlık Durum</span>
        </h2>
        <div className={stil.statSatir}>
          <div className={stil.statKutu}>
            <b style={{ color: "var(--yesil)" }}>{veri.sayilar.cevrimici}</b>
            <small>Şu an çevrimiçi (son 5 dk)</small>
          </div>
          <div className={stil.statKutu}>
            <b>{veri.sayilar.bugunGiris}</b>
            <small>Bugün giriş yapan</small>
          </div>
          <div className={stil.statKutu}>
            <b>{veri.sayilar.son24sAktif}</b>
            <small>Son 24 saatte aktif</small>
          </div>
          <div className={stil.statKutu}>
            <b>{veri.sayilar.toplamKullanici}</b>
            <small>Toplam kullanıcı</small>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          {veri.cevrimici.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: ".86rem", padding: "8px 4px" }}>
              Şu anda çevrimiçi kullanıcı yok.
            </p>
          ) : (
            veri.cevrimici.map((k) => (
              <div key={k.id} className={stil.cevrimiciSatir}>
                <span className={stil.nokta} />
                <b style={{ fontSize: ".88rem" }}>{k.ad}</b>
                <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>@{k.kullanici}</span>
                <span className={stil[ROL_SINIF[k.rol]] ?? stil.rolEtiket}>{ROL_AD[k.rol] ?? k.rol}</span>
                <span className={stil.sonGorulme}>{k.sonGorulme}</span>
              </div>
            ))
          )}
        </div>
        <p className={stil.yenileBilgi} style={{ marginTop: 10 }}>
          ⟳ 30 saniyede bir otomatik yenilenir
        </p>
      </div>

      <div className={stil.bolum}>
        <h2>
          🕐 <span>Giriş Geçmişi</span> (son {veri.girisler.length} giriş)
        </h2>
        <div className={stil.tabloSarici}>
          <table className={stil.tablo}>
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>Rol</th>
                <th>Zaman</th>
                <th>IP</th>
                <th>Tarayıcı</th>
              </tr>
            </thead>
            <tbody>
              {veri.girisler.map((g) => (
                <tr key={g.id}>
                  <td>
                    <b>{g.ad}</b>{" "}
                    <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>@{g.kullanici}</span>
                  </td>
                  <td data-label="Rol">
                    <span className={stil[ROL_SINIF[g.rol]] ?? stil.rolEtiket}>
                      {ROL_AD[g.rol] ?? g.rol}
                    </span>
                  </td>
                  <td data-label="Zaman" style={{ whiteSpace: "nowrap" }}>{g.zaman}</td>
                  <td data-label="IP">{g.ip || "—"}</td>
                  <td data-label="Tarayıcı">{g.tarayici || "—"}</td>
                </tr>
              ))}
              {veri.girisler.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)" }}>
                    Henüz giriş kaydı yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
