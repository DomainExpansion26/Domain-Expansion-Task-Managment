import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isSuperAdmin, normalizeProjectRole, ProjectRole } from "@/lib/permissions";

/**
 * Checks if currentUser has permission to manage members of the specified project.
 * Super Admin: Can manage members of any project.
 * Project Manager: Can manage members only if they are the project's manager, lead, or have PROJECT_MANAGER role in project.
 * Team Lead: Can manage members only if they are the project's teamLead, lead, or have TEAM_LEAD role in project.
 */
async function canUserManageProjectMembers(currentUser: any, projectId: string) {
  if (!currentUser) return false;
  if (isSuperAdmin(currentUser.role)) return true;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        where: { userId: currentUser.id },
      },
    },
  });

  if (!project) return false;

  const userRole = (currentUser.role || "").toUpperCase();
  const membership = project.members[0];
  const projectRole = membership ? normalizeProjectRole(membership.role) : null;

  // Project Manager permissions
  if (userRole === "MANAGER" || userRole === "PROJECT_MANAGER") {
    if (
      project.managerId === currentUser.id ||
      project.leadId === currentUser.id ||
      projectRole === "PROJECT_MANAGER" ||
      projectRole === "TEAM_LEAD"
    ) {
      return true;
    }
  }

  // Team Lead permissions
  if (userRole === "TEAM_LEAD") {
    if (
      project.teamLeadId === currentUser.id ||
      project.leadId === currentUser.id ||
      projectRole === "TEAM_LEAD"
    ) {
      return true;
    }
  }

  return false;
}

// GET /api/projects/[id]/members - List project members and unassigned organization users
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
      where: { OR: [{ id }, { key: id.toUpperCase() }] },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
                jobTitle: true,
                department: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    // Check if user can view: Super Admin or Member of project
    const isMember = project.members.some((m) => m.userId === currentUser.id);
    if (!isSuperAdmin(currentUser.role) && !isMember) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 }
      );
    }

    const canManage = await canUserManageProjectMembers(currentUser, project.id);

    // Get all registered active organization users
    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        jobTitle: true,
        department: true,
      },
      orderBy: { name: "asc" },
    });

    const assignedUserIds = new Set(project.members.map((m) => m.userId));
    const availableUsers = allUsers.filter((u) => !assignedUserIds.has(u.id));

    const formattedMembers = project.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      user: m.user,
      projectRole: normalizeProjectRole(m.role),
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        projectId: project.id,
        projectName: project.name,
        projectKey: project.key,
        canManageMembers: canManage,
        members: formattedMembers,
        availableUsers,
      },
    });
  } catch (error: any) {
    console.error("Fetch project members error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch project members" } },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/members - Add an existing or newly registered user to project
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
    const project = await prisma.project.findFirst({
      where: { OR: [{ id }, { key: id.toUpperCase() }] },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    const canManage = await canUserManageProjectMembers(currentUser, project.id);
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You are not authorized to add members to this project" } },
        { status: 403 }
      );
    }

    const { userId, role = "DEVELOPER" } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "User ID is required" } },
        { status: 400 }
      );
    }

    // Verify user exists and is active
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    const normalizedRole = normalizeProjectRole(role);

    // Upsert project member record to prevent duplicates and keep existing members intact
    const projectMember = await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: targetUser.id,
        },
      },
      create: {
        projectId: project.id,
        userId: targetUser.id,
        role: normalizedRole,
      },
      update: {
        role: normalizedRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            jobTitle: true,
            department: true,
          },
        },
      },
    });

    // Record activity
    await prisma.activity.create({
      data: {
        projectId: project.id,
        userId: currentUser.id,
        action: "ASSIGNED",
        description: `${currentUser.name} added ${targetUser.name} to project as ${normalizedRole}`,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "PROJECT_MEMBER_ADDED",
        entityType: "PROJECT",
        entityId: project.id,
        detailsJson: JSON.stringify({
          projectKey: project.key,
          assignedUser: targetUser.name,
          assignedEmail: targetUser.email,
          projectRole: normalizedRole,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: projectMember.id,
        userId: projectMember.userId,
        user: projectMember.user,
        projectRole: normalizeProjectRole(projectMember.role),
        joinedAt: projectMember.joinedAt,
      },
      message: `${targetUser.name} added to project successfully.`,
    });
  } catch (error: any) {
    console.error("Add project member error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to add member to project" } },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id]/members - Update member role in project
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      where: { OR: [{ id }, { key: id.toUpperCase() }] },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    const canManage = await canUserManageProjectMembers(currentUser, project.id);
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You are not authorized to manage members of this project" } },
        { status: 403 }
      );
    }

    const { userId, role } = await request.json();
    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "User ID and role are required" } },
        { status: 400 }
      );
    }

    const normalizedRole = normalizeProjectRole(role);

    const updated = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId,
        },
      },
      data: {
        role: normalizedRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            jobTitle: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        userId: updated.userId,
        user: updated.user,
        projectRole: normalizeProjectRole(updated.role),
        joinedAt: updated.joinedAt,
      },
      message: "Member project role updated successfully.",
    });
  } catch (error: any) {
    console.error("Update project member error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update project member" } },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/members - Remove member from project (does not delete user account)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      where: { OR: [{ id }, { key: id.toUpperCase() }] },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    const canManage = await canUserManageProjectMembers(currentUser, project.id);
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You are not authorized to remove members from this project" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "User ID is required" } },
        { status: 400 }
      );
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Member removed from project successfully.",
    });
  } catch (error: any) {
    console.error("Delete project member error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to remove member from project" } },
      { status: 500 }
    );
  }
}
