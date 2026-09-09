import { blogIcerikNormalle } from "@/lib/blog-icerik";
import s from "./blog.module.css";

/* Yazı gövdesi.

   İçerik kaydedilirken lib/blog-icerik.ts ile tek biçime indirgenir
   (yalnız p, h2, h3, strong, em, ul, ol, li, a, blockquote, br). Burada
   BİR KEZ DAHA normalleştirilir; böylece eski kayıtlardaki düz metin
   yazılar da veriye dokunmadan yeni standarda uyar ve gövdeye elle
   sızmış bir biçim yayına çıkamaz.

   dangerouslySetInnerHTML güvenlidir: basılan dizge girdiden kopyalanmaz,
   normalleştiricinin ürettiği sabit etiketlerden oluşur; metin düğümleri
   kaçırılır, <a href> denetlenir (bkz. blog-icerik.test.ts).

   Tipografi tek yerden gelir: .blog-content (src/app/blog-content.css). */

export default function Icerik({ icerik }: { icerik: string }) {
  const html = blogIcerikNormalle(icerik);
  if (!html) return null;

  return (
    <div
      className={`${s.govdeAlan} blog-content`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
