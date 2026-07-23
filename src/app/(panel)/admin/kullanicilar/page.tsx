import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { ROL_ETIKETLERI } from "@/lib/navigasyon";
import type { Rol } from "@/lib/sabitler";
import KullaniciEkleFormu from "./KullaniciEkleFormu";
import stil from "./kullanicilar.module.css";

export const metadata: Metadata = { title: "Kullanıcı Listesi – Kaynak Akademi" };

const SAYFA_BOYUTU = 20;
const ROLLER = ["admin", "koc", "ogrenci"] as const;

type AramaParametreleri = Promise<Record<string, string | string[] | undefined>>;

function tekDeger(deger: string | string[] | undefined): string {
  return Array.isArray(deger) ? deger[0] ?? "" : deger ?? "";
}

function tarihMetni(tarih: Date | null): string {
  if (!tarih) return "Henüz giriş yapmadı";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(tarih);
}

function sayfaAdresi(
  sayfa: number,
  filtreler: { arama: string; rol: string; durum: string }
): string {
  const params = new URLSearchParams();
  if (filtreler.arama) params.set("arama", filtreler.arama);
  if (filtreler.rol) params.set("rol", filtreler.rol);
  if (filtreler.durum) params.set("durum", filtreler.durum);
  if (sayfa > 1) params.set("sayfa", String(sayfa));
  const sorgu = params.toString();
  return sorgu ? `/admin/kullanicilar?${sorgu}` : "/admin/kullanicilar";
}

