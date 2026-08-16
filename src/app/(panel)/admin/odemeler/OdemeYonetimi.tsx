"use client";

/* 💳 Ödemeler — yönetici ekranı (tam finansal görünüm).
   Burada üç tutar bir arada görünür: öğrencinin ödediği, öğretmene ödenecek
   ve platformda kalan. Bu bileşen YALNIZ /admin altında render edilir;
   öğrenci ve öğretmen sayfaları kendi bacaklarını gösteren ayrı, salt-okunur
   sayfalardır (bkz. lib/odeme-sunucu.ts).

   Süzme istemcide yapılır; yazma işlemleri actions/odeme.ts server
   action'larına gider ve orada rol yeniden doğrulanır. */

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { bugun, tarihStr } from "@/lib/hesap";
import {
  ogrenciBazliOzet,
  tutarStr,
  yoneticiOzeti,
  type YoneticiOdemeSatiri,
} from "@/lib/odeme";
import {
  KOC_ODEME_DURUMLARI,
  KOC_ODEME_ETIKETLERI,
  ODEME_YONTEMLERI,
  ODEME_YONTEM_ETIKETLERI,
  OGRENCI_ODEME_DURUMLARI,
  OGRENCI_ODEME_ETIKETLERI,
  type KocOdemeDurum,
  type OdemeYontem,
  type OgrenciOdemeDurum,
} from "@/lib/sabitler";
import {
  odemeEkle,
  odemeGuncelle,
  odemeKocDurum,
  odemeOgrenciDurum,
  odemeSil,
} from "@/actions/odeme";
import { KocDurumRozeti, OgrenciDurumRozeti } from "@/components/odeme/OdemeRozeti";
import stil from "@/components/odeme/odeme.module.css";

export interface TarafSecenegi {
  id: string;
  ad: string;
  /** öğrencide sınıf, öğretmende branş */
  alt: string;
}

interface FormDurumu {
  id: string; // "" → yeni kayıt
  ogrenciId: string;
  kocId: string;
  aciklama: string;
  tarih: string;
  ogrenciTutar: string;
  ogrenciDurum: OgrenciOdemeDurum;
  yontem: OdemeYontem;
  kocTutar: string;
  kocDurum: KocOdemeDurum;
  yoneticiNotu: string;
}

function bosForm(): FormDurumu {
  return {
    id: "",
    ogrenciId: "",
    kocId: "",
    aciklama: "",
    tarih: bugun(),
    ogrenciTutar: "",
    ogrenciDurum: "bekliyor",
    yontem: "",
    kocTutar: "",
    kocDurum: "bekliyor",
    yoneticiNotu: "",
  };
}

function satirdanForm(o: YoneticiOdemeSatiri): FormDurumu {
  return {
    id: o.id,
    ogrenciId: o.ogrenciId,
    kocId: o.kocId,
    aciklama: o.aciklama,
    tarih: o.tarih,
    ogrenciTutar: String(o.ogrenciTutar),
    ogrenciDurum: o.ogrenciDurum,
    yontem: o.yontem,
    kocTutar: String(o.kocTutar),
    kocDurum: o.kocDurum,
    yoneticiNotu: o.yoneticiNotu,
  };
}

