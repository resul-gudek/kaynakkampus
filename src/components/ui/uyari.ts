/* ── UYARI / ONAY KATMANI · ÇAĞRI ARAYÜZÜ ────────────────────────────
   Panelde tarayıcının alert() / confirm() / prompt() kutularının yerini alır.
   Statik sayfalardaki karşılığı: public/assets/kk-uyari.js (window.KKUyari).

   Bu dosya React'e bağlı DEĞİLDİR: bileşen olmayan yardımcı modüller de
   (örn. components/koc/wa.ts) doğrudan çağırabilir. Pencereyi çizen taraf
   UyariKatmani bileşenidir; kök layout'ta bir kez monte edilir ve kendini
   buraya kaydeder.

     import { Uyari } from "@/components/ui/uyari";

     Uyari.hata(sonuc.hata);                          // beklemeye gerek yok
     if (!(await Uyari.onay("Silinsin mi?", { tehlikeli: true }))) return;
     const not = await Uyari.sor("Ders notu:", { cokSatir: true });
     Uyari.bildir("Kaydedildi", { tur: "basari" });    // akışı kesmeyen şerit

   Ad çakışmasını önlemek için tek nesne (Uyari) dışa verilir — bileşenlerde
   `hata`, `onay` gibi yerel değişkenler yaygın.
   ------------------------------------------------------------------ */

export type UyariTuru = "bilgi" | "basari" | "uyari" | "hata" | "onay" | "sor";

export type UyariSecenek = {
  baslik?: string;
  altBaslik?: string;
  ikon?: string;
  onayEtiketi?: string;
  iptalEtiketi?: string;
  /** Geri alınamaz işlem: birincil düğme kırmızı olur */
  tehlikeli?: boolean;
  /* Yalnız sor() */
  varsayilan?: string;
  yerTutucu?: string;
  cokSatir?: boolean;
};

export type SeritSecenek = {
  tur?: "bilgi" | "basari" | "uyari" | "hata";
  ikon?: string;
  /** ms — en az 1200, varsayılan 3200 */
  sure?: number;
};

export type UyariIstek = UyariSecenek & {
  tur: UyariTuru;
  mesaj: string;
  cozumle: (sonuc: boolean | string | null | undefined) => void;
};

export type SeritIstek = SeritSecenek & { anahtar: number; mesaj: string };

type Isleyici = {
  pencere: (istek: UyariIstek) => void;
  serit: (istek: SeritIstek) => void;
};

let isleyici: Isleyici | null = null;
let seritSayaci = 0;

/** UyariKatmani monte olurken kendini kaydeder; sökülürken bırakır. */
export function uyariIsleyicisiKur(yeni: Isleyici | null) {
  isleyici = yeni;
}

/* Katman monte değilken (sunucu tarafı, ya da layout'a eklenmemiş bir ağaç)
   tarayıcının kendi kutusuna düşülür: mesaj kaybolmaz, akış bozulmaz. */
function yedek(istek: Omit<UyariIstek, "cozumle">): boolean | string | null | undefined {
  if (typeof window === "undefined") return istek.tur === "onay" ? false : null;
  const metin = istek.baslik ? `${istek.baslik}\n\n${istek.mesaj}` : istek.mesaj;
  if (istek.tur === "onay") return window.confirm(metin);
  if (istek.tur === "sor") return window.prompt(metin, istek.varsayilan ?? "");
  window.alert(metin);
  return undefined;
}

function istekKur(tur: UyariTuru, mesaj: string, sec: UyariSecenek = {}) {
  return new Promise<boolean | string | null | undefined>((cozumle) => {
    if (!isleyici) {
      cozumle(yedek({ ...sec, tur, mesaj }));
      return;
    }
    isleyici.pencere({ ...sec, tur, mesaj, cozumle });
  });
}

export const Uyari = {
  /** Bilgilendirme penceresi */
  bilgi: (mesaj: string, sec?: UyariSecenek) => istekKur("bilgi", mesaj, sec) as Promise<void>,
  /** Olumlu sonuç penceresi */
  basari: (mesaj: string, sec?: UyariSecenek) => istekKur("basari", mesaj, sec) as Promise<void>,
  /** Dikkat / eksik girdi penceresi */
  uyari: (mesaj: string, sec?: UyariSecenek) => istekKur("uyari", mesaj, sec) as Promise<void>,
  /** Başarısız işlem penceresi — sunucudan dönen hata mesajları için */
  hata: (mesaj: string, sec?: UyariSecenek) => istekKur("hata", mesaj, sec) as Promise<void>,
  /** confirm() karşılığı */
  onay: (mesaj: string, sec?: UyariSecenek) => istekKur("onay", mesaj, sec) as Promise<boolean>,
  /** prompt() karşılığı — vazgeçilirse null */
  sor: (mesaj: string, sec?: UyariSecenek) => istekKur("sor", mesaj, sec) as Promise<string | null>,
  /** Akışı kesmeyen kısa şerit: "kaydedildi", "kopyalandı" gibi */
  bildir: (mesaj: string, sec?: SeritSecenek) => {
    if (!isleyici) {
      if (typeof window !== "undefined" && sec?.tur === "hata") window.alert(mesaj);
      return;
    }
    isleyici.serit({ ...sec, mesaj, anahtar: ++seritSayaci });
  },
};
