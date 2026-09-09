"use server";

/* ═══════════════════════════════════════════════════════════════
   Etkinlikler — PDF arşivi ve klasör ağacı (yalnız yönetici).

   Kullanıcı sistemine BAĞLI DEĞİLDİR: ziyaretçi oturum açmadan yayındaki
   klasörleri gezer, PDF'leri açar/indirir. Yönetim "etkinlik:yonet"
   yetkisiyle korunur (bkz. lib/yetki.ts).

   Klasör de PDF de aynı tabloda bir düğümdür; bu yüzden yeniden
   adlandırma, taşıma, sıralama ve silme ikisi için ORTAK eylemlerdir.

   PDF ve kapak dosyaları public DIŞI dizinde saklanır
   (dosya-saklama.ts → etkinlik/<dugumId>/…) ve
   /api/etkinlik/pdf/[id] · /api/etkinlik/kapak/[id] üzerinden sunulur.

   SİLME ÖZYİNELEMELİDİR: kendine dönük FK'de cascade yoktur (SQL Server
   döngüsel cascade'i reddeder), alt ağaç burada tek işlemde silinir.
   ═══════════════════════════════════════════════════════════════ */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { denetim } from "@/lib/log";
import {
  EtkinlikAdSemasi,
  EtkinlikDurumSemasi,
  EtkinlikPdfSemasi,
  EtkinlikYonSemasi,
} from "@/lib/dogrulama";
import { dosyaSakla, dosyaSil, klasorSil, type SaklananDosya } from "@/lib/dosya-saklama";
import {
  altAgac,
  altindaMi,
  dugumDerinligi,
  dugumleriSirala,
  etkinlikKlasoru,
  ETKINLIK_KAPAK_GRUPLARI,
  ETKINLIK_PDF_GRUPLARI,
  type AgacDugumu,
} from "@/lib/etkinlik";
import { ETKINLIK_MAX_DERINLIK } from "@/lib/sabitler";
import { agaciGetir, benzersizDugumSlug, sonrakiSira } from "@/lib/etkinlik-sunucu";
import { oturumGerekli, hataMetni, type EylemSonuc } from "./yardimci";

type DugumSonuc = EylemSonuc & { id?: string };

/** Public sayfalar ISR ile önbelleklenir; mutasyondan sonra tazelenir.
    Klasör adresleri iç içe olduğu için tüm alt yol tazelenir. */
function etkinlikTazele() {
  revalidatePath("/admin/etkinlikler");
  revalidatePath("/etkinlikler");
  revalidatePath("/etkinlikler/[[...yol]]", "page");
  revalidatePath("/sitemap.xml");
}

/** Yalnız PDF yüklenebilir: doc grubu .doc/.docx'i de kapsar, burada dışlanır */
function pdfMi(dosya: File): boolean {
  return (
    (dosya.type || "").toLowerCase() === "application/pdf" &&
    dosya.name.toLowerCase().endsWith(".pdf")
  );
}

/* ── Klasör ───────────────────────────────────────────────── */

export async function klasorEkle(ustId: string | null, ad: string): Promise<DugumSonuc> {
  try {
    const kim = await oturumGerekli("admin");
    const temizAd = EtkinlikAdSemasi.parse(ad);

    if (ustId) {
      const ust = await prisma.etkinlikDugum.findUnique({
        where: { id: ustId },
        select: { id: true, tur: true },
      });
      if (!ust) return { hata: "Üst klasör bulunamadı." };
      if (ust.tur !== "klasor") return { hata: "PDF'in içine klasör açılamaz." };

      const agac = await agaciGetir();
      if (dugumDerinligi(agac, ustId) >= ETKINLIK_MAX_DERINLIK) {
        return { hata: `Klasörler en çok ${ETKINLIK_MAX_DERINLIK} kademe iç içe olabilir.` };
      }
    }

    const dugum = await prisma.etkinlikDugum.create({
      data: {
        ustId,
        tur: "klasor",
        ad: temizAd,
        slug: await benzersizDugumSlug(temizAd, ustId),
        sira: await sonrakiSira(ustId),
        durum: "yayinda",
      },
      select: { id: true },
    });

    denetim("etkinlik.klasorEkle", kim, { dugumId: dugum.id, ustId, ad: temizAd });
    etkinlikTazele();
    return { tamam: true, id: dugum.id };
  } catch (e) {
    return { hata: hataMetni(e, "klasorEkle") };
  }
}

/* ── PDF etkinliği ────────────────────────────────────────── */

