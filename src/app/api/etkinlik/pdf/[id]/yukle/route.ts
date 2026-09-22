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
import { MAX_ETKINLIK_PDF_BOYUT } from "@/lib/dosya-tanim";
import { etkinlikKlasoru } from "@/lib/etkinlik";
import { etkinlikTazele } from "@/lib/etkinlik-sunucu";
import { denetim, logcu } from "@/lib/log";

const log = logcu("etkinlik-yukle");

/* Etkinlik PDF'i yükleme — gövde diske AKITILIR, belleğe alınmaz.
   Bu yüzden server action (next.config.ts'teki gövde limiti) yerine ayrı
   rota kullanılır: istemci dosyayı ham gövde olarak POST eder, adı
   x-dosya-adi başlığında gönderir (Content-Type dosyanın MIME türüdür).

   Akış: düğüm önce meta verisiyle oluşturulur (actions/etkinlik.ts),
   sonra bu rota PDF'i bağlar. Yükleme sırasında hata olursa yarım dosya
   silinir, kayıt eski haliyle kalır (yeni kayıtta istemci düğümü siler).

   Dosyası olmayan PDF düğümü ziyaretçiye gösterilmez
   (bkz. yayindakiAgac), yani yarım kalan yükleme arşivi bozmaz. */

const MB = Math.round(MAX_ETKINLIK_PDF_BOYUT / 1024 / 1024);
const BOYUT_HATASI = `Dosya çok büyük. En fazla ${MB} MB PDF yükleyebilirsiniz.`;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const oturum = await auth();
  if (!oturum?.user?.id || !oturum.user.rol) {
    return NextResponse.json({ hata: "Oturum gerekli." }, { status: 401 });
  }
  const kim = { id: oturum.user.id, rol: oturum.user.rol };
  if (kim.rol !== "admin") {
    return NextResponse.json({ hata: "Bu işlem için yetkiniz yok." }, { status: 403 });
  }

  const dugum = await prisma.etkinlikDugum.findUnique({
    where: { id },
    select: { id: true, tur: true, dosyaYol: true },
  });
  if (!dugum) return NextResponse.json({ hata: "Etkinlik bulunamadı." }, { status: 404 });
  if (dugum.tur !== "pdf") {
    return NextResponse.json({ hata: "Bu kayıt bir PDF etkinliği değil." }, { status: 400 });
  }

  // Tür beyaz listesi: MIME + dosya adı uzantısı birlikte doğrulanır
  const mime = (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (mime !== "application/pdf") {
    return NextResponse.json({ hata: "Yalnız PDF dosyası yüklenebilir." }, { status: 415 });
  }
  const gelenAd = adTemizle(cozAd(req.headers.get("x-dosya-adi")));
  if (!gelenAd.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ hata: "Dosya uzantısı içeriğiyle uyuşmuyor." }, { status: 415 });
  }

  const bildirilenBoyut = Number(req.headers.get("content-length") ?? 0);
  if (bildirilenBoyut > MAX_ETKINLIK_PDF_BOYUT) {
    return NextResponse.json({ hata: BOYUT_HATASI }, { status: 413 });
  }
  if (!req.body) return NextResponse.json({ hata: "PDF verisi gelmedi." }, { status: 400 });

  const goreliKlasor = etkinlikKlasoru(id);
  const klasor = dosyaMutlakYol(goreliKlasor);
  await mkdir(klasor, { recursive: true });

  const rastgele = randomBytes(16).toString("hex");
  const dosyaAdi = `dosya-${rastgele}.pdf`;
  const geciciYol = path.join(klasor, `.${dosyaAdi}.yukleniyor`);

  // Content-Length yalan söyleyebilir; asıl sınır akarken sayılır
  let yazilan = 0;
  const boyutBekcisi = new Transform({
    transform(parca, _kodlama, geri) {
      yazilan += parca.length;
      if (yazilan > MAX_ETKINLIK_PDF_BOYUT) {
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
      log.error({ id, hata: e instanceof Error ? e.message : String(e) }, "pdf yüklenemedi");
    }
    return NextResponse.json(
      { hata: boyutHatasi ? BOYUT_HATASI : "PDF yüklenemedi." },
      { status: boyutHatasi ? 413 : 500 }
    );
  }

  if (yazilan === 0) {
    await rm(geciciYol, { force: true }).catch(() => {});
    return NextResponse.json({ hata: "PDF verisi gelmedi." }, { status: 400 });
  }

  await rename(geciciYol, path.join(klasor, dosyaAdi));
  const yeniYol = path.posix.join(goreliKlasor, dosyaAdi);

  await prisma.etkinlikDugum.update({
    where: { id },
    data: { dosyaYol: yeniYol, dosyaAd: gelenAd, dosyaBoyut: yazilan },
  });
  // Yeni dosya bağlandıktan sonra eskisi diskten silinir
  if (dugum.dosyaYol && dugum.dosyaYol !== yeniYol) await dosyaSil(dugum.dosyaYol);

  denetim("etkinlik.pdfYukle", kim, { dugumId: id, boyut: yazilan, ad: gelenAd });
  etkinlikTazele();
  return NextResponse.json({ tamam: true, boyut: yazilan, ad: gelenAd });
}

/** x-dosya-adi başlığı URL kodlu gelir (Türkçe karakterler için) */
function cozAd(ham: string | null): string {
  if (!ham) return "etkinlik.pdf";
  try {
    return decodeURIComponent(ham);
  } catch {
    return ham;
  }
}
