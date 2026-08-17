import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { emitPlatformEvent } from "@/lib/events";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");

    const where: any = {};
    if (ticketId) where.ticketId = ticketId;
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const bugs = await prisma.qABug.findMany({
      where,
      include: {
        ticket: { select: { id: true, ticketKey: true, title: true, status: true } },
        project: { select: { id: true, name: true, key: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: bugs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch QA bugs" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "qa.bug.create")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Permission to log bugs required" } }, { status: 403 });
    }

    const {
      title,
      description,
      priority = "MEDIUM",
      severity = "MEDIUM",
      status = "OPEN",
      ticketId,
      projectId,
      assignedToId,
      startDate,
      endDate,
    } = await request.json();

    if (!title?.trim() || !description?.trim() || !ticketId || !projectId) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Title, description, ticketId, and projectId are required" } },
        { status: 400 }
      );
    }

    const ticket = await prisma.qATicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Parent QA ticket not found" } }, { status: 404 });
    }

    const bugCount = await prisma.qABug.count();
    const bugKey = `BUG-${String(100 + bugCount + 1).padStart(3, "0")}`;

    const bug = await prisma.qABug.create({
      data: {
        bugKey,
        title: title.trim(),
        description: description.trim(),
        priority,
        severity,
        status,
        ticketId,
        projectId,
        assignedToId: assignedToId || null,
        createdById: currentUser.id,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        ticket: true,
        project: true,
        assignedTo: true,
        createdBy: true,
      },
    });

    // If ticket was READY_FOR_TESTING, mark it TEST_FAILED because a bug was logged
    if (ticket.status === "READY_FOR_TESTING") {
      await prisma.qATicket.update({
        where: { id: ticket.id },
        data: { status: "TEST_FAILED" },
      });
    }

    // Notify assigned developer if assigned
    if (assignedToId) {
      await prisma.notification.create({
        data: {
          userId: assignedToId,
          title: "New Bug Assigned",
          message: `${currentUser.name} assigned ${bug.bugKey}: "${bug.title}" under ${ticket.ticketKey} to you.`,
          type: "QA_UPDATE",
          link: `/qa?ticket=${ticket.ticketKey}`,
        },
      });
    }

    // Record activity
    await prisma.activity.create({
      data: {
        projectId,
        userId: currentUser.id,
        action: "QA_BUG_LOGGED",
        description: `${currentUser.name} logged ${bug.bugKey}: ${bug.title} under ${ticket.ticketKey}`,
      },
    });

    emitPlatformEvent({
      event: "qa_bug_created",
      data: { bugKey: bug.bugKey, ticketKey: ticket.ticketKey },
    });

    return NextResponse.json({
      success: true,
      data: bug,
      message: `Bug ${bug.bugKey} logged successfully under ${ticket.ticketKey}`,
    });
  } catch (error: any) {
    console.error("Create bug error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to log QA bug" } }, { status: 500 });
  }
}
