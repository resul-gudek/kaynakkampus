import { describe, expect, it } from "vitest";
import { guvenliDonusYolu } from "./auth.config";

/* Giriş sonrası dönüş hedefi: mailden gelen derin bağlantı korunmalı,
   ama site dışına yönlendirme (open redirect) asla kabul edilmemeli. */
describe("guvenliDonusYolu", () => {
  it("site içi yolları kabul eder", () => {
    expect(guvenliDonusYolu("/admin/egitim-basvurulari/abc123")).toBe("/admin/egitim-basvurulari/abc123");
    expect(guvenliDonusYolu("/admin/egitim-basvurulari?tur=ozel_ders")).toBe("/admin/egitim-basvurulari?tur=ozel_ders");
    expect(guvenliDonusYolu("  /koc/ajanda  ")).toBe("/koc/ajanda");
  });

  it("dış adresleri ve protokole göreli yolları reddeder", () => {
    expect(guvenliDonusYolu("https://kotu.example/admin")).toBeNull();
    expect(guvenliDonusYolu("//kotu.example/admin")).toBeNull();
    expect(guvenliDonusYolu("/\\kotu.example")).toBeNull();
    expect(guvenliDonusYolu("javascript:alert(1)")).toBeNull();
    expect(guvenliDonusYolu("admin/egitim-basvurulari")).toBeNull(); // eğik çizgisiz
  });

  it("boş değerleri ve giriş sayfasının kendisini reddeder", () => {
    expect(guvenliDonusYolu("")).toBeNull();
    expect(guvenliDonusYolu(null)).toBeNull();
    expect(guvenliDonusYolu(undefined)).toBeNull();
    expect(guvenliDonusYolu("/giris")).toBeNull(); // sonsuz döngü kurmasın
    expect(guvenliDonusYolu("/giris?devam=/admin")).toBeNull();
  });

  it("denetim karakteri içeren yolu reddeder", () => {
    expect(guvenliDonusYolu("/admin\nSet-Cookie: x=1")).toBeNull();
    expect(guvenliDonusYolu("/admin\r\nLocation: https://kotu.example")).toBeNull();
  });
});
