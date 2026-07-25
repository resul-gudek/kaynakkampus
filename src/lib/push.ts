import "server-only";

/* ═══════════════════════════════════════════════════════════════
   Web Push (VAPID) — yalnız sunucu tarafında.
   Kullanicinin izin verdigi cihazlara (PushAbonelik) bildirim gonderir.
   VAPID anahtarlari yoksa sessizce devre disi kalir (uygulama ici
   bildirim yine calisir). Gonderim 404/410 donerse abonelik budanir.
   ═══════════════════════════════════════════════════════════════ */

import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { logcu } from "@/lib/log";

const log = logcu("push");

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY?.trim();
const SUBJECT = process.env.VAPID_SUBJECT?.trim() || "mailto:admin@kaynakakademi.local";

let yapilandirildi = false;
if (PUBLIC_KEY && PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
    yapilandirildi = true;
  } catch (e) {
    log.error({ hata: e instanceof Error ? e.message : String(e) }, "VAPID yapılandırma hatası");
  }
}

/** Push altyapısı kullanılabilir mi? (VAPID anahtarları tanımlı mı) */
export function pushYapilandirildi(): boolean {
  return yapilandirildi;
}

export interface PushIcerik {
  baslik: string;
  govde: string;
  url?: string; // tıklanınca açılacak yol (örn. /canli-ders/<id>)
  etiket?: string; // aynı etiketli bildirimler cihazda tek satırda toplanır
}

/** Bir kullanıcının tüm cihazlarına push gönderir. Başarısız (410/404)
    abonelikleri siler. Gönderilen cihaz sayısını döner. */
export async function pushGonder(kullaniciId: string, icerik: PushIcerik): Promise<number> {
  if (!yapilandirildi) return 0;
  const abonelikler = await prisma.pushAbonelik.findMany({ where: { kullaniciId } });
  if (!abonelikler.length) return 0;

  const govde = JSON.stringify({
    baslik: icerik.baslik,
    govde: icerik.govde,
    url: icerik.url ?? "/",
    etiket: icerik.etiket ?? "genel",
  });

  let gonderilen = 0;
  const silinecek: string[] = [];
  await Promise.all(
    abonelikler.map(async (a) => {
      try {
        await webpush.sendNotification(
          { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
          govde
        );
        gonderilen++;
      } catch (e) {
        const kod = (e as { statusCode?: number })?.statusCode;
        if (kod === 404 || kod === 410) silinecek.push(a.id);
        else log.warn({ kod, hata: e instanceof Error ? e.message : String(e) }, "push gönderilemedi");
      }
    })
  );

  if (silinecek.length) {
    await prisma.pushAbonelik.deleteMany({ where: { id: { in: silinecek } } });
    log.info({ silinen: silinecek.length }, "geçersiz push abonelikleri silindi");
  }
  return gonderilen;
}

/** Birden çok kullanıcıya aynı içeriği gönderir. */
export async function pushGonderCoklu(kullaniciIdler: string[], icerik: PushIcerik): Promise<number> {
  let toplam = 0;
  for (const id of kullaniciIdler) toplam += await pushGonder(id, icerik);
  return toplam;
}
