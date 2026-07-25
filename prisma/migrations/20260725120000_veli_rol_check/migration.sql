-- 'veli' rolü eklendi; Kullanici.rol CHECK constraint'i güncellenir.
-- (Prisma sqlserver enum desteklemediğinden rol String + elle CHECK; bkz. 20260723172445_check_constraints)

BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[Kullanici] DROP CONSTRAINT [CK_Kullanici_rol];

ALTER TABLE [dbo].[Kullanici] ADD CONSTRAINT [CK_Kullanici_rol]
  CHECK ([rol] IN (N'admin', N'koc', N'ogrenci', N'veli'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
