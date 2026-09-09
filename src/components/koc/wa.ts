"use client";

/* WhatsApp yardımcıları — legacy koc-panel.html waGonder / waNumaraAl */

import { telefonDuzelt } from "@/lib/hesap";
import { telefonGuncelle } from "@/actions/ogrenci";
import { Uyari } from "@/components/ui/uyari";

export function waGonder(numara: string, mesaj: string) {
  window.open("https://wa.me/" + numara + "?text=" + encodeURIComponent(mesaj), "_blank");
}

/** Numara kayıtlı değilse sorar, wa.me biçimine çevirir ve öğrenciye kaydeder. */
export async function waNumaraAl(
  ogrenciId: string,
  mevcut: string,
  alan: "telefon" | "veliTelefon",
  etiket: string
): Promise<string | null> {
  if (mevcut) return mevcut;
  const girilen = await Uyari.sor(etiket + " kayıtlı değil. WhatsApp numarasını gir:", {
    baslik: "WhatsApp numarası", yerTutucu: "05xx xxx xx xx", onayEtiketi: "Kaydet ve gönder"
  });
  if (!girilen) return null;
  const num = telefonDuzelt(girilen);
  if (!num) return null;
  const sonuc = await telefonGuncelle(ogrenciId, { [alan]: num });
  if (sonuc.hata) {
    Uyari.hata(sonuc.hata);
    return null;
  }
  return num;
}
