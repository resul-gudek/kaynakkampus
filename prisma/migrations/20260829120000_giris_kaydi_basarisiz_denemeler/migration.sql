BEGIN TRY

BEGIN TRAN;

-- kullaniciId nullable olacak: önce ona bağlı index ve FK düşürülür
DROP INDEX [GirisKaydi_kullaniciId_zaman_idx] ON [dbo].[GirisKaydi];
ALTER TABLE [dbo].[GirisKaydi] DROP CONSTRAINT [GirisKaydi_kullaniciId_fkey];

-- AlterColumn: başarısız denemede hesap bulunamamış olabilir
ALTER TABLE [dbo].[GirisKaydi] ALTER COLUMN [kullaniciId] NVARCHAR(1000) NULL;

-- FK ve index geri eklenir
ALTER TABLE [dbo].[GirisKaydi] ADD CONSTRAINT [GirisKaydi_kullaniciId_fkey] FOREIGN KEY ([kullaniciId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
CREATE NONCLUSTERED INDEX [GirisKaydi_kullaniciId_zaman_idx] ON [dbo].[GirisKaydi]([kullaniciId], [zaman]);

-- Yeni kolonlar: başarı durumu, denenen kullanıcı adı, ret nedeni
ALTER TABLE [dbo].[GirisKaydi] ADD
    [basarili] BIT NOT NULL CONSTRAINT [GirisKaydi_basarili_df] DEFAULT 1,
    [denenen] NVARCHAR(1000) NOT NULL CONSTRAINT [GirisKaydi_denenen_df] DEFAULT '',
    [neden] NVARCHAR(1000) NOT NULL CONSTRAINT [GirisKaydi_neden_df] DEFAULT '';

-- Yeni kolona başvuran index aynı batch'te derlenemez (hata 207) → EXEC ile ertelenir
EXEC('CREATE NONCLUSTERED INDEX [GirisKaydi_basarili_zaman_idx] ON [dbo].[GirisKaydi]([basarili], [zaman])');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
