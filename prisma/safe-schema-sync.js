const { PrismaClient } = require("@prisma/client");

const DEFAULT_DATABASE_URL =
  "postgresql://neondb_owner:npg_UqW4Otx6eaPs@ep-bold-feather-at6voxuk-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30&pool_timeout=30";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || DEFAULT_DATABASE_URL,
    },
  },
});

async function main() {

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "accountableId" TEXT;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "progress" INTEGER DEFAULT 0;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "category" TEXT;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "version" TEXT;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TaskWatcher" (
      "id" TEXT NOT NULL,
      "taskId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "TaskWatcher_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "TaskWatcher_taskId_userId_key" ON "TaskWatcher"("taskId", "userId");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TaskShare" (
      "id" TEXT NOT NULL,
      "taskId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "sharedById" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "TaskShare_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "TaskShare_taskId_userId_key" ON "TaskShare"("taskId", "userId");
  `);

  // Foreign keys if missing
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'Task_accountableId_fkey'
        ) THEN
          ALTER TABLE "Task" ADD CONSTRAINT "Task_accountableId_fkey" FOREIGN KEY ("accountableId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
  } catch (e) {
  }

  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'TaskWatcher_taskId_fkey'
        ) THEN
          ALTER TABLE "TaskWatcher" ADD CONSTRAINT "TaskWatcher_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'TaskWatcher_userId_fkey'
        ) THEN
          ALTER TABLE "TaskWatcher" ADD CONSTRAINT "TaskWatcher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
  } catch (e) {
  }

  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'TaskShare_taskId_fkey'
        ) THEN
          ALTER TABLE "TaskShare" ADD CONSTRAINT "TaskShare_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'TaskShare_userId_fkey'
        ) THEN
          ALTER TABLE "TaskShare" ADD CONSTRAINT "TaskShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'TaskShare_sharedById_fkey'
        ) THEN
          ALTER TABLE "TaskShare" ADD CONSTRAINT "TaskShare_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
  } catch (e) {
  }

}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
