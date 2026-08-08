-- Ödemeler modülü — tek tablo, iki bacak (öğrenci tahsilatı / öğretmen ödemesi).
--
-- Platformda kalan tutar KOLON DEĞİLDİR: ogrenciTutar - kocTutar olarak
-- hesaplanır (lib/odeme.ts platformPayi). Böylece üç değer birbirinden
-- ayrışamaz.
--
-- Prisma sqlserver enum desteklemediği için durum/yöntem alanları String'dir;
-- zod (lib/dogrulama.ts OdemeSemasi) + aşağıdaki CHECK'lerle doğrulanır
-- (bkz. 20260723172445_check_constraints).
--
-- Kullanici'ye iki FK vardır ve ikisi de NO ACTION: SQL Server aynı tabloya
-- birden çok cascade yolunu kabul etmez. Öğretmen hesabı silindiğinde ödeme
-- satırı SİLİNMEZ, kocId NULL'a çekilir (actions/admin.ts kocSil) — öğrencinin
-- ödeme geçmişi ve platform cirosu korunur.

BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[Odeme] (
    [id] NVARCHAR(1000) NOT NULL,
    [ogrenciId] NVARCHAR(1000) NOT NULL,
    [kocId] NVARCHAR(1000),
    [aciklama] NVARCHAR(1000) NOT NULL CONSTRAINT [Odeme_aciklama_df] DEFAULT '',
    [tarih] DATE NOT NULL,
    [ogrenciTutar] INT NOT NULL CONSTRAINT [Odeme_ogrenciTutar_df] DEFAULT 0,
    [ogrenciDurum] NVARCHAR(1000) NOT NULL CONSTRAINT [Odeme_ogrenciDurum_df] DEFAULT 'bekliyor',
    [ogrenciOdemeTarihi] DATE,
    [yontem] NVARCHAR(1000) NOT NULL CONSTRAINT [Odeme_yontem_df] DEFAULT '',
    [kocTutar] INT NOT NULL CONSTRAINT [Odeme_kocTutar_df] DEFAULT 0,
    [kocDurum] NVARCHAR(1000) NOT NULL CONSTRAINT [Odeme_kocDurum_df] DEFAULT 'bekliyor',
    [kocOdemeTarihi] DATE,
    [yoneticiNotu] NVARCHAR(max) NOT NULL CONSTRAINT [Odeme_yoneticiNotu_df] DEFAULT '',
    [olusturma] DATETIME2 NOT NULL CONSTRAINT [Odeme_olusturma_df] DEFAULT CURRENT_TIMESTAMP,
    [guncelleme] DATETIME2 NOT NULL CONSTRAINT [Odeme_guncelleme_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Odeme_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE NONCLUSTERED INDEX [Odeme_ogrenciId_tarih_idx] ON [dbo].[Odeme]([ogrenciId], [tarih]);
CREATE NONCLUSTERED INDEX [Odeme_kocId_kocDurum_idx] ON [dbo].[Odeme]([kocId], [kocDurum]);
CREATE NONCLUSTERED INDEX [Odeme_ogrenciDurum_tarih_idx] ON [dbo].[Odeme]([ogrenciDurum], [tarih]);

ALTER TABLE [dbo].[Odeme] ADD CONSTRAINT [Odeme_ogrenciId_fkey]
  FOREIGN KEY ([ogrenciId]) REFERENCES [dbo].[Kullanici]([id])
  ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[Odeme] ADD CONSTRAINT [Odeme_kocId_fkey]
  FOREIGN KEY ([kocId]) REFERENCES [dbo].[Kullanici]([id])
  ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ── Durum / yöntem sözlükleri ───────────────────────────────
ALTER TABLE [dbo].[Odeme] ADD CONSTRAINT [CK_Odeme_ogrenciDurum]
  CHECK ([ogrenciDurum] IN (N'bekliyor', N'odendi', N'iptal'));

ALTER TABLE [dbo].[Odeme] ADD CONSTRAINT [CK_Odeme_kocDurum]
  CHECK ([kocDurum] IN (N'bekliyor', N'hazirlaniyor', N'odendi'));

ALTER TABLE [dbo].[Odeme] ADD CONSTRAINT [CK_Odeme_yontem]
  CHECK ([yontem] IN (N'', N'havale', N'kart', N'nakit', N'diger'));

-- ── Finansal tutarlılık ─────────────────────────────────────
-- Öğretmen payı öğrenci tutarını aşarsa platform payı eksiye düşer.
ALTER TABLE [dbo].[Odeme] ADD CONSTRAINT [CK_Odeme_tutarlar]
  CHECK ([ogrenciTutar] >= 0 AND [kocTutar] >= 0 AND [kocTutar] <= [ogrenciTutar]);

-- Öğretmeni olmayan kalemde öğretmen payı olamaz (kimseye ödenmeyecek borç).
ALTER TABLE [dbo].[Odeme] ADD CONSTRAINT [CK_Odeme_kocPayi]
  CHECK ([kocId] IS NOT NULL OR [kocTutar] = 0);

-- Ödeme tarihi yalnız "odendi" durumunda dolu olur; durum geri alınırsa
-- temizlenir (actions/odeme.ts damgalar) — "ödendi ama tarihsiz" kalmasın.
ALTER TABLE [dbo].[Odeme] ADD CONSTRAINT [CK_Odeme_ogrenciOdemeTarihi]
  CHECK (([ogrenciDurum] = N'odendi' AND [ogrenciOdemeTarihi] IS NOT NULL)
      OR ([ogrenciDurum] <> N'odendi' AND [ogrenciOdemeTarihi] IS NULL));

ALTER TABLE [dbo].[Odeme] ADD CONSTRAINT [CK_Odeme_kocOdemeTarihi]
  CHECK (([kocDurum] = N'odendi' AND [kocOdemeTarihi] IS NOT NULL)
      OR ([kocDurum] <> N'odendi' AND [kocOdemeTarihi] IS NULL));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
