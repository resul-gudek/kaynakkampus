import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canliDersKatilimJetonu,
  dersOturumuErisimi,
  katilimPenceresi,
} from "@/lib/canli-ders";
import { denetim, logcu } from "@/lib/log";

const log = logcu("canli-ders-katilim");

function hata(mesaj: string, durum: number) {
  return NextResponse.json({ hata: mesaj }, { status: durum });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const oturum = await auth();
    if (!oturum?.user?.id || !oturum.user.rol) {
      return hata("Oturumunuz sona erdi. Lütfen yeniden giriş yapın.", 401);
    }
    const kullanici = await prisma.kullanici.findFirst({
      where: { id: oturum.user.id, aktif: true },
      select: { id: true, ad: true, rol: true },
    });
    if (!kullanici) return hata("Oturumunuz sona erdi. Lütfen yeniden giriş yapın.", 401);

    const erisim = await dersOturumuErisimi(id, kullanici.id, kullanici.rol);
    if (!erisim) return hata("Bu derse katılım yetkiniz yok.", 403);
    if (erisim.oturum.durum === "iptal") return hata("Bu ders iptal edildi.", 409);

    const pencere = katilimPenceresi(
      erisim.oturum.baslangic,
      erisim.oturum.sure,
      erisim.moderator
    );
    if (!pencere.acik) {
      return hata(
        pencere.erken ? "Derse katılım henüz açılmadı." : "Derse katılım süresi sona erdi.",
        403
      );
    }

    const jeton = await canliDersKatilimJetonu({
      odaId: erisim.oturum.saglayiciOdaId,
      kullaniciId: kullanici.id,
      kullaniciAd: kullanici.ad,
      moderator: erisim.moderator,
      gecerlilikBitis: pencere.kapanis,
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
        // İlk katılımda ders "canlı"ya geçer; gerçek başlangıç anı kaydedilir
        await tx.dersOturumu.update({
          where: { id },
          data: { durum: "canli", canliBaslangic: new Date() },
        });
      }
    });
    denetim("sinif.derse_katil", kullanici, { oturumId: id, moderator: erisim.moderator });
    return NextResponse.json({
      url: jeton.url,
      token: jeton.token,
      moderator: erisim.moderator,
    });
  } catch (e) {
    log.error({ oturumId: id, hata: e instanceof Error ? e.message : String(e) }, "katılım hatası");
    return hata(
      e instanceof Error && e.message.includes("yapılandırılmadı")
        ? e.message
        : "Canlı ders odası açılamadı. Lütfen biraz sonra tekrar deneyin.",
      503
    );
  }
}
