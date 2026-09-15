/* Eğitim başvurusu (özel ders / eğitim koçluğu) bildirim maili —
   mailKuyrukla üzerine ince sarmalayıcı. Form bölümleri burada, tüm
   değerler kaçışlanarak hazır HTML'e çevrilir ve şablona {{bolumler}}
   olarak ham (kaçışsız) yerleştirilir. Mail sistemi kapalıysa sessizce
   false döner; başvuru kaydını asla düşürmez. */

import { mailKuyrukla } from "@/lib/mail";
import { ILETISIM_EPOSTA, SITE_KOKU, mutlakAdres } from "@/lib/site";
import {
  BASVURAN_ETIKETLERI,
  EGITIM_ETIKETLERI,
  koclukBolumleri,
  ozelDersBolumleri,
  sinifBasligi,
  type BasvuruBolumu,
  type KoclukVeri,
  type OzelDersVeri,
} from "@/lib/egitim-basvurusu";

/** Başvuruların düştüğü kurumsal adres; ortam değişkeniyle değiştirilebilir. */
export function basvuruEpostasi(): string {
  return (process.env.BASVURU_EPOSTA ?? ILETISIM_EPOSTA).trim();
}

/**
 * Maildeki "Başvuruyu panelde aç" bağlantısı — HER ZAMAN mutlak ve dış adres.
 *
 * DİKKAT: burada UYGULAMA_URL KULLANILMAZ. O değişken kurulum/dağıtıma göre
 * yerel ağ adresi olabiliyor (örn. https://192.168.1.101:8443) ve mail dışarıya
 * gittiği için alıcının cihazından açılamıyor — bu hata yaşandı. Panel, siteyle
 * aynı alan adında yayınlandığından public kök (SITE_ADRESI → kaynakkampus.com)
 * kullanılır. Yönetici oturumu yoksa /giris'e düşer, giriş sonrası bu adrese
 * geri döner (bkz. proxy.ts + app/giris).
 */
export function basvuruPanelAdresi(id: string): string {
  return mutlakAdres(`/admin/egitim-basvurulari/${id}`);
}

