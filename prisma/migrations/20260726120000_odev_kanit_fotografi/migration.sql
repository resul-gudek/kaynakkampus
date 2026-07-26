BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[OdevKanit] (
    [id] NVARCHAR(1000) NOT NULL,
    [odevId] NVARCHAR(1000) NOT NULL,
    [ad] NVARCHAR(1000) NOT NULL,
    [yol] NVARCHAR(1000) NOT NULL,
    [tur] NVARCHAR(1000) NOT NULL CONSTRAINT [OdevKanit_tur_df] DEFAULT '',
    [boyut] INT NOT NULL CONSTRAINT [OdevKanit_boyut_df] DEFAULT 0,
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [OdevKanit_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [OdevKanit_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OdevKanit_odevId_idx] ON [dbo].[OdevKanit]([odevId]);

-- AddForeignKey
ALTER TABLE [dbo].[OdevKanit] ADD CONSTRAINT [OdevKanit_odevId_fkey] FOREIGN KEY ([odevId]) REFERENCES [dbo].[Odev]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
