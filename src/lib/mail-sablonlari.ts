/* Varsayılan e-posta şablonları — hem uygulama (src/lib/mail.ts) hem de
   prisma/seed.ts tarafından kullanılır; bu yüzden prisma'ya bağımlı değildir.
   Gövde/konu içinde {{degisken}} yer tutucuları kullanılır; gövde değerleri
   gönderim öncesi HTML kaçışından geçirilir (bkz. sablonDoldur). */

export const MAIL_SABLON_ANAHTARLARI = [
  "hosgeldin",
  "ders-hatirlatma",
  "veli-rapor",
  "basvuru-alindi",
  "mulakat-planlandi",
  "mulakat-hatirlatma",
  "basvuru-sonuc",
  "iletisim-mesaji",
  "iletisim-onay",
  "egitim-basvurusu-ozel-ders",
  "egitim-basvurusu-kocluk",
  "egitim-basvurusu-onay-ozel-ders",
  "egitim-basvurusu-onay-kocluk",
] as const;
export type MailSablonAnahtar = (typeof MAIL_SABLON_ANAHTARLARI)[number];

export interface MailSablonTanim {
  anahtar: MailSablonAnahtar;
  ad: string;
  aciklama: string;
  degiskenler: { ad: string; aciklama: string }[];
  konu: string;
  govde: string;
}

const gomlek = (icerik: string) => `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937;line-height:1.6">
  ${icerik}
  <p style="color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;padding-top:12px;margin-top:24px">
    Bu e-posta Kaynak Kampüs koçluk sistemi tarafından otomatik gönderilmiştir; lütfen yanıtlamayınız.
  </p>
</div>`;

/* Eğitim başvurusu mailleri: form bölümleri sunucuda hazır HTML olarak
   üretilir ve {{bolumler}} yerine kaçışlanMADAN konur (mailKuyrukla →
   hamDegiskenler). Diğer değişkenler normal kaçışlanır. */
const EGITIM_BASVURU_DEGISKENLERI = [
  { ad: "ogrenciAd", aciklama: "Öğrencinin ad soyadı" },
  { ad: "yas", aciklama: "Öğrencinin yaşı" },
  { ad: "sinif", aciklama: "Sınıf (örn. 2. sınıf)" },
  { ad: "basvuran", aciklama: "Başvuruyu yapan (Veli / Öğrencinin kendisi)" },
  { ad: "iletisimAd", aciklama: "İletişim kurulacak kişinin ad soyadı" },
  { ad: "telefon", aciklama: "Telefon numarası" },
  { ad: "eposta", aciklama: "E-posta adresi" },
  { ad: "bolumler", aciklama: "Tüm form bilgileri (hazır HTML tablo bölümleri)" },
  { ad: "panelAdresi", aciklama: "Başvurunun yönetim panelindeki adresi" },
];

const egitimBasvuruGovdesi = (baslik: string) =>
  gomlek(`<h2 style="color:#7A2035;margin-top:0">${baslik}</h2>
  <p><b>{{ogrenciAd}}</b> ({{yas}} yaş, {{sinif}}) için yeni bir başvuru alındı.
  Başvuruyu yapan: <b>{{basvuran}}</b> — {{iletisimAd}}.</p>
  <p style="background:#f3f4f6;border-radius:14px;padding:12px 16px;margin:16px 0">
    <b>Telefon:</b> <a href="tel:{{telefon}}" style="color:#7A2035">{{telefon}}</a><br/>
    <b>E-posta:</b> <a href="mailto:{{eposta}}" style="color:#7A2035">{{eposta}}</a>
  </p>
  {{bolumler}}
  <p style="margin-top:20px"><a href="{{panelAdresi}}" style="display:inline-block;background:#1F141A;color:#fff;text-decoration:none;padding:10px 18px;border-radius:12px;font-weight:600">Başvuruyu panelde aç</a></p>`);

/* Başvuru sahibine giden onay mailleri (yönetici bildiriminden AYRI).
   Kurallar: panel bağlantısı yok, iç durum/not yok, sistem içi kimlik yok,
   gereksiz kişisel veri tekrarı yok — yalnız kısa bir başvuru özeti. */
