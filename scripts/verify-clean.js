require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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

}

verifyEmpty()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
