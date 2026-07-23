BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Kullanici] (
    [id] NVARCHAR(1000) NOT NULL,
    [rol] NVARCHAR(1000) NOT NULL,
    [ad] NVARCHAR(1000) NOT NULL,
    [kullanici] NVARCHAR(1000) NOT NULL,
    [sifreHash] NVARCHAR(1000) NOT NULL,
    [aktif] BIT NOT NULL CONSTRAINT [Kullanici_aktif_df] DEFAULT 1,
    [brans] NVARCHAR(1000),
    [sinif] NVARCHAR(1000),
    [hedef] NVARCHAR(1000),
    [kocId] NVARCHAR(1000),
    [telefon] NVARCHAR(1000) NOT NULL CONSTRAINT [Kullanici_telefon_df] DEFAULT '',
    [veliTelefon] NVARCHAR(1000) NOT NULL CONSTRAINT [Kullanici_veliTelefon_df] DEFAULT '',
    [profil] NVARCHAR(max),
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [Kullanici_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Kullanici_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Kullanici_kullanici_key] UNIQUE NONCLUSTERED ([kullanici])
);

-- CreateTable
CREATE TABLE [dbo].[Odev] (
    [id] NVARCHAR(1000) NOT NULL,
    [ogrenciId] NVARCHAR(1000) NOT NULL,
    [kocId] NVARCHAR(1000) NOT NULL,
    [ders] NVARCHAR(1000) NOT NULL,
    [konu] NVARCHAR(1000) NOT NULL,
    [aciklama] NVARCHAR(max) NOT NULL CONSTRAINT [Odev_aciklama_df] DEFAULT '',
    [kaynak] NVARCHAR(1000) NOT NULL CONSTRAINT [Odev_kaynak_df] DEFAULT '',
    [soruSayisi] INT,
    [sonTarih] DATE,
    [durum] NVARCHAR(1000) NOT NULL CONSTRAINT [Odev_durum_df] DEFAULT 'bekliyor',
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [Odev_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Odev_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Takip] (
    [id] NVARCHAR(1000) NOT NULL,
    [ogrenciId] NVARCHAR(1000) NOT NULL,
    [kocId] NVARCHAR(1000) NOT NULL,
    [gun] NVARCHAR(1000) NOT NULL,
    [gorev] NVARCHAR(max) NOT NULL,
    [tamamlandi] BIT NOT NULL CONSTRAINT [Takip_tamamlandi_df] DEFAULT 0,
    CONSTRAINT [Takip_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Deneme] (
    [id] NVARCHAR(1000) NOT NULL,
    [ogrenciId] NVARCHAR(1000) NOT NULL,
    [ad] NVARCHAR(1000) NOT NULL,
    [tur] NVARCHAR(1000) NOT NULL,
    [tarih] DATE NOT NULL,
    [net] FLOAT(53) NOT NULL,
    CONSTRAINT [Deneme_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[DenemeDers] (
    [id] NVARCHAR(1000) NOT NULL,
    [denemeId] NVARCHAR(1000) NOT NULL,
    [ders] NVARCHAR(1000) NOT NULL,
    [dogru] INT NOT NULL,
    [yanlis] INT NOT NULL,
    [bos] INT NOT NULL,
    [net] FLOAT(53) NOT NULL,
    [yanlisKonular] NVARCHAR(max) NOT NULL CONSTRAINT [DenemeDers_yanlisKonular_df] DEFAULT '[]',
    CONSTRAINT [DenemeDers_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[YolAdimi] (
    [id] NVARCHAR(1000) NOT NULL,
    [ogrenciId] NVARCHAR(1000) NOT NULL,
    [kocId] NVARCHAR(1000) NOT NULL,
    [sira] INT NOT NULL,
    [ders] NVARCHAR(1000) NOT NULL,
    [konu] NVARCHAR(1000) NOT NULL,
    [hedef] NVARCHAR(1000) NOT NULL CONSTRAINT [YolAdimi_hedef_df] DEFAULT '',
    [xp] INT NOT NULL CONSTRAINT [YolAdimi_xp_df] DEFAULT 50,
    [tamamlandi] BIT NOT NULL CONSTRAINT [YolAdimi_tamamlandi_df] DEFAULT 0,
    CONSTRAINT [YolAdimi_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [YolAdimi_ogrenciId_sira_key] UNIQUE NONCLUSTERED ([ogrenciId],[sira])
);

-- CreateTable
CREATE TABLE [dbo].[OzelDers] (
    [id] NVARCHAR(1000) NOT NULL,
    [ogrenciId] NVARCHAR(1000) NOT NULL,
    [kocId] NVARCHAR(1000) NOT NULL,
    [ders] NVARCHAR(1000) NOT NULL,
    [konu] NVARCHAR(1000) NOT NULL CONSTRAINT [OzelDers_konu_df] DEFAULT '',
    [tarih] DATE NOT NULL,
    [saat] NVARCHAR(1000) NOT NULL CONSTRAINT [OzelDers_saat_df] DEFAULT '',
    [sure] INT NOT NULL CONSTRAINT [OzelDers_sure_df] DEFAULT 60,
    [ucret] INT NOT NULL CONSTRAINT [OzelDers_ucret_df] DEFAULT 0,
    [odendi] BIT NOT NULL CONSTRAINT [OzelDers_odendi_df] DEFAULT 0,
    [durum] NVARCHAR(1000) NOT NULL CONSTRAINT [OzelDers_durum_df] DEFAULT 'planlandi',
    [olusturan] NVARCHAR(1000) NOT NULL CONSTRAINT [OzelDers_olusturan_df] DEFAULT 'koc',
    [mesaj] NVARCHAR(max) NOT NULL CONSTRAINT [OzelDers_mesaj_df] DEFAULT '',
    [redNotu] NVARCHAR(max) NOT NULL CONSTRAINT [OzelDers_redNotu_df] DEFAULT '',
    [not] NVARCHAR(max) NOT NULL CONSTRAINT [OzelDers_not_df] DEFAULT '',
    [odev] NVARCHAR(max) NOT NULL CONSTRAINT [OzelDers_odev_df] DEFAULT '',
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [OzelDers_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [OzelDers_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Bildirim] (
    [id] NVARCHAR(1000) NOT NULL,
    [aliciId] NVARCHAR(1000) NOT NULL,
    [ikon] NVARCHAR(1000) NOT NULL,
    [metin] NVARCHAR(max) NOT NULL,
    [hedefTur] NVARCHAR(1000),
    [hedefOgrenciId] NVARCHAR(1000),
    [hedefKayitId] NVARCHAR(1000),
    [tarih] DATETIME2 NOT NULL CONSTRAINT [Bildirim_tarih_df] DEFAULT CURRENT_TIMESTAMP,
    [okundu] BIT NOT NULL CONSTRAINT [Bildirim_okundu_df] DEFAULT 0,
    CONSTRAINT [Bildirim_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Odev_ogrenciId_idx] ON [dbo].[Odev]([ogrenciId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Odev_kocId_idx] ON [dbo].[Odev]([kocId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Takip_ogrenciId_idx] ON [dbo].[Takip]([ogrenciId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Deneme_ogrenciId_idx] ON [dbo].[Deneme]([ogrenciId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DenemeDers_denemeId_idx] ON [dbo].[DenemeDers]([denemeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OzelDers_ogrenciId_idx] ON [dbo].[OzelDers]([ogrenciId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OzelDers_kocId_idx] ON [dbo].[OzelDers]([kocId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Bildirim_aliciId_okundu_idx] ON [dbo].[Bildirim]([aliciId], [okundu]);

-- AddForeignKey
ALTER TABLE [dbo].[Kullanici] ADD CONSTRAINT [Kullanici_kocId_fkey] FOREIGN KEY ([kocId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Odev] ADD CONSTRAINT [Odev_ogrenciId_fkey] FOREIGN KEY ([ogrenciId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Odev] ADD CONSTRAINT [Odev_kocId_fkey] FOREIGN KEY ([kocId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Takip] ADD CONSTRAINT [Takip_ogrenciId_fkey] FOREIGN KEY ([ogrenciId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Takip] ADD CONSTRAINT [Takip_kocId_fkey] FOREIGN KEY ([kocId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Deneme] ADD CONSTRAINT [Deneme_ogrenciId_fkey] FOREIGN KEY ([ogrenciId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DenemeDers] ADD CONSTRAINT [DenemeDers_denemeId_fkey] FOREIGN KEY ([denemeId]) REFERENCES [dbo].[Deneme]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[YolAdimi] ADD CONSTRAINT [YolAdimi_ogrenciId_fkey] FOREIGN KEY ([ogrenciId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[YolAdimi] ADD CONSTRAINT [YolAdimi_kocId_fkey] FOREIGN KEY ([kocId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[OzelDers] ADD CONSTRAINT [OzelDers_ogrenciId_fkey] FOREIGN KEY ([ogrenciId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[OzelDers] ADD CONSTRAINT [OzelDers_kocId_fkey] FOREIGN KEY ([kocId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Bildirim] ADD CONSTRAINT [Bildirim_aliciId_fkey] FOREIGN KEY ([aliciId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
