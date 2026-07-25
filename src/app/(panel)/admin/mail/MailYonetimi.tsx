"use client";

/* E-posta yönetimi arayüzü: SMTP ayarları + şablon düzenleme + kuyruk izleme.
   Genel tablo/form stilleri admin.module.css'ten, mail'e özel ekler mail.module.css'ten. */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  mailAyarKaydet,
  mailTestGonder,
  mailSablonKaydet,
  mailKuyrukIsle,
  mailYenidenDene,
  mailKuyrukSil,
  mailKuyrukTemizle,
} from "@/actions/mail";
import stil from "../admin.module.css";
import ek from "./mail.module.css";

export interface AyarGorunum {
  aktif: boolean;
  sunucu: string;
  port: number;
  guvenli: boolean;
  kullaniciAdi: string;
  sifreVar: boolean;
  gonderenAd: string;
  gonderenAdres: string;
  hatirlatmaSaat: number;
  veliRaporAktif: boolean;
  dersHatirlatmaDk: number;
}

export interface SablonGorunum {
  anahtar: string;
  ad: string;
  aciklama: string;
  degiskenler: { ad: string; aciklama: string }[];
  konu: string;
  govde: string;
  aktif: boolean;
}

export interface KuyrukGorunum {
  id: string;
  alici: string;
  aliciAd: string;
  konu: string;
  durum: string;
  deneme: number;
  sonHata: string;
  sablon: string;
  planlanan: string;
  gonderim: string;
}

export interface KuyrukSayilari {
  bekliyor: number;
  gonderildi: number;
  hata: number;
}

const DURUM_METNI: Record<string, string> = {
  bekliyor: "Bekliyor",
  gonderildi: "Gönderildi",
  hata: "Hata",
};

