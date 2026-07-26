import { icerigiAyristir, type MetinParcasi } from "@/lib/blog";
import s from "./blog.module.css";

/* Yazı gövdesi. İçerik markdown-lite olarak saklanır; lib/blog.ts saf
   fonksiyonla blok listesine çevirir, burada React elemanı olarak basılır.
   HTML enjeksiyonu mümkün değildir — dangerouslySetInnerHTML KULLANILMAZ. */

function Parcalar({ parcalar }: { parcalar: MetinParcasi[] }) {
  return (
    <>
      {parcalar.map((p, i) => {
        if (p.tur === "kalin") return <strong key={i}>{p.deger}</strong>;
        if (p.tur === "egik") return <em key={i}>{p.deger}</em>;
        if (p.tur === "baglanti") {
          return (
            <a key={i} href={p.adres} target="_blank" rel="noopener noreferrer nofollow">
              {p.deger}
            </a>
          );
        }
        return <span key={i}>{p.deger}</span>;
      })}
    </>
  );
}

export default function Icerik({ icerik }: { icerik: string }) {
  const bloklar = icerigiAyristir(icerik);

  return (
    <div className={s.icerik}>
      {bloklar.map((b, i) => {
        switch (b.tur) {
          case "baslik":
            return b.seviye === 2 ? (
              <h2 key={i}>
                <Parcalar parcalar={b.parcalar} />
              </h2>
            ) : (
              <h3 key={i}>
                <Parcalar parcalar={b.parcalar} />
              </h3>
            );
          case "alinti":
            return (
              <blockquote key={i}>
                <Parcalar parcalar={b.parcalar} />
              </blockquote>
            );
          case "liste": {
            const maddeler = b.maddeler.map((m, j) => (
              <li key={j}>
                <Parcalar parcalar={m} />
              </li>
            ));
            return b.sirali ? <ol key={i}>{maddeler}</ol> : <ul key={i}>{maddeler}</ul>;
          }
          case "ayirici":
            return <hr key={i} />;
          default:
            return (
              <p key={i}>
                <Parcalar parcalar={b.parcalar} />
              </p>
            );
        }
      })}
    </div>
  );
}
