-- Video ders notları: ders videosu (VideoDers), ekleri (VideoEk), öğrenci/sınıf
-- ataması (VideoAtama), videoya bağlı görevler (VideoGorev) ve öğrenci başına
-- izleme durumu + kişisel not (VideoIzleme).
-- Bildirim.hedefTur'a "video" değeri eklenir (CK constraint güncellenir).

BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[VideoDers] (
    [id] NVARCHAR(1000) NOT NULL,
    [baslik] NVARCHAR(1000) NOT NULL,
    [ders] NVARCHAR(1000) NOT NULL,
    [konu] NVARCHAR(1000) NOT NULL CONSTRAINT [VideoDers_konu_df] DEFAULT '',
    [ogretmenId] NVARCHAR(1000) NOT NULL,
    [olusturanId] NVARCHAR(1000) NOT NULL,
    [aciklama] NVARCHAR(max) NOT NULL CONSTRAINT [VideoDers_aciklama_df] DEFAULT '',
    [islenenKonular] NVARCHAR(max) NOT NULL CONSTRAINT [VideoDers_islenenKonular_df] DEFAULT '',
    [ogretmenNotu] NVARCHAR(max) NOT NULL CONSTRAINT [VideoDers_ogretmenNotu_df] DEFAULT '',
    [tarih] DATE NOT NULL,
    [sure] INT NOT NULL CONSTRAINT [VideoDers_sure_df] DEFAULT 0,
    [kaynakTur] NVARCHAR(1000) NOT NULL CONSTRAINT [VideoDers_kaynakTur_df] DEFAULT 'baglanti',
    [adres] NVARCHAR(1000) NOT NULL CONSTRAINT [VideoDers_adres_df] DEFAULT '',
    [dosyaAd] NVARCHAR(1000) NOT NULL CONSTRAINT [VideoDers_dosyaAd_df] DEFAULT '',
    [dosyaYol] NVARCHAR(1000),
    [dosyaTur] NVARCHAR(1000) NOT NULL CONSTRAINT [VideoDers_dosyaTur_df] DEFAULT '',
    [dosyaBoyut] INT NOT NULL CONSTRAINT [VideoDers_dosyaBoyut_df] DEFAULT 0,
    [kapakYol] NVARCHAR(1000),
    [kapakTur] NVARCHAR(1000) NOT NULL CONSTRAINT [VideoDers_kapakTur_df] DEFAULT '',
    [durum] NVARCHAR(1000) NOT NULL CONSTRAINT [VideoDers_durum_df] DEFAULT 'taslak',
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [VideoDers_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    [guncelleme] DATETIME2 NOT NULL CONSTRAINT [VideoDers_guncelleme_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [VideoDers_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[VideoEk] (
    [id] NVARCHAR(1000) NOT NULL,
    [videoId] NVARCHAR(1000) NOT NULL,
    [ad] NVARCHAR(1000) NOT NULL,
    [yol] NVARCHAR(1000) NOT NULL,
    [tur] NVARCHAR(1000) NOT NULL CONSTRAINT [VideoEk_tur_df] DEFAULT '',
    [boyut] INT NOT NULL CONSTRAINT [VideoEk_boyut_df] DEFAULT 0,
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [VideoEk_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [VideoEk_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[VideoAtama] (
    [id] NVARCHAR(1000) NOT NULL,
    [videoId] NVARCHAR(1000) NOT NULL,
    [ogrenciId] NVARCHAR(1000),
    [sinifId] NVARCHAR(1000),
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [VideoAtama_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [VideoAtama_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[VideoGorev] (
    [id] NVARCHAR(1000) NOT NULL,
    [videoId] NVARCHAR(1000) NOT NULL,
    [sira] INT NOT NULL CONSTRAINT [VideoGorev_sira_df] DEFAULT 0,
    [metin] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [VideoGorev_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[VideoIzleme] (
    [id] NVARCHAR(1000) NOT NULL,
    [videoId] NVARCHAR(1000) NOT NULL,
    [ogrenciId] NVARCHAR(1000) NOT NULL,
    [durum] NVARCHAR(1000) NOT NULL CONSTRAINT [VideoIzleme_durum_df] DEFAULT 'izlenmedi',
    [saniye] INT NOT NULL CONSTRAINT [VideoIzleme_saniye_df] DEFAULT 0,
    [yuzde] INT NOT NULL CONSTRAINT [VideoIzleme_yuzde_df] DEFAULT 0,
    [notlar] NVARCHAR(max) NOT NULL CONSTRAINT [VideoIzleme_notlar_df] DEFAULT '',
    [ilkIzleme] DATETIME2,
    [sonIzleme] DATETIME2,
    [guncelleme] DATETIME2 NOT NULL CONSTRAINT [VideoIzleme_guncelleme_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [VideoIzleme_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [VideoIzleme_videoId_ogrenciId_key] UNIQUE NONCLUSTERED ([videoId],[ogrenciId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [VideoDers_ogretmenId_durum_idx] ON [dbo].[VideoDers]([ogretmenId], [durum]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [VideoDers_durum_tarih_idx] ON [dbo].[VideoDers]([durum], [tarih]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [VideoEk_videoId_idx] ON [dbo].[VideoEk]([videoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [VideoAtama_videoId_idx] ON [dbo].[VideoAtama]([videoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [VideoAtama_ogrenciId_idx] ON [dbo].[VideoAtama]([ogrenciId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [VideoAtama_sinifId_idx] ON [dbo].[VideoAtama]([sinifId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [VideoGorev_videoId_idx] ON [dbo].[VideoGorev]([videoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [VideoIzleme_ogrenciId_idx] ON [dbo].[VideoIzleme]([ogrenciId]);

-- AddForeignKey
ALTER TABLE [dbo].[VideoDers] ADD CONSTRAINT [VideoDers_ogretmenId_fkey] FOREIGN KEY ([ogretmenId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[VideoEk] ADD CONSTRAINT [VideoEk_videoId_fkey] FOREIGN KEY ([videoId]) REFERENCES [dbo].[VideoDers]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[VideoAtama] ADD CONSTRAINT [VideoAtama_videoId_fkey] FOREIGN KEY ([videoId]) REFERENCES [dbo].[VideoDers]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[VideoAtama] ADD CONSTRAINT [VideoAtama_ogrenciId_fkey] FOREIGN KEY ([ogrenciId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[VideoAtama] ADD CONSTRAINT [VideoAtama_sinifId_fkey] FOREIGN KEY ([sinifId]) REFERENCES [dbo].[OnlineSinif]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[VideoGorev] ADD CONSTRAINT [VideoGorev_videoId_fkey] FOREIGN KEY ([videoId]) REFERENCES [dbo].[VideoDers]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[VideoIzleme] ADD CONSTRAINT [VideoIzleme_videoId_fkey] FOREIGN KEY ([videoId]) REFERENCES [dbo].[VideoDers]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[VideoIzleme] ADD CONSTRAINT [VideoIzleme_ogrenciId_fkey] FOREIGN KEY ([ogrenciId]) REFERENCES [dbo].[Kullanici]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Enum yerine geçen String alanlar için CHECK constraint'ler
-- (bkz. 20260723172445_check_constraints; asıl doğrulama zod'da)
ALTER TABLE [dbo].[VideoDers] ADD CONSTRAINT [CK_VideoDers_kaynakTur]
  CHECK ([kaynakTur] IN (N'baglanti', N'dosya'));

ALTER TABLE [dbo].[VideoDers] ADD CONSTRAINT [CK_VideoDers_durum]
  CHECK ([durum] IN (N'taslak', N'yayinda', N'gizli'));

ALTER TABLE [dbo].[VideoIzleme] ADD CONSTRAINT [CK_VideoIzleme_durum]
  CHECK ([durum] IN (N'izlenmedi', N'izleniyor', N'tamamlandi'));

ALTER TABLE [dbo].[VideoIzleme] ADD CONSTRAINT [CK_VideoIzleme_yuzde]
  CHECK ([yuzde] >= 0 AND [yuzde] <= 100);

-- Atama tam olarak bir hedefe yapılır: öğrenci ya da sınıf.
-- T-SQL'de boolean ifade işlenen olamaz ((a IS NULL) <> (b IS NULL) yazılamaz),
-- bu yüzden iki durum açıkça yazılır.
ALTER TABLE [dbo].[VideoAtama] ADD CONSTRAINT [CK_VideoAtama_hedef]
  CHECK (
    ([ogrenciId] IS NOT NULL AND [sinifId] IS NULL)
    OR ([ogrenciId] IS NULL AND [sinifId] IS NOT NULL)
  );

-- Bildirim hedefine video ders eklendi
ALTER TABLE [dbo].[Bildirim] DROP CONSTRAINT [CK_Bildirim_hedefTur];

ALTER TABLE [dbo].[Bildirim] ADD CONSTRAINT [CK_Bildirim_hedefTur]
  CHECK ([hedefTur] IS NULL OR [hedefTur] IN (N'ozel', N'odev', N'sinif', N'oturum', N'test', N'video'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
