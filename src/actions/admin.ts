"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { kullaniciAdiNormalize, telefonDuzelt } from "@/lib/hesap";
import { KocEkleSemasi, KullaniciEkleSemasi } from "@/lib/dogrulama";
import { egitmenMi, type EgitmenRol } from "@/lib/sabitler";
import { ROL_ETIKETLERI } from "@/lib/navigasyon";
import { hosgeldinMailiKuyrukla } from "@/lib/mail";
import { denetim } from "@/lib/log";
import { oturumGerekli, hataMetni, type EylemSonuc } from "./yardimci";

function adminSayfalariniYenile() {
  revalidatePath("/admin");
  revalidatePath("/admin/koclar");
  revalidatePath("/admin/ogretmenler");
  revalidatePath("/admin/kullanicilar");
}

/** Hedef eğitmeni doğrular — koç eylemi öğretmeni, öğretmen eylemi koçu etkileyemez.
    beklenen verilmezse iki eğitmen rolünden biri olması yeterlidir. */
async function egitmenGetir(id: string, beklenen?: EgitmenRol) {
  const k = await prisma.kullanici.findUnique({ where: { id } });
  if (!k || !egitmenMi(k.rol)) return null;
  if (beklenen && k.rol !== beklenen) return null;
  return k;
}

/** Admin kullanıcı listesinden yönetici, koç, öğretmen, öğrenci veya veli hesabı oluşturur. */
export async function kullaniciEkle(girdi: unknown): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const veri = KullaniciEkleSemasi.parse(girdi);
    const kullanici = kullaniciAdiNormalize(veri.kullanici);

    const mevcut = await prisma.kullanici.findUnique({ where: { kullanici } });
    if (mevcut) return { hata: "Bu kullanıcı adı zaten kayıtlı." };

    // Öğrencinin atandığı eğitmen koç ya da öğretmen olabilir (ayrı roller, ortak bağ)
    if (veri.rol === "ogrenci" && veri.kocId) {
      const koc = await prisma.kullanici.findUnique({
        where: { id: veri.kocId },
        select: { rol: true, aktif: true },
      });
      if (!koc || !egitmenMi(koc.rol)) return { hata: "Seçilen koç/öğretmen bulunamadı." };
      if (!koc.aktif) return { hata: "Pasif bir koça/öğretmene öğrenci atanamaz." };
    }

    if (veri.rol === "ogrenci" && veri.veliId) {
      const veli = await prisma.kullanici.findUnique({
        where: { id: veri.veliId },
        select: { rol: true, aktif: true },
      });
      if (!veli || veli.rol !== "veli") return { hata: "Seçilen veli bulunamadı." };
      if (!veli.aktif) return { hata: "Pasif bir veliye öğrenci bağlanamaz." };
    }

    const yeni = await prisma.kullanici.create({
      data: {
        rol: veri.rol,
        ad: veri.ad,
        kullanici,
        sifreHash: bcrypt.hashSync(veri.sifre, 10),
        eposta: veri.eposta,
        ...(egitmenMi(veri.rol) && { brans: veri.brans }),
        ...(veri.rol === "ogrenci" && {
          sinif: veri.sinif,
          hedef: veri.hedef,
          kocId: veri.kocId || null,
          veliId: veri.veliId || null,
          telefon: telefonDuzelt(veri.telefon),
          veliTelefon: telefonDuzelt(veri.veliTelefon),
        }),
      },
    });

    await hosgeldinMailiKuyrukla(yeni);
    denetim("admin.kullaniciEkle", admin, {
      kullaniciId: yeni.id,
      kullanici,
      rol: veri.rol,
      kocId: veri.rol === "ogrenci" ? veri.kocId || null : undefined,
      veliId: veri.rol === "ogrenci" ? veri.veliId || null : undefined,
    });
    adminSayfalariniYenile();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "admin.kullaniciEkle") };
  }
}

/** Koç ya da öğretmen hesabı oluşturur (girdi.rol ile belirlenir; varsayılan "koc") */
export async function kocEkle(girdi: unknown): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const veri = KocEkleSemasi.parse(girdi);
    const kullanici = kullaniciAdiNormalize(veri.kullanici);
    const mevcut = await prisma.kullanici.findUnique({ where: { kullanici } });
    if (mevcut) return { hata: "Bu kullanıcı adı zaten kayıtlı." };
    const yeni = await prisma.kullanici.create({
      data: {
        rol: veri.rol,
        ad: veri.ad,
        kullanici,
        sifreHash: bcrypt.hashSync(veri.sifre, 10),
        brans: veri.brans,
        eposta: veri.eposta,
      },
    });
    await hosgeldinMailiKuyrukla(yeni); // e-posta girildiyse hoş geldin maili kuyruklanır
    denetim("admin.kocEkle", admin, { kocId: yeni.id, kullanici, rol: veri.rol });
    adminSayfalariniYenile();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "admin.kocEkle") };
  }
}

