import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { ogrenciOzet, profilAyristir } from "@/lib/hesap";
import DenemeBolumu from "@/components/ogrenci/DenemeBolumu";
import KayitOdagi from "@/components/ogrenci/KayitOdagi";
import OdevListesi from "@/components/ogrenci/OdevListesi";
import OzelDersBolumu from "@/components/ogrenci/OzelDersBolumu";
import ProfilBolumu from "@/components/ogrenci/ProfilBolumu";
import Takvim from "@/components/ogrenci/Takvim";
import TakipListesi from "@/components/ogrenci/TakipListesi";
import YolHaritasi from "@/components/ogrenci/YolHaritasi";
import s from "@/components/ogrenci/panel.module.css";

export const metadata: Metadata = { title: "Öğrenci Paneli – Kaynak Akademi" };

export default async function OgrenciPanel({
  searchParams,
}: {
  searchParams: Promise<{ sekme?: string; kayit?: string }>;
}) {
  const ogrenci = await aktifKullanici("ogrenci");
  const sp = await searchParams;

  const [koc, odevler, takip, denemeler, yolAdimlari, ozelDersler] = await Promise.all([
    ogrenci.kocId
      ? prisma.kullanici.findUnique({ where: { id: ogrenci.kocId } })
      : Promise.resolve(null),
    prisma.odev.findMany({ where: { ogrenciId: ogrenci.id } }),
    prisma.takip.findMany({ where: { ogrenciId: ogrenci.id } }),
    prisma.deneme.findMany({
      where: { ogrenciId: ogrenci.id },
      include: { dersler: true },
      orderBy: { tarih: "asc" },
    }),
    prisma.yolAdimi.findMany({ where: { ogrenciId: ogrenci.id }, orderBy: { sira: "asc" } }),
    prisma.ozelDers.findMany({
      where: { ogrenciId: ogrenci.id, NOT: { durum: "iptal" } },
      orderBy: [{ tarih: "asc" }, { saat: "asc" }],
    }),
  ]);

  const profil = profilAyristir(ogrenci.profil);
  const oz = ogrenciOzet(odevler, takip, denemeler, yolAdimlari);

  const kocHarfler = koc
    ? koc.ad
        .split(" ")
        .map((parca) => parca[0])
        .join("")
        .slice(0, 2)
        .toLocaleUpperCase("tr-TR")
    : "";

  return (
    <main className="container">
      <KayitOdagi kayit={sp.kayit} sekme={sp.sekme} />

      {/* ── Sayfa başı ── */}
      <div className="panel-bas">
        <h1>
          📚 Öğrenci <span>Paneli</span>
        </h1>
        <p>Öğretmeninin verdiği ödevleri ve haftalık takip listeni buradan izle, tamamladıklarını işaretle.</p>
        <div className={s["koc-kart"]}>
          {koc ? (
            <>
              <div className="avatar">{kocHarfler}</div>
              <div>
                <small>Öğretmenin</small>
                <b>{koc.ad}</b>
                <small>{koc.brans || ""}</small>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <small>Hedefin</small>
                <b>{ogrenci.hedef || "—"}</b>
              </div>
            </>
          ) : (
            <div>
              <b>Henüz bir öğretmene atanmadın.</b>
              <small>Öğretmen ataması yapıldığında ödev ve takip listen burada görünecek.</small>
            </div>
          )}
        </div>
      </div>

      {/* ── İstatistikler ── */}
      <div className="stat-grid">
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#f0fdf4" }}>✅</div>
          <div>
            <b>%{oz.odevYuzde}</b>
            <small>Ödev Tamamlama</small>
          </div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#ecfeff" }}>📊</div>
          <div>
            <b>%{oz.takipYuzde}</b>
            <small>Takip Listesi</small>
          </div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#e8effe" }}>🎯</div>
          <div>
            <b>
              {oz.sonNet === null ? "—" : oz.sonNet}
              {oz.netFarki !== null && (
                <>
                  {" "}
                  <span
                    className={oz.netFarki >= 0 ? s["net-artis"] : s["net-dusus"]}
                    style={{ fontSize: ".85rem" }}
                  >
                    {oz.netFarki >= 0 ? "▲ +" : "▼ "}
                    {oz.netFarki}
                  </span>
                </>
              )}
            </b>
            <small>Son Deneme Neti</small>
          </div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#fff7ed" }}>⭐</div>
          <div>
            <b>Seviye {oz.seviye}</b>
            <small>{oz.xp} XP</small>
          </div>
        </div>
      </div>

      {/* ── Bölümler (legacy sırasıyla) ── */}
      <Takvim odevler={odevler} ozelDersler={ozelDersler} denemeler={denemeler} takip={takip} />
      <ProfilBolumu ogrenciId={ogrenci.id} profil={profil} />
      <YolHaritasi adimlar={yolAdimlari} />
      <OdevListesi odevler={odevler} />
      <OzelDersBolumu ogrenciId={ogrenci.id} kocVar={!!ogrenci.kocId} dersler={ozelDersler} />
      <TakipListesi takip={takip} />
      <DenemeBolumu ogrenciId={ogrenci.id} denemeler={denemeler} profil={profil} />
    </main>
  );
}
