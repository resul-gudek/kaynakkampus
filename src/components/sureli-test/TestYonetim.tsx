"use client";

/* ⏱️ Öğretmen: süreli test oluşturma + test bankası + atama.

   Soru sayısı girildiğinde soru blokları otomatik o sayıya çekilir
   (SureliTestSemasi soru sayısı ile soru satırı sayısının eşitliğini zorlar).
   Doğru cevap her soru için şık listesinden radyo ile seçilir. */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TEST_MAX_SORU, TEST_MAX_SURE, TEST_SECENEKLERI, SINIF_SEVIYELERI } from "@/lib/sabitler";
import { tarihStr } from "@/lib/hesap";
import { sureEtiketi } from "@/lib/sureli-test";
import { testAktiflik, testAta, testAtamaSil, testOlustur, testSil } from "@/actions/sureli-test";
import { TEST_DURUM_ETIKETLERI, type KocTestS, type OgrenciSecenek } from "./tipler";
import s from "./test.module.css";

/** Formdaki tek soru satırı */
interface SoruTaslak {
  metin: string;
  secenekler: string[];
  dogru: string;
}

const VARSAYILAN_SECENEK = 4;

function bosSoru(): SoruTaslak {
  return { metin: "", secenekler: Array(VARSAYILAN_SECENEK).fill(""), dogru: "A" };
}

