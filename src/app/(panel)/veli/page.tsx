import PanelIkon from "@/components/panel/Ikon";
import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import {
  isoTarih,
  ogrenciOzet,
  ozelDersOzet,
  profilAyristir,
  tarihStr,
  xpOzet,
  yolDurumlu,
  zayifKonular,
} from "@/lib/hesap";
import { kanitUrl } from "@/lib/odev-kanit";
import DegerlendirmeGoster from "@/components/degerlendirme/DegerlendirmeGoster";
import { degerlendirmeSerile } from "@/components/degerlendirme/alanlar";
import d from "@/components/panel/dashboard.module.css";
import s from "./veli.module.css";

export const metadata: Metadata = { title: "Veli Paneli – Kaynak Kampüs" };

/* Bir velinin çocuğu için gereken tüm ilerleme kayıtları. */
const COCUK_INCLUDE = {
  koc: { select: { ad: true, brans: true } },
  odevlerOgrenci: {
    orderBy: { sonTarih: "asc" },
    // Tamamlanan ödevlerin kanıt fotoğrafları (veli salt-okunur görür)
    include: { kanitlar: { select: { id: true, ad: true }, orderBy: { olusturma: "asc" } } },
  },
  takipOgrenci: true,
  denemeler: { include: { dersler: true }, orderBy: [{ tarih: "asc" }, { id: "asc" }] },
  yolOgrenci: { orderBy: { sira: "asc" } },
  ozelDersOgrenci: {
    orderBy: [{ tarih: "asc" }, { saat: "asc" }],
    // Veli yalnızca öğretmenin öğrenci hakkındaki değerlendirmesini, o da
    // puan özeti olarak görür (metin yorumlar mod="ozet" ile gizlenir).
    include: { degerlendirmeler: { where: { yon: "kocOgrenci" } } },
  },
} satisfies Prisma.KullaniciInclude;

type Cocuk = Prisma.KullaniciGetPayload<{ include: typeof COCUK_INCLUDE }>;

function basHarfler(ad: string) {
  return ad
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toLocaleUpperCase("tr-TR");
}

