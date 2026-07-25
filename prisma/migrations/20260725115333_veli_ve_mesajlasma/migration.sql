BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Kullanici] ADD [veliId] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[MailAyar] ADD [veliRaporAktif] BIT NOT NULL CONSTRAINT [MailAyar_veliRaporAktif_df] DEFAULT 0;

-- CreateTable
CREATE TABLE [dbo].[Mesaj] (
    [id] NVARCHAR(1000) NOT NULL,
    [gonderenId] NVARCHAR(1000) NOT NULL,
    [aliciId] NVARCHAR(1000) NOT NULL,
    [govde] NVARCHAR(max) NOT NULL,
    [okundu] BIT NOT NULL CONSTRAINT [Mesaj_okundu_df] DEFAULT 0,
    [tarih] DATETIME2 NOT NULL CONSTRAINT [Mesaj_tarih_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Mesaj_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Mesaj_aliciId_okundu_idx] ON [dbo].[Mesaj]([aliciId], [okundu]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Mesaj_gonderenId_aliciId_tarih_idx] ON [dbo].[Mesaj]([gonderenId], [aliciId], [tarih]);

-- AddForeignKey
ALTER TABLE [dbo].[Kullanici] ADD CONSTRAINT [Kullanici_veliId_fkey] FOREIGN KEY ([veliId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Mesaj] ADD CONSTRAINT [Mesaj_gonderenId_fkey] FOREIGN KEY ([gonderenId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Mesaj] ADD CONSTRAINT [Mesaj_aliciId_fkey] FOREIGN KEY ([aliciId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
