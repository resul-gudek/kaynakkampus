/** Liste ve "ilgili yazılar" bölümlerinde gösterilen kart verisi.
    Sunucudan istemciye geçtiği için yalnız serileştirilebilir alanlar taşır. */
export interface YaziKarti {
  id: string;
  slug: string;
  baslik: string;
  ozet: string;
  kategori: string;
  etiketler: string;
  /** "12 Mart 2026" — biçimlendirme sunucuda yapılır (SSR/CSR tutarlılığı) */
  tarihMetni: string;
  /** Sıralama/filtre için ISO tarih */
  tarihIso: string;
  okuma: number;
  kapakVar: boolean;
}
