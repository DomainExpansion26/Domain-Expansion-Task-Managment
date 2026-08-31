import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";

// GET /api/tasks/[id]/share - List shared users
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const task = await prisma.task.findFirst({
      where: { OR: [{ id }, { taskKey: id.toUpperCase() }] },
      select: { id: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
        { status: 404 }
      );
    }

    const shares = await prisma.taskShare.findMany({
      where: { taskId: task.id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        sharedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: shares,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to get shared users" } },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/share - Share task with one or more users
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const task = await prisma.task.findFirst({
      where: { OR: [{ id }, { taskKey: id.toUpperCase() }] },
      select: { id: true, taskKey: true, title: true, projectId: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const targetUserIds: string[] = Array.isArray(body.userIds)
      ? body.userIds
      : body.userId
      ? [body.userId]
      : [];
    const purpose = (body.purpose || "GENERAL").toUpperCase(); // TESTING, REVIEW, MARKETING, COLLABORATION, GENERAL
    const note = body.note ? String(body.note).trim() : "";

    if (targetUserIds.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "No user IDs provided" } },
        { status: 400 }
      );
    }

    const purposeLabels: Record<string, { label: string; type: string }> = {
      TESTING: { label: "Testing / QA", type: "BUG_READY_FOR_TESTING" },
      REVIEW: { label: "Story Review", type: "TASK_ASSIGNED" },
      MARKETING: { label: "Digital Marketing", type: "TASK_ASSIGNED" },
      COLLABORATION: { label: "Collaboration", type: "TASK_ASSIGNED" },
      GENERAL: { label: "User Story", type: "TASK_ASSIGNED" },
    };
    const currentPurpose = purposeLabels[purpose] || purposeLabels.GENERAL;

    const createdShares = [];
    for (const userId of targetUserIds) {
      const share = await prisma.taskShare.upsert({
        where: {
          taskId_userId: { taskId: task.id, userId },
        },
        create: {
          taskId: task.id,
          userId,
          sharedById: currentUser.id,
        },
        update: {
          sharedById: currentUser.id,
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });
      createdShares.push(share);

      // Create notification for target user
      if (userId !== currentUser.id) {
        await prisma.notification.create({
          data: {
            userId,
            senderUserId: currentUser.id,
            title: `Tagged for ${currentPurpose.label} on #${task.taskKey}`,
            message: `${currentUser.name} tagged you on story "${task.title}"${note ? `: "${note}"` : ""}`,
            type: currentPurpose.type,
            taskId: task.taskKey,
            link: `/tasks/${task.taskKey}`,
          },
        });

        // Emit real-time notification
        const { eventHub } = await import("@/lib/events");
        eventHub.emit("notification", { userId });
      }
    }

    // Record activity
    await prisma.activity.create({
      data: {
        taskId: task.id,
        projectId: task.projectId,
        userId: currentUser.id,
        action: "UPDATED",
        description: `${currentUser.name} tagged for ${currentPurpose.label}: ${createdShares.map((s) => s.user?.name).join(", ")}${note ? ` (Note: ${note})` : ""}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: createdShares,
      message: `Tagged ${createdShares.length} members successfully`,
    });
  } catch (error: any) {
    console.error("Task share error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to share task" } },
      { status: 500 }
    );
  }
}
