"use client";

/* 🎯 Başlangıç Profili sekmesi — legacy profilCiz / profilFormAc /
   profilDersSatirlari / oneriCiz / zayifYolaEkle / zayifOdevVer. */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bugun, gunKaydir, tarihStr, type Profil } from "@/lib/hesap";
import { PROFIL_DERSLERI, SEVIYELER } from "@/lib/sabitler";
import { profilKaydet } from "@/actions/ogrenci";
import { odevEkle } from "@/actions/odev";
import { yolEkle } from "@/actions/yol";
import type { ZayifS } from "./tipler";
import s from "./koc.module.css";

function konulariAyir(v: FormDataEntryValue | null): string[] {
  return String(v ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function seviyeSinif(sv: string) {
  return sv === "İyi" ? s.seviyeIyi : sv === "Zayıf" ? s.seviyeZayif : s.seviyeOrta;
}

interface Props {
  ogrenciId: string;
  sinif: string;
  profil: Profil | null;
  zayif: ZayifS[];
}

export default function ProfilSekmesi({ ogrenciId, sinif, profil, zayif }: Props) {
  const router = useRouter();
  const [formAcik, setFormAcik] = useState(false);
  /* Sınıfa göre makul varsayılan: 8. sınıf ve altı LGS (legacy) */
  const varsayilanSinav = profil?.sinav === "LGS" || (!profil && /^[1-8]\./.test(sinif || ""))
    ? "LGS"
    : "YKS";
  const [sinav, setSinav] = useState(varsayilanSinav);
  const [mesaj, setMesaj] = useState("");
  const [bekliyor, baslat] = useTransition();

  function profilGonder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const dersler = (PROFIL_DERSLERI[sinav] || []).map((ders, i) => ({
      ders,
      seviye: String(fd.get(`seviye-${i}`) ?? "Orta"),
      bilinen: konulariAyir(fd.get(`bilinen-${i}`)),
      eksik: konulariAyir(fd.get(`eksik-${i}`)),
    }));
    baslat(async () => {
      const sonuc = await profilKaydet(ogrenciId, {
        sinav,
        gunlukSaat: +String(fd.get("saat") ?? "") || 0,
        notlar: String(fd.get("notlar") ?? "").trim(),
        tarih: bugun(),
        dersler,
      });
      if (sonuc.hata) {
        setMesaj(sonuc.hata);
        return;
      }
      setMesaj("");
      setFormAcik(false);
      router.refresh();
    });
  }

  function yolaEkle(z: ZayifS) {
    baslat(async () => {
      const sonuc = await yolEkle({
        ogrenciId,
        ders: z.ders,
        konu: z.konu,
        hedef:
          "Eksik konu: tekrar + soru çözümü" + (z.kez > 1 ? ` (${z.kez} kez yanlış yapıldı)` : ""),
        xp: 60,
      });
      if (sonuc.hata) alert(sonuc.hata);
      else {
        alert(`"${z.ders} – ${z.konu}" yol haritasına adım olarak eklendi. 🗺️`);
        router.refresh();
      }
    });
  }

  /* Zayıf konudan tek tıkla ödev: 1 hafta süre, 40 soru hedefi (legacy) */
  function odevVer(z: ZayifS) {
    const sonTarih = gunKaydir(7);
    baslat(async () => {
      const sonuc = await odevEkle({
        ogrenciId,
        ders: z.ders,
        konu: z.konu,
        kaynak: "",
        soruSayisi: 40,
        sonTarih,
        aciklama:
          "Eksik konu çalışması: konu tekrarı yap, ardından 40 soru çöz ve yanlışlarını analiz et." +
          (z.kez > 1 ? ` (Bu konudan ${z.kez} kez yanlış yaptın.)` : ""),
      });
      if (sonuc.hata) alert(sonuc.hata);
      else {
        alert(`"${z.ders} – ${z.konu}" konusundan ödev oluşturuldu (son tarih: ${tarihStr(sonTarih)}). 📘`);
        router.refresh();
      }
    });
  }

  return (
    <div>
      {zayif.length > 0 && (
        <div className={s.oneriKutu}>
          <h3>📌 Çalışılması Gereken Konular</h3>
          <p className={s.oneriAciklama}>
            Deneme yanlışlarından ve başlangıç formundaki eksiklerden otomatik tespit edildi.
            Konuyu tek tıkla yol haritasına adım olarak ekleyebilir ya da doğrudan ödev
            verebilirsin:
          </p>
          {zayif.slice(0, 15).map((z, i) => (
            <span key={i} className={`${s.konuCip} ${s.eksik}`}>
              {z.ders} – {z.konu} {z.kez > 1 && <b>×{z.kez}</b>}
              <button
                type="button"
                title="Yol haritasına adım olarak ekle"
                disabled={bekliyor}
                onClick={() => yolaEkle(z)}
              >
                + Yola Ekle
              </button>
              <button
                type="button"
                title="Bu konudan ödev oluştur (1 hafta süreli)"
                disabled={bekliyor}
                onClick={() => odevVer(z)}
              >
                📘 Ödev Ver
              </button>
            </span>
          ))}
        </div>
      )}

      <div className={s.sagaYasli}>
        <button
          type="button"
          className="btn btn-outline btn-kucuk"
          onClick={() => setFormAcik(!formAcik)}
        >
          Formu Doldur / Düzenle
        </button>
      </div>

      {profil ? (
        <div>
          <div className={s.profilEtiketler}>
            <span className="tag">🎯 {profil.sinav}</span>
            <span className="tag">⏱ Günde {profil.gunlukSaat || "?"} saat</span>
            <span className="tag">📅 {profil.tarih}</span>
          </div>
          <table className={s.profilDersTablo}>
            <thead>
              <tr>
                <th>Ders</th>
                <th>Seviye</th>
                <th>Bildiği Konular</th>
                <th>Eksik Konuları</th>
              </tr>
            </thead>
            <tbody>
              {(profil.dersler || []).map((d, i) => (
                <tr key={i}>
                  <td>
                    <b>{d.ders}</b>
                  </td>
                  <td>
                    <span className={`${s.seviyeCip} ${seviyeSinif(d.seviye)}`}>{d.seviye}</span>
                  </td>
                  <td>
                    {(d.bilinen || []).length
                      ? d.bilinen.map((k, j) => (
                          <span key={j} className={s.konuCip}>✓ {k}</span>
                        ))
                      : "—"}
                  </td>
                  <td>
                    {(d.eksik || []).length
                      ? d.eksik.map((k, j) => (
                          <span key={j} className={`${s.konuCip} ${s.eksik}`}>! {k}</span>
                        ))
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {profil.notlar && <p className={s.profilNot}>📝 {profil.notlar}</p>}
        </div>
      ) : (
        <p className={s.bosMesaj}>
          Başlangıç seviye formu henüz doldurulmadı. Öğrenci kendi panelinden doldurabilir ya da
          görüşme sırasında sen doldurabilirsin.
        </p>
      )}

      {formAcik && (
        <form className={s.kutuForm} style={{ marginTop: 12 }} onSubmit={profilGonder}>
          <div className={s.formIzgara}>
            <div className={s.formGrup}>
              <label>Hazırlandığı Sınav</label>
              <select value={sinav} onChange={(e) => setSinav(e.target.value)}>
                <option>YKS</option>
                <option>LGS</option>
              </select>
            </div>
            <div className={s.formGrup}>
              <label>Günlük Çalışma (saat)</label>
              <input
                name="saat"
                type="number"
                min={0}
                max={16}
                step={0.5}
                placeholder="4"
                defaultValue={profil?.gunlukSaat || ""}
              />
            </div>
          </div>
          <div style={{ margin: "6px 0 12px" }}>
            {(PROFIL_DERSLERI[sinav] || []).map((ders, i) => {
              const eski = profil?.dersler?.find((x) => x.ders === ders);
              return (
                <div key={sinav + ders} className={s.profilSatir}>
                  <span className={s.profilSatirDers}>{ders}</span>
                  <select name={`seviye-${i}`} defaultValue={eski?.seviye ?? "Zayıf"}>
                    {SEVIYELER.map((sv) => (
                      <option key={sv}>{sv}</option>
                    ))}
                  </select>
                  <input
                    name={`bilinen-${i}`}
                    placeholder="Bildiği konular (virgülle)"
                    defaultValue={eski ? (eski.bilinen || []).join(", ") : ""}
                  />
                  <input
                    name={`eksik-${i}`}
                    placeholder="Eksik konuları (virgülle)"
                    defaultValue={eski ? (eski.eksik || []).join(", ") : ""}
                  />
                </div>
              );
            })}
          </div>
          <div className={s.formGrup} style={{ marginBottom: 12 }}>
            <label>Notlar</label>
            <input
              name="notlar"
              placeholder="Görüşme notları, öğrencinin özel durumu..."
              defaultValue={profil?.notlar ?? ""}
            />
          </div>
          <div className={s.formAlt}>
            <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
              Profili Kaydet
            </button>
            <span className={s.formNot}>
              Öğrenci de kendi panelinden bu formu doldurabilir/güncelleyebilir.
            </span>
            {mesaj && <span className={`${s.formMesaj} ${s.hataMsj}`}>{mesaj}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
