import { PrismaClient } from "@prisma/client";

const DEFAULT_DATABASE_URL =
  "postgresql://neondb_owner:npg_UqW4Otx6eaPs@ep-bold-feather-at6voxuk-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30&pool_timeout=30";

const dbUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

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

/**
 * Executes a database operation with automatic retry for transient serverless cold-starts or drops.
 */
export async function withDbRetry<T>(fn: () => Promise<T>, retries = 4, delayMs = 600): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || "";
      const code = err?.code || "";
      const isTransient =
        code === "P1001" ||
        code === "P1002" ||
        code === "P1008" ||
        code === "P1017" ||
        code === "P2024" ||
        msg.includes("Can't reach database server") ||
        msg.includes("connection closed") ||
        msg.includes("Connection terminated") ||
        msg.includes("timeout") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("ECONNRESET") ||
        msg.includes("wsasend") ||
        msg.includes("connection refused") ||
        msg.includes("closed by the remote host");

      if (isTransient && i < retries - 1) {
        console.warn(`[Prisma Retry] Neon database wake-up / transient error on attempt ${i + 1}/${retries}. Retrying in ${delayMs * (i + 1)}ms...`);
        await new Promise((res) => setTimeout(res, delayMs * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
