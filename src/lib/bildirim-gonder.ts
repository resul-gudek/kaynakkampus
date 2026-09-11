/* ═══════════════════════════════════════════════════════════════
   Elle bildirim gönderimi — saf mantık (Prisma/istek bağlamı YOK).

   Yönetici ya da eğitmen panelden veli / öğrenci / öğretmenlere doğrudan
   bildirim gönderir. Sistem olaylarının ürettiği bildirimlerden farkı:
   metni gönderen yazar, hedefTur="duyuru" ile işaretlenir ve bir
   BildirimGonderim kaydına bağlanır (geçmiş + okunma oranı).

   Kim kime gönderebilir?
   • admin   → tüm aktif kullanıcılar (öğrenci, veli, öğretmen, koç)
   • eğitmen → kendi öğrencileri (kocId ya da online sınıf üyeliği) ve
               bu öğrencilerin velileri
   Aday kümesini sunucu tarafı (bildirim-gonder-sunucu.ts) çıkarır; burada
   seçimin adaylara karşı çözülmesi ve doğrulama vardır.
   ═══════════════════════════════════════════════════════════════ */

import { z } from "zod";
import { egitmenMi, type Rol } from "./sabitler";

/** Bildirim metni üst sınırı (push gövdesi de bu metindir) */
export const BILDIRIM_METIN_MAX = 500;
export const BILDIRIM_METIN_MIN = 3;
/** Tek gönderimde azami alıcı — hatalı "herkese" seçimine karşı üst sınır */
export const GONDERIM_MAX_ALICI = 2000;

/** Gönderenin seçebildiği ikonlar (ilk öğe varsayılan) */
export const BILDIRIM_IKONLARI = ["📢", "🔔", "📣", "⚠️", "📅", "🎉", "📘", "💡", "✅", "❗"] as const;
export type BildirimIkonu = (typeof BILDIRIM_IKONLARI)[number];

/* ── Hedef grupları ─────────────────────────────────────────── */
export const HEDEF_GRUPLARI = ["ogrenciler", "veliler", "ogretmenler", "koclar"] as const;
export type HedefGrubu = (typeof HEDEF_GRUPLARI)[number];

/** Grup → alıcı rolü */
export const HEDEF_GRUBU_ROLU: Record<HedefGrubu, Rol> = {
  ogrenciler: "ogrenci",
  veliler: "veli",
  ogretmenler: "ogretmen",
  koclar: "koc",
};

/** Gönderen rolüne göre grup etiketi: yönetici "Tüm öğrenciler" görür,
    eğitmen yalnız kendi öğrencilerine ulaşabildiği için "Öğrencilerim". */
export function grupEtiketi(grup: HedefGrubu, gonderenRol: string): string {
  if (egitmenMi(gonderenRol)) {
    return grup === "ogrenciler" ? "Öğrencilerim" : "Öğrencilerimin velileri";
  }
  const ad: Record<HedefGrubu, string> = {
    ogrenciler: "Tüm öğrenciler",
    veliler: "Tüm veliler",
    ogretmenler: "Tüm öğretmenler",
    koclar: "Tüm koçlar",
  };
  return ad[grup];
}

/** Gönderen rolünün seçebildiği gruplar (boşsa bu rol gönderim yapamaz) */
export function gonderenGruplari(rol: string): HedefGrubu[] {
  if (rol === "admin") return [...HEDEF_GRUPLARI];
  if (egitmenMi(rol)) return ["ogrenciler", "veliler"];
  return [];
}

/** Rol hiç gönderim yapabilir mi? (menü/sayfa görünürlüğü yetki.ts'ten,
    bu saf denetim eylem katmanına ek savunmadır) */
export function gonderebilirMi(rol: string): boolean {
  return gonderenGruplari(rol).length > 0;
}

