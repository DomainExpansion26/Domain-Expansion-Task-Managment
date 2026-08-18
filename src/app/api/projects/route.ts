import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission, isSuperAdmin, normalizeProjectRole, ProjectRole } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Requirement #12: Project Visibility Control
    // Super Admin sees all projects. Normal employees/leads/managers ONLY see projects they are assigned to.
    const isSuper = isSuperAdmin(currentUser.role);
    const whereClause: any = {};

    if (!isSuper) {
      whereClause.members = {
        some: {
          userId: currentUser.id,
        },
      };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        lead: { select: { id: true, name: true, email: true, avatarUrl: true } },
        manager: { select: { id: true, name: true, email: true, avatarUrl: true } },
        teamLead: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, jobTitle: true, department: true } },
          },
        },
        tasks: {
          select: { id: true, status: true, priority: true, dueDate: true },
        },
        sprints: {
          select: { id: true, name: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = projects.map((p) => {
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.status === "DONE" || t.status === "COMPLETED" || t.status === "CLOSED").length;
      const inProgress = p.tasks.filter((t) => t.status === "IN_PROGRESS").length;
      const blocked = p.tasks.filter((t) => t.status === "BLOCKED").length;
      const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;

      const myMembership = p.members.find((m) => m.userId === currentUser.id);

      return {
        id: p.id,
        name: p.name,
        key: p.key,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        lead: p.lead,
        manager: p.manager,
        teamLead: p.teamLead,
        myProjectRole: myMembership ? normalizeProjectRole(myMembership.role) : (isSuper ? "PROJECT_MANAGER" : null),
        members: p.members.map((m) => ({
          ...m.user,
          globalRole: m.user.role,
          projectRole: normalizeProjectRole(m.role),
          joinedAt: m.joinedAt,
        })),
        sprints: p.sprints,
        stats: {
          totalTasks: total,
          completedTasks: done,
          inProgressTasks: inProgress,
          blockedTasks: blocked,
          progressPercent,
        },
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("Projects list error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch projects" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "project.create")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You lack permission to create projects" } },
        { status: 403 }
      );
    }

    const {
      name,
      key,
      description,
      leadId,
      managerId,
      teamLeadId,
      startDate,
      endDate,
      members = [], // Array of { userId: string, role?: string } or array of userIds
    } = await request.json();

    if (!name || !key) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Project name and key are required" } },
        { status: 400 }
      );
    }

    const formattedKey = key.trim().toUpperCase();

    // Check key uniqueness
    const existing = await prisma.project.findUnique({ where: { key: formattedKey } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "KEY_EXISTS", message: `Project key '${formattedKey}' is already taken` } },
        { status: 400 }
      );
    }

    // Build member assignments map
    const memberMap = new Map<string, ProjectRole>();

    // Add creator / super admin
    memberMap.set(currentUser.id, "PROJECT_MANAGER");

    if (leadId) memberMap.set(leadId, "TEAM_LEAD");
    if (managerId) memberMap.set(managerId, "PROJECT_MANAGER");
    if (teamLeadId) memberMap.set(teamLeadId, "TEAM_LEAD");

    // Add selected members with their project-specific roles (Requirement #10 & #11)
    for (const item of members) {
      if (typeof item === "string") {
        if (!memberMap.has(item)) memberMap.set(item, "MEMBER");
      } else if (item && item.userId) {
        memberMap.set(item.userId, normalizeProjectRole(item.role));
      }
    }

    const memberCreateData = Array.from(memberMap.entries()).map(([uId, pRole]) => ({
      userId: uId,
      role: pRole,
    }));

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        key: formattedKey,
        description: description?.trim() || null,
        leadId: leadId || currentUser.id,
        managerId: managerId || null,
        teamLeadId: teamLeadId || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: "ACTIVE",
        members: {
          create: memberCreateData,
        },
        labels: {
          create: [
            { name: "Frontend", color: "#FF6200" },
            { name: "Backend", color: "#6D28D9" },
            { name: "Bug", color: "#EF4444" },
            { name: "Design", color: "#EC4899" },
            { name: "QA", color: "#06B6D4" },
          ],
        },
      },
      include: {
        lead: true,
        members: { include: { user: true } },
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "PROJECT_CREATED",
        entityType: "PROJECT",
        entityId: project.id,
        detailsJson: JSON.stringify({
          name: project.name,
          key: project.key,
          membersCount: memberCreateData.length,
          memberRoles: memberCreateData,
        }),
      },
    });

    // Record activity
    await prisma.activity.create({
      data: {
        projectId: project.id,
        userId: currentUser.id,
        action: "CREATED",
        description: `${currentUser.name} created project ${project.name} (${project.key})`,
      },
    });

    return NextResponse.json({
      success: true,
      data: project,
      message: "Project created successfully with assigned members and roles.",
    });
  } catch (error: any) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create project" } },
      { status: 500 }
    );
  }
}
