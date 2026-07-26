import Link from "next/link";
import { blogKapakUrl, blogYaziUrl, kategoriEtiketi, kategoriIkonu } from "@/lib/blog";
import type { YaziKarti as YaziKartiVerisi } from "./tipler";
import s from "./blog.module.css";

/* Blog kartı — liste sayfası (istemci) ve "ilgili yazılar" (sunucu) aynı
   bileşeni kullanır; bu yüzden hook/etkileşim içermez. */
export default function YaziKarti({ yazi }: { yazi: YaziKartiVerisi }) {
  const adres = blogYaziUrl(yazi.slug);
  return (
    <article className={s.kart}>
      <Link href={adres} className={s.kapak} aria-label={yazi.baslik}>
        {yazi.kapakVar ? (
          /* Kapak API rotasından gelir (public dizinde değil); next/image
             optimizasyonu gerekmediğinden düz img kullanılır. */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={blogKapakUrl(yazi.id)} alt={yazi.baslik} loading="lazy" />
        ) : (
          <span className={s.kapakIkon} aria-hidden>
            {kategoriIkonu(yazi.kategori)}
          </span>
        )}
        <span className={s.kapakCip}>
          {kategoriIkonu(yazi.kategori)} {kategoriEtiketi(yazi.kategori)}
        </span>
      </Link>

      <div className={s.kartGovde}>
        <h2>
          <Link href={adres}>{yazi.baslik}</Link>
        </h2>
        {yazi.ozet && <p className={s.ozet}>{yazi.ozet}</p>}
        <div className={s.kartAlt}>
          <span>
            {yazi.tarihMetni}
            {yazi.okuma ? ` · ${yazi.okuma} dk okuma` : ""}
          </span>
          <Link href={adres} className={s.devam}>
            Okumaya başla →
          </Link>
        </div>
      </div>
    </article>
  );
}
