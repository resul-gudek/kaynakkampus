-- Enum yerine geçen String alanlar için CHECK constraint'ler
-- (Prisma sqlserver enum desteklemediğinden elle eklendi; asıl doğrulama zod'da)

ALTER TABLE [dbo].[Basvuru] ADD CONSTRAINT [CK_Basvuru_tur]
  CHECK ([tur] IN (N'ogretmen', N'ogrenci', N'koc'));

ALTER TABLE [dbo].[Basvuru] ADD CONSTRAINT [CK_Basvuru_durum]
  CHECK ([durum] IN (N'yeni', N'inceleniyor', N'ek_bilgi', N'mulakata_uygun', N'mulakat_planlandi', N'mulakat_tamamlandi', N'olumlu', N'olumsuz'));

ALTER TABLE [dbo].[Mulakat] ADD CONSTRAINT [CK_Mulakat_tur]
  CHECK ([tur] IN (N'online', N'telefon', N'yuzyuze'));

ALTER TABLE [dbo].[Mulakat] ADD CONSTRAINT [CK_Mulakat_sonuc]
  CHECK ([sonuc] IN (N'', N'yapildi', N'katilmadi', N'yeniden', N'olumlu', N'olumsuz', N'beklemede'));