export default async function KullanicilarSayfasi({
  searchParams,
}: {
  searchParams: AramaParametreleri;
}) {
  await aktifKullanici("admin");

  const params = await searchParams;
  const arama = tekDeger(params.arama).trim().slice(0, 80);
  const rolParam = tekDeger(params.rol);
  const durumParam = tekDeger(params.durum);
  const rol = ROLLER.includes(rolParam as (typeof ROLLER)[number]) ? rolParam : "";
  const durum = durumParam === "aktif" || durumParam === "pasif" ? durumParam : "";
  const istenenSayfa = Math.max(1, Number.parseInt(tekDeger(params.sayfa), 10) || 1);

  const where: Prisma.KullaniciWhereInput = {
    ...(rol ? { rol } : {}),
    ...(durum ? { aktif: durum === "aktif" } : {}),
    ...(arama
      ? {
          OR: [
            { ad: { contains: arama } },
            { kullanici: { contains: arama } },
            { eposta: { contains: arama } },
          ],
        }
      : {}),
  };

  const [toplam, aktifToplam, rolSayilari, filtreliToplam, kocSecenekleri] = await Promise.all([
    prisma.kullanici.count(),
    prisma.kullanici.count({ where: { aktif: true } }),
    prisma.kullanici.groupBy({ by: ["rol"], _count: { _all: true } }),
    prisma.kullanici.count({ where }),
    prisma.kullanici.findMany({
      where: { rol: "koc", aktif: true },
      orderBy: { ad: "asc" },
      select: { id: true, ad: true },
    }),
  ]);

  const sayfaSayisi = Math.max(1, Math.ceil(filtreliToplam / SAYFA_BOYUTU));
  const sayfa = Math.min(istenenSayfa, sayfaSayisi);
  const kullanicilar = await prisma.kullanici.findMany({
    where,
    orderBy: [{ aktif: "desc" }, { ad: "asc" }],
    skip: (sayfa - 1) * SAYFA_BOYUTU,
    take: SAYFA_BOYUTU,
    select: {
      id: true,
      ad: true,
      kullanici: true,
      rol: true,
      aktif: true,
      eposta: true,
      telefon: true,
      brans: true,
      sinif: true,
      koc: { select: { ad: true } },
      sonGorulme: true,
      olusturma: true,
      _count: { select: { ogrenciler: true } },
    },
  });

  const rolToplamlari = Object.fromEntries(
    rolSayilari.map((kayit) => [kayit.rol, kayit._count._all])
  );
  const filtreler = { arama, rol, durum };
  const ilkKayit = filtreliToplam === 0 ? 0 : (sayfa - 1) * SAYFA_BOYUTU + 1;
  const sonKayit = Math.min(sayfa * SAYFA_BOYUTU, filtreliToplam);

  return (
    <main className={`container ${stil.sayfa}`}>
      <div className="panel-bas">
        <h1>
          Kullanıcı <span>Listesi</span>
        </h1>
        <p>Tüm yönetici, koç ve öğrenci hesaplarını tek ekrandan görüntüleyin.</p>
      </div>

      <KullaniciEkleFormu koclar={kocSecenekleri} />

      <section className={stil.ozetGrid} aria-label="Kullanıcı özeti">
        <div className={stil.ozetKart}>
          <span className={`${stil.ozetIkon} ${stil.mavi}`}>👥</span>
          <div><small>Toplam kullanıcı</small><b>{toplam}</b></div>
        </div>
        <div className={stil.ozetKart}>
          <span className={`${stil.ozetIkon} ${stil.yesil}`}>✓</span>
          <div><small>Aktif hesap</small><b>{aktifToplam}</b></div>
        </div>
        <div className={stil.ozetKart}>
          <span className={`${stil.ozetIkon} ${stil.turkuaz}`}>🎓</span>
          <div><small>Öğrenci</small><b>{rolToplamlari.ogrenci ?? 0}</b></div>
        </div>
        <div className={stil.ozetKart}>
          <span className={`${stil.ozetIkon} ${stil.turuncu}`}>👩‍🏫</span>
          <div><small>Koç</small><b>{rolToplamlari.koc ?? 0}</b></div>
        </div>
      </section>

      <section className={stil.listeKart}>
        <form className={stil.filtreler} action="/admin/kullanicilar" method="get">
          <label className={stil.aramaAlani}>
            <span className={stil.gizliEtiket}>Kullanıcı ara</span>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              name="arama"
              defaultValue={arama}
              placeholder="Ad, kullanıcı adı veya e-posta ara"
            />
          </label>
          <label>
            <span className={stil.gizliEtiket}>Role göre filtrele</span>
            <select name="rol" defaultValue={rol}>
              <option value="">Tüm roller</option>
              <option value="admin">Yönetici</option>
              <option value="koc">Koç</option>
              <option value="ogrenci">Öğrenci</option>
            </select>
          </label>
          <label>
            <span className={stil.gizliEtiket}>Duruma göre filtrele</span>
            <select name="durum" defaultValue={durum}>
              <option value="">Tüm durumlar</option>
              <option value="aktif">Aktif</option>
              <option value="pasif">Pasif</option>
            </select>
          </label>
          <button type="submit" className="btn btn-primary btn-kucuk">Filtrele</button>
          {(arama || rol || durum) && (
            <Link href="/admin/kullanicilar" className={stil.temizle}>Temizle</Link>
          )}
        </form>

        <div className={stil.listeBaslik}>
          <div>
            <h2>Kayıtlı kullanıcılar</h2>
            <p>{filtreliToplam} hesap bulundu</p>
          </div>
          <span>{ilkKayit}–{sonKayit} / {filtreliToplam}</span>
        </div>

        <div className={stil.tabloSarici}>
          <table className={stil.tablo}>
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>Rol</th>
                <th>İletişim / Detay</th>
                <th>Bağlantı</th>
                <th>Son görülme</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {kullanicilar.map((kullanici) => {
                const kullaniciRol = kullanici.rol as Rol;
                const baglanti =
                  kullanici.rol === "koc"
                    ? `${kullanici._count.ogrenciler} öğrenci`
                    : kullanici.rol === "ogrenci"
                      ? kullanici.koc?.ad ?? "Koç atanmamış"
                      : "Yönetim erişimi";
                const detay =
                  kullanici.eposta ||
                  (kullanici.rol === "koc"
                    ? kullanici.brans
                    : kullanici.rol === "ogrenci"
                      ? [kullanici.sinif, kullanici.telefon].filter(Boolean).join(" · ")
                      : "");

                return (
                  <tr key={kullanici.id} className={kullanici.aktif ? "" : stil.pasifSatir}>
                    <td>
                      <div className={stil.kullaniciHucre}>
                        <span className={stil.avatar}>
                          {kullanici.ad.slice(0, 1).toLocaleUpperCase("tr-TR")}
                        </span>
                        <div>
                          <b>{kullanici.ad}</b>
                          <small>@{kullanici.kullanici}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${stil.rol} ${stil[`rol_${kullanici.rol}`] ?? ""}`}>
                        {ROL_ETIKETLERI[kullaniciRol] ?? kullanici.rol}
                      </span>
                    </td>
                    <td className={stil.ikincil}>{detay || "—"}</td>
                    <td>
                      <span className={kullanici.rol === "ogrenci" && !kullanici.koc ? stil.uyari : ""}>
                        {baglanti}
                      </span>
                    </td>
                    <td>
                      <span className={stil.tarih}>{tarihMetni(kullanici.sonGorulme)}</span>
                      <small className={stil.kayitTarihi}>
                        Kayıt: {tarihMetni(kullanici.olusturma)}
                      </small>
                    </td>
                    <td>
                      <span className={kullanici.aktif ? stil.durumAktif : stil.durumPasif}>
                        <i /> {kullanici.aktif ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {kullanicilar.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className={stil.bosDurum}>
                      <span>⌕</span>
                      <b>Eşleşen kullanıcı bulunamadı</b>
                      <p>Arama ifadesini veya filtreleri değiştirip tekrar deneyin.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {sayfaSayisi > 1 && (
          <nav className={stil.sayfalama} aria-label="Kullanıcı listesi sayfaları">
            {sayfa > 1 ? (
              <Link href={sayfaAdresi(sayfa - 1, filtreler)}>← Önceki</Link>
            ) : <span>← Önceki</span>}
            <b>Sayfa {sayfa} / {sayfaSayisi}</b>
            {sayfa < sayfaSayisi ? (
              <Link href={sayfaAdresi(sayfa + 1, filtreler)}>Sonraki →</Link>
            ) : <span>Sonraki →</span>}
          </nav>
        )}
      </section>
    </main>
  );
}
