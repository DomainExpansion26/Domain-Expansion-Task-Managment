const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {

  // Delete all child and parent records in strict foreign key order
  await prisma.activity.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.notificationPreference.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.subtask.deleteMany({});
  await prisma.taskAssignee.deleteMany({});
  await prisma.taskRelation.deleteMany({});
  await prisma.qABug.deleteMany({});
  await prisma.qATicket.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.sprint.deleteMany({});
  await prisma.label.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.invitation.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.leave.deleteMany({});
  await prisma.hRProfile.deleteMany({});
  await prisma.aIUsage.deleteMany({});
  await prisma.aIMessage.deleteMany({});
  await prisma.aIConversation.deleteMany({});
  await prisma.aIProviderConfig.deleteMany({});
  await prisma.automationRule.deleteMany({});
  await prisma.sentEmailLog.deleteMany({});
  await prisma.user.deleteMany({});

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