export default function OdemeYonetimi({
  odemeler,
  ogrenciler,
  koclar,
}: {
  odemeler: YoneticiOdemeSatiri[];
  ogrenciler: TarafSecenegi[];
  koclar: TarafSecenegi[];
}) {
  const [form, setForm] = useState<FormDurumu>(bosForm);
  const [mesaj, setMesaj] = useState<{ hata?: string; tamam?: string }>({});
  const [suzgec, setSuzgec] = useState({ ogrenciId: "", kocId: "", ogrenciDurum: "", kocDurum: "" });
  const [bekliyor, baslat] = useTransition();
  const router = useRouter();

  const listelenen = useMemo(
    () =>
      odemeler.filter(
        (o) =>
          (!suzgec.ogrenciId || o.ogrenciId === suzgec.ogrenciId) &&
          (!suzgec.kocId || o.kocId === suzgec.kocId) &&
          (!suzgec.ogrenciDurum || o.ogrenciDurum === suzgec.ogrenciDurum) &&
          (!suzgec.kocDurum || o.kocDurum === suzgec.kocDurum)
      ),
    [odemeler, suzgec]
  );
  const ozet = useMemo(() => yoneticiOzeti(listelenen), [listelenen]);
  const ogrenciDokumu = useMemo(() => ogrenciBazliOzet(listelenen), [listelenen]);

  const ogrenciTutar = Number(form.ogrenciTutar || 0);
  const kocTutar = Number(form.kocTutar || 0);
  const platform = ogrenciTutar - kocTutar;

  function calistir(islem: () => Promise<{ hata?: string }>, basari: string, sonra?: () => void) {
    baslat(async () => {
      const s = await islem();
      setMesaj(s.hata ? { hata: s.hata } : { tamam: basari });
      if (!s.hata) sonra?.();
      router.refresh();
    });
  }

  function gonder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const girdi = {
      ogrenciId: form.ogrenciId,
      kocId: form.kocId,
      aciklama: form.aciklama,
      tarih: form.tarih,
      ogrenciTutar: form.ogrenciTutar || 0,
      ogrenciDurum: form.ogrenciDurum,
      yontem: form.yontem,
      kocTutar: form.kocTutar || 0,
      kocDurum: form.kocDurum,
      yoneticiNotu: form.yoneticiNotu,
    };
    const duzenleme = form.id !== "";
    calistir(
      () => (duzenleme ? odemeGuncelle(form.id, girdi) : odemeEkle(girdi)),
      duzenleme ? "Ödeme kaydı güncellendi." : "Ödeme kaydı eklendi.",
      () => setForm(bosForm())
    );
  }

  return (
    <>
      {/* ── Finansal özet (süzgece göre) ── */}
      <div className={stil.ozet}>
        <div className={stil.ozetKutu}>
          <b>{tutarStr(ozet.ogrenciToplam)}</b>
          <small>Öğrenci tutarı ({ozet.adet} kalem)</small>
        </div>
        <div className={`${stil.ozetKutu} ${stil.olumlu}`}>
          <b>{tutarStr(ozet.ogrenciTahsil)}</b>
          <small>Tahsil edilen</small>
        </div>
        <div className={stil.ozetKutu}>
          <b>{tutarStr(ozet.kocToplam)}</b>
          <small>Öğretmene ödenecek ({tutarStr(ozet.kocOdenen)} ödendi)</small>
        </div>
        <div className={`${stil.ozetKutu} ${stil.bekleyen}`}>
          <b>{tutarStr(ozet.platform)}</b>
          <small>Platforma kalan</small>
        </div>
      </div>

      {/* ── Kayıt formu ── */}
      <div className={stil.bolum}>
        <h2>
          {form.id ? "✏️ " : "➕ "}
          <span>{form.id ? "Ödeme Kaydını Düzenle" : "Yeni Ödeme Kaydı"}</span>
        </h2>
        <p className={stil.bolumNot}>
          Öğrenci tutarı platforma ödenen bedeldir; öğretmen payı bu tutarın içinden
          ayrılır. Platforma kalan tutar otomatik hesaplanır ve saklanmaz. Ödeme tarihleri
          durum “Ödendi”ye geçtiği gün damgalanır.
        </p>
        <form className={stil.form} onSubmit={gonder}>
          <div className={stil.alan}>
            <label htmlFor="ogrenciId">Öğrenci</label>
            <select
              id="ogrenciId"
              required
              value={form.ogrenciId}
              onChange={(e) => setForm({ ...form, ogrenciId: e.target.value })}
            >
              <option value="">Seçin…</option>
              {ogrenciler.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.ad}
                  {o.alt ? ` · ${o.alt}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className={stil.alan}>
            <label htmlFor="kocId">Koç / Öğretmen (payı varsa)</label>
            <select
              id="kocId"
              value={form.kocId}
              onChange={(e) => setForm({ ...form, kocId: e.target.value })}
            >
              <option value="">Yok</option>
              {koclar.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.ad}
                  {k.alt ? ` · ${k.alt}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className={stil.alan}>
            <label htmlFor="tarih">Ödeme / vade tarihi</label>
            <input
              id="tarih"
              type="date"
              required
              value={form.tarih}
              onChange={(e) => setForm({ ...form, tarih: e.target.value })}
            />
          </div>

          <div className={stil.alan}>
            <label htmlFor="yontem">Tahsilat yöntemi</label>
            <select
              id="yontem"
              value={form.yontem}
              onChange={(e) => setForm({ ...form, yontem: e.target.value as OdemeYontem })}
            >
              {ODEME_YONTEMLERI.map((y) => (
                <option key={y} value={y}>
                  {ODEME_YONTEM_ETIKETLERI[y]}
                </option>
              ))}
            </select>
          </div>

          <div className={`${stil.alan} ${stil.genis}`}>
            <label htmlFor="aciklama">
              Açıklama <small style={{ color: "var(--muted)" }}>(öğrenci ve öğretmen görür)</small>
            </label>
            <input
              id="aciklama"
              maxLength={500}
              placeholder="örn. Ekim ayı · 4 özel ders"
              value={form.aciklama}
              onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
            />
          </div>

          <div className={stil.alan}>
            <label htmlFor="ogrenciTutar">Öğrencinin ödediği (₺)</label>
            <input
              id="ogrenciTutar"
              type="number"
              min={0}
              step={1}
              required
              value={form.ogrenciTutar}
              onChange={(e) => setForm({ ...form, ogrenciTutar: e.target.value })}
            />
          </div>

          <div className={stil.alan}>
            <label htmlFor="ogrenciDurum">Tahsilat durumu</label>
            <select
              id="ogrenciDurum"
              value={form.ogrenciDurum}
              onChange={(e) =>
                setForm({ ...form, ogrenciDurum: e.target.value as OgrenciOdemeDurum })
              }
            >
              {OGRENCI_ODEME_DURUMLARI.map((d) => (
                <option key={d} value={d}>
                  {OGRENCI_ODEME_ETIKETLERI[d]}
                </option>
              ))}
            </select>
          </div>

          <div className={stil.alan}>
            <label htmlFor="kocTutar">Öğretmene ödenecek (₺)</label>
            <input
              id="kocTutar"
              type="number"
              min={0}
              step={1}
              value={form.kocTutar}
              onChange={(e) => setForm({ ...form, kocTutar: e.target.value })}
            />
          </div>

          <div className={stil.alan}>
            <label htmlFor="kocDurum">Öğretmen ödeme durumu</label>
            <select
              id="kocDurum"
              value={form.kocDurum}
              onChange={(e) => setForm({ ...form, kocDurum: e.target.value as KocOdemeDurum })}
            >
              {KOC_ODEME_DURUMLARI.map((d) => (
                <option key={d} value={d}>
                  {KOC_ODEME_ETIKETLERI[d]}
                </option>
              ))}
            </select>
          </div>

          <div className={`${stil.alan} ${stil.genis}`}>
            <label htmlFor="yoneticiNotu">
              Yönetici notu <small style={{ color: "var(--muted)" }}>(yalnız yönetici görür)</small>
            </label>
            <textarea
              id="yoneticiNotu"
              value={form.yoneticiNotu}
              onChange={(e) => setForm({ ...form, yoneticiNotu: e.target.value })}
            />
          </div>

          <div className={stil.formAlt}>
            <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
              {form.id ? "Kaydet" : "Ödeme Ekle"}
            </button>
            {form.id !== "" && (
              <button
                type="button"
                className="btn btn-outline btn-kucuk"
                disabled={bekliyor}
                onClick={() => {
                  setForm(bosForm());
                  setMesaj({});
                }}
              >
                Vazgeç
              </button>
            )}
            <span className={stil.hesap}>
              Platforma kalan: <b>{tutarStr(platform)}</b>
              {platform < 0 && " · öğretmen payı öğrenci tutarını aşıyor"}
            </span>
          </div>
        </form>
        {mesaj.hata && <div className={stil.hata}>{mesaj.hata}</div>}
        {mesaj.tamam && <div className={stil.tamam}>{mesaj.tamam}</div>}
      </div>

      {/* ── Öğrenci bazlı döküm ── */}
      <div className={stil.bolum}>
        <h2>
          👥 <span>Öğrenci Bazlı Döküm</span>
        </h2>
        <p className={stil.bolumNot}>
          Her öğrenci için ödediği tutar, öğretmene ödenecek pay ve platforma kalan.
          İptal edilen kalemler toplamlara girmez.
        </p>
        <div className={stil.tabloSarici}>
          <table className={stil.tablo}>
            <thead>
              <tr>
                <th>Öğrenci</th>
                <th className={stil.sag}>Ödediği</th>
                <th className={stil.sag}>Tahsil</th>
                <th className={stil.sag}>Bekleyen</th>
                <th className={stil.sag}>Öğretmene</th>
                <th className={stil.sag}>Platforma</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ogrenciDokumu.map((d) => (
                <tr key={d.ogrenciId}>
                  <td>
                    <b>{d.ogrenciAd}</b>
                    <small style={{ color: "var(--muted)" }}> · {d.adet} kalem</small>
                  </td>
                  <td data-label="Ödediği" className={`${stil.tutar} ${stil.sag}`}>
                    {tutarStr(d.ogrenciToplam)}
                  </td>
                  <td data-label="Tahsil" className={stil.sag}>
                    {tutarStr(d.tahsil)}
                  </td>
                  <td data-label="Bekleyen" className={stil.sag}>
                    {tutarStr(d.bekleyen)}
                  </td>
                  <td data-label="Öğretmene" className={stil.sag}>
                    {tutarStr(d.kocToplam)}
                  </td>
                  <td data-label="Platforma" className={`${stil.platform} ${stil.sag}`}>
                    {tutarStr(d.platform)}
                  </td>
                  <td data-label="Geçmiş">
                    <button
                      type="button"
                      className="btn btn-outline btn-kucuk"
                      onClick={() => setSuzgec({ ...suzgec, ogrenciId: d.ogrenciId })}
                    >
                      Geçmişi
                    </button>
                  </td>
                </tr>
              ))}
              {ogrenciDokumu.length === 0 && (
                <tr>
                  <td colSpan={7} className={stil.bos}>
                    Süzgece uyan kayıt yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Kalem listesi ── */}
      <div className={stil.bolum}>
        <h2>
          📋 <span>Ödeme Kalemleri</span> ({listelenen.length})
        </h2>

        <div className={stil.filtreler}>
          <div className={stil.alan}>
            <label htmlFor="fOgrenci">Öğrenci</label>
            <select
              id="fOgrenci"
              value={suzgec.ogrenciId}
              onChange={(e) => setSuzgec({ ...suzgec, ogrenciId: e.target.value })}
            >
              <option value="">Tümü</option>
              {ogrenciler.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.ad}
                </option>
              ))}
            </select>
          </div>
          <div className={stil.alan}>
            <label htmlFor="fKoc">Öğretmen</label>
            <select
              id="fKoc"
              value={suzgec.kocId}
              onChange={(e) => setSuzgec({ ...suzgec, kocId: e.target.value })}
            >
              <option value="">Tümü</option>
              {koclar.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.ad}
                </option>
              ))}
            </select>
          </div>
          <div className={stil.alan}>
            <label htmlFor="fOgrenciDurum">Tahsilat</label>
            <select
              id="fOgrenciDurum"
              value={suzgec.ogrenciDurum}
              onChange={(e) => setSuzgec({ ...suzgec, ogrenciDurum: e.target.value })}
            >
              <option value="">Tümü</option>
              {OGRENCI_ODEME_DURUMLARI.map((d) => (
                <option key={d} value={d}>
                  {OGRENCI_ODEME_ETIKETLERI[d]}
                </option>
              ))}
            </select>
          </div>
          <div className={stil.alan}>
            <label htmlFor="fKocDurum">Öğretmen ödemesi</label>
            <select
              id="fKocDurum"
              value={suzgec.kocDurum}
              onChange={(e) => setSuzgec({ ...suzgec, kocDurum: e.target.value })}
            >
              <option value="">Tümü</option>
              {KOC_ODEME_DURUMLARI.map((d) => (
                <option key={d} value={d}>
                  {KOC_ODEME_ETIKETLERI[d]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-kucuk"
            onClick={() => setSuzgec({ ogrenciId: "", kocId: "", ogrenciDurum: "", kocDurum: "" })}
          >
            Süzgeci Temizle
          </button>
        </div>

        <div className={stil.tabloSarici}>
          <table className={stil.tablo}>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Öğrenci / Öğretmen</th>
                <th>Açıklama</th>
                <th className={stil.sag}>Öğrenci</th>
                <th className={stil.sag}>Öğretmen</th>
                <th className={stil.sag}>Platform</th>
                <th>Tahsilat</th>
                <th>Öğretmen ödemesi</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {listelenen.map((o) => (
                <tr key={o.id} className={o.ogrenciDurum === "iptal" ? stil.iptalSatir : ""}>
                  <td>
                    <b>{tarihStr(o.tarih)}</b>
                  </td>
                  <td data-label="Taraflar">
                    <span className={stil.taraf}>
                      {o.ogrenciAd}
                      <small>{o.kocAd ? `→ ${o.kocAd}` : "öğretmen payı yok"}</small>
                    </span>
                  </td>
                  <td data-label="Açıklama">
                    {o.aciklama || "—"}
                    {o.yoneticiNotu && (
                      <small style={{ display: "block", color: "var(--muted)" }}>
                        🔒 {o.yoneticiNotu}
                      </small>
                    )}
                  </td>
                  <td data-label="Öğrenci tutarı" className={`${stil.tutar} ${stil.sag}`}>
                    {tutarStr(o.ogrenciTutar)}
                  </td>
                  <td data-label="Öğretmen payı" className={stil.sag}>
                    {tutarStr(o.kocTutar)}
                  </td>
                  <td data-label="Platform" className={`${stil.platform} ${stil.sag}`}>
                    {tutarStr(o.platformTutar)}
                  </td>
                  <td data-label="Tahsilat">
                    <select
                      className={stil.durumSecim}
                      aria-label={`${o.ogrenciAd} tahsilat durumu`}
                      value={o.ogrenciDurum}
                      disabled={bekliyor}
                      onChange={(e) =>
                        calistir(
                          () => odemeOgrenciDurum(o.id, e.target.value),
                          "Tahsilat durumu güncellendi."
                        )
                      }
                    >
                      {OGRENCI_ODEME_DURUMLARI.map((d) => (
                        <option key={d} value={d}>
                          {OGRENCI_ODEME_ETIKETLERI[d]}
                        </option>
                      ))}
                    </select>
                    {o.ogrenciOdemeTarihi && (
                      <small style={{ display: "block", color: "var(--muted)" }}>
                        {tarihStr(o.ogrenciOdemeTarihi)}
                      </small>
                    )}
                  </td>
                  <td data-label="Öğretmen ödemesi">
                    {o.kocId && o.kocTutar > 0 ? (
                      <>
                        <select
                          className={stil.durumSecim}
                          aria-label={`${o.kocAd} ödeme durumu`}
                          value={o.kocDurum}
                          disabled={bekliyor}
                          onChange={(e) =>
                            calistir(
                              () => odemeKocDurum(o.id, e.target.value),
                              "Öğretmen ödeme durumu güncellendi."
                            )
                          }
                        >
                          {KOC_ODEME_DURUMLARI.map((d) => (
                            <option key={d} value={d}>
                              {KOC_ODEME_ETIKETLERI[d]}
                            </option>
                          ))}
                        </select>
                        {o.kocOdemeTarihi && (
                          <small style={{ display: "block", color: "var(--muted)" }}>
                            {tarihStr(o.kocOdemeTarihi)}
                          </small>
                        )}
                      </>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>—</span>
                    )}
                  </td>
                  <td data-label="İşlem">
                    <div className={stil.islemler}>
                      <button
                        type="button"
                        className="btn btn-outline btn-kucuk"
                        disabled={bekliyor}
                        onClick={() => {
                          setForm(satirdanForm(o));
                          setMesaj({});
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-kucuk"
                        style={{ borderColor: "var(--kirmizi)", color: "var(--kirmizi)" }}
                        disabled={bekliyor}
                        onClick={() => {
                          if (
                            !confirm(
                              `${o.ogrenciAd} · ${tarihStr(o.tarih)} · ${tutarStr(
                                o.ogrenciTutar
                              )} kaydı silinsin mi?\n\nBu işlem geri alınamaz. Ödeme geçmişinden de kalkar.`
                            )
                          )
                            return;
                          calistir(() => odemeSil(o.id), "Ödeme kaydı silindi.");
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {listelenen.length === 0 && (
                <tr>
                  <td colSpan={9} className={stil.bos}>
                    Süzgece uyan ödeme kaydı yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rozetlerin anlamı — öğrenci/öğretmen sayfalarındaki görünümle aynı */}
      <div className={stil.bolum}>
        <h2>
          ℹ️ <span>Durum Karşılıkları</span>
        </h2>
        <p className={stil.bolumNot}>
          Öğrenci sayfasında görünen tahsilat durumu:{" "}
          {OGRENCI_ODEME_DURUMLARI.map((d) => (
            <span key={d} style={{ marginRight: 8 }}>
              <OgrenciDurumRozeti durum={d} />
            </span>
          ))}
          <br />
          Öğretmen sayfasında görünen ödeme durumu:{" "}
          {KOC_ODEME_DURUMLARI.map((d) => (
            <span key={d} style={{ marginRight: 8 }}>
              <KocDurumRozeti durum={d} />
            </span>
          ))}
        </p>
      </div>
    </>
  );
}
