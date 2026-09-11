-- Panelden elle bildirim gönderimi (veli / öğrenci / öğretmen duyuruları).
--
-- 1) BildirimGonderim: yönetici ya da eğitmenin tek bir gönderim işlemi
--    (kim, ne, kime, kaç alıcı). Alıcı başına Bildirim satırı ayrıca yazılır.
-- 2) Bildirim.gonderimId: satırı gönderime bağlar (okunma oranı için).
-- 3) hedefTur ve tercih türüne "duyuru" eklenir. Veli de artık bildirim
--    alabildiği için tercih ekranı veliye de açılır (kod tarafında).

BEGIN TRY

BEGIN TRAN;

-- ── BildirimGonderim ────────────────────────────────────────
CREATE TABLE [dbo].[BildirimGonderim] (
    [id] NVARCHAR(1000) NOT NULL,
    [gonderenId] NVARCHAR(1000) NOT NULL,
    [ikon] NVARCHAR(1000) NOT NULL,
    [metin] NVARCHAR(max) NOT NULL,
    [hedefOzet] NVARCHAR(1000) NOT NULL CONSTRAINT [BildirimGonderim_hedefOzet_df] DEFAULT '',
    [aliciSayisi] INT NOT NULL CONSTRAINT [BildirimGonderim_aliciSayisi_df] DEFAULT 0,
    [tarih] DATETIME2 NOT NULL CONSTRAINT [BildirimGonderim_tarih_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [BildirimGonderim_pkey] PRIMARY KEY CLUSTERED ([id])
);

ALTER TABLE [dbo].[BildirimGonderim] ADD CONSTRAINT [BildirimGonderim_gonderenId_fkey]
  FOREIGN KEY ([gonderenId]) REFERENCES [dbo].[Kullanici]([id])
  ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE NONCLUSTERED INDEX [BildirimGonderim_gonderenId_tarih_idx]
  ON [dbo].[BildirimGonderim]([gonderenId], [tarih]);

-- ── Bildirim.gonderimId ─────────────────────────────────────
ALTER TABLE [dbo].[Bildirim] ADD [gonderimId] NVARCHAR(1000) NULL;

-- Yeni kolona aynı batch içinde başvuran ifadeler EXEC ile ertelenir
-- (bkz. 20260806140000 — "Invalid column name" tuzağı).
EXEC('ALTER TABLE [dbo].[Bildirim] ADD CONSTRAINT [Bildirim_gonderimId_fkey]
        FOREIGN KEY ([gonderimId]) REFERENCES [dbo].[BildirimGonderim]([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION');

EXEC('CREATE NONCLUSTERED INDEX [Bildirim_gonderimId_idx]
        ON [dbo].[Bildirim]([gonderimId])');

-- ── hedefTur / tercih türüne "duyuru" ───────────────────────
ALTER TABLE [dbo].[Bildirim] DROP CONSTRAINT [CK_Bildirim_hedefTur];

ALTER TABLE [dbo].[Bildirim] ADD CONSTRAINT [CK_Bildirim_hedefTur]
  CHECK ([hedefTur] IS NULL OR [hedefTur] IN (N'ozel', N'odev', N'sinif', N'oturum', N'test', N'video', N'duyuru'));

ALTER TABLE [dbo].[BildirimTercih] DROP CONSTRAINT [CK_BildirimTercih_tur];

ALTER TABLE [dbo].[BildirimTercih] ADD CONSTRAINT [CK_BildirimTercih_tur]
  CHECK ([tur] IN (N'odev', N'oturum', N'sinif', N'ozel', N'test', N'video', N'duyuru', N'genel'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
