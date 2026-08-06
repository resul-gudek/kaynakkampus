-- Kullanıcının kendi bildirim tercihleri + push'un kuyruk üzerinden gönderimi.
--
-- 1) Bildirim.pushDurum: bildirim transaction içinde yazılır, cihaz push'u
--    commit sonrası mail işleyicisi turunda gönderilir (lib/push-kuyruk.ts).
--    MEVCUT satırlar 'atlandi' işaretlenir — aksi halde bu migration'dan sonra
--    ilk turda tüm geçmiş bildirimler cihazlara yağardı.
-- 2) BildirimTercih: satır yoksa tür AÇIK sayılır (opt-out).
--    Prisma sqlserver enum desteklemediğinden tür String + elle CHECK
--    (bkz. 20260723172445_check_constraints).

BEGIN TRY

BEGIN TRAN;

-- ── Bildirim.pushDurum ──────────────────────────────────────
ALTER TABLE [dbo].[Bildirim]
  ADD [pushDurum] NVARCHAR(1000) NOT NULL
      CONSTRAINT [Bildirim_pushDurum_df] DEFAULT 'bekliyor';

-- DİKKAT: SQL Server bu dosyayı tek batch olarak baştan derler; VAR OLAN bir
-- tabloya yeni eklenen kolona aynı batch içinde başvurmak "Invalid column
-- name" (hata 207) verir. GO ayracı Prisma migration'larında kullanılamadığı
-- için kolonu kullanan ifadeler EXEC ile çalışma anına ertelenir.

-- Geçmiş bildirimler yeniden gönderilmesin
EXEC('UPDATE [dbo].[Bildirim] SET [pushDurum] = ''atlandi''');

EXEC('ALTER TABLE [dbo].[Bildirim] ADD CONSTRAINT [CK_Bildirim_pushDurum]
        CHECK ([pushDurum] IN (N''bekliyor'', N''gonderildi'', N''atlandi''))');

EXEC('CREATE NONCLUSTERED INDEX [Bildirim_pushDurum_tarih_idx]
        ON [dbo].[Bildirim]([pushDurum], [tarih])');

-- ── BildirimTercih ──────────────────────────────────────────
CREATE TABLE [dbo].[BildirimTercih] (
    [id] NVARCHAR(1000) NOT NULL,
    [kullaniciId] NVARCHAR(1000) NOT NULL,
    [tur] NVARCHAR(1000) NOT NULL,
    [push] BIT NOT NULL CONSTRAINT [BildirimTercih_push_df] DEFAULT 1,
    [guncelleme] DATETIME2 NOT NULL CONSTRAINT [BildirimTercih_guncelleme_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [BildirimTercih_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [BildirimTercih_kullaniciId_tur_key] UNIQUE NONCLUSTERED ([kullaniciId], [tur])
);

ALTER TABLE [dbo].[BildirimTercih] ADD CONSTRAINT [BildirimTercih_kullaniciId_fkey]
  FOREIGN KEY ([kullaniciId]) REFERENCES [dbo].[Kullanici]([id])
  ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[BildirimTercih] ADD CONSTRAINT [CK_BildirimTercih_tur]
  CHECK ([tur] IN (N'odev', N'oturum', N'sinif', N'ozel', N'test', N'video', N'genel'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
