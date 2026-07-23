import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { aktifKullanici } from "@/lib/oturum";
import {
  bigBlueButtonHazir,
  dersOturumuErisimi,
  katilimPenceresi,
  KATILIM_ONCESI_OGRENCI_DK,
  KATILIM_ONCESI_OGRETMEN_DK,
} from "@/lib/canli-ders";
import s from "./canli-ders.module.css";

export const metadata: Metadata = { title: "Canlı Ders – Kaynak Akademi" };

const tarihSaat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "full",
  timeStyle: "short",
});

export default async function CanliDersSayfasi({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hata?: string }>;
}) {
  const kullanici = await aktifKullanici();
  const { id } = await params;
  const sp = await searchParams;
  const erisim = await dersOturumuErisimi(id, kullanici.id, kullanici.rol);
  if (!erisim) notFound();

  const { oturum, moderator } = erisim;
  const pencere = katilimPenceresi(oturum.baslangic, oturum.sure, moderator);
  const yapilandirilmis = bigBlueButtonHazir();
  const iptal = oturum.durum === "iptal";
  const katilabilir = !iptal && pencere.acik && yapilandirilmis;
  const sinifAd = oturum.sinif?.ad ?? "Birebir özel ders";
  const ogretmenAd = oturum.sinif?.ogretmen.ad ?? oturum.ozelDers?.koc.ad ?? "Öğretmen";
  const uyeSayisi = oturum.sinif?._count.uyeler ?? 1;

  return (
    <main className="container">
      <div className={s.geri}>
        <Link href="/siniflar">← Online sınıflara dön</Link>
      </div>
      {sp.hata && <div className={s.hata}>{sp.hata}</div>}

      <section className={s.hero}>
        <div className={s.heroIkon}>💻</div>
        <div className={s.heroGovde}>
          <div className={s.etiketler}>
            <span className="tag">{sinifAd}</span>
            <span className="tag">{moderator ? "Öğretmen" : "Öğrenci"}</span>
            <span className={s.kayitKapali}>● Kayıt kapalı</span>
          </div>
          <h1>{oturum.baslik}</h1>
          {oturum.konu && <p>{oturum.konu}</p>}
          <div className={s.meta}>
            <span>📅 {tarihSaat.format(oturum.baslangic)}</span>
            <span>⏱ {oturum.sure} dakika</span>
            <span>👩‍🏫 {ogretmenAd}</span>
            <span>👥 {uyeSayisi} öğrenci</span>
          </div>
        </div>
      </section>

      <div className={s.icerik}>
        <section className={s.katilimKart}>
          <div className={s.durumIkon}>
            {iptal ? "🚫" : !yapilandirilmis ? "⚙️" : pencere.erken ? "🕐" : pencere.gec ? "⌛" : "🚀"}
          </div>
          <h2>
            {iptal
              ? "Bu ders iptal edildi"
              : !yapilandirilmis
                ? "Canlı sınıf sağlayıcısı bekleniyor"
                : pencere.erken
                  ? "Ders henüz başlamadı"
                  : pencere.gec
                    ? "Katılım süresi sona erdi"
                    : "Ders odası hazır"}
          </h2>
          <p>
            {iptal
              ? "Yeni bir ders planlandığında bildirim alacaksın."
              : !yapilandirilmis
                ? moderator
                  ? "BigBlueButton API adresi ve gizli anahtarı sunucu ortamına eklendiğinde ders odası kullanılabilir olacak."
                  : "Canlı sınıf altyapısı öğretmenin tarafından hazırlanıyor."
                : pencere.erken
                  ? `${moderator ? KATILIM_ONCESI_OGRETMEN_DK : KATILIM_ONCESI_OGRENCI_DK} dakika önce katılım açılır: ${tarihSaat.format(pencere.acilis)}`
                  : pencere.gec
                    ? "Bu oturumun güvenli katılım bağlantısı artık kullanılamaz."
                    : "Bağlantı yalnızca sana özel ve kısa süreli olarak sunucu tarafından oluşturulur."}
          </p>
          {katilabilir && (
            <a className="btn btn-primary" href={`/api/canli-ders/${oturum.id}/katil`}>
              {moderator ? "Dersi Başlat" : "Derse Katıl"}
            </a>
          )}
          {!katilabilir && !iptal && (
            <Link className="btn btn-outline" href="/siniflar">Ders programına dön</Link>
          )}
        </section>

        <aside className={s.kontrolKart}>
          <h2>Katılmadan önce</h2>
          <ul>
            <li><span>🎙️</span><div><b>Mikrofon</b><small>Tarayıcı izninin açık olduğunu kontrol et.</small></div></li>
            <li><span>📷</span><div><b>Kamera</b><small>Görüntünü ve arka planını önceden kontrol et.</small></div></li>
            <li><span>🌐</span><div><b>Bağlantı</b><small>Mümkünse kararlı Wi‑Fi veya kablolu bağlantı kullan.</small></div></li>
            <li><span>🎧</span><div><b>Kulaklık</b><small>Yankıyı azaltmak için kulaklık önerilir.</small></div></li>
          </ul>
          <div className={s.guvenlik}>
            <b>🔒 Güvenli sınıf</b>
            <p>Dışarıya açık oda bağlantısı yoktur. Kimliğin ve sınıf üyeliğin her katılımda yeniden doğrulanır.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
