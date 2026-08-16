/* ═══════════════════════════════════════════════════════════════
   Bildirim tercihleri — saf mantık (Prisma/istek bağlamı YOK, test edilebilir).

   Kullanıcı hangi türlerde cihaz bildirimi (push) almak istediğini kendisi
   yönetir. Tasarım kararları:

   • Uygulama içi bildirim HER ZAMAN yazılır. Tercih yalnız push'u yönetir;
     böylece öğrenci ödevi "sessize aldı" diye kaçırmaz, kayıt izi bozulmaz.
   • Satır yoksa tür AÇIK sayılır (opt-out). Yeni bir tür eklendiğinde
     mevcut kullanıcılar bildirimsiz kalmaz.
   • Türler Bildirim.hedefTur ile birebir eşleşir; hedefi olmayan
     bildirimler "genel" sayılır.
   ═══════════════════════════════════════════════════════════════ */

import { EGITMEN_ROLLERI, egitmenMi } from "./sabitler";

/** Kullanıcının yönetebildiği bildirim türleri (Bildirim.hedefTur + "genel"). */
export const BILDIRIM_TURLERI = [
  "oturum",
  "odev",
  "test",
  "video",
  "ozel",
  "sinif",
  "genel",
] as const;

export type BildirimTuru = (typeof BILDIRIM_TURLERI)[number];

export interface TurTanim {
  tur: BildirimTuru;
  ad: string;
  aciklama: string;
  ikon: string;
  /** Bu tür hangi rollere hiç gelmiyorsa ayar ekranında gösterilmez. */
  roller: string[];
}

/* Ekranda gösterim sırası = zaman kritikliğine göre (önce en acil). */
export const TUR_TANIMLARI: TurTanim[] = [
  {
    tur: "oturum",
    ad: "Canlı ders hatırlatması",
    aciklama: "Online dersin başlamasına kısa süre kaldığında.",
    ikon: "⏰",
    roller: [...EGITMEN_ROLLERI, "ogrenci"],
  },
  {
    tur: "odev",
    ad: "Ödevler",
    aciklama: "Yeni ödev verildiğinde, teslim edildiğinde ve geri bildirim geldiğinde.",
    ikon: "📘",
    roller: [...EGITMEN_ROLLERI, "ogrenci"],
  },
  {
    tur: "test",
    ad: "Süreli testler",
    aciklama: "Yeni test atandığında ve test sonucu hazır olduğunda.",
    ikon: "🧪",
    roller: [...EGITMEN_ROLLERI, "ogrenci"],
  },
  {
    tur: "video",
    ad: "Video dersler",
    aciklama: "Yeni ders videosu yayınlandığında.",
    ikon: "🎬",
    roller: ["ogrenci"],
  },
  {
    tur: "ozel",
    ad: "Özel dersler",
    aciklama: "Ders talebi, onay, plan değişikliği ve ödeme kayıtlarında.",
    ikon: "🎓",
    roller: [...EGITMEN_ROLLERI, "ogrenci"],
  },
  {
    tur: "sinif",
    ad: "Online sınıf",
    aciklama: "Sınıfa eklendiğinde ve ders programı değiştiğinde.",
    ikon: "🏫",
    roller: [...EGITMEN_ROLLERI, "ogrenci"],
  },
  {
    tur: "genel",
    ad: "Diğer bildirimler",
    aciklama: "Değerlendirme sonuçları ve yukarıdaki başlıklara girmeyen duyurular.",
    ikon: "🔔",
    roller: [...EGITMEN_ROLLERI, "ogrenci", "admin"],
  },
];

/** Verilen değer yönetilebilir bir tür mü? */
export function turGecerli(deger: unknown): deger is BildirimTuru {
  return typeof deger === "string" && (BILDIRIM_TURLERI as readonly string[]).includes(deger);
}

/** Bildirimin hedefTur'unu tercih türüne çevirir; bilinmeyen/boş → "genel". */
export function tercihTuru(hedefTur: string | null | undefined): BildirimTuru {
  return turGecerli(hedefTur) ? hedefTur : "genel";
}

/** Role göre ayar ekranında gösterilecek türler. */
export function rolTurleri(rol: string): TurTanim[] {
  return TUR_TANIMLARI.filter((t) => t.roller.includes(rol));
}

/** Kayıtlı tercihleri "tür → push açık mı" haritasına çevirir.
    Kaydı olmayan tür AÇIK kabul edilir (opt-out). */
export function tercihHaritasi(
  kayitlar: Array<{ tur: string; push: boolean }>
): Record<BildirimTuru, boolean> {
  const harita = {} as Record<BildirimTuru, boolean>;
  for (const t of BILDIRIM_TURLERI) harita[t] = true;
  for (const k of kayitlar) {
    if (turGecerli(k.tur)) harita[k.tur] = k.push;
  }
  return harita;
}

/** Bu bildirim için cihaz push'u gönderilmeli mi? */
export function pushIzinli(
  hedefTur: string | null | undefined,
  kayitlar: Array<{ tur: string; push: boolean }>
): boolean {
  return tercihHaritasi(kayitlar)[tercihTuru(hedefTur)];
}

/* ── Push yükü (payload) ───────────────────────────────────────
   Başlık türe göre anlamlandırılır; gövde bildirimin kendi metnidir. */

const BASLIKLAR: Record<BildirimTuru, string> = {
  oturum: "Canlı ders yaklaşıyor ⏰",
  odev: "Ödev bildirimi 📘",
  test: "Süreli test 🧪",
  video: "Yeni ders videosu 🎬",
  ozel: "Özel ders 🎓",
  sinif: "Online sınıf 🏫",
  genel: "Kaynak Kampüs 🔔",
};

export function pushBaslik(hedefTur: string | null | undefined): string {
  return BASLIKLAR[tercihTuru(hedefTur)];
}

/** Bildirimin tıklanınca açılacağı yol. BildirimListe.tikla() ile aynı
    hedefleri üretir; rol farkı olan sayfalarda role göre ayrışır. */
export function bildirimYolu(
  b: { hedefTur: string | null; hedefOgrenciId: string | null; hedefKayitId: string | null },
  rol: string
): string {
  const { hedefTur, hedefKayitId, hedefOgrenciId } = b;
  if (!hedefTur || !hedefKayitId) return "/bildirimler";
  const kayit = encodeURIComponent(hedefKayitId);

  if (hedefTur === "oturum") return `/canli-ders/${kayit}`;
  if (hedefTur === "sinif") return `/siniflar?sinif=${kayit}`;
  if (hedefTur === "test") {
    return egitmenMi(rol) ? `/koc/testler?kayit=${kayit}` : `/ogrenci/testler?kayit=${kayit}`;
  }
  if (hedefTur === "video") return `/ogrenci/videolar/${kayit}`;

  // odev | ozel — eğitmen öğrenci detayında ilgili sekmeye, öğrenci kendi sayfasına
  const sekme = hedefTur === "odev" ? "odevler" : "ozel";
  if (egitmenMi(rol)) {
    const ogr = encodeURIComponent(hedefOgrenciId ?? "");
    return `/koc/ogrenciler?ogrenci=${ogr}&sekme=${sekme}&kayit=${kayit}`;
  }
  const sayfa = hedefTur === "odev" ? "/ogrenci/odevler" : "/ogrenci/ozel-dersler";
  return `${sayfa}?kayit=${kayit}`;
}
