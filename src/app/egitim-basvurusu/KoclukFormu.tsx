"use client";

/* Eğitim Koçluğu Başvuru Formu — dört adım: öğrenci → ihtiyaç → iletişim →
   uygunluk. Özel ders formundan bağımsızdır; yalnız ortak parçaları
   (FormParcalari) ve iş kurallarını (lib/egitim-basvurusu) paylaşır. */

import { useEffect, useRef, useState } from "react";
import { hizala } from "@/lib/kaydirma";
import {
  BASVURAN_ETIKETLERI,
  GENEL_HATA,
  GUNLER,
  KOCLUK_KONULARI,
  KoclukSemasi,
  SINIFLAR,
  YAS_EN_AZ,
  YAS_EN_COK,
  sinifEtiketi,
  telefonNormalle,
} from "@/lib/egitim-basvurusu";
import { koclukBasvurusuGonder } from "./actions";
import {
  AdimGosterge,
  Alan,
  BasariEkrani,
  Cipler,
  FormHata,
  Gezinme,
  KvkkOnay,
  OnayKartlar,
  RadyoKartlar,
  ariaBag,
} from "./FormParcalari";
import s from "./egitim-basvurusu.module.css";

const ADIMLAR = ["Öğrenci Bilgileri", "Koçluk İhtiyacı", "İletişim", "Uygunluk"] as const;

type Durum = {
  ogrenciAd: string;
  yas: string;
  sinif: string;
  okul: string;
  konular: string[];
  konuDiger: string;
  zorlayan: string;
  basvuran: string;
  iletisimAd: string;
  telefon: string;
  eposta: string;
  gunler: string[];
  saatler: string;
  not: string;
  kvkkOnay: boolean;
};

const BASLANGIC: Durum = {
  ogrenciAd: "",
  yas: "",
  sinif: "",
  okul: "",
  konular: [],
  konuDiger: "",
  zorlayan: "",
  basvuran: "",
  iletisimAd: "",
  telefon: "",
  eposta: "",
  gunler: [],
  saatler: "",
  not: "",
  kvkkOnay: false,
};

const ALAN_ADIMI: Record<string, number> = {
  ogrenciAd: 0, yas: 0, sinif: 0, okul: 0,
  konular: 1, konuDiger: 1, zorlayan: 1,
  basvuran: 2, iletisimAd: 2, telefon: 2, eposta: 2,
  gunler: 3, saatler: 3, not: 3, kvkkOnay: 3,
};

type Hatalar = Partial<Record<keyof Durum, string>>;

const EPOSTA_DESENI = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function adimDogrula(adim: number, d: Durum): Hatalar {
  const h: Hatalar = {};
  if (adim === 0) {
    if (d.ogrenciAd.trim().length < 2) h.ogrenciAd = "Öğrencinin adını ve soyadını yazın.";
    const yas = Number(d.yas);
    if (d.yas.trim() === "" || !Number.isInteger(yas)) h.yas = "Yaşı sayı olarak yazın.";
    else if (yas < YAS_EN_AZ || yas > YAS_EN_COK) h.yas = `Yaş ${YAS_EN_AZ}–${YAS_EN_COK} arasında olmalı.`;
    if (!(SINIFLAR as readonly string[]).includes(d.sinif)) h.sinif = "Sınıf seçin.";
  }
  if (adim === 1) {
    if (d.konular.length === 0) h.konular = "En az bir konu seçin.";
  }
  if (adim === 2) {
    if (!d.basvuran) h.basvuran = "Başvuruyu kimin yaptığını seçin.";
    if (d.iletisimAd.trim().length < 2) h.iletisimAd = "Ad soyad yazın.";
    if (!d.telefon.trim()) h.telefon = "Telefon numarası gerekli.";
    else if (!telefonNormalle(d.telefon)) h.telefon = "Geçerli bir Türkiye telefon numarası yazın (örn. 05xx xxx xx xx).";
    if (!EPOSTA_DESENI.test(d.eposta.trim())) h.eposta = "Geçerli bir e-posta adresi yazın.";
  }
  if (adim === 3) {
    if (!d.kvkkOnay) h.kvkkOnay = "Devam etmek için kişisel veri bilgilendirmesini onaylayın.";
  }
  return h;
}

