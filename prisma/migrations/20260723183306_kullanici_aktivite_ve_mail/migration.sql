BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Kullanici] ADD [sonGorulme] DATETIME2;

-- CreateTable
CREATE TABLE [dbo].[GirisKaydi] (
    [id] NVARCHAR(1000) NOT NULL,
    [kullaniciId] NVARCHAR(1000) NOT NULL,
    [zaman] DATETIME2 NOT NULL CONSTRAINT [GirisKaydi_zaman_df] DEFAULT CURRENT_TIMESTAMP,
    [ip] NVARCHAR(1000) NOT NULL CONSTRAINT [GirisKaydi_ip_df] DEFAULT '',
    [tarayici] NVARCHAR(max) NOT NULL CONSTRAINT [GirisKaydi_tarayici_df] DEFAULT '',
    CONSTRAINT [GirisKaydi_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GirisKaydi_kullaniciId_zaman_idx] ON [dbo].[GirisKaydi]([kullaniciId], [zaman]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GirisKaydi_zaman_idx] ON [dbo].[GirisKaydi]([zaman]);

-- AddForeignKey
ALTER TABLE [dbo].[GirisKaydi] ADD CONSTRAINT [GirisKaydi_kullaniciId_fkey] FOREIGN KEY ([kullaniciId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
