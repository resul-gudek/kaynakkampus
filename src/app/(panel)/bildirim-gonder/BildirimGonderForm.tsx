"use client";

/* Bildirim gönderme formu — yönetici ve eğitmen için ortak.
   Alıcı seçimi iki katmanlıdır: rol grupları ("Tüm veliler", "Öğrencilerim")
   ve tek tek kişi seçimi; ikisi birleşir, tekrarlar sunucuda da düşer.
   Alıcı sayısı ekranda canlı hesaplanır; asıl çözümleme sunucuda yapılır. */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bildirimGonder } from "@/actions/bildirim-gonder";
import {
  BILDIRIM_IKONLARI,
  BILDIRIM_METIN_MAX,
  HEDEF_GRUBU_ROLU,
  type BildirimIkonu,
  type HedefGrubu,
} from "@/lib/bildirim-gonder";
import type { AdayGorunum } from "@/lib/bildirim-gonder-sunucu";
import { Uyari } from "@/components/ui/uyari";
import stil from "./bildirim-gonder.module.css";

export interface GrupGorunum {
  anahtar: HedefGrubu;
  etiket: string;
  sayi: number;
}

/** Kişi listesinde bir anda çizilen azami satır — aramayla daraltılır */
const LISTE_TAVANI = 150;

const ROL_SINIFI: Record<string, string> = {
  ogrenci: stil.rolOgrenci,
  veli: stil.rolVeli,
  ogretmen: stil.rolOgretmen,
  koc: stil.rolKoc,
  admin: stil.rolAdmin,
};

function kucult(s: string) {
  return s.toLocaleLowerCase("tr-TR");
}