export async function pdfEkle(formData: FormData): Promise<DugumSonuc> {
  let pdf: SaklananDosya | null = null;
  let kapak: SaklananDosya | null = null;
  let dugumId = "";
  try {
    const kim = await oturumGerekli("admin");
    const veri = EtkinlikPdfSemasi.parse({
      ad: formData.get("ad"),
      durum: formData.get("durum") || "taslak",
    });
    const ustId = String(formData.get("ustId") ?? "") || null;

    if (ustId) {
      const ust = await prisma.etkinlikDugum.findUnique({
        where: { id: ustId },
        select: { tur: true },
      });
      if (!ust) return { hata: "Klasör bulunamadı." };
      if (ust.tur !== "klasor") return { hata: "PDF yalnız klasörün içine eklenir." };
    }

    const dosya = formData.get("pdf");
    if (!(dosya instanceof File) || dosya.size === 0) return { hata: "PDF dosyası seçin." };
    if (!pdfMi(dosya)) return { hata: "Yalnız PDF dosyası yüklenebilir." };

    const dugum = await prisma.etkinlikDugum.create({
      data: {
        ustId,
        tur: "pdf",
        ad: veri.ad,
        slug: await benzersizDugumSlug(veri.ad, ustId),
        sira: await sonrakiSira(ustId),
        durum: veri.durum,
      },
      select: { id: true },
    });
    dugumId = dugum.id;

    // Dosyalar kayıt oluştuktan sonra saklanır (klasör adı kimliğe bağlı)
    pdf = await dosyaSakla(etkinlikKlasoru(dugum.id), "dosya", dosya, ETKINLIK_PDF_GRUPLARI);
    const kapakDosyasi = formData.get("kapak");
    if (kapakDosyasi instanceof File && kapakDosyasi.size > 0) {
      kapak = await dosyaSakla(
        etkinlikKlasoru(dugum.id),
        "kapak",
        kapakDosyasi,
        ETKINLIK_KAPAK_GRUPLARI
      );
    }

    await prisma.etkinlikDugum.update({
      where: { id: dugum.id },
      data: {
        dosyaYol: pdf.yol,
        dosyaAd: pdf.ad,
        dosyaBoyut: pdf.boyut,
        ...(kapak ? { kapakYol: kapak.yol, kapakTur: kapak.tur } : {}),
      },
    });

    denetim("etkinlik.pdfEkle", kim, { dugumId: dugum.id, ustId, ad: veri.ad, durum: veri.durum });
    etkinlikTazele();
    return { tamam: true, id: dugum.id };
  } catch (e) {
    // Kısmi kalıntı bırakma
    if (dugumId) {
      await prisma.etkinlikDugum.delete({ where: { id: dugumId } }).catch(() => {});
      await klasorSil(etkinlikKlasoru(dugumId));
    }
    return { hata: hataMetni(e, "pdfEkle") };
  }
}

/** Başlık / durum düzenleme + isteğe bağlı PDF ve kapak değiştirme */
export async function pdfGuncelle(formData: FormData): Promise<DugumSonuc> {
  let yeniPdf: SaklananDosya | null = null;
  let yeniKapak: SaklananDosya | null = null;
  try {
    const kim = await oturumGerekli("admin");
    const id = String(formData.get("id") ?? "");
    if (!id) return { hata: "Etkinlik bulunamadı." };

    const mevcut = await prisma.etkinlikDugum.findUnique({
      where: { id },
      select: { id: true, tur: true, ustId: true, dosyaYol: true, kapakYol: true },
    });
    if (!mevcut) return { hata: "Etkinlik bulunamadı." };
    if (mevcut.tur !== "pdf") return { hata: "Bu kayıt bir PDF etkinliği değil." };

    const veri = EtkinlikPdfSemasi.parse({
      ad: formData.get("ad"),
      durum: formData.get("durum") || "taslak",
    });

    const dosya = formData.get("pdf");
    if (dosya instanceof File && dosya.size > 0) {
      if (!pdfMi(dosya)) return { hata: "Yalnız PDF dosyası yüklenebilir." };
      yeniPdf = await dosyaSakla(etkinlikKlasoru(id), "dosya", dosya, ETKINLIK_PDF_GRUPLARI);
    }
    const kapakDosyasi = formData.get("kapak");
    if (kapakDosyasi instanceof File && kapakDosyasi.size > 0) {
      yeniKapak = await dosyaSakla(
        etkinlikKlasoru(id),
        "kapak",
        kapakDosyasi,
        ETKINLIK_KAPAK_GRUPLARI
      );
    }

    await prisma.etkinlikDugum.update({
      where: { id },
      data: {
        ad: veri.ad,
        durum: veri.durum,
        slug: await benzersizDugumSlug(veri.ad, mevcut.ustId, id),
        ...(yeniPdf
          ? { dosyaYol: yeniPdf.yol, dosyaAd: yeniPdf.ad, dosyaBoyut: yeniPdf.boyut }
          : {}),
        ...(yeniKapak ? { kapakYol: yeniKapak.yol, kapakTur: yeniKapak.tur } : {}),
      },
    });

    // Yenisi yerleştiyse eskisi diskten silinir
    if (yeniPdf && mevcut.dosyaYol) await dosyaSil(mevcut.dosyaYol);
    if (yeniKapak && mevcut.kapakYol) await dosyaSil(mevcut.kapakYol);

    denetim("etkinlik.pdfGuncelle", kim, {
      dugumId: id,
      ad: veri.ad,
      durum: veri.durum,
      pdfDegisti: !!yeniPdf,
    });
    etkinlikTazele();
    return { tamam: true, id };
  } catch (e) {
    if (yeniPdf) await dosyaSil(yeniPdf.yol);
    if (yeniKapak) await dosyaSil(yeniKapak.yol);
    return { hata: hataMetni(e, "pdfGuncelle") };
  }
}