/** Koçu/öğretmeni pasifleştir/aktifleştir — pasif hesap giriş yapamaz.
    beklenenRol verilirse yalnız o roldeki hesap değiştirilebilir (rol karışmasın). */
export async function kocAktifDegistir(
  kocId: string,
  aktif: boolean,
  beklenenRol?: EgitmenRol
): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const k = await egitmenGetir(kocId, beklenenRol);
    if (!k) return { hata: `${ROL_ETIKETLERI[beklenenRol ?? "koc"]} bulunamadı.` };
    await prisma.kullanici.update({ where: { id: kocId }, data: { aktif } });
    denetim("admin.kocAktif", admin, { kocId, kullanici: k.kullanici, rol: k.rol, aktif });
    adminSayfalariniYenile();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "admin.kocAktif") };
  }
}

export async function kocSifreSifirla(
  kocId: string,
  yeniSifre: string,
  beklenenRol?: EgitmenRol
): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    if (!yeniSifre || yeniSifre.length < 4) return { hata: "Şifre en az 4 karakter olmalı." };
    const k = await egitmenGetir(kocId, beklenenRol);
    if (!k) return { hata: `${ROL_ETIKETLERI[beklenenRol ?? "koc"]} bulunamadı.` };
    await prisma.kullanici.update({
      where: { id: kocId },
      data: { sifreHash: bcrypt.hashSync(yeniSifre, 10) },
    });
    denetim("admin.kocSifreSifirla", admin, { kocId, kullanici: k.kullanici, rol: k.rol });
    adminSayfalariniYenile();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "admin.kocSifreSifirla") };
  }
}

/** Hesabı koç ↔ öğretmen rolleri arasında taşır.

    Sistemde başlangıçta yalnız "koc" rolü olduğundan bazı öğretmen hesapları
    koç olarak kayıtlı olabilir; bu eylem onları doğru role çeker. İki rol aynı
    alanları (brans) ve aynı ilişkileri (ogrenciler, odev, ozelDers, odeme…)
    kullandığı için VERİ TAŞINMAZ, yalnız rol alanı değişir. */
export async function egitmenRolDegistir(
  kullaniciId: string,
  yeniRol: EgitmenRol
): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    if (!egitmenMi(yeniRol)) return { hata: "Geçersiz rol." };
    const k = await egitmenGetir(kullaniciId);
    if (!k) return { hata: "Koç/öğretmen bulunamadı." };
    if (k.rol === yeniRol) return { hata: `Hesap zaten ${ROL_ETIKETLERI[yeniRol]} rolünde.` };
    await prisma.kullanici.update({ where: { id: kullaniciId }, data: { rol: yeniRol } });
    denetim("admin.egitmenRolDegistir", admin, {
      kullaniciId,
      kullanici: k.kullanici,
      eskiRol: k.rol,
      yeniRol,
    });
    adminSayfalariniYenile();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "admin.egitmenRolDegistir") };
  }
}

/** Koçu/öğretmeni ve ona ait kayıtları siler; öğrencileri atanmamış duruma çevirir.
    (MSSQL çoklu cascade yolu kabul etmediği için bağımlılar açıkça silinir.) */
export async function kocSil(kocId: string, beklenenRol?: EgitmenRol): Promise<EylemSonuc> {
  try {
    const admin = await oturumGerekli("admin");
    const k = await egitmenGetir(kocId, beklenenRol);
    if (!k) return { hata: `${ROL_ETIKETLERI[beklenenRol ?? "koc"]} bulunamadı.` };

    await prisma.$transaction(async (tx) => {
      await tx.odev.deleteMany({ where: { kocId } });
      await tx.takip.deleteMany({ where: { kocId } });
      await tx.yolAdimi.deleteMany({ where: { kocId } });
      await tx.ozelDers.deleteMany({ where: { kocId } });
      await tx.bildirim.deleteMany({ where: { aliciId: kocId } });
      // Ödemeler SİLİNMEZ: öğrencinin ödeme geçmişi ve platform cirosu
      // öğretmen hesabı kapansa da durmalı — bağ koparılır (kocId null).
      await tx.odeme.updateMany({ where: { kocId }, data: { kocId: null } });
      await tx.kullanici.updateMany({ where: { kocId }, data: { kocId: null } });
      await tx.kullanici.delete({ where: { id: kocId } });
    });
    denetim("admin.kocSil", admin, { kocId, kullanici: k.kullanici, ad: k.ad, rol: k.rol });
    adminSayfalariniYenile();
    return { tamam: true };
  } catch (e) {
    return { hata: hataMetni(e, "admin.kocSil") };
  }
}
