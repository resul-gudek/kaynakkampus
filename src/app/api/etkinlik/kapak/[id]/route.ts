import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dosyaMutlakYol } from "@/lib/dosya-saklama";
import { logcu } from "@/lib/log";

const log = logcu("etkinlik-kapak");

/**
 * Etkinlik ön izleme görseli. Yayındaki etkinliğin kapağı HERKESE açıktır;
 * taslak olan yalnız yönetici önizlemesinde görünür.
 *
 * Kapak dosyaları public dizinin DIŞINDA tutulur; gerçek disk yolu
 * istemciye gönderilmez (PDF rotasıyla aynı desen).
 */
export async function GET(_istek: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const dugum = await prisma.etkinlikDugum.findUnique({
    where: { id },
    select: { kapakYol: true, kapakTur: true, durum: true },
  });
  if (!dugum?.kapakYol) {
    return NextResponse.json({ hata: "Ön izleme görseli yok." }, { status: 404 });
  }

  if (dugum.durum !== "yayinda") {
    const oturum = await auth();
    if (oturum?.user?.rol !== "admin") {
      return NextResponse.json({ hata: "Bu etkinlik yayında değil." }, { status: 404 });
    }
  }

  let icerik: Buffer;
  try {
    icerik = await readFile(dosyaMutlakYol(dugum.kapakYol));
  } catch (e) {
    log.error({ id, hata: e instanceof Error ? e.message : String(e) }, "kapak okunamadı");
    return NextResponse.json({ hata: "Kapak dosyası bulunamadı." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(icerik), {
    status: 200,
    headers: {
      "Content-Type": dugum.kapakTur || "application/octet-stream",
      "Content-Length": String(icerik.length),
      "Cache-Control":
        dugum.durum === "yayinda"
          ? "public, max-age=3600, stale-while-revalidate=86400"
          : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
