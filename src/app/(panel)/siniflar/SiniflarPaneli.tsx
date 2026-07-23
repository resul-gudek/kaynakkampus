"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  dersOturumuIptal,
  dersOturumuOlustur,
  dersOturumuTamamla,
  sinifOlustur,
  sinifaOgrenciEkle,
  siniftanOgrenciCikar,
} from "@/actions/sinif";
import s from "./siniflar.module.css";

export interface OturumGorunum {
  id: string;
  baslik: string;
  konu: string;
  baslangic: string;
  sure: number;
  durum: string;
  kayitEtkin: boolean;
}

export interface SinifGorunum {
  id: string;
  ad: string;
  ders: string;
  seviye: string;
  aciklama: string;
  kapasite: number;
  aktif: boolean;
  ogretmenAd: string;
  uyeler: { id: string; ad: string; sinif: string }[];
  oturumlar: OturumGorunum[];
}

interface Props {
  rol: "koc" | "ogrenci";
  siniflar: SinifGorunum[];
  ogrenciler: { id: string; ad: string; sinif: string }[];
}

const tarihSaat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "long",
  timeStyle: "short",
});

export default function SiniflarPaneli({ rol, siniflar, ogrenciler }: Props) {
  const router = useRouter();
  const [formAcik, setFormAcik] = useState(false);
  const [simdi] = useState(() => Date.now());
  const [bekliyor, baslat] = useTransition();
  const gelecekOturumlar = siniflar
    .flatMap((x) => x.oturumlar)
    .filter((x) => x.durum === "planlandi" && new Date(x.baslangic).getTime() > simdi).length;

  function calistir(islem: () => Promise<{ hata?: string; tamam?: boolean }>, sonra?: () => void) {
    baslat(async () => {
      const sonuc = await islem();
      if (sonuc.hata) alert(sonuc.hata);
      else {
        sonra?.();
        router.refresh();
      }
    });
  }

  function sinifGonder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    calistir(
      () =>
        sinifOlustur({
          ad: fd.get("ad"),
          ders: fd.get("ders"),
          seviye: fd.get("seviye"),
          aciklama: fd.get("aciklama"),
          kapasite: fd.get("kapasite"),
        }),
      () => {
        form.reset();
        setFormAcik(false);
      }
    );
  }

  return (
    <main className="container">
      <div className="panel-bas">
        <h1>
          💻 Online <span>Sınıflar</span>
        </h1>
        <p>
          {rol === "koc"
            ? "Öğrencilerini sınıflara ayır, canlı derslerini planla ve katılımı tek yerden yönet."
            : "Kayıtlı olduğun sınıfları ve yaklaşan canlı derslerini buradan takip et."}
        </p>
      </div>

      <div className="stat-grid">
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#e8effe" }}>🏫</div>
          <div><b>{siniflar.length}</b><small>Aktif Sınıf</small></div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#fff7ed" }}>📅</div>
          <div><b>{gelecekOturumlar}</b><small>Yaklaşan Ders</small></div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#f0fdf4" }}>👥</div>
          <div>
            <b>{rol === "koc" ? new Set(siniflar.flatMap((x) => x.uyeler.map((u) => u.id))).size : siniflar.reduce((t, x) => t + x.uyeler.length, 0)}</b>
            <small>{rol === "koc" ? "Sınıflardaki Öğrenci" : "Sınıf Arkadaşı"}</small>
          </div>
        </div>
        <div className="stat-kart">
          <div className="stat-ikon" style={{ background: "#fef2f2" }}>⏺</div>
          <div><b>Kapalı</b><small>Ders Kaydı</small></div>
        </div>
      </div>

      {rol === "koc" && (
        <section className={s.ustEylem}>
          <div>
            <h2>Sınıf yönetimi</h2>
            <p>Bir sınıf bir öğrenciyle birebir, birden fazla öğrenciyle grup dersi olarak kullanılabilir.</p>
          </div>
          <button className="btn btn-primary btn-kucuk" onClick={() => setFormAcik((x) => !x)}>
            {formAcik ? "Formu Kapat" : "＋ Yeni Sınıf"}
          </button>
        </section>
      )}

      {rol === "koc" && formAcik && (
        <form className={s.form} onSubmit={sinifGonder}>
          <div className={s.formIzgara}>
            <label><span>Sınıf adı</span><input name="ad" required placeholder="Örn. 8-A Matematik Grubu" /></label>
            <label><span>Ders</span><input name="ders" required placeholder="Matematik" /></label>
            <label><span>Seviye / sınıf</span><input name="seviye" placeholder="8. Sınıf" /></label>
            <label><span>Kapasite</span><input name="kapasite" type="number" min={1} max={100} defaultValue={12} /></label>
          </div>
          <label><span>Açıklama</span><textarea name="aciklama" rows={3} placeholder="Sınıfın amacı ve çalışma düzeni" /></label>
          <button className="btn btn-primary btn-kucuk" disabled={bekliyor}>Sınıfı Oluştur</button>
        </form>
      )}

      <div className={s.sinifListe}>
        {siniflar.length ? (
          siniflar.map((sinif) => (
            <SinifKarti
              key={sinif.id}
              sinif={sinif}
              rol={rol}
              ogrenciler={ogrenciler}
              simdi={simdi}
              bekliyor={bekliyor}
              calistir={calistir}
            />
          ))
        ) : (
          <div className={s.bos}>
            <span>🏫</span>
            <b>Henüz online sınıf yok.</b>
            <p>{rol === "koc" ? "İlk sınıfını oluşturarak başlayabilirsin." : "Öğretmenin seni bir sınıfa eklediğinde burada görünecek."}</p>
          </div>
        )}
      </div>
    </main>
  );
}

