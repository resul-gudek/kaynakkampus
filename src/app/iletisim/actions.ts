"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { mailKuyrukla } from "@/lib/mail";
import { hizSiniriIzin } from "@/lib/rate-limit";
import { ILETISIM_EPOSTA } from "@/lib/site";
import { logcu } from "@/lib/log";

const log = logcu("iletisim");

const IletisimSemasi = z.object({
  ad: z.string().trim().min(2, "Adınızı ve soyadınızı yazın.").max(100, "Ad soyad en fazla 100 karakter olabilir."),
  eposta: z.string().trim().toLowerCase().email("Geçerli bir e-posta adresi yazın.").max(254),
  konu: z.string().trim().min(3, "Konuyu en az 3 karakterle belirtin.").max(150, "Konu en fazla 150 karakter olabilir."),
  mesaj: z.string().trim().min(10, "Mesajınız en az 10 karakter olmalı.").max(5000, "Mesajınız en fazla 5.000 karakter olabilir."),
});

export type IletisimSonuc = {
  durum: "bos" | "basarili" | "hata";
  mesaj?: string;
  alanlar?: Partial<Record<"ad" | "eposta" | "konu" | "mesaj", string>>;
};

function ilkAlanHatalari(
  hata: z.ZodError<z.infer<typeof IletisimSemasi>>,
): IletisimSonuc["alanlar"] {
  const duz = z.flattenError(hata).fieldErrors;
  return {
    ad: duz.ad?.[0],
    eposta: duz.eposta?.[0],
    konu: duz.konu?.[0],
    mesaj: duz.mesaj?.[0],
  };
}

export async function iletisimMesajiGonder(
  _onceki: IletisimSonuc,
  formData: FormData,
): Promise<IletisimSonuc> {
  const basliklar = await headers();
  const ip = (basliklar.get("x-forwarded-for")?.split(",")[0] ?? basliklar.get("x-real-ip") ?? "bilinmiyor").trim();

  // Botların doldurduğu görünmez alan boş değilse gerçek kullanıcıya başarı göster,
  // ancak mail kuyruğuna hiçbir şey yazma.
  if (String(formData.get("telefon") ?? "").trim()) {
    log.warn({ ip }, "iletişim honeypot tetiklendi");
    return { durum: "basarili", mesaj: "Mesajınız bize ulaştı. En kısa sürede dönüş yapacağız." };
  }

  const sonuc = IletisimSemasi.safeParse({
    ad: formData.get("ad"),
    eposta: formData.get("eposta"),
    konu: formData.get("konu"),
    mesaj: formData.get("mesaj"),
  });

  if (!sonuc.success) {
    return {
      durum: "hata",
      mesaj: "Lütfen işaretli alanları kontrol edin.",
      alanlar: ilkAlanHatalari(sonuc.error),
    };
  }

  const sinirAnahtari = `iletisim:${ip}:${sonuc.data.eposta}`;
  if (!hizSiniriIzin(sinirAnahtari, 3, 60 * 60 * 1000)) {
    log.warn({ ip }, "iletişim hız sınırı aşıldı");
    return {
      durum: "hata",
      mesaj: "Çok kısa sürede fazla mesaj gönderdiniz. Lütfen bir süre sonra yeniden deneyin.",
    };
  }

  const eklendi = await mailKuyrukla({
    sablonAnahtar: "iletisim-mesaji",
    alici: ILETISIM_EPOSTA,
    aliciAd: "Kaynak Kampüs",
    degiskenler: sonuc.data,
  });

  if (!eklendi) {
    log.error({ ip }, "iletişim mesajı kuyruklanamadı");
    return {
      durum: "hata",
      mesaj: `Mesaj şu anda gönderilemedi. Lütfen doğrudan ${ILETISIM_EPOSTA} adresine yazın.`,
    };
  }
  // Mesaj/e-posta içeriği loga yazılmaz (PII) — iz sürmeye ip + konu yeter
  log.info({ ip, konu: sonuc.data.konu }, "iletişim mesajı alındı");

  // Gönderene "mesajınız ulaştı" onayı — asıl mesaj ekibe ulaştığı için
  // bu kuyruklamanın başarısızlığı kullanıcıya hata olarak yansıtılmaz.
  await mailKuyrukla({
    sablonAnahtar: "iletisim-onay",
    alici: sonuc.data.eposta,
    aliciAd: sonuc.data.ad,
    degiskenler: { ad: sonuc.data.ad, konu: sonuc.data.konu, mesaj: sonuc.data.mesaj },
  });

  return { durum: "basarili", mesaj: "Mesajınız bize ulaştı. En kısa sürede dönüş yapacağız." };
}
