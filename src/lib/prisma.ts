import { PrismaClient } from "@prisma/client";
import { logcu } from "./log";

const log = logcu("prisma");

// Dev'de hot-reload her modül yenilemesinde yeni bağlantı açmasın diye tekil istemci
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function olustur() {
  const istemci = new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "warn" },
      { emit: "event", level: "error" },
    ],
  });
  // Sorgu logu yalnız debug/trace seviyesinde akar (LOG_LEVEL=debug ile açılır)
  istemci.$on("query", (e) => {
    log.debug({ sureMs: e.duration, sorgu: e.query }, "sorgu");
  });
  istemci.$on("warn", (e) => log.warn({ mesaj: e.message }, "prisma uyarısı"));
  istemci.$on("error", (e) => log.error({ mesaj: e.message }, "prisma hatası"));
  return istemci;
}

export const prisma = globalForPrisma.prisma ?? olustur();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
