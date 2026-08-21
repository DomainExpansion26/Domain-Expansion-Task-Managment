import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { emitPlatformEvent, eventHub } from "@/lib/events";
import { sendEmail } from "@/lib/email";

// GET /api/tasks/[id]/bugs - Get all QA bugs linked to this task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Task identifier is required" } },
        { status: 400 }
      );
    }

    const cleanId = id.trim();
    const task = await prisma.task.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { taskKey: cleanId },
          { taskKey: cleanId.toUpperCase() },
        ],
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: `Task '${cleanId}' not found` } },
        { status: 404 }
      );
    }

    const bugs = await prisma.qABug.findMany({
      where: { relatedTaskId: task.id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true },
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const bugStats = {
      total: bugs.length,
      open: bugs.filter((b) => b.status === "OPEN" || b.status === "ASSIGNED" || b.status === "IN_PROGRESS").length,
      readyForTesting: bugs.filter((b) => b.status === "READY_FOR_TESTING").length,
      inTesting: bugs.filter((b) => b.status === "IN_TESTING").length,
      passed: bugs.filter((b) => b.status === "PASSED" || b.status === "CLOSED").length,
      failed: bugs.filter((b) => b.status === "FAILED" || b.status === "REOPENED").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        bugs,
        bugStats,
      },
    });
  } catch (error: any) {
    console.error("Fetch task bugs error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch task QA bugs" } },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/bugs - Raise a bug against this specific task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "qa.bug.create")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Permission to raise QA bugs is required" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Task identifier is required" } },
        { status: 400 }
      );
    }

    const cleanId = id.trim();
    const task = await prisma.task.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { taskKey: cleanId },
          { taskKey: cleanId.toUpperCase() },
        ],
      },
      include: {
        assignees: { include: { user: true } },
        project: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: `Parent task '${cleanId}' not found` } },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      title,
      description,
      priority = "HIGH",
      severity = "MAJOR",
      environment = "Production",
      stepsToReproduce,
      expectedResult,
      actualResult,
      assignedToId,
    } = body;

    const cleanTitle = typeof title === "string" ? title.trim() : "";
    const cleanDesc = typeof description === "string" ? description.trim() : "";

    if (!cleanTitle || !cleanDesc) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Bug title and description are required" } },
        { status: 400 }
      );
    }

    // Default assignee to task's primary assignee if not explicitly specified
    const targetAssigneeId =
      assignedToId || (task.assignees && task.assignees.length > 0 ? task.assignees[0].userId : null);

    // Safely generate unique sequential bugKey (e.g. BUG-058, BUG-068...)
    const allBugs = await prisma.qABug.findMany({ select: { bugKey: true } });
    let maxNum = 50;
    for (const b of allBugs) {
      const match = b.bugKey?.match(/BUG-(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    const bugKey = `BUG-${String(maxNum + 1).padStart(3, "0")}`;

    const cleanSteps =
      typeof stepsToReproduce === "string"
        ? stepsToReproduce.trim()
        : stepsToReproduce
        ? String(stepsToReproduce)
        : null;

    const cleanExpected =
      typeof expectedResult === "string"
        ? expectedResult.trim()
        : expectedResult
        ? String(expectedResult)
        : null;

    const cleanActual =
      typeof actualResult === "string"
        ? actualResult.trim()
        : actualResult
        ? String(actualResult)
        : null;

    const bug = await prisma.qABug.create({
      data: {
        bugKey,
        title: cleanTitle,
        description: cleanDesc,
        type: "Bug",
        priority: priority || "HIGH",
        severity: severity || "MAJOR",
        status: targetAssigneeId ? "ASSIGNED" : "OPEN",
        environment: environment || "Production",
        stepsToReproduce: cleanSteps,
        expectedResult: cleanExpected,
        actualResult: cleanActual,
        projectId: task.projectId,
        relatedTaskId: task.id,
        assignedToId: targetAssigneeId,
        createdById: currentUser.id,
      },
      include: {
        relatedTask: { select: { id: true, taskKey: true, title: true, status: true } },
        project: { select: { id: true, name: true, key: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
      },
    });

    // Create Activity entry on the parent Task
    try {
      await prisma.activity.create({
        data: {
          taskId: task.id,
          projectId: task.projectId,
          userId: currentUser.id,
          action: "QA_BUG_LOGGED",
          fieldChanged: "qaBugs",
          newValue: bug.bugKey,
          description: `${currentUser.name} raised ${bug.bugKey}: "${bug.title}" against ${task.taskKey}`,
        },
      });
    } catch (actErr) {
      console.warn("Failed to create task activity for QA bug:", actErr);
    }

    // Create Activity entry on the Bug itself
    try {
      await prisma.activity.create({
        data: {
          bugId: bug.id,
          projectId: task.projectId,
          userId: currentUser.id,
          action: "CREATED",
          description: `${currentUser.name} created ${bug.bugKey} linked to ${task.taskKey}`,
        },
      });
    } catch (actErr) {
      console.warn("Failed to create bug activity:", actErr);
    }

    // If assigned to a developer, send in-app notification and email
    if (targetAssigneeId && targetAssigneeId !== currentUser.id) {
      try {
        await prisma.notification.create({
          data: {
            userId: targetAssigneeId,
            senderUserId: currentUser.id,
            title: `Bug Assigned: ${bug.bugKey}`,
            message: `${currentUser.name} raised & assigned ${bug.bugKey} on ${task.taskKey}: "${bug.title}"`,
            type: "BUG_ASSIGNED",
            taskId: task.id,
            bugId: bug.id,
            link: `/tasks/${task.taskKey}?bug=${bug.bugKey}`,
          },
        });
      } catch (notifErr) {
        console.warn("Failed to create bug assignment notification:", notifErr);
      }

      // Safe email dispatch
      try {
        const assignedUser = await prisma.user.findUnique({ where: { id: targetAssigneeId } });
        if (assignedUser) {
          sendEmail({
            to: assignedUser.email,
            subject: `[${bug.bugKey}] QA Bug Raised on ${task.taskKey}: ${bug.title}`,
            template: "TASK_ASSIGNED",
            data: {
              userName: assignedUser.name,
              assignerName: currentUser.name,
              taskKey: bug.bugKey,
              taskTitle: `${bug.title} (Parent: ${task.taskKey})`,
              priority: bug.priority,
              dueDate: "Immediate Attention",
            },
          }).catch((e) => console.warn("Email send error:", e));
        }
      } catch (e) {
        console.warn("Email lookup error:", e);
      }
    }

    // Safe platform event emission
    try {
      emitPlatformEvent({
        event: "qa_bug_created",
        data: { bugKey: bug.bugKey, taskKey: task.taskKey, taskId: task.id },
      });
      eventHub.emit("qa_bug_created", { bugKey: bug.bugKey, taskKey: task.taskKey, taskId: task.id });
    } catch (evtErr) {
      console.warn("Event emit error:", evtErr);
    }

    return NextResponse.json(
      {
        success: true,
        data: bug,
        message: `Bug ${bug.bugKey} raised successfully against ${task.taskKey}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Raise bug error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to raise QA bug" } },
      { status: 500 }
    );
  }
}
