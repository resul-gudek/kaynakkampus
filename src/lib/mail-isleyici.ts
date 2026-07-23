/* Mail kuyruğu işleyicisi — sunucu açılışında (src/instrumentation.ts)
   bir kez başlatılır. Her turda:
   1. Gönderim penceresine girmiş ders hatırlatmalarını kuyruklar,
   2. Bekleyen kuyruğu gönderir.

   Zamanlayıcı globalThis üzerinde tutulur; dev'de hot-reload modülü
   yeniden yüklese bile ikinci bir interval kurulmaz. */

import { logcu } from "@/lib/log";

const ARALIK_MS = 60_000; // 1 dk

const kuresel = globalThis as typeof globalThis & {
  __mailIsleyici?: ReturnType<typeof setInterval>;
};

export function mailIsleyiciBaslat(): void {
  if (kuresel.__mailIsleyici) return;

  const log = logcu("mail-isleyici");

  const tur = async () => {
    try {
      // dinamik import: prisma/nodemailer yalnız ilk turda yüklensin
      const { dersHatirlatmalariKuyrukla, kuyrukIsle } = await import("@/lib/mail");
      await dersHatirlatmalariKuyrukla();
      const sonuc = await kuyrukIsle();
      if (sonuc.gonderilen || sonuc.hatali) log.info(sonuc, "kuyruk turu tamamlandı");
    } catch (e) {
      log.error({ hata: e instanceof Error ? e.message : String(e) }, "kuyruk turu hatası");
    }
  };

  kuresel.__mailIsleyici = setInterval(tur, ARALIK_MS);
  setTimeout(tur, 10_000); // açılıştan kısa süre sonra ilk tur
  log.info({ aralikSn: ARALIK_MS / 1000 }, "mail kuyruğu işleyicisi başlatıldı");
}
