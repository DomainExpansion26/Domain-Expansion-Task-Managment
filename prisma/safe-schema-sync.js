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

  // User NDA & Account Status fields
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountStatus" TEXT DEFAULT 'ACTIVE';
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "joiningDate" TIMESTAMP(3);
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ndaAccepted" BOOLEAN DEFAULT false;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ndaAcceptedAt" TIMESTAMP(3);
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ndaVersionAccepted" TEXT;
  `);

  // NDATemplate table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NDATemplate" (
      "id" TEXT NOT NULL,
      "version" TEXT NOT NULL,
      "title" TEXT NOT NULL DEFAULT 'Domain Expansion Non-Disclosure & Confidentiality Agreement',
      "content" TEXT NOT NULL,
      "summary" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdById" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "NDATemplate_pkey" PRIMARY KEY ("id")
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "NDATemplate_version_key" ON "NDATemplate"("version");
  `);

  // NDAAcceptance table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NDAAcceptance" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "templateId" TEXT NOT NULL,
      "version" TEXT NOT NULL,
      "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "checkboxText" TEXT NOT NULL DEFAULT 'I have read, understood, and agree to the above Terms & Conditions and NDA.',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "NDAAcceptance_pkey" PRIMARY KEY ("id")
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "NDAAcceptance_userId_version_key" ON "NDAAcceptance"("userId", "version");
  `);

  // CompanyPolicy table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CompanyPolicy" (
      "id" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'GENERAL',
      "version" TEXT NOT NULL DEFAULT 'v1.0',
      "content" TEXT NOT NULL,
      "summary" TEXT,
      "isPublished" BOOLEAN NOT NULL DEFAULT true,
      "createdById" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompanyPolicy_pkey" PRIMARY KEY ("id")
    );
  `);

  // DatabaseBackupRecord table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DatabaseBackupRecord" (
      "id" TEXT NOT NULL,
      "filename" TEXT NOT NULL,
      "tag" TEXT NOT NULL DEFAULT 'manual',
      "totalRecords" INTEGER NOT NULL DEFAULT 0,
      "sizeBytes" INTEGER NOT NULL DEFAULT 0,
      "createdById" TEXT,
      "status" TEXT NOT NULL DEFAULT 'COMPLETED',
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DatabaseBackupRecord_pkey" PRIMARY KEY ("id")
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "DatabaseBackupRecord_filename_key" ON "DatabaseBackupRecord"("filename");
  `);

  // Foreign keys
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'NDAAcceptance_userId_fkey'
        ) THEN
          ALTER TABLE "NDAAcceptance" ADD CONSTRAINT "NDAAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'NDAAcceptance_templateId_fkey'
        ) THEN
          ALTER TABLE "NDAAcceptance" ADD CONSTRAINT "NDAAcceptance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NDATemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
  } catch (e) {}

  // Seed default NDA v1.0 if none exists
  const existingNDA = await prisma.$queryRawUnsafe(`
    SELECT "id" FROM "NDATemplate" WHERE "version" = 'v1.0' LIMIT 1;
  `);

  if (!existingNDA || existingNDA.length === 0) {
    const defaultNDAContent = `DOMAIN EXPANSION ORGANIZATIONAL NON-DISCLOSURE, CONFIDENTIALITY & TERMS OF SERVICE AGREEMENT
Version: v1.0 | Effective Date: September 2026

1. PURPOSE & PREAMBLE
This Non-Disclosure and Confidentiality Agreement ("Agreement") governs your access to and participation in all Domain Expansion internal platforms, systems, repositories, infrastructure, and communication channels. By accessing this portal, you acknowledge your duty of utmost good faith, fidelity, and confidentiality to Domain Expansion.

2. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" encompasses any proprietary, technical, operational, commercial, or security data, whether disclosed orally, in writing, electronically, or observed during access to company systems, including but not limited to:
a. Source Code & Architecture: All internal repositories, algorithms, codebases, APIs, database schemas, deployment pipelines, infrastructure configurations, and credentials.
b. Product & Business Information: Feature specifications, product roadmaps, sprint backlogs, release schedules, customer research, strategic business plans, pricing, and competitive analysis.
c. Client & Customer Data: Identifying information, contract terms, usage statistics, confidential client engagements, customer communications, and transaction records.
d. Company Policies & Internal Processes: Internal HR regulations, operational guidelines, onboarding materials, compensation structures, internal communications, meeting minutes, and team hierarchy data.
e. Credentials & Security Assets: API tokens, service keys, SSH keys, passwords, two-factor authentication secrets, VPN configurations, and database connection strings.
f. Intellectual Property: Patents, copyrights, trademarks, inventions, trade secrets, design systems, algorithms, models, and research documentation.

3. OBLIGATIONS & NON-DISCLOSURE COVENANTS
You expressly agree, warrant, and covenant that you shall:
a. Strict Confidentiality: Maintain all Confidential Information in the strictest confidence and not disclose, publish, broadcast, disseminate, or transfer any part of it to any unauthorized third party or individual outside authorized project members.
b. Authorized Use Only: Use Confidential Information solely and exclusively for the legitimate performance of your assigned duties within Domain Expansion.
c. No Unauthorized Copying: Refrain from copying, downloading, exporting, photographing, screen-recording, or transcribing company documents, code, or databases onto personal, unapproved devices or external storage media.
d. Credential Protection: Never share, loan, transmit, or expose portal credentials, passwords, or session tokens to any other person, inside or outside the organization.
e. Immediate Reporting: Promptly inform company administration and IT security upon discovering any actual, suspected, or threatened unauthorized disclosure, security compromise, or credential breach.

4. DURATION & SURVIVAL
The confidentiality obligations imposed under this Agreement shall remain in full force and effect during your active tenure with Domain Expansion and shall survive indefinitely following any termination, resignation, offboarding, or cessation of access to the portal.

5. VIOLATIONS, BREACH & REMEDIES
You acknowledge that any unauthorized disclosure, misuse, or breach of Confidential Information will cause immediate, irreparable harm and significant financial and reputational injury to Domain Expansion. In the event of a breach or threatened breach:
a. Immediate Revocation: Domain Expansion reserves the absolute right to immediately revoke system credentials, suspend portal access, and initiate disciplinary proceedings.
b. Legal Action & Injunctive Relief: The company may seek injunctive relief, restraining orders, and monetary damages to the fullest extent permitted by applicable civil and criminal law.
c. Regulatory Reporting: Serious breaches involving data theft or credential leakage may be reported to relevant law enforcement and regulatory authorities.

6. ACKNOWLEDGMENT & MANDATORY CONSENT
By selecting the checkbox below and submitting this agreement, you affirm that you have carefully read, fully understood, and unconditionally agree to comply with all terms, conditions, and confidentiality obligations stated herein.`;

    await prisma.$executeRawUnsafe(`
      INSERT INTO "NDATemplate" (
        "id", "version", "title", "content", "summary", "isActive", "publishedAt", "createdAt", "updatedAt"
      ) VALUES (
        'nda_v1_init',
        'v1.0',
        'Domain Expansion Non-Disclosure & Confidentiality Agreement',
        $1,
        'Mandatory confidentiality agreement covering source code, company policies, credentials, client data, and internal processes.',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      );
    `, defaultNDAContent);
    console.log("[Migration] Seeded default NDATemplate v1.0 successfully.");
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
