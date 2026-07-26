"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { basvuruGonder } from "@/actions/basvuru";
import { alanAccept, MAX_DOSYA_BOYUT } from "@/lib/basvuru-dosya-tanim";
import { FORMLAR } from "./formlar";
import type { Adim, Alan, FormTanimi } from "./tipler";
import stil from "./basvuru.module.css";

type Deger = Record<string, unknown>;

// Sunucu Server Action gövde limiti 25 MB (next.config.ts); istemcide biraz
// altında sınır koyarız ki JSON veri + multipart yükü için pay kalsın.
const TOPLAM_DOSYA_LIMIT = 22 * 1024 * 1024;
const MB = (b: number) => `${(b / 1024 / 1024).toFixed(0)} MB`;

/** cokSecim seçenek etiketi ("ogrenci" gibi teknik değerler için okunur etiket) */
const SECENEK_ETIKET: Record<string, string> = {
  ogrenci: "Öğrenci",
  veli: "Veli",
};
const etiketle = (s: string) => SECENEK_ETIKET[s] ?? s;

export default function BasvuruSihirbazi({ tur }: { tur: FormTanimi["tur"] }) {
  // Form tanımı `gorunur` gibi fonksiyonlar içerdiğinden server→client sınırından
  // geçirilemez; bu yüzden istemci tarafında (client-safe formlar modülünden) seçilir.
  const form = FORMLAR[tur];
  const [adimIx, setAdimIx] = useState(0);
  const [deger, setDeger] = useState<Deger>({});
  const [dosyalar, setDosyalar] = useState<Record<string, File[]>>({});
  const [hata, setHata] = useState("");
  const [hataAlan, setHataAlan] = useState<string | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  const adimlar = form.adimlar;
  const sonAdim = adimIx === adimlar.length - 1;

  function alanGorunur(a: Alan): boolean {
    return a.gorunur ? a.gorunur(deger) : true;
  }
  function gorunurAlanlar(adim: Adim): Alan[] {
    return adim.alanlar.filter(alanGorunur);
  }

  function guncelle(ad: string, v: unknown) {
    setDeger((d) => ({ ...d, [ad]: v }));
  }

  /** Bir alan zorunlu ve boşsa true döner. */
  function alanEksik(a: Alan): boolean {
    if (!a.zorunlu) return false;
    const v = deger[a.ad];
    if (a.tip === "onay") return v !== true;
    if (a.tip === "cokSecim") return !Array.isArray(v) || v.length === 0;
    return typeof v !== "string" || v.trim() === "";
  }

  /** Adımın ilk eksik zorunlu alanını döner (yoksa null). */
  function ilkEksik(adim: Adim): Alan | null {
    return gorunurAlanlar(adim).find(alanEksik) ?? null;
  }

  function ileri() {
    const eksik = ilkEksik(adimlar[adimIx]);
    if (eksik) {
      const mesaj =
        eksik.tip === "onay"
          ? "Devam etmek için gerekli onayı işaretleyin."
          : eksik.tip === "cokSecim"
            ? `"${eksik.etiket}" için en az bir seçim yapın.`
            : `Lütfen "${eksik.etiket}" alanını doldurun.`;
      setHata(mesaj);
      setHataAlan(eksik.ad);
      // Eksik alanı görünür kıl ve odakla
      if (typeof window !== "undefined") {
        requestAnimationFrame(() => {
          const kutu = document.querySelector<HTMLElement>(`[data-alan="${eksik.ad}"]`);
          kutu?.scrollIntoView({ behavior: "smooth", block: "center" });
          kutu?.querySelector<HTMLElement>("input, select, textarea")?.focus();
        });
      }
      return;
    }
    setHata("");
    setHataAlan(null);
    setAdimIx((i) => Math.min(i + 1, adimlar.length - 1));
    kaydir();
  }
  function geri() {
    setHata("");
    setHataAlan(null);
    setAdimIx((i) => Math.max(i - 1, 0));
    kaydir();
  }
  function kaydir() {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** veri JSON'unu kur: dosyalar hariç; boş sayı/dizi alanları atlanır. */
  function veriKur(): Deger {
    const cikti: Deger = {};
    for (const adim of adimlar) {
      for (const a of adim.alanlar) {
        if (a.tip === "dosya") continue;
        if (!alanGorunur(a)) continue;
        const v = deger[a.ad];
        if (a.tip === "onay") {
          cikti[a.ad] = v === true;
        } else if (a.tip === "cokSecim") {
          if (Array.isArray(v) && v.length) cikti[a.ad] = v;
        } else if (a.tip === "sayi" || a.tip === "yil") {
          if (typeof v === "string" && v.trim() !== "") cikti[a.ad] = v;
        } else {
          if (typeof v === "string" && v.trim() !== "") cikti[a.ad] = v.trim();
        }
      }
    }
    return cikti;
  }

  async function gonder() {
    const eksik = ilkEksik(adimlar[adimIx]);
    if (eksik) {
      setHata(
        eksik.tip === "onay"
          ? "Devam etmek için gerekli onayları işaretleyin."
          : `Lütfen "${eksik.etiket}" alanını doldurun.`
      );
      setHataAlan(eksik.ad);
      return;
    }
    // Dosya boyutu kontrolü (sunucu gövde limitine takılmadan dostça uyar)
    const tumDosyalar = Object.values(dosyalar).flat();
    const buyuk = tumDosyalar.find((f) => f.size > MAX_DOSYA_BOYUT);
    if (buyuk) {
      setHata(
        `"${buyuk.name}" dosyası çok büyük (en fazla ${MB(MAX_DOSYA_BOYUT)}). ` +
          "Lütfen daha küçük bir dosya yükleyin."
      );
      return;
    }
    const toplam = tumDosyalar.reduce((t, f) => t + f.size, 0);
    if (toplam > TOPLAM_DOSYA_LIMIT) {
      setHata(
        `Yüklenen belgelerin toplam boyutu çok yüksek (${MB(toplam)}). ` +
          `Toplam en fazla ${MB(TOPLAM_DOSYA_LIMIT)} olabilir; büyük videolar için bağlantı kullanın.`
      );
      return;
    }

    setHata("");
    setHataAlan(null);
    setGonderiliyor(true);
    try {
      const fd = new FormData();
      fd.set("tur", form.tur);
      fd.set("veri", JSON.stringify(veriKur()));
      fd.set("website", honeypot.current?.value ?? ""); // honeypot
      for (const [ad, liste] of Object.entries(dosyalar)) {
        const alan = adimlar.flatMap((s) => s.alanlar).find((a) => a.ad === ad);
        if (!alan?.dosyaAlani) continue;
        for (const f of liste) fd.append(`dosya:${alan.dosyaAlani}`, f);
      }
      const sonuc = await basvuruGonder(fd);
      if (sonuc.hata) {
        setHata(sonuc.hata);
        setGonderiliyor(false);
        return;
      }
      setToken(sonuc.token ?? null);
      kaydir();
    } catch {
      setHata("Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
      setGonderiliyor(false);
    }
  }

  if (token) return <BasariEkrani token={token} />;

  const adim = adimlar[adimIx];
  const ilerlemeYuzde = Math.round(((adimIx + 1) / adimlar.length) * 100);

  return (
    <div className={stil.sihirbaz}>
      {/* Aşama göstergesi */}
      <div className={stil.adimBar}>
        <div className={stil.adimBarUst}>
          <span>
            Aşama {adimIx + 1} / {adimlar.length}
          </span>
          <span>%{ilerlemeYuzde}</span>
        </div>
        <div className={stil.ilerlemeRay}>
          <div className={stil.ilerlemeDolu} style={{ width: `${ilerlemeYuzde}%` }} />
        </div>
        <ol className={stil.adimListe}>
          {adimlar.map((s, i) => (
            <li
              key={s.baslik}
              className={i === adimIx ? stil.adimAktif : i < adimIx ? stil.adimGecti : ""}
            >
              <span className={stil.adimNo}>{i < adimIx ? "✓" : i + 1}</span>
              <span className={stil.adimAd}>{s.baslik}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={stil.kart}>
        <h2 className={stil.adimBaslik}>{adim.baslik}</h2>
        {adim.aciklama && <p className={stil.adimAciklama}>{adim.aciklama}</p>}

        {/* Son adımda özet ("Bilgileri kontrol et") */}
        {sonAdim && <Ozet form={form} deger={deger} dosyalar={dosyalar} />}

        <div className={stil.alanGrid}>
          {gorunurAlanlar(adim).map((a) => (
            <AlanGoster
              key={a.ad}
              alan={a}
              deger={deger[a.ad]}
              dosyalar={dosyalar[a.ad] ?? []}
              hatali={hataAlan === a.ad}
              onDeger={(v) => {
                if (hataAlan === a.ad) {
                  setHataAlan(null);
                  setHata("");
                }
                guncelle(a.ad, v);
              }}
              onDosya={(fs) => setDosyalar((d) => ({ ...d, [a.ad]: fs }))}
            />
          ))}
          {!sonAdim && gorunurAlanlar(adim).length === 0 && (
            <p className={stil.bosAdim}>
              Bu aşamada sizin için doldurulacak alan yok. “İleri” ile devam edebilirsiniz.
            </p>
          )}
        </div>

        {/* Honeypot — ekran dışı, gerçek kullanıcı doldurmaz */}
        <input
          ref={honeypot}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className={stil.honeypot}
        />

        {hata && (
          <div className={stil.hata} role="alert">
            {hata}
          </div>
        )}

        <div className={stil.navButonlar}>
          {adimIx > 0 ? (
            <button type="button" className="btn btn-outline" onClick={geri} disabled={gonderiliyor}>
              ← Geri
            </button>
          ) : (
            <Link href="/basvuru" className="btn btn-outline">
              ← Vazgeç
            </Link>
          )}
          {sonAdim ? (
            <button type="button" className="btn btn-primary" onClick={gonder} disabled={gonderiliyor}>
              {gonderiliyor ? "Gönderiliyor…" : "Başvuruyu Gönder"}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={ileri}>
              İleri →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Tek alan render'ı ──────────────────────────────────────── */
function AlanGoster({
  alan,
  deger,
  dosyalar,
  hatali,
  onDeger,
  onDosya,
}: {
  alan: Alan;
  deger: unknown;
  dosyalar: File[];
  hatali?: boolean;
  onDeger: (v: unknown) => void;
  onDosya: (fs: File[]) => void;
}) {
  const tamGenislik = alan.tamGenislik || alan.tip === "cokMetin" || alan.tip === "cokSecim" || alan.tip === "dosya";
  const hataSinifi = hatali ? ` ${stil.alanHata}` : "";
  const sinif = `${stil.alan} ${tamGenislik ? stil.alanTam : ""}${hataSinifi}`;
  const zorunlu = alan.zorunlu ? <span className={stil.yildiz}>*</span> : null;

  if (alan.tip === "onay") {
    return (
      <label className={`${stil.alan} ${stil.alanTam} ${stil.onaySatir}${hataSinifi}`} data-alan={alan.ad}>
        <input
          type="checkbox"
          checked={deger === true}
          onChange={(e) => onDeger(e.target.checked)}
        />
        <span>
          {alan.etiket} {zorunlu}
          {alan.ipucu && <small className={stil.ipucu}>{alan.ipucu}</small>}
        </span>
      </label>
    );
  }

  if (alan.tip === "cokSecim") {
    const secili = Array.isArray(deger) ? (deger as string[]) : [];
    const degistir = (secenek: string, ac: boolean) =>
      onDeger(ac ? [...secili, secenek] : secili.filter((x) => x !== secenek));
    const gruplar = alan.gruplar ?? (alan.secenekler ? [{ baslik: "", secenekler: alan.secenekler }] : []);
    return (
      <div className={sinif} data-alan={alan.ad}>
        <span className={stil.etiket}>
          {alan.etiket} {zorunlu}
        </span>
        {alan.ipucu && <small className={stil.ipucu}>{alan.ipucu}</small>}
        <div className={stil.secimGruplari}>
          {gruplar.map((g) => (
            <div key={g.baslik} className={stil.secimGrup}>
              {g.baslik && <b className={stil.secimGrupBaslik}>{g.baslik}</b>}
              <div className={stil.rozetler}>
                {g.secenekler.map((s) => {
                  const ac = secili.includes(s);
                  return (
                    <label key={s} className={`${stil.rozet} ${ac ? stil.rozetAktif : ""}`}>
                      <input
                        type="checkbox"
                        checked={ac}
                        onChange={(e) => degistir(s, e.target.checked)}
                      />
                      {etiketle(s)}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (alan.tip === "dosya") {
    const coklu = !!alan.coklu;
    return (
      <div className={sinif} data-alan={alan.ad}>
        <span className={stil.etiket}>
          {alan.etiket} {zorunlu}
        </span>
        <label className={stil.dosyaAlan}>
          <input
            type="file"
            accept={alan.dosyaAlani ? alanAccept(alan.dosyaAlani) : undefined}
            multiple={coklu}
            onChange={(e) => onDosya(Array.from(e.target.files ?? []))}
          />
          <span>📎 Dosya seç{coklu ? " (birden çok olabilir)" : ""}</span>
        </label>
        {dosyalar.length > 0 && (
          <ul className={stil.dosyaListe}>
            {dosyalar.map((f, i) => (
              <li key={i}>
                {f.name} <small>({(f.size / 1024).toFixed(0)} KB)</small>
              </li>
            ))}
          </ul>
        )}
        {alan.ipucu && <small className={stil.ipucu}>{alan.ipucu}</small>}
      </div>
    );
  }

  const ortakEtiket = (
    <span className={stil.etiket}>
      {alan.etiket} {zorunlu}
    </span>
  );
  const s = typeof deger === "string" ? deger : "";

  if (alan.tip === "cokMetin") {
    return (
      <label className={sinif} data-alan={alan.ad}>
        {ortakEtiket}
        <textarea
          rows={3}
          value={s}
          placeholder={alan.placeholder}
          onChange={(e) => onDeger(e.target.value)}
        />
        {alan.ipucu && <small className={stil.ipucu}>{alan.ipucu}</small>}
      </label>
    );
  }

  if (alan.tip === "secim") {
    return (
      <label className={sinif} data-alan={alan.ad}>
        {ortakEtiket}
        <select value={s} onChange={(e) => onDeger(e.target.value)}>
          <option value="">Seçiniz…</option>
          {(alan.secenekler ?? []).map((o) => (
            <option key={o} value={o}>
              {etiketle(o)}
            </option>
          ))}
        </select>
        {alan.ipucu && <small className={stil.ipucu}>{alan.ipucu}</small>}
      </label>
    );
  }

  const inputTipi =
    alan.tip === "tel" ? "tel" : alan.tip === "eposta" ? "email" : alan.tip === "sayi" || alan.tip === "yil" ? "number" : alan.tip === "url" ? "url" : "text";
  return (
    <label className={sinif} data-alan={alan.ad}>
      {ortakEtiket}
      <input
        type={inputTipi}
        value={s}
        placeholder={alan.placeholder}
        inputMode={alan.tip === "tel" ? "tel" : undefined}
        onChange={(e) => onDeger(e.target.value)}
      />
      {alan.ipucu && <small className={stil.ipucu}>{alan.ipucu}</small>}
    </label>
  );
}

/* ── Özet (Bilgileri kontrol et) ────────────────────────────── */
function Ozet({
  form,
  deger,
  dosyalar,
}: {
  form: FormTanimi;
  deger: Deger;
  dosyalar: Record<string, File[]>;
}) {
  const satirlar = useMemo(() => {
    const out: { etiket: string; deger: string }[] = [];
    for (const adim of form.adimlar) {
      for (const a of adim.alanlar) {
        if (a.tip === "onay") continue;
        if (a.gorunur && !a.gorunur(deger)) continue;
        let metin = "";
        if (a.tip === "dosya") {
          const fs = dosyalar[a.ad] ?? [];
          if (!fs.length) continue;
          metin = fs.map((f) => f.name).join(", ");
        } else {
          const v = deger[a.ad];
          if (Array.isArray(v)) metin = v.map(etiketle).join(", ");
          else if (typeof v === "string") metin = v.trim();
          if (!metin) continue;
        }
        out.push({ etiket: a.etiket, deger: metin });
      }
    }
    return out;
  }, [form, deger, dosyalar]);

  return (
    <div className={stil.ozet}>
      <b className={stil.ozetBaslik}>Bilgilerinizi kontrol edin</b>
      {satirlar.length === 0 ? (
        <p className={stil.ipucu}>Henüz bilgi girilmedi.</p>
      ) : (
        <dl className={stil.ozetListe}>
          {satirlar.map((s, i) => (
            <div key={i}>
              <dt>{s.etiket}</dt>
              <dd>{s.deger}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/* ── Başarı ekranı ──────────────────────────────────────────── */
function BasariEkrani({ token }: { token: string }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const adres =
    typeof window !== "undefined" ? `${window.location.origin}/basvuru/durum/${token}` : "";

  function kopyala() {
    navigator.clipboard?.writeText(adres).then(
      () => {
        setKopyalandi(true);
        setTimeout(() => setKopyalandi(false), 2000);
      },
      () => {}
    );
  }

  return (
    <div className={`${stil.kart} ${stil.basari}`}>
      <div className={stil.basariIkon}>✅</div>
      <h2>Başvurunuz alındı!</h2>
      <p>
        Başvurunuz bize ulaştı. En kısa sürede değerlendirip sizinle iletişime geçeceğiz. E-posta
        girdiyseniz bir bilgilendirme mesajı da gönderdik.
      </p>
      <div className={stil.takipKutu}>
        <b>Başvuru takip bağlantınız</b>
        <p className={stil.ipucu}>
          Bu bağlantıyı yalnız siz görebilirsiniz. Durumunuzu ve mülakat bilgilerinizi buradan takip
          edin — lütfen saklayın.
        </p>
        <div className={stil.takipAdres}>
          <input readOnly value={adres} onFocus={(e) => e.target.select()} />
          <button type="button" className="btn btn-primary btn-sm" onClick={kopyala}>
            {kopyalandi ? "Kopyalandı ✓" : "Kopyala"}
          </button>
        </div>
        <Link href={`/basvuru/durum/${token}`} className={stil.takipGit}>
          Başvuru durumuma git →
        </Link>
      </div>
    </div>
  );
}
