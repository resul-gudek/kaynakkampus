# Kaynak Akademi — Next.js + MSSQL Geçiş Planı

## Bağlam

Proje şu an 10 statik HTML sayfası + `assets/kocluk.js` (localStorage tabanlı demo veri katmanı,
global `KA` nesnesi) olarak duruyor. Gerçek kullanıcılarla çalışabilmesi için sunucu tarafı bir
uygulamaya ve gerçek bir veritabanına taşınacak.

**Kararlar (kullanıcı ile netleşti):**
- Tek proje: **Next.js (App Router) + TypeScript** — ön yüz ve arka yüz AYRILMAYACAK, tek projede.
- Veritabanı: **Microsoft SQL Server** (mevcut yerel sunucu: `127.0.0.1:1433`, SQL Server 2022 Express).
  Yeni ayrı veritabanı: `kaynakakademi` (+ migration için `kaynakakademi_shadow`), collation `Turkish_CI_AS`.
- ORM: **Prisma** (`sqlserver` provider).
- Auth: **kullanıcı adı + şifre** (e-posta yok), şifreler **bcryptjs** ile hash'lenir. Auth.js v5
  (next-auth@beta) Credentials provider, **JWT session**.
- Roller: **admin** (yeni — koçları yönetir), **koc**, **ogrenci**. Self-signup yok:
  admin koç oluşturur, koç öğrenci oluşturur.
- Faz 1 kapsamı: koçluk uygulaması (giriş, koç paneli, öğrenci paneli, bildirimler) + minimal admin.
  5 public araç (`odev-olustur`, `bep-olustur`, `ders-programi`, `etkinlikler`, `haberler`) ve
  `index.html` **olduğu gibi** `public/` klasöründen statik sunulur; React'e dönüştürme sonraki faz.

## Proje Yapısı

Next.js repo kökünde yaşar (`c:\Repos\kaynakakademi`).

| Mevcut dosya | Nereye | Neden |
|---|---|---|
| index, odev-olustur, bep-olustur, ders-programi, etkinlikler, haberler (.html) | `public/` | `KA` kullanmıyorlar; aynı URL'lerden birebir sunulur |
| `assets/logo.png` | `public/assets/logo.png` | Statik sayfaların göreli yolları korunur |
| giris, koc-panel, ogrenci-panel, bildirimler (.html) + `assets/kocluk.js` | `legacy/` | React'e taşınan sayfalar; port referansı olarak repoda kalır, sunulmaz |

`next.config.ts`:
- rewrite: `/` → `/index.html` (Next, `public/index.html`'i kökte otomatik sunmaz!)
- redirect: `/giris.html`→`/giris`, `/koc-panel.html`→`/koc`, `/ogrenci-panel.html`→`/ogrenci`, `/bildirimler.html`→`/bildirimler`

```
src/
├─ app/
│  ├─ layout.tsx, globals.css            # Poppins (next/font), mevcut CSS token'ları
│  ├─ giris/page.tsx (+ actions)
│  ├─ (panel)/layout.tsx                 # ortak header, rol menüsü, okunmamış rozeti
│  │  ├─ koc/page.tsx                    # ?ogrenci=&sekme=&kayit= deep-link korunur
│  │  ├─ ogrenci/page.tsx
│  │  ├─ bildirimler/page.tsx
│  │  └─ admin/page.tsx
│  └─ api/auth/[...nextauth]/route.ts
├─ components/                           # panel/, koc/, ogrenci/, ui/
├─ lib/
│  ├─ prisma.ts, auth.ts, auth.config.ts # auth.config edge-safe (Prisma import etmez)
│  ├─ sabitler.ts                        # DENEME_DERSLERI, PROFIL_DERSLERI
│  ├─ hesap.ts                           # netHesapla, xpOzet, yolDurumlu, zayifKonular,
│  │                                     # ozelDersOzet, ogrenciOzet, telefonDuzelt, tarihStr
│  ├─ bildirim.ts                        # bildirimEkle (tx içinde, 200 kayıt tavanı)
│  └─ dogrulama.ts                       # zod şemaları (enum yerine string union)
├─ actions/                              # odev, takip, deneme, yol, ozelders, bildirim, ogrenci, profil, admin
└─ middleware.ts
prisma/schema.prisma, prisma/seed.ts
```

**Adlandırma:** Türkçe alan terimleri her yerde (model/alan/action/route adları) — eski kodla 1:1
eşleşme port hatalarını önler. Framework'ün zorunlu kıldığı adlar İngilizce kalır.

**Stil:** Tailwind YOK. Mevcut sayfalardaki `:root` token'ları (`--blue:#1a3c8f`, `--teal:#0ea5c9`,
`--orange:#f97316`, `--bg-soft:#f0f4ff`, `--radius:14px`, gölgeler…) `globals.css`'e taşınır;
bileşen bazlı CSS Modules. Görsel süreklilik şart — statik sayfalarla panel aynı görünmeli.

