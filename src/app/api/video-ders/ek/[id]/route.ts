import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dosyaMutlakYol } from "@/lib/dosya-saklama";
import { okuyabilir } from "@/lib/video-ders-sunucu";
import { logcu } from "@/lib/log";

const log = logcu("video-ek");

/**
 * Videoya eklenen doküman (PDF/Word/görsel) — videoyu görebilen herkes erişir.
 * Dosyalar public dizinin DIŞINDA tutulur; yalnız kayıt kimliği kullanılır.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const oturum = await auth();
  if (!oturum?.user?.id || !oturum.user.rol) {
    return NextResponse.json({ hata: "Oturum gerekli." }, { status: 401 });
  }

  const ek = await prisma.videoEk.findUnique({
    where: { id },
    select: { ad: true, yol: true, tur: true, videoId: true },
  });
  if (!ek) return NextResponse.json({ hata: "Dosya bulunamadı." }, { status: 404 });

  if (!(await okuyabilir(ek.videoId, { id: oturum.user.id, rol: oturum.user.rol }))) {
    return NextResponse.json({ hata: "Bu dosyayı görüntüleme yetkiniz yok." }, { status: 403 });
  }

  let icerik: Buffer;
  try {
    icerik = await readFile(dosyaMutlakYol(ek.yol));
  } catch (e) {
    log.error({ id, hata: e instanceof Error ? e.message : String(e) }, "ek okunamadı");
    return NextResponse.json({ hata: "Dosya bulunamadı." }, { status: 404 });
  }

  // Dosya adını Content-Disposition için güvenli hale getir (ASCII + RFC 5987)
  const guvenliAd = ek.ad.replace(/["\r\n]/g, "_");
  return new NextResponse(new Uint8Array(icerik), {
    status: 200,
    headers: {
      "Content-Type": ek.tur || "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(ek.ad)}; filename="${guvenliAd}"`,
      "Content-Length": String(icerik.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