const ONAY_ORTAK_DEGISKENLER = [
  { ad: "ad", aciklama: "Başvuruyu yapanın ad soyadı (veli ya da öğrencinin kendisi)" },
  { ad: "ogrenciAd", aciklama: "Öğrencinin ad soyadı" },
  { ad: "sinif", aciklama: "Sınıf (örn. 2. Sınıf)" },
  { ad: "tarih", aciklama: "Başvuru tarihi (örn. 15 Eylül 2026)" },
  { ad: "siteAdresi", aciklama: "Sitenin public adresi (SITE_ADRESI)" },
  { ad: "siteAlan", aciklama: "Sitenin alan adı, bağlantı metni olarak (kaynakkampus.com)" },
];

const onayGovdesi = (girisCumlesi: string, ozetSatirlari: string) =>
  gomlek(`<h2 style="color:#7A2035;margin-top:0">Merhaba {{ad}},</h2>
  <p>${girisCumlesi}</p>
  <p>Başvurunuz ekibimiz tarafından incelendikten sonra sizinle iletişime geçeceğiz.</p>
  <h3 style="font-size:15px;color:#1F141A;margin:24px 0 8px;padding-bottom:6px;border-bottom:1px solid #e5e7eb">Başvuru Özeti</h3>
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#f3f4f6;border-radius:14px;margin:0 0 16px">
${ozetSatirlari}
  </table>
  <p style="color:#6b7280">Başvurunuzla ilgili sizinle formda belirttiğiniz iletişim bilgileri üzerinden iletişime geçeceğiz.</p>
  <p style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb">
    <b style="color:#7A2035">Kaynak Kampüs</b><br/>
    <a href="{{siteAdresi}}" style="color:#7A2035;text-decoration:none">{{siteAlan}}</a>
  </p>`);

const onaySatiri = (etiket: string, deger: string) =>
  `    <tr><td style="padding:8px 14px;color:#6b7280">${etiket}</td><td style="padding:8px 14px;text-align:right"><b>${deger}</b></td></tr>`;