function kacis(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Bölümleri e-posta istemcilerinin sorunsuz gösterdiği satır içi stilli tablolara çevirir. */
export function bolumleriHtmlYap(bolumler: BasvuruBolumu[]): string {
  return bolumler
    .map(
      (b) => `<h3 style="color:#1F141A;font-size:15px;margin:22px 0 8px;padding-bottom:6px;border-bottom:1px solid #E4DBD9">${kacis(b.baslik)}</h3>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">
${b.satirlar
  .map(
    (s) => `<tr>
  <td style="padding:6px 10px 6px 0;color:#7C6F73;vertical-align:top;width:38%">${kacis(s.etiket)}</td>
  <td style="padding:6px 0;color:#1F141A;vertical-align:top;white-space:pre-wrap">${kacis(s.deger)}</td>
</tr>`,
  )
  .join("\n")}
</table>`,
    )
    .join("\n");
}

function ortakDegiskenler(id: string, v: OzelDersVeri | KoclukVeri): Record<string, string> {
  return {
    ogrenciAd: v.ogrenciAd,
    yas: String(v.yas),
    sinif: sinifBasligi(v.sinif), // konu: "… | 8 Yaş / 2. Sınıf | …"
    basvuran: BASVURAN_ETIKETLERI[v.basvuran],
    iletisimAd: v.iletisimAd,
    telefon: v.telefon,
    eposta: v.eposta,
    panelAdresi: basvuruPanelAdresi(id),
  };
}

/** Yeni özel ders başvurusunu kurum adresine kuyruklar. */
export async function ozelDersBasvuruMailiKuyrukla(id: string, v: OzelDersVeri): Promise<boolean> {
  return mailKuyrukla({
    sablonAnahtar: "egitim-basvurusu-ozel-ders",
    alici: basvuruEpostasi(),
    aliciAd: "Kaynak Kampüs",
    degiskenler: { ...ortakDegiskenler(id, v), egitim: EGITIM_ETIKETLERI[v.egitim] },
    hamDegiskenler: { bolumler: bolumleriHtmlYap(ozelDersBolumleri(v)) },
    refTur: "egitim-basvurusu",
    refId: id,
  });
}

/** Yeni eğitim koçluğu başvurusunu kurum adresine kuyruklar. */
export async function koclukBasvuruMailiKuyrukla(id: string, v: KoclukVeri): Promise<boolean> {
  return mailKuyrukla({
    sablonAnahtar: "egitim-basvurusu-kocluk",
    alici: basvuruEpostasi(),
    aliciAd: "Kaynak Kampüs",
    degiskenler: ortakDegiskenler(id, v),
    hamDegiskenler: { bolumler: bolumleriHtmlYap(koclukBolumleri(v)) },
    refTur: "egitim-basvurusu",
    refId: id,
  });
}

/* ── Başvurana giden onay maili ──────────────────────────────
   Yönetici bildiriminden TAMAMEN ayrıdır: ayrı şablon, ayrı alıcı, ayrı
   kuyruk satırı ve ayrı tekrar anahtarı (refTur). Biri kuyruklanamazsa
   diğeri etkilenmez; ikisi de başvuru kaydını asla düşürmez.
   Alıcı, formdaki TEK iletişim adresidir: başvuruyu veli yaptıysa veliye,
   öğrenci kendisi yaptıysa öğrenciye aittir (bkz. basvuran alanı). */

const ONAY_REF_TUR = "egitim-basvurusu-onay";

/** Sitenin alan adı — bağlantı metni olarak gösterilir (kaynakkampus.com). */
function siteAlanAdi(): string {
  return SITE_KOKU.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

/** Başvurana gösterilecek uzun tarih (İstanbul yereli): "15 Eylül 2026". */
function tarihUzun(d: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function onayOrtak(v: OzelDersVeri | KoclukVeri, tarih: Date): Record<string, string> {
  return {
    ad: v.iletisimAd,
    ogrenciAd: v.ogrenciAd,
    sinif: sinifBasligi(v.sinif),
    tarih: tarihUzun(tarih),
    siteAdresi: SITE_KOKU,
    siteAlan: siteAlanAdi(),
  };
}

/** Özel ders başvurusunu yapana "başvurunuzu aldık" onayı gönderir. */
export async function ozelDersOnayMailiKuyrukla(
  id: string,
  v: OzelDersVeri,
  tarih: Date,
): Promise<boolean> {
  if (!v.eposta) return false;
  return mailKuyrukla({
    sablonAnahtar: "egitim-basvurusu-onay-ozel-ders",
    alici: v.eposta,
    aliciAd: v.iletisimAd,
    degiskenler: {
      ...onayOrtak(v, tarih),
      egitim: EGITIM_ETIKETLERI[v.egitim],
      yas: String(v.yas),
    },
    // Yönetici bildirimiyle aynı refId, farklı refTur → ikisi ayrı kuyruklanır,
    // ama aynı başvuru için onay maili ikinci kez oluşmaz.
    refTur: ONAY_REF_TUR,
    refId: id,
  });
}

/** Eğitim koçluğu başvurusunu yapana "başvurunuzu aldık" onayı gönderir. */
export async function koclukOnayMailiKuyrukla(
  id: string,
  v: KoclukVeri,
  tarih: Date,
): Promise<boolean> {
  if (!v.eposta) return false;
  return mailKuyrukla({
    sablonAnahtar: "egitim-basvurusu-onay-kocluk",
    alici: v.eposta,
    aliciAd: v.iletisimAd,
    degiskenler: onayOrtak(v, tarih),
    refTur: ONAY_REF_TUR,
    refId: id,
  });
}
