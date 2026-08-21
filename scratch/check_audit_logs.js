const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  console.log("Recent Audit Logs:", auditLogs.length);
  auditLogs.forEach((l) => {
    console.log(`- [${l.action}] entity: ${l.entityType} | details: ${l.detailsJson} | date: ${l.createdAt.toISOString()}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