function yukKur(d: Durum) {
  return {
    ogrenciAd: d.ogrenciAd.trim(),
    yas: d.yas.trim(),
    sinif: d.sinif,
    okul: d.okul,
    konular: d.konular,
    konuDiger: d.konular.includes("Diğer") ? d.konuDiger : "",
    zorlayan: d.zorlayan,
    basvuran: d.basvuran,
    iletisimAd: d.iletisimAd.trim(),
    telefon: d.telefon.trim(),
    eposta: d.eposta.trim(),
    gunler: d.gunler,
    saatler: d.saatler,
    not: d.not,
    kvkkOnay: d.kvkkOnay,
  };
}

export default function KoclukFormu() {
  const [adim, setAdim] = useState(0);
  const [d, setD] = useState<Durum>(BASLANGIC);
  const [hatalar, setHatalar] = useState<Hatalar>({});
  const [genelHata, setGenelHata] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [tamamlandi, setTamamlandi] = useState(false);
  const kabuk = useRef<HTMLDivElement>(null);
  const tuzak = useRef<HTMLInputElement>(null);
  const kilit = useRef(false);
  const hizalanacak = useRef(false);

  useEffect(() => {
    if (!hizalanacak.current) return;
    hizalanacak.current = false;
    hizala(kabuk.current);
  }, [adim, tamamlandi]);

  function ayarla<K extends keyof Durum>(alan: K, deger: Durum[K]) {
    setD((x) => ({ ...x, [alan]: deger }));
    if (hatalar[alan]) setHatalar((h) => ({ ...h, [alan]: undefined }));
    if (genelHata) setGenelHata("");
  }

  function basvuranSec(v: string) {
    setD((x) => ({
      ...x,
      basvuran: v,
      iletisimAd: v === "ogrenci" && !x.iletisimAd.trim() ? x.ogrenciAd : x.iletisimAd,
    }));
    setHatalar((h) => ({ ...h, basvuran: undefined }));
  }

  function ilkHatayaOdaklan(h: Hatalar) {
    const ilk = Object.keys(h).find((k) => h[k as keyof Durum]);
    if (!ilk) return;
    requestAnimationFrame(() => {
      const kutu = kabuk.current?.querySelector<HTMLElement>(`[data-alan="${ilk}"]`);
      kutu?.querySelector<HTMLElement>("input, select, textarea")?.focus({ preventScroll: true });
      if (kutu) hizala(kutu, { bosluk: 24 });
    });
  }

  async function gonder() {
    if (kilit.current) return;
    const yuk = yukKur(d);
    const kontrol = KoclukSemasi.safeParse(yuk);
    if (!kontrol.success) {
      const h: Hatalar = {};
      let hedefAdim = ADIMLAR.length - 1;
      for (const i of kontrol.error.issues) {
        const alan = String(i.path[0] ?? "") as keyof Durum;
        if (alan && !h[alan]) h[alan] = i.message;
        if (alan in ALAN_ADIMI) hedefAdim = Math.min(hedefAdim, ALAN_ADIMI[alan]);
      }
      setHatalar(h);
      setAdim(hedefAdim);
      hizalanacak.current = true;
      return;
    }
    kilit.current = true;
    setGonderiliyor(true);
    setGenelHata("");
    try {
      const sonuc = await koclukBasvurusuGonder(yuk, tuzak.current?.value ?? "");
      if (sonuc.tamam) {
        setTamamlandi(true);
        hizalanacak.current = true;
      } else {
        setGenelHata(sonuc.hata);
      }
    } catch {
      setGenelHata(GENEL_HATA);
    } finally {
      kilit.current = false;
      setGonderiliyor(false);
    }
  }

  function ileri(e: React.FormEvent) {
    e.preventDefault();
    if (gonderiliyor) return;
    const h = adimDogrula(adim, d);
    if (Object.values(h).some(Boolean)) {
      setHatalar(h);
      ilkHatayaOdaklan(h);
      return;
    }
    setHatalar({});
    if (adim < ADIMLAR.length - 1) {
      setAdim(adim + 1);
      hizalanacak.current = true;
    } else {
      void gonder();
    }
  }

  function geri() {
    setHatalar({});
    setGenelHata("");
    setAdim((a) => Math.max(0, a - 1));
    hizalanacak.current = true;
  }

  if (tamamlandi) {
    return (
      <div className={s.kabuk} ref={kabuk}>
        <div className={s.kart}>
          <BasariEkrani />
        </div>
      </div>
    );
  }

  const veliMi = d.basvuran === "veli";

  return (
    <div className={s.kabuk} ref={kabuk}>
      <AdimGosterge adimlar={ADIMLAR} aktif={adim} />

      <form className={s.kart} onSubmit={ileri} noValidate>
        {adim === 0 && (
          <>
            <h2 className={s.kartBaslik}>Öğrenci Bilgileri</h2>
            <p className={s.kartAciklama}>Koçluk desteği alacak öğrenciyi tanıyalım.</p>
            <div className={s.alanlar}>
              <Alan id="ogrenciAd" etiket="Ad Soyad" zorunlu hata={hatalar.ogrenciAd}>
                <input
                  id="ogrenciAd"
                  className={s.girdi}
                  type="text"
                  autoComplete="off"
                  maxLength={120}
                  value={d.ogrenciAd}
                  onChange={(e) => ayarla("ogrenciAd", e.target.value)}
                  {...ariaBag("ogrenciAd", hatalar.ogrenciAd)}
                />
              </Alan>
              <div className={s.ikiSutun}>
                <Alan id="yas" etiket="Yaş" zorunlu hata={hatalar.yas}>
                  <input
                    id="yas"
                    className={`${s.girdi} ${s.girdiDar}`}
                    type="number"
                    inputMode="numeric"
                    min={YAS_EN_AZ}
                    max={YAS_EN_COK}
                    value={d.yas}
                    onChange={(e) => ayarla("yas", e.target.value)}
                    {...ariaBag("yas", hatalar.yas)}
                  />
                </Alan>
                <Alan id="sinif" etiket="Sınıf" zorunlu hata={hatalar.sinif}>
                  <select
                    id="sinif"
                    className={s.secimKutu}
                    value={d.sinif}
                    onChange={(e) => ayarla("sinif", e.target.value)}
                    {...ariaBag("sinif", hatalar.sinif)}
                  >
                    <option value="">Seçin</option>
                    {SINIFLAR.map((x) => (
                      <option key={x} value={x}>
                        {sinifEtiketi(x)}
                      </option>
                    ))}
                  </select>
                </Alan>
              </div>
              <Alan id="okul" etiket="Okul türü / okul bilgisi" ipucu="İsteğe bağlı · Örn. Anadolu lisesi, özel okul, okul adı">
                <input
                  id="okul"
                  className={s.girdi}
                  type="text"
                  maxLength={200}
                  value={d.okul}
                  onChange={(e) => ayarla("okul", e.target.value)}
                  aria-describedby="okul-ipucu"
                />
              </Alan>
            </div>
          </>
        )}

        {adim === 1 && (
          <>
            <h2 className={s.kartBaslik}>Hangi konularda destek almak istiyorsunuz?</h2>
            <p className={s.kartAciklama}>Birden fazla seçebilirsiniz; koçluk planını bu başlıklara göre kuracağız.</p>
            <div className={s.alanlar}>
              <Alan id="konular" etiket="Destek konuları" zorunlu hata={hatalar.konular} grup>
                <OnayKartlar
                  ad="konular"
                  secenekler={KOCLUK_KONULARI.map((x) => ({ deger: x, etiket: x }))}
                  deger={d.konular}
                  onChange={(v) => ayarla("konular", v)}
                  hata={hatalar.konular}
                />
              </Alan>
              {d.konular.includes("Diğer") && (
                <Alan id="konuDiger" etiket="Diğer konu" ipucu="İsteğe bağlı">
                  <input id="konuDiger" className={s.girdi} type="text" maxLength={200} value={d.konuDiger} onChange={(e) => ayarla("konuDiger", e.target.value)} />
                </Alan>
              )}
              <Alan id="zorlayan" etiket="Şu anda seni en çok zorlayan konu nedir?" ipucu="İsteğe bağlı · birkaç cümle yeter">
                <textarea
                  id="zorlayan"
                  className={s.cokMetin}
                  rows={4}
                  maxLength={2000}
                  value={d.zorlayan}
                  onChange={(e) => ayarla("zorlayan", e.target.value)}
                  aria-describedby="zorlayan-ipucu"
                />
              </Alan>
            </div>
          </>
        )}

        {adim === 2 && (
          <>
            <h2 className={s.kartBaslik}>İletişim</h2>
            <p className={s.kartAciklama}>Başvurunuzla ilgili size bu bilgilerden ulaşacağız.</p>
            <div className={s.alanlar}>
              <Alan id="basvuran" etiket="Başvuruyu yapan kişi" zorunlu hata={hatalar.basvuran} grup>
                <RadyoKartlar
                  ad="basvuran"
                  secenekler={[
                    { deger: "veli", etiket: BASVURAN_ETIKETLERI.veli },
                    { deger: "ogrenci", etiket: BASVURAN_ETIKETLERI.ogrenci },
                  ]}
                  deger={d.basvuran}
                  onChange={basvuranSec}
                  hata={hatalar.basvuran}
                />
              </Alan>
              {d.basvuran && (
                <>
                  <Alan id="iletisimAd" etiket={veliMi ? "Veli Ad Soyad" : "Ad Soyad"} zorunlu hata={hatalar.iletisimAd}>
                    <input
                      id="iletisimAd"
                      className={s.girdi}
                      type="text"
                      autoComplete="name"
                      maxLength={120}
                      value={d.iletisimAd}
                      onChange={(e) => ayarla("iletisimAd", e.target.value)}
                      {...ariaBag("iletisimAd", hatalar.iletisimAd)}
                    />
                  </Alan>
                  <div className={s.ikiSutun}>
                    <Alan id="telefon" etiket="Telefon" zorunlu hata={hatalar.telefon} ipucu="Örn. 05xx xxx xx xx">
                      <input
                        id="telefon"
                        className={s.girdi}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={24}
                        placeholder="05xx xxx xx xx"
                        value={d.telefon}
                        onChange={(e) => ayarla("telefon", e.target.value)}
                        {...ariaBag("telefon", hatalar.telefon, "Örn. 05xx xxx xx xx")}
                      />
                    </Alan>
                    <Alan id="eposta" etiket="E-posta" zorunlu hata={hatalar.eposta}>
                      <input
                        id="eposta"
                        className={s.girdi}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        maxLength={254}
                        value={d.eposta}
                        onChange={(e) => ayarla("eposta", e.target.value)}
                        {...ariaBag("eposta", hatalar.eposta)}
                      />
                    </Alan>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {adim === 3 && (
          <>
            <h2 className={s.kartBaslik}>Uygunluk</h2>
            <p className={s.kartAciklama}>Görüşme ve koçluk seansları için uygun zamanlarınızı belirtin.</p>
            <div className={s.alanlar}>
              <Alan id="gunler" etiket="Uygun günler" ipucu="Birden fazla seçebilirsiniz." grup>
                <Cipler ad="gunler" secenekler={GUNLER} deger={d.gunler} onChange={(v) => ayarla("gunler", v)} />
              </Alan>
              <Alan id="saatler" etiket="Uygun saatler">
                <input
                  id="saatler"
                  className={s.girdi}
                  type="text"
                  maxLength={300}
                  placeholder="Örn. Hafta içi 18.00 sonrası, hafta sonu öğleden sonra"
                  value={d.saatler}
                  onChange={(e) => ayarla("saatler", e.target.value)}
                />
              </Alan>
              <Alan id="not" etiket="Eklemek istediğiniz not" ipucu="İsteğe bağlı · en fazla 3.000 karakter">
                <textarea id="not" className={s.cokMetin} rows={5} maxLength={3000} value={d.not} onChange={(e) => ayarla("not", e.target.value)} aria-describedby="not-ipucu" />
              </Alan>
              <KvkkOnay id="kvkkOnay" deger={d.kvkkOnay} onChange={(v) => ayarla("kvkkOnay", v)} hata={hatalar.kvkkOnay} />
            </div>
          </>
        )}

        <div className={s.tuzak} aria-hidden="true">
          <label htmlFor="kocluk-sirket">Şirket</label>
          <input id="kocluk-sirket" ref={tuzak} type="text" name="sirket" tabIndex={-1} autoComplete="off" />
        </div>

        <FormHata mesaj={genelHata} />

        <Gezinme
          geri={adim > 0 ? geri : undefined}
          sonAdim={adim === ADIMLAR.length - 1}
          gonderiliyor={gonderiliyor}
          gonderMetni="Eğitim Koçluğu Başvurusunu Gönder"
        />
      </form>
    </div>
  );
}
