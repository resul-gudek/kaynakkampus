import PanelIkon from "@/components/panel/Ikon";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { bugun, tarihStr } from "@/lib/hesap";
import d from "@/components/panel/dashboard.module.css";

export const metadata: Metadata = { title: "Öğretmen Paneli – Kaynak Kampüs" };

/* Bölüm sayfaları — hızlı erişim kartları buradan beslenir */
const BOLUMLER = [
  { href: "/koc/ajanda", ikon: "ajanda", ad: "Ajanda", tanim: "Tüm öğrencilerin ders ve ödev takvimi" },
  { href: "/koc/ogrenciler", ikon: "ogrenciler", ad: "Öğrencilerim", tanim: "Ödev ver, takip ve gelişimi yönet" },
  { href: "/siniflar", ikon: "ogretmen", ad: "Online Sınıflar", tanim: "Canlı ders sınıflarını yönet" },
  { href: "/bildirimler", ikon: "zil", ad: "Bildirimler", tanim: "Talep ve gelişmeleri gör" },
  { href: "/odev-olustur.html", ikon: "odevOlustur", ad: "Ödev Oluştur", tanim: "Yazdırılabilir ödev föyü hazırla" },
  { href: "/bep-olustur.html", ikon: "bep", ad: "BEP Oluştur", tanim: "Bireysel eğitim planı hazırla" },
];

function basHarfler(ad: string) {
  return ad
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toLocaleUpperCase("tr-TR");
}

