import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { yetkiVar } from "@/lib/yetki";
import { dosyaMutlakYol } from "@/lib/dosya-saklama";
import { logcu } from "@/lib/log";
import type { Rol } from "@/lib/sabitler";

const log = logcu("odev-kanit");

/**
 * Ödev kanıt fotoğrafı — ödevin öğrencisi, ödevi veren koç, öğrencinin velisi
 * ve admin görebilir.
 * Gerçek disk yolu istemciye asla gönderilmez; yalnız kayıt id'si kullanılır.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const oturum = await auth();
  if (!oturum?.user?.id || !oturum.user.rol) {
    return NextResponse.json({ hata: "Oturum gerekli." }, { status: 401 });
  }
  const rol = oturum.user.rol as Rol;
  const kullaniciId = oturum.user.id;

  const kanit = await prisma.odevKanit.findUnique({
    where: { id },
    select: {
      ad: true,
      yol: true,
      tur: true,
      odev: {
        select: {
          id: true,
          ogrenciId: true,
          kocId: true,
          // Veli erişimi: yalnız kendi çocuğunun ödevi (Kullanici.veliId)
          ogrenci: { select: { veliId: true } },
        },
      },
    },
  });
  if (!kanit) return NextResponse.json({ hata: "Fotoğraf bulunamadı." }, { status: 404 });

  const erisim =
    (rol === "ogrenci" && kanit.odev.ogrenciId === kullaniciId) ||
    (rol === "koc" && kanit.odev.kocId === kullaniciId) ||
    (rol === "veli" && kanit.odev.ogrenci.veliId === kullaniciId) ||
    yetkiVar(rol, "panel:admin");
  if (!erisim) {
    return NextResponse.json({ hata: "Bu fotoğrafı görüntüleme yetkiniz yok." }, { status: 403 });
  }

  let icerik: Buffer;
  try {
    icerik = await readFile(dosyaMutlakYol(kanit.yol));
  } catch (e) {
    log.error({ id, hata: e instanceof Error ? e.message : String(e) }, "kanıt okunamadı");
    return NextResponse.json({ hata: "Fotoğraf dosyası bulunamadı." }, { status: 404 });
  }

  // Dosya adını Content-Disposition için güvenli hale getir (ASCII + RFC 5987)
  const guvenliAd = kanit.ad.replace(/["\r\n]/g, "_");
  return new NextResponse(new Uint8Array(icerik), {
    status: 200,
    headers: {
      "Content-Type": kanit.tur || "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(kanit.ad)}; filename="${guvenliAd}"`,
      "Content-Length": String(icerik.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
