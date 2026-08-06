import "server-only";

/* ═══════════════════════════════════════════════════════════════
   Push kuyruğu — bildirimleri commit SONRASI cihazlara gönderir.

   Neden kuyruk? bildirimEkle() transaction içinde çağrılır (30 çağrı
   yeri). Push ağ işidir; transaction içinde göndermek FCM yavaşladığında
   veritabanı kilitlerini uzatır, transaction geri alınırsa da gönderilmiş
   push'u geri alamayız. Bu yüzden bildirim yazılırken pushDurum="bekliyor"
   kalır, gönderimi mail işleyicisi turu (60 sn) yapar — mail kuyruğuyla
   aynı desen.

   Her bildirim en fazla bir kez denenir: sonuç ne olursa olsun satır
   "gonderildi" ya da "atlandi" işaretlenir. Böylece FCM geçici hata
   verdiğinde bildirim sonsuz döngüye girmez.
   ═══════════════════════════════════════════════════════════════ */

import { prisma } from "@/lib/prisma";
import { bildirimYolu, pushBaslik, pushIzinli } from "@/lib/bildirim-tercih";
import { pushGonder, pushYapilandirildi } from "@/lib/push";
import { logcu } from "@/lib/log";

const log = logcu("push-kuyruk");

/** Bir turda en çok kaç bildirim denenir (tur süresini sınırlar). */
const TUR_TAVANI = 100;

/** Bundan eski bekleyen bildirimler gönderilmez. Sunucu bir süre kapalı
    kaldıysa açılışta geçmiş bildirim yağmasını önler. */
const BAYATLAMA_DK = 30;

export async function pushKuyrugunuIsle(): Promise<{ gonderilen: number; atlanan: number }> {
  // VAPID yoksa satırlara dokunma: anahtarlar sonradan girilirse
  // bayatlamamış bildirimler yine gönderilebilsin.
  if (!pushYapilandirildi()) return { gonderilen: 0, atlanan: 0 };

  const simdi = new Date();
  const esik = new Date(simdi.getTime() - BAYATLAMA_DK * 60_000);

  // Bayatlamışları tek sorguda kapat
  const bayat = await prisma.bildirim.updateMany({
    where: { pushDurum: "bekliyor", tarih: { lt: esik } },
    data: { pushDurum: "atlandi" },
  });

  const bekleyenler = await prisma.bildirim.findMany({
    where: { pushDurum: "bekliyor", tarih: { gte: esik } },
    orderBy: { tarih: "asc" },
    take: TUR_TAVANI,
    select: {
      id: true,
      aliciId: true,
      metin: true,
      hedefTur: true,
      hedefOgrenciId: true,
      hedefKayitId: true,
      alici: { select: { rol: true, aktif: true } },
    },
  });
  if (!bekleyenler.length) {
    return { gonderilen: 0, atlanan: bayat.count };
  }

  // Alıcıların tercihleri tek sorguda
  const aliciIdler = [...new Set(bekleyenler.map((b) => b.aliciId))];
  const tercihler = await prisma.bildirimTercih.findMany({
    where: { kullaniciId: { in: aliciIdler } },
    select: { kullaniciId: true, tur: true, push: true },
  });
  const tercihHar = new Map<string, Array<{ tur: string; push: boolean }>>();
  for (const t of tercihler) {
    const dizi = tercihHar.get(t.kullaniciId) ?? [];
    dizi.push({ tur: t.tur, push: t.push });
    tercihHar.set(t.kullaniciId, dizi);
  }

  const gonderildi: string[] = [];
  const atlandi: string[] = [];

  for (const b of bekleyenler) {
    const kullaniciTercihi = tercihHar.get(b.aliciId) ?? [];
    // Pasifleştirilmiş kullanıcıya push gitmez
    if (!b.alici.aktif || !pushIzinli(b.hedefTur, kullaniciTercihi)) {
      atlandi.push(b.id);
      continue;
    }
    const adet = await pushGonder(b.aliciId, {
      baslik: pushBaslik(b.hedefTur),
      govde: b.metin,
      url: bildirimYolu(b, b.alici.rol),
      // Aynı kayda ait bildirimler cihazda üst üste yığılmasın
      etiket: b.hedefKayitId ? `${b.hedefTur}-${b.hedefKayitId}` : `bildirim-${b.id}`,
    });
    // adet === 0 → kayıtlı cihaz yok; tekrar denemenin anlamı yok
    (adet > 0 ? gonderildi : atlandi).push(b.id);
  }

  if (gonderildi.length) {
    await prisma.bildirim.updateMany({
      where: { id: { in: gonderildi } },
      data: { pushDurum: "gonderildi" },
    });
  }
  if (atlandi.length) {
    await prisma.bildirim.updateMany({
      where: { id: { in: atlandi } },
      data: { pushDurum: "atlandi" },
    });
  }

  const sonuc = { gonderilen: gonderildi.length, atlanan: atlandi.length + bayat.count };
  if (sonuc.gonderilen || sonuc.atlanan) log.info(sonuc, "push kuyruğu turu tamamlandı");
  return sonuc;
}
