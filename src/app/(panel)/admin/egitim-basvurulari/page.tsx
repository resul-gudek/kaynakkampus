import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import {
  EGITIM_BASVURU_DURUMLARI,
  EGITIM_BASVURU_DURUM_ETIKETLERI,
  EGITIM_BASVURU_TURLERI,
  EGITIM_BASVURU_TUR_ETIKETLERI,
  EGITIM_ETIKETLERI,
  sinifEtiketi,
  type Egitim,
  type EgitimBasvuruTur,
} from "@/lib/egitim-basvurusu";
import DurumSecici from "./DurumSecici";
import stil from "./egitim-basvurulari.module.css";

export const metadata: Metadata = { title: "Eğitim Başvuruları – Kaynak Kampüs" };

/* Liste her istekte veritabanından okunur. Sayfa zaten oturuma ve sorgu
   parametrelerine bağlı olduğu için dinamikti; yine de AÇIKÇA belirtiliyor ki
   ileride bir değişiklik sayfayı statikleştirip yeni başvuruları gizlemesin
   ("başvurular panelde görünmüyor" hatası bir daha yaşanmasın). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SAYFA_BOYUTU = 25;

type AramaParametreleri = Promise<Record<string, string | string[] | undefined>>;

function tekDeger(deger: string | string[] | undefined): string {
  return Array.isArray(deger) ? deger[0] ?? "" : deger ?? "";
}

const fmtTarih = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** tur "" ise Tümü sekmesidir (varsayılan) — hiçbir kayıt filtreyle gizlenmez. */
function sayfaAdresi(sayfa: number, tur: string, durum: string): string {
  const p = new URLSearchParams();
  if (tur) p.set("tur", tur);
  if (durum) p.set("durum", durum);
  if (sayfa > 1) p.set("sayfa", String(sayfa));
  const q = p.toString();
  return q ? `/admin/egitim-basvurulari?${q}` : "/admin/egitim-basvurulari";
}

/** Özel derste seçilen eğitim; koçlukta eğitim alanı boştur. */
function egitimEtiketi(tur: string, egitim: string): string {
  if (tur === "egitim_koclugu") return "—";
  return EGITIM_ETIKETLERI[egitim as Egitim] ?? egitim ?? "—";
}

