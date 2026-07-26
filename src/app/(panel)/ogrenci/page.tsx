import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { isoTarih, ogrenciOzet, ozelDersOzet, tarihStr } from "@/lib/hesap";
import d from "@/components/panel/dashboard.module.css";

export const metadata: Metadata = { title: "Öğrenci Paneli – Kaynak Kampüs" };

/* Bölüm sayfaları — hızlı erişim kartları ve legacy ?sekme= yönlendirmesi
   aynı eşlemeden beslenir */
const BOLUMLER = [
  { href: "/ogrenci/takvim", ikon: "📅", ad: "Takvimim", tanim: "Ödev, ders ve deneme günlerin" },
  { href: "/ogrenci/odevler", ikon: "📘", ad: "Ödevlerim", tanim: "Verilen ödevleri gör, tamamla" },
  { href: "/ogrenci/testler", ikon: "⏱️", ad: "Süreli Testlerim", tanim: "Süre içinde çöz, sonucunu gör" },
  { href: "/ogrenci/takip", ikon: "✅", ad: "Haftalık Takip Listem", tanim: "Haftalık görevlerini işaretle" },
  { href: "/ogrenci/yol-haritasi", ikon: "🗺️", ad: "Yol Haritam", tanim: "Adımları tamamla, XP kazan" },
  { href: "/ogrenci/denemeler", ikon: "📈", ad: "Deneme Sonuçlarım", tanim: "Net gelişimini takip et" },
  { href: "/ogrenci/ozel-dersler", ikon: "🎓", ad: "Özel Derslerim", tanim: "Ders planla ve talep et" },
  { href: "/ogrenci/profil", ikon: "🎯", ad: "Seviye Formum", tanim: "Başlangıç seviyeni güncelle" },
];

/* Eski derin bağlantı sözleşmesi (?sekme=<bolum>&kayit=<id>) yeni sayfalara taşındı */
const SEKME_YONLENDIRME: Record<string, string> = {
  takvim: "/ogrenci/takvim",
  odev: "/ogrenci/odevler",
  odevler: "/ogrenci/odevler",
  takip: "/ogrenci/takip",
  yol: "/ogrenci/yol-haritasi",
  deneme: "/ogrenci/denemeler",
  denemeler: "/ogrenci/denemeler",
  test: "/ogrenci/testler",
  testler: "/ogrenci/testler",
  ozel: "/ogrenci/ozel-dersler",
  profil: "/ogrenci/profil",
};