export default async function KocPanel({
  searchParams,
}: {
  searchParams: Promise<{ ogrenci?: string; sekme?: string; kayit?: string }>;
}) {
  const sp = await searchParams;
  /* Eski derin bağlantılar (?ogrenci=&sekme=&kayit=) Öğrencilerim sayfasına taşındı */
  if (sp.ogrenci || sp.sekme) {
    const q = new URLSearchParams();
    if (sp.ogrenci) q.set("ogrenci", sp.ogrenci);
    if (sp.sekme) q.set("sekme", sp.sekme);
    if (sp.kayit) q.set("kayit", sp.kayit);
    redirect(`/koc/ogrenciler?${q.toString()}`);
  }

  const koc = await aktifKullanici("koc");
  const bugunIso = bugun();
  const bugunTarih = new Date(bugunIso);

  const [
    ogrenciSayisi,
    atanmamisSayisi,
    bekleyenOdev,
    toplamOdev,
    takipToplam,
    takipTamam,
    onayBekleyen,
    bugunkuDersler,
    gecikenPlan,
    sonrakiDers,
  ] = await Promise.all([
    prisma.kullanici.count({ where: { rol: "ogrenci", kocId: koc.id } }),
    prisma.kullanici.count({ where: { rol: "ogrenci", kocId: null } }),
    prisma.odev.count({ where: { kocId: koc.id, durum: "bekliyor" } }),
    prisma.odev.count({ where: { kocId: koc.id } }),
    prisma.takip.count({ where: { kocId: koc.id } }),
    prisma.takip.count({ where: { kocId: koc.id, tamamlandi: true } }),
    prisma.ozelDers.count({
      where: { kocId: koc.id, durum: "talep", olusturan: "ogrenci" },
    }),
    prisma.ozelDers.count({
      where: { kocId: koc.id, durum: "planlandi", tarih: bugunTarih },
    }),
    prisma.ozelDers.count({
      where: { kocId: koc.id, durum: "planlandi", tarih: { lt: bugunTarih } },
    }),
    prisma.ozelDers.findFirst({
      where: { kocId: koc.id, durum: "planlandi", tarih: { gte: bugunTarih } },
      orderBy: [{ tarih: "asc" }, { saat: "asc" }],
      include: { ogrenci: { select: { ad: true } } },
    }),
  ]);

  const takipYuzde = takipToplam ? Math.round((100 * takipTamam) / takipToplam) : 0;

  return (
    <main className="container">
      {/* ── Hero ── */}
      <section className={d.hero}>
        <div className={d.heroIcerik}>
          <span className={d.ustEtiket}>ÖĞRETMEN PANELİ</span>
          <h1>Hoş geldin, {koc.ad.split(" ")[0]} 👋</h1>
          <p>
            Öğrencilerini seç; ödev ver, haftalık takip listesini yönet, deneme gelişimini ve
            özel ders taleplerini tek bakışta izle.
          </p>
        </div>
        <div className={d.heroKart}>
          <div className="avatar">{basHarfler(koc.ad)}</div>
          <div>
            <small>Bugün · {tarihStr(bugunIso)}</small>
            <b>
              {bugunkuDersler ? `${bugunkuDersler} planlı özel ders` : "Planlı özel ders yok"}
            </b>
            <em>
              {onayBekleyen
                ? `${onayBekleyen} öğrenci talebi onayını bekliyor`
                : "Onay bekleyen talep yok"}
            </em>
          </div>
        </div>
      </section>

      {/* ── İstatistik kartları ── */}
      <section className={d.statGrid} aria-label="Genel istatistikler">
        <Link href="/koc/ogrenciler" className={`${d.statKart} ${d.mavi}`}>
          <span className={d.statIkon}><PanelIkon ad="ogrenciler" boyut={20} /></span>
          <span>
            <small>Öğrencim</small>
            <b>{ogrenciSayisi}</b>
            <em>
              {atanmamisSayisi
                ? `${atanmamisSayisi} öğrenci havuzda atanmamış`
                : "Havuzda atanmamış öğrenci yok"}
            </em>
          </span>
        </Link>
        <Link href="/koc/ogrenciler" className={`${d.statKart} ${d.turuncu}`}>
          <span className={d.statIkon}><PanelIkon ad="odev" boyut={20} /></span>
          <span>
            <small>Bekleyen ödev</small>
            <b>{bekleyenOdev}</b>
            <em>Toplam {toplamOdev} ödev verildi</em>
          </span>
        </Link>
        <Link href="/koc/ogrenciler" className={`${d.statKart} ${d.yesil}`}>
          <span className={d.statIkon}><PanelIkon ad="takip" boyut={20} /></span>
          <span>
            <small>Takip görevi</small>
            <b>{takipToplam}</b>
            <em>%{takipYuzde} tamamlanmış</em>
          </span>
        </Link>
        <Link href="/koc/ogrenciler" className={`${d.statKart} ${d.turkuaz}`}>
          <span className={d.statIkon}><PanelIkon ad="veli" boyut={20} /></span>
          <span>
            <small>Onay bekleyen talep</small>
            <b>{onayBekleyen}</b>
            <em>Öğrencilerden gelen ders talepleri</em>
          </span>
        </Link>
      </section>

      {/* ── Günün özeti ── */}
      <section className={d.ozetGrid} aria-label="Günün özeti">
        <Link href="/koc/ajanda" className={d.ozetKart}>
          <span><PanelIkon ad="ajanda" boyut={18} /></span>
          <div>
            <b>
              {sonrakiDers
                ? `Sıradaki ders: ${tarihStr(sonrakiDers.tarih)}${sonrakiDers.saat ? " " + sonrakiDers.saat : ""}`
                : "Planlanmış özel ders yok"}
            </b>
            <small>
              {sonrakiDers
                ? `${sonrakiDers.ogrenci.ad} · ${sonrakiDers.ders}${sonrakiDers.konu ? " – " + sonrakiDers.konu : ""}`
                : "Ajandadan tüm takvimi görebilirsin"}
            </small>
          </div>
        </Link>
        <Link href="/koc/ogrenciler" className={d.ozetKart}>
          <span><PanelIkon ad="alarm" boyut={18} /></span>
          <div>
            <b>
              {gecikenPlan
                ? `${gecikenPlan} planlı dersin tarihi geçti`
                : "Geciken planlı ders yok"}
            </b>
            <small>
              {gecikenPlan
                ? '"Yapıldı" olarak işaretlemeyi unutma'
                : "Tüm planlı dersler güncel 🎉"}
            </small>
          </div>
        </Link>
        <Link href="/koc/ogrenciler" className={d.ozetKart}>
          <span><PanelIkon ad="el" boyut={18} /></span>
          <div>
            <b>
              {onayBekleyen
                ? `${onayBekleyen} ders talebi onayını bekliyor`
                : "Onay bekleyen talep yok"}
            </b>
            <small>
              {onayBekleyen
                ? "Öğrencilerim sayfasından yanıtla"
                : "Öğrenciler ders talep ettiğinde burada görünür"}
            </small>
          </div>
        </Link>
      </section>

      {/* ── Hızlı erişim ── */}
      <section className={d.kart} aria-label="Hızlı erişim">
        <div className={d.kartBaslik}>
          <div>
            <span className={d.kucukBaslik}>HIZLI ERİŞİM</span>
            <h2>Öğretmenlik araçların</h2>
          </div>
        </div>
        <div className={d.hizliGrid}>
          {BOLUMLER.map((b) => (
            <Link key={b.href} href={b.href} className={d.hizliKart}>
              <span><PanelIkon ad={b.ikon} boyut={18} /></span>
              <div>
                <b>{b.ad}</b>
                <small>{b.tanim}</small>
              </div>
              <i>→</i>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
