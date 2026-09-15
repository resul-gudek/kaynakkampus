import { describe, expect, it } from "vitest";
import { SITE_KOKU, mutlakAdres } from "./site";

/* Dışarı giden bağlantılar buradan üretilir. Çift eğik çizgi, eksik protokol
   ya da sondaki eğik çizgi kaynaklı bozuk adres oluşmamalı. */
describe("mutlakAdres", () => {
  it("mutlak ve tek eğik çizgili adres üretir", () => {
    expect(mutlakAdres("/giris")).toBe(`${SITE_KOKU}/giris`);
    expect(mutlakAdres("/basvuru/durum/abc123")).toBe(`${SITE_KOKU}/basvuru/durum/abc123`);
  });

  it("baştaki eğik çizgi eksikse ekler, fazlaysa tekilleştirir", () => {
    expect(mutlakAdres("giris")).toBe(`${SITE_KOKU}/giris`);
    expect(mutlakAdres("//giris")).toBe(`${SITE_KOKU}/giris`);
    expect(mutlakAdres("///a/b")).toBe(`${SITE_KOKU}/a/b`);
  });

  it("boş yol kökü verir", () => {
    expect(mutlakAdres("")).toBe(SITE_KOKU);
    expect(mutlakAdres("/")).toBe(SITE_KOKU);
  });

  it("kök protokollü ve sonunda eğik çizgisiz", () => {
    expect(SITE_KOKU).toMatch(/^https?:\/\//);
    expect(SITE_KOKU.endsWith("/")).toBe(false);
  });

  it("üretilen adreste çift eğik çizgi kalmaz", () => {
    for (const yol of ["/giris", "giris", "//giris", "/a/b/c"]) {
      expect(mutlakAdres(yol).replace(/^https?:\/\//, "")).not.toContain("//");
    }
  });
});
