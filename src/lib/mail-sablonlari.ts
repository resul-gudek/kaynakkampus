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

export const VARSAYILAN_SABLONLAR: MailSablonTanim[] = [
  {
    anahtar: "hosgeldin",
    ad: "Hoş Geldin Maili",
    aciklama: "Yeni kullanıcı (koç veya öğrenci) oluşturulduğunda, e-posta adresi girilmişse gönderilir.",
    degiskenler: [
      { ad: "ad", aciklama: "Kullanıcının ad soyadı" },
      { ad: "kullanici", aciklama: "Giriş için kullanıcı adı" },
      { ad: "rol", aciklama: "Koç / Öğrenci" },
      { ad: "panelAdresi", aciklama: "Uygulama adresi (UYGULAMA_URL)" },
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
      { ad: "panelAdresi", aciklama: "Uygulama adresi (UYGULAMA_URL)" },
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
