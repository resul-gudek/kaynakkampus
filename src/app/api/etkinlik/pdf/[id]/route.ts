import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dosyaMutlakYol } from "@/lib/dosya-saklama";
import { logcu } from "@/lib/log";

const log = logcu("etkinlik-pdf");

/**
 * Etkinlik PDF'i. Yayındaki etkinliklerin dosyası HERKESE açıktır
 * (etkinlik arşivi oturum gerektirmez); taslak olan yalnız yöneticiye
 * gösterilir.
 *
 *   /api/etkinlik/pdf/<id>          → tarayıcıda açar (inline)
 *   /api/etkinlik/pdf/<id>?indir=1  → indirir (attachment)
 *
 * Dosyalar public dizinin DIŞINDA tutulur; gerçek disk yolu istemciye
 * gönderilmez.
 */
export async function GET(istek: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const dugum = await prisma.etkinlikDugum.findUnique({
    where: { id },
    select: { tur: true, ad: true, durum: true, dosyaYol: true, dosyaAd: true },
  });
  if (!dugum || dugum.tur !== "pdf" || !dugum.dosyaYol) {
    return NextResponse.json({ hata: "PDF bulunamadı." }, { status: 404 });
  }

  if (dugum.durum !== "yayinda") {
    const oturum = await auth();
    if (oturum?.user?.rol !== "admin") {
      return NextResponse.json({ hata: "Bu etkinlik yayında değil." }, { status: 404 });
    }
  }

  let icerik: Buffer;
  try {
    icerik = await readFile(dosyaMutlakYol(dugum.dosyaYol));
  } catch (e) {
    log.error({ id, hata: e instanceof Error ? e.message : String(e) }, "pdf okunamadı");
    return NextResponse.json({ hata: "PDF dosyası bulunamadı." }, { status: 404 });
  }

  const indir = istek.nextUrl.searchParams.get("indir") === "1";
  /* İndirme adı Türkçe karakter taşıyabilir: ASCII yedeği filename ile,
     gerçek ad RFC 5987 filename* ile gönderilir. */
  const ad = (dugum.dosyaAd || `${dugum.ad}.pdf`).replace(/["\\]/g, "");
  const asciiAd = ad.replace(/[^\x20-\x7e]/g, "_");

  return new NextResponse(new Uint8Array(icerik), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(icerik.length),
      "Content-Disposition": `${indir ? "attachment" : "inline"}; filename="${asciiAd}"; filename*=UTF-8''${encodeURIComponent(ad)}`,
      "Cache-Control":
        dugum.durum === "yayinda"
          ? "public, max-age=3600, stale-while-revalidate=86400"
          : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