/* ── Girdi şeması ───────────────────────────────────────────── */
export const BildirimGonderSemasi = z
  .object({
    metin: z
      .string()
      .trim()
      .min(BILDIRIM_METIN_MIN, `Bildirim metni en az ${BILDIRIM_METIN_MIN} karakter olmalı.`)
      .max(BILDIRIM_METIN_MAX, `Bildirim metni en çok ${BILDIRIM_METIN_MAX} karakter olabilir.`),
    ikon: z.enum(BILDIRIM_IKONLARI, { message: "Geçersiz ikon." }),
    gruplar: z.array(z.enum(HEDEF_GRUPLARI)).max(HEDEF_GRUPLARI.length).default([]),
    kisiler: z.array(z.string().trim().min(1)).max(GONDERIM_MAX_ALICI).default([]),
  })
  .refine((v) => v.gruplar.length > 0 || v.kisiler.length > 0, {
    message: "En az bir alıcı grubu ya da kişi seçin.",
    path: ["kisiler"],
  });

export type BildirimGonderGirdi = z.infer<typeof BildirimGonderSemasi>;

/** Gönderenin ulaşabildiği bir aday alıcı */
export interface AdayAlici {
  id: string;
  rol: string;
  ad: string;
}

export interface AliciCozumu<T extends AdayAlici> {
  alicilar: T[];
  /** Aday kümesinde olmayan (yetki dışı ya da silinmiş) kişi kimlikleri */
  bilinmeyen: string[];
  /** Gönderenin rolüne kapalı olduğu için yok sayılan gruplar */
  yetkisizGruplar: HedefGrubu[];
}

/** Seçimi adaylara karşı çözer: grupların rolleri + tek tek kişiler,
    tekrarsız; gönderen kendini alıcı yapamaz. Adaylar dışındaki kişiler
    sessizce düşmez, `bilinmeyen` ile geri bildirilir. */
export function alicilariCoz<T extends AdayAlici>(
  adaylar: T[],
  secim: { gruplar: HedefGrubu[]; kisiler: string[] },
  gonderen: { id: string; rol: string }
): AliciCozumu<T> {
  const izinli = new Set(gonderenGruplari(gonderen.rol));
  const yetkisizGruplar = secim.gruplar.filter((g) => !izinli.has(g));
  const roller = new Set<string>(
    secim.gruplar.filter((g) => izinli.has(g)).map((g) => HEDEF_GRUBU_ROLU[g])
  );

  const adayHar = new Map(adaylar.map((a) => [a.id, a]));
  const secili = new Map<string, T>();

  for (const a of adaylar) {
    if (a.id !== gonderen.id && roller.has(a.rol)) secili.set(a.id, a);
  }
  const bilinmeyen: string[] = [];
  for (const id of new Set(secim.kisiler)) {
    const a = adayHar.get(id);
    if (!a || a.id === gonderen.id) bilinmeyen.push(id);
    else secili.set(id, a);
  }
  return { alicilar: [...secili.values()], bilinmeyen, yetkisizGruplar };
}

/** Geçmiş listesinde gösterilen kısa hedef tanımı:
    "Tüm veliler", "Öğrencilerim + 2 kişi", "3 kişi" */
export function hedefOzeti(
  secim: { gruplar: HedefGrubu[]; kisiler: string[] },
  gonderenRol: string
): string {
  const parcalar = secim.gruplar.map((g) => grupEtiketi(g, gonderenRol));
  const kisi = new Set(secim.kisiler).size;
  if (kisi) parcalar.push(kisi === 1 ? "1 kişi" : `${kisi} kişi`);
  return parcalar.join(" + ") || "—";
}

/** Metni geçmiş tablosunda tek satıra sığdırır */
export function metinKisalt(metin: string, uzunluk = 90): string {
  const duz = metin.replace(/\s+/g, " ").trim();
  return duz.length > uzunluk ? duz.slice(0, uzunluk - 1).trimEnd() + "…" : duz;
}
