-- Etkinlik modülü: herkese açık etkinlik takvimi (Etkinlik).
-- Blog gibi kullanıcı sistemine bağlı değildir; Kullanici tablosuna FK yoktur.
-- Adres `slug` üzerinden kurulur (/etkinlikler/<slug>).
--
-- Tarih ile saat AYRI kolonlardır: `tarih` günün UTC gece yarısı, `saat`
-- "14:30" biçiminde metin. Sunucu saat dilimi değişse de gün/saat kaymaz.

BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Etkinlik] (
    [id] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [baslik] NVARCHAR(1000) NOT NULL,
    [ozet] NVARCHAR(1000) NOT NULL CONSTRAINT [Etkinlik_ozet_df] DEFAULT '',
    [icerik] NVARCHAR(max) NOT NULL CONSTRAINT [Etkinlik_icerik_df] DEFAULT '',
    [kategori] NVARCHAR(1000) NOT NULL,
    [tarih] DATETIME2 NOT NULL,
    [bitisTarihi] DATETIME2,
    [saat] NVARCHAR(1000) NOT NULL CONSTRAINT [Etkinlik_saat_df] DEFAULT '',
    [bitisSaati] NVARCHAR(1000) NOT NULL CONSTRAINT [Etkinlik_bitisSaati_df] DEFAULT '',
    [cevrimIci] BIT NOT NULL CONSTRAINT [Etkinlik_cevrimIci_df] DEFAULT 0,
    [yer] NVARCHAR(1000) NOT NULL CONSTRAINT [Etkinlik_yer_df] DEFAULT '',
    [baglantiAdres] NVARCHAR(1000) NOT NULL CONSTRAINT [Etkinlik_baglantiAdres_df] DEFAULT '',
    [baglantiEtiket] NVARCHAR(1000) NOT NULL CONSTRAINT [Etkinlik_baglantiEtiket_df] DEFAULT '',
    [kapakYol] NVARCHAR(1000),
    [kapakTur] NVARCHAR(1000) NOT NULL CONSTRAINT [Etkinlik_kapakTur_df] DEFAULT '',
    [kapakAd] NVARCHAR(1000) NOT NULL CONSTRAINT [Etkinlik_kapakAd_df] DEFAULT '',
    [durum] NVARCHAR(1000) NOT NULL CONSTRAINT [Etkinlik_durum_df] DEFAULT 'taslak',
    [sira] INT NOT NULL CONSTRAINT [Etkinlik_sira_df] DEFAULT 0,
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [Etkinlik_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    [guncelleme] DATETIME2 NOT NULL CONSTRAINT [Etkinlik_guncelleme_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Etkinlik_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Etkinlik_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Etkinlik_durum_tarih_idx] ON [dbo].[Etkinlik]([durum], [tarih]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Etkinlik_durum_sira_tarih_idx] ON [dbo].[Etkinlik]([durum], [sira], [tarih]);

-- Enum yerine geçen String alanlar için CHECK constraint'ler
-- (bkz. 20260723172445_check_constraints; asıl doğrulama zod'da).
-- DİKKAT: SQL Server CHECK ifadesinde BIT kolonu işlenen olarak yazılamaz;
-- cevrimIci hiçbir kısıtta kullanılmaz.
ALTER TABLE [dbo].[Etkinlik] ADD CONSTRAINT [CK_Etkinlik_durum]
  CHECK ([durum] IN (N'taslak', N'yayinda', N'pasif'));

ALTER TABLE [dbo].[Etkinlik] ADD CONSTRAINT [CK_Etkinlik_kategori]
  CHECK ([kategori] IN (
    N'seminer', N'atolye', N'veli-bulusmasi', N'tanitim', N'deneme-sinavi',
    N'yarisma', N'gezi', N'kurs', N'duyuru', N'diger'
  ));

-- Bitiş günü başlangıçtan önce olamaz (çok günlü etkinlik)
ALTER TABLE [dbo].[Etkinlik] ADD CONSTRAINT [CK_Etkinlik_bitisTarihi]
  CHECK ([bitisTarihi] IS NULL OR [bitisTarihi] >= [tarih]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
