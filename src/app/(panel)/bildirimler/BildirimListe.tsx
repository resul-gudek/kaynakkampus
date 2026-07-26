"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bildirimOkundu, bildirimSil, bildirimTumunuOkundu, bildirimTemizle } from "@/actions/bildirim";
import BosDurum from "@/components/maskot/BosDurum";
import stil from "./bildirimler.module.css";

export interface BildirimGorunum {
  id: string;
  ikon: string;
  metin: string;
  zaman: string; // "Bugün · 14:35" gibi hazır metin
  okundu: boolean;
  hedefTur: string | null;
  hedefOgrenciId: string | null;
  hedefKayitId: string | null;
}

export default function BildirimListe({
  bildirimler,
  rol,
}: {
  bildirimler: BildirimGorunum[];
  rol: string;
}) {
  const [filtre, setFiltre] = useState<"tumu" | "okunmamis">("tumu");
  const [, baslat] = useTransition();
  const router = useRouter();

  const yeniSayi = bildirimler.filter((b) => !b.okundu).length;
  const liste = filtre === "okunmamis" ? bildirimler.filter((b) => !b.okundu) : bildirimler;

  /* Bildirime tıklanınca: okundu işaretle, hedefi varsa ilgili panelde ilgili kayda git */
  function tikla(b: BildirimGorunum) {
    if (b.hedefTur && b.hedefKayitId) {
      if (b.hedefTur === "sinif" || b.hedefTur === "oturum") {
        const url =
          b.hedefTur === "oturum"
            ? `/canli-ders/${encodeURIComponent(b.hedefKayitId)}`
            : `/siniflar?sinif=${encodeURIComponent(b.hedefKayitId)}`;
        baslat(async () => {
          await bildirimOkundu(b.id, true);
          router.push(url);
        });
        return;
      }
      // Süreli test: koç sonuç tablosundaki oturuma, öğrenci test listesindeki karta gider
      if (b.hedefTur === "test") {
        const url =
          rol === "koc"
            ? `/koc/testler?kayit=${encodeURIComponent(b.hedefKayitId)}`
            : `/ogrenci/testler?kayit=${encodeURIComponent(b.hedefKayitId)}`;
        baslat(async () => {
          await bildirimOkundu(b.id, true);
          router.push(url);
        });
        return;
      }
      // Video ders: bildirim yalnız öğrenciye düşer, doğrudan detay sayfasına gider
      if (b.hedefTur === "video") {
        baslat(async () => {
          await bildirimOkundu(b.id, true);
          router.push(`/ogrenci/videolar/${encodeURIComponent(b.hedefKayitId!)}`);
        });
        return;
      }
      const sekme = b.hedefTur === "odev" ? "odevler" : "ozel";
      const ogrenciSayfa = b.hedefTur === "odev" ? "/ogrenci/odevler" : "/ogrenci/ozel-dersler";
      const url =
        rol === "koc"
          ? `/koc/ogrenciler?ogrenci=${encodeURIComponent(b.hedefOgrenciId ?? "")}&sekme=${sekme}&kayit=${encodeURIComponent(b.hedefKayitId)}`
          : `${ogrenciSayfa}?kayit=${encodeURIComponent(b.hedefKayitId)}`;
      baslat(async () => {
        await bildirimOkundu(b.id, true);
        router.push(url);
      });
      return;
    }
    // Hedefi olmayan bildirimlerde tıklama okundu/okunmadı anahtarı gibi çalışır
    baslat(async () => {
      await bildirimOkundu(b.id, !b.okundu);
      router.refresh();
    });
  }

  return (
    <div className={stil.bolum}>
      <div className={stil.aracCubugu}>
        <div className={stil.filtreler}>
          <button
            className={filtre === "tumu" ? stil.filtreAktif : stil.filtre}
            onClick={() => setFiltre("tumu")}
          >
            Tümü {bildirimler.length ? `(${bildirimler.length})` : ""}
          </button>
          <button
            className={filtre === "okunmamis" ? stil.filtreAktif : stil.filtre}
            onClick={() => setFiltre("okunmamis")}
          >
            Okunmamış {yeniSayi ? `(${yeniSayi})` : ""}
          </button>
        </div>
        <div className={stil.aracButonlar}>
          <button
            className="btn btn-outline btn-kucuk"
            onClick={() => baslat(async () => { await bildirimTumunuOkundu(); router.refresh(); })}
          >
            ✓ Tümünü Okundu Say
          </button>
          <button
            className="btn btn-outline btn-kucuk"
            style={{ borderColor: "#b91c1c", color: "#b91c1c" }}
            onClick={() => {
              if (!confirm("Tüm bildirimlerin silinsin mi?")) return;
              baslat(async () => { await bildirimTemizle(); router.refresh(); });
            }}
          >
            🗑 Temizle
          </button>
        </div>
      </div>

      {liste.length === 0 ? (
        filtre === "okunmamis" ? (
          <BosDurum ifade="onay" baslik="Okunmamış bildirimin yok." metin="Hepsine baktın." />
        ) : (
          <BosDurum
            ifade="sakin"
            baslik="Henüz bildirimin yok."
            metin="Talepler, onaylar ve ders güncellemeleri burada görünecek."
          />
        )
      ) : (
        liste.map((b) => (
          <div
            key={b.id}
            className={b.okundu ? stil.bildirim : stil.yeni}
            onClick={() => tikla(b)}
            title={
              b.hedefTur
                ? "İlgili kayda git"
                : b.okundu
                  ? "Okunmadı olarak işaretle"
                  : "Okundu olarak işaretle"
            }
          >
            <div className={stil.ikon}>{b.ikon || "🔔"}</div>
            <div className={stil.govde}>
              <p>{b.metin}</p>
              <div className={stil.tarih}>🕐 {b.zaman}</div>
            </div>
            {!b.okundu && <span className={stil.yeniNokta} />}
            <button
              className={stil.silBtn}
              title="Bildirimi sil"
              onClick={(e) => {
                e.stopPropagation();
                baslat(async () => { await bildirimSil(b.id); router.refresh(); });
              }}
            >
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  );
}
