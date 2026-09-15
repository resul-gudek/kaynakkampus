-- Eğitim Başvurusu: sitedeki özel ders / eğitim koçluğu başvuru formları.
-- Ön mülakat sisteminden (Basvuru) ve panellerden bağımsız tek tablo;
-- formun tamamı `veri` (JSON) içinde, liste/filtre alanları gerçek kolon.

BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[EgitimBasvurusu] (
    [id] NVARCHAR(1000) NOT NULL,
    [tur] NVARCHAR(1000) NOT NULL,
    [durum] NVARCHAR(1000) NOT NULL CONSTRAINT [EgitimBasvurusu_durum_df] DEFAULT 'yeni',
    [ogrenciAd] NVARCHAR(1000) NOT NULL,
    [yas] INT NOT NULL,
    [sinif] NVARCHAR(1000) NOT NULL,
    [egitim] NVARCHAR(1000) NOT NULL CONSTRAINT [EgitimBasvurusu_egitim_df] DEFAULT '',
    [basvuran] NVARCHAR(1000) NOT NULL,
    [iletisimAd] NVARCHAR(1000) NOT NULL,
    [telefon] NVARCHAR(1000) NOT NULL,
    [eposta] NVARCHAR(1000) NOT NULL,
    [veri] NVARCHAR(max) NOT NULL,
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [EgitimBasvurusu_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    [guncelleme] DATETIME2 NOT NULL CONSTRAINT [EgitimBasvurusu_guncelleme_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [EgitimBasvurusu_pkey] PRIMARY KEY CLUSTERED ([id])
);

ALTER TABLE [dbo].[EgitimBasvurusu] ADD CONSTRAINT [CK_EgitimBasvurusu_tur]
  CHECK ([tur] IN (N'ozel_ders', N'egitim_koclugu'));

ALTER TABLE [dbo].[EgitimBasvurusu] ADD CONSTRAINT [CK_EgitimBasvurusu_durum]
  CHECK ([durum] IN (N'yeni', N'iletisime_gecildi', N'gorusme_yapildi', N'kayit_oldu', N'uygun_degil'));

ALTER TABLE [dbo].[EgitimBasvurusu] ADD CONSTRAINT [CK_EgitimBasvurusu_basvuran]
  CHECK ([basvuran] IN (N'veli', N'ogrenci'));

CREATE NONCLUSTERED INDEX [EgitimBasvurusu_tur_durum_idx]
  ON [dbo].[EgitimBasvurusu]([tur], [durum]);

CREATE NONCLUSTERED INDEX [EgitimBasvurusu_olusturma_idx]
  ON [dbo].[EgitimBasvurusu]([olusturma]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
