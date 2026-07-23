# Kaynak Akademi

Eğitim koçluğu ve takip platformu — **Next.js (App Router) + TypeScript + Prisma + Microsoft SQL Server**.

Ön yüz ve arka yüz tek projededir: sayfalar React Server Component, mutasyonlar Server Action,
veri erişimi Prisma ile doğrudan bu repo içinden yapılır. Ayrı bir API projesi yoktur.

## Bölümler

| Rota | Ne |
|---|---|
| `/` | Tanıtım ana sayfası (statik, `public/index.html`) |
| `/giris` | Kullanıcı adı + şifre girişi (öğretmen / öğrenci / yönetici) |
| `/koc` | Koç paneli: ajanda, öğrenciler, ödev/takip/yol haritası/deneme/özel ders yönetimi |
| `/ogrenci` | Öğrenci paneli: oyunlaştırılmış yol haritası, ödevler, deneme girişi + net grafiği |
| `/siniflar` | Öğretmen ve öğrenci için online sınıflar, üyelikler ve canlı ders programı |
| `/canli-ders/[id]` | Zaman ve sınıf üyeliği kontrollü canlı ders hazırlık/katılım ekranı |
| `/bildirimler` | Bildirim kutusu (koç + öğrenci), kayda deep-link |
| `/admin` | Yönetici: koç hesapları (ekle / pasifleştir / şifre sıfırla / sil) |
| `/odev-olustur.html`, `/bep-olustur.html`, `/ders-programi.html`, `/etkinlikler.html`, `/haberler.html` | Bağımsız statik araçlar (`public/`) |

`legacy/` klasörü eski localStorage tabanlı demo sayfalarını port referansı olarak saklar; sunulmaz.

## Kurulum

1. **Gereksinimler:** Node 22+, erişilebilir bir SQL Server (2019+).
2. Veritabanlarını oluşturun (Türkçe collation önerilir):
   ```sql
   CREATE DATABASE kaynakakademi COLLATE Turkish_CI_AS;
   CREATE DATABASE kaynakakademi_shadow COLLATE Turkish_CI_AS; -- sadece migrate dev için
   ```
3. `.env.example` → `.env` kopyalayın ve bağlantı bilgilerini girin
   (`AUTH_SECRET` için: `npx auth secret` ya da rastgele 32+ karakter).
4. Kur ve başlat:
   ```bash
   npm install
   npx prisma migrate dev   # şemayı uygular
   npx prisma db seed       # demo verisi (idempotent)
   npm run dev              # http://localhost:3000
   ```

## Demo hesaplar (seed)

| Rol | Kullanıcı | Şifre |
|---|---|---|
| Yönetici | `admin` | `admin1234` |
| Öğretmen | `koc1` | `1234` |
| Öğrenci | `ogrenci1` / `ogrenci2` / `ogrenci3` | `1234` |

## Mimari notlar

- **Enum yok:** MSSQL'de Prisma enum desteklemez; `rol/durum/tur` alanları String'dir,
  zod (`src/lib/dogrulama.ts`) + veritabanı CHECK constraint'leriyle doğrulanır.
- **İş kuralları** `src/lib/hesap.ts`'te saf fonksiyonlardır (net hesabı, XP/rozet,
  zayıf konu analizi, özel ders özeti) — legacy `kocluk.js` ile birebir aynı davranır.
- **Bildirimler** action'ların transaction'ları içinde üretilir (`src/lib/bildirim.ts`,
  alıcı başına 200 kayıt tavanı) ve `hedef*` alanlarıyla ilgili kayda link verir.
- **Silme işlemleri** uygulama katmanında transaction ile yapılır — SQL Server,
  `Kullanici`'ye giden çoklu FK yolları nedeniyle cascade kabul etmez.
- **Online sınıflar:** Kalıcı öğrenci grubu `OnlineSinif`, belirli tarih/saatteki ders
  `DersOturumu` olarak ayrı tutulur. Canlı medya BigBlueButton API adaptörü üzerinden
  sağlanır; `BBB_API_URL` ve `BBB_SECRET` yoksa sınıf planlanabilir ancak oda açılmaz.
  Ders kaydı KVKK süreci tamamlanana kadar uygulama ve veritabanı seviyesinde kapalıdır.
- **Kullanıcı adları** her yerde `toLocaleLowerCase("tr-TR")` ile normalize edilir
  (İ/ı tuzağı — bkz. `kullaniciAdiNormalize`).
- Gün bazlı tarihler (`@db.Date`) UTC gece yarısı `Date` nesnesidir; karşılaştırma
  ve format `src/lib/hesap.ts`'teki yardımcılarla ISO dizgesi üzerinden yapılır.

## Loglama

Yapılandırılmış loglama **pino** ile `src/lib/log.ts`'ten yapılır (yalnız sunucu tarafı):

- Geliştirmede renkli/okunur konsol çıktısı, production'da JSON satırları (stdout).
- `LOG_LEVEL` ile seviye (`debug` seviyesinde Prisma sorguları da loglanır),
  `LOG_DOSYA` ile konsola ek dosya çıktısı (`logs/uygulama.log` gibi) açılır.
- **Otomatik loglanan olaylar:** giriş denemeleri (başarılı/reddedilen, nedeniyle),
  tüm server action hataları (stack ile, `hataMetni` üzerinden merkezî),
  Prisma uyarı/hataları, yakalanmamış istek hataları (`src/instrumentation.ts`).
- **Denetim (audit) kayıtları:** önemli mutasyonlar `denetim(islem, kimlik, detay)`
  ile `modul: "denetim"` etiketli loglanır — kim, neyi, hangi kayıtta yaptı
  (ödev ekle/sil/durum, özel ders ekle/güncelle/sil, deneme, yol haritası,
  öğrenci ekle/ata ve tüm admin işlemleri).
- Yeni modülde log için: `const log = logcu("modul-adi")` → `log.info({...}, "mesaj")`.

## Yol haritası

- [x] Faz 1–7: koçluk uygulamasının Next.js + MSSQL'e taşınması (bkz. `PLAN.md`)
- [ ] Statik araçların (ödev oluşturucu, BEP, ders programı…) React'e taşınması
- [ ] Ödev oluşturucu soru bankasının veritabanına alınması ve `odevler` ile entegrasyonu
- [ ] Velilere otomatik raporlama (şu an WhatsApp linkiyle manuel)
