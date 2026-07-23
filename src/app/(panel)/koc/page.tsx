import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import {
  isoTarih,
  ogrenciOzet,
  ozelDersOzet,
  profilAyristir,
  tarihStr,
  xpOzet,
  yanlisKonulariAyristir,
  yolDurumlu,
  zayifKonular,
} from "@/lib/hesap";
import Ajanda from "@/components/koc/Ajanda";
import OgrenciFormlari from "@/components/koc/OgrenciFormlari";
import WaButonlar from "@/components/koc/WaButonlar";
import ProfilSekmesi from "@/components/koc/ProfilSekmesi";
import OdevSekmesi from "@/components/koc/OdevSekmesi";
import TakipSekmesi from "@/components/koc/TakipSekmesi";
import YolSekmesi from "@/components/koc/YolSekmesi";
import DenemeSekmesi from "@/components/koc/DenemeSekmesi";
import OzelSekmesi from "@/components/koc/OzelSekmesi";
import type { AjandaOlay, WaVeri } from "@/components/koc/tipler";
import s from "@/components/koc/koc.module.css";

export const metadata: Metadata = { title: "Öğretmen Paneli – Kaynak Akademi" };

/* Derin bağlantı sözleşmesi: ?ogrenci=<id>&sekme=<...>&kayit=<id>
   Legacy sekme adları (odev/deneme) da kabul edilir. */
