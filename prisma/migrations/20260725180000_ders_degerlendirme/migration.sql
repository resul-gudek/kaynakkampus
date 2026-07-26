BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[DersDegerlendirme] (
    [id] NVARCHAR(1000) NOT NULL,
    [ozelDersId] NVARCHAR(1000) NOT NULL,
    [yon] NVARCHAR(1000) NOT NULL,
    [yazarId] NVARCHAR(1000) NOT NULL,
    [hedefId] NVARCHAR(1000) NOT NULL,
    [puan] INT NOT NULL CONSTRAINT [DersDegerlendirme_puan_df] DEFAULT 0,
    [veri] NVARCHAR(max) NOT NULL,
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [DersDegerlendirme_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    [guncelleme] DATETIME2 NOT NULL CONSTRAINT [DersDegerlendirme_guncelleme_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DersDegerlendirme_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DersDegerlendirme_ozelDersId_yon_key] UNIQUE NONCLUSTERED ([ozelDersId],[yon])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DersDegerlendirme_hedefId_idx] ON [dbo].[DersDegerlendirme]([hedefId]);

-- AddForeignKey
ALTER TABLE [dbo].[DersDegerlendirme] ADD CONSTRAINT [DersDegerlendirme_ozelDersId_fkey] FOREIGN KEY ([ozelDersId]) REFERENCES [dbo].[OzelDers]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- Enum yerine geçen String/Int alanlar için CHECK constraint'ler
-- (Prisma sqlserver enum desteklemediğinden elle eklendi; asıl doğrulama zod'da)
ALTER TABLE [dbo].[DersDegerlendirme] ADD CONSTRAINT [CK_DersDegerlendirme_yon]
  CHECK ([yon] IN (N'kocOgrenci', N'ogrenciKoc'));

ALTER TABLE [dbo].[DersDegerlendirme] ADD CONSTRAINT [CK_DersDegerlendirme_puan]
  CHECK ([puan] >= 0 AND [puan] <= 5);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
