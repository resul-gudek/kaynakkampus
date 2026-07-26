import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import {
  BASVURU_DURUMLARI,
  BASVURU_DURUM_ETIKETLERI,
  BASVURU_TURLERI,
  BASVURU_TUR_ETIKETLERI,
  type BasvuruDurum,
  type BasvuruTur,
} from "@/lib/sabitler";
import stil from "./basvurular.module.css";

export const metadata: Metadata = { title: "Başvurular – Kaynak Kampüs" };

const SAYFA_BOYUTU = 20;

type AramaParametreleri = Promise<Record<string, string | string[] | undefined>>;

function tekDeger(deger: string | string[] | undefined): string {
  return Array.isArray(deger) ? deger[0] ?? "" : deger ?? "";
}

function tarihMetni(tarih: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(tarih);
}

function sayfaAdresi(sayfa: number, tur: string, durum: string): string {
  const p = new URLSearchParams();
  if (tur) p.set("tur", tur);
  if (durum) p.set("durum", durum);
  if (sayfa > 1) p.set("sayfa", String(sayfa));
  const q = p.toString();
  return q ? `/admin/basvurular?${q}` : "/admin/basvurular";
}

export default async function BasvurularSayfasi({
  searchParams,
}: {
  searchParams: AramaParametreleri;
}) {
  await aktifKullanici("admin");
  const params = await searchParams;

  const turParam = tekDeger(params.tur);
  const durumParam = tekDeger(params.durum);
  const tur = (BASVURU_TURLERI as readonly string[]).includes(turParam) ? turParam : "";
  const durum = (BASVURU_DURUMLARI as readonly string[]).includes(durumParam) ? durumParam : "";
  const istenenSayfa = Math.max(1, Number.parseInt(tekDeger(params.sayfa), 10) || 1);

  const where: Prisma.BasvuruWhereInput = {
    ...(tur ? { tur } : {}),
    ...(durum ? { durum } : {}),
  };

  const [turSayilari, durumSayilari, filtreliToplam] = await Promise.all([
    prisma.basvuru.groupBy({ by: ["tur"], _count: { _all: true } }),
    prisma.basvuru.groupBy({ by: ["durum"], where: tur ? { tur } : {}, _count: { _all: true } }),
    prisma.basvuru.count({ where }),
  ]);

  const sayfaSayisi = Math.max(1, Math.ceil(filtreliToplam / SAYFA_BOYUTU));
  const sayfa = Math.min(istenenSayfa, sayfaSayisi);

  const basvurular = await prisma.basvuru.findMany({
    where,
    orderBy: { olusturma: "desc" },
    skip: (sayfa - 1) * SAYFA_BOYUTU,
    take: SAYFA_BOYUTU,
    select: {
      id: true,
      tur: true,
      ad: true,
      telefon: true,
      eposta: true,
      durum: true,
      olusturma: true,
      _count: { select: { dosyalar: true, mulakatlar: true } },
    },
  });

  const turAdet = Object.fromEntries(turSayilari.map((t) => [t.tur, t._count._all]));
  const durumAdet = Object.fromEntries(durumSayilari.map((d) => [d.durum, d._count._all]));
  const toplam = turSayilari.reduce((t, x) => t + x._count._all, 0);

  return (
    <main className={`container ${stil.sayfa}`}>
      <div className="panel-bas">
        <h1>
          Başvuru <span>Yönetimi</span>
        </h1>
        <p>Öğretmen, öğrenci ve eğitim koçu ön mülakat başvurularını yönetin.</p>
      </div>

      {/* Tür sekmeleri */}
      <div className={stil.sekmeler}>
        <Link href={sayfaAdresi(1, "", durum)} className={!tur ? stil.sekmeAktif : stil.sekme}>
          Tümü <b>{toplam}</b>
        </Link>
        {BASVURU_TURLERI.map((t) => (
          <Link
            key={t}
            href={sayfaAdresi(1, t, durum)}
            className={tur === t ? stil.sekmeAktif : stil.sekme}
          >
            {BASVURU_TUR_ETIKETLERI[t]} <b>{turAdet[t] ?? 0}</b>
          </Link>
        ))}
      </div>

      {/* Durum filtresi */}
      <div className={stil.durumFiltre}>
        <Link href={sayfaAdresi(1, tur, "")} className={!durum ? stil.cipAktif : stil.cip}>
          Tüm durumlar
        </Link>
        {BASVURU_DURUMLARI.map((d) => (
          <Link
            key={d}
            href={sayfaAdresi(1, tur, d)}
            className={durum === d ? stil.cipAktif : stil.cip}
          >
            {BASVURU_DURUM_ETIKETLERI[d]}
            {durumAdet[d] ? <span className={stil.cipAdet}>{durumAdet[d]}</span> : null}
          </Link>
        ))}
      </div>

      <p className={stil.sonucBilgi}>{filtreliToplam} başvuru bulundu</p>

      <div className={stil.kartGrid}>
        {basvurular.map((b) => (
          <Link key={b.id} href={`/admin/basvurular/${b.id}`} className={stil.kart}>
            <div className={stil.kartUst}>
              <span className={`${stil.turRozet} ${stil[`tur_${b.tur}`] ?? ""}`}>
                {BASVURU_TUR_ETIKETLERI[b.tur as BasvuruTur] ?? b.tur}
              </span>
              <span className={`${stil.durumRozet} ${stil[`durum_${b.durum}`] ?? ""}`}>
                {BASVURU_DURUM_ETIKETLERI[b.durum as BasvuruDurum] ?? b.durum}
              </span>
            </div>
            <b className={stil.kartAd}>{b.ad}</b>
            <div className={stil.kartBilgi}>
              {b.telefon && <span>📞 {b.telefon}</span>}
              {b.eposta && <span>✉️ {b.eposta}</span>}
            </div>
            <div className={stil.kartAlt}>
              <span>{tarihMetni(b.olusturma)}</span>
              <span className={stil.kartRozetler}>
                {b._count.dosyalar > 0 && <span title="Yüklenen belge">📎 {b._count.dosyalar}</span>}
                {b._count.mulakatlar > 0 && <span title="Mülakat sayısı">📅 {b._count.mulakatlar}</span>}
              </span>
            </div>
          </Link>
        ))}
        {basvurular.length === 0 && (
          <div className={stil.bosDurum}>
            <span>🗂️</span>
            <b>Bu filtrede başvuru yok</b>
            <p>Filtreleri değiştirip tekrar deneyin.</p>
          </div>
        )}
      </div>

      {sayfaSayisi > 1 && (
        <nav className={stil.sayfalama} aria-label="Başvuru sayfaları">
          {sayfa > 1 ? (
            <Link href={sayfaAdresi(sayfa - 1, tur, durum)}>← Önceki</Link>
          ) : (
            <span>← Önceki</span>
          )}
          <b>
            Sayfa {sayfa} / {sayfaSayisi}
          </b>
          {sayfa < sayfaSayisi ? (
            <Link href={sayfaAdresi(sayfa + 1, tur, durum)}>Sonraki →</Link>
          ) : (
            <span>Sonraki →</span>
          )}
        </nav>
      )}
    </main>
  );
}
