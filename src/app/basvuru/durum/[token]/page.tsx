import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  BASVURU_TUR_ETIKETLERI,
  MULAKAT_TUR_ETIKETLERI,
  type BasvuruTur,
  type MulakatTur,
} from "@/lib/sabitler";
import stil from "../../basvuru.module.css";

// Takip sayfası gizli token içerir → arama motorlarına kapalı.
export const metadata: Metadata = {
  title: "Başvuru Durumu – Kaynak Kampüs",
  robots: { index: false, follow: false },
};

type Parametreler = Promise<{ token: string }>;

/** Başvurana gösterilecek durum metni (yönetimsel etiketten daha nazik). */
const DURUM_MESAJI: Record<string, { renk: string; bg: string; metin: string; aciklama: string }> = {
  yeni: { renk: "#7A2035", bg: "rgba(122,32,53,.12)", metin: "Başvurunuz alındı", aciklama: "Başvurunuz sıraya alındı, en kısa sürede incelenecek." },
  inceleniyor: { renk: "#7A2035", bg: "rgba(122,32,53,.12)", metin: "İnceleniyor", aciklama: "Başvurunuz değerlendirme ekibimiz tarafından inceleniyor." },
  ek_bilgi: { renk: "#b45309", bg: "rgba(251,191,36,.18)", metin: "Ek bilgi bekleniyor", aciklama: "Başvurunuzla ilgili sizinle iletişime geçeceğiz." },
  mulakata_uygun: { renk: "#C98792", bg: "rgba(201,135,146,.15)", metin: "Mülakata uygun", aciklama: "Başvurunuz mülakat aşamasına uygun bulundu. Randevu bilgileri paylaşılacaktır." },
  mulakat_planlandi: { renk: "#C98792", bg: "rgba(201,135,146,.15)", metin: "Mülakat planlandı", aciklama: "Mülakat randevunuz oluşturuldu. Ayrıntılar aşağıdadır." },
  mulakat_tamamlandi: { renk: "#7A2035", bg: "rgba(122,32,53,.12)", metin: "Mülakat tamamlandı", aciklama: "Mülakatınız tamamlandı, sonucu en kısa sürede paylaşacağız." },
  olumlu: { renk: "#16a34a", bg: "rgba(22,163,74,.15)", metin: "Olumlu 🎉", aciklama: "Başvurunuz olumlu sonuçlandı. Sizinle iletişime geçeceğiz." },
  olumsuz: { renk: "#7C7883", bg: "rgba(100,116,139,.15)", metin: "Sonuçlandı", aciklama: "İlginiz için teşekkür ederiz. Şu an için uygun bir eşleşme bulunmuyor." },
};

function tarihSaat(d: Date): { tarih: string; saat: string } {
  return {
    tarih: new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(d),
    saat: new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d),
  };
}

export default async function BasvuruDurumPage({ params }: { params: Parametreler }) {
  const { token } = await params;

  // Yalnız güvenli/gösterilebilir alanlar seçilir.
  // Yönetici notları, sonuç notları, yüklenen belgeler ve görüşmeci
  // kimliği takip sayfasına ASLA taşınmaz.
  const basvuru = await prisma.basvuru.findUnique({
    where: { takipToken: token },
    select: {
      tur: true,
      ad: true,
      durum: true,
      olusturma: true,
      mulakatlar: {
        where: { aktif: true },
        orderBy: { olusturma: "desc" },
        take: 1,
        select: {
          tarih: true,
          sure: true,
          tur: true,
          baglanti: true,
          adres: true,
          aciklama: true,
        },
      },
    },
  });

  if (!basvuru) {
    return (
      <div className={`${stil.kart} ${stil.durumSayfa}`} style={{ textAlign: "center" }}>
        <div className={stil.basariIkon}>🔍</div>
        <h2 style={{ fontWeight: 800, margin: "8px 0" }}>Başvuru bulunamadı</h2>
        <p style={{ color: "var(--muted)" }}>
          Takip bağlantısı geçersiz olabilir. Bağlantıyı e-postanızdan tekrar kontrol edin.
        </p>
        <Link href="/basvuru" className="btn btn-outline" style={{ marginTop: 16 }}>
          Başvuru sayfasına dön
        </Link>
      </div>
    );
  }

  const durum = DURUM_MESAJI[basvuru.durum] ?? DURUM_MESAJI.yeni;
  const mulakat = basvuru.mulakatlar[0] ?? null;
  const basvuruTuru = BASVURU_TUR_ETIKETLERI[basvuru.tur as BasvuruTur] ?? basvuru.tur;
  const gonderim = tarihSaat(basvuru.olusturma).tarih;

  return (
    <div className={stil.durumSayfa}>
      <div className={stil.kart}>
        <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>{basvuruTuru} başvurusu</p>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "2px 0 14px" }}>
          Merhaba {basvuru.ad}
        </h2>
        <span className={stil.durumRozet} style={{ color: durum.renk, background: durum.bg }}>
          ● {durum.metin}
        </span>
        <p style={{ color: "var(--muted)", marginTop: 12 }}>{durum.aciklama}</p>
        <p style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: 8 }}>
          Başvuru tarihi: {gonderim}
        </p>

        {mulakat && (
          <div className={stil.mulakatKutu}>
            <h3>📅 Mülakat Bilgileri</h3>
            <dl>
              <div className={stil.mulakatSatir}>
                <dt>Tarih</dt>
                <dd>{tarihSaat(mulakat.tarih).tarih}</dd>
              </div>
              <div className={stil.mulakatSatir}>
                <dt>Saat</dt>
                <dd>{tarihSaat(mulakat.tarih).saat}</dd>
              </div>
              <div className={stil.mulakatSatir}>
                <dt>Görüşme türü</dt>
                <dd>{MULAKAT_TUR_ETIKETLERI[mulakat.tur as MulakatTur] ?? mulakat.tur}</dd>
              </div>
              {mulakat.tur === "online" && mulakat.baglanti && (
                <div className={stil.mulakatSatir}>
                  <dt>Bağlantı</dt>
                  <dd>
                    <a href={mulakat.baglanti} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)", wordBreak: "break-all" }}>
                      {mulakat.baglanti}
                    </a>
                  </dd>
                </div>
              )}
              {mulakat.tur === "yuzyuze" && mulakat.adres && (
                <div className={stil.mulakatSatir}>
                  <dt>Adres</dt>
                  <dd>{mulakat.adres}</dd>
                </div>
              )}
              {mulakat.aciklama && (
                <div className={stil.mulakatSatir}>
                  <dt>Açıklama</dt>
                  <dd style={{ whiteSpace: "pre-wrap" }}>{mulakat.aciklama}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
