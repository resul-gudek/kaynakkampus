/* Demo verisi — legacy/kocluk.js tohumVerisi()'nin birebir karşılığı + admin.
   İdempotent: kullanıcılar `kullanici` üzerinden upsert edilir; demo kayıtlar
   yalnızca ilgili tablo o öğrenci için boşsa eklenir. */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function gunKaydir(n: number): Date {
  const t = new Date();
  t.setUTCDate(t.getUTCDate() + n);
  return new Date(t.toISOString().slice(0, 10) + "T00:00:00.000Z");
}
const bugun = () => gunKaydir(0);

function demoProfil() {
  return {
    sinav: "YKS",
    gunlukSaat: 4,
    tarih: new Date().toISOString().slice(0, 10),
    notlar: "Sayısal ağırlıklı çalışıyor; paragraf hızını artırmak istiyor.",
    dersler: [
      { ders: "Türkçe / Edebiyat", seviye: "Orta", bilinen: ["Sözcükte Anlam", "Cümlede Anlam"], eksik: ["Paragraf"] },
      { ders: "Matematik", seviye: "Orta", bilinen: ["Temel Kavramlar", "Sayı Basamakları"], eksik: ["Problemler", "Üslü Sayılar"] },
      { ders: "Geometri", seviye: "Zayıf", bilinen: [], eksik: ["Üçgenler", "Açılar"] },
      { ders: "Fizik", seviye: "Orta", bilinen: ["Hareket"], eksik: ["Basınç"] },
      { ders: "Kimya", seviye: "İyi", bilinen: ["Atom", "Periyodik Sistem"], eksik: ["Karışımlar"] },
      { ders: "Biyoloji", seviye: "İyi", bilinen: ["Hücre", "Canlıların Sınıflandırılması"], eksik: [] },
    ],
  };
}

