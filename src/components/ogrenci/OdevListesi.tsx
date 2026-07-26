"use client";

/* 📘 Ödevlerim — legacy odevCiz/odevIsaretle birebir.
   Ek olarak: öğrenci ödevi tamamlarken çözüm fotoğrafı yükler (odevKanitYukle).
   Kanıtsız tamamlama yok; onay kutusu doğrudan işaretlemez, yükleme panelini açar. */

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { odevDurum, odevKanitSil, odevKanitYukle } from "@/actions/odev";
import { bugun, isoTarih, tarihStr } from "@/lib/hesap";
import { IZINLI_TURLER, MAX_DOSYA_BOYUT } from "@/lib/dosya-tanim";
import { KANIT_ACCEPT, MAX_KANIT, kanitUrl } from "@/lib/odev-kanit";
import BosDurum from "@/components/maskot/BosDurum";
import type { OdevListeKaydi } from "./tipler";
import s from "./panel.module.css";

const MB = Math.round(MAX_DOSYA_BOYUT / 1024 / 1024);
/* Telefon galerisi/kamerası HEIC üretebilir; sunucu reddetmeden önce
   burada anlaşılır bir mesaj verilir. */
const IZINLI_MIME = Object.keys(IZINLI_TURLER.image);
const TUR_METNI = Object.values(IZINLI_TURLER.image)
  .map((u) => u.toLocaleUpperCase("tr-TR"))
  .join(", ");

export default function OdevListesi({ odevler }: { odevler: OdevListeKaydi[] }) {
  const [, startTransition] = useTransition();
  const [acikId, setAcikId] = useState<string | null>(null);
  const [liste, isaretleOptimistik] = useOptimistic(
    odevler,
    (mevcut, g: { id: string; durum: string }) =>
      mevcut.map((o) => (o.id === g.id ? { ...o, durum: g.durum } : o))
  );

  const sirali = [...liste].sort(
    (a, b) =>
      Number(a.durum === "tamamlandi") - Number(b.durum === "tamamlandi") ||
      sonTarihAnahtar(a).localeCompare(sonTarihAnahtar(b))
  );
  const bekleyen = sirali.filter((o) => o.durum === "bekliyor").length;
  const simdi = bugun();

  function odevIsaretle(id: string, durum: string) {
    startTransition(async () => {
      isaretleOptimistik({ id, durum });
      const sonuc = await odevDurum(id, durum);
      if (sonuc.hata) alert(sonuc.hata);
    });
  }

  return (
    <section className={s.bolum} id="bolum-odev">
      <div className={s["bolum-bas"]}>
        <h2>📘 Ödevlerim</h2>
        <span className="tag">
          {sirali.length ? `${bekleyen} bekleyen / ${sirali.length} toplam` : "Ödev yok"}
        </span>
      </div>
      {sirali.length ? (
        sirali.map((o) => {
          const tamam = o.durum === "tamamlandi";
          const gecikti = o.durum === "bekliyor" && !!o.sonTarih && isoTarih(o.sonTarih) < simdi;
          const acik = acikId === o.id;
          // Kanıt zaten varsa (koç geri almış olabilir) doğrudan işaretlenebilir;
          // kanıt yoksa onay kutusu yükleme panelini açar.
          const kanitVar = o.kanitlar.length > 0;
          return (
            <div key={o.id} className={`${s["liste-satir"]} ${tamam ? s.tamam : ""}`} data-id={o.id}>
              <button
                className={`${s["onay-kutu"]} ${tamam ? s.isaretli : ""}`}
                title={
                  tamam
                    ? "Geri al"
                    : kanitVar
                      ? "Tamamlandı olarak işaretle"
                      : "Fotoğraf ekleyip tamamla"
                }
                onClick={() => {
                  if (tamam) odevIsaretle(o.id, "bekliyor");
                  else if (kanitVar) odevIsaretle(o.id, "tamamlandi");
                  else setAcikId(acik ? null : o.id);
                }}
              >
                {tamam ? "✓" : ""}
              </button>
              <div className={s["liste-govde"]}>
                <b>
                  {o.ders} – {o.konu}
                </b>
                <p>{o.aciklama || ""}</p>
                <div className={s["liste-meta"]}>
                  {gecikti && <span className={`${s["durum-rozet"]} ${s.gecikti}`}>⚠ Süresi geçti</span>}
                  {o.kaynak && <span className="tag">📕 {o.kaynak}</span>}
                  {!!o.soruSayisi && <span className="tag">{o.soruSayisi} soru</span>}
                  {!!o.sonTarih && <span className="tag">📅 Son: {tarihStr(o.sonTarih)}</span>}
                  {!!o.kanitlar.length && (
                    <span className="tag">📷 {o.kanitlar.length} fotoğraf</span>
                  )}
                </div>

                {!!o.kanitlar.length && (
                  <div className={s["kanit-serit"]}>
                    {o.kanitlar.map((k) => (
                      <KanitKart key={k.id} id={k.id} ad={k.ad} />
                    ))}
                  </div>
                )}

                {!acik && (
                  <div className={s["kanit-cagri"]}>
                    {!tamam && kanitVar && (
                      <button
                        type="button"
                        className="btn btn-primary btn-kucuk"
                        onClick={() => odevIsaretle(o.id, "tamamlandi")}
                      >
                        ✓ Tamamla
                      </button>
                    )}
                    {o.kanitlar.length < MAX_KANIT && (
                      <button
                        type="button"
                        className="btn btn-outline btn-kucuk"
                        onClick={() => setAcikId(o.id)}
                      >
                        {tamam || kanitVar ? "+ Fotoğraf ekle" : "📷 Fotoğraf ekleyip tamamla"}
                      </button>
                    )}
                  </div>
                )}

                {acik && (
                  <KanitYukleyici
                    odevId={o.id}
                    mevcutAdet={o.kanitlar.length}
                    tamamlandi={tamam}
                    onKapat={() => setAcikId(null)}
                  />
                )}
              </div>
            </div>
          );
        })
      ) : (
        <BosDurum
          ifade="onay"
          baslik="Bekleyen ödevin yok."
          metin="Öğretmenin yeni ödev verdiğinde burada görünecek."
        />
      )}
    </section>
  );
}

