import { PrismaClient } from "@prisma/client";

// Dev'de hot-reload her modül yenilemesinde yeni bağlantı açmasın diye tekil istemci
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
