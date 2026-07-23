BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[OnlineSinif] (
    [id] NVARCHAR(1000) NOT NULL,
    [ogretmenId] NVARCHAR(1000) NOT NULL,
    [ad] NVARCHAR(1000) NOT NULL,
    [ders] NVARCHAR(1000) NOT NULL,
    [seviye] NVARCHAR(1000) NOT NULL CONSTRAINT [OnlineSinif_seviye_df] DEFAULT '',
    [aciklama] NVARCHAR(max) NOT NULL CONSTRAINT [OnlineSinif_aciklama_df] DEFAULT '',
    [kapasite] INT NOT NULL CONSTRAINT [OnlineSinif_kapasite_df] DEFAULT 20,
    [aktif] BIT NOT NULL CONSTRAINT [OnlineSinif_aktif_df] DEFAULT 1,
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [OnlineSinif_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [OnlineSinif_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [OnlineSinif_kapasite_check] CHECK ([kapasite] >= 1 AND [kapasite] <= 100)
);

CREATE TABLE [dbo].[OnlineSinifUye] (
    [id] NVARCHAR(1000) NOT NULL,
    [sinifId] NVARCHAR(1000) NOT NULL,
    [kullaniciId] NVARCHAR(1000) NOT NULL,
    [katilma] DATETIME2 NOT NULL CONSTRAINT [OnlineSinifUye_katilma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [OnlineSinifUye_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE TABLE [dbo].[DersOturumu] (
    [id] NVARCHAR(1000) NOT NULL,
    [sinifId] NVARCHAR(1000),
    [ozelDersId] NVARCHAR(1000),
    [baslik] NVARCHAR(1000) NOT NULL,
    [konu] NVARCHAR(1000) NOT NULL CONSTRAINT [DersOturumu_konu_df] DEFAULT '',
    [baslangic] DATETIME2 NOT NULL,
    [sure] INT NOT NULL CONSTRAINT [DersOturumu_sure_df] DEFAULT 60,
    [durum] NVARCHAR(1000) NOT NULL CONSTRAINT [DersOturumu_durum_df] DEFAULT 'planlandi',
    [saglayici] NVARCHAR(1000) NOT NULL CONSTRAINT [DersOturumu_saglayici_df] DEFAULT 'bigbluebutton',
    [saglayiciOdaId] NVARCHAR(1000) NOT NULL,
    [kayitEtkin] BIT NOT NULL CONSTRAINT [DersOturumu_kayitEtkin_df] DEFAULT 0,
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [DersOturumu_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DersOturumu_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DersOturumu_kaynak_check] CHECK (
        ([sinifId] IS NOT NULL AND [ozelDersId] IS NULL) OR
        ([sinifId] IS NULL AND [ozelDersId] IS NOT NULL)
    ),
    CONSTRAINT [DersOturumu_sure_check] CHECK ([sure] >= 15 AND [sure] <= 480),
    CONSTRAINT [DersOturumu_durum_check] CHECK ([durum] IN ('planlandi', 'canli', 'tamamlandi', 'iptal')),
    CONSTRAINT [DersOturumu_kayit_check] CHECK ([kayitEtkin] = 0)
);

CREATE TABLE [dbo].[DersKatilim] (
    [id] NVARCHAR(1000) NOT NULL,
    [oturumId] NVARCHAR(1000) NOT NULL,
    [kullaniciId] NVARCHAR(1000) NOT NULL,
    [ilkKatilma] DATETIME2,
    [sonAyrilma] DATETIME2,
    [toplamSure] INT NOT NULL CONSTRAINT [DersKatilim_toplamSure_df] DEFAULT 0,
    [durum] NVARCHAR(1000) NOT NULL CONSTRAINT [DersKatilim_durum_df] DEFAULT 'bekleniyor',
    CONSTRAINT [DersKatilim_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DersKatilim_durum_check] CHECK ([durum] IN ('bekleniyor', 'katildi', 'katilmadi')),
    CONSTRAINT [DersKatilim_toplamSure_check] CHECK ([toplamSure] >= 0)
);

CREATE TABLE [dbo].[DersMateryal] (
    [id] NVARCHAR(1000) NOT NULL,
    [oturumId] NVARCHAR(1000) NOT NULL,
    [ad] NVARCHAR(1000) NOT NULL,
    [adres] NVARCHAR(max) NOT NULL,
    [tur] NVARCHAR(1000) NOT NULL CONSTRAINT [DersMateryal_tur_df] DEFAULT 'baglanti',
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [DersMateryal_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DersMateryal_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE TABLE [dbo].[DersKaydi] (
    [id] NVARCHAR(1000) NOT NULL,
    [oturumId] NVARCHAR(1000) NOT NULL,
    [saglayiciId] NVARCHAR(1000) NOT NULL CONSTRAINT [DersKaydi_saglayiciId_df] DEFAULT '',
    [adres] NVARCHAR(max) NOT NULL CONSTRAINT [DersKaydi_adres_df] DEFAULT '',
    [sure] INT NOT NULL CONSTRAINT [DersKaydi_sure_df] DEFAULT 0,
    [durum] NVARCHAR(1000) NOT NULL CONSTRAINT [DersKaydi_durum_df] DEFAULT 'hazirlaniyor',
    [saklamaSonu] DATETIME2,
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [DersKaydi_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DersKaydi_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE NONCLUSTERED INDEX [OnlineSinif_ogretmenId_aktif_idx] ON [dbo].[OnlineSinif]([ogretmenId], [aktif]);
CREATE UNIQUE NONCLUSTERED INDEX [OnlineSinifUye_sinifId_kullaniciId_key] ON [dbo].[OnlineSinifUye]([sinifId], [kullaniciId]);
CREATE NONCLUSTERED INDEX [OnlineSinifUye_kullaniciId_idx] ON [dbo].[OnlineSinifUye]([kullaniciId]);
CREATE UNIQUE NONCLUSTERED INDEX [DersOturumu_saglayiciOdaId_key] ON [dbo].[DersOturumu]([saglayiciOdaId]);
CREATE NONCLUSTERED INDEX [DersOturumu_sinifId_baslangic_idx] ON [dbo].[DersOturumu]([sinifId], [baslangic]);
CREATE NONCLUSTERED INDEX [DersOturumu_ozelDersId_idx] ON [dbo].[DersOturumu]([ozelDersId]);
CREATE NONCLUSTERED INDEX [DersOturumu_baslangic_durum_idx] ON [dbo].[DersOturumu]([baslangic], [durum]);
CREATE UNIQUE NONCLUSTERED INDEX [DersKatilim_oturumId_kullaniciId_key] ON [dbo].[DersKatilim]([oturumId], [kullaniciId]);
CREATE NONCLUSTERED INDEX [DersKatilim_kullaniciId_idx] ON [dbo].[DersKatilim]([kullaniciId]);
CREATE NONCLUSTERED INDEX [DersMateryal_oturumId_idx] ON [dbo].[DersMateryal]([oturumId]);
CREATE NONCLUSTERED INDEX [DersKaydi_oturumId_idx] ON [dbo].[DersKaydi]([oturumId]);

ALTER TABLE [dbo].[OnlineSinif] ADD CONSTRAINT [OnlineSinif_ogretmenId_fkey]
    FOREIGN KEY ([ogretmenId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[OnlineSinifUye] ADD CONSTRAINT [OnlineSinifUye_sinifId_fkey]
    FOREIGN KEY ([sinifId]) REFERENCES [dbo].[OnlineSinif]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[OnlineSinifUye] ADD CONSTRAINT [OnlineSinifUye_kullaniciId_fkey]
    FOREIGN KEY ([kullaniciId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[DersOturumu] ADD CONSTRAINT [DersOturumu_sinifId_fkey]
    FOREIGN KEY ([sinifId]) REFERENCES [dbo].[OnlineSinif]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[DersOturumu] ADD CONSTRAINT [DersOturumu_ozelDersId_fkey]
    FOREIGN KEY ([ozelDersId]) REFERENCES [dbo].[OzelDers]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[DersKatilim] ADD CONSTRAINT [DersKatilim_oturumId_fkey]
    FOREIGN KEY ([oturumId]) REFERENCES [dbo].[DersOturumu]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[DersKatilim] ADD CONSTRAINT [DersKatilim_kullaniciId_fkey]
    FOREIGN KEY ([kullaniciId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[DersMateryal] ADD CONSTRAINT [DersMateryal_oturumId_fkey]
    FOREIGN KEY ([oturumId]) REFERENCES [dbo].[DersOturumu]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[DersKaydi] ADD CONSTRAINT [DersKaydi_oturumId_fkey]
    FOREIGN KEY ([oturumId]) REFERENCES [dbo].[DersOturumu]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
