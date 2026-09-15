"use client";

/* Özel Ders Başvuru Formu — dört adım: öğrenci → eğitim → iletişim → zaman.
   Yaş/sınıfa göre yalnız uygun eğitimler gösterilir (lib/egitim-basvurusu
   kuralları); sunucu aynı kuralla yeniden doğrular. Gönderim tek seferlik,
   başarıda aynı sayfada başarı ekranı. */

import { useEffect, useRef, useState } from "react";
import { hizala } from "@/lib/kaydirma";
import {
  BASVURAN_ETIKETLERI,
  DIL_AMACLARI,
  DIL_SEVIYELERI,
  DIN_IHTIYACLARI,
  EGITIM_ACIKLAMALARI,
  EGITIM_ETIKETLERI,
  GENEL_HATA,
  GUNLER,
  ILKOKUL_DERSLERI,
  OzelDersSemasi,
  SINIFLAR,
  YAS_EN_AZ,
  YAS_EN_COK,
  sinifEtiketi,
  telefonNormalle,
  uygunEgitimler,
  type Sinif,
} from "@/lib/egitim-basvurusu";
import { ozelDersBasvurusuGonder } from "./actions";
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

const ADIMLAR = ["Öğrenci Bilgileri", "Eğitim Seçimi", "İletişim", "Ders Zamanı"] as const;

type Durum = {
  ogrenciAd: string;
  yas: string;
  sinif: string;
  egitim: string;
  seviye: string;
  amac: string;
  amacDiger: string;
  dersler: string[];
  dersDiger: string;
  ihtiyac: string;
  ihtiyacDiger: string;
  basvuran: string;
  iletisimAd: string;
  telefon: string;
  eposta: string;
  gunler: string[];
  saatler: string;
  ekBilgi: string;
  kvkkOnay: boolean;
};

const BASLANGIC: Durum = {
  ogrenciAd: "",
  yas: "",
  sinif: "",
  egitim: "",
  seviye: "",
  amac: "",
  amacDiger: "",
  dersler: [],
  dersDiger: "",
  ihtiyac: "",
  ihtiyacDiger: "",
  basvuran: "",
  iletisimAd: "",
  telefon: "",
  eposta: "",
  gunler: [],
  saatler: "",
  ekBilgi: "",
  kvkkOnay: false,
};

/** Alan → adım eşlemesi; sunucu/zod hatasında ilgili adıma dönmek için */
const ALAN_ADIMI: Record<string, number> = {
  ogrenciAd: 0, yas: 0, sinif: 0,
  egitim: 1, seviye: 1, amac: 1, amacDiger: 1, dersler: 1, dersDiger: 1, ihtiyac: 1, ihtiyacDiger: 1,
  basvuran: 2, iletisimAd: 2, telefon: 2, eposta: 2,
  gunler: 3, saatler: 3, ekBilgi: 3, kvkkOnay: 3,
};

type Hatalar = Partial<Record<keyof Durum, string>>;

const EPOSTA_DESENI = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function dilMi(e: string): boolean {
  return e === "ingilizce" || e === "almanca";
}

/** Girilen yaş/sınıf geçerliyse uygun eğitimler; değilse boş liste */
function uygunlariBul(yas: string, sinif: string) {
  const yasNo = Number(yas);
  if (!(SINIFLAR as readonly string[]).includes(sinif) || yas.trim() === "" || !Number.isInteger(yasNo)) return [];
  return uygunEgitimler(yasNo, sinif as Sinif);
}

/** Adım bazlı istemci doğrulaması — kurallar sunucudaki zod şemasıyla aynı. */
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
    const uygunlar = uygunEgitimler(Number(d.yas), d.sinif as Sinif) as string[];
    if (!uygunlar.includes(d.egitim)) h.egitim = "Bir eğitim seçin.";
    else if (dilMi(d.egitim)) {
      if (!d.seviye) h.seviye = "Mevcut seviyeyi seçin.";
      if (!d.amac) h.amac = "Dersi alma amacını seçin.";
    } else if (d.egitim === "ilkokul_destek") {
      if (d.dersler.length === 0) h.dersler = "En az bir ders seçin.";
    } else if (d.egitim === "din_kuran") {
      if (!d.ihtiyac) h.ihtiyac = "İhtiyaç alanını seçin.";
    }
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