export const VARSAYILAN_SABLONLAR: MailSablonTanim[] = [
  {
    anahtar: "egitim-basvurusu-onay-ozel-ders",
    ad: "Özel Ders Başvurusu — Başvurana Onay",
    aciklama:
      "Özel ders başvurusu gönderildiğinde başvuru sahibine (veli ya da öğrencinin kendisi) otomatik gönderilir. Yönetici bildiriminden ayrıdır.",
    degiskenler: [
      ...ONAY_ORTAK_DEGISKENLER,
      { ad: "egitim", aciklama: "Seçilen eğitim (İngilizce, Almanca…)" },
      { ad: "yas", aciklama: "Öğrencinin yaşı" },
    ],
    konu: "Özel Ders Başvurunuzu Aldık | Kaynak Kampüs",
    govde: onayGovdesi(
      "Kaynak Kampüs özel ders başvurunuzu aldık.",
      [
        onaySatiri("Öğrenci", "{{ogrenciAd}}"),
        onaySatiri("Eğitim", "{{egitim}}"),
        onaySatiri("Yaş / Sınıf", "{{yas}} / {{sinif}}"),
        onaySatiri("Başvuru Tarihi", "{{tarih}}"),
      ].join("\n"),
    ),
  },
  {
    anahtar: "egitim-basvurusu-onay-kocluk",
    ad: "Eğitim Koçluğu Başvurusu — Başvurana Onay",
    aciklama:
      "Eğitim koçluğu başvurusu gönderildiğinde başvuru sahibine (veli ya da öğrencinin kendisi) otomatik gönderilir. Yönetici bildiriminden ayrıdır.",
    degiskenler: ONAY_ORTAK_DEGISKENLER,
    konu: "Eğitim Koçluğu Başvurunuzu Aldık | Kaynak Kampüs",
    govde: onayGovdesi(
      "Kaynak Kampüs eğitim koçluğu başvurunuzu aldık.",
      [
        onaySatiri("Öğrenci", "{{ogrenciAd}}"),
        onaySatiri("Sınıf", "{{sinif}}"),
        onaySatiri("Başvuru Türü", "Eğitim Koçluğu"),
        onaySatiri("Başvuru Tarihi", "{{tarih}}"),
      ].join("\n"),
    ),
  },
  {
    anahtar: "egitim-basvurusu-ozel-ders",
    ad: "Eğitim Başvurusu — Özel Ders",
    aciklama: "Sitedeki Eğitim Başvurusu formundan yeni bir özel ders başvurusu geldiğinde kurum adresine iletilir.",
    degiskenler: [{ ad: "egitim", aciklama: "Seçilen eğitim (İngilizce, Almanca…)" }, ...EGITIM_BASVURU_DEGISKENLERI],
    konu: "Yeni Özel Ders Başvurusu | {{egitim}} | {{yas}} Yaş / {{sinif}} | {{ogrenciAd}}",
    govde: egitimBasvuruGovdesi("Yeni özel ders başvurusu: {{egitim}}"),
  },
  {
    anahtar: "egitim-basvurusu-kocluk",
    ad: "Eğitim Başvurusu — Eğitim Koçluğu",
    aciklama: "Sitedeki Eğitim Başvurusu formundan yeni bir eğitim koçluğu başvurusu geldiğinde kurum adresine iletilir.",
    degiskenler: EGITIM_BASVURU_DEGISKENLERI,
    konu: "Yeni Eğitim Koçluğu Başvurusu | {{sinif}} | {{ogrenciAd}}",
    govde: egitimBasvuruGovdesi("Yeni eğitim koçluğu başvurusu"),
  },
  {
    anahtar: "iletisim-mesaji",
    ad: "Site İletişim Mesajı",
    aciklama: "Sitedeki iletişim formundan yeni bir mesaj gönderildiğinde kurum adresine iletilir.",
    degiskenler: [
      { ad: "ad", aciklama: "Mesajı gönderen kişinin ad soyadı" },
      { ad: "eposta", aciklama: "Yanıt verilecek e-posta adresi" },
      { ad: "konu", aciklama: "Mesajın konusu" },
      { ad: "mesaj", aciklama: "Ziyaretçinin mesajı" },
    ],
    konu: "Site iletişim mesajı: {{konu}} — {{ad}}",
    govde: gomlek(`<h2 style="color:#7A2035;margin-top:0">Yeni iletişim mesajı</h2>
  <p><b>{{ad}}</b> iletişim formundan bir mesaj gönderdi.</p>
  <p style="background:#f3f4f6;border-radius:14px;padding:12px 16px;margin:16px 0">
    <b>E-posta:</b> <a href="mailto:{{eposta}}" style="color:#7A2035">{{eposta}}</a><br/>
    <b>Konu:</b> {{konu}}
  </p>
  <p style="white-space:pre-wrap">{{mesaj}}</p>`),
  },
  {
    anahtar: "iletisim-onay",
    ad: "İletişim Mesajı Onayı",
    aciklama: "İletişim formundan mesaj gönderen ziyaretçiye, mesajının bize ulaştığını bildirir.",
    degiskenler: [
      { ad: "ad", aciklama: "Mesajı gönderen kişinin ad soyadı" },
      { ad: "konu", aciklama: "Mesajın konusu" },
      { ad: "mesaj", aciklama: "Ziyaretçinin gönderdiği mesaj" },
    ],
    konu: "Mesajınız bize ulaştı — Kaynak Kampüs",
    govde: gomlek(`<h2 style="color:#7A2035;margin-top:0">Merhaba {{ad}},</h2>
  <p>Mesajınız bize ulaştı. En kısa sürede size dönüş yapacağız.</p>
  <p style="background:#f3f4f6;border-radius:14px;padding:12px 16px;margin:16px 0">
    <b>Konu:</b> {{konu}}
  </p>
  <p style="white-space:pre-wrap;color:#6b7280;border-left:3px solid #E4DBD9;padding-left:12px">{{mesaj}}</p>
  <p>İlginiz için teşekkür ederiz. 🌸</p>`),
  },
  {
    anahtar: "hosgeldin",
    ad: "Hoş Geldin Maili",
    aciklama: "Yeni kullanıcı (koç veya öğrenci) oluşturulduğunda, e-posta adresi girilmişse gönderilir.",
    degiskenler: [
      { ad: "ad", aciklama: "Kullanıcının ad soyadı" },
      { ad: "kullanici", aciklama: "Giriş için kullanıcı adı" },
      { ad: "rol", aciklama: "Koç / Öğrenci" },
      { ad: "panelAdresi", aciklama: "Sitenin public kok adresi (SITE_ADRESI); sablon sonuna /giris ekler" },
    ],
    konu: "Kaynak Kampüs'ye Hoş Geldin, {{ad}}! 🎉",
    govde: gomlek(`<h2 style="color:#7A2035;margin-top:0">Hoş Geldin, {{ad}}! 🎉</h2>
  <p>Kaynak Kampüs koçluk sistemine <b>{{rol}}</b> olarak kaydın oluşturuldu.</p>
  <p style="background:#f3f4f6;border-radius:14px;padding:12px 16px;margin:16px 0">
    <b>Kullanıcı adın:</b> {{kullanici}}<br/>
    <b>Giriş adresi:</b> {{panelAdresi}}/giris
  </p>
  <p>Şifreni, hesabını oluşturan yetkiliden öğrenebilirsin.</p>
  <p>Başarılar dileriz! 📚</p>`),
  },
  {
    anahtar: "ders-hatirlatma",
    ad: "Ders Hatırlatma Maili",
    aciklama:
      "Planlanmış özel dersten önce (Mail Ayarları'ndaki saat kadar önce) öğrenciye gönderilir.",
    degiskenler: [
      { ad: "ad", aciklama: "Öğrencinin ad soyadı" },
      { ad: "ders", aciklama: "Ders adı" },
      { ad: "konu", aciklama: "Ders konusu" },
      { ad: "tarih", aciklama: "Ders tarihi (GG.AA.YYYY)" },
      { ad: "saat", aciklama: "Ders saati" },
      { ad: "sure", aciklama: "Süre (dakika)" },
      { ad: "koc", aciklama: "Koçun ad soyadı" },
    ],
    konu: "Ders Hatırlatması: {{ders}} · {{tarih}} {{saat}} ⏰",
    govde: gomlek(`<h2 style="color:#7A2035;margin-top:0">Ders Hatırlatması ⏰</h2>
  <p>Merhaba {{ad}},</p>
  <p>Yaklaşan özel dersini hatırlatmak isteriz:</p>
  <p style="background:#f3f4f6;border-radius:14px;padding:12px 16px;margin:16px 0">
    <b>Ders:</b> {{ders}}<br/>
    <b>Konu:</b> {{konu}}<br/>
    <b>Tarih:</b> {{tarih}}<br/>
    <b>Saat:</b> {{saat}}<br/>
    <b>Süre:</b> {{sure}} dakika<br/>
    <b>Koç:</b> {{koc}}
  </p>
  <p>Derse hazır olman dileğiyle, başarılar! 📚</p>`),
  },
  {
    anahtar: "veli-rapor",
    ad: "Veli İlerleme Raporu",
    aciklama:
      "Öğrencinin haftalık gelişim özetini veliye gönderir. Koç manuel gönderebilir; Mail Ayarları'nda otomatik veli raporu açıksa haftalık olarak da kuyruklanır.",
    degiskenler: [
      { ad: "veliAd", aciklama: "Velinin ad soyadı" },
      { ad: "ogrenciAd", aciklama: "Öğrencinin ad soyadı" },
      { ad: "koc", aciklama: "Koçun ad soyadı" },
      { ad: "donem", aciklama: "Rapor dönemi (örn. bu hafta)" },
      { ad: "odev", aciklama: "Ödev tamamlama (örn. 8/10 · %80)" },
      { ad: "takip", aciklama: "Haftalık takip tamamlama (örn. %75)" },
      { ad: "sonNet", aciklama: "Son deneme neti ve değişim" },
      { ad: "seviye", aciklama: "Yol haritası seviyesi ve XP" },
      { ad: "zayif", aciklama: "Öne çıkan zayıf konular" },
      { ad: "sonrakiDers", aciklama: "Sıradaki planlı özel ders" },
      { ad: "panelAdresi", aciklama: "Sitenin public kok adresi (SITE_ADRESI); sablon sonuna /giris ekler" },
    ],
    konu: "{{ogrenciAd}} · Haftalık İlerleme Raporu 📊",
    govde: gomlek(`<h2 style="color:#7A2035;margin-top:0">Haftalık İlerleme Raporu 📊</h2>
  <p>Sayın {{veliAd}},</p>
  <p><b>{{ogrenciAd}}</b> için {{donem}} gelişim özeti aşağıdadır:</p>
  <table style="width:100%;border-collapse:collapse;background:#f3f4f6;border-radius:14px;margin:16px 0">
    <tr><td style="padding:8px 14px;color:#6b7280">Ödev tamamlama</td><td style="padding:8px 14px;text-align:right"><b>{{odev}}</b></td></tr>
    <tr><td style="padding:8px 14px;color:#6b7280">Haftalık takip</td><td style="padding:8px 14px;text-align:right"><b>{{takip}}</b></td></tr>
    <tr><td style="padding:8px 14px;color:#6b7280">Son deneme neti</td><td style="padding:8px 14px;text-align:right"><b>{{sonNet}}</b></td></tr>
    <tr><td style="padding:8px 14px;color:#6b7280">Yol haritası</td><td style="padding:8px 14px;text-align:right"><b>{{seviye}}</b></td></tr>
    <tr><td style="padding:8px 14px;color:#6b7280">Öne çıkan zayıf konular</td><td style="padding:8px 14px;text-align:right"><b>{{zayif}}</b></td></tr>
    <tr><td style="padding:8px 14px;color:#6b7280">Sıradaki özel ders</td><td style="padding:8px 14px;text-align:right"><b>{{sonrakiDers}}</b></td></tr>
  </table>
  <p>Detaylı takip için veli panelinize giriş yapabilirsiniz: {{panelAdresi}}/giris</p>
  <p style="color:#6b7280">Sorularınız için öğrencinin koçu {{koc}} ile iletişime geçebilirsiniz.</p>`),
  },
  {
    anahtar: "basvuru-alindi",
    ad: "Başvuru Alındı",
    aciklama:
      "Ön mülakat başvurusu gönderildiğinde, e-posta adresi girildiyse başvurana gönderilir. Başvuru takip bağlantısını içerir.",
    degiskenler: [
      { ad: "ad", aciklama: "Başvuranın ad soyadı" },
      { ad: "tur", aciklama: "Başvuru türü (Öğretmen / Öğrenci / Eğitim Koçu)" },
      { ad: "takipAdresi", aciklama: "Başvuru durumu takip bağlantısı" },
    ],
    konu: "Başvurunuz Alındı — Kaynak Kampüs {{tur}} Ön Mülakatı ✅",
    govde: gomlek(`<h2 style="color:#7A2035;margin-top:0">Başvurunuz Alındı ✅</h2>
  <p>Merhaba {{ad}},</p>
  <p><b>{{tur}}</b> ön mülakat başvurunuz bize ulaştı. En kısa sürede değerlendirip sizinle iletişime geçeceğiz.</p>
  <p style="background:#f3f4f6;border-radius:14px;padding:12px 16px;margin:16px 0">
    Başvurunuzun durumunu ve mülakat bilgilerini aşağıdaki bağlantıdan takip edebilirsiniz:<br/>
    <a href="{{takipAdresi}}" style="color:#7A2035">{{takipAdresi}}</a>
  </p>
  <p>Bu bağlantıyı yalnız siz görebilirsiniz; lütfen saklayınız.</p>`),
  },
  {
    anahtar: "mulakat-planlandi",
    ad: "Mülakat Planlandı",
    aciklama: "Başvuru için mülakat planlandığında/yeniden planlandığında başvurana gönderilir.",
    degiskenler: [
      { ad: "ad", aciklama: "Başvuranın ad soyadı" },
      { ad: "tarih", aciklama: "Mülakat tarihi (GG.AA.YYYY)" },
      { ad: "saat", aciklama: "Mülakat saati" },
      { ad: "tur", aciklama: "Görüşme türü" },
      { ad: "detay", aciklama: "Bağlantı veya adres" },
      { ad: "aciklama", aciklama: "Başvurana gönderilecek açıklama" },
      { ad: "takipAdresi", aciklama: "Başvuru durumu takip bağlantısı" },
    ],
    konu: "Mülakat Randevunuz: {{tarih}} {{saat}} 📅",
    govde: gomlek(`<h2 style="color:#7A2035;margin-top:0">Mülakat Randevunuz 📅</h2>
  <p>Merhaba {{ad}},</p>
  <p>Başvurunuz için mülakat randevunuz oluşturuldu:</p>
  <p style="background:#f3f4f6;border-radius:14px;padding:12px 16px;margin:16px 0">
    <b>Tarih:</b> {{tarih}}<br/>
    <b>Saat:</b> {{saat}}<br/>
    <b>Görüşme türü:</b> {{tur}}<br/>
    <b>Bağlantı / Adres:</b> {{detay}}
  </p>
  <p>{{aciklama}}</p>
  <p>Ayrıntılar ve güncellemeler için: <a href="{{takipAdresi}}" style="color:#7A2035">{{takipAdresi}}</a></p>`),
  },
  {
    anahtar: "mulakat-hatirlatma",
    ad: "Mülakat Hatırlatma",
    aciklama:
      "Mülakattan bir gün ve bir saat önce başvurana otomatik hatırlatma olarak gönderilir.",
    degiskenler: [
      { ad: "ad", aciklama: "Başvuranın ad soyadı" },
      { ad: "tarih", aciklama: "Mülakat tarihi (GG.AA.YYYY)" },
      { ad: "saat", aciklama: "Mülakat saati" },
      { ad: "tur", aciklama: "Görüşme türü" },
      { ad: "detay", aciklama: "Bağlantı veya adres" },
      { ad: "neKadarKala", aciklama: "Hatırlatma ölçeği (örn. yarın / 1 saat sonra)" },
    ],
    konu: "Mülakat Hatırlatması: {{tarih}} {{saat}} ⏰",
    govde: gomlek(`<h2 style="color:#7A2035;margin-top:0">Mülakat Hatırlatması ⏰</h2>
  <p>Merhaba {{ad}},</p>
  <p>Mülakatınız <b>{{neKadarKala}}</b>. Bilgileri hatırlatmak isteriz:</p>
  <p style="background:#f3f4f6;border-radius:14px;padding:12px 16px;margin:16px 0">
    <b>Tarih:</b> {{tarih}}<br/>
    <b>Saat:</b> {{saat}}<br/>
    <b>Görüşme türü:</b> {{tur}}<br/>
    <b>Bağlantı / Adres:</b> {{detay}}
  </p>
  <p>Görüşmede buluşmak dileğiyle!</p>`),
  },
  {
    anahtar: "basvuru-sonuc",
    ad: "Başvuru Sonucu (Olumlu / Olumsuz)",
    aciklama:
      "Başvuru durumu Olumlu veya Olumsuz'a çekildiğinde (durum seçimi ya da mülakat sonucu) başvurana son durumu bildirir.",
    degiskenler: [
      { ad: "ad", aciklama: "Başvuranın ad soyadı" },
      { ad: "sonucBaslik", aciklama: "Sonuç başlığı (örn. Başvurunuz Olumlu Sonuçlandı)" },
      { ad: "sonucMesaj", aciklama: "Sonuca göre bilgilendirme metni" },
      { ad: "takipAdresi", aciklama: "Başvuru durumu takip bağlantısı" },
    ],
    konu: "Başvuru Sonucunuz — Kaynak Kampüs",
    govde: gomlek(`<h2 style="color:#7A2035;margin-top:0">{{sonucBaslik}}</h2>
  <p>Merhaba {{ad}},</p>
  <p>{{sonucMesaj}}</p>
  <p style="margin-top:16px">Başvurunuzun güncel durumunu buradan görebilirsiniz:<br/>
    <a href="{{takipAdresi}}" style="color:#7A2035">{{takipAdresi}}</a></p>`),
  },
];
