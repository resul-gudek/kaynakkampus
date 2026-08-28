"use client";

/* Üst duyuru şeridi — menünün üstünde durur, duyurular belli aralıklarla
   değişir. Statik public/*.html sayfalarındaki ikizi:
   public/assets/duyuru-serit.js — duyuru listesi iki yerde de aynı olmalı.

   Kapatma bu tarayıcıda hatırlanır (localStorage). */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import SosyalIkonlar from "./SosyalIkonlar";
import s from "./duyuru-serit.module.css";

const SURE = 6500;   // bir duyurunun ekranda kalma süresi (ms)
const GECIS = 350;   // solma süresi — CSS'teki geçiş ile aynı
const ANAHTAR = "kk-duyuru-kapali";

/* Kapatma bilgisi localStorage'da; React'e dış kaynak olarak bağlanır.
   Sunucu anlık görüntüsü "kapalı" döner: şerit ilk boyamada basılmaz,
   böylece hidrasyon uyuşmazlığı olmaz. */
const dinleyiciler = new Set<() => void>();
function abone(geriCagir: () => void) {
  dinleyiciler.add(geriCagir);
  return () => { dinleyiciler.delete(geriCagir); };
}
/* localStorage yazılamayan tarayıcılarda (gizli mod) en azından bu
   oturumda kapalı kalsın diye bellekte de tutulur. */
let bellekteKapali = false;
function kapaliMi() {
  if (bellekteKapali) return true;
  try { return localStorage.getItem(ANAHTAR) === "1"; } catch { return false; }
}

const DUYURULAR = [
  <>
    🗓️ ÖSYM ve MEB sınav takvimi her gün güncelleniyor —{" "}
    <a href="/sinav-takvimi.html">güncel tarihlere bak</a>
  </>,
  <>
    Bizi takip edin <SosyalIkonlar className={s.sosyal} />
  </>,
  <>
    🎮 Kademe, sınıf ve konuya göre yüzlerce eğitim oyunu —{" "}
    <a href="/oyunlar.html">oynamaya başla</a>
  </>,
  <>
    🧭 Hangi yöntemle daha rahat öğreniyorsun? <a href="/coklu-zeka-testi.html">Çoklu Zekâ Testi</a> ücretsiz
  </>,
  <>
    📝 Ödev, BEP ve haftalık ders programı dakikalar içinde —{" "}
    <a href="/odev-olustur.html">araçları dene</a>
  </>,
  <>
    ✍️ Çalışma yöntemleri ve rehber yazılar — <Link href="/blog">blogu oku</Link>
  </>,
];

export default function DuyuruSerit() {
  const kapali = useSyncExternalStore(abone, kapaliMi, () => true);
  const gorunur = !kapali;
  const [sira, setSira] = useState(0);
  const [gecis, setGecis] = useState(false);
  const durakla = useRef(false);

  useEffect(() => {
    if (!gorunur || DUYURULAR.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sayac = setInterval(() => {
      /* Okurken ya da sekme arkadayken duyuru altından kaymasın */
      if (durakla.current || document.hidden) return;
      setGecis(true);
      setTimeout(() => {
        setSira((x) => (x + 1) % DUYURULAR.length);
        setGecis(false);
      }, GECIS);
    }, SURE);
    return () => clearInterval(sayac);
  }, [gorunur]);

  if (!gorunur) return null;

  function kapat() {
    bellekteKapali = true;
    try { localStorage.setItem(ANAHTAR, "1"); } catch { /* gizli mod: yalnız bu oturumda kapalı */ }
    dinleyiciler.forEach((f) => f());
  }

  return (
    <div
      className={s.serit}
      onMouseEnter={() => (durakla.current = true)}
      onMouseLeave={() => (durakla.current = false)}
      onFocus={() => (durakla.current = true)}
      onBlur={() => (durakla.current = false)}
    >
      <div className="container">
        <div className={`${s.akis} ${gecis ? s.gecis : ""}`} aria-label="Duyurular">
          {DUYURULAR[sira]}
        </div>
        <button type="button" className={s.kapat} onClick={kapat} aria-label="Duyuru şeridini kapat">
          ✕
        </button>
      </div>
    </div>
  );
}