/** Sunucuya gidecek yük: yalnız seçilen eğitime ait dinamik alanlar taşınır. */
function yukKur(d: Durum) {
  return {
    ogrenciAd: d.ogrenciAd.trim(),
    yas: d.yas.trim(),
    sinif: d.sinif,
    egitim: d.egitim,
    seviye: dilMi(d.egitim) && d.seviye ? d.seviye : undefined,
    amac: dilMi(d.egitim) && d.amac ? d.amac : undefined,
    amacDiger: dilMi(d.egitim) && d.amac === "Diğer" ? d.amacDiger : "",
    dersler: d.egitim === "ilkokul_destek" ? d.dersler : [],
    dersDiger: d.egitim === "ilkokul_destek" && d.dersler.includes("Diğer") ? d.dersDiger : "",
    ihtiyac: d.egitim === "din_kuran" && d.ihtiyac ? d.ihtiyac : undefined,
    ihtiyacDiger: d.egitim === "din_kuran" && d.ihtiyac === "Diğer" ? d.ihtiyacDiger : "",
    basvuran: d.basvuran,
    iletisimAd: d.iletisimAd.trim(),
    telefon: d.telefon.trim(),
    eposta: d.eposta.trim(),
    gunler: d.gunler,
    saatler: d.saatler,
    ekBilgi: d.ekBilgi,
    kvkkOnay: d.kvkkOnay,
  };
}