export default async function EgitimBasvurulariSayfasi({ searchParams }: { searchParams: AramaParametreleri }) {
  await aktifKullanici("admin");
  const params = await searchParams;

  /* Maildeki "Başvuruyu panelde aç" bağlantısının ?basvuru=<id> biçimi de
     desteklenir; doğrudan ilgili kaydın detayına götürür. */
  const basvuruParam = tekDeger(params.basvuru).trim();
  if (basvuruParam) redirect(`/admin/egitim-basvurulari/${encodeURIComponent(basvuruParam)}`);

  const turParam = tekDeger(params.tur);
  const durumParam = tekDeger(params.durum);
  const tur = (EGITIM_BASVURU_TURLERI as readonly string[]).includes(turParam) ? turParam : "";
  const durum = (EGITIM_BASVURU_DURUMLARI as readonly string[]).includes(durumParam) ? durumParam : "";
  const istenenSayfa = Math.max(1, Number.parseInt(tekDeger(params.sayfa), 10) || 1);

  const where: Prisma.EgitimBasvurusuWhereInput = {
    ...(tur ? { tur } : {}),
    ...(durum ? { durum } : {}),
  };

  const [turSayilari, yeniSayilari, durumSayilari, filtreliToplam] = await Promise.all([
    prisma.egitimBasvurusu.groupBy({ by: ["tur"], _count: { _all: true } }),
    prisma.egitimBasvurusu.groupBy({ by: ["tur"], where: { durum: "yeni" }, _count: { _all: true } }),
    prisma.egitimBasvurusu.groupBy({ by: ["durum"], where: tur ? { tur } : {}, _count: { _all: true } }),
    prisma.egitimBasvurusu.count({ where }),
  ]);

  const sayfaSayisi = Math.max(1, Math.ceil(filtreliToplam / SAYFA_BOYUTU));
  const sayfa = Math.min(istenenSayfa, sayfaSayisi);

  const basvurular = await prisma.egitimBasvurusu.findMany({
    where,
    orderBy: { olusturma: "desc" },
    skip: (sayfa - 1) * SAYFA_BOYUTU,
    take: SAYFA_BOYUTU,
    select: {
      id: true,
      tur: true,
      durum: true,
      ogrenciAd: true,
      yas: true,
      sinif: true,
      egitim: true,
      basvuran: true,
      iletisimAd: true,
      telefon: true,
      olusturma: true,
    },
  });

  const turAdet = Object.fromEntries(turSayilari.map((t) => [t.tur, t._count._all]));
  const yeniAdet = Object.fromEntries(yeniSayilari.map((t) => [t.tur, t._count._all]));
  const durumAdet = Object.fromEntries(durumSayilari.map((d) => [d.durum, d._count._all]));
  const toplam = turSayilari.reduce((t, x) => t + x._count._all, 0);
  const yeniToplam = yeniSayilari.reduce((t, x) => t + x._count._all, 0);

  return (
    <main className={`container ${stil.sayfa}`}>
      <div className="panel-bas">
        <h1>
          Eğitim <span>Başvuruları</span>
        </h1>
        <p>Sitedeki Eğitim Başvurusu formundan gelen özel ders ve eğitim koçluğu taleplerini takip edin.</p>
      </div>

      {/* Tür sekmeleri — "Tümü" varsayılandır, yeni gelen her kayıt ilk açılışta görünür */}
      <div className={stil.sekmeler} role="tablist" aria-label="Başvuru türü">
        <Link
          href={sayfaAdresi(1, "", durum)}
          className={!tur ? stil.sekmeAktif : stil.sekme}
          role="tab"
          aria-selected={!tur}
        >
          Tümü <b>{toplam}</b>
          {yeniToplam ? <span className={stil.yeniRozet}>{yeniToplam} yeni</span> : null}
        </Link>
        {EGITIM_BASVURU_TURLERI.map((t) => (
          <Link
            key={t}
            href={sayfaAdresi(1, t, durum)}
            className={tur === t ? stil.sekmeAktif : stil.sekme}
            role="tab"
            aria-selected={tur === t}
          >
            {EGITIM_BASVURU_TUR_ETIKETLERI[t]} <b>{turAdet[t] ?? 0}</b>
            {yeniAdet[t] ? <span className={stil.yeniRozet} title="Yeni başvuru">{yeniAdet[t]} yeni</span> : null}
          </Link>
        ))}
      </div>

      {/* Durum filtresi */}
      <div className={stil.durumFiltre}>
        <Link href={sayfaAdresi(1, tur, "")} className={!durum ? stil.cipAktif : stil.cip}>
          Tüm durumlar
        </Link>
        {EGITIM_BASVURU_DURUMLARI.map((d) => (
          <Link key={d} href={sayfaAdresi(1, tur, d)} className={durum === d ? stil.cipAktif : stil.cip}>
            {EGITIM_BASVURU_DURUM_ETIKETLERI[d]}
            {durumAdet[d] ? <span className={stil.cipAdet}>{durumAdet[d]}</span> : null}
          </Link>
        ))}
      </div>

      <p className={stil.sonucBilgi}>{filtreliToplam} başvuru bulundu</p>

      {basvurular.length === 0 ? (
        <div className={stil.bosDurum}>
          <span>🗂️</span>
          <b>Bu filtrede başvuru yok</b>
          <p>Yeni başvurular geldiğinde burada listelenir.</p>
        </div>
      ) : (
        <div className={stil.tabloKart}>
          <div className={stil.tabloSarici}>
            <table className={stil.tablo}>
              <thead>
                <tr>
                  <th>Öğrenci</th>
                  <th>Başvuru türü</th>
                  <th>Eğitim</th>
                  <th>Yaş / Sınıf</th>
                  <th>Telefon</th>
                  <th>Başvuru tarihi</th>
                  <th>Durum</th>
                  <th aria-label="Detay" />
                </tr>
              </thead>
              <tbody>
                {basvurular.map((b) => (
                  <tr key={b.id} className={b.durum === "yeni" ? stil.satirYeni : undefined}>
                    <td data-etiket="Öğrenci">
                      <Link href={`/admin/egitim-basvurulari/${b.id}`} className={stil.adBag}>
                        {b.ogrenciAd}
                        <small>{b.basvuran === "veli" ? `Veli: ${b.iletisimAd}` : "Kendisi başvurdu"}</small>
                      </Link>
                    </td>
                    <td data-etiket="Tür">
                      <span className={`${stil.turRozet} ${stil[`tur_${b.tur}`] ?? ""}`}>
                        {EGITIM_BASVURU_TUR_ETIKETLERI[b.tur as EgitimBasvuruTur] ?? b.tur}
                      </span>
                    </td>
                    <td data-etiket="Eğitim">
                      <span className={stil.egitimRozet}>{egitimEtiketi(b.tur, b.egitim)}</span>
                    </td>
                    <td data-etiket="Yaş / Sınıf">
                      {b.yas} yaş · {sinifEtiketi(b.sinif)}
                    </td>
                    <td data-etiket="Telefon">
                      <a href={`tel:${b.telefon.replace(/\s/g, "")}`} className={stil.telBag}>
                        {b.telefon}
                      </a>
                    </td>
                    <td data-etiket="Tarih">
                      <span className={stil.tarih}>{fmtTarih.format(b.olusturma)}</span>
                    </td>
                    <td data-etiket="Durum">
                      <DurumSecici id={b.id} durum={b.durum} />
                    </td>
                    <td data-etiket="">
                      <Link href={`/admin/egitim-basvurulari/${b.id}`} className={stil.detayBag}>
                        Detay →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sayfaSayisi > 1 && (
        <nav className={stil.sayfalama} aria-label="Başvuru sayfaları">
          {sayfa > 1 ? <Link href={sayfaAdresi(sayfa - 1, tur, durum)}>← Önceki</Link> : <span>← Önceki</span>}
          <b>
            Sayfa {sayfa} / {sayfaSayisi}
          </b>
          {sayfa < sayfaSayisi ? <Link href={sayfaAdresi(sayfa + 1, tur, durum)}>Sonraki →</Link> : <span>Sonraki →</span>}
        </nav>
      )}
    </main>
  );
}
