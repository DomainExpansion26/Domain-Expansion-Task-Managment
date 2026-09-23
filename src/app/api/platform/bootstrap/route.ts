import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { ROLE_PERMISSIONS, normalizeRole } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const normalizedRole = normalizeRole(currentUser.role);
    const permissions = ROLE_PERMISSIONS[normalizedRole] || [];
    const isSuper = currentUser.role === "SUPER_ADMIN";

    // Task query filter
    const taskWhere: any = {};
    if (!isSuper) {
      taskWhere.project = {
        members: {
          some: {
            userId: currentUser.id,
          },
        },
      };
    }

    // Projects query filter
    const projectWhere: any = {};
    if (!isSuper) {
      projectWhere.OR = [
        { leadId: currentUser.id },
        { managerId: currentUser.id },
        { teamLeadId: currentUser.id },
        { members: { some: { userId: currentUser.id } } },
      ];
    }

    // Fetch all core workspace data in parallel with single roundtrip
    const [tasks, projects, users, sprints, notifications, unreadCount] = await Promise.all([
      // 1. Tasks
      withDbRetry(() =>
        prisma.task.findMany({
          where: taskWhere,
          include: {
            project: {
              select: {
                id: true,
                name: true,
                key: true,
                leadId: true,
                lead: { select: { id: true, name: true, email: true, avatarUrl: true } },
                teamLeadId: true,
                teamLead: { select: { id: true, name: true, email: true, avatarUrl: true } },
                managerId: true,
                manager: { select: { id: true, name: true, email: true, avatarUrl: true } },
              },
            },
            assignees: {
              include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true } },
              },
            },
            reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
            sprint: { select: { id: true, name: true, status: true } },
            subtasks: {
              include: { assignee: { select: { id: true, name: true } } },
            },
            _count: { select: { comments: true, attachments: true } },
          },
          orderBy: [{ position: "asc" }, { createdAt: "desc" }],
          take: 500,
        })
      ),

      // 2. Projects
      withDbRetry(() =>
        prisma.project.findMany({
          where: projectWhere,
          include: {
            lead: { select: { id: true, name: true, email: true, avatarUrl: true } },
            teamLead: { select: { id: true, name: true, email: true, avatarUrl: true } },
            manager: { select: { id: true, name: true, email: true, avatarUrl: true } },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    jobTitle: true,
                    department: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            _count: {
              select: {
                tasks: true,
                members: true,
                sprints: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      ),

      // 3. Users (active directory)
      withDbRetry(() =>
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            jobTitle: true,
            department: true,
            avatarUrl: true,
            isActive: true,
            createdAt: true,
            managerId: true,
            manager: { select: { id: true, name: true, email: true, role: true } },
            teamLeadId: true,
            teamLead: { select: { id: true, name: true, email: true, role: true } },
            hrProfile: {
              select: {
                employeeId: true,
                status: true,
                joiningDate: true,
                phone: true,
              },
            },
          },
          orderBy: { name: "asc" },
        })
      ),

      // 4. Sprints
      withDbRetry(() =>
        prisma.sprint.findMany({
          include: {
            project: { select: { id: true, name: true, key: true } },
            _count: { select: { tasks: true } },
          },
          orderBy: { startDate: "desc" },
        })
      ),

      // 5. Notifications
      withDbRetry(() =>
        prisma.notification.findMany({
          where: { userId: currentUser.id },
          orderBy: { createdAt: "desc" },
          take: 40,
        })
      ),

      // 6. Unread count
      withDbRetry(() =>
        prisma.notification.count({
          where: { userId: currentUser.id, isRead: false },
        })
      ),
    ]);

    // Format tasks cleanly
    const formattedTasks = tasks.map((t) => ({
      id: t.id,
      taskKey: t.taskKey,
      title: t.title,
      description: t.description,
      acceptanceCriteria: t.acceptanceCriteria,
      taskType: t.taskType,
      status: t.status,
      priority: t.priority,
      projectId: t.projectId,
      project: t.project,
      sprintId: t.sprintId,
      sprint: t.sprint,
      startDate: (t as any).startDate,
      endDate: (t as any).endDate,
      dueDate: t.dueDate,
      estimatedHours: t.estimatedHours,
      loggedHours: t.loggedHours,
      progress: (t as any).progress ?? 0,
      position: t.position,
      reporter: t.reporter,
      assignees: t.assignees.map((a) => a.user),
      watchers: [],
      shares: [],
      subtasks: t.subtasks,
      commentsCount: t._count.comments,
      attachmentsCount: t._count.attachments,
      watchersCount: 0,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        user: currentUser,
        permissions,
        tasks: formattedTasks,
        projects,
        users,
        sprints,
        notifications,
        unreadCount,
      },
    });
  } catch (error: any) {
    console.error("Bootstrap API error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to bootstrap workspace" } },
      { status: 500 }
    );
  }
}
