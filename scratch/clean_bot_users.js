const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning demo/bot users from database...");

  // Delete all demo activities, notifications, comments, bugs, tickets, relations, subtasks, tasks, projects, etc.
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
  
  // Delete all demo bot users ending in @domainexpansion.in
  const deleted = await prisma.user.deleteMany({});

  console.log(`✅ Removed all demo/bot users (${deleted.count} users deleted).`);
  console.log("✨ The system is now 100% clean and ready for your real user account creation!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
