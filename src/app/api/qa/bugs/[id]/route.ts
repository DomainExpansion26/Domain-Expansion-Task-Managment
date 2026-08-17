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
    const bug = await prisma.qABug.findFirst({
      where: { OR: [{ id }, { bugKey: id.toUpperCase() }] },
      include: {
        ticket: true,
        project: true,
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!bug) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "QA Bug not found" } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: bug });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch QA Bug" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "qa.bug.update")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.qABug.findFirst({
      where: { OR: [{ id }, { bugKey: id.toUpperCase() }] },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "QA Bug not found" } }, { status: 404 });
    }

    const updateData: any = {};
    if (body.title) updateData.title = body.title.trim();
    if (body.description) updateData.description = body.description.trim();
    if (body.status && body.status !== existing.status) updateData.status = body.status;
    if (body.priority) updateData.priority = body.priority;
    if (body.severity) updateData.severity = body.severity;
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId || null;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;

    const updated = await prisma.qABug.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        ticket: true,
        project: true,
        assignedTo: true,
        createdBy: true,
      },
    });

    if (body.status && body.status !== existing.status) {
      await prisma.activity.create({
        data: {
          projectId: existing.projectId,
          userId: currentUser.id,
          action: "STATUS_CHANGED",
          description: `${currentUser.name} updated ${existing.bugKey} status to ${body.status}`,
        },
      });

      emitPlatformEvent({
        event: "qa_bug_updated",
        data: { bugKey: existing.bugKey, status: body.status },
      });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Bug ${existing.bugKey} updated`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update QA bug" } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "qa.bug.delete")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.qABug.findFirst({
      where: { OR: [{ id }, { bugKey: id.toUpperCase() }] },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "QA Bug not found" } }, { status: 404 });
    }

    await prisma.qABug.delete({ where: { id: existing.id } });

    return NextResponse.json({
      success: true,
      message: `Bug ${existing.bugKey} deleted successfully`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to delete QA bug" } }, { status: 500 });
  }
}
