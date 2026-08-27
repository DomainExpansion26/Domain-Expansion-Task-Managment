const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanDatabase() {

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

}

cleanDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
