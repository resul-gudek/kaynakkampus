BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Kullanici] ADD [eposta] NVARCHAR(1000) NOT NULL CONSTRAINT [Kullanici_eposta_df] DEFAULT '';

-- CreateTable
CREATE TABLE [dbo].[MailAyar] (
    [id] INT NOT NULL CONSTRAINT [MailAyar_id_df] DEFAULT 1,
    [aktif] BIT NOT NULL CONSTRAINT [MailAyar_aktif_df] DEFAULT 0,
    [sunucu] NVARCHAR(1000) NOT NULL CONSTRAINT [MailAyar_sunucu_df] DEFAULT '',
    [port] INT NOT NULL CONSTRAINT [MailAyar_port_df] DEFAULT 587,
    [guvenli] BIT NOT NULL CONSTRAINT [MailAyar_guvenli_df] DEFAULT 0,
    [kullaniciAdi] NVARCHAR(1000) NOT NULL CONSTRAINT [MailAyar_kullaniciAdi_df] DEFAULT '',
    [sifre] NVARCHAR(1000) NOT NULL CONSTRAINT [MailAyar_sifre_df] DEFAULT '',
    [gonderenAd] NVARCHAR(1000) NOT NULL CONSTRAINT [MailAyar_gonderenAd_df] DEFAULT 'Kaynak Akademi',
    [gonderenAdres] NVARCHAR(1000) NOT NULL CONSTRAINT [MailAyar_gonderenAdres_df] DEFAULT '',
    [hatirlatmaSaat] INT NOT NULL CONSTRAINT [MailAyar_hatirlatmaSaat_df] DEFAULT 24,
    [guncelleme] DATETIME2 NOT NULL CONSTRAINT [MailAyar_guncelleme_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [MailAyar_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[MailSablon] (
    [id] NVARCHAR(1000) NOT NULL,
    [anahtar] NVARCHAR(1000) NOT NULL,
    [ad] NVARCHAR(1000) NOT NULL,
    [konu] NVARCHAR(1000) NOT NULL,
    [govde] NVARCHAR(max) NOT NULL,
    [aktif] BIT NOT NULL CONSTRAINT [MailSablon_aktif_df] DEFAULT 1,
    [guncelleme] DATETIME2 NOT NULL CONSTRAINT [MailSablon_guncelleme_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [MailSablon_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [MailSablon_anahtar_key] UNIQUE NONCLUSTERED ([anahtar])
);

-- CreateTable
CREATE TABLE [dbo].[MailKuyruk] (
    [id] NVARCHAR(1000) NOT NULL,
    [alici] NVARCHAR(1000) NOT NULL,
    [aliciAd] NVARCHAR(1000) NOT NULL CONSTRAINT [MailKuyruk_aliciAd_df] DEFAULT '',
    [konu] NVARCHAR(1000) NOT NULL,
    [govde] NVARCHAR(max) NOT NULL,
    [durum] NVARCHAR(1000) NOT NULL CONSTRAINT [MailKuyruk_durum_df] DEFAULT 'bekliyor',
    [deneme] INT NOT NULL CONSTRAINT [MailKuyruk_deneme_df] DEFAULT 0,
    [sonHata] NVARCHAR(max) NOT NULL CONSTRAINT [MailKuyruk_sonHata_df] DEFAULT '',
    [planlanan] DATETIME2 NOT NULL CONSTRAINT [MailKuyruk_planlanan_df] DEFAULT CURRENT_TIMESTAMP,
    [gonderim] DATETIME2,
    [sablon] NVARCHAR(1000) NOT NULL CONSTRAINT [MailKuyruk_sablon_df] DEFAULT '',
    [refTur] NVARCHAR(1000) NOT NULL CONSTRAINT [MailKuyruk_refTur_df] DEFAULT '',
    [refId] NVARCHAR(1000) NOT NULL CONSTRAINT [MailKuyruk_refId_df] DEFAULT '',
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [MailKuyruk_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [MailKuyruk_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MailKuyruk_durum_planlanan_idx] ON [dbo].[MailKuyruk]([durum], [planlanan]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MailKuyruk_sablon_refTur_refId_idx] ON [dbo].[MailKuyruk]([sablon], [refTur], [refId]);

-- Enum yerine geçen String alan için CHECK constraint (elle eklendi; asıl doğrulama zod'da)
ALTER TABLE [dbo].[MailKuyruk] ADD CONSTRAINT [CK_MailKuyruk_durum]
  CHECK ([durum] IN (N'bekliyor', N'gonderildi', N'hata'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
