import { defineConfig } from "vitest/config";

/* Saf iş kuralları (src/lib/hesap.ts) için birim test yapılandırması.
   Testler yan-etkisiz fonksiyonları hedefler; DB/DOM gerekmez → node ortamı. */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
