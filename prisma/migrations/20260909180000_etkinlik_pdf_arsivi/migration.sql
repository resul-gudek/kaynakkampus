-- Etkinlikler modülü yeniden kuruldu: takvim yerine PDF ARŞİVİ + KLASÖR AĞACI.
--
-- Eski Etkinlik tablosu (tarih/saat/yer/çevrim içi/kategori/durum hesapları)
-- düşürülür. Gerçek etkinlik verisi yoktu — yalnız geliştirme denemeleri
-- vardı ve onlar da silinmişti; veri taşıma gerekmiyor.
--
-- Yeni tablo tek düğüm tablosudur: klasör de PDF de aynı satır biçimidir
-- (tur alanı ayırır). Kendine dönük FK'de CASCADE YOKTUR — SQL Server
-- döngüsel cascade yolunu reddeder; alt ağaç uygulama tarafında
-- özyinelemeli silinir (bkz. actions/etkinlik.ts).

BEGIN TRY

BEGIN TRAN;

-- DropTable — eski etkinlik takvimi
IF OBJECT_ID('[dbo].[Etkinlik]', 'U') IS NOT NULL DROP TABLE [dbo].[Etkinlik];

-- CreateTable
CREATE TABLE [dbo].[EtkinlikDugum] (
    [id] NVARCHAR(1000) NOT NULL,
    [ustId] NVARCHAR(1000),
    [tur] NVARCHAR(1000) NOT NULL,
    [ad] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [sira] INT NOT NULL CONSTRAINT [EtkinlikDugum_sira_df] DEFAULT 0,
    [durum] NVARCHAR(1000) NOT NULL CONSTRAINT [EtkinlikDugum_durum_df] DEFAULT 'yayinda',
    [dosyaYol] NVARCHAR(1000),
    [dosyaAd] NVARCHAR(1000) NOT NULL CONSTRAINT [EtkinlikDugum_dosyaAd_df] DEFAULT '',
    [dosyaBoyut] INT NOT NULL CONSTRAINT [EtkinlikDugum_dosyaBoyut_df] DEFAULT 0,
    [kapakYol] NVARCHAR(1000),
    [kapakTur] NVARCHAR(1000) NOT NULL CONSTRAINT [EtkinlikDugum_kapakTur_df] DEFAULT '',
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [EtkinlikDugum_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    [guncelleme] DATETIME2 NOT NULL CONSTRAINT [EtkinlikDugum_guncelleme_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [EtkinlikDugum_pkey] PRIMARY KEY CLUSTERED ([id]),
    -- Kardeşler arasında adres çakışması olmasın. SQL Server tekil indekste
    -- NULL'ları eşit sayar; bu tam olarak istenen davranıştır (kök klasörler
    -- de birbiriyle çakışmaz).
    CONSTRAINT [EtkinlikDugum_ustId_slug_key] UNIQUE NONCLUSTERED ([ustId], [slug])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EtkinlikDugum_ustId_sira_idx] ON [dbo].[EtkinlikDugum]([ustId], [sira]);
CREATE NONCLUSTERED INDEX [EtkinlikDugum_tur_durum_idx] ON [dbo].[EtkinlikDugum]([tur], [durum]);

-- AddForeignKey — kendine dönük; cascade YOK (SQL Server döngü kontrolü)
ALTER TABLE [dbo].[EtkinlikDugum] ADD CONSTRAINT [EtkinlikDugum_ustId_fkey]
  FOREIGN KEY ([ustId]) REFERENCES [dbo].[EtkinlikDugum]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Enum yerine geçen String alanlar için CHECK constraint'ler
-- (bkz. 20260723172445_check_constraints; asıl doğrulama zod'da)
ALTER TABLE [dbo].[EtkinlikDugum] ADD CONSTRAINT [CK_EtkinlikDugum_tur]
  CHECK ([tur] IN (N'klasor', N'pdf'));

ALTER TABLE [dbo].[EtkinlikDugum] ADD CONSTRAINT [CK_EtkinlikDugum_durum]
  CHECK ([durum] IN (N'taslak', N'yayinda'));

-- Kendi kendinin üstü olamaz (tek adımlı döngü); derin döngü uygulamada
-- engellenir (bkz. dugumTasi)
ALTER TABLE [dbo].[EtkinlikDugum] ADD CONSTRAINT [CK_EtkinlikDugum_ust]
  CHECK ([ustId] IS NULL OR [ustId] <> [id]);

-- ── Varsayılan klasör ağacı ──────────────────────────────────
-- Kademe ve sınıf klasörleri hazır gelir; yönetici bunların altına
-- istediği kadar alt klasör açar. Kimlikler sabittir: migration yeniden
-- çalıştırılsa da (ya da başka ortamda) aynı ağaç oluşur.
INSERT INTO [dbo].[EtkinlikDugum] ([id], [ustId], [tur], [ad], [slug], [sira], [durum]) VALUES
  (N'etk-ilkokul',    NULL, N'klasor', N'İlkokul',  N'ilkokul',  1, N'yayinda'),
  (N'etk-ortaokul',   NULL, N'klasor', N'Ortaokul', N'ortaokul', 2, N'yayinda'),
  (N'etk-lise',       NULL, N'klasor', N'Lise',     N'lise',     3, N'yayinda'),

  (N'etk-sinif-1',  N'etk-ilkokul',  N'klasor', N'1. Sınıf',  N'1-sinif',  1, N'yayinda'),
  (N'etk-sinif-2',  N'etk-ilkokul',  N'klasor', N'2. Sınıf',  N'2-sinif',  2, N'yayinda'),
  (N'etk-sinif-3',  N'etk-ilkokul',  N'klasor', N'3. Sınıf',  N'3-sinif',  3, N'yayinda'),
  (N'etk-sinif-4',  N'etk-ilkokul',  N'klasor', N'4. Sınıf',  N'4-sinif',  4, N'yayinda'),

  (N'etk-sinif-5',  N'etk-ortaokul', N'klasor', N'5. Sınıf',  N'5-sinif',  1, N'yayinda'),
  (N'etk-sinif-6',  N'etk-ortaokul', N'klasor', N'6. Sınıf',  N'6-sinif',  2, N'yayinda'),
  (N'etk-sinif-7',  N'etk-ortaokul', N'klasor', N'7. Sınıf',  N'7-sinif',  3, N'yayinda'),
  (N'etk-sinif-8',  N'etk-ortaokul', N'klasor', N'8. Sınıf',  N'8-sinif',  4, N'yayinda'),

  (N'etk-sinif-9',  N'etk-lise',     N'klasor', N'9. Sınıf',  N'9-sinif',  1, N'yayinda'),
  (N'etk-sinif-10', N'etk-lise',     N'klasor', N'10. Sınıf', N'10-sinif', 2, N'yayinda'),
  (N'etk-sinif-11', N'etk-lise',     N'klasor', N'11. Sınıf', N'11-sinif', 3, N'yayinda'),
  (N'etk-sinif-12', N'etk-lise',     N'klasor', N'12. Sınıf', N'12-sinif', 4, N'yayinda');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
