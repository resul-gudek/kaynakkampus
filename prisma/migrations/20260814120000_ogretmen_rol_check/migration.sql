-- 'ogretmen' rolü eklendi; Kullanici.rol CHECK constraint'i güncellenir.
-- Öğretmen, eğitim koçundan (koc) AYRI bir roldür; yönetici panelinde ayrı
-- listelenir/sayılır. (Prisma sqlserver enum desteklemediğinden rol String +
-- elle CHECK; bkz. 20260723172445_check_constraints, 20260725120000_veli_rol_check)

BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[Kullanici] DROP CONSTRAINT [CK_Kullanici_rol];

ALTER TABLE [dbo].[Kullanici] ADD CONSTRAINT [CK_Kullanici_rol]
  CHECK ([rol] IN (N'admin', N'koc', N'ogretmen', N'ogrenci', N'veli'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
