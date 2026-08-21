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
      const msg = String(err?.message || "");
      const code = String(err?.code || "");
      const isTransient =
        code === "P1001" ||
        code === "P1002" ||
        code === "P1008" ||
        code === "P1017" ||
        code === "P2024" ||
        msg.toLowerCase().includes("can't reach database server") ||
        msg.toLowerCase().includes("connection closed") ||
        msg.toLowerCase().includes("connection terminated") ||
        msg.toLowerCase().includes("closed") ||
        msg.toLowerCase().includes("timeout") ||
        msg.toLowerCase().includes("etimedout") ||
        msg.toLowerCase().includes("econnreset") ||
        msg.toLowerCase().includes("wsasend") ||
        msg.toLowerCase().includes("connection refused") ||
        msg.toLowerCase().includes("closed by the remote host") ||
        msg.toLowerCase().includes("kind: closed");

      if (isTransient && i < retries - 1) {
        console.warn(`[Prisma Retry] Database connection drop or wake-up (attempt ${i + 1}/${retries}). Reconnecting in ${delayMs * (i + 1)}ms...`);
        try {
          await prisma.$connect();
        } catch {}
        await new Promise((res) => setTimeout(res, delayMs * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