async function main() {
  const hash = (s: string) => bcrypt.hashSync(s, 10);

  const admin = await prisma.kullanici.upsert({
    where: { kullanici: "admin" },
    update: {},
    create: { rol: "admin", ad: "Yönetici", kullanici: "admin", sifreHash: hash("admin1234") },
  });

  const koc = await prisma.kullanici.upsert({
    where: { kullanici: "koc1" },
    update: {},
    create: {
      rol: "koc", ad: "Ayşe Yılmaz", kullanici: "koc1", sifreHash: hash("1234"),
      brans: "Öğretmen / Rehberlik",
    },
  });

  const ogr1 = await prisma.kullanici.upsert({
    where: { kullanici: "ogrenci1" },
    update: {},
    create: {
      rol: "ogrenci", ad: "Elif Demir", kullanici: "ogrenci1", sifreHash: hash("1234"),
      sinif: "12. Sınıf", hedef: "YKS – Tıp", kocId: koc.id,
      telefon: "905001112233", veliTelefon: "905004445566",
      profil: JSON.stringify(demoProfil()),
    },
  });

  const ogr2 = await prisma.kullanici.upsert({
    where: { kullanici: "ogrenci2" },
    update: {},
    create: {
      rol: "ogrenci", ad: "Mert Kaya", kullanici: "ogrenci2", sifreHash: hash("1234"),
      sinif: "8. Sınıf", hedef: "LGS – Fen Lisesi", kocId: koc.id,
      telefon: "905007778899", veliTelefon: "905001231234",
    },
  });

  await prisma.kullanici.upsert({
    where: { kullanici: "ogrenci3" },
    update: {},
    create: {
      rol: "ogrenci", ad: "Zeynep Arslan", kullanici: "ogrenci3", sifreHash: hash("1234"),
      sinif: "11. Sınıf", hedef: "YKS – Hukuk", kocId: null, // atanmamış öğrenci akışı için
    },
  });

  // ── Ödevler ──
  if ((await prisma.odev.count({ where: { ogrenciId: ogr1.id } })) === 0) {
    await prisma.odev.createMany({
      data: [
        { ogrenciId: ogr1.id, kocId: koc.id, ders: "Matematik", konu: "Türev – Uygulamaları", aciklama: "Kaynak kitaptan türev alma kuralları testi çözülecek.", kaynak: "Karekök AYT Matematik", soruSayisi: 60, sonTarih: bugun(), durum: "bekliyor" },
        { ogrenciId: ogr1.id, kocId: koc.id, ders: "Biyoloji", konu: "Hücre Bölünmeleri", aciklama: "Konu tekrarı + 40 soru.", kaynak: "3D Biyoloji", soruSayisi: 40, sonTarih: bugun(), durum: "tamamlandi" },
        { ogrenciId: ogr2.id, kocId: koc.id, ders: "Fen Bilimleri", konu: "Basınç", aciklama: "Ünite değerlendirme testi.", kaynak: "Tonguç LGS", soruSayisi: 30, sonTarih: bugun(), durum: "bekliyor" },
      ],
    });
  }

  // ── Takip listesi ──
  if ((await prisma.takip.count({ where: { ogrenciId: ogr1.id } })) === 0) {
    await prisma.takip.createMany({
      data: [
        { ogrenciId: ogr1.id, kocId: koc.id, gun: "Pazartesi", gorev: "TYT Matematik: 50 soru + yanlış analizi", tamamlandi: true },
        { ogrenciId: ogr1.id, kocId: koc.id, gun: "Salı", gorev: "AYT Fizik: Vektörler konu tekrarı (2 saat)", tamamlandi: false },
        { ogrenciId: ogr1.id, kocId: koc.id, gun: "Çarşamba", gorev: "Paragraf: 30 soru (süre tutarak)", tamamlandi: false },
        { ogrenciId: ogr2.id, kocId: koc.id, gun: "Pazartesi", gorev: "LGS Türkçe: 20 paragraf sorusu", tamamlandi: false },
      ],
    });
  }

  // ── Denemeler (net trendi görünsün diye farklı tarihlerde) ──
  if ((await prisma.deneme.count({ where: { ogrenciId: ogr1.id } })) === 0) {
    await prisma.deneme.create({
      data: {
        ogrenciId: ogr1.id, ad: "3D TYT Deneme 4", tur: "TYT", tarih: gunKaydir(-14), net: 82.5,
        dersler: {
          create: [
            { ders: "Türkçe", dogru: 32, yanlis: 6, bos: 2, net: 30.5, yanlisKonular: JSON.stringify(["Paragraf", "Sözcükte Anlam"]) },
            { ders: "Sosyal Bilimler", dogru: 14, yanlis: 4, bos: 2, net: 13, yanlisKonular: JSON.stringify(["Coğrafya – İklim"]) },
            { ders: "Temel Matematik", dogru: 26, yanlis: 8, bos: 6, net: 24, yanlisKonular: JSON.stringify(["Problemler", "Üslü Sayılar"]) },
            { ders: "Fen Bilimleri", dogru: 16, yanlis: 4, bos: 0, net: 15, yanlisKonular: JSON.stringify(["Fizik – Basınç"]) },
          ],
        },
      },
    });
    await prisma.deneme.create({
      data: {
        ogrenciId: ogr1.id, ad: "3D TYT Deneme 5", tur: "TYT", tarih: gunKaydir(-3), net: 88.25,
        dersler: {
          create: [
            { ders: "Türkçe", dogru: 34, yanlis: 5, bos: 1, net: 32.75, yanlisKonular: JSON.stringify(["Paragraf"]) },
            { ders: "Sosyal Bilimler", dogru: 15, yanlis: 3, bos: 2, net: 14.25, yanlisKonular: JSON.stringify(["Tarih – Kurtuluş Savaşı"]) },
            { ders: "Temel Matematik", dogru: 28, yanlis: 6, bos: 6, net: 26.5, yanlisKonular: JSON.stringify(["Problemler"]) },
            { ders: "Fen Bilimleri", dogru: 15, yanlis: 1, bos: 4, net: 14.75, yanlisKonular: JSON.stringify(["Kimya – Karışımlar"]) },
          ],
        },
      },
    });
  }
  if ((await prisma.deneme.count({ where: { ogrenciId: ogr2.id } })) === 0) {
    await prisma.deneme.create({
      data: {
        ogrenciId: ogr2.id, ad: "Tonguç LGS Deneme 2", tur: "LGS", tarih: gunKaydir(-5), net: 65,
        dersler: {
          create: [
            { ders: "Türkçe", dogru: 15, yanlis: 3, bos: 2, net: 14, yanlisKonular: JSON.stringify(["Paragraf", "Fiilimsiler"]) },
            { ders: "Matematik", dogru: 12, yanlis: 6, bos: 2, net: 10, yanlisKonular: JSON.stringify(["Üslü İfadeler", "Kareköklü İfadeler"]) },
            { ders: "Fen Bilimleri", dogru: 14, yanlis: 3, bos: 3, net: 13, yanlisKonular: JSON.stringify(["Basınç"]) },
            { ders: "İnkılap Tarihi", dogru: 9, yanlis: 0, bos: 1, net: 9, yanlisKonular: "[]" },
            { ders: "Din Kültürü", dogru: 10, yanlis: 0, bos: 0, net: 10, yanlisKonular: "[]" },
            { ders: "İngilizce", dogru: 9, yanlis: 0, bos: 1, net: 9, yanlisKonular: "[]" },
          ],
        },
      },
    });
  }

  // ── Yol haritası ──
  if ((await prisma.yolAdimi.count({ where: { ogrenciId: ogr1.id } })) === 0) {
    await prisma.yolAdimi.createMany({
      data: [
        { ogrenciId: ogr1.id, kocId: koc.id, sira: 1, ders: "Matematik", konu: "Temel Kavramlar", hedef: "Konu tekrarı + 60 soru", xp: 50, tamamlandi: true },
        { ogrenciId: ogr1.id, kocId: koc.id, sira: 2, ders: "Matematik", konu: "Sayı Basamakları", hedef: "Konu tekrarı + 50 soru", xp: 50, tamamlandi: true },
        { ogrenciId: ogr1.id, kocId: koc.id, sira: 3, ders: "Matematik", konu: "Bölme – Bölünebilme", hedef: "40 soru + yanlış analizi", xp: 60, tamamlandi: false },
        { ogrenciId: ogr1.id, kocId: koc.id, sira: 4, ders: "Matematik", konu: "Rasyonel Sayılar", hedef: "Konu tekrarı + 50 soru", xp: 50, tamamlandi: false },
        { ogrenciId: ogr1.id, kocId: koc.id, sira: 5, ders: "Matematik", konu: "Eşitsizlikler", hedef: "40 soru + 1 branş denemesi", xp: 80, tamamlandi: false },
      ],
    });
  }
  if ((await prisma.yolAdimi.count({ where: { ogrenciId: ogr2.id } })) === 0) {
    await prisma.yolAdimi.createMany({
      data: [
        { ogrenciId: ogr2.id, kocId: koc.id, sira: 1, ders: "Fen Bilimleri", konu: "Kuvvet ve Hareket", hedef: "Konu tekrarı + 30 soru", xp: 50, tamamlandi: false },
        { ogrenciId: ogr2.id, kocId: koc.id, sira: 2, ders: "Fen Bilimleri", konu: "Basınç", hedef: "30 soru + deney videosu", xp: 60, tamamlandi: false },
      ],
    });
  }

  // ── Özel dersler ──
  if ((await prisma.ozelDers.count({ where: { kocId: koc.id } })) === 0) {
    const talep1 = await prisma.ozelDers.create({
      data: {
        ogrenciId: ogr1.id, kocId: koc.id, ders: "Geometri", konu: "Üçgende Alan",
        tarih: gunKaydir(5), saat: "19:00", sure: 60, ucret: 0, durum: "talep", olusturan: "ogrenci",
        mesaj: "Denemelerde üçgen sorularında çok yanlışım çıkıyor hocam, bu konuya birlikte bakabilir miyiz?",
      },
    });
    const talep2 = await prisma.ozelDers.create({
      data: {
        ogrenciId: ogr2.id, kocId: koc.id, ders: "Matematik", konu: "Kareköklü İfadeler",
        tarih: gunKaydir(4), saat: "17:30", sure: 60, ucret: 500, durum: "talep", olusturan: "koc",
      },
    });
    await prisma.ozelDers.create({
      data: {
        ogrenciId: ogr1.id, kocId: koc.id, ders: "Matematik", konu: "Limit ve Süreklilik",
        tarih: gunKaydir(-7), saat: "18:00", sure: 90, ucret: 800, odendi: true, durum: "yapildi",
        not_: "Limit kavramını iyi oturttu; süreklilikte ek örnek çözülecek.", odev: "Limit karma test – 30 soru",
      },
    });
    await prisma.ozelDers.create({
      data: {
        ogrenciId: ogr1.id, kocId: koc.id, ders: "Matematik", konu: "Türev – Tanım ve Kurallar",
        tarih: gunKaydir(-2), saat: "18:00", sure: 90, ucret: 800, durum: "yapildi",
        not_: "Türev alma kurallarında belirgin hızlandı.",
      },
    });
    await prisma.ozelDers.create({
      data: {
        ogrenciId: ogr1.id, kocId: koc.id, ders: "Matematik", konu: "Türev – Uygulamaları",
        tarih: gunKaydir(3), saat: "18:00", sure: 90, ucret: 800, durum: "planlandi",
      },
    });
    await prisma.ozelDers.create({
      data: {
        ogrenciId: ogr2.id, kocId: koc.id, ders: "Fen Bilimleri", konu: "Basınç",
        tarih: gunKaydir(1), saat: "17:00", sure: 60, ucret: 500, durum: "planlandi",
      },
    });

    // Bekleyen taleplerden başlangıç bildirimleri (legacy sürüm-5 mantığı)
    const tarihStr = (d: Date) => {
      const p = d.toISOString().slice(0, 10).split("-");
      return p[2] + "." + p[1] + "." + p[0];
    };
    await prisma.bildirim.create({
      data: {
        aliciId: koc.id, ikon: "🙋",
        metin: `${ogr1.ad} özel ders talebi gönderdi: Geometri – Üçgende Alan · ${tarihStr(talep1.tarih)} 19:00`,
        hedefTur: "ozel", hedefOgrenciId: ogr1.id, hedefKayitId: talep1.id,
      },
    });
    await prisma.bildirim.create({
      data: {
        aliciId: ogr2.id, ikon: "📨",
        metin: `Öğretmenin özel ders önerdi: Matematik – Kareköklü İfadeler · ${tarihStr(talep2.tarih)} 17:30 · Onayın bekleniyor.`,
        hedefTur: "ozel", hedefOgrenciId: ogr2.id, hedefKayitId: talep2.id,
      },
    });
  }

  console.log("Seed tamam:", { admin: admin.kullanici, koc: koc.kullanici });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
