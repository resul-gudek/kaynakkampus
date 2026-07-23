/* Varsayılan e-posta şablonları — hem uygulama (src/lib/mail.ts) hem de
   prisma/seed.ts tarafından kullanılır; bu yüzden prisma'ya bağımlı değildir.
   Gövde/konu içinde {{degisken}} yer tutucuları kullanılır; gövde değerleri
   gönderim öncesi HTML kaçışından geçirilir (bkz. sablonDoldur). */

export const MAIL_SABLON_ANAHTARLARI = ["hosgeldin", "ders-hatirlatma"] as const;
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
    Bu e-posta Kaynak Akademi koçluk sistemi tarafından otomatik gönderilmiştir; lütfen yanıtlamayınız.
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
    konu: "Kaynak Akademi'ye Hoş Geldin, {{ad}}! 🎉",
    govde: gomlek(`<h2 style="color:#1a3c8f;margin-top:0">Hoş Geldin, {{ad}}! 🎉</h2>
  <p>Kaynak Akademi koçluk sistemine <b>{{rol}}</b> olarak kaydın oluşturuldu.</p>
  <p style="background:#f3f4f6;border-radius:8px;padding:12px 16px;margin:16px 0">
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
    govde: gomlek(`<h2 style="color:#1a3c8f;margin-top:0">Ders Hatırlatması ⏰</h2>
  <p>Merhaba {{ad}},</p>
  <p>Yaklaşan özel dersini hatırlatmak isteriz:</p>
  <p style="background:#f3f4f6;border-radius:8px;padding:12px 16px;margin:16px 0">
    <b>Ders:</b> {{ders}}<br/>
    <b>Konu:</b> {{konu}}<br/>
    <b>Tarih:</b> {{tarih}}<br/>
    <b>Saat:</b> {{saat}}<br/>
    <b>Süre:</b> {{sure}} dakika<br/>
    <b>Koç:</b> {{koc}}
  </p>
  <p>Derse hazır olman dileğiyle, başarılar! 📚</p>`),
  },
];
