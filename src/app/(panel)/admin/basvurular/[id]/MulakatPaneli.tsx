"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { mulakatPlanla, mulakatSonucKaydet } from "@/actions/basvuru-admin";
import {
  MULAKAT_SONUCLARI,
  MULAKAT_SONUC_ETIKETLERI,
  MULAKAT_TURLERI,
  MULAKAT_TUR_ETIKETLERI,
} from "@/lib/sabitler";
import ortak from "./detay.module.css";

export interface AktifMulakat {
  id: string;
  tarih: string; // "YYYY-MM-DD"
  saat: string; // "HH:MM"
  tarihMetni: string; // görüntüleme
  sure: number;
  tur: string;
  baglanti: string;
  adres: string;
  gorusmeci: string;
  aciklama: string;
  sonuc: string;
  sonucNotu: string;
}

export interface GecmisMulakat {
  id: string;
  tarihMetni: string;
  tur: string;
  sonuc: string;
}

export default function MulakatPaneli({
  basvuruId,
  aktif,
  gecmis,
}: {
  basvuruId: string;
  aktif: AktifMulakat | null;
  gecmis: GecmisMulakat[];
}) {
  const [planAcik, setPlanAcik] = useState(!aktif);
  const [tur, setTur] = useState<string>(aktif?.tur ?? "online");
  const [hata, setHata] = useState("");
  const [bekliyor, baslat] = useTransition();
  const router = useRouter();

  function planla(fd: FormData) {
    setHata("");
    baslat(async () => {
      const s = await mulakatPlanla({
        basvuruId,
        tarih: fd.get("tarih"),
        saat: fd.get("saat"),
        sure: fd.get("sure"),
        tur: fd.get("tur"),
        baglanti: fd.get("baglanti") ?? "",
        adres: fd.get("adres") ?? "",
        gorusmeci: fd.get("gorusmeci") ?? "",
        aciklama: fd.get("aciklama") ?? "",
      });
      if (s.hata) return setHata(s.hata);
      setPlanAcik(false);
      router.refresh();
    });
  }

  function sonucKaydet(fd: FormData) {
    if (!aktif) return;
    setHata("");
    baslat(async () => {
      const s = await mulakatSonucKaydet({
        mulakatId: aktif.id,
        sonuc: fd.get("sonuc"),
        sonucNotu: fd.get("sonucNotu") ?? "",
      });
      if (s.hata) return setHata(s.hata);
      router.refresh();
    });
  }

  return (
    <div>
      {/* Aktif mülakat özeti */}
      {aktif && !planAcik && (
        <div className={ortak.mulakatOzet}>
          <div className={ortak.mulakatSatir}>
            <span>📅 Tarih & saat</span>
            <b>{aktif.tarihMetni}</b>
          </div>
          <div className={ortak.mulakatSatir}>
            <span>Görüşme türü</span>
            <b>{MULAKAT_TUR_ETIKETLERI[aktif.tur as keyof typeof MULAKAT_TUR_ETIKETLERI] ?? aktif.tur}</b>
          </div>
          {aktif.tur === "online" && aktif.baglanti && (
            <div className={ortak.mulakatSatir}>
              <span>Bağlantı</span>
              <a href={aktif.baglanti} target="_blank" rel="noopener noreferrer">
                {aktif.baglanti}
              </a>
            </div>
          )}
          {aktif.tur === "yuzyuze" && aktif.adres && (
            <div className={ortak.mulakatSatir}>
              <span>Adres</span>
              <b>{aktif.adres}</b>
            </div>
          )}
          {aktif.gorusmeci && (
            <div className={ortak.mulakatSatir}>
              <span>Görüşmeci</span>
              <b>{aktif.gorusmeci}</b>
            </div>
          )}
          <button
            type="button"
            className="btn btn-outline btn-kucuk"
            onClick={() => setPlanAcik(true)}
            style={{ marginTop: 10 }}
          >
            Yeniden Planla
          </button>
        </div>
      )}

      {/* Planlama formu */}
      {planAcik && (
        <form action={planla} className={ortak.mulakatForm}>
          <div className={ortak.formGrid}>
            <label>
              <span>Mülakat tarihi *</span>
              <input type="date" name="tarih" required defaultValue={aktif?.tarih} />
            </label>
            <label>
              <span>Başlangıç saati *</span>
              <input type="time" name="saat" required defaultValue={aktif?.saat} />
            </label>
            <label>
              <span>Tahmini süre (dk)</span>
              <input type="number" name="sure" min={5} max={600} defaultValue={aktif?.sure ?? 30} />
            </label>
            <label>
              <span>Görüşme türü *</span>
              <select name="tur" value={tur} onChange={(e) => setTur(e.target.value)}>
                {MULAKAT_TURLERI.map((t) => (
                  <option key={t} value={t}>
                    {MULAKAT_TUR_ETIKETLERI[t]}
                  </option>
                ))}
              </select>
            </label>
            {tur === "online" && (
              <label className={ortak.tam}>
                <span>Görüşme bağlantısı</span>
                <input type="url" name="baglanti" placeholder="https://…" defaultValue={aktif?.baglanti} />
              </label>
            )}
            {tur === "yuzyuze" && (
              <label className={ortak.tam}>
                <span>Görüşme adresi</span>
                <input type="text" name="adres" placeholder="Adres" defaultValue={aktif?.adres} />
              </label>
            )}
            <label className={ortak.tam}>
              <span>Görüşmeyi yapacak kişi</span>
              <input type="text" name="gorusmeci" placeholder="Örn. Ayşe Yılmaz" defaultValue={aktif?.gorusmeci} />
            </label>
            <label className={ortak.tam}>
              <span>Başvurana gönderilecek açıklama</span>
              <textarea name="aciklama" rows={2} defaultValue={aktif?.aciklama} />
            </label>
          </div>
          <div className={ortak.formAlt}>
            {aktif && (
              <button type="button" className="btn btn-outline btn-kucuk" onClick={() => setPlanAcik(false)}>
                Vazgeç
              </button>
            )}
            <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
              {bekliyor ? "Kaydediliyor…" : aktif ? "Yeniden Planla" : "Mülakatı Planla"}
            </button>
          </div>
        </form>
      )}

      {/* Sonuç formu */}
      {aktif && !planAcik && (
        <form action={sonucKaydet} className={ortak.sonucForm}>
          <b className={ortak.altBaslik}>Mülakat sonucu</b>
          <div className={ortak.formGrid}>
            <label className={ortak.tam}>
              <span>Sonuç</span>
              <select name="sonuc" defaultValue={aktif.sonuc || ""} required>
                <option value="" disabled>
                  Seçiniz…
                </option>
                {MULAKAT_SONUCLARI.map((s) => (
                  <option key={s} value={s}>
                    {MULAKAT_SONUC_ETIKETLERI[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className={ortak.tam}>
              <span>Sonuç notu (yalnız yönetim)</span>
              <textarea name="sonucNotu" rows={2} defaultValue={aktif.sonucNotu} />
            </label>
          </div>
          <div className={ortak.formAlt}>
            <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
              {bekliyor ? "…" : "Sonucu Kaydet"}
            </button>
          </div>
        </form>
      )}

      {hata && <small className={ortak.hata}>{hata}</small>}

      {/* Geçmiş görüşmeler */}
      {gecmis.length > 0 && (
        <div className={ortak.gecmis}>
          <b className={ortak.altBaslik}>Geçmiş görüşmeler</b>
          <ul>
            {gecmis.map((g) => (
              <li key={g.id}>
                <span>{g.tarihMetni}</span>
                <small>
                  {MULAKAT_TUR_ETIKETLERI[g.tur as keyof typeof MULAKAT_TUR_ETIKETLERI] ?? g.tur}
                  {g.sonuc
                    ? ` · ${MULAKAT_SONUC_ETIKETLERI[g.sonuc as keyof typeof MULAKAT_SONUC_ETIKETLERI] ?? g.sonuc}`
                    : ""}
                </small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
