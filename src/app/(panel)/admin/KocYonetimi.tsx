"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { kocEkle, kocAktifDegistir, kocSifreSifirla, kocSil } from "@/actions/admin";
import stil from "./admin.module.css";

export interface KocGorunum {
  id: string;
  ad: string;
  kullanici: string;
  brans: string;
  aktif: boolean;
  ogrenciSayisi: number;
}

export default function KocYonetimi({ koclar }: { koclar: KocGorunum[] }) {
  const [mesaj, setMesaj] = useState<{ hata?: string; tamam?: string }>({});
  const [bekliyor, baslat] = useTransition();
  const router = useRouter();

  function calistir(islem: () => Promise<{ hata?: string }>, basari: string) {
    baslat(async () => {
      const s = await islem();
      setMesaj(s.hata ? { hata: s.hata } : { tamam: basari });
      router.refresh();
    });
  }

  return (
    <>
      <div className={stil.bolum}>
        <h2>
          ➕ <span>Yeni Koç Ekle</span>
        </h2>
        <form
          className={stil.form}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const form = e.currentTarget;
            calistir(
              () =>
                kocEkle({
                  ad: f.get("ad"),
                  kullanici: f.get("kullanici"),
                  sifre: f.get("sifre"),
                  brans: f.get("brans"),
                }),
              "Koç eklendi."
            );
            form.reset();
          }}
        >
          <div className={stil.formGrup}>
            <label htmlFor="ad">Ad Soyad</label>
            <input id="ad" name="ad" required placeholder="Ad Soyad" />
          </div>
          <div className={stil.formGrup}>
            <label htmlFor="kullanici">Kullanıcı Adı</label>
            <input id="kullanici" name="kullanici" required minLength={3} placeholder="kullanıcı adı" />
          </div>
          <div className={stil.formGrup}>
            <label htmlFor="sifre">Şifre</label>
            <input id="sifre" name="sifre" type="password" required minLength={4} placeholder="••••••" />
          </div>
          <div className={stil.formGrup}>
            <label htmlFor="brans">Branş</label>
            <input id="brans" name="brans" placeholder="örn. Matematik / Rehberlik" />
          </div>
          <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
            Ekle
          </button>
        </form>
        {mesaj.hata && <div className={stil.hata}>{mesaj.hata}</div>}
        {mesaj.tamam && <div className={stil.tamam}>{mesaj.tamam}</div>}
      </div>

      <div className={stil.bolum}>
        <h2>
          👩‍🏫 <span>Koçlar</span> ({koclar.length})
        </h2>
        <div className={stil.tabloSarici}>
          <table className={stil.tablo}>
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>Kullanıcı</th>
                <th>Branş</th>
                <th>Öğrenci</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {koclar.map((k) => (
                <tr key={k.id} className={k.aktif ? "" : stil.pasif}>
                  <td>
                    <b>{k.ad}</b>
                  </td>
                  <td>{k.kullanici}</td>
                  <td>{k.brans || "—"}</td>
                  <td>{k.ogrenciSayisi}</td>
                  <td>
                    <span className={k.aktif ? stil.durumAktif : stil.durumPasif}>
                      {k.aktif ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td>
                    <div className={stil.islemler}>
                      <button
                        className="btn btn-outline btn-kucuk"
                        disabled={bekliyor}
                        onClick={() =>
                          calistir(
                            () => kocAktifDegistir(k.id, !k.aktif),
                            k.aktif ? "Koç pasifleştirildi (giriş yapamaz)." : "Koç aktifleştirildi."
                          )
                        }
                      >
                        {k.aktif ? "Pasifleştir" : "Aktifleştir"}
                      </button>
                      <button
                        className="btn btn-outline btn-kucuk"
                        disabled={bekliyor}
                        onClick={() => {
                          const yeni = prompt(`${k.ad} için yeni şifre (en az 4 karakter):`);
                          if (!yeni) return;
                          calistir(() => kocSifreSifirla(k.id, yeni), "Şifre güncellendi.");
                        }}
                      >
                        Şifre Sıfırla
                      </button>
                      <button
                        className="btn btn-outline btn-kucuk"
                        style={{ borderColor: "#b91c1c", color: "#b91c1c" }}
                        disabled={bekliyor}
                        onClick={() => {
                          if (
                            !confirm(
                              `${k.ad} silinsin mi?\n\nKoça ait ödev/takip/yol/özel ders kayıtları silinir; öğrencileri "atanmamış" duruma geçer. Bu işlem geri alınamaz.`
                            )
                          )
                            return;
                          calistir(() => kocSil(k.id), "Koç silindi.");
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {koclar.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--muted)" }}>
                    Henüz koç yok. Yukarıdaki formdan ekleyin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
