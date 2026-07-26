"use server";

/* ═══════════════════════════════════════════════════════════════
   Video ders notları — yönetim (öğretmen/yönetici) ve öğrenci eylemleri.

   Video DOSYASI bu action'lardan geçmez: kayıt önce meta verisiyle
   oluşturulur, ardından istemci dosyayı /api/video-ders/[id]/yukle
   rotasına akıtır (server action gövde limiti ve bellek tüketimi nedeniyle).
   Kapak görseli ve ekler küçük olduğundan burada saklanır.
   ═══════════════════════════════════════════════════════════════ */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { denetim } from "@/lib/log";
import { tarihNesnesi } from "@/lib/hesap";
import {
  VideoDersSemasi,
  VideoDurumSemasi,
  VideoIlerlemeSemasi,
  VideoNotSemasi,
} from "@/lib/dogrulama";
import { dosyaSakla, dosyaSil, klasorSil, type SaklananDosya } from "@/lib/dosya-saklama";
import {
  EK_GRUPLARI,
  KAPAK_GRUPLARI,
  MAX_EK,
  TAMAMLANMA_ESIGI,
  videoKlasoru,
} from "@/lib/video-ders";
import { videoYayinBildirimi, yonetebilir } from "@/lib/video-ders-sunucu";
import { oturumGerekli, hataMetni, type EylemSonuc } from "./yardimci";

/** Yeni kayıtta istemcinin dosya yüklemek için ihtiyaç duyduğu kimlik döner */
type VideoSonuc = EylemSonuc & { id?: string };

function videolariTazele(videoId?: string) {
  revalidatePath("/video-dersler");
  revalidatePath("/ogrenci/videolar");
  if (videoId) revalidatePath(`/ogrenci/videolar/${videoId}`);
  revalidatePath("/bildirimler");
  revalidatePath("/", "layout"); // üst bardaki okunmamış rozeti
}

/** FormData → VideoDersSemasi girdisi (çoklu alanlar getAll ile toplanır) */
function formVerisi(formData: FormData) {
  return {
    baslik: formData.get("baslik"),
    ders: formData.get("ders"),
    konu: formData.get("konu"),
    ogretmenId: formData.get("ogretmenId"),
    aciklama: formData.get("aciklama"),
    islenenKonular: formData.get("islenenKonular"),
    ogretmenNotu: formData.get("ogretmenNotu"),
    tarih: formData.get("tarih"),
    sure: formData.get("sure") || 0,
    kaynakTur: formData.get("kaynakTur") || "baglanti",
    adres: formData.get("adres"),
    durum: formData.get("durum") || "taslak",
    ogrenciIdler: formData.getAll("ogrenciId").map(String).filter(Boolean),
    sinifIdler: formData.getAll("sinifId").map(String).filter(Boolean),
    gorevler: formData
      .getAll("gorev")
      .map((x) => String(x).trim())
      .filter(Boolean),
  };
}

/**
 * Atama hedeflerini doğrular: koç yalnız kendi öğrencisine ve kendi sınıfına,
 * yönetici herkese atayabilir. Geçersiz hedef sessizce atılmaz, hata döner.
 */
async function hedefleriDogrula(
  kim: { id: string; rol: string },
  ogretmenId: string,
  ogrenciIdler: string[],
  sinifIdler: string[]
): Promise<string | null> {
  if (ogrenciIdler.length) {
    const ogrenciler = await prisma.kullanici.findMany({
      where: { id: { in: ogrenciIdler }, rol: "ogrenci" },
      select: { id: true, kocId: true },
    });
    if (ogrenciler.length !== ogrenciIdler.length) return "Seçilen öğrencilerden biri bulunamadı.";
    if (kim.rol === "koc" && ogrenciler.some((o) => o.kocId !== kim.id)) {
      return "Yalnız kendi öğrencilerinize video atayabilirsiniz.";
    }
  }
  if (sinifIdler.length) {
    const siniflar = await prisma.onlineSinif.findMany({
      where: { id: { in: sinifIdler } },
      select: { id: true, ogretmenId: true },
    });
    if (siniflar.length !== sinifIdler.length) return "Seçilen sınıflardan biri bulunamadı.";
    if (kim.rol === "koc" && siniflar.some((s) => s.ogretmenId !== kim.id)) {
      return "Yalnız kendi sınıflarınıza video atayabilirsiniz.";
    }
  }
  // Yönetici başka bir öğretmen adına yükleyebilir; kimlik gerçekten öğretmen mi?
  if (kim.rol !== "koc") {
    const ogretmen = await prisma.kullanici.findUnique({
      where: { id: ogretmenId },
      select: { rol: true, aktif: true },
    });
    if (!ogretmen || ogretmen.rol !== "koc") return "Geçerli bir öğretmen seçin.";
  }
  return null;
}

