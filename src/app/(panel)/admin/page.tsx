import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import stil from "./dashboard.module.css";

export const metadata: Metadata = { title: "Dashboard – Kaynak Akademi" };

function yuzde(parca: number, toplam: number): number {
  if (toplam === 0) return 0;
  return Math.round((parca / toplam) * 100);
}

export default async function AdminDashboard() {
  const admin = await aktifKullanici("admin");
  const bugunBasi = new Date();
  bugunBasi.setHours(0, 0, 0, 0);

  const [koclar, ogrenciToplam, atanmamis, bekleyenOdev, yaklasanDers, bugunGirisler] =
    await Promise.all([
      prisma.kullanici.findMany({
        where: { rol: "koc" },
        select: {
          id: true,
          ad: true,
          aktif: true,
          _count: { select: { ogrenciler: true } },
        },
      }),
      prisma.kullanici.count({ where: { rol: "ogrenci" } }),
      prisma.kullanici.count({ where: { rol: "ogrenci", kocId: null } }),
      prisma.odev.count({ where: { durum: "bekliyor" } }),
      prisma.ozelDers.count({
        where: { durum: "planlandi", tarih: { gte: bugunBasi } },
      }),
      prisma.girisKaydi.findMany({
        where: { zaman: { gte: bugunBasi } },
        select: { kullaniciId: true },
        distinct: ["kullaniciId"],
      }),
    ]);

  const aktifKoc = koclar.filter((k) => k.aktif).length;
  const atanmis = ogrenciToplam - atanmamis;
  const enYogunKoclar = [...koclar]
    .sort((a, b) => b._count.ogrenciler - a._count.ogrenciler)
    .slice(0, 5);
  const enYuksekOgrenci = Math.max(
    1,
    ...enYogunKoclar.map((k) => k._count.ogrenciler)
  );

  return (
    <main className={`container ${stil.sayfa}`}>
      <section className={stil.hero}>
        <div className={stil.heroIcerik}>
          <span className={stil.ustEtiket}>YÖNETİM MERKEZİ</span>
          <h1>Günaydın, {admin.ad.split(" ")[0]} 👋</h1>
          <p>
            Akademinin genel durumunu tek bakışta gör, ihtiyaç duyduğun yönetim
            ekranına hızlıca geç.
          </p>
        </div>
        <div className={stil.heroIsaret} aria-hidden="true">
          <span>KA</span>
        </div>
      </section>

      <section className={stil.statGrid} aria-label="Genel istatistikler">
        <Link href="/admin/koclar" className={`${stil.statKart} ${stil.mavi}`}>
          <span className={stil.statIkon}>👩‍🏫</span>
          <span>
            <small>Toplam koç</small>
            <b>{koclar.length}</b>
            <em>{aktifKoc} aktif koç</em>
          </span>
        </Link>
        <div className={`${stil.statKart} ${stil.turkuaz}`}>
          <span className={stil.statIkon}>🎓</span>
          <span>
            <small>Toplam öğrenci</small>
            <b>{ogrenciToplam}</b>
            <em>{atanmis} öğrenci atanmış</em>
          </span>
        </div>
        <div className={`${stil.statKart} ${stil.turuncu}`}>
          <span className={stil.statIkon}>📚</span>
          <span>
            <small>Bekleyen ödev</small>
            <b>{bekleyenOdev}</b>
            <em>Takip edilmesi gereken</em>
          </span>
        </div>
        <Link href="/admin/aktivite" className={`${stil.statKart} ${stil.yesil}`}>
          <span className={stil.statIkon}>↗</span>
          <span>
            <small>Bugün giriş yapan</small>
            <b>{bugunGirisler.length}</b>
            <em>Aktiviteyi görüntüle</em>
          </span>
        </Link>
      </section>

      <section className={stil.anaGrid}>
        <div className={stil.kart}>
          <div className={stil.kartBaslik}>
            <div>
              <span className={stil.kucukBaslik}>GENEL BAKIŞ</span>
              <h2>Öğrenci yerleşimi</h2>
            </div>
            <span className={stil.yuzdeRozet}>{yuzde(atanmis, ogrenciToplam)}%</span>
          </div>

          <div className={stil.buyukMetrik}>
            <b>{atanmis}</b>
            <span>/ {ogrenciToplam} öğrenci bir koça atanmış</span>
          </div>
          <div className={stil.ilerleme}>
            <span style={{ width: `${yuzde(atanmis, ogrenciToplam)}%` }} />
          </div>
          <div className={stil.metrikAlt}>
            <span><i className={stil.atanmisNokta} />Atanmış: <b>{atanmis}</b></span>
            <span><i className={stil.atanmamisNokta} />Atanmamış: <b>{atanmamis}</b></span>
          </div>

          {atanmamis > 0 && (
            <div className={stil.uyari}>
              <span>!</span>
              <p><b>{atanmamis} öğrenci</b> henüz bir koça atanmamış.</p>
              <Link href="/admin/koclar">Koçları yönet →</Link>
            </div>
          )}
        </div>

        <div className={stil.kart}>
          <div className={stil.kartBaslik}>
            <div>
              <span className={stil.kucukBaslik}>DAĞILIM</span>
              <h2>Koç yoğunluğu</h2>
            </div>
            <Link href="/admin/koclar" className={stil.metinLink}>Tümünü gör →</Link>
          </div>
          <div className={stil.kocListe}>
            {enYogunKoclar.map((k) => (
              <div className={stil.kocSatir} key={k.id}>
                <span className={stil.kocAvatar}>{k.ad.slice(0, 1).toLocaleUpperCase("tr-TR")}</span>
                <div>
                  <div className={stil.kocBilgi}>
                    <b>{k.ad}</b>
                    <span>{k._count.ogrenciler} öğrenci</span>
                  </div>
                  <div className={stil.miniIlerleme}>
                    <span style={{ width: `${(k._count.ogrenciler / enYuksekOgrenci) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {enYogunKoclar.length === 0 && (
              <div className={stil.bosDurum}>Henüz kayıtlı koç bulunmuyor.</div>
            )}
          </div>
        </div>
      </section>

      <section className={stil.altGrid}>
        <div className={stil.kart}>
          <div className={stil.kartBaslik}>
            <div>
              <span className={stil.kucukBaslik}>HIZLI ERİŞİM</span>
              <h2>Yönetim araçları</h2>
            </div>
          </div>
          <div className={stil.hizliGrid}>
            <Link href="/admin/koclar" className={stil.hizliKart}>
              <span>👩‍🏫</span><div><b>Koç yönetimi</b><small>Listele, ekle ve düzenle</small></div><i>→</i>
            </Link>
            <Link href="/admin/aktivite" className={stil.hizliKart}>
              <span>📡</span><div><b>Aktivite merkezi</b><small>Anlık durum ve girişler</small></div><i>→</i>
            </Link>
            <Link href="/admin/mail" className={stil.hizliKart}>
              <span>✉️</span><div><b>E-posta yönetimi</b><small>Ayarlar ve gönderim kuyruğu</small></div><i>→</i>
            </Link>
          </div>
        </div>

        <div className={`${stil.kart} ${stil.dersKart}`}>
          <span className={stil.dersIkon}>🗓️</span>
          <div>
            <small>PLANLANAN ÖZEL DERSLER</small>
            <b>{yaklasanDers}</b>
            <p>Bugün ve sonrasında planlanan ders</p>
          </div>
        </div>
      </section>
    </main>
  );
}