export default function OzelDersFormu() {
  const [adim, setAdim] = useState(0);
  const [d, setD] = useState<Durum>(BASLANGIC);
  const [hatalar, setHatalar] = useState<Hatalar>({});
  const [genelHata, setGenelHata] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [tamamlandi, setTamamlandi] = useState(false);
  const kabuk = useRef<HTMLDivElement>(null);
  const tuzak = useRef<HTMLInputElement>(null);
  const kilit = useRef(false); // çift gönderim kilidi (state'ten bağımsız, anlık)
  const hizalanacak = useRef(false);

  /* Adım değiştikten sonra kullanıcıyı formun başına hizala (tepeye fırlatma yok) */
  useEffect(() => {
    if (!hizalanacak.current) return;
    hizalanacak.current = false;
    hizala(kabuk.current);
  }, [adim, tamamlandi]);

  const uygunlar = uygunlariBul(d.yas, d.sinif);

  function ayarla<K extends keyof Durum>(alan: K, deger: Durum[K]) {
    setD((x) => {
      const yeni = { ...x, [alan]: deger };
      /* Yaş/sınıf sonradan değişip seçili eğitim uygunluğunu yitirirse seçim düşer;
         istemcide gizlenen eğitim sunucuda da reddedilir (aynı kural). */
      if ((alan === "yas" || alan === "sinif") && yeni.egitim) {
        const uygun = uygunlariBul(yeni.yas, yeni.sinif) as string[];
        if (!uygun.includes(yeni.egitim)) yeni.egitim = "";
      }
      return yeni;
    });
    if (hatalar[alan]) setHatalar((h) => ({ ...h, [alan]: undefined }));
    if (genelHata) setGenelHata("");
  }

  function basvuranSec(v: string) {
    setD((x) => ({
      ...x,
      basvuran: v,
      // Öğrenci kendisi başvuruyorsa ad alanı öğrencinin adıyla ön-doldurulur (değiştirilebilir)
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
    // Son emniyet: tüm şema istemcide de çalışır; hata varsa ilgili adıma dön
    const kontrol = OzelDersSemasi.safeParse(yuk);
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
      const sonuc = await ozelDersBasvurusuGonder(yuk, tuzak.current?.value ?? "");
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
        {/* ── 1. Öğrenci bilgileri ── */}
        {adim === 0 && (
          <>
            <h2 className={s.kartBaslik}>Öğrenci Bilgileri</h2>
            <p className={s.kartAciklama}>Dersi alacak öğrenciyi tanıyalım; uygun eğitimleri buna göre göstereceğiz.</p>
            <div className={s.alanlar}>
              <Alan id="ogrenciAd" etiket="Öğrencinin Adı Soyadı" zorunlu hata={hatalar.ogrenciAd}>
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
                <Alan id="yas" etiket="Yaşı" zorunlu hata={hatalar.yas}>
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
                <Alan id="sinif" etiket="Eğitim Düzeyi / Sınıfı" zorunlu hata={hatalar.sinif}>
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
            </div>
          </>
        )}

        {/* ── 2. Eğitim seçimi ── */}
        {adim === 1 && (
          <>
            <h2 className={s.kartBaslik}>Hangi eğitim için başvurmak istiyorsunuz?</h2>
            <p className={s.kartAciklama}>
              {d.yas} yaş, {sinifEtiketi(d.sinif)} için uygun eğitimler listelenir.
            </p>
            <div className={s.alanlar}>
              <Alan id="egitim" etiket="Eğitim" zorunlu hata={hatalar.egitim} grup>
                {uygunlar.length ? (
                  <RadyoKartlar
                    ad="egitim"
                    secenekler={uygunlar.map((e) => ({ deger: e, etiket: EGITIM_ETIKETLERI[e], aciklama: EGITIM_ACIKLAMALARI[e] }))}
                    deger={d.egitim}
                    onChange={(v) => ayarla("egitim", v)}
                    hata={hatalar.egitim}
                    tekSutun
                  />
                ) : (
                  <p className={s.bilgiKutu}>
                    Bu yaş ve sınıf için listelenen bir eğitim bulunmuyor. Bilgileri kontrol etmek için geri dönebilir ya da{" "}
                    <a href="/iletisim">iletişim formundan</a> bize yazabilirsiniz.
                  </p>
                )}
              </Alan>

              {dilMi(d.egitim) && (
                <>
                  <Alan id="seviye" etiket="Mevcut seviyenizi biliyor musunuz?" zorunlu hata={hatalar.seviye} grup>
                    <RadyoKartlar
                      ad="seviye"
                      secenekler={DIL_SEVIYELERI.map((x) => ({ deger: x, etiket: x }))}
                      deger={d.seviye}
                      onChange={(v) => ayarla("seviye", v)}
                      hata={hatalar.seviye}
                    />
                  </Alan>
                  <Alan id="amac" etiket="Dersi alma amacı" zorunlu hata={hatalar.amac} grup>
                    <RadyoKartlar
                      ad="amac"
                      secenekler={DIL_AMACLARI.map((x) => ({ deger: x, etiket: x }))}
                      deger={d.amac}
                      onChange={(v) => ayarla("amac", v)}
                      hata={hatalar.amac}
                    />
                  </Alan>
                  {d.amac === "Diğer" && (
                    <Alan id="amacDiger" etiket="Amacınızı kısaca yazın" ipucu="İsteğe bağlı">
                      <input id="amacDiger" className={s.girdi} type="text" maxLength={200} value={d.amacDiger} onChange={(e) => ayarla("amacDiger", e.target.value)} />
                    </Alan>
                  )}
                </>
              )}

              {d.egitim === "ilkokul_destek" && (
                <>
                  <Alan id="dersler" etiket="Hangi derslerde destek almak istiyorsunuz?" zorunlu ipucu="Birden fazla seçebilirsiniz." hata={hatalar.dersler} grup>
                    <OnayKartlar
                      ad="dersler"
                      secenekler={ILKOKUL_DERSLERI.map((x) => ({ deger: x, etiket: x }))}
                      deger={d.dersler}
                      onChange={(v) => ayarla("dersler", v)}
                      hata={hatalar.dersler}
                    />
                  </Alan>
                  {d.dersler.includes("Diğer") && (
                    <Alan id="dersDiger" etiket="Diğer ders" ipucu="İsteğe bağlı">
                      <input id="dersDiger" className={s.girdi} type="text" maxLength={200} value={d.dersDiger} onChange={(e) => ayarla("dersDiger", e.target.value)} />
                    </Alan>
                  )}
                </>
              )}

              {d.egitim === "din_kuran" && (
                <>
                  <Alan id="ihtiyac" etiket="İhtiyaç alanı" zorunlu hata={hatalar.ihtiyac} grup>
                    <RadyoKartlar
                      ad="ihtiyac"
                      secenekler={DIN_IHTIYACLARI.map((x) => ({ deger: x, etiket: x }))}
                      deger={d.ihtiyac}
                      onChange={(v) => ayarla("ihtiyac", v)}
                      hata={hatalar.ihtiyac}
                    />
                  </Alan>
                  {d.ihtiyac === "Diğer" && (
                    <Alan id="ihtiyacDiger" etiket="İhtiyacınızı kısaca yazın" ipucu="İsteğe bağlı">
                      <input id="ihtiyacDiger" className={s.girdi} type="text" maxLength={200} value={d.ihtiyacDiger} onChange={(e) => ayarla("ihtiyacDiger", e.target.value)} />
                    </Alan>
                  )}
                </>
              )}

              {d.egitim === "degerler" && (
                <p className={s.bilgiKutu}>
                  Değerler eğitimi için ek bir soru yok. Paylaşmak istediğiniz ayrıntıları son adımdaki açıklama alanına yazabilirsiniz.
                </p>
              )}
            </div>
          </>
        )}

        {/* ── 3. İletişim ── */}
        {adim === 2 && (
          <>
            <h2 className={s.kartBaslik}>İletişim Bilgileri</h2>
            <p className={s.kartAciklama}>Başvurunuzla ilgili size bu bilgilerden ulaşacağız.</p>
            <div className={s.alanlar}>
              <Alan id="basvuran" etiket="Başvuruyu kim yapıyor?" zorunlu hata={hatalar.basvuran} grup>
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
                    <Alan id="telefon" etiket="Telefon Numarası" zorunlu hata={hatalar.telefon} ipucu="Örn. 05xx xxx xx xx">
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
                    <Alan id="eposta" etiket="E-posta Adresi" zorunlu hata={hatalar.eposta}>
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

        {/* ── 4. Ders zamanı + ek bilgi + onay ── */}
        {adim === 3 && (
          <>
            <h2 className={s.kartBaslik}>Ders Zamanı</h2>
            <p className={s.kartAciklama}>Uygun olduğunuz zamanları belirtin; ders planını buna göre önereceğiz.</p>
            <div className={s.alanlar}>
              <Alan id="gunler" etiket="Uygun olduğunuz günler" ipucu="Birden fazla seçebilirsiniz." grup>
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
              <Alan id="ekBilgi" etiket="Eklemek istediğiniz bir bilgi var mı?" ipucu="İsteğe bağlı · en fazla 3.000 karakter">
                <textarea
                  id="ekBilgi"
                  className={s.cokMetin}
                  rows={5}
                  maxLength={3000}
                  value={d.ekBilgi}
                  onChange={(e) => ayarla("ekBilgi", e.target.value)}
                />
              </Alan>
              <KvkkOnay id="kvkkOnay" deger={d.kvkkOnay} onChange={(v) => ayarla("kvkkOnay", v)} hata={hatalar.kvkkOnay} />
            </div>
          </>
        )}

        {/* Bot tuzağı: gerçek kullanıcı görmez ve doldurmaz */}
        <div className={s.tuzak} aria-hidden="true">
          <label htmlFor="ozel-ders-sirket">Şirket</label>
          <input id="ozel-ders-sirket" ref={tuzak} type="text" name="sirket" tabIndex={-1} autoComplete="off" />
        </div>

        <FormHata mesaj={genelHata} />

        <Gezinme
          geri={adim > 0 ? geri : undefined}
          sonAdim={adim === ADIMLAR.length - 1}
          gonderiliyor={gonderiliyor}
          gonderMetni="Özel Ders Başvurusunu Gönder"
        />
      </form>
    </div>
  );
}
