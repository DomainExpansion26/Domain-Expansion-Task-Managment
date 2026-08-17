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
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToId = searchParams.get("assignedToId");

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;

    const tickets = await prisma.qATicket.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, key: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        relatedTask: { select: { id: true, taskKey: true, title: true, status: true } },
        bugs: {
          select: {
            id: true,
            bugKey: true,
            title: true,
            status: true,
            severity: true,
            priority: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: tickets,
    });
  } catch (error: any) {
    console.error("QA Tickets list error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch QA tickets" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "qa.ticket.create")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You lack permission to create QA tickets" } },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      startDate,
      endDate,
      assignedToId,
      projectId,
      relatedTaskId,
      priority = "MEDIUM",
      status = "TODO",
    } = await request.json();

    // Master Prompt Section 16: Title, description, start date, and end date are MANDATORY.
    if (!title?.trim() || !description?.trim() || !startDate || !endDate || !assignedToId || !projectId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Title, Description, Start Date, End Date, Assigned Member, and Project are mandatory.",
          },
        },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Project not found" } }, { status: 404 });
    }

    const ticketCount = await prisma.qATicket.count({ where: { projectId } });
    const ticketKey = `${project.key}-QA-${100 + ticketCount + 1}`;

    const ticket = await prisma.qATicket.create({
      data: {
        ticketKey,
        title: title.trim(),
        description: description.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        priority,
        status,
        projectId,
        relatedTaskId: relatedTaskId || null,
        assignedToId,
        createdById: currentUser.id,
      },
      include: {
        project: true,
        assignedTo: true,
        createdBy: true,
        relatedTask: true,
      },
    });

    // Create Notification for assigned member
    await prisma.notification.create({
      data: {
        userId: assignedToId,
        title: "New QA Ticket Assigned",
        message: `${currentUser.name} assigned QA Ticket ${ticket.ticketKey}: "${ticket.title}" to you.`,
        type: "QA_UPDATE",
        link: `/qa?ticket=${ticket.ticketKey}`,
      },
    });

    // Record Activity
    await prisma.activity.create({
      data: {
        projectId,
        userId: currentUser.id,
        action: "QA_TICKET_CREATED",
        description: `${currentUser.name} created QA Ticket ${ticket.ticketKey}: ${ticket.title}`,
      },
    });

    emitPlatformEvent({
      event: "qa_ticket_created",
      data: { ticketKey: ticket.ticketKey, projectId: ticket.projectId },
    });

    return NextResponse.json({
      success: true,
      data: ticket,
      message: `QA Ticket ${ticket.ticketKey} created successfully`,
    });
  } catch (error: any) {
    console.error("Create QA Ticket error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to create QA ticket" } }, { status: 500 });
  }
}