export default async function VeliPanel({
  searchParams,
}: {
  searchParams: Promise<{ ogrenci?: string }>;
}) {
  const veli = await aktifKullanici("veli");
  const sp = await searchParams;

  const cocuklar = await prisma.kullanici.findMany({
    where: { rol: "ogrenci", veliId: veli.id },
    orderBy: { ad: "asc" },
    include: COCUK_INCLUDE,
  });

  const secili = (sp.ogrenci ? cocuklar.find((c) => c.id === sp.ogrenci) : cocuklar[0]) ?? null;

  return (
    <main className="container">
      {/* ── Hero ── */}
      <section className={d.hero}>
        <div className={d.heroIcerik}>
          <span className={d.ustEtiket}>VELİ PANELİ</span>
          <h1>Hoş geldiniz, {veli.ad.split(" ")[0]} 👋</h1>
          <p>
            Çocuğunuzun ödev, deneme ve yol haritası gelişimini buradan izleyebilirsiniz.
            Sorularınız için koçu ile iletişime geçebilirsiniz.
          </p>
        </div>
        <div className={d.heroKart}>
          <div className="avatar">{basHarfler(veli.ad)}</div>
          <div>
            <small>Takip edilen</small>
            <b>{cocuklar.length} öğrenci</b>
            <em>{cocuklar.map((c) => c.ad.split(" ")[0]).join(", ") || "Henüz bağlı öğrenci yok"}</em>
          </div>
        </div>
      </section>

      {cocuklar.length === 0 ? (
        <section className={d.kart}>
          <p className={s.bosMesaj}>
            Hesabınıza henüz bir öğrenci bağlanmamış. Yönetici öğrencinizi hesabınıza
            bağladığında gelişim özeti burada görünecek.
          </p>
        </section>
      ) : (
        <>
          {/* ── Çocuk seçimi (birden çok çocuk varsa) ── */}
          {cocuklar.length > 1 && (
            <section className={s.cocukSecim} aria-label="Öğrenci seçimi">
              {cocuklar.map((c) => (
                <Link
                  key={c.id}
                  href={`/veli?ogrenci=${c.id}`}
                  className={`${s.cocukKart} ${c.id === secili?.id ? s.aktif : ""}`}
                >
                  <span className="avatar">{basHarfler(c.ad)}</span>
                  <div>
                    <b>{c.ad}</b>
                    <small>{c.sinif || "—"} · {c.hedef || "—"}</small>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {secili && <CocukDetay cocuk={secili} />}
        </>
      )}
    </main>
  );
}

/* Salt-okunur çocuk gelişim özeti — koç sekmelerinin veli tarafındaki karşılığı. */
function CocukDetay({ cocuk }: { cocuk: Cocuk }) {
  const profil = profilAyristir(cocuk.profil);
  const oz = ogrenciOzet(cocuk.odevlerOgrenci, cocuk.takipOgrenci, cocuk.denemeler, cocuk.yolOgrenci);
  const yolOz = xpOzet(cocuk.yolOgrenci);
  const ozelOz = ozelDersOzet(cocuk.ozelDersOgrenci);
  const zayif = zayifKonular(cocuk.denemeler, profil).slice(0, 5);
  const sonDenemeler = [...cocuk.denemeler].slice(-5).reverse();
  const aktifAdim = yolDurumlu(cocuk.yolOgrenci).find((a) => a.durum === "aktif");
  const bekleyenOdev = cocuk.odevlerOgrenci.filter((o) => o.durum === "bekliyor").length;
  // Fotoğrafıyla tamamlanan son ödevler (en yeni önce)
  const kanitliOdevler = cocuk.odevlerOgrenci
    .filter((o) => o.durum === "tamamlandi" && o.kanitlar.length > 0)
    .sort((a, b) => isoTarih(b.sonTarih).localeCompare(isoTarih(a.sonTarih)))
    .slice(0, 6);
  const degerliDersler = cocuk.ozelDersOgrenci.filter((x) => x.degerlendirmeler.length > 0);

  return (
    <>
      {/* ── İstatistik kartları ── */}
      <section className={d.statGrid} aria-label={`${cocuk.ad} istatistikleri`}>
        <div className={`${d.statKart} ${d.yesil}`}>
          <span className={d.statIkon}><PanelIkon ad="takip" boyut={20} /></span>
          <span>
            <small>Ödev tamamlama</small>
            <b>%{oz.odevYuzde}</b>
            <em>{oz.odevTamam}/{oz.odevToplam} · {bekleyenOdev} bekliyor</em>
          </span>
        </div>
        <div className={`${d.statKart} ${d.turkuaz}`}>
          <span className={d.statIkon}><PanelIkon ad="grafik" boyut={20} /></span>
          <span>
            <small>Haftalık takip</small>
            <b>%{oz.takipYuzde}</b>
            <em>{oz.takipTamam}/{oz.takipToplam} görev tamamlandı</em>
          </span>
        </div>
        <div className={`${d.statKart} ${d.mavi}`}>
          <span className={d.statIkon}><PanelIkon ad="hedef" boyut={20} /></span>
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
            <em>{sonDenemeler[0] ? sonDenemeler[0].ad : "Henüz deneme yok"}</em>
          </span>
        </div>
        <div className={`${d.statKart} ${d.turuncu}`}>
          <span className={d.statIkon}><PanelIkon ad="yildiz" boyut={20} /></span>
          <span>
            <small>Yol haritası</small>
            <b>Seviye {yolOz.seviye}</b>
            <em>{yolOz.xp} XP · %{yolOz.yuzde} tamamlandı</em>
          </span>
        </div>
      </section>

      <section className={s.detayIzgara}>
        {/* ── Öne çıkan zayıf konular ── */}
        <div className={d.kart}>
          <div className={d.kartBaslik}>
            <div>
              <span className={d.kucukBaslik}>GELİŞİM ODAĞI</span>
              <h2>Öne çıkan zayıf konular</h2>
            </div>
          </div>
          {zayif.length ? (
            <ul className={s.liste}>
              {zayif.map((z) => (
                <li key={z.ders + z.konu}>
                  <span className={s.rozet}>{z.kez}×</span>
                  <div>
                    <b>{z.konu}</b>
                    <small>{z.ders} · {z.kaynaklar.join(", ")}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.bosMesaj}>Denemelerde öne çıkan tekrar eden zayıf konu yok. 🎉</p>
          )}
        </div>

        {/* ── Son denemeler ── */}
        <div className={d.kart}>
          <div className={d.kartBaslik}>
            <div>
              <span className={d.kucukBaslik}>DENEME GELİŞİMİ</span>
              <h2>Son deneme sonuçları</h2>
            </div>
          </div>
          {sonDenemeler.length ? (
            <ul className={s.liste}>
              {sonDenemeler.map((dn) => (
                <li key={dn.id}>
                  <span className={`${s.rozet} ${s.net}`}>{dn.net}</span>
                  <div>
                    <b>{dn.ad}</b>
                    <small>{dn.tur} · {tarihStr(dn.tarih)}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.bosMesaj}>Henüz kayıtlı deneme sonucu yok.</p>
          )}
        </div>
      </section>

      {/* ── Yol haritası + sıradaki ders özet şeridi ── */}
      <section className={d.ozetGrid} aria-label="Özet">
        <div className={d.ozetKart}>
          <span><PanelIkon ad="ogretmen" boyut={18} /></span>
          <div>
            <b>{cocuk.koc ? cocuk.koc.ad : "Koç atanmamış"}</b>
            <small>{cocuk.koc?.brans || "Öğrencinin koçu"}</small>
          </div>
        </div>
        <div className={d.ozetKart}>
          <span><PanelIkon ad="harita" boyut={18} /></span>
          <div>
            <b>{aktifAdim ? `Sıradaki: ${aktifAdim.ders} – ${aktifAdim.konu}` : "Yol haritası güncel"}</b>
            <small>{aktifAdim?.hedef || `${yolOz.tamamlanan}/${yolOz.toplam} adım tamamlandı`}</small>
          </div>
        </div>
        <div className={d.ozetKart}>
          <span><PanelIkon ad="mezuniyet" boyut={18} /></span>
          <div>
            <b>
              {ozelOz.sonraki
                ? `Sıradaki özel ders: ${tarihStr(ozelOz.sonraki.tarih)}${ozelOz.sonraki.saat ? " " + ozelOz.sonraki.saat : ""}`
                : "Planlanmış özel ders yok"}
            </b>
            <small>
              {ozelOz.sonraki
                ? ozelOz.sonraki.ders + (ozelOz.sonraki.konu ? " – " + ozelOz.sonraki.konu : "")
                : `${ozelOz.yapilan} ders yapıldı · ${ozelOz.toplamSaat} saat`}
            </small>
          </div>
        </div>
      </section>

      {/* ── Yaklaşan ödevler ── */}
      <section className={d.kart}>
        <div className={d.kartBaslik}>
          <div>
            <span className={d.kucukBaslik}>ÖDEVLER</span>
            <h2>Bekleyen ödevler</h2>
          </div>
        </div>
        {bekleyenOdev ? (
          <ul className={s.liste}>
            {cocuk.odevlerOgrenci
              .filter((o) => o.durum === "bekliyor")
              .sort((a, b) => isoTarih(a.sonTarih).localeCompare(isoTarih(b.sonTarih)))
              .slice(0, 8)
              .map((o) => (
                <li key={o.id}>
                  <span className={s.rozet}><PanelIkon ad="odev" boyut={14} /></span>
                  <div>
                    <b>{o.ders}{o.konu ? " – " + o.konu : ""}</b>
                    <small>
                      {o.kaynak || "Kaynak belirtilmedi"}
                      {o.sonTarih ? ` · Son teslim: ${tarihStr(o.sonTarih)}` : ""}
                    </small>
                  </div>
                </li>
              ))}
          </ul>
        ) : (
          <p className={s.bosMesaj}>Bekleyen ödev yok. Tüm ödevler tamamlanmış. 🎉</p>
        )}
      </section>

      {/* ── Tamamlanan ödevlerin fotoğrafları (salt okunur) ── */}
      {kanitliOdevler.length > 0 && (
        <section className={d.kart}>
          <div className={d.kartBaslik}>
            <div>
              <span className={d.kucukBaslik}>ÖDEVLER</span>
              <h2>Tamamlanan ödev fotoğrafları</h2>
              <p style={{ color: "var(--muted)", fontSize: ".78rem", marginTop: 4 }}>
                {cocuk.ad.split(" ")[0]} ödevi tamamlarken çözüm sayfalarının fotoğrafını
                yükledi. Büyütmek için fotoğrafa dokunabilirsiniz.
              </p>
            </div>
          </div>
          <div className={s.kanitListe}>
            {kanitliOdevler.map((o) => (
              <div key={o.id} className={s.kanitOdev}>
                <b>
                  {o.ders}
                  {o.konu ? " – " + o.konu : ""}
                  <small>
                    {o.sonTarih ? `Son teslim: ${tarihStr(o.sonTarih)} · ` : ""}
                    {o.kanitlar.length} fotoğraf
                  </small>
                </b>
                <div className={s.kanitSerit}>
                  {o.kanitlar.map((k) => (
                    <a
                      key={k.id}
                      className={s.kanitKart}
                      href={kanitUrl(k.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${k.ad} — büyütmek için tıklayın`}
                    >
                      {/* Fotoğraflar public dizinde değil; API'den akar → next/image kullanılmaz */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={kanitUrl(k.id)} alt={k.ad} loading="lazy" />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Öğretmen ders değerlendirmeleri (salt okunur) ── */}
      {degerliDersler.length > 0 && (
        <section className={d.kart}>
          <div className={d.kartBaslik}>
            <div>
              <span className={d.kucukBaslik}>ÖZEL DERS</span>
              <h2>Öğretmen ders değerlendirmeleri</h2>
              <p style={{ color: "var(--muted)", fontSize: ".78rem", marginTop: 4 }}>
                Öğretmenin ders sonu puan özeti. Ayrıntılı yazılı görüşler yalnızca okul
                yönetiminde tutulur; merak ettiğiniz bir konu olursa yönetimle iletişime
                geçebilirsiniz.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[...degerliDersler].reverse().map((x) => (
              <div key={x.id}>
                <b style={{ fontSize: ".9rem" }}>
                  {x.ders}
                  {x.konu ? " – " + x.konu : ""}
                  <small style={{ color: "var(--muted)", fontWeight: 500, marginLeft: 8 }}>
                    {tarihStr(x.tarih)}
                    {x.saat ? " · " + x.saat : ""}
                  </small>
                </b>
                <DegerlendirmeGoster deger={degerlendirmeSerile(x.degerlendirmeler[0])} mod="ozet" />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
