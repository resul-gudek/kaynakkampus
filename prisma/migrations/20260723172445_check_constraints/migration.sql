-- Enum yerine geçen String alanlar için CHECK constraint'ler
-- (Prisma sqlserver enum desteklemediğinden elle eklendi; asıl doğrulama zod'da)

ALTER TABLE [dbo].[Kullanici] ADD CONSTRAINT [CK_Kullanici_rol]
  CHECK ([rol] IN (N'admin', N'koc', N'ogrenci'));

ALTER TABLE [dbo].[Odev] ADD CONSTRAINT [CK_Odev_durum]
  CHECK ([durum] IN (N'bekliyor', N'tamamlandi'));

ALTER TABLE [dbo].[Deneme] ADD CONSTRAINT [CK_Deneme_tur]
  CHECK ([tur] IN (N'TYT', N'AYT', N'LGS', N'Branş'));

ALTER TABLE [dbo].[OzelDers] ADD CONSTRAINT [CK_OzelDers_durum]
  CHECK ([durum] IN (N'talep', N'planlandi', N'yapildi', N'reddedildi', N'iptal'));

ALTER TABLE [dbo].[OzelDers] ADD CONSTRAINT [CK_OzelDers_olusturan]
  CHECK ([olusturan] IN (N'koc', N'ogrenci'));

ALTER TABLE [dbo].[Bildirim] ADD CONSTRAINT [CK_Bildirim_hedefTur]
  CHECK ([hedefTur] IS NULL OR [hedefTur] IN (N'ozel', N'odev'));