function SinifKarti({
  sinif,
  rol,
  ogrenciler,
  simdi,
  bekliyor,
  calistir,
}: {
  sinif: SinifGorunum;
  rol: "koc" | "ogrenci";
  ogrenciler: Props["ogrenciler"];
  simdi: number;
  bekliyor: boolean;
  calistir: (islem: () => Promise<{ hata?: string; tamam?: boolean }>, sonra?: () => void) => void;
}) {
  const [dersFormu, setDersFormu] = useState(false);
  const adaylar = ogrenciler.filter((o) => !sinif.uyeler.some((uye) => uye.id === o.id));
  const oturumlar = [...sinif.oturumlar].sort(
    (a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime()
  );

  function uyeEkle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const ogrenciId = String(new FormData(form).get("ogrenciId") ?? "");
    if (ogrenciId) calistir(() => sinifaOgrenciEkle(sinif.id, ogrenciId), () => form.reset());
  }

  function dersGonder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    calistir(
      () =>
        dersOturumuOlustur({
          sinifId: sinif.id,
          baslik: fd.get("baslik"),
          konu: fd.get("konu"),
          baslangic: fd.get("baslangic"),
          sure: fd.get("sure"),
        }),
      () => {
        form.reset();
        setDersFormu(false);
      }
    );
  }

  return (
    <article className={s.sinifKart}>
      <header className={s.sinifBas}>
        <div className={s.sinifIkon}>📐</div>
        <div>
          <h2>{sinif.ad}</h2>
          <p>{sinif.ders}{sinif.seviye ? ` · ${sinif.seviye}` : ""} · {sinif.ogretmenAd}</p>
        </div>
        <span className="tag">{sinif.uyeler.length}/{sinif.kapasite} öğrenci</span>
      </header>
      {sinif.aciklama && <p className={s.aciklama}>{sinif.aciklama}</p>}

      <div className={s.ikiKolon}>
        <div>
          <div className={s.altBaslik}><h3>Öğrenciler</h3><span>{sinif.uyeler.length}</span></div>
          <div className={s.uyeListe}>
            {sinif.uyeler.length ? sinif.uyeler.map((uye) => (
              <div key={uye.id} className={s.uye}>
                <span className="avatar">{uye.ad.split(" ").map((x) => x[0]).join("").slice(0, 2)}</span>
                <div><b>{uye.ad}</b><small>{uye.sinif || "Sınıf bilgisi yok"}</small></div>
                {rol === "koc" && (
                  <button
                    type="button"
                    title="Sınıftan çıkar"
                    disabled={bekliyor}
                    onClick={() => {
                      if (confirm(`${uye.ad} sınıftan çıkarılsın mı?`)) {
                        calistir(() => siniftanOgrenciCikar(sinif.id, uye.id));
                      }
                    }}
                  >×</button>
                )}
              </div>
            )) : <p className={s.miniBos}>Sınıfa henüz öğrenci eklenmedi.</p>}
          </div>
          {rol === "koc" && adaylar.length > 0 && sinif.uyeler.length < sinif.kapasite && (
            <form className={s.ekleSatir} onSubmit={uyeEkle}>
              <select name="ogrenciId" required defaultValue="">
                <option value="" disabled>Öğrenci seç</option>
                {adaylar.map((o) => <option key={o.id} value={o.id}>{o.ad}{o.sinif ? ` · ${o.sinif}` : ""}</option>)}
              </select>
              <button className="btn btn-outline btn-kucuk" disabled={bekliyor}>Ekle</button>
            </form>
          )}
        </div>

        <div>
          <div className={s.altBaslik}>
            <h3>Ders oturumları</h3>
            {rol === "koc" && (
              <button className="btn btn-primary btn-kucuk" onClick={() => setDersFormu((x) => !x)}>
                {dersFormu ? "Kapat" : "＋ Ders Planla"}
              </button>
            )}
          </div>
          {rol === "koc" && dersFormu && (
            <form className={s.dersForm} onSubmit={dersGonder}>
              <input name="baslik" required placeholder="Ders başlığı" />
              <input name="konu" placeholder="Konu" />
              <input name="baslangic" type="datetime-local" required />
              <select name="sure" defaultValue="60">
                <option value="30">30 dakika</option>
                <option value="45">45 dakika</option>
                <option value="60">60 dakika</option>
                <option value="90">90 dakika</option>
                <option value="120">120 dakika</option>
              </select>
              <button className="btn btn-primary btn-kucuk" disabled={bekliyor}>Planla</button>
            </form>
          )}
          <div className={s.oturumListe}>
            {oturumlar.length ? oturumlar.map((oturum) => (
              <div key={oturum.id} className={`${s.oturum} ${oturum.durum === "iptal" ? s.iptal : ""}`}>
                <div className={s.tarihKutusu}>
                  <b>{new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit" }).format(new Date(oturum.baslangic))}</b>
                  <small>{new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", month: "short" }).format(new Date(oturum.baslangic))}</small>
                </div>
                <div className={s.oturumGovde}>
                  <b>{oturum.baslik}</b>
                  <small>{tarihSaat.format(new Date(oturum.baslangic))} · {oturum.sure} dk</small>
                  {oturum.konu && <small>{oturum.konu}</small>}
                </div>
                <div className={s.oturumEylem}>
                  <span className={`${s.durum} ${s[oturum.durum] ?? ""}`}>
                    {oturum.durum === "planlandi"
                      ? "Planlandı"
                      : oturum.durum === "canli"
                        ? "Canlı"
                        : oturum.durum === "tamamlandi"
                          ? "Tamamlandı"
                          : "İptal"}
                  </span>
                  {oturum.durum !== "iptal" && (
                    <Link className="btn btn-outline btn-kucuk" href={`/canli-ders/${oturum.id}`}>Dersi Aç</Link>
                  )}
                  {rol === "koc" && oturum.durum === "planlandi" && (
                    <button
                      className={s.metinButon}
                      disabled={bekliyor}
                      onClick={() => {
                        if (confirm("Bu canlı ders iptal edilsin mi?")) {
                          calistir(() => dersOturumuIptal(oturum.id));
                        }
                      }}
                    >İptal et</button>
                  )}
                  {rol === "koc" &&
                    (oturum.durum === "canli" ||
                      (oturum.durum === "planlandi" &&
                        new Date(oturum.baslangic).getTime() < simdi)) && (
                      <button
                        className={s.metinButon}
                        disabled={bekliyor}
                        style={{ color: "var(--yesil)" }}
                        onClick={() => {
                          if (confirm("Ders tamamlandı olarak kapatılsın mı?")) {
                            calistir(() => dersOturumuTamamla(oturum.id));
                          }
                        }}
                      >Tamamla</button>
                    )}
                </div>
              </div>
            )) : <p className={s.miniBos}>Henüz ders oturumu planlanmadı.</p>}
          </div>
        </div>
      </div>
    </article>
  );
}
