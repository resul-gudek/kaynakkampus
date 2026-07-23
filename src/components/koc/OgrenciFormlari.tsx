"use client";

/* 👥 Öğrencilerim bölüm başlığı + "Yeni Öğrenci Ekle" ve "Mevcut Öğrenci Ata"
   formları — legacy yeniOgrForm / ataForm. */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ogrenciEkle, ogrenciAta } from "@/actions/ogrenci";
import s from "./koc.module.css";

interface AtanmamisOgrenci {
  id: string;
  ad: string;
  sinif: string;
}

export default function OgrenciFormlari({ atanmamis }: { atanmamis: AtanmamisOgrenci[] }) {
  const router = useRouter();
  const [acikForm, setAcikForm] = useState<"" | "yeni" | "ata">("");
  const [yeniMesaj, setYeniMesaj] = useState<{ metin: string; ok: boolean } | null>(null);
  const [ataMesaj, setAtaMesaj] = useState<{ metin: string; ok: boolean } | null>(null);
  const [bekliyor, baslat] = useTransition();

  function yeniGonder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    baslat(async () => {
      const sonuc = await ogrenciEkle({
        ad: String(fd.get("ad") ?? "").trim(),
        sinif: String(fd.get("sinif") ?? "").trim(),
        hedef: String(fd.get("hedef") ?? "").trim(),
        kullanici: String(fd.get("kullanici") ?? ""),
        sifre: String(fd.get("sifre") ?? ""),
        telefon: String(fd.get("telefon") ?? ""),
        veliTelefon: String(fd.get("veliTelefon") ?? ""),
      });
      if (sonuc.hata) {
        setYeniMesaj({ metin: sonuc.hata, ok: false });
        return;
      }
      setYeniMesaj({ metin: "Öğrenci eklendi ve sana atandı. ✓", ok: true });
      form.reset();
      router.refresh();
    });
  }

  function ataGonder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const id = String(fd.get("ogrenciId") ?? "");
    if (!id) {
      setAtaMesaj({ metin: "Atanacak öğrenci bulunamadı.", ok: false });
      return;
    }
    baslat(async () => {
      const sonuc = await ogrenciAta(id);
      if (sonuc.hata) {
        setAtaMesaj({ metin: sonuc.hata, ok: false });
        return;
      }
      setAtaMesaj({ metin: "Öğrenci sana atandı. ✓", ok: true });
      router.refresh();
    });
  }

  return (
    <>
      <div className={s.bolumBas}>
        <h2>👥 Öğrencilerim</h2>
        <div className={s.basButonlar}>
          <button
            type="button"
            className="btn btn-outline btn-kucuk"
            onClick={() => setAcikForm(acikForm === "ata" ? "" : "ata")}
          >
            Mevcut Öğrenci Ata
          </button>
          <button
            type="button"
            className="btn btn-primary btn-kucuk"
            onClick={() => setAcikForm(acikForm === "yeni" ? "" : "yeni")}
          >
            + Yeni Öğrenci Ekle
          </button>
        </div>
      </div>

      {acikForm === "yeni" && (
        <form className={s.kutuForm} onSubmit={yeniGonder}>
          <div className={s.formIzgara}>
            <div className={s.formGrup}>
              <label>Ad Soyad</label>
              <input name="ad" required placeholder="Örn. Ali Veli" />
            </div>
            <div className={s.formGrup}>
              <label>Sınıf</label>
              <input name="sinif" placeholder="Örn. 12. Sınıf" />
            </div>
            <div className={s.formGrup}>
              <label>Hedef</label>
              <input name="hedef" placeholder="Örn. YKS – Mühendislik" />
            </div>
            <div className={s.formGrup}>
              <label>Kullanıcı Adı</label>
              <input name="kullanici" required placeholder="ogrenci4" />
            </div>
            <div className={s.formGrup}>
              <label>Şifre</label>
              <input name="sifre" required placeholder="şifre" />
            </div>
            <div className={s.formGrup}>
              <label>Öğrenci Telefonu (WhatsApp)</label>
              <input name="telefon" placeholder="05xx xxx xx xx" />
            </div>
            <div className={s.formGrup}>
              <label>Veli Telefonu (WhatsApp)</label>
              <input name="veliTelefon" placeholder="05xx xxx xx xx" />
            </div>
          </div>
          <div className={s.formAlt}>
            <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
              Kaydet ve Ata
            </button>
            {yeniMesaj && (
              <span className={`${s.formMesaj} ${yeniMesaj.ok ? s.ok : s.hataMsj}`}>
                {yeniMesaj.metin}
              </span>
            )}
          </div>
        </form>
      )}

      {acikForm === "ata" && (
        <form className={s.kutuForm} onSubmit={ataGonder}>
          <div className={s.formIzgara}>
            <div className={s.formGrup}>
              <label>Öğretmeni olmayan öğrenciler</label>
              <select name="ogrenciId" defaultValue={atanmamis[0]?.id ?? ""}>
                {atanmamis.length ? (
                  atanmamis.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.ad} {o.sinif ? `(${o.sinif})` : ""}
                    </option>
                  ))
                ) : (
                  <option value="">Öğretmensiz öğrenci yok</option>
                )}
              </select>
            </div>
          </div>
          <div className={s.formAlt}>
            <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
              Bana Ata
            </button>
            {ataMesaj && (
              <span className={`${s.formMesaj} ${ataMesaj.ok ? s.ok : s.hataMsj}`}>
                {ataMesaj.metin}
              </span>
            )}
          </div>
        </form>
      )}
    </>
  );
}