/** Ön izleme görselini kaldırır (PDF ve kayıt korunur) */
export async function kapakSil(id: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("admin");
    const dugum = await prisma.etkinlikDugum.findUnique({
      where: { id },
      select: { kapakYol: true },
    });
    if (!dugum) return { hata: "Etkinlik bulunamadı." };
    if (!dugum.kapakYol) return { tamam: true };

    await prisma.etkinlikDugum.update({
      where: { id },
      data: { kapakYol: null, kapakTur: "" },
    });
    await dosyaSil(dugum.kapakYol);

    denetim("etkinlik.kapakSil", kim, { dugumId: id });
    etkinlikTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "kapakSil") };
  }
}

/* ── Ortak düğüm işlemleri ────────────────────────────────── */

export async function dugumYenidenAdlandir(id: string, ad: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("admin");
    const temizAd = EtkinlikAdSemasi.parse(ad);
    const mevcut = await prisma.etkinlikDugum.findUnique({
      where: { id },
      select: { ustId: true, tur: true },
    });
    if (!mevcut) return { hata: "Kayıt bulunamadı." };

    await prisma.etkinlikDugum.update({
      where: { id },
      data: { ad: temizAd, slug: await benzersizDugumSlug(temizAd, mevcut.ustId, id) },
    });

    denetim("etkinlik.yenidenAdlandir", kim, { dugumId: id, tur: mevcut.tur, ad: temizAd });
    etkinlikTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "dugumYenidenAdlandir") };
  }
}

export async function durumDegistir(id: string, durum: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("admin");
    const yeni = EtkinlikDurumSemasi.parse(durum);
    const mevcut = await prisma.etkinlikDugum.findUnique({
      where: { id },
      select: { tur: true },
    });
    if (!mevcut) return { hata: "Kayıt bulunamadı." };

    await prisma.etkinlikDugum.update({ where: { id }, data: { durum: yeni } });

    denetim("etkinlik.durum", kim, { dugumId: id, tur: mevcut.tur, durum: yeni });
    etkinlikTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "durumDegistir") };
  }
}

/**
 * Düğümü başka bir klasöre taşır (hedefId null → köke).
 * Klasör KENDİ ALT AĞACINA taşınamaz; taşınsaydı o dal ağaçtan kopar ve
 * hiçbir yerden erişilemez hâle gelirdi.
 */
export async function dugumTasi(id: string, hedefId: string | null): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("admin");
    const agac = await agaciGetir();
    const dugum = agac.find((d) => d.id === id);
    if (!dugum) return { hata: "Kayıt bulunamadı." };
    if ((dugum.ustId ?? null) === hedefId) return { tamam: true }; // zaten orada

    if (hedefId) {
      const hedef = agac.find((d) => d.id === hedefId);
      if (!hedef) return { hata: "Hedef klasör bulunamadı." };
      if (hedef.tur !== "klasor") return { hata: "Yalnız klasörün içine taşınabilir." };
      if (altindaMi(agac as AgacDugumu[], id, hedefId)) {
        return { hata: "Bir klasör kendi içine taşınamaz." };
      }
      // Taşınan dalın en derin ucu sınırı aşmasın
      const dalDerinligi =
        1 +
        Math.max(
          0,
          ...altAgac(agac as AgacDugumu[], id).map(
            (a) => dugumDerinligi(agac, a.id) - dugumDerinligi(agac, id)
          )
        );
      if (dugumDerinligi(agac, hedefId) + dalDerinligi > ETKINLIK_MAX_DERINLIK) {
        return { hata: `Klasörler en çok ${ETKINLIK_MAX_DERINLIK} kademe iç içe olabilir.` };
      }
    }

    await prisma.etkinlikDugum.update({
      where: { id },
      data: {
        ustId: hedefId,
        // Yeni kardeşler arasında ad çakışabilir; slug orada benzersizlenir
        slug: await benzersizDugumSlug(dugum.ad, hedefId, id),
        sira: await sonrakiSira(hedefId),
      },
    });

    denetim("etkinlik.tasi", kim, { dugumId: id, eskiUst: dugum.ustId, yeniUst: hedefId });
    etkinlikTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "dugumTasi") };
  }
}

