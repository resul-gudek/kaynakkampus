-- Blog modülü: herkese açık yazılar (BlogYazi).
-- Kullanıcı sistemine bağlı değildir; yazar serbest metindir (yazarAd) ve
-- Kullanici tablosuna FK yoktur. Adres `slug` üzerinden kurulur (/blog/<slug>).

BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[BlogYazi] (
    [id] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [baslik] NVARCHAR(1000) NOT NULL,
    [ozet] NVARCHAR(1000) NOT NULL CONSTRAINT [BlogYazi_ozet_df] DEFAULT '',
    [icerik] NVARCHAR(max) NOT NULL CONSTRAINT [BlogYazi_icerik_df] DEFAULT '',
    [kategori] NVARCHAR(1000) NOT NULL,
    [etiketler] NVARCHAR(1000) NOT NULL CONSTRAINT [BlogYazi_etiketler_df] DEFAULT '',
    [seoAciklama] NVARCHAR(1000) NOT NULL CONSTRAINT [BlogYazi_seoAciklama_df] DEFAULT '',
    [yazarAd] NVARCHAR(1000) NOT NULL CONSTRAINT [BlogYazi_yazarAd_df] DEFAULT '',
    [kapakYol] NVARCHAR(1000),
    [kapakTur] NVARCHAR(1000) NOT NULL CONSTRAINT [BlogYazi_kapakTur_df] DEFAULT '',
    [kapakAd] NVARCHAR(1000) NOT NULL CONSTRAINT [BlogYazi_kapakAd_df] DEFAULT '',
    [durum] NVARCHAR(1000) NOT NULL CONSTRAINT [BlogYazi_durum_df] DEFAULT 'taslak',
    [yayinTarihi] DATETIME2,
    [okuma] INT NOT NULL CONSTRAINT [BlogYazi_okuma_df] DEFAULT 0,
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [BlogYazi_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    [guncelleme] DATETIME2 NOT NULL CONSTRAINT [BlogYazi_guncelleme_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [BlogYazi_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [BlogYazi_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BlogYazi_durum_yayinTarihi_idx] ON [dbo].[BlogYazi]([durum], [yayinTarihi]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BlogYazi_kategori_durum_idx] ON [dbo].[BlogYazi]([kategori], [durum]);

-- Enum yerine geçen String alanlar için CHECK constraint'ler
-- (bkz. 20260723172445_check_constraints; asıl doğrulama zod'da)
ALTER TABLE [dbo].[BlogYazi] ADD CONSTRAINT [CK_BlogYazi_durum]
  CHECK ([durum] IN (N'taslak', N'yayinda'));

ALTER TABLE [dbo].[BlogYazi] ADD CONSTRAINT [CK_BlogYazi_kategori]
  CHECK ([kategori] IN (
    N'egitim', N'ogrenci-rehberi', N'ogretmen-rehberi', N'ebeveyn-rehberi',
    N'sinav-ders-calisma', N'egitim-koclugu', N'ozel-ders', N'etkinlik-materyal'
  ));

-- Yayındaki yazının yayın tarihi dolu olmalıdır (liste sıralaması buna dayanır)
ALTER TABLE [dbo].[BlogYazi] ADD CONSTRAINT [CK_BlogYazi_yayinTarihi]
  CHECK ([durum] <> N'yayinda' OR [yayinTarihi] IS NOT NULL);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