export async function videoDersEkle(formData: FormData): Promise<VideoSonuc> {
  const yazilanlar: SaklananDosya[] = [];
  let videoId = "";
  let baglandi = false; // dosyalar kayda bağlandı mı (bkz. catch)
  try {
    const kim = await oturumGerekli("koc", "admin");
    const veri = VideoDersSemasi.parse(formVerisi(formData));
    // Koç daima kendi adına yükler; öğretmen seçimi yalnız yöneticide vardır.
    const ogretmenId = kim.rol === "koc" ? kim.id : veri.ogretmenId;
    if (!ogretmenId) return { hata: "Öğretmen seçin." };

    const hata = await hedefleriDogrula(kim, ogretmenId, veri.ogrenciIdler, veri.sinifIdler);
    if (hata) return { hata };

    const kayit = await prisma.videoDers.create({
      data: {
        baslik: veri.baslik,
        ders: veri.ders,
        konu: veri.konu,
        ogretmenId,
        olusturanId: kim.id,
        aciklama: veri.aciklama,
        islenenKonular: veri.islenenKonular,
        ogretmenNotu: veri.ogretmenNotu,
        tarih: tarihNesnesi(veri.tarih),
        sure: veri.sure,
        kaynakTur: veri.kaynakTur,
        adres: veri.kaynakTur === "baglanti" ? veri.adres : "",
        durum: veri.durum,
        atamalar: {
          create: [
            ...veri.ogrenciIdler.map((ogrenciId) => ({ ogrenciId })),
            ...veri.sinifIdler.map((sinifId) => ({ sinifId })),
          ],
        },
        gorevler: {
          create: veri.gorevler.map((metin, i) => ({ metin, sira: i + 1 })),
        },
      },
    });
    videoId = kayit.id;

    // Kapak ve ekler kayıt kimliğine bağlı klasöre yazılır
    const dosyaSonuc = await dosyalariEkle(videoId, formData, yazilanlar, 0);
    if (dosyaSonuc.hata) {
      // Yeni kayıt yarım kalmasın: kaydı ve klasörü geri al
      await prisma.videoDers.delete({ where: { id: videoId } });
      await klasorSil(videoKlasoru(videoId));
      return { hata: dosyaSonuc.hata };
    }
    baglandi = true; // bundan sonraki hatada dosyalar silinmez (DB onlara işaret ediyor)

    // Bağlantılı video doğrudan yayına alınabilir; dosya yüklemesi beklenen
    // videoda bildirim yükleme tamamlanınca gönderilir (bkz. yukleme rotası).
    if (kayit.durum === "yayinda" && kayit.kaynakTur === "baglanti") {
      await videoYayinBildirimi(kayit);
    }

    denetim("video.ekle", kim, {
      videoId,
      ogretmenId,
      ders: veri.ders,
      durum: veri.durum,
      kaynakTur: veri.kaynakTur,
      ogrenci: veri.ogrenciIdler.length,
      sinif: veri.sinifIdler.length,
    });
    videolariTazele(videoId);
    return { tamam: true, id: videoId };
  } catch (e) {
    // Dosyalar kayda bağlandıktan sonraki hatada (örn. bildirim) silinmemeli;
    // aksi halde DB'de duran satırlar diskte olmayan dosyayı gösterir.
    if (!baglandi) await Promise.all(yazilanlar.map((d) => dosyaSil(d.yol)));
    return { hata: hataMetni(e, "video.ekle") };
  }
}

