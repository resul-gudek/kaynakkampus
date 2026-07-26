/* Ders sonrası değerlendirme alan tanımları — tek kaynak.
   Hem giriş formu (DegerlendirmeFormu) hem salt-okunur gösterim
   (DegerlendirmeGoster) bu meta üzerinden çizilir; zod şemalarıyla
   (src/lib/dogrulama.ts) alan anahtarları ve tipleri uyumludur. */

export type AlanTip = "puan" | "secim" | "metin";

export interface Secenek {
  deger: string;
  etiket: string;
}

export interface Alan {
  anahtar: string;
  etiket: string;
  tip: AlanTip;
  secenekler?: Secenek[];
}

const EKH: Secenek[] = [
  { deger: "evet", etiket: "Evet" },
  { deger: "kismen", etiket: "Kısmen" },
  { deger: "hayir", etiket: "Hayır" },
];

const HIZ: Secenek[] = [
  { deger: "yavas", etiket: "Yavaştı" },
  { deger: "uygun", etiket: "Uygundu" },
  { deger: "hizli", etiket: "Hızlıydı" },
];

/** Öğretmenin öğrenciyi değerlendirmesi (yon="kocOgrenci") — genel "puan" hariç */
export const KOC_OGRENCI_ALANLAR: Alan[] = [
  { anahtar: "zamaninda", etiket: "Derse zamanında katıldı mı?", tip: "secim", secenekler: EKH },
  { anahtar: "hazirlikli", etiket: "Derse hazırlıklı mıydı?", tip: "secim", secenekler: EKH },
  { anahtar: "katilim", etiket: "Derse katılımı nasıldı?", tip: "puan" },
  { anahtar: "dikkat", etiket: "Dikkati nasıldı?", tip: "puan" },
  { anahtar: "anlama", etiket: "İşlenen konuyu ne ölçüde anladı?", tip: "puan" },
  { anahtar: "gucluYonler", etiket: "Güçlü olduğu noktalar", tip: "metin" },
  { anahtar: "zorlandigi", etiket: "Zorlandığı noktalar", tip: "metin" },
  { anahtar: "tekrarKonular", etiket: "Tekrar etmesi gereken konular", tip: "metin" },
  { anahtar: "yapilacaklar", etiket: "Bir sonraki derse kadar yapması gerekenler", tip: "metin" },
  { anahtar: "genelYorum", etiket: "Genel öğretmen değerlendirmesi", tip: "metin" },
];

/** Öğrencinin öğretmeni değerlendirmesi (yon="ogrenciKoc") — genel "puan" hariç */
export const OGRENCI_KOC_ALANLAR: Alan[] = [
  { anahtar: "anlasilir", etiket: "Konuyu anlaşılır bir şekilde anlattı mı?", tip: "puan" },
  { anahtar: "hiz", etiket: "Anlatım hızı uygun muydu?", tip: "secim", secenekler: HIZ },
  { anahtar: "sorulara", etiket: "Sorularınıza yeterli cevap alabildiniz mi?", tip: "puan" },
  { anahtar: "rahat", etiket: "Ders sırasında kendinizi rahat hissettiniz mi?", tip: "puan" },
  { anahtar: "verimli", etiket: "Dersin verimli geçtiğini düşünüyor musunuz?", tip: "puan" },
  { anahtar: "anlatimYorum", etiket: "Öğretmenin anlatımını nasıl değerlendiriyorsunuz?", tip: "metin" },
  { anahtar: "gorus", etiket: "Öğretmenle ilgili eklemek istediğiniz görüş", tip: "metin" },
];

export function alanlarByYon(yon: string): Alan[] {
  return yon === "kocOgrenci" ? KOC_OGRENCI_ALANLAR : OGRENCI_KOC_ALANLAR;
}

/** Genel puan etiketi (yöne göre) */
export function genelPuanEtiketi(yon: string): string {
  return yon === "kocOgrenci" ? "Genel değerlendirme puanı" : "Genel öğretmen puanı";
}

/** Bir seçim değerinin okunur etiketi */
export function secenekEtiketi(alan: Alan, deger: unknown): string {
  const s = alan.secenekler?.find((x) => x.deger === deger);
  return s ? s.etiket : String(deger ?? "—");
}

/** Serileştirilmiş değerlendirme (sunucudan istemciye) */
export interface DegerlendirmeS {
  yon: string; // "kocOgrenci" | "ogrenciKoc"
  puan: number;
  veri: Record<string, unknown>; // ayrıştırılmış cevaplar
  guncelleme: string; // ISO
}

/** DB kaydını serileştirilmiş biçime çevirir (veri JSON ayrıştırılır) */
export function degerlendirmeSerile(kayit: {
  yon: string;
  puan: number;
  veri: string;
  guncelleme: Date;
}): DegerlendirmeS {
  let veri: Record<string, unknown> = {};
  try {
    veri = JSON.parse(kayit.veri) as Record<string, unknown>;
  } catch {
    veri = {};
  }
  return {
    yon: kayit.yon,
    puan: kayit.puan,
    veri,
    guncelleme: kayit.guncelleme.toISOString(),
  };
}
