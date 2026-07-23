BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[Bildirim] DROP CONSTRAINT [CK_Bildirim_hedefTur];

ALTER TABLE [dbo].[Bildirim] ADD CONSTRAINT [CK_Bildirim_hedefTur]
  CHECK ([hedefTur] IS NULL OR [hedefTur] IN (N'ozel', N'odev', N'sinif', N'oturum'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
