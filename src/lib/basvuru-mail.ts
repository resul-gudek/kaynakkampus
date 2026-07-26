/* Başvuru / mülakat e-postaları — mailKuyrukla üzerine ince sarmalayıcı.
   Mail sistemi kapalıysa / e-posta yoksa sessizce atlanır (asla fırlatmaz). */

import { mailKuyrukla } from "@/lib/mail";
import { tarihStr } from "@/lib/hesap";
import {
  BASVURU_TUR_ETIKETLERI,
  MULAKAT_TUR_ETIKETLERI,
  type BasvuruTur,
  type MulakatTur,
} from "@/lib/sabitler";

export function uygulamaUrl(): string {
  return (process.env.UYGULAMA_URL ?? "http://localhost:37337").replace(/\/$/, "");
}

export function takipAdresi(token: string): string {
  return `${uygulamaUrl()}/basvuru/durum/${token}`;
}

function turEtiketi(tur: string): string {
  return BASVURU_TUR_ETIKETLERI[tur as BasvuruTur] ?? tur;
}

/** Başvuru gönderildiğinde başvurana onay + takip bağlantısı gönderir. */
export async function basvuruAlindiMailiKuyrukla(b: {
  id: string;
  ad: string;
  eposta: string;
  tur: string;
  takipToken: string;
}): Promise<boolean> {
  if (!b.eposta) return false;
  return mailKuyrukla({
    sablonAnahtar: "basvuru-alindi",
    alici: b.eposta,
    aliciAd: b.ad,
    degiskenler: {
      ad: b.ad,
      tur: turEtiketi(b.tur),
      takipAdresi: takipAdresi(b.takipToken),
    },
    refTur: "basvuru",
    refId: b.id,
  });
}

/** Başvuru durumu Olumlu/Olumsuz'a çekildiğinde başvurana son durum maili. */
export async function basvuruSonucMailiKuyrukla(
  b: { id: string; ad: string; eposta: string; takipToken: string },
  durum: "olumlu" | "olumsuz"
): Promise<boolean> {
  if (!b.eposta) return false;
  const olumlu = durum === "olumlu";
  return mailKuyrukla({
    sablonAnahtar: "basvuru-sonuc",
    alici: b.eposta,
    aliciAd: b.ad,
    degiskenler: {
      ad: b.ad,
      sonucBaslik: olumlu ? "Başvurunuz Olumlu Sonuçlandı 🎉" : "Başvuru Sonucunuz",
      sonucMesaj: olumlu
        ? "Başvurunuz değerlendirilmiş ve olumlu sonuçlanmıştır. En kısa sürede sonraki adımlar için sizinle iletişime geçeceğiz."
        : "Başvurunuzu değerlendirdik. Ne yazık ki şu an için sizinle ilerleyemiyoruz; gösterdiğiniz ilgi için teşekkür eder, ileride tekrar değerlendirmek isteriz.",
      takipAdresi: takipAdresi(b.takipToken),
    },
    // Aynı sonuç için tekrar kuyruklamayı önle; farklı sonuç (olumlu↔olumsuz) ayrı refId.
    refTur: "basvuru-sonuc",
    refId: `${b.id}:${durum}`,
  });
}

function mulakatDetay(m: { tur: string; baglanti: string; adres: string }): string {
  if (m.tur === "online") return m.baglanti || "Bağlantı görüşme öncesi paylaşılacaktır.";
  if (m.tur === "yuzyuze") return m.adres || "Adres görüşme öncesi paylaşılacaktır.";
  return "Sizi arayacağız.";
}

/** Mülakat planlandığında/yeniden planlandığında başvurana bilgi maili. */
export async function mulakatPlanlandiMailiKuyrukla(
  b: { ad: string; eposta: string; takipToken: string },
  m: { id: string; tarih: Date; tur: string; baglanti: string; adres: string; aciklama: string }
): Promise<boolean> {
  if (!b.eposta) return false;
  const saat = m.tarih.toLocaleTimeString("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
  });
  return mailKuyrukla({
    sablonAnahtar: "mulakat-planlandi",
    alici: b.eposta,
    aliciAd: b.ad,
    degiskenler: {
      ad: b.ad,
      tarih: tarihStr(m.tarih),
      saat,
      tur: MULAKAT_TUR_ETIKETLERI[m.tur as MulakatTur] ?? m.tur,
      detay: mulakatDetay(m),
      aciklama: m.aciklama || "",
      takipAdresi: takipAdresi(b.takipToken),
    },
    // Her yeni mülakat kaydı ayrı refId → yeniden planlamada yeni mail çıkar.
    refTur: "mulakat-plan",
    refId: m.id,
  });
}
