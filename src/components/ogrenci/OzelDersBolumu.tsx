"use client";

/* 🎓 Özel Derslerim — legacy ozelCiz + talep/onay/red/vazgeç akışı birebir */

import { useState, useTransition, type FormEvent } from "react";
import { ozelDersEkle, ozelDersGuncelle, ozelDersSil } from "@/actions/ozelders";
import { bugun, isoTarih, ozelDersOzet, tarihStr } from "@/lib/hesap";
import DegerlendirmeFormu from "@/components/degerlendirme/DegerlendirmeFormu";
import DegerlendirmeGoster from "@/components/degerlendirme/DegerlendirmeGoster";
import type { DegerlendirmeS } from "@/components/degerlendirme/alanlar";
import dg from "@/components/degerlendirme/degerlendirme.module.css";
import type { OzelDersKaydi } from "./tipler";
import s from "./panel.module.css";

/* Gizlilik: öğrenci yalnızca kendi değerlendirmesini görür; öğretmenin
   öğrenci hakkındaki değerlendirmesi bu bileşene hiç gelmez. */
type DegerlendirmeIkili = { benim?: DegerlendirmeS };

export default function OzelDersBolumu({
  ogrenciId,
  kocVar,
  dersler,
  degerlendirmeler,
}: {
  ogrenciId: string;
  kocVar: boolean;
  dersler: OzelDersKaydi[];
  degerlendirmeler: Record<string, DegerlendirmeIkili>;
}) {
  const [formAcik, setFormAcik] = useState(false);
  const [degAcik, setDegAcik] = useState<string | null>(null);
  const [bekliyor, startTransition] = useTransition();

  const liste = dersler.filter((x) => x.durum !== "iptal");
  const oz = ozelDersOzet(liste);
  const simdi = bugun();
  const sonraki = oz.sonraki as OzelDersKaydi | null;

  /* Onayını bekleyen öğretmen önerileri en üstte */
  const sirali = liste
    .filter((x) => x.durum === "talep" && x.olusturan === "koc")
    .concat(liste.filter((x) => !(x.durum === "talep" && x.olusturan === "koc")));

  function talepGonder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!kocVar) {
      alert("Henüz bir öğretmene atanmadığın için talep gönderemezsin.");
      return;
    }
    const form = e.currentTarget;
    const f = new FormData(form);
    startTransition(async () => {
      const sonuc = await ozelDersEkle({
        ogrenciId,
        ders: String(f.get("ders") || "").trim(),
        konu: String(f.get("konu") || "").trim(),
        tarih: String(f.get("tarih") || ""),
        saat: String(f.get("saat") || ""),
        sure: +String(f.get("sure") || "") || 60,
        mesaj: String(f.get("mesaj") || "").trim(),
      });
      if (sonuc.hata) {
        alert(sonuc.hata);
        return;
      }
      form.reset();
      setFormAcik(false);
    });
  }

  function teklifOnayla(id: string) {
    startTransition(async () => {
      const sonuc = await ozelDersGuncelle(id, { durum: "planlandi" });
      if (sonuc.hata) alert(sonuc.hata);
    });
  }

  function teklifReddet(id: string) {
    const neden = prompt("Neden uygun değil? (öğretmenine iletilir)", "");
    if (neden === null) return;
    startTransition(async () => {
      const sonuc = await ozelDersGuncelle(id, { durum: "reddedildi", redNotu: neden.trim() });
      if (sonuc.hata) alert(sonuc.hata);
    });
  }

  function talepVazgec(id: string) {
    if (!confirm("Bu ders talebinden vazgeçilsin mi?")) return;
    startTransition(async () => {
      const sonuc = await ozelDersSil(id);
      if (sonuc.hata) alert(sonuc.hata);
    });
  }

  return (
    <section className={s.bolum} id="bolum-ozel">
      <div className={s["bolum-bas"]}>
        <h2>🎓 Özel Derslerim</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="tag">
            {liste.length
              ? `${oz.yapilan} yapıldı · ${oz.planlanan} planlı` +
                (oz.onayBekleyenOgr ? ` · ${oz.onayBekleyenOgr} onayını bekliyor` : "") +
                (oz.onayBekleyenKoc ? ` · ${oz.onayBekleyenKoc} talebin onayda` : "")
              : "Henüz ders yok"}
          </span>
          {kocVar && (
            <button className="btn btn-primary btn-kucuk" onClick={() => setFormAcik((a) => !a)}>
              ➕ Ders Talep Et
            </button>
          )}
        </div>
      </div>

      {formAcik && (
        <form className={s["ic-form"]} style={{ marginBottom: 16 }} onSubmit={talepGonder}>
          <div className={s["form-izgara"]}>
            <div className={s["form-grup"]}>
              <label>Ders</label>
              <input name="ders" required placeholder="Örn. Matematik" />
            </div>
            <div className={s["form-grup"]}>
              <label>Konu</label>
              <input name="konu" placeholder="Örn. Türev" />
            </div>
            <div className={s["form-grup"]}>
              <label>Tercih Ettiğin Tarih</label>
              <input name="tarih" type="date" required />
            </div>
            <div className={s["form-grup"]}>
              <label>Saat</label>
              <input name="saat" type="time" />
            </div>
            <div className={s["form-grup"]}>
              <label>Süre (dk)</label>
              <input name="sure" type="number" min={15} step={15} defaultValue={60} />
            </div>
          </div>
          <div className={s["form-grup"]} style={{ marginBottom: 12 }}>
            <label>Öğretmenine Mesajın</label>
            <input
              name="mesaj"
              placeholder="Örn. denemelerde bu konuda çok yanlışım çıkıyor, birlikte çalışabilir miyiz?"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
            Talebi Gönder
          </button>
          <span style={{ fontSize: ".78rem", color: "var(--muted)", marginLeft: 10 }}>
            Öğretmenin onaylayınca ders planına eklenir.
          </span>
        </form>
      )}

      {liste.length ? (
        <>
          {sonraki && (
            <div className={s["yol-ust"]} style={{ marginBottom: 16 }}>
              <div
                className={s["seviye-rozet"]}
                style={{ width: "auto", height: "auto", borderRadius: 14, padding: "10px 16px" }}
              >
                <small>SIRADAKİ DERS</small>
                <b style={{ fontSize: "1rem" }}>{tarihStr(sonraki.tarih)}</b>
              </div>
              <div>
                <b>
                  {sonraki.ders}
                  {sonraki.konu ? " – " + sonraki.konu : ""}
                </b>
                <p style={{ fontSize: ".8rem", color: "var(--muted)", marginTop: 2 }}>
                  {sonraki.saat ? "🕐 " + sonraki.saat + " · " : ""}⏱ {sonraki.sure || 60} dk ·
                  Hazırlıklı gelmeyi unutma! 💪
                </p>
              </div>
            </div>
          )}
          {sirali.map((x) => {
            const gecmisPlan = x.durum === "planlandi" && isoTarih(x.tarih) < simdi;
            const oneride = x.durum === "talep" && x.olusturan === "koc";
            return (
              <div
                key={x.id}
                className={s["liste-satir"]}
                data-id={x.id}
                style={
                  oneride
                    ? { border: "2px solid var(--orange)", background: "#fff8f2" }
                    : x.durum === "reddedildi"
                      ? { opacity: 0.65 }
                      : undefined
                }
              >
                <div className={s["liste-govde"]}>
                  <b>
                    {x.ders}
                    {x.konu ? " – " + x.konu : ""}
                  </b>
                  {x.mesaj && x.olusturan === "ogrenci" && <p>💬 Mesajın: {x.mesaj}</p>}
                  {x.redNotu && <p>🚫 Ret nedeni: {x.redNotu}</p>}
                  {x.not_ && <p>📝 Öğretmen notu: {x.not_}</p>}
                  {x.odev && <p>📘 Ders ödevi: {x.odev}</p>}
                  <div className={s["liste-meta"]}>
                    <span className="tag">
                      📅 {tarihStr(x.tarih)}
                      {x.saat ? " · 🕐 " + x.saat : ""}
                    </span>
                    <span className="tag">⏱ {x.sure || 60} dk</span>
                    {!!+x.ucret && x.durum !== "yapildi" && <span className="tag">💰 {x.ucret} ₺</span>}
                    {durumRozeti(x, oneride, gecmisPlan)}
                    {!!+x.ucret && x.durum === "yapildi" && (
                      <span
                        className={`${s["durum-rozet"]} ${x.odendi ? s["durum-tamam"] : s["durum-bekliyor"]}`}
                      >
                        {x.odendi ? "₺ Ödendi" : "₺ Ödeme bekliyor"}
                      </span>
                    )}
                  </div>
                  {x.durum === "yapildi" &&
                    (() => {
                      const deg = degerlendirmeler[x.id] ?? {};
                      const acik = degAcik === x.id;
                      return (
                        <>
                          <div className={dg.blok}>
                            <div className={dg.blokBas}>
                              <b>⭐ Öğretmeni değerlendirmen</b>
                              {deg.benim && !acik && (
                                <button
                                  className="btn btn-outline btn-kucuk"
                                  onClick={() => setDegAcik(x.id)}
                                >
                                  ✏️ Düzenle
                                </button>
                              )}
                            </div>
                            {acik ? (
                              <DegerlendirmeFormu
                                ozelDersId={x.id}
                                yon="ogrenciKoc"
                                mevcut={deg.benim}
                                onKapat={() => setDegAcik(null)}
                              />
                            ) : deg.benim ? (
                              <DegerlendirmeGoster deger={deg.benim} />
                            ) : (
                              <button
                                className="btn btn-primary btn-kucuk"
                                onClick={() => setDegAcik(x.id)}
                              >
                                ⭐ Öğretmeni Değerlendir
                              </button>
                            )}
                            <small className={dg.gizlilik}>
                              🔒 Değerlendirmen öğretmenine gösterilmez; yalnızca okul yönetimi
                              görür. Bu yüzden rahatça ve dürüstçe yazabilirsin.
                            </small>
                          </div>
                        </>
                      );
                    })()}
                  {oneride && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      <button
                        className="btn btn-primary btn-kucuk"
                        disabled={bekliyor}
                        onClick={() => teklifOnayla(x.id)}
                      >
                        ✓ Onaylıyorum
                      </button>
                      <button
                        className="btn btn-outline btn-kucuk"
                        disabled={bekliyor}
                        onClick={() => teklifReddet(x.id)}
                      >
                        Uygun Değil
                      </button>
                    </div>
                  )}
                  {x.durum === "talep" && x.olusturan === "ogrenci" && (
                    <div style={{ marginTop: 10 }}>
                      <button
                        className="btn btn-outline btn-kucuk"
                        disabled={bekliyor}
                        onClick={() => talepVazgec(x.id)}
                      >
                        Talebimden Vazgeç
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <p className={s["bos-mesaj"]}>
          Henüz özel ders kaydın yok. &quot;Ders Talep Et&quot; ile öğretmeninden ders isteyebilirsin. 🎓
        </p>
      )}
    </section>
  );
}

function durumRozeti(x: OzelDersKaydi, oneride: boolean, gecmisPlan: boolean) {
  if (x.durum === "yapildi")
    return <span className={`${s["durum-rozet"]} ${s["durum-tamam"]}`}>✓ Yapıldı</span>;
  if (x.durum === "reddedildi")
    return (
      <span className={`${s["durum-rozet"]} ${s["durum-red"]}`}>
        ✕ {x.olusturan === "ogrenci" ? "Öğretmenin reddetti" : "Reddettin"}
      </span>
    );
  if (oneride)
    return (
      <span className={`${s["durum-rozet"]} ${s["durum-talep"]}`}>
        📨 Öğretmenin ders önerisi – onayın bekleniyor
      </span>
    );
  if (x.durum === "talep")
    return (
      <span className={`${s["durum-rozet"]} ${s["durum-talep"]}`}>🙋 Talebin öğretmen onayında</span>
    );
  if (gecmisPlan)
    return (
      <span className={`${s["durum-rozet"]} ${s["durum-bekliyor"]}`}>⏳ Yapıldı onayı bekleniyor</span>
    );
  return <span className={`${s["durum-rozet"]} ${s["durum-bekliyor"]}`}>📅 Planlandı</span>;
}
