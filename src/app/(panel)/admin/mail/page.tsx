import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { mailAyarGetir, sablonlariHazirla } from "@/lib/mail";
import { VARSAYILAN_SABLONLAR } from "@/lib/mail-sablonlari";
import MailYonetimi, {
  type AyarGorunum,
  type SablonGorunum,
  type KuyrukGorunum,
} from "./MailYonetimi";

export const metadata: Metadata = { title: "E-posta Yönetimi – Kaynak Akademi" };

/** Date → "23.07.2026 18:45" (İstanbul) */
function zamanStr(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleString("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MailSayfasi() {
  await aktifKullanici("admin");
  await sablonlariHazirla(); // eksik varsayılan şablonları tamamla

  const ayarSatiri = await mailAyarGetir();
  const sablonSatirlari = await prisma.mailSablon.findMany({ orderBy: { ad: "asc" } });
  const kuyrukSatirlari = await prisma.mailKuyruk.findMany({
    orderBy: { olusturma: "desc" },
    take: 50,
  });
  const [bekliyor, gonderildi, hata] = await Promise.all([
    prisma.mailKuyruk.count({ where: { durum: "bekliyor" } }),
    prisma.mailKuyruk.count({ where: { durum: "gonderildi" } }),
    prisma.mailKuyruk.count({ where: { durum: "hata" } }),
  ]);

  // SMTP şifresi client'a asla gönderilmez; yalnız "kayıtlı mı" bilgisi gider
  const ayar: AyarGorunum = {
    aktif: ayarSatiri.aktif,
    sunucu: ayarSatiri.sunucu,
    port: ayarSatiri.port,
    guvenli: ayarSatiri.guvenli,
    kullaniciAdi: ayarSatiri.kullaniciAdi,
    sifreVar: !!ayarSatiri.sifre,
    gonderenAd: ayarSatiri.gonderenAd,
    gonderenAdres: ayarSatiri.gonderenAdres,
    hatirlatmaSaat: ayarSatiri.hatirlatmaSaat,
  };

  const sablonlar: SablonGorunum[] = sablonSatirlari.map((s) => {
    const tanim = VARSAYILAN_SABLONLAR.find((t) => t.anahtar === s.anahtar);
    return {
      anahtar: s.anahtar,
      ad: s.ad,
      aciklama: tanim?.aciklama ?? "",
      degiskenler: tanim?.degiskenler ?? [],
      konu: s.konu,
      govde: s.govde,
      aktif: s.aktif,
    };
  });

  const kuyruk: KuyrukGorunum[] = kuyrukSatirlari.map((m) => ({
    id: m.id,
    alici: m.alici,
    aliciAd: m.aliciAd,
    konu: m.konu,
    durum: m.durum,
    deneme: m.deneme,
    sonHata: m.sonHata,
    sablon: m.sablon,
    planlanan: zamanStr(m.planlanan),
    gonderim: zamanStr(m.gonderim),
  }));

  return (
    <main className="container" style={{ maxWidth: 980, paddingBottom: 40 }}>
      <div className="panel-bas">
        <h1>
          E-posta <span>Yönetimi</span>
        </h1>
        <p>
          SMTP ayarları, mail şablonları ve gönderim kuyruğu · {bekliyor} bekliyor ·{" "}
          {gonderildi} gönderildi · {hata} hatalı
        </p>
      </div>
      <MailYonetimi
        ayar={ayar}
        sablonlar={sablonlar}
        kuyruk={kuyruk}
        sayilar={{ bekliyor, gonderildi, hata }}
      />
    </main>
  );
}
