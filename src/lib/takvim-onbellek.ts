/* ══════════════════════════════════════════════════════════════════════
   Sınav takvimi önbelleği ve zamanlanmış tazeleme.

   Takvimin "düzenli güncel tutulması" iki yoldan sağlanır:
   · Sunucu açılışında bir kez ısıtılır (bkz. src/instrumentation.ts),
   · Ardından TAZELEME_ARALIGI'nda bir kendiliğinden yenilenir.
   Böylece ziyaretçi hiçbir zaman ÖSYM/MEB isteklerini beklemez; istek
   anında elde ne varsa (taze önbellek → bayat önbellek → çekirdek dosya)
   döner, tazeleme arka planda sürer.
   ══════════════════════════════════════════════════════════════════════ */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { logcu } from "@/lib/log";
import { senkronEt, type TakvimVerisi } from "@/lib/sinav-takvimi";

const log = logcu("takvim-onbellek");

/** ÖSYM/MEB takvimi günde birkaç kez değişir; 6 saat yeterli */
export const TTL = 6 * 60 * 60 * 1000;
/** Canlı veri alınamadıysa erken yeniden denemek için kısa ömür */
const HATA_TTL = 10 * 60 * 1000;
/** Trafik olmasa da takvim güncel kalsın */
const TAZELEME_ARALIGI = TTL;

/* DİKKAT: instrumentation.ts ile API rotası AYRI paketlere derlenir; modül
   düzeyindeki değişken ikisi arasında paylaşılmaz (ölçülerek görüldü: açılışta
   ısıtılan önbellek rotada boş görünüyordu). Bu yüzden durum globalThis'te
   tutulur — depodaki prisma tekili de aynı deseni kullanıyor. */
interface TakvimDurumu {
  onbellek: { veri: TakvimVerisi; zaman: number } | null;
  tazelemeSozu: Promise<TakvimVerisi> | null;
  zamanlayici: ReturnType<typeof setInterval> | null;
}

const kure = globalThis as unknown as { kkTakvim?: TakvimDurumu };
const durum: TakvimDurumu = (kure.kkTakvim ??= {
  onbellek: null,
  tazelemeSozu: null,
  zamanlayici: null,
});

/** Çekirdek (yedek) veri: public/assets/sinav-takvimi.json */
async function cekirdekOku(): Promise<TakvimVerisi> {
  const yol = path.join(process.cwd(), "public", "assets", "sinav-takvimi.json");
  return JSON.parse(await readFile(yol, "utf8")) as TakvimVerisi;
}

/** ÖSYM/MEB'den çeker, çekirdekle birleştirir, önbelleğe yazar */
async function senkronla(): Promise<TakvimVerisi> {
  const cekirdek = await cekirdekOku();
  let veri: TakvimVerisi;
  try {
    const s = await senkronEt(cekirdek);
    veri = {
      ...cekirdek,
      guncellenme: new Date().toISOString(),
      canli: s.canli,
      kaynak: s.canli ? "canli" : "cekirdek",
      kaynaklar: s.kaynaklar,
      sinavlar: s.sinavlar,
      duyurular: s.duyurular,
    };
    if (s.ayristirmaUyarisi) {
      // Ağ sorunu değil, kaynak sayfanın yapısı değişmiş — elle bakılması gerekir
      log.error({ kaynak: "osym.gov.tr" }, s.ayristirmaUyarisi);
    }
    log.info(
      { sinav: veri.sinavlar.length, duyuru: s.duyurular.length, canli: s.canli },
      "takvim senkronlandı"
    );
  } catch (e) {
    log.warn(
      { hata: e instanceof Error ? e.message : String(e) },
      "senkronizasyon başarısız, çekirdek kullanılıyor"
    );
    veri = { ...cekirdek, canli: false, kaynak: "cekirdek" };
  }

  // Canlı veri alınamadıysa önbellek kısa ömürlü sayılır; yakında yeniden denenir
  durum.onbellek = { veri, zaman: veri.canli ? Date.now() : Date.now() - TTL + HATA_TTL };
  return veri;
}

/** Aynı anda tek tazeleme sürsün; ikinci çağrı aynı sözü bekler */
function tazele(): Promise<TakvimVerisi> {
  if (!durum.tazelemeSozu) {
    durum.tazelemeSozu = senkronla().finally(() => {
      durum.tazelemeSozu = null;
    });
  }
  return durum.tazelemeSozu;
}

export interface TakvimSonucu {
  veri: TakvimVerisi;
  /** Yanıt hazır önbellekten mi geldi (ağ beklenmedi mi)? */
  onbellekten: boolean;
}

/**
 * İstek anındaki en iyi veriyi döndürür.
 * @param bekle `true` ise tazeleme tamamlanana kadar bekler (`?tazele=1`).
 */
export async function takvimGetir(bekle = false): Promise<TakvimSonucu> {
  if (bekle) return { veri: await tazele(), onbellekten: false };

  const mevcut = durum.onbellek;
  if (mevcut && Date.now() - mevcut.zaman < TTL) {
    return { veri: mevcut.veri, onbellekten: true };
  }

  // Bayat ya da hiç yok: tazelemeyi başlat ama yanıt için BEKLEME
  void tazele().catch(() => {});

  // Elde bayat önbellek varsa onu ver; yoksa çekirdek dosyayı oku (hızlı)
  if (mevcut) return { veri: mevcut.veri, onbellekten: true };
  const cekirdek = await cekirdekOku();
  return { veri: { ...cekirdek, canli: false, kaynak: "cekirdek" }, onbellekten: false };
}

/** Sunucu açılışında çağrılır: önbelleği ısıtır ve periyodik tazelemeyi kurar */
export function takvimIsitmaBaslat() {
  if (durum.zamanlayici) return;
  tazele().catch(() => {
    /* senkronla kendi içinde yakalıyor; yine de sözü boğ */
  });
  durum.zamanlayici = setInterval(() => {
    tazele().catch(() => {});
  }, TAZELEME_ARALIGI);
  // Süreç kapanışını engellemesin
  if (typeof durum.zamanlayici.unref === "function") durum.zamanlayici.unref();
  log.info({ aralikDk: Math.round(TAZELEME_ARALIGI / 60000) }, "takvim tazeleme zamanlayıcısı kuruldu");
}