const SEKMELER = [
  { anahtar: "profil", etiket: "🎯 Başlangıç Profili" },
  { anahtar: "odevler", etiket: "📘 Ödevler" },
  { anahtar: "takip", etiket: "✅ Takip Listesi" },
  { anahtar: "yol", etiket: "🗺️ Yol Haritası" },
  { anahtar: "denemeler", etiket: "📈 Deneme Sonuçları" },
  { anahtar: "ozel", etiket: "🎓 Özel Dersler" },
] as const;
const SEKME_ES: Record<string, string> = { odev: "odevler", deneme: "denemeler" };

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
  const koc = await aktifKullanici("koc");
  const sp = await searchParams;

  const [ogrenciler, atanmamis] = await Promise.all([
    prisma.kullanici.findMany({
      where: { rol: "ogrenci", kocId: koc.id },
      orderBy: { ad: "asc" },
      include: {
        odevlerOgrenci: { orderBy: { sonTarih: "asc" } },
        takipOgrenci: true,
        denemeler: { include: { dersler: true }, orderBy: [{ tarih: "asc" }, { id: "asc" }] },
        yolOgrenci: { orderBy: { sira: "asc" } },
        ozelDersOgrenci: { orderBy: [{ tarih: "asc" }, { saat: "asc" }] },
      },
    }),
    prisma.kullanici.findMany({
      where: { rol: "ogrenci", kocId: null },
      orderBy: { ad: "asc" },
      select: { id: true, ad: true, sinif: true },
    }),
  ]);

  /* ── İstatistik kartları ── */
  const tumOdevler = ogrenciler.flatMap((o) => o.odevlerOgrenci);
  const tumTakip = ogrenciler.flatMap((o) => o.takipOgrenci);
  const tumOzel = ogrenciler.flatMap((o) => o.ozelDersOgrenci);
  const bekleyenOdev = tumOdevler.filter((o) => o.durum === "bekliyor").length;
  const onayBekleyen = tumOzel.filter((x) => x.durum === "talep" && x.olusturan === "ogrenci").length;

  /* ── Ajanda olayları (tüm öğrencilerden, öğrenci adıyla) ── */
  const olaylar: AjandaOlay[] = [];
  for (const o of ogrenciler) {
    const kisaAd = o.ad.split(" ")[0];
    for (const x of o.ozelDersOgrenci) {
      if (!["planlandi", "yapildi", "talep"].includes(x.durum)) continue;
      olaylar.push({
        tip: "ozel",
        tarih: isoTarih(x.tarih),
        tamam: x.durum === "yapildi",
        etiket: "🎓 " + (x.saat ? x.saat + " " : "") + kisaAd,
        baslik: `🎓 Özel Ders · ${o.ad}`,
        metin: x.ders + (x.konu ? " – " + x.konu : ""),
        etiketler: x.saat ? [`🕐 ${x.saat} · ${x.sure || 60} dk`] : [],
        rozet:
          x.durum === "yapildi"
            ? { stil: "tamam", metin: "✓ Yapıldı" }
            : x.durum === "talep"
              ? { stil: "talep", metin: "🕓 Onay bekliyor" }
              : { stil: "bekliyor", metin: "📌 Planlandı" },
      });
    }
    for (const od of o.odevlerOgrenci) {
      if (!od.sonTarih) continue;
      olaylar.push({
        tip: "odev",
        tarih: isoTarih(od.sonTarih),
        tamam: od.durum === "tamamlandi",
        etiket: `📘 ${kisaAd}: ${od.ders}`,
        baslik: `📘 Ödev son günü · ${o.ad}`,
        metin: `${od.ders} – ${od.konu}`,
        etiketler: od.soruSayisi ? [`${od.soruSayisi} soru`] : [],
        rozet:
          od.durum === "tamamlandi"
            ? { stil: "tamam", metin: "✓ Tamamlandı" }
            : { stil: "bekliyor", metin: "⏳ Bekliyor" },
      });
    }
    for (const d of o.denemeler) {
      olaylar.push({
        tip: "deneme",
        tarih: isoTarih(d.tarih),
        tamam: false,
        etiket: `📈 ${kisaAd}: ${d.tur}`,
        baslik: `📈 Deneme · ${o.ad}`,
        metin: d.ad,
        etiketler: [d.tur, `Net: ${d.net}`],
        rozet: null,
      });
    }
  }

  /* ── Seçili öğrenci ve sekme ── */
  const secili = sp.ogrenci ? ogrenciler.find((o) => o.id === sp.ogrenci) : undefined;
  let sekme: string = sp.sekme ?? "profil";
  sekme = SEKME_ES[sekme] ?? sekme;
  if (!SEKMELER.some((x) => x.anahtar === sekme)) sekme = "profil";

  /* Seçili öğrencinin serileştirilmiş verileri */
  let detay: React.ReactNode = null;
  if (secili) {
    const profil = profilAyristir(secili.profil);
    const zayif = zayifKonular(secili.denemeler, profil).map((z) => ({
      ders: z.ders,
      konu: z.konu,
      kez: z.kez,
    }));
    const yolOz = xpOzet(secili.yolOgrenci);
    const ozelOz = ozelDersOzet(secili.ozelDersOgrenci);
    const oz = ogrenciOzet(
      secili.odevlerOgrenci,
      secili.takipOgrenci,
      secili.denemeler,
      secili.yolOgrenci
    );
    const sonDeneme = secili.denemeler.length
      ? secili.denemeler[secili.denemeler.length - 1]
      : null;

    const waVeri: WaVeri = {
      ogrenciId: secili.id,
      ad: secili.ad,
      telefon: secili.telefon,
      veliTelefon: secili.veliTelefon,
      kocAd: koc.ad,
      bekleyenOdevler: secili.odevlerOgrenci
        .filter((x) => x.durum === "bekliyor")
        .map((x) => ({
          ders: x.ders,
          konu: x.konu,
          sonTarih: isoTarih(x.sonTarih),
          kaynak: x.kaynak,
        })),
      odevYuzde: oz.odevYuzde,
      odevTamam: oz.odevTamam,
      odevToplam: oz.odevToplam,
      takipYuzde: oz.takipYuzde,
      takipTamam: oz.takipTamam,
      takipToplam: oz.takipToplam,
      yolYuzde: yolOz.yuzde,
      yolTamamlanan: yolOz.tamamlanan,
      yolToplam: yolOz.toplam,
      seviye: yolOz.seviye,
      xp: yolOz.xp,
      sonDeneme: sonDeneme ? { ad: sonDeneme.ad, net: sonDeneme.net } : null,
      netFarki: oz.netFarki,
      zayif: zayif.slice(0, 3).map((z) => ({ ders: z.ders, konu: z.konu })),
      ozel: {
        toplam: ozelOz.toplam,
        yapilan: ozelOz.yapilan,
        toplamSaat: ozelOz.toplamSaat,
        sonrakiTarih: ozelOz.sonraki ? isoTarih(ozelOz.sonraki.tarih) : "",
        sonrakiSaat: ozelOz.sonraki?.saat ?? "",
        bekleyenUcret: ozelOz.bekleyenUcret,
      },
    };

    detay = (
      <section className={s.bolum} id="detay">
        <div className={s.bolumBas}>
          <h2>📋 {secili.ad}</h2>
          <div className={s.basButonlar}>
            <span className="tag">
              {secili.sinif || "—"} · {secili.hedef || "—"}
            </span>
            <WaButonlar veri={waVeri} />
          </div>
        </div>

        <div className={s.sekmeler}>
          {SEKMELER.map((sk) => (
            <Link
              key={sk.anahtar}
              scroll={false}
              className={`${s.sekme} ${sekme === sk.anahtar ? s.aktif : ""}`}
              href={`/koc?ogrenci=${secili.id}&sekme=${sk.anahtar}`}
            >
              {sk.etiket}
            </Link>
          ))}
        </div>

        {sekme === "profil" && (
          <ProfilSekmesi
            ogrenciId={secili.id}
            sinif={secili.sinif ?? ""}
            profil={profil}
            zayif={zayif}
          />
        )}
        {sekme === "odevler" && (
          <OdevSekmesi
            ogrenciId={secili.id}
            vurguId={sp.kayit}
            odevler={secili.odevlerOgrenci.map((x) => ({
              id: x.id,
              ders: x.ders,
              konu: x.konu,
              aciklama: x.aciklama,
              kaynak: x.kaynak,
              soruSayisi: x.soruSayisi,
              sonTarih: isoTarih(x.sonTarih),
              durum: x.durum,
            }))}
          />
        )}
        {sekme === "takip" && (
          <TakipSekmesi
            ogrenciId={secili.id}
            gorevler={secili.takipOgrenci.map((t) => ({
              id: t.id,
              gun: t.gun,
              gorev: t.gorev,
              tamamlandi: t.tamamlandi,
            }))}
          />
        )}
        {sekme === "yol" && (
          <YolSekmesi
            ogrenciId={secili.id}
            ozet={yolOz}
            adimlar={yolDurumlu(secili.yolOgrenci).map((a) => ({
              id: a.id,
              sira: a.sira,
              ders: a.ders,
              konu: a.konu,
              hedef: a.hedef,
              xp: a.xp,
              durum: a.durum,
            }))}
          />
        )}
        {sekme === "denemeler" && (
          <DenemeSekmesi
            denemeler={secili.denemeler.map((d) => ({
              id: d.id,
              ad: d.ad,
              tur: d.tur,
              tarih: isoTarih(d.tarih),
              net: d.net,
              dersler: d.dersler.map((dr) => ({
                ders: dr.ders,
                dogru: dr.dogru,
                yanlis: dr.yanlis,
                bos: dr.bos,
                net: dr.net,
                yanlisKonular: yanlisKonulariAyristir(dr.yanlisKonular),
              })),
            }))}
          />
        )}
        {sekme === "ozel" && (
          <OzelSekmesi
            ogrenciId={secili.id}
            ogrenciAd={secili.ad}
            telefon={secili.telefon}
            kocAd={koc.ad}
            vurguId={sp.kayit}
            ozet={{
              toplam: ozelOz.toplam,
              yapilan: ozelOz.yapilan,
              planlanan: ozelOz.planlanan,
              toplamSaat: ozelOz.toplamSaat,
              bekleyenUcret: ozelOz.bekleyenUcret,
              sonrakiMetin: ozelOz.sonraki
                ? `${tarihStr(ozelOz.sonraki.tarih)}${ozelOz.sonraki.saat ? " " + ozelOz.sonraki.saat : ""} – ${ozelOz.sonraki.ders}`
                : "",
              gecikenPlan: ozelOz.gecikenPlan,
              onayBekleyenKoc: ozelOz.onayBekleyenKoc,
              onayBekleyenOgr: ozelOz.onayBekleyenOgr,
            }}
            dersler={secili.ozelDersOgrenci.map((x) => ({
              id: x.id,
              ders: x.ders,
              konu: x.konu,
              tarih: isoTarih(x.tarih),
              saat: x.saat,
              sure: x.sure,
              ucret: x.ucret,
              odendi: x.odendi,
              durum: x.durum,
              olusturan: x.olusturan,
              mesaj: x.mesaj,
              redNotu: x.redNotu,
              not_: x.not_,
              odev: x.odev,
            }))}
          />
        )}
      </section>
    );
  }

  return (
    <main className="container">
      {/* ── Sayfa başı ── */}
      <div className="panel-bas">
        <h1>
          🎓 Öğretmen <span>Paneli</span>
        </h1>
        <p>
          Hoş geldin, {koc.ad}. Öğrencilerini seç; ödev ver, haftalık takip listesini yönet, deneme
          gelişimini izle.
        </p>
      </div>

      {/* ── İstatistik kartları ── */}
      <div className="stat-grid">
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#e8effe" }}>👥</div>
          <div>
            <b>{ogrenciler.length}</b>
            <small>Öğrencim</small>
          </div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#fff7ed" }}>📘</div>
          <div>
            <b>{bekleyenOdev}</b>
            <small>Bekleyen Ödev</small>
          </div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#f0fdf4" }}>✅</div>
          <div>
            <b>{tumTakip.length}</b>
            <small>Takip Görevi</small>
          </div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#eff6ff" }}>🙋</div>
          <div>
            <b>{onayBekleyen}</b>
            <small>Onay Bekleyen Talep</small>
          </div>
        </div>
      </div>

      {/* ── Ajanda / Takvim ── */}
      <Ajanda olaylar={olaylar} />

      {/* ── Öğrencilerim ── */}
      <section className={s.bolum}>
        <OgrenciFormlari
          atanmamis={atanmamis.map((o) => ({ id: o.id, ad: o.ad, sinif: o.sinif ?? "" }))}
        />
        {ogrenciler.length ? (
          <div className={s.ogrenciGrid}>
            {ogrenciler.map((o) => {
              const oz = ogrenciOzet(o.odevlerOgrenci, o.takipOgrenci, o.denemeler, o.yolOgrenci);
              return (
                <Link
                  key={o.id}
                  href={`/koc?ogrenci=${o.id}#detay`}
                  className={`${s.ogrenciKart} ${o.id === secili?.id ? s.secili : ""}`}
                >
                  <div className={s.ogrenciKartBas}>
                    <div className="avatar">{basHarfler(o.ad)}</div>
                    <div>
                      <b>{o.ad}</b>
                      <small>
                        {o.sinif || "—"} · {o.hedef || "—"}
                      </small>
                    </div>
                  </div>
                  <div className={s.miniSatir}>
                    <span>Ödev</span>
                    <b>
                      {oz.odevTamam}/{oz.odevToplam}
                    </b>
                  </div>
                  <div className={s.ilerleme}>
                    <i style={{ width: `${oz.odevYuzde}%` }} />
                  </div>
                  <div className={s.miniSatir}>
                    <span>Takip Listesi</span>
                    <b>%{oz.takipYuzde}</b>
                  </div>
                  <div className={s.ilerleme}>
                    <i style={{ width: `${oz.takipYuzde}%` }} />
                  </div>
                  <div className={s.miniSatir}>
                    <span>Yol Haritası</span>
                    <b>
                      Sv. {oz.seviye} · ⭐ {oz.xp} XP · %{oz.yolYuzde}
                    </b>
                  </div>
                  <div className={s.ilerleme}>
                    <i className={s.turuncu} style={{ width: `${oz.yolYuzde}%` }} />
                  </div>
                  <div className={s.miniSatir}>
                    <span>Son Deneme Neti</span>
                    <b>
                      {oz.sonNet === null ? (
                        "—"
                      ) : (
                        <>
                          {oz.sonNet}
                          {oz.netFarki !== null && (
                            <span className={oz.netFarki >= 0 ? s.netArtis : s.netDusus}>
                              {" "}
                              ({oz.netFarki >= 0 ? "+" : ""}
                              {oz.netFarki})
                            </span>
                          )}
                        </>
                      )}
                    </b>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className={s.bosMesaj}>
            {'Henüz öğrencin yok. "Yeni Öğrenci Ekle" ile başlayabilirsin.'}
          </p>
        )}
      </section>

      {/* ── Öğrenci detayı ── */}
      {detay}
    </main>
  );
}
