const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
  });
  const projects = await prisma.project.findMany({
    select: { id: true, name: true, key: true, leadId: true },
  });
  const tasks = await prisma.task.findMany({
    select: { id: true, taskKey: true, title: true, projectId: true },
  });
  const bugs = await prisma.qABug.findMany({
    select: { id: true, bugKey: true, title: true, projectId: true },
  });

  console.log("Users:", users);
  console.log("Projects:", projects);
  console.log(`Tasks: ${tasks.length}`);
  console.log(`Bugs: ${bugs.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
