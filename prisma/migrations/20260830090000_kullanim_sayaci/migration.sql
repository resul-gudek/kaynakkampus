BEGIN TRY

BEGIN TRAN;

-- Anonim site kullanım sayaçları (gün + olay + detay başına tek satır).
-- Kişisel veri İÇERMEZ; artırım /api/olay ucundan upsert ile yapılır.
CREATE TABLE [dbo].[KullanimSayaci] (
    [id] INT NOT NULL IDENTITY(1,1),
    [gun] DATE NOT NULL,
    [olay] NVARCHAR(40) NOT NULL,
    [detay] NVARCHAR(120) NOT NULL CONSTRAINT [KullanimSayaci_detay_df] DEFAULT '',
    [sayi] INT NOT NULL CONSTRAINT [KullanimSayaci_sayi_df] DEFAULT 0,
    CONSTRAINT [KullanimSayaci_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [KullanimSayaci_gun_olay_detay_key] UNIQUE NONCLUSTERED ([gun], [olay], [detay])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
