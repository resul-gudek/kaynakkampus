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
| `/veli` | Veli paneli: bağlı öğrenci(ler)in gelişim özeti (salt-okunur) + otomatik/manuel rapor |
| `/mesajlar` | Koç ↔ öğrenci çift yönlü mesajlaşma (okunmamış rozeti sidebar'da) |
| `/siniflar` | Öğretmen ve öğrenci için online sınıflar, üyelikler ve canlı ders programı |
| `/canli-ders/[id]` | Zaman ve sınıf üyeliği kontrollü canlı ders hazırlık/katılım ekranı |
| `/bildirimler` | Bildirim kutusu (koç + öğrenci), kayda deep-link |
| `/admin` | Yönetici: kullanıcı/koç hesapları (ekle / pasifleştir / şifre sıfırla / sil), mail, aktivite |
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
| Veli | `veli1` (ogrenci1'e bağlı) | `1234` |

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
  `DersOturumu` olarak ayrı tutulur. Canlı medya self-hosted LiveKit üzerinden sağlanır
  (video/ses/ekran paylaşımı + Excalidraw tahta senkronu); erişim token'ları
  `src/lib/canli-ders.ts`'te sunucu tarafında üretilir. `LIVEKIT_URL`,
  `LIVEKIT_API_KEY` ve `LIVEKIT_API_SECRET` yoksa sınıf planlanabilir ancak oda açılmaz.
  Yerel geliştirme için `ops/livekit-local/README.md`.
  Ders kaydı KVKK süreci tamamlanana kadar uygulama ve veritabanı seviyesinde kapalıdır.
- **Veli portalı:** Öğrenci → veli bağı `Kullanici.veliId` self-FK'sıyladır (bir veli
  birden çok çocuğa bakabilir). Veli paneli salt-okunurdur; özet veriler `hesap.ts`
  saf fonksiyonlarından beslenir. Haftalık ilerleme raporu `src/lib/veli-rapor.ts`'te
  üretilir: koç öğrenci detayından anlık gönderebilir; Mail Ayarları'nda "veli raporu"
  açıksa mail işleyicisi hafta başı anahtarıyla (tekrarsız) otomatik kuyruklar.
- **Mesajlaşma:** Koç ↔ (kendi) öğrencisi arası çift yönlü; ayrı "konuşma" tablosu yok,
  `Mesaj` satırları iki kullanıcı arasında tarih sırasına göre gruplanır. Yetki
  `src/actions/mesaj.ts`'te doğrulanır (koç yalnız kendi öğrencisine, öğrenci yalnız
  kendi koçuna). Okunmamış rozeti sidebar'da menü kaleminde gösterilir.
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

## Test

Saf iş kuralları (`src/lib/hesap.ts`) **Vitest** ile test edilir:

```bash
npm test        # tek sefer (vitest run)
npm run test:izle  # izleme modu
```

Testler `src/**/*.test.ts` altında; DB/DOM gerekmez (node ortamı, `vitest.config.ts`).
`hesap.test.ts` net hesabı, XP/rozet, zayıf konu, özel ders/öğrenci özeti ve tarih
yardımcılarını kapsar (39 test).

## Yol haritası

- [x] Faz 1–7: koçluk uygulamasının Next.js + MSSQL'e taşınması (bkz. `PLAN.md`)
- [x] Veli portalı + otomatik/manuel ilerleme raporu (mail)
- [x] Koç ↔ öğrenci mesajlaşma
- [x] Saf iş kuralları için birim test altyapısı (Vitest)
- [ ] Statik araçların (ödev oluşturucu, BEP, ders programı…) React'e taşınması
- [ ] Ödev oluşturucu soru bankasının veritabanına alınması ve `odevler` ile entegrasyonu
