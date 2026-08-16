const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log("🧹 Completely wiping all dummy data from database...");

  await prisma.activity.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.subtask.deleteMany({});
  await prisma.taskAssignee.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.sprint.deleteMany({});
  await prisma.label.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.notificationPreference.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.aIMessage.deleteMany({});
  await prisma.aIConversation.deleteMany({});
  await prisma.aIUsage.deleteMany({});
  await prisma.sentEmailLog.deleteMany({});
  await prisma.invitation.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✨ All dummy data, tasks, projects, and accounts removed successfully!");
  console.log("🚀 Database is 100% clean and ready for real dynamic user registration.");
}

cleanDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
