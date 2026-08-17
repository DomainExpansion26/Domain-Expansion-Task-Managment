import { PrismaClient } from "@prisma/client";

const DEFAULT_DATABASE_URL =
  "postgresql://neondb_owner:npg_hQG50yVMHPEx@ep-flat-term-axs00bho-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const dbUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
