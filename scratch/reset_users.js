const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.activity.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.notificationPreference.deleteMany({});
  await prisma.hRProfile.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("Database user count is now 0. Ready for user's manual sign up!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
