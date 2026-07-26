"use client";

/* Öğrenci detayı başlığındaki WhatsApp düğmeleri + telefon düzenleme —
   legacy waOdevHatirlat / waVeliRaporu / waNumaraAl. */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { bugun, tarihStr, telefonDuzelt } from "@/lib/hesap";
import { telefonGuncelle } from "@/actions/ogrenci";
import { waGonder, waNumaraAl } from "./wa";
import type { WaVeri } from "./tipler";

export default function WaButonlar({ veri }: { veri: WaVeri }) {
  const router = useRouter();
  const [, baslat] = useTransition();
  const ilkAd = veri.ad.split(" ")[0];

  async function odevHatirlat() {
    const num = await waNumaraAl(veri.ogrenciId, veri.telefon, "telefon", "Öğrencinin telefonu");
    if (!num) return;
    const satirlar = veri.bekleyenOdevler.length
      ? veri.bekleyenOdevler
          .map(
            (x) =>
              `• ${x.ders} – ${x.konu} (son tarih: ${tarihStr(x.sonTarih) || "—"})` +
              (x.kaynak ? " · " + x.kaynak : "")
          )
          .join("\n")
      : "• Bekleyen ödevin yok, tebrikler! 🎉";
    waGonder(
      num,
      `Merhaba ${ilkAd}! 👋\n\n` +
        `📘 Kaynak Kampüs – Ödev Hatırlatması\n\n` +
        `Bekleyen ödevlerin:\n${satirlar}\n\n` +
        `Takıldığın yerde bana yazabilirsin. Başarılar! 💪\n${veri.kocAd}`
    );
  }

  async function veliRaporu() {
    const num = await waNumaraAl(veri.ogrenciId, veri.veliTelefon, "veliTelefon", "Veli telefonu");
    if (!num) return;
    const denemeStr = veri.sonDeneme
      ? `${veri.sonDeneme.ad}: ${veri.sonDeneme.net} net` +
        (veri.netFarki !== null
          ? ` (önceki denemeye göre ${veri.netFarki >= 0 ? "+" : ""}${veri.netFarki})`
          : "")
      : "Henüz deneme sonucu girilmedi";
    const oz = veri.ozel;
    const mesaj =
      `Sayın Velimiz, merhaba. 👋\n\n` +
      `📊 Kaynak Kampüs – ${veri.ad} Gelişim Raporu (${bugun()})\n\n` +
      `📘 Ödev tamamlama: %${veri.odevYuzde} (${veri.odevTamam}/${veri.odevToplam})\n` +
      `✅ Haftalık takip listesi: %${veri.takipYuzde} (${veri.takipTamam}/${veri.takipToplam})\n` +
      `🗺️ Yol haritası ilerlemesi: %${veri.yolYuzde} (${veri.yolTamamlanan}/${veri.yolToplam} adım · Seviye ${veri.seviye} · ${veri.xp} XP)\n` +
      `📈 Son deneme: ${denemeStr}\n` +
      (oz.toplam
        ? `🎓 Özel ders: ${oz.yapilan} ders yapıldı (${oz.toplamSaat} saat)` +
          (oz.sonrakiTarih
            ? ` · Sıradaki ders: ${tarihStr(oz.sonrakiTarih)}${oz.sonrakiSaat ? " " + oz.sonrakiSaat : ""}`
            : "") +
          (oz.bekleyenUcret ? ` · Bekleyen ödeme: ${oz.bekleyenUcret} ₺` : "") +
          "\n"
        : "") +
      (veri.zayif.length
        ? `📌 Bu hafta odaklanacağımız konular: ${veri.zayif.map((z) => z.ders + " – " + z.konu).join(", ")}\n`
        : "") +
      `\n` +
      `Sorularınız için bana ulaşabilirsiniz.\nSaygılarımla,\n${veri.kocAd} – Öğretmen`;
    waGonder(num, mesaj);
  }

  function telefonDuzenle() {
    const yeniTel = window.prompt("Öğrenci telefonu (WhatsApp):", veri.telefon);
    const yeniVeli = window.prompt("Veli telefonu (WhatsApp):", veri.veliTelefon);
    if (yeniTel === null && yeniVeli === null) return;
    baslat(async () => {
      const sonuc = await telefonGuncelle(veri.ogrenciId, {
        ...(yeniTel !== null && { telefon: telefonDuzelt(yeniTel) }),
        ...(yeniVeli !== null && { veliTelefon: telefonDuzelt(yeniVeli) }),
      });
      if (sonuc.hata) alert(sonuc.hata);
      else router.refresh();
    });
  }

  return (
    <>
      <button type="button" className="btn btn-wa btn-kucuk" onClick={odevHatirlat}>
        📲 Ödev Hatırlat
      </button>
      <button type="button" className="btn btn-wa btn-kucuk" onClick={veliRaporu}>
        👨‍👩‍👧 Veliye Rapor Gönder
      </button>
      <button
        type="button"
        className="btn btn-outline btn-kucuk"
        onClick={telefonDuzenle}
        title="Öğrenci ve veli telefonlarını düzenle"
      >
        📞 Telefonlar
      </button>
    </>
  );
}
