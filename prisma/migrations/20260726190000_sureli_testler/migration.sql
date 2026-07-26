-- Süreli testler: test bankası (SureliTest + SureliTestSoru),
-- öğrenciye atama (SureliTestAtama) ve çözüm denemesi (SureliTestOturum).
-- Bildirim.hedefTur'a "test" değeri eklenir (CK constraint güncellenir).

BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[SureliTest] (
    [id] NVARCHAR(1000) NOT NULL,
    [kocId] NVARCHAR(1000) NOT NULL,
    [ad] NVARCHAR(1000) NOT NULL,
    [ders] NVARCHAR(1000) NOT NULL,
    [konu] NVARCHAR(1000) NOT NULL CONSTRAINT [SureliTest_konu_df] DEFAULT '',
    [seviye] NVARCHAR(1000) NOT NULL CONSTRAINT [SureliTest_seviye_df] DEFAULT '',
    [soruSayisi] INT NOT NULL,
    [sure] INT NOT NULL,
    [aktif] BIT NOT NULL CONSTRAINT [SureliTest_aktif_df] DEFAULT 1,
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [SureliTest_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [SureliTest_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SureliTestSoru] (
    [id] NVARCHAR(1000) NOT NULL,
    [testId] NVARCHAR(1000) NOT NULL,
    [sira] INT NOT NULL,
    [metin] NVARCHAR(max) NOT NULL,
    [secenekler] NVARCHAR(max) NOT NULL CONSTRAINT [SureliTestSoru_secenekler_df] DEFAULT '[]',
    [dogru] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [SureliTestSoru_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [SureliTestSoru_testId_sira_key] UNIQUE NONCLUSTERED ([testId],[sira])
);

-- CreateTable
CREATE TABLE [dbo].[SureliTestAtama] (
    [id] NVARCHAR(1000) NOT NULL,
    [testId] NVARCHAR(1000) NOT NULL,
    [ogrenciId] NVARCHAR(1000) NOT NULL,
    [sonTarih] DATE,
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [SureliTestAtama_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [SureliTestAtama_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [SureliTestAtama_testId_ogrenciId_key] UNIQUE NONCLUSTERED ([testId],[ogrenciId])
);

-- CreateTable
CREATE TABLE [dbo].[SureliTestOturum] (
    [id] NVARCHAR(1000) NOT NULL,
    [testId] NVARCHAR(1000) NOT NULL,
    [ogrenciId] NVARCHAR(1000) NOT NULL,
    [baslangic] DATETIME2 NOT NULL CONSTRAINT [SureliTestOturum_baslangic_df] DEFAULT CURRENT_TIMESTAMP,
    [bitisSiniri] DATETIME2 NOT NULL,
    [bitis] DATETIME2,
    [gecenSure] INT,
    [durum] NVARCHAR(1000) NOT NULL CONSTRAINT [SureliTestOturum_durum_df] DEFAULT 'basladi',
    [dogru] INT NOT NULL CONSTRAINT [SureliTestOturum_dogru_df] DEFAULT 0,
    [yanlis] INT NOT NULL CONSTRAINT [SureliTestOturum_yanlis_df] DEFAULT 0,
    [bos] INT NOT NULL CONSTRAINT [SureliTestOturum_bos_df] DEFAULT 0,
    [yuzde] INT NOT NULL CONSTRAINT [SureliTestOturum_yuzde_df] DEFAULT 0,
    [cevaplar] NVARCHAR(max) NOT NULL CONSTRAINT [SureliTestOturum_cevaplar_df] DEFAULT '{}',
    CONSTRAINT [SureliTestOturum_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SureliTest_kocId_aktif_idx] ON [dbo].[SureliTest]([kocId], [aktif]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SureliTestAtama_ogrenciId_idx] ON [dbo].[SureliTestAtama]([ogrenciId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SureliTestOturum_ogrenciId_durum_idx] ON [dbo].[SureliTestOturum]([ogrenciId], [durum]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SureliTestOturum_testId_idx] ON [dbo].[SureliTestOturum]([testId]);

-- AddForeignKey
ALTER TABLE [dbo].[SureliTest] ADD CONSTRAINT [SureliTest_kocId_fkey] FOREIGN KEY ([kocId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SureliTestSoru] ADD CONSTRAINT [SureliTestSoru_testId_fkey] FOREIGN KEY ([testId]) REFERENCES [dbo].[SureliTest]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[SureliTestAtama] ADD CONSTRAINT [SureliTestAtama_testId_fkey] FOREIGN KEY ([testId]) REFERENCES [dbo].[SureliTest]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[SureliTestAtama] ADD CONSTRAINT [SureliTestAtama_ogrenciId_fkey] FOREIGN KEY ([ogrenciId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SureliTestOturum] ADD CONSTRAINT [SureliTestOturum_testId_fkey] FOREIGN KEY ([testId]) REFERENCES [dbo].[SureliTest]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[SureliTestOturum] ADD CONSTRAINT [SureliTestOturum_ogrenciId_fkey] FOREIGN KEY ([ogrenciId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Enum yerine geçen String alanlar için CHECK constraint'ler
-- (bkz. 20260723172445_check_constraints; asıl doğrulama zod'da)
ALTER TABLE [dbo].[SureliTestSoru] ADD CONSTRAINT [CK_SureliTestSoru_dogru]
  CHECK ([dogru] IN (N'A', N'B', N'C', N'D', N'E'));

ALTER TABLE [dbo].[SureliTestOturum] ADD CONSTRAINT [CK_SureliTestOturum_durum]
  CHECK ([durum] IN (N'basladi', N'tamamlandi', N'sureDoldu'));

-- Bildirim hedefine süreli test eklendi
ALTER TABLE [dbo].[Bildirim] DROP CONSTRAINT [CK_Bildirim_hedefTur];

ALTER TABLE [dbo].[Bildirim] ADD CONSTRAINT [CK_Bildirim_hedefTur]
  CHECK ([hedefTur] IS NULL OR [hedefTur] IN (N'ozel', N'odev', N'sinif', N'oturum', N'test'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