## Veri Modeli (Prisma → MSSQL)

Prisma sqlserver **enum desteklemez** → String + zod union; `durum` alanlarına migration SQL'ine
elle CHECK constraint eklenir.

- **Kullanici**: id (cuid), rol, ad, kullanici (@unique, tr-TR lowercase), sifreHash, aktif;
  koç: brans; öğrenci: sinif, hedef, kocId (self-FK, NoAction), telefon, veliTelefon,
  profil (NVarChar(Max) JSON — atomik yazılıp bütün okunuyor, ayrı tabloya gerek yok)
- **Odev**: ogrenciId, kocId, ders, konu, aciklama, kaynak, soruSayisi, sonTarih (@db.Date),
  durum ("bekliyor"|"tamamlandi"), olusturma
- **Takip**: ogrenciId, kocId, gun, gorev, tamamlandi
- **Deneme**: ogrenciId, ad, tur ("TYT"|"AYT"|"LGS"|"Branş"), tarih, net (toplam)
  → **DenemeDers** (child, Cascade): ders, dogru, yanlis, bos, net, yanlisKonular (JSON dizi)
- **YolAdimi**: ogrenciId, kocId, sira (@@unique [ogrenciId,sira]), ders, konu, hedef, xp=50, tamamlandi
- **OzelDers**: ogrenciId, kocId, ders, konu, tarih, saat, sure, ucret, odendi,
  durum ("talep"|"planlandi"|"yapildi"|"reddedildi"|"iptal"), olusturan, mesaj, redNotu,
  not_ @map("not"), odev, olusturma
- **Bildirim**: aliciId, ikon, metin, hedefTur/hedefOgrenciId/hedefKayitId (3 nullable skaler),
  tarih, okundu — kullanıcı başına 200 tavan. @@index([aliciId, okundu])

⚠️ `Kullanici`'ye çift FK (ogrenciId+kocId) ve self-FK: SQL Server çoklu cascade yolu kabul etmez →
hepsi `onDelete: NoAction`; silmeler app tarafında `$transaction` ile (önce bağımlılar).

## Korunacak İş Kuralları (kaynak: legacy/assets/kocluk.js)

- `netHesapla`: net = round((doğru − yanlış/bölen)×100)/100; bölen LGS'de 3, diğerlerinde 4
- `DENEME_DERSLERI` ders/soru düzenleri (TYT/AYT/LGS/Branş), `PROFIL_DERSLERI` (YKS/LGS)
- XP/seviye: XP = tamamlanan adımların toplamı; seviye = floor(XP/100)+1; adımlar sıralı
  (yalnız sıradaki aktif, sonrakiler kilitli); rozetler: 1 adım🚀 / 3 adım🔥 / %50🌗 / 300XP💎 / %100🏆
- Özel ders akışı: talep (iki taraf da açabilir) → karşı taraf onaylar (planlandi) / reddeder
  (reddedildi + redNotu) → yapildi/iptal; ücret takibi (odendi), `ozelDersOzet` istatistikleri