export default function MailYonetimi({
  ayar,
  sablonlar,
  kuyruk,
  sayilar,
}: {
  ayar: AyarGorunum;
  sablonlar: SablonGorunum[];
  kuyruk: KuyrukGorunum[];
  sayilar: KuyrukSayilari;
}) {
  const router = useRouter();
  const [bekliyor, baslat] = useTransition();
  const [ayarMesaj, setAyarMesaj] = useState<{ hata?: string; tamam?: string }>({});
  const [sablonMesaj, setSablonMesaj] = useState<Record<string, { hata?: string; tamam?: string }>>({});
  const [kuyrukMesaj, setKuyrukMesaj] = useState<{ hata?: string; tamam?: string }>({});

  function calistir(
    islem: () => Promise<{ hata?: string; mesaj?: string }>,
    basari: string,
    hedef: (m: { hata?: string; tamam?: string }) => void
  ) {
    baslat(async () => {
      const s = await islem();
      hedef(s.hata ? { hata: s.hata } : { tamam: s.mesaj ?? basari });
      router.refresh();
    });
  }

  return (
    <>
      {/* ── SMTP Ayarları ─────────────────────────────────── */}
      <div className={stil.bolum}>
        <h2>
          ⚙️ <span>Mail Ayarları</span>
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            calistir(
              () =>
                mailAyarKaydet({
                  aktif: f.get("aktif") === "on",
                  sunucu: f.get("sunucu"),
                  port: f.get("port"),
                  guvenli: f.get("guvenli") === "on",
                  kullaniciAdi: f.get("kullaniciAdi"),
                  sifre: f.get("sifre"),
                  gonderenAd: f.get("gonderenAd"),
                  gonderenAdres: f.get("gonderenAdres"),
                  hatirlatmaSaat: f.get("hatirlatmaSaat"),
                  veliRaporAktif: f.get("veliRaporAktif") === "on",
                  dersHatirlatmaDk: f.get("dersHatirlatmaDk"),
                }),
              "Ayarlar kaydedildi.",
              setAyarMesaj
            );
          }}
        >
          <div className={ek.izgara}>
            <div className={stil.formGrup}>
              <label htmlFor="m-sunucu">SMTP Sunucusu</label>
              <input id="m-sunucu" name="sunucu" defaultValue={ayar.sunucu} placeholder="örn. smtp.gmail.com" />
            </div>
            <div className={stil.formGrup}>
              <label htmlFor="m-port">Port</label>
              <input id="m-port" name="port" type="number" min={1} max={65535} defaultValue={ayar.port} />
            </div>
            <div className={stil.formGrup}>
              <label htmlFor="m-kullanici">SMTP Kullanıcı Adı</label>
              <input id="m-kullanici" name="kullaniciAdi" defaultValue={ayar.kullaniciAdi} placeholder="ornek@alan.com" />
            </div>
            <div className={stil.formGrup}>
              <label htmlFor="m-sifre">SMTP Şifresi</label>
              <input
                id="m-sifre"
                name="sifre"
                type="password"
                placeholder={ayar.sifreVar ? "•••••• (değiştirmek için yazın)" : "şifre / uygulama şifresi"}
              />
            </div>
            <div className={stil.formGrup}>
              <label htmlFor="m-gonderenAd">Gönderen Adı</label>
              <input id="m-gonderenAd" name="gonderenAd" defaultValue={ayar.gonderenAd} />
            </div>
            <div className={stil.formGrup}>
              <label htmlFor="m-gonderenAdres">Gönderen Adresi (From)</label>
              <input id="m-gonderenAdres" name="gonderenAdres" defaultValue={ayar.gonderenAdres} placeholder="bilgi@kaynakakademi.com" />
            </div>
            <div className={stil.formGrup}>
              <label htmlFor="m-hatirlatma">Özel Ders Hatırlatma Maili (saat önce)</label>
              <input id="m-hatirlatma" name="hatirlatmaSaat" type="number" min={1} max={168} defaultValue={ayar.hatirlatmaSaat} />
            </div>
            <div className={stil.formGrup}>
              <label htmlFor="m-ders-hatirlatma">Online Ders Bildirimi (dk önce, varsayılan)</label>
              <input id="m-ders-hatirlatma" name="dersHatirlatmaDk" type="number" min={1} max={1440} defaultValue={ayar.dersHatirlatmaDk} />
            </div>
          </div>
          <div className={ek.onaylar}>
            <label className={ek.onayKutu}>
              <input type="checkbox" name="guvenli" defaultChecked={ayar.guvenli} />
              SSL/TLS (port 465; kapalıysa STARTTLS/587)
            </label>
            <label className={ek.onayKutu}>
              <input type="checkbox" name="aktif" defaultChecked={ayar.aktif} />
              <b>Mail gönderimi aktif</b>
            </label>
            <label className={ek.onayKutu}>
              <input type="checkbox" name="veliRaporAktif" defaultChecked={ayar.veliRaporAktif} />
              Haftalık veli ilerleme raporu (otomatik)
            </label>
          </div>
          <div className={ek.butonSira}>
            <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
              Kaydet
            </button>
            <button
              type="button"
              className="btn btn-outline btn-kucuk"
              disabled={bekliyor}
              onClick={() => {
                const adres = prompt("Test maili gönderilecek adres:");
                if (!adres) return;
                calistir(() => mailTestGonder(adres), "Test maili gönderildi. ✓", setAyarMesaj);
              }}
            >
              Test Maili Gönder
            </button>
          </div>
        </form>
        {ayarMesaj.hata && <div className={stil.hata}>{ayarMesaj.hata}</div>}
        {ayarMesaj.tamam && <div className={stil.tamam}>{ayarMesaj.tamam}</div>}
        {!ayar.aktif && (
          <p className={ek.kucukNot}>
            Gönderim şu an <b>kapalı</b>: hoş geldin ve ders hatırlatma mailleri kuyruklanmaz.
          </p>
        )}
      </div>

      {/* ── Şablonlar ─────────────────────────────────────── */}
      <div className={stil.bolum}>
        <h2>
          📄 <span>Mail Şablonları</span>
        </h2>
        {sablonlar.map((s) => {
          const mesaj = sablonMesaj[s.anahtar] ?? {};
          return (
            <form
              key={s.anahtar}
              className={ek.sablonKutu}
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                calistir(
                  () =>
                    mailSablonKaydet({
                      anahtar: s.anahtar,
                      konu: f.get("konu"),
                      govde: f.get("govde"),
                      aktif: f.get("aktif") === "on",
                    }),
                  "Şablon kaydedildi.",
                  (m) => setSablonMesaj((o) => ({ ...o, [s.anahtar]: m }))
                );
              }}
            >
              <div className={ek.sablonBas}>
                <h3>{s.ad}</h3>
                <label className={ek.onayKutu}>
                  <input type="checkbox" name="aktif" defaultChecked={s.aktif} />
                  Aktif
                </label>
              </div>
              {s.aciklama && <p className={ek.kucukNot}>{s.aciklama}</p>}
              <div className={stil.formGrup}>
                <label htmlFor={`konu-${s.anahtar}`}>Konu</label>
                <input id={`konu-${s.anahtar}`} name="konu" defaultValue={s.konu} required />
              </div>
              <div className={stil.formGrup}>
                <label htmlFor={`govde-${s.anahtar}`}>Gövde (HTML)</label>
                <textarea
                  id={`govde-${s.anahtar}`}
                  name="govde"
                  defaultValue={s.govde}
                  rows={10}
                  required
                  className={ek.metinAlani}
                />
              </div>
              {s.degiskenler.length > 0 && (
                <p className={ek.kucukNot}>
                  Kullanılabilir değişkenler:{" "}
                  {s.degiskenler.map((d) => (
                    <span key={d.ad} className={ek.degisken} title={d.aciklama}>
                      {"{{" + d.ad + "}}"}
                    </span>
                  ))}
                </p>
              )}
              <div className={ek.butonSira}>
                <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
                  Şablonu Kaydet
                </button>
              </div>
              {mesaj.hata && <div className={stil.hata}>{mesaj.hata}</div>}
              {mesaj.tamam && <div className={stil.tamam}>{mesaj.tamam}</div>}
            </form>
          );
        })}
      </div>

      {/* ── Kuyruk ────────────────────────────────────────── */}
      <div className={stil.bolum}>
        <h2>
          📬 <span>Mail Kuyruğu</span> ({sayilar.bekliyor} bekliyor · {sayilar.gonderildi} gönderildi ·{" "}
          {sayilar.hata} hatalı)
        </h2>
        <div className={ek.butonSira}>
          <button
            type="button"
            className="btn btn-primary btn-kucuk"
            disabled={bekliyor}
            onClick={() => calistir(() => mailKuyrukIsle(), "Kuyruk işlendi.", setKuyrukMesaj)}
          >
            Kuyruğu Şimdi İşle
          </button>
          <button
            type="button"
            className="btn btn-outline btn-kucuk"
            disabled={bekliyor}
            onClick={() => {
              if (!confirm("Sonuçlanmış (gönderildi/hatalı) tüm kayıtlar silinsin mi?")) return;
              calistir(() => mailKuyrukTemizle(), "Sonuçlanmış kayıtlar temizlendi.", setKuyrukMesaj);
            }}
          >
            Sonuçlananları Temizle
          </button>
        </div>
        {kuyrukMesaj.hata && <div className={stil.hata}>{kuyrukMesaj.hata}</div>}
        {kuyrukMesaj.tamam && <div className={stil.tamam}>{kuyrukMesaj.tamam}</div>}
        <div className={stil.tabloSarici}>
          <table className={stil.tablo}>
            <thead>
              <tr>
                <th>Alıcı</th>
                <th>Konu</th>
                <th>Şablon</th>
                <th>Durum</th>
                <th>Deneme</th>
                <th>Planlanan</th>
                <th>Gönderim</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {kuyruk.map((m) => (
                <tr key={m.id}>
                  <td>
                    <b>{m.aliciAd || "—"}</b>
                    <div className={ek.kucukNot}>{m.alici}</div>
                  </td>
                  <td className={ek.konuHucre} title={m.konu} data-label="Konu">
                    {m.konu}
                  </td>
                  <td data-label="Şablon">{m.sablon || "—"}</td>
                  <td data-label="Durum">
                    <span
                      className={
                        m.durum === "gonderildi"
                          ? stil.durumAktif
                          : m.durum === "hata"
                            ? stil.durumPasif
                            : ek.durumBekliyor
                      }
                      title={m.sonHata || undefined}
                    >
                      {DURUM_METNI[m.durum] ?? m.durum}
                    </span>
                    {m.sonHata && <div className={ek.hataNot} title={m.sonHata}>{m.sonHata}</div>}
                  </td>
                  <td data-label="Deneme">{m.deneme}</td>
                  <td data-label="Planlanan">{m.planlanan}</td>
                  <td data-label="Gönderim">{m.gonderim || "—"}</td>
                  <td data-label="İşlemler">
                    <div className={stil.islemler}>
                      {m.durum !== "gonderildi" && (
                        <button
                          className="btn btn-outline btn-kucuk"
                          disabled={bekliyor}
                          onClick={() =>
                            calistir(() => mailYenidenDene(m.id), "Yeniden gönderime alındı.", setKuyrukMesaj)
                          }
                        >
                          Yeniden Dene
                        </button>
                      )}
                      <button
                        className="btn btn-outline btn-kucuk"
                        style={{ borderColor: "#b91c1c", color: "#b91c1c" }}
                        disabled={bekliyor}
                        onClick={() => {
                          if (!confirm("Bu kuyruk kaydı silinsin mi?")) return;
                          calistir(() => mailKuyrukSil(m.id), "Kayıt silindi.", setKuyrukMesaj);
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {kuyruk.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--muted)" }}>
                    Kuyruk boş. Mailler kuyruklandıkça burada listelenir (son 50 kayıt).
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
