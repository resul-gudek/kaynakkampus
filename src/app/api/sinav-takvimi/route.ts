import { NextResponse } from "next/server";
import { takvimGetir } from "@/lib/takvim-onbellek";
import type { TakvimVerisi } from "@/lib/sinav-takvimi";

/**
 * Güncel sınav takvimi. ÖSYM'nin resmî takvim tablosu ile ÖSYM/MEB duyuruları
 * sunucu tarafında çekilir (tarayıcıdaki CORS engeli böylece aşılır); ağa
 * ulaşılamazsa çekirdek dosya (public/assets/sinav-takvimi.json) döner.
 *
 * İstek ÖSYM/MEB'i BEKLEMEZ — önbellek/çekirdek hemen döner, tazeleme arka
 * planda sürer (bkz. src/lib/takvim-onbellek.ts). `?tazele=1` bekleyerek yeniler.
 *
 * Yanıt herkese açıktır; oturum gerektirmez (bkz. src/proxy.ts matcher).
 */
export async function GET(req: Request) {
  const tazele = new URL(req.url).searchParams.get("tazele") === "1";

  let sonuc;
  try {
    sonuc = await takvimGetir(tazele);
  } catch {
    return NextResponse.json({ hata: "Sınav takvimi verisi okunamadı." }, { status: 500 });
  }

  return yanit(sonuc.veri, sonuc.onbellekten);
}

function yanit(veri: TakvimVerisi, onbellekten: boolean) {
  return NextResponse.json(veri, {
    headers: {
      // Statik sayfalar bu ucu doğrudan çağırır; kenar önbelleği uzun tutulur
      "Cache-Control": veri.canli
        ? "public, max-age=1800, s-maxage=21600, stale-while-revalidate=86400"
        : "public, max-age=300, s-maxage=600",
      "X-Takvim-Kaynak": onbellekten ? "onbellek" : veri.kaynak,
    },
  });
}
