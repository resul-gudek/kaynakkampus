import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dosyaMutlakYol } from "@/lib/dosya-saklama";
import { logcu } from "@/lib/log";

const log = logcu("blog-kapak");

/**
 * Blog kapak görseli. Yayındaki yazıların kapağı HERKESE açıktır (blog
 * oturum gerektirmez) ve uzun süre önbelleklenir. Taslak yazının kapağı
 * yalnız yönetici önizlemesinde görünür.
 *
 * Kapak dosyaları public dizinin DIŞINDA tutulur; gerçek disk yolu
 * istemciye gönderilmez.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const yazi = await prisma.blogYazi.findUnique({
    where: { id },
    select: { kapakYol: true, kapakTur: true, durum: true },
  });
  if (!yazi?.kapakYol) {
    return NextResponse.json({ hata: "Kapak görseli yok." }, { status: 404 });
  }

  if (yazi.durum !== "yayinda") {
    const oturum = await auth();
    if (oturum?.user?.rol !== "admin") {
      return NextResponse.json({ hata: "Bu yazı yayında değil." }, { status: 404 });
    }
  }

  let icerik: Buffer;
  try {
    icerik = await readFile(dosyaMutlakYol(yazi.kapakYol));
  } catch (e) {
    log.error({ id, hata: e instanceof Error ? e.message : String(e) }, "kapak okunamadı");
    return NextResponse.json({ hata: "Kapak dosyası bulunamadı." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(icerik), {
    status: 200,
    headers: {
      "Content-Type": yazi.kapakTur || "application/octet-stream",
      "Content-Length": String(icerik.length),
      // Yayındaki kapak değişmezse yeniden indirilmesin; taslak önbelleğe alınmaz
      "Cache-Control":
        yazi.durum === "yayinda"
          ? "public, max-age=3600, stale-while-revalidate=86400"
          : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
