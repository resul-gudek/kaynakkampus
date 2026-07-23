"use client";

/* 🎓 Özel Dersler sekmesi — legacy ozelCiz / ozelForm / ozelOnayla / ozelReddet /
   ozelYapildi / ozelNot / ozelIptal / ozelOdeme / ozelSilBtn / waDersHatirlat. */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { bugun, tarihStr } from "@/lib/hesap";
import { ozelDersEkle, ozelDersSil, ozelDersGuncelle } from "@/actions/ozelders";
import { waGonder, waNumaraAl } from "./wa";
import { useVurgu } from "./vurgu";
import type { OzelS, OzelOzetS } from "./tipler";
import s from "./koc.module.css";

interface Props {
  ogrenciId: string;
  ogrenciAd: string;
  telefon: string;
  kocAd: string;
  dersler: OzelS[];
  ozet: OzelOzetS;
  vurguId?: string;
}

export default function OzelSekmesi({ ogrenciId, ogrenciAd, telefon, kocAd, dersler, ozet, vurguId }: Props) {
  const router = useRouter();
  const [bekliyor, baslat] = useTransition();
  const vurgu = useVurgu(vurguId);
  const simdi = bugun();

  /* Onay bekleyen talepler en üstte görünsün (legacy) */
  const sirali = dersler.filter((x) => x.durum === "talep").concat(dersler.filter((x) => x.durum !== "talep"));

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

  function gonder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const onayIste = fd.get("onayIste") === "on";
    calistir(
      () =>
        ozelDersEkle({
          ogrenciId,
          durum: onayIste ? "talep" : "planlandi",
          tarih: String(fd.get("tarih") ?? ""),
          saat: String(fd.get("saat") ?? ""),
          sure: +String(fd.get("sure") ?? "") || 60,
          ders: String(fd.get("ders") ?? "").trim(),
          konu: String(fd.get("konu") ?? "").trim(),
          ucret: +String(fd.get("ucret") ?? "") || 0,
          mesaj: "",
        }),
      () => form.reset()
    );
  }

  function onayla(x: OzelS) {
    const u = prompt("Ders ücreti (₺, boş bırakılabilir):", x.ucret ? String(x.ucret) : "");
    if (u === null) return;
    calistir(() => ozelDersGuncelle(x.id, { durum: "planlandi", ucret: +u || 0 }));
  }

  function reddet(x: OzelS) {
    const neden = prompt("Ret nedeni (öğrenciye gösterilir):", "");
    if (neden === null) return;
    calistir(() => ozelDersGuncelle(x.id, { durum: "reddedildi", redNotu: neden.trim() }));
  }

  function yapildi(x: OzelS) {
    const not = prompt("Ders değerlendirme notu (öğrencinin panelinde görünür):", "");
    if (not === null) return;
    const odev = prompt("Derste verilen ödev (boş bırakılabilir):", "");
    calistir(() =>
      ozelDersGuncelle(x.id, { durum: "yapildi", not_: not.trim(), odev: (odev ?? "").trim() })
    );
  }

  function notDuzenle(x: OzelS) {
    const not = prompt("Ders değerlendirme notu:", x.not_ || "");
    if (not === null) return;
    const odev = prompt("Derste verilen ödev:", x.odev || "");
    calistir(() =>
      ozelDersGuncelle(x.id, { not_: not.trim(), odev: odev === null ? x.odev : odev.trim() })
    );
  }

  function iptal(x: OzelS) {
    if (!confirm("Bu ders iptal edilsin mi? (Kayıt silinmez, iptal olarak işaretlenir.)")) return;
    calistir(() => ozelDersGuncelle(x.id, { durum: "iptal" }));
  }

  function odeme(x: OzelS) {
    calistir(() => ozelDersGuncelle(x.id, { odendi: !x.odendi }));
  }

  function sil(x: OzelS) {
    if (!confirm("Bu ders kaydı tamamen silinsin mi?")) return;
    calistir(() => ozelDersSil(x.id));
  }

  async function dersHatirlat(x: OzelS) {
    const num = await waNumaraAl(ogrenciId, telefon, "telefon", "Öğrencinin telefonu");
    if (!num) return;
    waGonder(
      num,
      `Merhaba ${ogrenciAd.split(" ")[0]}! 👋\n\n` +
        `🎓 Kaynak Akademi – Özel Ders Hatırlatması\n\n` +
        `📅 ${tarihStr(x.tarih)}${x.saat ? " · 🕐 " + x.saat : ""}\n` +
        `📘 ${x.ders}${x.konu ? " – " + x.konu : ""} (${x.sure || 60} dk)\n\n` +
        `Derse hazırlıklı gelmeyi unutma. Görüşmek üzere! 💪\n${kocAd}`
    );
  }

  function rozet(x: OzelS) {
    const gecmisPlan = x.durum === "planlandi" && x.tarih < simdi;
    if (x.durum === "yapildi")
      return <span className={`${s.durumRozet} ${s.durumTamam}`}>✓ Yapıldı</span>;
    if (x.durum === "iptal")
      return <span className={`${s.durumRozet} ${s.durumRed}`}>✕ İptal edildi</span>;
    if (x.durum === "reddedildi")
      return (
        <span className={`${s.durumRozet} ${s.durumRed}`}>
          ✕ {x.olusturan === "ogrenci" ? "Talebi reddettin" : "Öğrenci reddetti"}
        </span>
      );
    if (x.durum === "talep")
      return x.olusturan === "ogrenci" ? (
        <span className={`${s.durumRozet} ${s.durumTalep}`}>🙋 Öğrenci talebi – onayın bekleniyor</span>
      ) : (
        <span className={`${s.durumRozet} ${s.durumTalep}`}>📨 Önerin öğrenci onayında</span>
      );
    if (gecmisPlan)
      return <span className={`${s.durumRozet} ${s.durumBekliyor}`}>⚠ Tarihi geçti</span>;
    return <span className={`${s.durumRozet} ${s.durumBekliyor}`}>📅 Planlandı</span>;
  }

  return (
    <div>
      <div className={s.yolOzet}>
        <span>
          🎓 <b>{ozet.yapilan}</b> ders yapıldı
        </span>
        <span>
          📅 <b>{ozet.planlanan}</b> planlı
        </span>
        <span>
          ⏱ Toplam <b>{ozet.toplamSaat}</b> saat
        </span>
        <span>
          💰 Bekleyen ödeme: <b>{ozet.bekleyenUcret} ₺</b>
        </span>
        {ozet.sonrakiMetin && (
          <span>
            ⏭ Sıradaki: <b>{ozet.sonrakiMetin}</b>
          </span>
        )}
        {ozet.onayBekleyenKoc > 0 && (
          <span className={s.yolBilgi}>
            🙋 <b>{ozet.onayBekleyenKoc}</b> öğrenci talebi onayını bekliyor
          </span>
        )}
        {ozet.onayBekleyenOgr > 0 && (
          <span>
            📨 <b>{ozet.onayBekleyenOgr}</b> önerin öğrenci onayında
          </span>
        )}
        {ozet.gecikenPlan > 0 && (
          <span className={s.yolUyari}>
            ⚠ <b>{ozet.gecikenPlan}</b> dersin tarihi geçti, durumunu güncelle
          </span>
        )}
      </div>

      <form className={s.kutuForm} onSubmit={gonder}>
        <div className={s.formIzgara}>
          <div className={s.formGrup}>
            <label>Tarih</label>
            <input name="tarih" type="date" required />
          </div>
          <div className={s.formGrup}>
            <label>Saat</label>
            <input name="saat" type="time" required />
          </div>
          <div className={s.formGrup}>
            <label>Süre (dk)</label>
            <input name="sure" type="number" min={15} step={15} defaultValue={60} />
          </div>
          <div className={s.formGrup}>
            <label>Ders</label>
            <input name="ders" required placeholder="Örn. Matematik" />
          </div>
          <div className={s.formGrup}>
            <label>Konu</label>
            <input name="konu" placeholder="Örn. Türev" />
          </div>
          <div className={s.formGrup}>
            <label>Ücret (₺)</label>
            <input name="ucret" type="number" min={0} step={50} placeholder="0" />
          </div>
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: ".8rem",
            fontWeight: 600,
            marginBottom: 12,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            name="onayIste"
            defaultChecked
            style={{ accentColor: "var(--blue)", width: 15, height: 15 }}
          />
          Öğrenci onayına gönder (öğrenci onaylayınca ders planlanır; işareti kaldırırsan doğrudan
          planlanır)
        </label>
        <div className={s.formAlt}>
          <button type="submit" className="btn btn-primary btn-kucuk" disabled={bekliyor}>
            Dersi Öner / Planla
          </button>
          <span className={s.formNot}>
            {'Ders sonrası "Yapıldı" işaretleyip değerlendirme notu ve ders ödevi ekleyebilirsin.'}
          </span>
        </div>
      </form>

      {sirali.length ? (
        sirali.map((x) => (
          <div
            key={x.id}
            data-kayit={x.id}
            className={`${s.listeSatir} ${x.durum === "yapildi" ? s.tamam : ""} ${
              x.durum === "iptal" || x.durum === "reddedildi" ? s.soluk : ""
            } ${vurgu === x.id ? s.vurgu : ""}`}
          >
            <div className={s.listeGovde}>
              <b>
                {x.ders}
                {x.konu ? " – " + x.konu : ""}
              </b>
              {x.mesaj && <p>💬 Öğrencinin mesajı: {x.mesaj}</p>}
              {x.redNotu && <p>🚫 Ret nedeni: {x.redNotu}</p>}
              {x.not_ && <p>📝 {x.not_}</p>}
              {x.odev && <p>📘 Ödev: {x.odev}</p>}
              <div className={s.listeMeta}>
                <span className="tag">
                  📅 {tarihStr(x.tarih)}
                  {x.saat ? " · 🕐 " + x.saat : ""}
                </span>
                <span className="tag">⏱ {x.sure || 60} dk</span>
                {!!x.ucret && <span className="tag">💰 {x.ucret} ₺</span>}
                {rozet(x)}
                {!!x.ucret && x.durum === "yapildi" && (
                  <span className={`${s.durumRozet} ${x.odendi ? s.durumTamam : s.durumBekliyor}`}>
                    {x.odendi ? "₺ Ödendi" : "₺ Ödenmedi"}
                  </span>
                )}
              </div>
              <div className={s.satirButonlar}>
                {x.durum === "talep" && x.olusturan === "ogrenci" && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-kucuk"
                      disabled={bekliyor}
                      onClick={() => onayla(x)}
                    >
                      ✓ Onayla ve Planla
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-kucuk"
                      disabled={bekliyor}
                      onClick={() => reddet(x)}
                    >
                      Reddet
                    </button>
                  </>
                )}
                {x.durum === "planlandi" && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-kucuk"
                      disabled={bekliyor}
                      onClick={() => yapildi(x)}
                    >
                      ✓ Yapıldı Olarak İşaretle
                    </button>
                    <button
                      type="button"
                      className="btn btn-wa btn-kucuk"
                      disabled={bekliyor}
                      onClick={() => dersHatirlat(x)}
                    >
                      📲 Hatırlat
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-kucuk"
                      disabled={bekliyor}
                      onClick={() => iptal(x)}
                    >
                      İptal Et
                    </button>
                  </>
                )}
                {x.durum === "yapildi" && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline btn-kucuk"
                      disabled={bekliyor}
                      onClick={() => notDuzenle(x)}
                    >
                      📝 Not / Ödev Düzenle
                    </button>
                    {!!x.ucret && (
                      <button
                        type="button"
                        className="btn btn-outline btn-kucuk"
                        disabled={bekliyor}
                        onClick={() => odeme(x)}
                      >
                        {x.odendi ? "Ödemeyi Geri Al" : "₺ Ödendi İşaretle"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              className={s.silBtn}
              title="Ders kaydını sil"
              disabled={bekliyor}
              onClick={() => sil(x)}
            >
              ✕
            </button>
          </div>
        ))
      ) : (
        <p className={s.bosMesaj}>
          Bu öğrenciyle henüz özel ders kaydı yok. Yukarıdaki formdan ilk dersi önerebilirsin.
        </p>
      )}
    </div>
  );
}
