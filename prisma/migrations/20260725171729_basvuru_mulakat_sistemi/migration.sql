BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Basvuru] (
    [id] NVARCHAR(1000) NOT NULL,
    [tur] NVARCHAR(1000) NOT NULL,
    [durum] NVARCHAR(1000) NOT NULL CONSTRAINT [Basvuru_durum_df] DEFAULT 'yeni',
    [ad] NVARCHAR(1000) NOT NULL,
    [telefon] NVARCHAR(1000) NOT NULL CONSTRAINT [Basvuru_telefon_df] DEFAULT '',
    [eposta] NVARCHAR(1000) NOT NULL CONSTRAINT [Basvuru_eposta_df] DEFAULT '',
    [sehir] NVARCHAR(1000) NOT NULL CONSTRAINT [Basvuru_sehir_df] DEFAULT '',
    [veri] NVARCHAR(max) NOT NULL,
    [takipToken] NVARCHAR(1000) NOT NULL,
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [Basvuru_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    [guncelleme] DATETIME2 NOT NULL CONSTRAINT [Basvuru_guncelleme_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Basvuru_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Basvuru_takipToken_key] UNIQUE NONCLUSTERED ([takipToken])
);

-- CreateTable
CREATE TABLE [dbo].[BasvuruDosya] (
    [id] NVARCHAR(1000) NOT NULL,
    [basvuruId] NVARCHAR(1000) NOT NULL,
    [alan] NVARCHAR(1000) NOT NULL,
    [ad] NVARCHAR(1000) NOT NULL,
    [yol] NVARCHAR(1000) NOT NULL,
    [tur] NVARCHAR(1000) NOT NULL CONSTRAINT [BasvuruDosya_tur_df] DEFAULT '',
    [boyut] INT NOT NULL CONSTRAINT [BasvuruDosya_boyut_df] DEFAULT 0,
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [BasvuruDosya_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [BasvuruDosya_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BasvuruNot] (
    [id] NVARCHAR(1000) NOT NULL,
    [basvuruId] NVARCHAR(1000) NOT NULL,
    [yazarId] NVARCHAR(1000) NOT NULL,
    [yazarAd] NVARCHAR(1000) NOT NULL CONSTRAINT [BasvuruNot_yazarAd_df] DEFAULT '',
    [metin] NVARCHAR(max) NOT NULL,
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [BasvuruNot_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [BasvuruNot_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Mulakat] (
    [id] NVARCHAR(1000) NOT NULL,
    [basvuruId] NVARCHAR(1000) NOT NULL,
    [aktif] BIT NOT NULL CONSTRAINT [Mulakat_aktif_df] DEFAULT 1,
    [tarih] DATETIME2 NOT NULL,
    [sure] INT NOT NULL CONSTRAINT [Mulakat_sure_df] DEFAULT 30,
    [tur] NVARCHAR(1000) NOT NULL CONSTRAINT [Mulakat_tur_df] DEFAULT 'online',
    [baglanti] NVARCHAR(1000) NOT NULL CONSTRAINT [Mulakat_baglanti_df] DEFAULT '',
    [adres] NVARCHAR(1000) NOT NULL CONSTRAINT [Mulakat_adres_df] DEFAULT '',
    [gorusmeci] NVARCHAR(1000) NOT NULL CONSTRAINT [Mulakat_gorusmeci_df] DEFAULT '',
    [aciklama] NVARCHAR(max) NOT NULL CONSTRAINT [Mulakat_aciklama_df] DEFAULT '',
    [sonuc] NVARCHAR(1000) NOT NULL CONSTRAINT [Mulakat_sonuc_df] DEFAULT '',
    [sonucNotu] NVARCHAR(max) NOT NULL CONSTRAINT [Mulakat_sonucNotu_df] DEFAULT '',
    [hatirlatma24SaatGonderildi] BIT NOT NULL CONSTRAINT [Mulakat_hatirlatma24SaatGonderildi_df] DEFAULT 0,
    [hatirlatma1SaatGonderildi] BIT NOT NULL CONSTRAINT [Mulakat_hatirlatma1SaatGonderildi_df] DEFAULT 0,
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [Mulakat_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    [guncelleme] DATETIME2 NOT NULL CONSTRAINT [Mulakat_guncelleme_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Mulakat_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Basvuru_tur_durum_idx] ON [dbo].[Basvuru]([tur], [durum]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Basvuru_olusturma_idx] ON [dbo].[Basvuru]([olusturma]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BasvuruDosya_basvuruId_idx] ON [dbo].[BasvuruDosya]([basvuruId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BasvuruNot_basvuruId_idx] ON [dbo].[BasvuruNot]([basvuruId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Mulakat_basvuruId_aktif_idx] ON [dbo].[Mulakat]([basvuruId], [aktif]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Mulakat_tarih_aktif_idx] ON [dbo].[Mulakat]([tarih], [aktif]);

-- AddForeignKey
ALTER TABLE [dbo].[BasvuruDosya] ADD CONSTRAINT [BasvuruDosya_basvuruId_fkey] FOREIGN KEY ([basvuruId]) REFERENCES [dbo].[Basvuru]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[BasvuruNot] ADD CONSTRAINT [BasvuruNot_basvuruId_fkey] FOREIGN KEY ([basvuruId]) REFERENCES [dbo].[Basvuru]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Mulakat] ADD CONSTRAINT [Mulakat_basvuruId_fkey] FOREIGN KEY ([basvuruId]) REFERENCES [dbo].[Basvuru]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
