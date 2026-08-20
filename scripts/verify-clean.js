require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_UqW4Otx6eaPs@ep-bold-feather-at6voxuk-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    },
  },
});

async function verifyEmpty() {
  const counts = {
    users: await prisma.user.count(),
    projects: await prisma.project.count(),
    tasks: await prisma.task.count(),
    attendances: await prisma.attendance.count(),
    leaves: await prisma.leave.count(),
    hrProfiles: await prisma.hRProfile.count(),
    orgDocs: await prisma.organizationDocument.count(),
    auditLogs: await prisma.auditLog.count(),
  };

  console.log("Verified Current Database Counts:", counts);
}

verifyEmpty()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
