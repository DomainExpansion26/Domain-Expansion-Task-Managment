import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const countsBefore = {
      users: await prisma.user.count(),
      projects: await prisma.project.count(),
      tasks: await prisma.task.count(),
      sprints: await prisma.sprint.count(),
      subtasks: await prisma.subtask.count(),
      taskAssignees: await prisma.taskAssignee.count(),
      taskRelations: await prisma.taskRelation.count(),
      qaTickets: await prisma.qATicket.count(),
      qaBugs: await prisma.qABug.count(),
      comments: await prisma.comment.count(),
      attachments: await prisma.attachment.count(),
      labels: await prisma.label.count(),
      activities: await prisma.activity.count(),
      notifications: await prisma.notification.count(),
      attendances: await prisma.attendance.count(),
      leaves: await prisma.leave.count(),
      hrProfiles: await prisma.hRProfile.count(),
      orgDocs: await prisma.organizationDocument.count(),
      invitations: await prisma.invitation.count(),
      auditLogs: await prisma.auditLog.count(),
      aiUsages: await prisma.aIUsage.count(),
      aiMessages: await prisma.aIMessage.count(),
      aiConversations: await prisma.aIConversation.count(),
    };

    // 1. Delete QA bugs & tickets
    await prisma.qABug.deleteMany({});
    await prisma.qATicket.deleteMany({});

    // 2. Delete task children & relations
    await prisma.taskRelation.deleteMany({});
    await prisma.taskAssignee.deleteMany({});
    await prisma.subtask.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.activity.deleteMany({});

    // 3. Delete tasks, sprints, labels, project members, projects, docs
    await prisma.task.deleteMany({});
    await prisma.sprint.deleteMany({});
    await prisma.label.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.organizationDocument.deleteMany({});
    await prisma.project.deleteMany({});

    // 4. Delete HRMS records
    await prisma.attendance.deleteMany({});
    await prisma.leave.deleteMany({});
    await prisma.hRProfile.deleteMany({});

    // 5. Delete user relations & logs
    await prisma.notification.deleteMany({});
    await prisma.notificationPreference.deleteMany({});
    await prisma.invitation.deleteMany({});
    await prisma.passwordResetToken.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.sentEmailLog.deleteMany({});

    // 6. Delete AI conversations & usage
    await prisma.aIMessage.deleteMany({});
    await prisma.aIConversation.deleteMany({});
    await prisma.aIUsage.deleteMany({});
    await prisma.aIProviderConfig.deleteMany({});
    await prisma.automationRule.deleteMany({});

    // 7. Delete all users
    await prisma.user.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "All dummy data (tasks, projects, HRMS records, members, logs) successfully removed!",
      data: {
        purgedCounts: countsBefore,
      },
    });
  } catch (error: any) {
    console.error("Clean DB error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to purge database" } },
      { status: 500 }
    );
  }
}
