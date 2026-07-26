"use client";

/* 📰 Blog liste ekranı — kategori süzgeci ve arama.

   Yazılar sunucudan tek seferde gelir (yayındaki yazı sayısı yönetilebilir
   ölçekte); süzme istemcide yapılır, böylece her tuşta sunucuya gidilmez.
   Seçim adres çubuğuna yazılır (history.replaceState — RSC yeniden
   getirmeyi tetiklemeyen sığ güncelleme) ki bağlantı paylaşılabilsin. */

import { useEffect, useMemo, useState } from "react";
import { BLOG_KATEGORILERI, BLOG_KATEGORI_ETIKETLERI, BLOG_KATEGORI_IKONLARI } from "@/lib/sabitler";
import { yazilariSuz } from "@/lib/blog";
import YaziKarti from "./YaziKarti";
import type { YaziKarti as YaziKartiVerisi } from "./tipler";
import s from "./blog.module.css";

export default function BlogListe({
  yazilar,
  ilkKategori = "",
  ilkArama = "",
}: {
  yazilar: YaziKartiVerisi[];
  ilkKategori?: string;
  ilkArama?: string;
}) {
  const [kategori, setKategori] = useState(ilkKategori);
  const [arama, setArama] = useState(ilkArama);

  /* Kategori başına yayın sayısı — çiplerde gösterilir */
  const sayilar = useMemo(() => {
    const m = new Map<string, number>();
    for (const y of yazilar) m.set(y.kategori, (m.get(y.kategori) ?? 0) + 1);
    return m;
  }, [yazilar]);

  const suzulen = useMemo(() => yazilariSuz(yazilar, arama, kategori), [yazilar, arama, kategori]);

  /* Adres çubuğunu seçimle eşitle (paylaşılabilir bağlantı) */
  useEffect(() => {
    const p = new URLSearchParams();
    if (kategori) p.set("kategori", kategori);
    if (arama.trim()) p.set("q", arama.trim());
    const sorgu = p.toString();
    window.history.replaceState(null, "", sorgu ? `/blog?${sorgu}` : "/blog");
  }, [kategori, arama]);

  const suzgecVar = !!kategori || !!arama.trim();

  return (
    <>
      <div className={s.araclar}>
        <div className={s.arama}>
          <span aria-hidden>🔍</span>
          <input
            type="search"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Yazı, konu ya da etiket ara…"
            aria-label="Blog yazılarında ara"
          />
          {!!arama && (
            <button type="button" onClick={() => setArama("")} aria-label="Aramayı temizle">
              ✕
            </button>
          )}
        </div>
        <div className={s.sayac}>
          <b>{suzulen.length}</b> yazı
          {suzgecVar ? ` · ${yazilar.length} yazı içinde` : ""}
        </div>
      </div>

      <div className={s.cipler} role="group" aria-label="Kategori süzgeci">
        <button
          type="button"
          className={`${s.cip} ${kategori === "" ? s.secili : ""}`}
          aria-pressed={kategori === ""}
          onClick={() => setKategori("")}
        >
          ✨ Tümü <small>{yazilar.length}</small>
        </button>
        {BLOG_KATEGORILERI.map((k) => (
          <button
            key={k}
            type="button"
            className={`${s.cip} ${kategori === k ? s.secili : ""}`}
            aria-pressed={kategori === k}
            onClick={() => setKategori((x) => (x === k ? "" : k))}
          >
            {BLOG_KATEGORI_IKONLARI[k]} {BLOG_KATEGORI_ETIKETLERI[k]}
            <small>{sayilar.get(k) ?? 0}</small>
          </button>
        ))}
      </div>

      {suzulen.length ? (
        <div className={s.izgara}>
          {suzulen.map((y) => (
            <YaziKarti key={y.id} yazi={y} />
          ))}
        </div>
      ) : (
        <div className={s.bos}>
          <span aria-hidden>🔎</span>
          <b>Aramanıza uygun yazı bulunamadı.</b>
          <p>
            {yazilar.length
              ? "Farklı bir kategori seçebilir ya da arama sözcüğünü kısaltabilirsiniz."
              : "Blog yazıları çok yakında burada olacak. Takipte kalın!"}
          </p>
          {suzgecVar && (
            <button
              type="button"
              onClick={() => {
                setKategori("");
                setArama("");
              }}
            >
              Süzgeçleri temizle
            </button>
          )}
        </div>
      )}
    </>
  );
}
