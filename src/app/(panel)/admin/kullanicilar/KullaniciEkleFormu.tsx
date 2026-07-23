"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { kullaniciEkle } from "@/actions/admin";
import stil from "./kullanicilar.module.css";

interface KocSecenegi {
  id: string;
  ad: string;
}

export default function KullaniciEkleFormu({ koclar }: { koclar: KocSecenegi[] }) {
  const [acik, setAcik] = useState(false);
  const [rol, setRol] = useState<"admin" | "koc" | "ogrenci">("ogrenci");
  const [mesaj, setMesaj] = useState<{ hata?: string; tamam?: string }>({});
  const [bekliyor, baslat] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function gonder(formData: FormData) {
    setMesaj({});
    baslat(async () => {
      const sonuc = await kullaniciEkle({
        rol: formData.get("rol"),
        ad: formData.get("ad"),
        kullanici: formData.get("kullanici"),
        sifre: formData.get("sifre"),
        eposta: formData.get("eposta") ?? "",
        brans: formData.get("brans") ?? "",
        sinif: formData.get("sinif") ?? "",
        hedef: formData.get("hedef") ?? "",
        kocId: formData.get("kocId") ?? "",
        telefon: formData.get("telefon") ?? "",
        veliTelefon: formData.get("veliTelefon") ?? "",
      });

      if (sonuc.hata) {
        setMesaj({ hata: sonuc.hata });
        return;
      }

      formRef.current?.reset();
      setRol("ogrenci");
      setMesaj({ tamam: "Kullanıcı oluşturuldu ve listeye eklendi." });
      router.refresh();
    });
  }

  return (
    <section className={`${stil.eklemeKart} ${acik ? stil.eklemeKartAcik : ""}`}>
      <div className={stil.eklemeBaslik}>
        <div>
          <span className={stil.eklemeIkon}>＋</span>
          <div>
            <h2>Yeni kullanıcı ekle</h2>
            <p>Yönetici, koç veya öğrenci hesabı oluşturun.</p>
          </div>
        </div>
        <button
          type="button"
          className={acik ? "btn btn-outline btn-kucuk" : "btn btn-primary btn-kucuk"}
          onClick={() => {
            setAcik((deger) => !deger);
            setMesaj({});
          }}
          aria-expanded={acik}
          aria-controls="kullanici-ekleme-formu"
        >
          {acik ? "Kapat" : "+ Kullanıcı Ekle"}
        </button>
      </div>

      {acik && (
        <form
          id="kullanici-ekleme-formu"
          ref={formRef}
          className={stil.eklemeFormu}
          action={gonder}
        >
          <div className={stil.formGrid}>
            <label className={stil.formGrup}>
              <span>Rol *</span>
              <select
                name="rol"
                value={rol}
                onChange={(e) => setRol(e.target.value as typeof rol)}
                required
              >
                <option value="ogrenci">Öğrenci</option>
                <option value="koc">Koç</option>
                <option value="admin">Yönetici</option>
              </select>
            </label>

            <label className={stil.formGrup}>
              <span>Ad Soyad *</span>
              <input name="ad" required autoComplete="name" placeholder="Ad Soyad" />
            </label>

            <label className={stil.formGrup}>
              <span>Kullanıcı Adı *</span>
              <input
                name="kullanici"
                required
                minLength={3}
                autoComplete="off"
                placeholder="kullaniciadi"
              />
            </label>

            <label className={stil.formGrup}>
              <span>Geçici Şifre *</span>
              <input
                name="sifre"
                type="password"
                required
                minLength={4}
                autoComplete="new-password"
                placeholder="En az 4 karakter"
              />
            </label>

            <label className={stil.formGrup}>
              <span>E-posta</span>
              <input name="eposta" type="email" autoComplete="email" placeholder="ornek@eposta.com" />
            </label>

            {rol === "koc" && (
              <label className={stil.formGrup}>
                <span>Branş</span>
                <input name="brans" placeholder="Örn. Matematik / Rehberlik" />
              </label>
            )}

            {rol === "ogrenci" && (
              <>
                <label className={stil.formGrup}>
                  <span>Sınıf</span>
                  <input name="sinif" placeholder="Örn. 11. Sınıf" />
                </label>
                <label className={stil.formGrup}>
                  <span>Hedef</span>
                  <input name="hedef" placeholder="Örn. YKS 2027" />
                </label>
                <label className={stil.formGrup}>
                  <span>Koç Ataması</span>
                  <select name="kocId" defaultValue="">
                    <option value="">Şimdilik atama</option>
                    {koclar.map((koc) => (
                      <option key={koc.id} value={koc.id}>{koc.ad}</option>
                    ))}
                  </select>
                </label>
                <label className={stil.formGrup}>
                  <span>Telefon</span>
                  <input name="telefon" type="tel" autoComplete="tel" placeholder="05xx xxx xx xx" />
                </label>
                <label className={stil.formGrup}>
                  <span>Veli Telefonu</span>
                  <input name="veliTelefon" type="tel" placeholder="05xx xxx xx xx" />
                </label>
              </>
            )}
          </div>

          <div className={stil.formAlt}>
            <p>
              Yeni hesap aktif olarak oluşturulur.
              E-posta girildiyse hoş geldin iletisi kuyruğa eklenir.
            </p>
            <button type="submit" className="btn btn-primary" disabled={bekliyor}>
              {bekliyor ? "Oluşturuluyor…" : "Kullanıcıyı Oluştur"}
            </button>
          </div>

          <div aria-live="polite">
            {mesaj.hata && <div className={stil.formHata}>{mesaj.hata}</div>}
            {mesaj.tamam && <div className={stil.formBasari}>{mesaj.tamam}</div>}
          </div>
        </form>
      )}
    </section>
  );
}