export default async function OgrenciPanel({
  searchParams,
}: {
  searchParams: Promise<{ sekme?: string; kayit?: string }>;
}) {
  const sp = await searchParams;
  if (sp.sekme && SEKME_YONLENDIRME[sp.sekme]) {
    redirect(
      SEKME_YONLENDIRME[sp.sekme] + (sp.kayit ? `?kayit=${encodeURIComponent(sp.kayit)}` : "")
    );
  }

  const ogrenci = await aktifKullanici("ogrenci");

  const [koc, odevler, takip, denemeler, yolAdimlari, ozelDersler, testAtamalari] = await Promise.all([
    ogrenci.kocId
      ? prisma.kullanici.findUnique({ where: { id: ogrenci.kocId } })
      : Promise.resolve(null),
    prisma.odev.findMany({ where: { ogrenciId: ogrenci.id } }),
    prisma.takip.findMany({ where: { ogrenciId: ogrenci.id } }),
    prisma.deneme.findMany({ where: { ogrenciId: ogrenci.id }, orderBy: { tarih: "asc" } }),
    prisma.yolAdimi.findMany({ where: { ogrenciId: ogrenci.id }, orderBy: { sira: "asc" } }),
    prisma.ozelDers.findMany({
      where: { ogrenciId: ogrenci.id, NOT: { durum: "iptal" } },
      orderBy: [{ tarih: "asc" }, { saat: "asc" }],
    }),
    prisma.sureliTestAtama.findMany({
      where: { ogrenciId: ogrenci.id, test: { aktif: true } },
      select: {
        test: {
          select: {
            ad: true,
            sure: true,
            soruSayisi: true,
            oturumlar: { where: { ogrenciId: ogrenci.id }, select: { durum: true } },
          },
        },
      },
    }),
  ]);

  /* Çözülmeyi bekleyen süreli testler: kapanmış oturumu olmayan atamalar */
  const bekleyenTestler = testAtamalari.filter(
    (a) => !a.test.oturumlar.some((o) => o.durum !== "basladi")
  );

  const oz = ogrenciOzet(odevler, takip, denemeler, yolAdimlari);
  const ozelOz = ozelDersOzet(ozelDersler);

  const kocHarfler = koc
    ? koc.ad
        .split(" ")
        .map((parca) => parca[0])
        .join("")
        .slice(0, 2)
        .toLocaleUpperCase("tr-TR")
    : "";

  const sonDeneme = denemeler.length ? denemeler[denemeler.length - 1] : null;
  const bekleyenOdevler = odevler
    .filter((o) => o.durum === "bekliyor")
    .sort((a, b) => isoTarih(a.sonTarih).localeCompare(isoTarih(b.sonTarih)));
  const enYakinTeslim = bekleyenOdevler.find((o) => o.sonTarih)?.sonTarih ?? null;

  return (
    <main className="container">
      {/* ── Hero ── */}
      <section className={d.hero}>
        <div className={d.heroIcerik}>
          <span className={d.ustEtiket}>ÖĞRENCİ PANELİ</span>
          <h1>Merhaba, {ogrenci.ad.split(" ")[0]} 👋</h1>
          <p>
            Ödevlerini, haftalık takip listeni ve deneme gelişimini buradan izle;
            tamamladıklarını işaretleyip XP kazan.
          </p>
        </div>
        <div className={d.heroKart}>
          {koc ? (
            <>
              <div className="avatar">{kocHarfler}</div>
              <div>
                <small>Öğretmenin</small>
                <b>{koc.ad}</b>
                <em>
                  {koc.brans || "—"} · Hedefin: {ogrenci.hedef || "—"}
                </em>
              </div>
            </>
          ) : (
            <div>
              <small>Öğretmen</small>
              <b>Henüz atanmadı</b>
              <em>Atama yapıldığında ödev ve takip listen burada görünecek.</em>
            </div>
          )}
        </div>
      </section>

      {/* ── İstatistikler ── */}
      <section className={d.statGrid} aria-label="Genel istatistikler">
        <Link href="/ogrenci/odevler" className={`${d.statKart} ${d.yesil}`}>
          <span className={d.statIkon}>✅</span>
          <span>
            <small>Ödev tamamlama</small>
            <b>%{oz.odevYuzde}</b>
            <em>{oz.odevTamam}/{oz.odevToplam} ödev tamamlandı</em>
          </span>
        </Link>
        <Link href="/ogrenci/takip" className={`${d.statKart} ${d.turkuaz}`}>
          <span className={d.statIkon}>📊</span>
          <span>
            <small>Takip listesi</small>
            <b>%{oz.takipYuzde}</b>
            <em>{oz.takipTamam}/{oz.takipToplam} görev tamamlandı</em>
          </span>
        </Link>
        <Link href="/ogrenci/denemeler" className={`${d.statKart} ${d.mavi}`}>
          <span className={d.statIkon}>🎯</span>
          <span>
            <small>Son deneme neti</small>
            <b>
              {oz.sonNet === null ? "—" : oz.sonNet}
              {oz.netFarki !== null && (
                <>
                  {" "}
                  <span className={`${d.fark} ${oz.netFarki >= 0 ? d.artis : d.dusus}`}>
                    {oz.netFarki >= 0 ? "▲ +" : "▼ "}
                    {oz.netFarki}
                  </span>
                </>
              )}
            </b>
            <em>{sonDeneme ? sonDeneme.ad : "Henüz deneme sonucu yok"}</em>
          </span>
        </Link>
        <Link href="/ogrenci/yol-haritasi" className={`${d.statKart} ${d.turuncu}`}>
          <span className={d.statIkon}>⭐</span>
          <span>
            <small>Seviye</small>
            <b>Seviye {oz.seviye}</b>
            <em>{oz.xp} XP · Yol haritası %{oz.yolYuzde}</em>
          </span>
        </Link>
      </section>

      {/* ── Günün özeti ── */}
      <section className={d.ozetGrid} aria-label="Günün özeti">
        <Link href="/ogrenci/odevler" className={d.ozetKart}>
          <span>📘</span>
          <div>
            <b>{bekleyenOdevler.length ? `${bekleyenOdevler.length} bekleyen ödev` : "Bekleyen ödevin yok"}</b>
            <small>
              {enYakinTeslim ? `En yakın teslim: ${tarihStr(enYakinTeslim)}` : "Tüm ödevler güncel 🎉"}
            </small>
          </div>
        </Link>
        <Link href="/ogrenci/ozel-dersler" className={d.ozetKart}>
          <span>🎓</span>
          <div>
            <b>
              {ozelOz.sonraki
                ? `Sıradaki özel ders: ${tarihStr(ozelOz.sonraki.tarih)}${ozelOz.sonraki.saat ? " " + ozelOz.sonraki.saat : ""}`
                : "Planlanmış özel ders yok"}
            </b>
            <small>
              {ozelOz.sonraki
                ? ozelOz.sonraki.ders + (ozelOz.sonraki.konu ? " – " + ozelOz.sonraki.konu : "")
                : "Özel Derslerim sayfasından ders talep edebilirsin"}
            </small>
          </div>
        </Link>
        <Link href="/ogrenci/testler" className={d.ozetKart}>
          <span>⏱️</span>
          <div>
            <b>
              {bekleyenTestler.length
                ? `${bekleyenTestler.length} süreli test seni bekliyor`
                : "Çözülecek süreli test yok"}
            </b>
            <small>
              {bekleyenTestler.length
                ? `${bekleyenTestler[0].test.ad} · ${bekleyenTestler[0].test.soruSayisi} soru · ${bekleyenTestler[0].test.sure} dk`
                : "Öğretmenin test atadığında burada görünür"}
            </small>
          </div>
        </Link>
        <Link href="/ogrenci/ozel-dersler" className={d.ozetKart}>
          <span>🙋</span>
          <div>
            <b>
              {ozelOz.onayBekleyenOgr
                ? `${ozelOz.onayBekleyenOgr} ders önerisi onayını bekliyor`
                : "Onay bekleyen öneri yok"}
            </b>
            <small>
              {ozelOz.onayBekleyenOgr
                ? "Özel Derslerim sayfasından yanıtla"
                : "Öğretmenin ders önerdiğinde burada görünür"}
            </small>
          </div>
        </Link>
      </section>

      {/* ── Hızlı erişim ── */}
      <section className={d.kart} aria-label="Hızlı erişim">
        <div className={d.kartBaslik}>
          <div>
            <span className={d.kucukBaslik}>HIZLI ERİŞİM</span>
            <h2>Çalışma alanların</h2>
          </div>
        </div>
        <div className={d.hizliGrid}>
          {BOLUMLER.map((b) => (
            <Link key={b.href} href={b.href} className={d.hizliKart}>
              <span>{b.ikon}</span>
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
