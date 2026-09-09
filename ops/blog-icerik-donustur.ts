/* ═══════════════════════════════════════════════════════════════
   Eski blog yazılarını tek biçim HTML'e taşır.

   Zorunlu DEĞİLDİR: yazı sayfası içeriği basmadan önce zaten
   blogIcerikNormalle()'den geçirir, yani eski düz metin kayıtlar
   dokunulmasa da yeni standartta görünür. Bu betik yalnız veriyi de
   aynı biçime getirmek isteyince çalıştırılır (arama/dışa aktarma
   tarafında tek biçim kolaylık sağlar).

   Kullanım — önce kuru çalıştırma, sonra uygulama:
     npx tsx ops/blog-icerik-donustur.ts
     npx tsx ops/blog-icerik-donustur.ts --uygula

   Kuru çalıştırma HİÇBİR ŞEY YAZMAZ; hangi yazının nasıl değişeceğini
   listeler. --uygula yalnız gövdeyi (ve ondan türeyen okuma süresini)
   günceller; başlık, özet, etiket, durum, tarih ve kapak korunur.

   DİKKAT: canlı veri tabanında çalıştırmadan önce yedek alın
   (bkz. ops/lan-yayin ve canlı dağıtım yordamı).
   ═══════════════════════════════════════════════════════════════ */

import { PrismaClient } from "@prisma/client";
import { blogIcerikNormalle } from "../src/lib/blog-icerik";
import { okumaSuresi } from "../src/lib/blog";

const prisma = new PrismaClient();
const uygula = process.argv.includes("--uygula");

async function main() {
  const yazilar = await prisma.blogYazi.findMany({
    orderBy: [{ guncelleme: "desc" }],
    select: { id: true, slug: true, baslik: true, icerik: true, okuma: true },
  });

  console.log(`${yazilar.length} yazı okundu · kip: ${uygula ? "UYGULA" : "kuru çalıştırma"}\n`);

  let degisen = 0;
  for (const y of yazilar) {
    const yeni = blogIcerikNormalle(y.icerik);

    if (!yeni) {
      // Normalleştirme boş sonuç verdiyse veri kaybı olur; asla yazılmaz
      console.log(`⚠  ${y.slug} — normalleştirme boş döndü, ATLANDI`);
      continue;
    }
    if (yeni === y.icerik) continue;

    degisen++;
    const eskiUzunluk = y.icerik.length;
    console.log(`• ${y.baslik}`);
    console.log(`  /blog/${y.slug} · ${eskiUzunluk} → ${yeni.length} karakter`);
    console.log(`  önce : ${y.icerik.slice(0, 110).replace(/\s+/g, " ")}…`);
    console.log(`  sonra: ${yeni.slice(0, 110)}…`);

    if (uygula) {
      await prisma.blogYazi.update({
        where: { id: y.id },
        data: { icerik: yeni, okuma: okumaSuresi(yeni) },
      });
      console.log("  ✔ kaydedildi");
    }
    console.log("");
  }

  console.log(
    degisen === 0
      ? "Tüm yazılar zaten tek biçimde."
      : uygula
        ? `${degisen} yazı güncellendi.`
        : `${degisen} yazı değişecek. Uygulamak için: npx tsx ops/blog-icerik-donustur.ts --uygula`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