export default function BildirimGonderForm({
  rol,
  gruplar,
  adaylar,
  onSecili,
}: {
  rol: string;
  gruplar: GrupGorunum[];
  adaylar: AdayGorunum[];
  onSecili: string[];
}) {
  const router = useRouter();
  const [bekliyor, baslat] = useTransition();

  const [metin, setMetin] = useState("");
  const [ikon, setIkon] = useState<BildirimIkonu>(BILDIRIM_IKONLARI[0]);
  const [seciliGruplar, setSeciliGruplar] = useState<Set<HedefGrubu>>(new Set());
  const [kisiler, setKisiler] = useState<Set<string>>(() => new Set(onSecili));
  const [kisiAcik, setKisiAcik] = useState(onSecili.length > 0);
  const [arama, setArama] = useState("");
  const [rolFiltre, setRolFiltre] = useState<string>("hepsi");

  const adayHar = useMemo(() => new Map(adaylar.map((a) => [a.id, a])), [adaylar]);

  /* Gruplardan gelen roller + tek tek kişiler → tekrarsız alıcı kümesi */
  const aliciSayisi = useMemo(() => {
    const roller = new Set<string>([...seciliGruplar].map((g) => HEDEF_GRUBU_ROLU[g]));
    let n = 0;
    for (const a of adaylar) if (roller.has(a.rol) || kisiler.has(a.id)) n++;
    return n;
  }, [adaylar, seciliGruplar, kisiler]);

  /* Kişi listesinde görünen roller (filtre çipleri) */
  const listeRolleri = useMemo(() => {
    const sira = ["ogrenci", "veli", "ogretmen", "koc", "admin"];
    const var_ = new Set(adaylar.map((a) => a.rol));
    return sira.filter((r) => var_.has(r));
  }, [adaylar]);

  const filtreli = useMemo(() => {
    const q = kucult(arama.trim());
    return adaylar.filter(
      (a) =>
        (rolFiltre === "hepsi" || a.rol === rolFiltre) &&
        (!q || kucult(a.ad).includes(q) || kucult(a.altBilgi).includes(q))
    );
  }, [adaylar, arama, rolFiltre]);

  function grupDegistir(g: HedefGrubu) {
    setSeciliGruplar((eski) => {
      const yeni = new Set(eski);
      if (yeni.has(g)) yeni.delete(g);
      else yeni.add(g);
      return yeni;
    });
  }

  function kisiDegistir(id: string) {
    setKisiler((eski) => {
      const yeni = new Set(eski);
      if (yeni.has(id)) yeni.delete(id);
      else yeni.add(id);
      return yeni;
    });
  }

  function listedekileriSec(sec: boolean) {
    setKisiler((eski) => {
      const yeni = new Set(eski);
      for (const a of filtreli) {
        if (sec) yeni.add(a.id);
        else yeni.delete(a.id);
      }
      return yeni;
    });
  }

  async function gonder() {
    const duz = metin.trim();
    if (duz.length < 3) {
      Uyari.uyari("Bildirim metnini yazın (en az 3 karakter).");
      return;
    }
    if (aliciSayisi === 0) {
      Uyari.uyari("En az bir alıcı grubu ya da kişi seçin.");
      return;
    }
    const kabul = await Uyari.onay(
      aliciSayisi === 1
        ? "Bildirim 1 kişiye gönderilecek. Gönderilen bildirim geri alınamaz."
        : `Bildirim ${aliciSayisi} kişiye gönderilecek. Gönderilen bildirim geri alınamaz.`,
      { baslik: "Bildirim gönderilsin mi?", onayEtiketi: "Gönder", ikon }
    );
    if (!kabul) return;

    baslat(async () => {
      const s = await bildirimGonder({
        metin: duz,
        ikon,
        gruplar: [...seciliGruplar],
        kisiler: [...kisiler],
      });
      if (s.hata) {
        Uyari.hata(s.hata);
        return;
      }
      Uyari.bildir(
        s.aliciSayisi === 1 ? "Bildirim 1 kişiye gönderildi" : `Bildirim ${s.aliciSayisi} kişiye gönderildi`,
        { tur: "basari", ikon: "📢" }
      );
      setMetin("");
      setSeciliGruplar(new Set());
      setKisiler(new Set());
      router.refresh();
    });
  }

  const kalan = BILDIRIM_METIN_MAX - metin.length;

  return (
    <section className={stil.duzen} aria-label="Bildirim gönderme formu">
      {/* ── Sol: alıcılar + metin ── */}
      <div className={stil.kart}>
        <h2 className={stil.baslik}>
          <span>1</span> Kime gönderilecek?
        </h2>

        <div className={stil.cipler} role="group" aria-label="Alıcı grupları">
          {gruplar.map((g) => {
            const aktif = seciliGruplar.has(g.anahtar);
            return (
              <button
                key={g.anahtar}
                type="button"
                className={aktif ? stil.cipAktif : stil.cip}
                onClick={() => grupDegistir(g.anahtar)}
                disabled={g.sayi === 0}
                aria-pressed={aktif}
                title={g.sayi === 0 ? "Bu grupta aktif kullanıcı yok" : `${g.sayi} kişi`}
              >
                {aktif ? "✓ " : ""}
                {g.etiket}
                <small>{g.sayi}</small>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={stil.acKapa}
          onClick={() => setKisiAcik((a) => !a)}
          aria-expanded={kisiAcik}
        >
          {kisiAcik ? "▾" : "▸"} Kişi seç{" "}
          {kisiler.size > 0 && <em>({kisiler.size} seçili)</em>}
        </button>

        {kisiAcik && (
          <div className={stil.kisiKutu}>
            {kisiler.size > 0 && (
              <div className={stil.secilenler}>
                {[...kisiler].map((id) => {
                  const a = adayHar.get(id);
                  if (!a) return null;
                  return (
                    <span key={id} className={stil.secilen}>
                      {a.ad}
                      <button
                        type="button"
                        onClick={() => kisiDegistir(id)}
                        aria-label={`${a.ad} seçimden çıkar`}
                        title="Çıkar"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
                <button type="button" className={stil.temizle} onClick={() => setKisiler(new Set())}>
                  Temizle
                </button>
              </div>
            )}

            <div className={stil.aramaSatiri}>
              <input
                type="search"
                className={stil.arama}
                placeholder="Ad, sınıf ya da öğrenci adına göre ara…"
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                aria-label="Kişi ara"
              />
              {listeRolleri.length > 1 && (
                <div className={stil.rolFiltre} role="group" aria-label="Rol filtresi">
                  <button
                    type="button"
                    className={rolFiltre === "hepsi" ? stil.minikAktif : stil.minik}
                    onClick={() => setRolFiltre("hepsi")}
                  >
                    Hepsi
                  </button>
                  {listeRolleri.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={rolFiltre === r ? stil.minikAktif : stil.minik}
                      onClick={() => setRolFiltre(r)}
                    >
                      {adaylar.find((a) => a.rol === r)?.rolEtiket ?? r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={stil.listeBas}>
              <small>
                {filtreli.length === adaylar.length
                  ? `${adaylar.length} kişi`
                  : `${filtreli.length} / ${adaylar.length} kişi`}
                {filtreli.length > LISTE_TAVANI ? ` · ilk ${LISTE_TAVANI} gösteriliyor, daraltmak için arayın` : ""}
              </small>
              {filtreli.length > 0 && (
                <span>
                  <button type="button" onClick={() => listedekileriSec(true)}>
                    Listedekileri seç
                  </button>
                  <button type="button" onClick={() => listedekileriSec(false)}>
                    Kaldır
                  </button>
                </span>
              )}
            </div>

            <ul className={stil.liste}>
              {filtreli.length === 0 && <li className={stil.bosNot}>Aramaya uyan kişi yok.</li>}
              {filtreli.slice(0, LISTE_TAVANI).map((a) => {
                const secili = kisiler.has(a.id);
                return (
                  <li key={a.id}>
                    <label className={secili ? stil.satirSecili : stil.satir}>
                      <input type="checkbox" checked={secili} onChange={() => kisiDegistir(a.id)} />
                      <span className={stil.kisi}>
                        <b>{a.ad}</b>
                        {a.altBilgi && <small>{a.altBilgi}</small>}
                      </span>
                      <span className={`${stil.rolRozet} ${ROL_SINIFI[a.rol] ?? ""}`}>{a.rolEtiket}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <h2 className={stil.baslik} style={{ marginTop: 22 }}>
          <span>2</span> Ne yazılacak?
        </h2>

        <div className={stil.ikonlar} role="radiogroup" aria-label="Bildirim ikonu">
          {BILDIRIM_IKONLARI.map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={ikon === i}
              className={ikon === i ? stil.ikonAktif : stil.ikonBtn}
              onClick={() => setIkon(i)}
            >
              {i}
            </button>
          ))}
        </div>

        <textarea
          className={stil.metin}
          value={metin}
          onChange={(e) => setMetin(e.target.value.slice(0, BILDIRIM_METIN_MAX))}
          rows={4}
          maxLength={BILDIRIM_METIN_MAX}
          placeholder="Örn. Yarınki deneme sınavı 10:00'da başlayacak. Lütfen 15 dakika önce hazır olun."
          aria-label="Bildirim metni"
        />
        <div className={kalan < 40 ? stil.sayacAz : stil.sayac}>
          {metin.length} / {BILDIRIM_METIN_MAX}
        </div>
      </div>

      {/* ── Sağ: önizleme + gönder ── */}
      <aside className={stil.kart}>
        <h2 className={stil.baslik}>
          <span>3</span> Önizleme
        </h2>
        <div className={stil.onizleme} aria-live="polite">
          <div className={stil.onizIkon}>{ikon}</div>
          <div className={stil.onizGovde}>
            <p>{metin.trim() || <em>Bildirim metni burada görünecek…</em>}</p>
            <small>🕐 Şimdi</small>
          </div>
        </div>
        <div className={stil.pushOniz}>
          <b>Duyuru 📢</b>
          <span>{metin.trim() ? (metin.trim().length > 90 ? metin.trim().slice(0, 89) + "…" : metin.trim()) : "Cihaz bildirimi böyle görünür"}</span>
        </div>
        <p className={stil.not}>
          Uygulama içi bildirim herkese yazılır. Cihaz bildirimi, yalnız &ldquo;Duyurular&rdquo; türünü
          kapatmamış ve cihazını bağlamış alıcılara bir dakika içinde ulaşır.
        </p>

        <div className={stil.altSerit}>
          <div className={stil.aliciSayac}>
            <b>{aliciSayisi}</b>
            <small>alıcı</small>
          </div>
          <button
            type="button"
            className="btn btn-bordo"
            onClick={gonder}
            disabled={bekliyor || aliciSayisi === 0 || metin.trim().length < 3}
          >
            {bekliyor ? "Gönderiliyor…" : "📢 Bildirimi Gönder"}
          </button>
        </div>
        {rol !== "admin" && (
          <p className={stil.not}>
            Yalnız size atanmış ya da online sınıflarınıza üye öğrencilere ve velilerine gönderebilirsiniz.
          </p>
        )}
      </aside>
    </section>
  );
}
