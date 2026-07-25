BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[DersOturumu] ADD [bitis] DATETIME2,
[canliBaslangic] DATETIME2,
[gercekSure] INT,
[hatirlatildi] BIT NOT NULL CONSTRAINT [DersOturumu_hatirlatildi_df] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[MailAyar] ADD [dersHatirlatmaDk] INT NOT NULL CONSTRAINT [MailAyar_dersHatirlatmaDk_df] DEFAULT 15;

-- AlterTable
ALTER TABLE [dbo].[OnlineSinif] ADD [hatirlatmaDk] INT;

-- CreateTable
CREATE TABLE [dbo].[PushAbonelik] (
    [id] NVARCHAR(1000) NOT NULL,
    [kullaniciId] NVARCHAR(1000) NOT NULL,
    [endpoint] NVARCHAR(1000) NOT NULL,
    [p256dh] NVARCHAR(400) NOT NULL,
    [auth] NVARCHAR(400) NOT NULL,
    [tarayici] NVARCHAR(400) NOT NULL CONSTRAINT [PushAbonelik_tarayici_df] DEFAULT '',
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [PushAbonelik_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PushAbonelik_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PushAbonelik_kullaniciId_idx] ON [dbo].[PushAbonelik]([kullaniciId]);

-- AddForeignKey
ALTER TABLE [dbo].[PushAbonelik] ADD CONSTRAINT [PushAbonelik_kullaniciId_fkey] FOREIGN KEY ([kullaniciId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
