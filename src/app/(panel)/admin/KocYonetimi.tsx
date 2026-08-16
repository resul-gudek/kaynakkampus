"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  kocEkle,
  kocAktifDegistir,
  kocSifreSifirla,
  kocSil,
  egitmenRolDegistir,
} from "@/actions/admin";
import type { EgitmenRol } from "@/lib/sabitler";
import stil from "./admin.module.css";

export interface KocGorunum {
  id: string;
  ad: string;
  kullanici: string;
  brans: string;
  aktif: boolean;
  ogrenciSayisi: number;
}

/* Koç ve öğretmen AYRI rollerdir; yönetim ekranı ortaktır ama her sayfa
   yalnız kendi rolünü listeler ve eylemleri o rolle sınırlar (bkz. actions/admin.ts). */
const METIN: Record<
  EgitmenRol,
  { tekil: string; yonelme: string; cogul: string; ikon: string; brans: string }
> = {
  koc: {
    tekil: "Koç",
    yonelme: "Koça", // "…rolüne taşı" ifadesindeki ek (ünlü uyumu)
    cogul: "Koçlar",
    ikon: "🧭",
    brans: "örn. Rehberlik / Sınav Koçluğu",
  },
  ogretmen: {
    tekil: "Öğretmen",
    yonelme: "Öğretmene",
    cogul: "Öğretmenler",
    ikon: "👩‍🏫",
    brans: "örn. Matematik / Fizik",
  },
};

export default function KocYonetimi({
  koclar,
  rol = "koc",
}: {
  koclar: KocGorunum[];
  rol?: EgitmenRol;
}) {
  const [mesaj, setMesaj] = useState<{ hata?: string; tamam?: string }>({});
  const [bekliyor, baslat] = useTransition();
  const router = useRouter();
  const m = METIN[rol];
  const karsiRol: EgitmenRol = rol === "koc" ? "ogretmen" : "koc";
  const karsi = METIN[karsiRol];

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
          ➕ <span>Yeni {m.tekil} Ekle</span>
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
                  rol,
                  ad: f.get("ad"),
                  kullanici: f.get("kullanici"),
                  sifre: f.get("sifre"),
                  brans: f.get("brans"),
                  eposta: f.get("eposta"),
                }),
              `${m.tekil} eklendi.`
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
            <input id="brans" name="brans" placeholder={m.brans} />
          </div>
          <div className={stil.formGrup}>
            <label htmlFor="eposta">E-posta (hoş geldin maili için)</label>
            <input id="eposta" name="eposta" type="email" placeholder="ornek@eposta.com" />
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
          {m.ikon} <span>{m.cogul}</span> ({koclar.length})
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
                  <td data-label="Kullanıcı">{k.kullanici}</td>
                  <td data-label="Branş">{k.brans || "—"}</td>
                  <td data-label="Öğrenci">{k.ogrenciSayisi}</td>
                  <td data-label="Durum">
                    <span className={k.aktif ? stil.durumAktif : stil.durumPasif}>
                      {k.aktif ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td data-label="İşlemler">
                    <div className={stil.islemler}>
                      <button
                        className="btn btn-outline btn-kucuk"
                        disabled={bekliyor}
                        onClick={() =>
                          calistir(
                            () => kocAktifDegistir(k.id, !k.aktif, rol),
                            k.aktif
                              ? `${m.tekil} pasifleştirildi (giriş yapamaz).`
                              : `${m.tekil} aktifleştirildi.`
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
                          calistir(() => kocSifreSifirla(k.id, yeni, rol), "Şifre güncellendi.");
                        }}
                      >
                        Şifre Sıfırla
                      </button>
                      <button
                        className="btn btn-outline btn-kucuk"
                        disabled={bekliyor}
                        onClick={() => {
                          if (
                            !confirm(
                              `${k.ad} hesabı "${karsi.tekil}" rolüne taşınsın mı?\n\nÖğrencileri, dersleri ve ödeme kayıtları korunur; yalnız rolü değişir. Bundan sonra giriş ekranında "${karsi.tekil}" sekmesini seçmelidir.`
                            )
                          )
                            return;
                          calistir(
                            () => egitmenRolDegistir(k.id, karsiRol),
                            `${k.ad} artık ${karsi.tekil} rolünde.`
                          );
                        }}
                      >
                        {karsi.yonelme} Taşı
                      </button>
                      <button
                        className="btn btn-outline btn-kucuk"
                        style={{ borderColor: "#b91c1c", color: "#b91c1c" }}
                        disabled={bekliyor}
                        onClick={() => {
                          if (
                            !confirm(
                              `${k.ad} silinsin mi?\n\nHesaba ait ödev/takip/yol/özel ders kayıtları silinir; öğrencileri "atanmamış" duruma geçer. Bu işlem geri alınamaz.`
                            )
                          )
                            return;
                          calistir(() => kocSil(k.id, rol), `${m.tekil} silindi.`);
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
                    Henüz {m.tekil.toLocaleLowerCase("tr-TR")} yok. Yukarıdaki formdan ekleyin.
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
