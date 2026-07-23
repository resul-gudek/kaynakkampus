import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  bigBlueButtonKatilimAdresi,
  dersOturumuErisimi,
  katilimPenceresi,
} from "@/lib/canli-ders";
import { denetim, logcu } from "@/lib/log";

const log = logcu("canli-ders-katilim");

function hataYanit(request: NextRequest, oturumId: string, mesaj: string, durum = 400) {
  const adres = new URL(`/canli-ders/${oturumId}`, request.url);
  adres.searchParams.set("hata", mesaj);
  return NextResponse.redirect(adres, { status: durum === 401 ? 303 : 302 });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const oturum = await auth();
    if (!oturum?.user?.id || !oturum.user.rol) {
      return NextResponse.redirect(new URL("/giris", request.url));
    }
    const kullanici = await prisma.kullanici.findFirst({
      where: { id: oturum.user.id, aktif: true },
      select: { id: true, ad: true, rol: true },
    });
    if (!kullanici) return NextResponse.redirect(new URL("/giris", request.url));

    const erisim = await dersOturumuErisimi(id, kullanici.id, kullanici.rol);
    if (!erisim) return hataYanit(request, id, "Bu derse katılım yetkiniz yok.", 401);
    if (erisim.oturum.durum === "iptal") return hataYanit(request, id, "Bu ders iptal edildi.");

    const pencere = katilimPenceresi(
      erisim.oturum.baslangic,
      erisim.oturum.sure,
      erisim.moderator
    );
    if (!pencere.acik) {
      return hataYanit(
        request,
        id,
        pencere.erken ? "Derse katılım henüz açılmadı." : "Derse katılım süresi sona erdi."
      );
    }

    const uygulamaTabani = (process.env.UYGULAMA_URL?.trim() || request.nextUrl.origin).replace(/\/+$/, "");
    const katilimAdresi = await bigBlueButtonKatilimAdresi({
      odaId: erisim.oturum.saglayiciOdaId,
      baslik: erisim.oturum.baslik,
      sure: erisim.oturum.sure,
      kullaniciId: kullanici.id,
      kullaniciAd: kullanici.ad,
      moderator: erisim.moderator,
      cikisAdresi: `${uygulamaTabani}/canli-ders/${id}`,
    });

    await prisma.$transaction(async (tx) => {
      if (!erisim.moderator) {
        await tx.dersKatilim.upsert({
          where: { oturumId_kullaniciId: { oturumId: id, kullaniciId: kullanici.id } },
          create: {
            oturumId: id,
            kullaniciId: kullanici.id,
            ilkKatilma: new Date(),
            durum: "katildi",
          },
          update: {
            durum: "katildi",
          },
        });
      }
      if (erisim.oturum.durum === "planlandi") {
        await tx.dersOturumu.update({ where: { id }, data: { durum: "canli" } });
      }
    });
    denetim("sinif.derse_katil", kullanici, { oturumId: id, moderator: erisim.moderator });
    return NextResponse.redirect(katilimAdresi);
  } catch (e) {
    log.error({ oturumId: id, hata: e instanceof Error ? e.message : String(e) }, "katılım hatası");
    return hataYanit(
      request,
      id,
      e instanceof Error ? e.message : "Canlı ders odası açılamadı."
    );
  }
}
