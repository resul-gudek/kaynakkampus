import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dosyaMutlakYol } from "@/lib/dosya-saklama";
import { okuyabilir } from "@/lib/video-ders-sunucu";
import { logcu } from "@/lib/log";

const log = logcu("video-akis");

/**
 * Yüklenmiş ders videosunun akışı — Range destekli (öğrenci ileri/geri sarabilsin).
 * Dosya public dizinde DEĞİLDİR; yalnız videonun atandığı öğrenci, videonun
 * öğretmeni ve yönetici erişir. Gerçek disk yolu istemciye asla gönderilmez.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const oturum = await auth();
  if (!oturum?.user?.id || !oturum.user.rol) {
    return NextResponse.json({ hata: "Oturum gerekli." }, { status: 401 });
  }
  const kim = { id: oturum.user.id, rol: oturum.user.rol };

  if (!(await okuyabilir(id, kim))) {
    return NextResponse.json({ hata: "Bu videoyu görüntüleme yetkiniz yok." }, { status: 403 });
  }

  const video = await prisma.videoDers.findUnique({
    where: { id },
    select: { dosyaYol: true, dosyaTur: true, kaynakTur: true },
  });
  if (!video?.dosyaYol || video.kaynakTur !== "dosya") {
    return NextResponse.json({ hata: "Bu videoda yüklenmiş dosya yok." }, { status: 404 });
  }

  let mutlakYol: string;
  let boyut: number;
  try {
    mutlakYol = dosyaMutlakYol(video.dosyaYol);
    boyut = (await stat(mutlakYol)).size;
  } catch (e) {
    log.error({ id, hata: e instanceof Error ? e.message : String(e) }, "video dosyası okunamadı");
    return NextResponse.json({ hata: "Video dosyası bulunamadı." }, { status: 404 });
  }

  const tur = video.dosyaTur || "video/mp4";
  const ortakBaslik = {
    "Content-Type": tur,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };

  const aralik = araligiCoz(req.headers.get("range"), boyut);
  if (aralik === "gecersiz") {
    return new NextResponse(null, {
      status: 416, // Range Not Satisfiable
      headers: { ...ortakBaslik, "Content-Range": `bytes */${boyut}` },
    });
  }

  // Range yok → tüm dosya (200); varsa kısmi içerik (206)
  const { baslangic, bitis } = aralik ?? { baslangic: 0, bitis: boyut - 1 };
  const uzunluk = bitis - baslangic + 1;
  const akis = Readable.toWeb(
    createReadStream(mutlakYol, { start: baslangic, end: bitis })
  ) as ReadableStream<Uint8Array>;

  return new NextResponse(akis, {
    status: aralik ? 206 : 200,
    headers: {
      ...ortakBaslik,
      "Content-Length": String(uzunluk),
      ...(aralik ? { "Content-Range": `bytes ${baslangic}-${bitis}/${boyut}` } : {}),
    },
  });
}

/**
 * "bytes=1000-", "bytes=1000-2000", "bytes=-500" biçimlerini çözer.
 * null → Range başlığı yok, "gecersiz" → 416 döndürülmeli.
 */
function araligiCoz(
  baslik: string | null,
  boyut: number
): { baslangic: number; bitis: number } | null | "gecersiz" {
  if (!baslik) return null;
  const eslesme = /^bytes=(\d*)-(\d*)$/.exec(baslik.trim());
  if (!eslesme) return "gecersiz";
  const [, ilk, son] = eslesme;
  if (ilk === "" && son === "") return "gecersiz";

  // Sonek biçimi: son N bayt
  if (ilk === "") {
    const uzunluk = Number(son);
    if (!uzunluk) return "gecersiz";
    return { baslangic: Math.max(0, boyut - uzunluk), bitis: boyut - 1 };
  }

  const baslangic = Number(ilk);
  const bitis = son === "" ? boyut - 1 : Math.min(Number(son), boyut - 1);
  if (baslangic >= boyut || bitis < baslangic) return "gecersiz";
  return { baslangic, bitis };
}
