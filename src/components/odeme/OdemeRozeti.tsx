import { KOC_ODEME_ETIKETLERI, OGRENCI_ODEME_ETIKETLERI } from "@/lib/sabitler";
import type { KocOdemeDurum, OgrenciOdemeDurum } from "@/lib/sabitler";
import { kocDurumRozeti, ogrenciDurumRozeti } from "@/lib/odeme";
import stil from "./odeme.module.css";

/* Durum rozetleri — üç sayfa aynı görseli kullanır.
   İkon durumu renkten bağımsız da okunur kılar (renk körlüğü). */

const IKON = { olumlu: "✅", bekleyen: "⏳", notr: "—" } as const;

export function OgrenciDurumRozeti({ durum }: { durum: OgrenciOdemeDurum }) {
  const tur = ogrenciDurumRozeti(durum);
  return (
    <span className={`${stil.rozet} ${stil[tur]}`}>
      <span aria-hidden>{IKON[tur]}</span>
      {OGRENCI_ODEME_ETIKETLERI[durum]}
    </span>
  );
}

export function KocDurumRozeti({ durum }: { durum: KocOdemeDurum }) {
  const tur = kocDurumRozeti(durum);
  // "Hazırlanıyor" bekleyen renginde ama farklı ikonla ayrışır
  const ikon = durum === "hazirlaniyor" ? "🧾" : IKON[tur];
  return (
    <span className={`${stil.rozet} ${stil[tur]}`}>
      <span aria-hidden>{ikon}</span>
      {KOC_ODEME_ETIKETLERI[durum]}
    </span>
  );
}