- Bildirim tetikleri (mesaj metinleri kocluk.js'ten birebir): yeni ödev→öğrenci,
  ödev tamamlandı→koç, özel ders talep/öneri/onay/red/yapıldı/iptal/ödeme→karşı taraf;
  her biri deep-link `hedef` taşır
- `zayifKonular`: deneme yanlış konuları + profildeki eksikler, frekansa göre sıralı
- WhatsApp linkleri: `telefonDuzelt` ile normalize edilen numaralarla `wa.me` (ödev hatırlatma
  + veliye ilerleme raporu)

## Seed (prisma/seed.ts — idempotent, kullanici üzerinden upsert)

- `admin`/`admin1234` (YENİ), `koc1`/`1234` Ayşe Yılmaz, `ogrenci1`/`1234` Elif Demir (tam profil),
  `ogrenci2`/`1234` Mert Kaya (LGS), `ogrenci3`/`1234` Zeynep Arslan (kocId null — atanmamış akışı)
- 3 ödev, 4 takip, 3 deneme (DenemeDers çocuklarıyla, yanlisKonular dahil), 7 yol adımı
  (2 tamamlanmış), 6 özel ders (gün ofsetleri −7,−2,+1,+3,+4,+5), başlangıç bildirimleri

## Uygulama Sırası

- **Faz 0** ✅: git init + ilk commit; MSSQL erişimi doğrulandı; `kaynakakademi` +
  `kaynakakademi_shadow` DB'leri Turkish_CI_AS ile oluşturuldu
- **Faz 1**: create-next-app (TS, App Router, src/, Tailwind yok) → statikler `public/`'e,
  eski app sayfaları `legacy/`'ye; rewrite/redirect; globals.css token'ları; Poppins
  ✔ `/`, `/odev-olustur.html`, `/haberler.html` birebir açılıyor
- **Faz 2**: Prisma şema + `migrate dev` (CHECK'ler eklenir) + `lib/sabitler.ts` + `lib/hesap.ts`
  (birebir port) + seed ✔ prisma studio'da veriler; netHesapla/xpOzet spot testleri
- **Faz 3**: Auth (auth.config/auth.ts, /giris, middleware, panel layout + çıkış)
  ✔ 3 rol girişi, yanlış şifre TR hata, rol koruması, statik sayfalar oturumsuz açık
- **Faz 4**: Koç paneli — 4a: istatistik + takvim + öğrenci kartları + öğrenci ekle/ata;
  4b: öğrenci detay sekmeleri (profil/ödev/takip); 4c: yol + denemeler + özel dersler +
  WhatsApp + deep-link
- **Faz 5**: Öğrenci paneli — istatistik, oyunlaştırılmış yol haritası, ödevler, takip,
  profil formu, deneme girişi (canlı net + SVG grafik), özel ders talep/onay, kişisel takvim
- **Faz 6**: Bildirimler — sayfa, rozet, tüm tetikler action'lara, deep-link, 200 tavan
- **Faz 7**: Admin — koç CRUD, aktif/pasif (girişi engeller), şifre sıfırlama, transactional silme
- **Faz 8**: Cila — loading/error, boş durumlar, mobil (860px/520px kırılımları), metadata,
  `npm run build` temiz, README

## Doğrulama

- Her faz sonunda `npm run build` + faz özelindeki manuel senaryo
- Legacy demo (`legacy/*.html` dosyadan açılır, hâlâ çalışır) ile yan yana karşılaştırma:
  ogrenci1 net trendi (82.5→88.25), XP=100/seviye 2, zayıf konular sıralaması,
  ozelDersOzet (bekleyen ücret 800₺)
- Uçtan uca akışlar: koç öğrenci oluşturur→ödev verir→öğrenci tamamlar→koç bildirimi alır;
  özel ders tam durum makinesi; LGS bölen-3 net doğrulaması
- `lib/hesap.ts` için vitest birim testleri (saf fonksiyonlar)

## Riskler / Dikkat

1. **Bağlantı cümlesi** JDBC-vari: `sqlserver://127.0.0.1:1433;database=kaynakakademi;user=sa;password=…;encrypt=true;trustServerCertificate=true` — yerel sunucuda `trustServerCertificate=true` şart. `.env` commit edilmez (`.env.example` edilir).
2. **Shadow DB** önceden oluşturuldu → `shadowDatabaseUrl` ile verilir.
3. **Çoklu cascade yolu** → tüm Kullanici FK'ları NoAction; silme app tarafında.
4. **Türkçe İ/ı tuzağı**: kullanıcı adı normalize etmede her yerde `toLocaleLowerCase("tr-TR")`
   (tek yardımcı fonksiyon); raw SQL yazılırsa `N'...'`.
5. **Tarih**: `@db.Date` + UTC-gece-yarısı üretimi tek yardımcıdan; yerel `new Date()` ile
   karıştırma (İstanbul UTC+3 gün kayması).
6. **Auth.js v5 beta**: sürüm sabitle; Credentials→JWT zorunlu; deaktif koç kontrolü jwt
   callback'inde; `AUTH_TRUST_HOST=true`.
7. **Middleware matcher**: açık liste (`/koc/:path*`, `/ogrenci/:path*`, `/admin/:path*`,
   `/bildirimler`) — negatif catch-all statik .html'leri yakalar, kullanma.
8. **Windows**: bcryptjs (native derleme yok); `not` alan adı → `not_ @map("not")`.