export async function videoDersGuncelle(formData: FormData): Promise<VideoSonuc> {
  const yazilanlar: SaklananDosya[] = [];
  let baglandi = false; // dosyalar kayda bağlandı mı (bkz. catch)
  try {
    const kim = await oturumGerekli("koc", "admin");
    const id = String(formData.get("id") ?? "");
    const mevcut = await prisma.videoDers.findUnique({
      where: { id },
      select: {
        id: true,
        ogretmenId: true,
        durum: true,
        kaynakTur: true,
        dosyaYol: true,
        kapakYol: true,
        baslik: true,
        ders: true,
        tarih: true,
        _count: { select: { ekler: true } },
      },
    });
    if (!mevcut) return { hata: "Video bulunamadı." };
    if (!yonetebilir(mevcut, kim)) return { hata: "Bu video üzerinde yetkiniz yok." };

    const veri = VideoDersSemasi.parse(formVerisi(formData));
    const ogretmenId = kim.rol === "koc" ? kim.id : veri.ogretmenId || mevcut.ogretmenId;
    const hata = await hedefleriDogrula(kim, ogretmenId, veri.ogrenciIdler, veri.sinifIdler);
    if (hata) return { hata };

    // Kaynak türü dosyadan bağlantıya çevrildiyse yüklenmiş dosya bırakılmaz
    const dosyaBirakilir = mevcut.kaynakTur === "dosya" && veri.kaynakTur === "baglanti";

    await prisma.$transaction(async (tx) => {
      await tx.videoAtama.deleteMany({ where: { videoId: id } });
      await tx.videoGorev.deleteMany({ where: { videoId: id } });
      await tx.videoDers.update({
        where: { id },
        data: {
          baslik: veri.baslik,
          ders: veri.ders,
          konu: veri.konu,
          ogretmenId,
          aciklama: veri.aciklama,
          islenenKonular: veri.islenenKonular,
          ogretmenNotu: veri.ogretmenNotu,
          tarih: tarihNesnesi(veri.tarih),
          sure: veri.sure,
          kaynakTur: veri.kaynakTur,
          adres: veri.kaynakTur === "baglanti" ? veri.adres : "",
          durum: veri.durum,
          ...(dosyaBirakilir ? { dosyaYol: null, dosyaAd: "", dosyaTur: "", dosyaBoyut: 0 } : {}),
          atamalar: {
            create: [
              ...veri.ogrenciIdler.map((ogrenciId) => ({ ogrenciId })),
              ...veri.sinifIdler.map((sinifId) => ({ sinifId })),
            ],
          },
          gorevler: {
            create: veri.gorevler.map((metin, i) => ({ metin, sira: i + 1 })),
          },
        },
      });
    });
    if (dosyaBirakilir && mevcut.dosyaYol) await dosyaSil(mevcut.dosyaYol);

    const dosyaSonuc = await dosyalariEkle(id, formData, yazilanlar, mevcut._count.ekler);
    if (dosyaSonuc.hata) {
      // Meta veri kaydedildi; yalnız dosya reddedildi — kullanıcıya söylenir
      videolariTazele(id);
      return { hata: dosyaSonuc.hata };
    }
    baglandi = true; // bundan sonraki hatada yeni dosyalar silinmez
    // Yeni kapak bağlandıysa eskisi diskten silinir (kayıt zaten güncellendi)
    if (dosyaSonuc.kapakDegisti && mevcut.kapakYol) await dosyaSil(mevcut.kapakYol);

    if (veri.durum === "yayinda" && mevcut.durum !== "yayinda") {
      await videoYayinBildirimi({
        id,
        baslik: veri.baslik,
        ders: veri.ders,
        tarih: tarihNesnesi(veri.tarih),
      });
    }

    denetim("video.guncelle", kim, { videoId: id, durum: veri.durum, eskiDurum: mevcut.durum });
    videolariTazele(id);
    return { tamam: true, id };
  } catch (e) {
    if (!baglandi) await Promise.all(yazilanlar.map((d) => dosyaSil(d.yol)));
    return { hata: hataMetni(e, "video.guncelle") };
  }
}