/**
 * Sırayı bir basamak yukarı/aşağı taşır.
 *
 * `sira` eşit (ör. hepsi 0) olduğunda takas görünürde hiçbir şey
 * değiştirmez; bu yüzden önce kardeşler görünen sırayla 1..n
 * numaralandırılır, sonra komşuyla takas edilir. Klasörler ve PDF'ler ayrı
 * kümelerdir (liste klasörleri hep üstte gösterir), komşu AYNI TÜRDEN
 * seçilir — yoksa düğme bozuk sanılır.
 */
export async function dugumSirala(id: string, yon: string): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("admin");
    const hedefYon = EtkinlikYonSemasi.parse(yon);

    const dugum = await prisma.etkinlikDugum.findUnique({
      where: { id },
      select: { ustId: true, tur: true },
    });
    if (!dugum) return { hata: "Kayıt bulunamadı." };

    const kardesler = dugumleriSirala(
      await prisma.etkinlikDugum.findMany({
        where: { ustId: dugum.ustId },
        select: { id: true, tur: true, ad: true, sira: true },
      })
    );
    const ayniTur = kardesler.filter((k) => k.tur === dugum.tur);
    const indeks = ayniTur.findIndex((k) => k.id === id);
    const komsu = hedefYon === "yukari" ? indeks - 1 : indeks + 1;
    if (indeks < 0 || komsu < 0 || komsu >= ayniTur.length) return { tamam: true }; // uçta

    const yeniDizilim = ayniTur.map((k) => k.id);
    [yeniDizilim[indeks], yeniDizilim[komsu]] = [yeniDizilim[komsu], yeniDizilim[indeks]];

    // Diğer tür de yeniden numaralanır ki sıralar tek aralıkta kalsın
    const digerTur = kardesler.filter((k) => k.tur !== dugum.tur).map((k) => k.id);
    const tumSira = dugum.tur === "klasor" ? [...yeniDizilim, ...digerTur] : [...digerTur, ...yeniDizilim];

    await prisma.$transaction(
      tumSira.map((dugumId, i) =>
        prisma.etkinlikDugum.update({ where: { id: dugumId }, data: { sira: i + 1 } })
      )
    );

    denetim("etkinlik.sirala", kim, { dugumId: id, yon: hedefYon });
    etkinlikTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "dugumSirala") };
  }
}

/**
 * Düğümü ve (klasörse) TÜM ALT AĞACINI siler.
 *
 * Dolu klasörde çağıran taraf ayrıca onay almalıdır; burada da emniyet
 * kemeri var: `iceriginiDeOnayla` false ise dolu klasör silinmez.
 * Silme, yapraklardan köke doğru tek işlemde yapılır (FK cascade yok).
 */
export async function dugumSil(id: string, iceriginiDeOnayla = false): Promise<EylemSonuc> {
  try {
    const kim = await oturumGerekli("admin");
    const agac = await agaciGetir();
    const dugum = agac.find((d) => d.id === id);
    if (!dugum) return { hata: "Kayıt bulunamadı." };

    const alt = altAgac(agac as AgacDugumu[], id);
    if (alt.length && !iceriginiDeOnayla) {
      return {
        hata: `Bu klasörün içinde ${alt.length} kayıt var. Silmek için içeriğin de silineceğini onaylayın.`,
      };
    }

    /* Yapraktan köke: FK'de cascade olmadığı için çocuk önce gitmeli.
       altAgac genişlik-öncelikli döndüğü için ters çevirmek yeterlidir. */
    const silinecek = [...alt].reverse();
    await prisma.$transaction([
      ...silinecek.map((d) => prisma.etkinlikDugum.delete({ where: { id: d.id } })),
      prisma.etkinlikDugum.delete({ where: { id } }),
    ]);

    // Dosyalar DB temizlendikten sonra silinir (yarıda kalırsa kayıt tutarlı kalır)
    for (const d of [...alt, dugum]) await klasorSil(etkinlikKlasoru(d.id));

    denetim("etkinlik.sil", kim, {
      dugumId: id,
      tur: dugum.tur,
      ad: dugum.ad,
      altKayit: alt.length,
    });
    etkinlikTazele();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "dugumSil") };
  }
}