export default function TestYonetim({
  testler,
  ogrenciler,
}: {
  testler: KocTestS[];
  ogrenciler: OgrenciSecenek[];
}) {
  const router = useRouter();
  const [bekliyor, baslat] = useTransition();
  const [formAcik, setFormAcik] = useState(false);
  const [hata, setHata] = useState("");

  /* ── Form durumu ── */
  const [ad, setAd] = useState("");
  const [ders, setDers] = useState("");
  const [konu, setKonu] = useState("");
  const [seviye, setSeviye] = useState("");
  const [sure, setSure] = useState(20);
  const [sonTarih, setSonTarih] = useState("");
  const [sorular, setSorular] = useState<SoruTaslak[]>([bosSoru()]);
  const [secilenler, setSecilenler] = useState<string[]>([]);

  function formuSifirla() {
    setAd("");
    setDers("");
    setKonu("");
    setSeviye("");
    setSure(20);
    setSonTarih("");
    setSorular([bosSoru()]);
    setSecilenler([]);
    setHata("");
  }

  /** Soru sayısı alanı: blok sayısını girilen değere çeker.
      Alan boşaltıldığında bloklar korunur; dolu soru silinecekse onay istenir. */
  function soruSayisiDegis(deger: string) {
    const ham = Number(deger);
    if (!Number.isFinite(ham) || ham < 1) return;
    const n = Math.min(TEST_MAX_SORU, Math.floor(ham));
    if (n === sorular.length) return;
    if (n > sorular.length) {
      setSorular([...sorular, ...Array.from({ length: n - sorular.length }, bosSoru)]);
      return;
    }
    const doluVar = sorular
      .slice(n)
      .some((x) => x.metin.trim() !== "" || x.secenekler.some((sc) => sc.trim() !== ""));
    if (
      doluVar &&
      !confirm(`Soru sayısını ${n}'e düşürmek son ${sorular.length - n} soruyu silecek. Devam edilsin mi?`)
    ) {
      return;
    }
    setSorular(sorular.slice(0, n));
  }

  function soruDegis(i: number, yama: Partial<SoruTaslak>) {
    setSorular((mevcut) => mevcut.map((x, j) => (j === i ? { ...x, ...yama } : x)));
  }

  function secenekDegis(soruSira: number, secenekSira: number, deger: string) {
    setSorular((mevcut) =>
      mevcut.map((x, j) =>
        j === soruSira
          ? { ...x, secenekler: x.secenekler.map((sc, k) => (k === secenekSira ? deger : sc)) }
          : x
      )
    );
  }

  function secenekEkle(i: number) {
    setSorular((mevcut) =>
      mevcut.map((x, j) =>
        j === i && x.secenekler.length < TEST_SECENEKLERI.length
          ? { ...x, secenekler: [...x.secenekler, ""] }
          : x
      )
    );
  }

  function secenekCikar(i: number) {
    setSorular((mevcut) =>
      mevcut.map((x, j) => {
        if (j !== i || x.secenekler.length <= 2) return x;
        const yeni = x.secenekler.slice(0, -1);
        // Doğru cevap silinen şıkka bakıyorsa son geçerli şıkka çekilir
        const dogruSira = TEST_SECENEKLERI.indexOf(x.dogru as (typeof TEST_SECENEKLERI)[number]);
        const dogru = dogruSira >= yeni.length ? TEST_SECENEKLERI[yeni.length - 1] : x.dogru;
        return { ...x, secenekler: yeni, dogru };
      })
    );
  }

  function ogrenciDegis(id: string) {
    setSecilenler((mevcut) =>
      mevcut.includes(id) ? mevcut.filter((x) => x !== id) : [...mevcut, id]
    );
  }

  function gonder(e: React.FormEvent) {
    e.preventDefault();
    setHata("");
    baslat(async () => {
      const sonuc = await testOlustur({
        ad,
        ders,
        konu,
        seviye,
        soruSayisi: sorular.length,
        sure,
        sorular,
        ogrenciIdler: secilenler,
        sonTarih: sonTarih || null,
      });
      if (sonuc.hata) {
        setHata(sonuc.hata);
        return;
      }
      formuSifirla();
      setFormAcik(false);
      router.refresh();
    });
  }

  function sil(t: KocTestS) {
    const uyari = t.cozenSayisi
      ? `"${t.ad}" testi ve ${t.cozenSayisi} öğrenci sonucu silinsin mi? Bu işlem geri alınamaz.`
      : `"${t.ad}" testi silinsin mi?`;
    if (!confirm(uyari)) return;
    baslat(async () => {
      const sonuc = await testSil(t.id);
      if (sonuc.hata) alert(sonuc.hata);
      else router.refresh();
    });
  }

  function aktiflikDegis(t: KocTestS) {
    baslat(async () => {
      const sonuc = await testAktiflik(t.id, !t.aktif);
      if (sonuc.hata) alert(sonuc.hata);
      else router.refresh();
    });
  }

  return (
    <>
      {/* ── Test oluşturma ── */}
      <section className={s.bolum}>
        <div className={s.bolumBas}>
          <h2>⏱️ Süreli Testler</h2>
          <button
            type="button"
            className="btn btn-primary btn-kucuk"
            onClick={() => setFormAcik((x) => !x)}
          >
            {formAcik ? "Vazgeç" : "+ Yeni Test Oluştur"}
          </button>
        </div>

        {formAcik && (
          <form className={s.kutuForm} onSubmit={gonder}>
            {hata && <p className={s.formHata}>{hata}</p>}

            <div className={s.formIzgara}>
              <div className={s.formGrup}>
                <label htmlFor="test-ad">Test Adı</label>
                <input
                  id="test-ad"
                  value={ad}
                  onChange={(e) => setAd(e.target.value)}
                  required
                  placeholder="Örn. Limit Deneme Testi"
                />
              </div>
              <div className={s.formGrup}>
                <label htmlFor="test-ders">Ders</label>
                <input
                  id="test-ders"
                  value={ders}
                  onChange={(e) => setDers(e.target.value)}
                  required
                  placeholder="Örn. Matematik"
                />
              </div>
              <div className={s.formGrup}>
                <label htmlFor="test-konu">Konu</label>
                <input
                  id="test-konu"
                  value={konu}
                  onChange={(e) => setKonu(e.target.value)}
                  placeholder="Örn. Limit"
                />
              </div>
              <div className={s.formGrup}>
                <label htmlFor="test-seviye">Sınıf Seviyesi</label>
                <select id="test-seviye" value={seviye} onChange={(e) => setSeviye(e.target.value)}>
                  <option value="">Seçilmedi</option>
                  {Object.entries(SINIF_SEVIYELERI).map(([grup, siniflar]) => (
                    <optgroup key={grup} label={grup[0].toLocaleUpperCase("tr-TR") + grup.slice(1)}>
                      {siniflar.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className={s.formGrup}>
                <label htmlFor="test-soru">Soru Sayısı</label>
                <input
                  id="test-soru"
                  type="number"
                  min={1}
                  max={TEST_MAX_SORU}
                  value={sorular.length}
                  onChange={(e) => soruSayisiDegis(e.target.value)}
                  required
                />
              </div>
              <div className={s.formGrup}>
                <label htmlFor="test-sure">Test Süresi (dakika)</label>
                <input
                  id="test-sure"
                  type="number"
                  min={1}
                  max={TEST_MAX_SURE}
                  value={sure}
                  onChange={(e) => setSure(Number(e.target.value))}
                  required
                />
              </div>
              <div className={s.formGrup}>
                <label htmlFor="test-tarih">Son Tarih (opsiyonel)</label>
                <input
                  id="test-tarih"
                  type="date"
                  value={sonTarih}
                  onChange={(e) => setSonTarih(e.target.value)}
                />
              </div>
            </div>

            {/* ── Sorular ── */}
            <p className={s.formBaslik}>Sorular ve doğru cevaplar</p>
            {sorular.map((soru, i) => (
              <div key={i} className={s.soruKutu}>
                <div className={s.soruKutuBas}>
                  <b>{i + 1}. Soru</b>
                  <span className={s.kayitDurum}>Doğru cevap: {soru.dogru}</span>
                </div>
                <div className={s.formGrup} style={{ marginBottom: 10 }}>
                  <textarea
                    rows={2}
                    value={soru.metin}
                    onChange={(e) => soruDegis(i, { metin: e.target.value })}
                    required
                    placeholder="Soru metni…"
                    aria-label={`${i + 1}. soru metni`}
                  />
                </div>
                {soru.secenekler.map((secenek, k) => {
                  const harf = TEST_SECENEKLERI[k];
                  const dogruMu = soru.dogru === harf;
                  return (
                    <div key={k} className={s.secenekSatir}>
                      <span className={s.secenekHarf}>{harf}</span>
                      <input
                        type="text"
                        value={secenek}
                        onChange={(e) => secenekDegis(i, k, e.target.value)}
                        required
                        placeholder={`${harf} şıkkı`}
                        aria-label={`${i + 1}. soru ${harf} şıkkı`}
                      />
                      <label className={`${s.dogruEtiket} ${dogruMu ? s.isaretli : ""}`}>
                        <input
                          type="radio"
                          name={`dogru-${i}`}
                          checked={dogruMu}
                          onChange={() => soruDegis(i, { dogru: harf })}
                        />
                        Doğru
                      </label>
                    </div>
                  );
                })}
                <div className={s.butonlar}>
                  {soru.secenekler.length < TEST_SECENEKLERI.length && (
                    <button
                      type="button"
                      className="btn btn-outline btn-kucuk"
                      onClick={() => secenekEkle(i)}
                    >
                      + Şık ekle
                    </button>
                  )}
                  {soru.secenekler.length > 2 && (
                    <button
                      type="button"
                      className="btn btn-outline btn-kucuk"
                      onClick={() => secenekCikar(i)}
                    >
                      − Şık çıkar
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* ── Atama ── */}
            <p className={s.formBaslik}>Testi atayacağın öğrenciler</p>
            {ogrenciler.length ? (
              <div className={s.ogrenciSecim}>
                {ogrenciler.map((o) => (
                  <label
                    key={o.id}
                    className={`${s.ogrenciCip} ${secilenler.includes(o.id) ? s.isaretli : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={secilenler.includes(o.id)}
                      onChange={() => ogrenciDegis(o.id)}
                    />
                    {o.ad}
                    {o.sinif ? ` · ${o.sinif}` : ""}
                  </label>
                ))}
              </div>
            ) : (
              <p className={s.notMetin}>Henüz öğrenciniz yok; testi sonra atayabilirsiniz.</p>
            )}

            <div className={s.formAlt}>
              <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
                {bekliyor ? "Kaydediliyor…" : "Testi Kaydet"}
              </button>
              <span className={s.kayitDurum}>
                {sorular.length} soru · {sureEtiketi(sure)}
                {secilenler.length ? ` · ${secilenler.length} öğrenciye atanacak` : ""}
              </span>
            </div>
          </form>
        )}

        {/* ── Test bankası ── */}
        {testler.length ? (
          <div className={s.kartlar}>
            {testler.map((t) => (
              <article key={t.id} className={s.kart}>
                <div className={s.kartBas}>
                  <div>
                    <b>{t.ad}</b>
                    <small>
                      {t.ders}
                      {t.konu ? ` – ${t.konu}` : ""}
                    </small>
                  </div>
                  {!t.aktif && <span className={`${s.rozet} ${s.rozetPasif}`}>Pasif</span>}
                </div>
                <div className={s.meta}>
                  <span className="tag">📝 {t.soruSayisi} soru</span>
                  <span className="tag">⏱️ {sureEtiketi(t.sure)}</span>
                  {t.seviye && <span className="tag">🎓 {t.seviye}</span>}
                  <span className="tag">👥 {t.atamalar.length} öğrenci</span>
                  <span className="tag">✅ {t.cozenSayisi} çözüm</span>
                </div>

                <AtamaBolumu test={t} ogrenciler={ogrenciler} />

                <div className={s.butonlar}>
                  <button
                    type="button"
                    className="btn btn-outline btn-kucuk"
                    disabled={bekliyor}
                    onClick={() => aktiflikDegis(t)}
                  >
                    {t.aktif ? "Çözüme Kapat" : "Çözüme Aç"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-kucuk"
                    disabled={bekliyor}
                    onClick={() => sil(t)}
                  >
                    Sil
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className={s.bosMesaj}>
            Henüz süreli test oluşturmadınız. &quot;Yeni Test Oluştur&quot; ile başlayın.
          </p>
        )}
      </section>
    </>
  );
}

/* ── Test kartı içindeki atama listesi + yeni atama ── */
function AtamaBolumu({
  test,
  ogrenciler,
}: {
  test: KocTestS;
  ogrenciler: OgrenciSecenek[];
}) {
  const router = useRouter();
  const [bekliyor, baslat] = useTransition();
  const [acik, setAcik] = useState(false);
  const [secilenler, setSecilenler] = useState<string[]>([]);
  const [sonTarih, setSonTarih] = useState("");

  const atanmayanlar = ogrenciler.filter(
    (o) => !test.atamalar.some((a) => a.ogrenciId === o.id)
  );

  function ata() {
    if (!secilenler.length) return;
    baslat(async () => {
      const sonuc = await testAta({ testId: test.id, ogrenciIdler: secilenler, sonTarih: sonTarih || null });
      if (sonuc.hata) {
        alert(sonuc.hata);
        return;
      }
      setSecilenler([]);
      setSonTarih("");
      setAcik(false);
      router.refresh();
    });
  }

  function atamayiKaldir(atamaId: string, ogrenciAd: string) {
    if (!confirm(`${ogrenciAd} için bu test ataması kaldırılsın mı?`)) return;
    baslat(async () => {
      const sonuc = await testAtamaSil(atamaId);
      if (sonuc.hata) alert(sonuc.hata);
      else router.refresh();
    });
  }

  return (
    <div>
      {test.atamalar.length ? (
        <div className={s.ogrenciSecim}>
          {test.atamalar.map((a) => (
            <span key={a.id} className={s.ogrenciCip}>
              {a.ogrenciAd}
              <span className={s.griYazi}>· {TEST_DURUM_ETIKETLERI[a.durum]}</span>
              {!!a.sonTarih && <span className={s.griYazi}>· {tarihStr(a.sonTarih)}</span>}
              <button
                type="button"
                className={s.silBtn}
                title="Atamayı kaldır"
                disabled={bekliyor}
                onClick={() => atamayiKaldir(a.id, a.ogrenciAd)}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className={s.notMetin}>Bu test henüz kimseye atanmadı.</p>
      )}

      {atanmayanlar.length > 0 && (
        <>
          <div className={s.butonlar}>
            <button
              type="button"
              className="btn btn-outline btn-kucuk"
              onClick={() => setAcik((x) => !x)}
            >
              {acik ? "Vazgeç" : "+ Öğrenciye Ata"}
            </button>
          </div>
          {acik && (
            <div style={{ marginTop: 10 }}>
              <div className={s.ogrenciSecim}>
                {atanmayanlar.map((o) => (
                  <label
                    key={o.id}
                    className={`${s.ogrenciCip} ${secilenler.includes(o.id) ? s.isaretli : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={secilenler.includes(o.id)}
                      onChange={() =>
                        setSecilenler((m) =>
                          m.includes(o.id) ? m.filter((x) => x !== o.id) : [...m, o.id]
                        )
                      }
                    />
                    {o.ad}
                  </label>
                ))}
              </div>
              <div className={s.formAlt}>
                <div className={s.formGrup}>
                  <label htmlFor={`atama-tarih-${test.id}`}>Son tarih (opsiyonel)</label>
                  <input
                    id={`atama-tarih-${test.id}`}
                    type="date"
                    value={sonTarih}
                    onChange={(e) => setSonTarih(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-kucuk"
                  disabled={bekliyor || !secilenler.length}
                  onClick={ata}
                >
                  {bekliyor ? "Atanıyor…" : "Ata"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