/**
 * Kapak görseli ve ekleri diske yazıp kayda bağlar.
 * hata dolu ise işlem başarısızdır; yazılanlar geri alma için toplanır.
 * kapakDegisti, çağıranın eski kapağı silebilmesi için döner.
 */
async function dosyalariEkle(
  videoId: string,
  formData: FormData,
  yazilanlar: SaklananDosya[],
  mevcutEkAdet: number
): Promise<{ hata?: string; kapakDegisti: boolean }> {
  const klasor = videoKlasoru(videoId);
  const kapak = formData.get("kapak");
  const ekler = formData.getAll("ek").filter((x): x is File => x instanceof File && x.size > 0);
  let kapakDegisti = false;

  if (mevcutEkAdet + ekler.length > MAX_EK) {
    return { hata: `Bir videoya en fazla ${MAX_EK} dosya eklenebilir.`, kapakDegisti };
  }

  try {
    if (kapak instanceof File && kapak.size > 0) {
      const saklanan = await dosyaSakla(klasor, "kapak", kapak, KAPAK_GRUPLARI);
      yazilanlar.push(saklanan);
      await prisma.videoDers.update({
        where: { id: videoId },
        data: { kapakYol: saklanan.yol, kapakTur: saklanan.tur },
      });
      kapakDegisti = true;
    }
    for (const dosya of ekler) {
      const saklanan = await dosyaSakla(klasor, "ek", dosya, EK_GRUPLARI);
      yazilanlar.push(saklanan);
      await prisma.videoEk.create({
        data: {
          videoId,
          ad: saklanan.ad,
          yol: saklanan.yol,
          tur: saklanan.tur,
          boyut: saklanan.boyut,
        },
      });
    }
  } catch (e) {
    await Promise.all(yazilanlar.map((d) => dosyaSil(d.yol)));
    yazilanlar.length = 0;
    return { hata: e instanceof Error ? e.message : "Dosya yüklenemedi.", kapakDegisti: false };
  }
  return { kapakDegisti };
}

export async function videoDersDurum(id: string, durum: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "admin");
    const yeni = VideoDurumSemasi.parse(durum);
    const video = await prisma.videoDers.findUnique({
      where: { id },
      select: {
        id: true,
        ogretmenId: true,
        durum: true,
        baslik: true,
        ders: true,
        tarih: true,
        kaynakTur: true,
        adres: true,
        dosyaYol: true,
      },
    });
    if (!video) return { hata: "Video bulunamadı." };
    if (!yonetebilir(video, kim)) return { hata: "Bu video üzerinde yetkiniz yok." };
    if (yeni === "yayinda") {
      const kaynakVar = video.kaynakTur === "dosya" ? !!video.dosyaYol : video.adres !== "";
      if (!kaynakVar) return { hata: "Yayına almak için önce video dosyası veya bağlantısı ekleyin." };
    }

    await prisma.videoDers.update({ where: { id }, data: { durum: yeni } });
    if (yeni === "yayinda" && video.durum !== "yayinda") {
      await videoYayinBildirimi(video);
    }
    denetim("video.durum", kim, { videoId: id, eski: video.durum, yeni });
    videolariTazele(id);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "video.durum") };
  }
}

export async function videoDersSil(id: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "admin");
    const video = await prisma.videoDers.findUnique({
      where: { id },
      select: { id: true, ogretmenId: true, baslik: true },
    });
    if (!video) return { hata: "Video bulunamadı." };
    if (!yonetebilir(video, kim)) return { hata: "Bu video üzerinde yetkiniz yok." };

    // Atama/görev/ek/izleme satırları FK cascade ile gider
    await prisma.videoDers.delete({ where: { id } });
    await klasorSil(videoKlasoru(id)); // video dosyası, kapak ve ekler
    denetim("video.sil", kim, { videoId: id, baslik: video.baslik });
    videolariTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "video.sil") };
  }
}

export async function videoEkSil(ekId: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("koc", "admin");
    const ek = await prisma.videoEk.findUnique({
      where: { id: ekId },
      include: { video: { select: { id: true, ogretmenId: true } } },
    });
    if (!ek) return { hata: "Dosya bulunamadı." };
    if (!yonetebilir(ek.video, kim)) return { hata: "Bu dosya üzerinde yetkiniz yok." };

    await prisma.videoEk.delete({ where: { id: ekId } });
    await dosyaSil(ek.yol);
    denetim("video.ekSil", kim, { videoId: ek.video.id, ekId });
    videolariTazele(ek.video.id);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "video.ekSil") };
  }
}

