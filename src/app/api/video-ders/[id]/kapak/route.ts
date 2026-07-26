import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dosyaMutlakYol } from "@/lib/dosya-saklama";
import { okuyabilir } from "@/lib/video-ders-sunucu";
import { logcu } from "@/lib/log";

const log = logcu("video-kapak");

/**
 * Video kapak görseli — videoyu görebilen herkes (atanmış öğrenci, videonun
 * öğretmeni, yönetici) erişir. Gerçek disk yolu istemciye gönderilmez.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const oturum = await auth();
  if (!oturum?.user?.id || !oturum.user.rol) {
    return NextResponse.json({ hata: "Oturum gerekli." }, { status: 401 });
  }
  if (!(await okuyabilir(id, { id: oturum.user.id, rol: oturum.user.rol }))) {
    return NextResponse.json({ hata: "Bu videoyu görüntüleme yetkiniz yok." }, { status: 403 });
  }

  const video = await prisma.videoDers.findUnique({
    where: { id },
    select: { kapakYol: true, kapakTur: true },
  });
  if (!video?.kapakYol) {
    return NextResponse.json({ hata: "Kapak görseli yok." }, { status: 404 });
  }

  let icerik: Buffer;
  try {
    icerik = await readFile(dosyaMutlakYol(video.kapakYol));
  } catch (e) {
    log.error({ id, hata: e instanceof Error ? e.message : String(e) }, "kapak okunamadı");
    return NextResponse.json({ hata: "Kapak dosyası bulunamadı." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(icerik), {
    status: 200,
    headers: {
      "Content-Type": video.kapakTur || "application/octet-stream",
      "Content-Length": String(icerik.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
