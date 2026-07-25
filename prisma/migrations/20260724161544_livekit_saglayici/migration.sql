BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[DersOturumu] DROP CONSTRAINT [DersOturumu_saglayici_df];
ALTER TABLE [dbo].[DersOturumu] ADD CONSTRAINT [DersOturumu_saglayici_df] DEFAULT 'livekit' FOR [saglayici];

-- Mevcut oturumlar yeni sağlayıcıya taşınır (BBB kaldırıldı)
UPDATE [dbo].[DersOturumu] SET [saglayici] = 'livekit' WHERE [saglayici] = 'bigbluebutton';

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