/* ── Öğrenci eylemleri ─────────────────────────────────────── */

/** Öğrencinin bu videoya erişimi var mı (atanmış + taslak değil) */
async function ogrenciErisimi(videoId: string, ogrenciId: string) {
  const atanmis = await prisma.videoDers.findFirst({
    where: {
      id: videoId,
      durum: { in: ["yayinda", "gizli"] },
      atamalar: {
        some: {
          OR: [
            { ogrenciId },
            { sinif: { uyeler: { some: { kullaniciId: ogrenciId } } } },
          ],
        },
      },
    },
    select: { id: true },
  });
  return atanmis;
}

/**
 * Oynatıcıdan gelen ilerleme. Eşiği geçen izleme "tamamlandi" sayılır;
 * tamamlanmış video geri "izleniyor"a düşmez (öğrenci tekrar izleyebilir).
 */
export async function videoIlerlemeKaydet(girdi: unknown): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("ogrenci");
    const veri = VideoIlerlemeSemasi.parse(girdi);
    if (!(await ogrenciErisimi(veri.videoId, kim.id))) return { hata: "Video bulunamadı." };

    const mevcut = await prisma.videoIzleme.findUnique({
      where: { videoId_ogrenciId: { videoId: veri.videoId, ogrenciId: kim.id } },
      select: { durum: true, yuzde: true },
    });
    const tamam = mevcut?.durum === "tamamlandi" || veri.yuzde >= TAMAMLANMA_ESIGI;
    const simdi = new Date();
    const ortak = {
      saniye: veri.saniye,
      yuzde: Math.max(veri.yuzde, mevcut?.yuzde ?? 0),
      durum: tamam ? "tamamlandi" : "izleniyor",
      sonIzleme: simdi,
    };
    await prisma.videoIzleme.upsert({
      where: { videoId_ogrenciId: { videoId: veri.videoId, ogrenciId: kim.id } },
      create: { videoId: veri.videoId, ogrenciId: kim.id, ilkIzleme: simdi, ...ortak },
      update: ortak,
    });
    // İlerleme çok sık gelir; sayfa yeniden doğrulanmaz (istemci durumu bilir).
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "video.ilerleme") };
  }
}

/** Öğrenci videoyu elle tamamlandı/izlenmedi olarak işaretler
    (gömülü YouTube/Vimeo'da ilerleme okunamadığı için gerekli). */
export async function videoTamamlandi(videoId: string, tamam: boolean): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("ogrenci");
    if (!(await ogrenciErisimi(videoId, kim.id))) return { hata: "Video bulunamadı." };

    const simdi = new Date();
    const veri = tamam
      ? { durum: "tamamlandi", yuzde: 100, sonIzleme: simdi }
      : { durum: "izlenmedi", yuzde: 0, saniye: 0 };
    await prisma.videoIzleme.upsert({
      where: { videoId_ogrenciId: { videoId, ogrenciId: kim.id } },
      create: { videoId, ogrenciId: kim.id, ilkIzleme: tamam ? simdi : null, ...veri },
      update: veri,
    });
    videolariTazele(videoId);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "video.tamamlandi") };
  }
}

/** Öğrencinin kişisel notu — yalnız kendisi görür, öğretmene gösterilmez */
export async function videoNotKaydet(girdi: unknown): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("ogrenci");
    const veri = VideoNotSemasi.parse(girdi);
    if (!(await ogrenciErisimi(veri.videoId, kim.id))) return { hata: "Video bulunamadı." };

    await prisma.videoIzleme.upsert({
      where: { videoId_ogrenciId: { videoId: veri.videoId, ogrenciId: kim.id } },
      create: { videoId: veri.videoId, ogrenciId: kim.id, notlar: veri.notlar },
      update: { notlar: veri.notlar },
    });
    revalidatePath(`/ogrenci/videolar/${veri.videoId}`);
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "video.not") };
  }
}
