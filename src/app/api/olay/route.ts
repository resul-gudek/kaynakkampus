import { NextResponse } from "next/server";
import { hizSiniriIzin } from "@/lib/rate-limit";
import {
  OLAYLAR,
  aracOzeti,
  detayTemizle,
  sayacArtir,
  toplamSayilar,
} from "@/lib/kullanim-sayaci";

/**
 * Anonim kullanım sayacı ucu — public sayfalardaki assets/kullanim-sayac.js
 * buraya sendBeacon ile { olay, detay } gönderir; ilgili günlük sayaç 1 artar.
 *
 * Kişisel veri KAYDEDİLMEZ: IP yalnızca bellek-içi hız sınırı anahtarıdır,
 * veritabanına yazılmaz. Yanıt herkese açıktır; oturum gerektirmez
 * (src/proxy.ts açık listesinde /api yoktur).
 */
export async function POST(req: Request) {
  // Hız sınırı: IP başına dakikada 60 olay (bir sayfa gezintisi için bol bol yeter)
  const ip = (req.headers.get("x-forwarded-for") ?? "yerel").split(",")[0].trim();
  if (!hizSiniriIzin(`olay:${ip}`, 60, 60_000)) {
    return new NextResponse(null, { status: 429 });
  }

  let govde: unknown;
  try {
    govde = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const { olay, detay } = (govde ?? {}) as { olay?: unknown; detay?: unknown };
  if (typeof olay !== "string" || !OLAYLAR.has(olay)) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    await sayacArtir(olay, detayTemizle(detay));
  } catch {
    // Sayaç eksik kalabilir; ziyaretçiye hata yansıtılmaz
    return new NextResponse(null, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}

/** Herkese açık toplamlar — oyunlar.html kartlarındaki "kez oynandı"
 *  sayısı buradan okunur: { "<oyun adı>": toplam }. Yalnız izinli olaylar
 *  açılır (sayfa yolları, araç kullanımı vb. dışarı verilmez). */
const ACIK_TOPLAMLAR = new Set(["oyun"]);

export async function GET(req: Request) {
  const sorgu = new URL(req.url).searchParams;
  const onbellek = { headers: { "Cache-Control": "public, max-age=300" } };

  /* ?ozet=araclar → araç kartlarındaki "kaç kez kullanıldı" sayıları */
  if (sorgu.get("ozet") === "araclar") return NextResponse.json(await aracOzeti(), onbellek);

  const olay = sorgu.get("olay") ?? "";
  if (!ACIK_TOPLAMLAR.has(olay)) return new NextResponse(null, { status: 400 });
  const toplam = await toplamSayilar(olay);
  return NextResponse.json(Object.fromEntries(toplam), onbellek);
}
