import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { emitPlatformEvent } from "@/lib/events";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.qATicket.findFirst({
      where: { OR: [{ id }, { ticketKey: id.toUpperCase() }] },
      include: {
        project: true,
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        relatedTask: true,
        bugs: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "QA Ticket not found" } }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch QA Ticket" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "qa.ticket.update")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.qATicket.findFirst({
      where: { OR: [{ id }, { ticketKey: id.toUpperCase() }] },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "QA Ticket not found" } }, { status: 404 });
    }

    const updateData: any = {};
    if (body.title) updateData.title = body.title.trim();
    if (body.description) updateData.description = body.description.trim();
    if (body.status && body.status !== existing.status) updateData.status = body.status;
    if (body.priority) updateData.priority = body.priority;
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);
    if (body.assignedToId) updateData.assignedToId = body.assignedToId;
    if (body.relatedTaskId !== undefined) updateData.relatedTaskId = body.relatedTaskId || null;

    const updated = await prisma.qATicket.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        project: true,
        assignedTo: true,
        createdBy: true,
        relatedTask: true,
        bugs: true,
      },
    });

    // Record activity on status change
    if (body.status && body.status !== existing.status) {
      await prisma.activity.create({
        data: {
          projectId: existing.projectId,
          userId: currentUser.id,
          action: "STATUS_CHANGED",
          description: `${currentUser.name} moved QA Ticket ${existing.ticketKey} to ${body.status}`,
        },
      });

      emitPlatformEvent({
        event: "qa_ticket_updated",
        data: { ticketKey: existing.ticketKey, status: body.status },
      });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `QA Ticket ${existing.ticketKey} updated`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update QA ticket" } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "qa.ticket.delete")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.qATicket.findFirst({
      where: { OR: [{ id }, { ticketKey: id.toUpperCase() }] },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "QA Ticket not found" } }, { status: 404 });
    }

    await prisma.qATicket.delete({ where: { id: existing.id } });

    return NextResponse.json({
      success: true,
      message: `QA Ticket ${existing.ticketKey} deleted successfully`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to delete QA ticket" } }, { status: 500 });
  }
}
