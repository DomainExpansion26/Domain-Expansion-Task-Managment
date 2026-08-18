import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission, isSuperAdmin, normalizeProjectRole } from "@/lib/permissions";

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
        manager: true,
        teamLead: true,
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, jobTitle: true, department: true } },
          },
        },
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

    // Authorization check: Super Admin or assigned project member
    const isMember = project.members.some((m) => m.userId === currentUser.id);
    if (!isSuperAdmin(currentUser.role) && !isMember) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You are not a member of this project" } },
        { status: 403 }
      );
    }

    const formatted = {
      ...project,
      members: project.members.map((m) => ({
        ...m.user,
        globalRole: m.user.role,
        projectRole: normalizeProjectRole(m.role),
        joinedAt: m.joinedAt,
      })),
    };

    return NextResponse.json({
      success: true,
      data: formatted,
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
        { success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions to update project" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.project.findFirst({
      where: { OR: [{ id }, { key: id.toUpperCase() }] },
      include: { members: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Project not found" } }, { status: 404 });
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status) updateData.status = body.status;
    if (body.leadId) updateData.leadId = body.leadId;
    if (body.managerId !== undefined) updateData.managerId = body.managerId;
    if (body.teamLeadId !== undefined) updateData.teamLeadId = body.teamLeadId;
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);

    const updated = await prisma.project.update({
      where: { id: existing.id },
      data: updateData,
    });

    // Update members if provided
    if (Array.isArray(body.members)) {
      // Upsert project members with roles
      for (const m of body.members) {
        if (m.userId) {
          await prisma.projectMember.upsert({
            where: {
              projectId_userId: {
                projectId: existing.id,
                userId: m.userId,
              },
            },
            create: {
              projectId: existing.id,
              userId: m.userId,
              role: normalizeProjectRole(m.role),
            },
            update: {
              role: normalizeProjectRole(m.role),
            },
          });
        }
      }
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "PROJECT_UPDATED",
        entityType: "PROJECT",
        entityId: existing.id,
        detailsJson: JSON.stringify({
          updatedFields: Object.keys(body),
          projectKey: existing.key,
        }),
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
    if (!currentUser || !isSuperAdmin(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only Super Admins can delete projects" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.project.findFirst({
      where: { OR: [{ id }, { key: id.toUpperCase() }] },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Project not found" } }, { status: 404 });
    }

    await prisma.project.delete({ where: { id: existing.id } });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "PROJECT_DELETED",
        entityType: "PROJECT",
        entityId: existing.id,
        detailsJson: JSON.stringify({ name: existing.name, key: existing.key }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Project ${existing.name} (${existing.key}) deleted successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to delete project" } },
      { status: 500 }
    );
  }
}
