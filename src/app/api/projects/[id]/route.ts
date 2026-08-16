import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

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

    const project = await prisma.project.findFirst({
      where: {
        OR: [{ id }, { key: id.toUpperCase() }],
      },
      include: {
        lead: true,
        members: { include: { user: true } },
        sprints: { orderBy: { createdAt: "desc" } },
        labels: true,
        tasks: {
          include: {
            assignees: { include: { user: true } },
            subtasks: true,
            comments: true,
          },
          orderBy: { position: "asc" },
        },
        activities: {
          include: { user: { select: { name: true, avatarUrl: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch project" } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "project.update")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.leadId ? { leadId: body.leadId } : {}),
        ...(body.startDate ? { startDate: new Date(body.startDate) } : {}),
        ...(body.endDate ? { endDate: new Date(body.endDate) } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Project updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update project" } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "project.delete")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only Super Admins can delete projects" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    await prisma.project.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to delete project" } },
      { status: 500 }
    );
  }
}