/* ── Yüklenmiş kanıt fotoğrafı: küçük görsel + silme ── */
function KanitKart({ id, ad }: { id: string; ad: string }) {
  const [bekliyor, baslat] = useTransition();

  function sil() {
    if (!confirm("Bu fotoğraf silinsin mi? Son fotoğrafı silersen ödev yeniden bekliyor olur.")) return;
    baslat(async () => {
      const sonuc = await odevKanitSil(id);
      if (sonuc.hata) alert(sonuc.hata);
    });
  }

  return (
    <figure className={s["kanit-kart"]} data-bekliyor={bekliyor || undefined}>
      <a href={kanitUrl(id)} target="_blank" rel="noopener noreferrer" title={ad}>
        {/* Kanıtlar public dizinde değil; API'den akar → next/image optimizasyonu kullanılmaz */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={kanitUrl(id)} alt={ad} loading="lazy" />
      </a>
      <button type="button" className={s["kanit-sil"]} title="Fotoğrafı sil" disabled={bekliyor} onClick={sil}>
        ✕
      </button>
    </figure>
  );
}

/* ── Fotoğraf seçme + yükleme paneli ── */
/** Seçilen dosya ve önizleme için üretilen blob adresi */
interface Secim {
  dosya: File;
  onizleme: string;
}

function KanitYukleyici({
  odevId,
  mevcutAdet,
  tamamlandi,
  onKapat,
}: {
  odevId: string;
  mevcutAdet: number;
  tamamlandi: boolean;
  onKapat: () => void;
}) {
  const [secili, setSecili] = useState<Secim[]>([]);
  const [hata, setHata] = useState("");
  const [bekliyor, baslat] = useTransition();
  const girdiRef = useRef<HTMLInputElement>(null);
  const seciliRef = useRef<Secim[]>([]);
  const kalan = MAX_KANIT - mevcutAdet;

  useEffect(() => {
    seciliRef.current = secili; // kapanış temizliği güncel listeyi görsün
  }, [secili]);
  // Panel kapanınca (Vazgeç / yükleme sonrası) blob adresleri serbest bırakılır
  useEffect(() => () => seciliRef.current.forEach((x) => URL.revokeObjectURL(x.onizleme)), []);

  function secimDegisti(e: React.ChangeEvent<HTMLInputElement>) {
    const gelen = Array.from(e.target.files ?? []);
    if (girdiRef.current) girdiRef.current.value = ""; // aynı dosya tekrar seçilebilsin
    if (!gelen.length) return;

    const buyuk = gelen.find((f) => f.size > MAX_DOSYA_BOYUT);
    if (buyuk) {
      setHata(`"${buyuk.name}" çok büyük (en fazla ${MB} MB).`);
      return;
    }
    const yanlisTur = gelen.find((f) => !IZINLI_MIME.includes((f.type || "").toLowerCase()));
    if (yanlisTur) {
      setHata(`"${yanlisTur.name}" desteklenmiyor; ${TUR_METNI} olmalı.`);
      return;
    }
    if (secili.length + gelen.length > kalan) {
      setHata(`En fazla ${kalan} fotoğraf ekleyebilirsin.`);
      return;
    }
    setHata("");
    setSecili((mevcut) => [
      ...mevcut,
      ...gelen.map((dosya) => ({ dosya, onizleme: URL.createObjectURL(dosya) })),
    ]);
  }

  function cikar(sira: number) {
    setHata("");
    setSecili((mevcut) => {
      const cikan = mevcut[sira];
      if (cikan) URL.revokeObjectURL(cikan.onizleme);
      return mevcut.filter((_, i) => i !== sira);
    });
  }

  function gonder() {
    if (!secili.length) {
      setHata("Önce en az bir fotoğraf seç.");
      return;
    }
    const fd = new FormData();
    fd.append("odevId", odevId);
    for (const x of secili) fd.append("kanit", x.dosya);
    baslat(async () => {
      const sonuc = await odevKanitYukle(fd);
      if (sonuc.hata) {
        setHata(sonuc.hata);
        return;
      }
      onKapat(); // unmount → blob adresleri temizlenir
    });
  }

  return (
    <div className={s["kanit-panel"]}>
      <b>{tamamlandi ? "📷 Fotoğraf ekle" : "📷 Ödevi tamamla"}</b>
      <p>
        {tamamlandi
          ? `Bu ödeve ${kalan} fotoğraf daha ekleyebilirsin.`
          : "Çözdüğün sayfaların fotoğrafını ekle; ödev fotoğrafla birlikte tamamlanır."}
      </p>

      <input
        ref={girdiRef}
        type="file"
        accept={KANIT_ACCEPT}
        multiple
        disabled={bekliyor || kalan <= 0}
        onChange={secimDegisti}
      />

      {!!secili.length && (
        <div className={s["kanit-serit"]}>
          {secili.map((x, i) => (
            <figure key={x.onizleme} className={s["kanit-kart"]}>
              {/* Yerel seçim önizlemesi (blob:) → next/image kullanılmaz */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.onizleme} alt={x.dosya.name} />
              <button
                type="button"
                className={s["kanit-sil"]}
                title="Seçimden çıkar"
                disabled={bekliyor}
                onClick={() => cikar(i)}
              >
                ✕
              </button>
            </figure>
          ))}
        </div>
      )}

      {hata && <span className={s["kanit-hata"]}>{hata}</span>}

      <div className={s["kanit-butonlar"]}>
        <button
          type="button"
          className="btn btn-primary btn-kucuk"
          disabled={bekliyor || !secili.length}
          onClick={gonder}
        >
          {bekliyor ? "Yükleniyor…" : tamamlandi ? "Fotoğrafları Yükle" : "✓ Tamamla"}
        </button>
        <button
          type="button"
          className="btn btn-outline btn-kucuk"
          disabled={bekliyor}
          onClick={onKapat}
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}

function sonTarihAnahtar(o: OdevListeKaydi): string {
  return o.sonTarih ? isoTarih(o.sonTarih) : "9999-99-99";
}
