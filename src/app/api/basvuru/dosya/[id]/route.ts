import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { yetkiVar } from "@/lib/yetki";
import { dosyaMutlakYol } from "@/lib/basvuru-dosya";
import { denetim, logcu } from "@/lib/log";
import type { Rol } from "@/lib/sabitler";

const log = logcu("basvuru-dosya");

/**
 * Başvuru belgesi indirme — YALNIZ basvuru:yonet yetkili kullanıcılar.
 * Gerçek disk yolu istemciye asla gönderilmez; yalnız kayıt id'si kullanılır.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const oturum = await auth();
  if (!oturum?.user?.id || !oturum.user.rol) {
    return NextResponse.json({ hata: "Oturum gerekli." }, { status: 401 });
  }
  if (!yetkiVar(oturum.user.rol as Rol, "basvuru:yonet")) {
    return NextResponse.json({ hata: "Bu belgeyi görüntüleme yetkiniz yok." }, { status: 403 });
  }

  const dosya = await prisma.basvuruDosya.findUnique({
    where: { id },
    select: { ad: true, yol: true, tur: true, basvuruId: true },
  });
  if (!dosya) return NextResponse.json({ hata: "Belge bulunamadı." }, { status: 404 });

  let icerik: Buffer;
  try {
    icerik = await readFile(dosyaMutlakYol(dosya.yol));
  } catch (e) {
    log.error({ id, hata: e instanceof Error ? e.message : String(e) }, "belge okunamadı");
    return NextResponse.json({ hata: "Belge dosyası bulunamadı." }, { status: 404 });
  }

  denetim("basvuru.dosyaGoruntule", { id: oturum.user.id, rol: oturum.user.rol }, {
    dosyaId: id,
    basvuruId: dosya.basvuruId,
  });

  // Dosya adını Content-Disposition için güvenli hale getir (ASCII + RFC 5987)
  const guvenliAd = dosya.ad.replace(/["\r\n]/g, "_");
  return new NextResponse(new Uint8Array(icerik), {
    status: 200,
    headers: {
      "Content-Type": dosya.tur || "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(dosya.ad)}; filename="${guvenliAd}"`,
      "Content-Length": String(icerik.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
