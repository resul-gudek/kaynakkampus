import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adTemizle, dosyaMutlakYol, dosyaSil } from "@/lib/dosya-saklama";
import { IZINLI_TURLER, IZINLI_UZANTILAR, MAX_VIDEO_BOYUT } from "@/lib/dosya-tanim";
import { videoKlasoru } from "@/lib/video-ders";
import { egitmenMi } from "@/lib/sabitler";
import { videoYayinBildirimi, yonetebilir } from "@/lib/video-ders-sunucu";
import { denetim, logcu } from "@/lib/log";

const log = logcu("video-yukle");

/* Ders videosu yükleme — gövde diske AKITILIR, belleğe alınmaz.
   Bu yüzden server action (25 MB gövde limiti) yerine ayrı rota kullanılır:
   istemci dosyayı ham gövde olarak POST eder, adı x-dosya-adi başlığında
   gönderir (Content-Type dosyanın MIME türüdür).

   Akış: kayıt önce meta verisiyle oluşturulur (actions/video-ders.ts),
   sonra bu rota dosyayı bağlar. Yükleme sırasında hata olursa yarım dosya
   silinir, kayıt eski haliyle kalır. */

const MB = Math.round(MAX_VIDEO_BOYUT / 1024 / 1024);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const oturum = await auth();
  if (!oturum?.user?.id || !oturum.user.rol) {
    return NextResponse.json({ hata: "Oturum gerekli." }, { status: 401 });
  }
  const kim = { id: oturum.user.id, rol: oturum.user.rol };
  if (!egitmenMi(kim.rol) && kim.rol !== "admin") {
    return NextResponse.json({ hata: "Bu işlem için yetkiniz yok." }, { status: 403 });
  }

  const video = await prisma.videoDers.findUnique({
    where: { id },
    select: {
      id: true,
      ogretmenId: true,
      durum: true,
      baslik: true,
      ders: true,
      tarih: true,
      dosyaYol: true,
    },
  });
  if (!video) return NextResponse.json({ hata: "Video bulunamadı." }, { status: 404 });
  if (!yonetebilir(video, kim)) {
    return NextResponse.json({ hata: "Bu video üzerinde yetkiniz yok." }, { status: 403 });
  }

  // Tür beyaz listesi: MIME + dosya adı uzantısı birlikte doğrulanır
  const mime = (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const beklenenUzanti = IZINLI_TURLER.video[mime];
  if (!beklenenUzanti) {
    return NextResponse.json(
      { hata: "Yalnız MP4 ve WebM video dosyaları yüklenebilir." },
      { status: 415 }
    );
  }
  const gelenAd = adTemizle(cozAd(req.headers.get("x-dosya-adi")));
  const gercekUzanti = path.extname(gelenAd).replace(".", "").toLowerCase();
  if (!IZINLI_UZANTILAR.has(gercekUzanti) || gercekUzanti !== beklenenUzanti) {
    return NextResponse.json(
      { hata: "Dosya uzantısı içeriğiyle uyuşmuyor." },
      { status: 415 }
    );
  }

  const bildirilenBoyut = Number(req.headers.get("content-length") ?? 0);
  if (bildirilenBoyut > MAX_VIDEO_BOYUT) {
    return NextResponse.json({ hata: `Video en fazla ${MB} MB olabilir.` }, { status: 413 });
  }
  if (!req.body) return NextResponse.json({ hata: "Video verisi gelmedi." }, { status: 400 });

  const goreliKlasor = videoKlasoru(id);
  const klasor = dosyaMutlakYol(goreliKlasor);
  await mkdir(klasor, { recursive: true });

  const rastgele = randomBytes(16).toString("hex");
  const dosyaAdi = `video-${rastgele}.${beklenenUzanti}`;
  const geciciYol = path.join(klasor, `.${dosyaAdi}.yukleniyor`);

  let yazilan = 0;
  const boyutBekcisi = new Transform({
    transform(parca, _kodlama, geri) {
      yazilan += parca.length;
      if (yazilan > MAX_VIDEO_BOYUT) {
        geri(new Error("BOYUT_ASILDI"));
        return;
      }
      geri(null, parca);
    },
  });

  try {
    await pipeline(
      Readable.fromWeb(req.body as Parameters<typeof Readable.fromWeb>[0]),
      boyutBekcisi,
      createWriteStream(geciciYol)
    );
  } catch (e) {
    await rm(geciciYol, { force: true }).catch(() => {});
    const boyutHatasi = e instanceof Error && e.message === "BOYUT_ASILDI";
    if (!boyutHatasi) {
      log.error({ id, hata: e instanceof Error ? e.message : String(e) }, "video yüklenemedi");
    }
    return NextResponse.json(
      { hata: boyutHatasi ? `Video en fazla ${MB} MB olabilir.` : "Video yüklenemedi." },
      { status: boyutHatasi ? 413 : 500 }
    );
  }

  if (yazilan === 0) {
    await rm(geciciYol, { force: true }).catch(() => {});
    return NextResponse.json({ hata: "Video verisi gelmedi." }, { status: 400 });
  }

  await rename(geciciYol, path.join(klasor, dosyaAdi));
  const yeniYol = path.posix.join(goreliKlasor, dosyaAdi);

  await prisma.videoDers.update({
    where: { id },
    data: {
      kaynakTur: "dosya",
      adres: "",
      dosyaAd: gelenAd,
      dosyaYol: yeniYol,
      dosyaTur: mime,
      dosyaBoyut: yazilan,
    },
  });
  // Yeni dosya bağlandıktan sonra eskisi diskten silinir
  if (video.dosyaYol && video.dosyaYol !== yeniYol) await dosyaSil(video.dosyaYol);

  // Dosya kaynaklı video yayına alınmışsa duyuru ancak şimdi anlam taşır
  if (video.durum === "yayinda") await videoYayinBildirimi(video);

  denetim("video.dosyaYukle", kim, { videoId: id, boyut: yazilan, tur: mime });
  return NextResponse.json({ tamam: true, boyut: yazilan, ad: gelenAd });
}

/** x-dosya-adi başlığı URL kodlu gelir (Türkçe karakterler için) */
function cozAd(ham: string | null): string {
  if (!ham) return "video.mp4";
  try {
    return decodeURIComponent(ham);
  } catch {
    return ham;
  }
}
