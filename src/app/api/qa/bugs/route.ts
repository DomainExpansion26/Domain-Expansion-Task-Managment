import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { emitPlatformEvent } from "@/lib/events";
import { sendEmail } from "@/lib/email";

// GET /api/qa/bugs - Search, filter, and paginate QA bugs
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");
    const relatedTaskId = searchParams.get("relatedTaskId");
    const projectId = searchParams.get("projectId");
    const assignedToId = searchParams.get("assignedToId");
    const createdById = searchParams.get("createdById");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const severity = searchParams.get("severity");
    const search = searchParams.get("search");
    const myBugs = searchParams.get("myBugs") === "true";

    const where: any = {};
    if (ticketId) where.ticketId = ticketId;
    if (relatedTaskId) where.relatedTaskId = relatedTaskId;
    if (projectId && projectId !== "ALL") where.projectId = projectId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (createdById) where.createdById = createdById;
    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;
    if (severity && severity !== "ALL") where.severity = severity;
    if (myBugs) {
      where.OR = [
        { assignedToId: currentUser.id },
        { createdById: currentUser.id },
      ];
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { bugKey: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { stepsToReproduce: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
    }

    const bugs = await prisma.qABug.findMany({
      where,
      include: {
        relatedTask: {
          select: {
            id: true,
            taskKey: true,
            title: true,
            status: true,
            assignees: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
          },
        },
        ticket: { select: { id: true, ticketKey: true, title: true, status: true } },
        project: { select: { id: true, name: true, key: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true } },
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true } },
        comments: { select: { id: true } },
        attachments: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: bugs.map((b) => ({
        ...b,
        commentsCount: b.comments.length,
        attachmentsCount: b.attachments.length,
      })),
    });
  } catch (error: any) {
    console.error("Fetch QA bugs error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch QA bugs" } }, { status: 500 });
  }
}

// POST /api/qa/bugs - Create a QA bug (standalone or with related task)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "qa.bug.create")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Permission to log bugs required" } }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      priority = "HIGH",
      severity = "MAJOR",
      status = "OPEN",
      environment = "Production",
      stepsToReproduce,
      expectedResult,
      actualResult,
      projectId,
      relatedTaskId,
      ticketId,
      assignedToId,
      startDate,
      endDate,
    } = body;

    if (!title?.trim() || !description?.trim() || !projectId) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Title, description, and project are required" } },
        { status: 400 }
      );
    }

    // Auto-generate next unique sequential bugKey (e.g. BUG-058, BUG-068...)
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

    const bug = await prisma.qABug.create({
      data: {
        bugKey,
        title: title.trim(),
        description: description.trim(),
        type: "Bug",
        priority,
        severity,
        status: status || (assignedToId ? "ASSIGNED" : "OPEN"),
        environment: environment || "Production",
        stepsToReproduce: stepsToReproduce?.trim() || null,
        expectedResult: expectedResult?.trim() || null,
        actualResult: actualResult?.trim() || null,
        projectId,
        relatedTaskId: relatedTaskId || null,
        ticketId: ticketId || null,
        assignedToId: assignedToId || null,
        createdById: currentUser.id,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        relatedTask: true,
        ticket: true,
        project: true,
        assignedTo: true,
        createdBy: true,
      },
    });

    // If related task exists, log activity on task
    if (relatedTaskId) {
      const parentTask = await prisma.task.findUnique({ where: { id: relatedTaskId } });
      if (parentTask) {
        await prisma.activity.create({
          data: {
            taskId: parentTask.id,
            projectId,
            userId: currentUser.id,
            action: "QA_BUG_LOGGED",
            description: `${currentUser.name} raised ${bug.bugKey}: "${bug.title}" against ${parentTask.taskKey}`,
          },
        });
      }
    }

    // Create activity on the bug
    await prisma.activity.create({
      data: {
        bugId: bug.id,
        projectId,
        userId: currentUser.id,
        action: "CREATED",
        description: `${currentUser.name} logged bug ${bug.bugKey}`,
      },
    });

    // Notify assigned developer if assigned
    if (assignedToId && assignedToId !== currentUser.id) {
      await prisma.notification.create({
        data: {
          userId: assignedToId,
          senderUserId: currentUser.id,
          title: `Bug Assigned: ${bug.bugKey}`,
          message: `${currentUser.name} assigned ${bug.bugKey}: "${bug.title}" to you.`,
          type: "BUG_ASSIGNED",
          bugId: bug.id,
          taskId: relatedTaskId || undefined,
          link: relatedTaskId ? `/tasks/${bug.relatedTask?.taskKey}?bug=${bug.bugKey}` : `/qa?bug=${bug.bugKey}`,
        },
      });

      const assignedUser = await prisma.user.findUnique({ where: { id: assignedToId } });
      if (assignedUser) {
        await sendEmail({
          to: assignedUser.email,
          subject: `[${bug.bugKey}] New QA Bug Assigned: ${bug.title}`,
          template: "TASK_ASSIGNED",
          data: {
            userName: assignedUser.name,
            assignerName: currentUser.name,
            taskKey: bug.bugKey,
            taskTitle: bug.title,
            priority: bug.priority,
            dueDate: "Immediate Attention",
          },
        });
      }
    }

    emitPlatformEvent({
      event: "qa_bug_created",
      data: { bugKey: bug.bugKey, projectId },
    });

    return NextResponse.json({
      success: true,
      data: bug,
      message: `Bug ${bug.bugKey} created successfully`,
    });
  } catch (error: any) {
    console.error("Create QA bug error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to create QA bug" } }, { status: 500 });
  }
}
