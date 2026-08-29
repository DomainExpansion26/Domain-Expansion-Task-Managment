import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { processAutomations } from "@/lib/automations";
import { eventHub } from "@/lib/events";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view"); // all-open, latest-activity, recently-created, overdue, summary, created-by-me, assigned-to-me, shared-with-me, shared-with-users
    const projectId = searchParams.get("projectId");
    const sprintId = searchParams.get("sprintId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const taskType = searchParams.get("taskType");
    const search = searchParams.get("search");
    const myWork = searchParams.get("myWork");

    const where: any = {};

    if (projectId) where.projectId = projectId;
    if (sprintId === "null" || sprintId === "backlog") {
      where.sprintId = null;
    } else if (sprintId) {
      where.sprintId = sprintId;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (taskType) where.taskType = taskType;

    if (assigneeId) {
      where.assignees = { some: { userId: assigneeId } };
    }

    if (myWork === "true") {
      where.assignees = { some: { userId: currentUser.id } };
    }

    // View-based filtering matching OpenProject specification
    if (view === "all-open") {
      where.status = { notIn: ["COMPLETED", "CLOSED", "DONE"] };
    } else if (view === "overdue") {
      where.status = { notIn: ["COMPLETED", "CLOSED", "DONE"] };
      where.OR = [
        { dueDate: { lt: new Date() } },
        { endDate: { lt: new Date() } },
      ];
    } else if (view === "created-by-me") {
      where.reporterId = currentUser.id;
    } else if (view === "assigned-to-me") {
      where.assignees = { some: { userId: currentUser.id } };
    }

    if (search) {
      const searchFilter = {
        OR: [
          { taskKey: { contains: search, mode: "insensitive" } },
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { assignees: { some: { user: { name: { contains: search, mode: "insensitive" } } } } },
          { reporter: { name: { contains: search, mode: "insensitive" } } },
        ],
      };
      if (where.OR) {
        where.AND = [{ OR: where.OR }, searchFilter];
        delete where.OR;
      } else {
        where.OR = searchFilter.OR;
      }
    }

    // Project membership scoping: Non-superadmins only see tasks in assigned projects
    if (currentUser.role !== "SUPER_ADMIN") {
      where.project = {
        members: {
          some: {
            userId: currentUser.id,
          },
        },
      };
    }

    // Sorting
    let orderBy: any[] = [{ position: "asc" }, { createdAt: "desc" }];
    if (view === "latest-activity") {
      orderBy = [{ updatedAt: "desc" }];
    } else if (view === "recently-created") {
      orderBy = [{ createdAt: "desc" }];
    }

    const tasks = await withDbRetry(() =>
      prisma.task.findMany({
        where,
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
              user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
            },
          },
          reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
          sprint: { select: { id: true, name: true, status: true } },
          subtasks: {
            include: { assignee: { select: { id: true, name: true } } },
          },
          _count: { select: { comments: true, attachments: true } },
        },
        orderBy,
      })
    );

    // Fetch watchers & shares safely
    const taskIds = tasks.map((t) => t.id);
    let allWatchers: any[] = [];
    let allShares: any[] = [];

    if (taskIds.length > 0) {
      try {
        allWatchers = (await prisma.$queryRaw`
          SELECT w.id, w."taskId", w."userId", u.name, u.email, u."avatarUrl", u.role
          FROM "TaskWatcher" w
          JOIN "User" u ON w."userId" = u.id
          WHERE w."taskId" IN (${taskIds.join(",")})
        `) as any[];
      } catch {
        allWatchers = [];
      }

      try {
        allShares = (await prisma.$queryRaw`
          SELECT s.id, s."taskId", s."userId", u.name, u.email, u."avatarUrl", u.role, sb.name as "sharedByName"
          FROM "TaskShare" s
          JOIN "User" u ON s."userId" = u.id
          JOIN "User" sb ON s."sharedById" = sb.id
          WHERE s."taskId" IN (${taskIds.join(",")})
        `) as any[];
      } catch {
        allShares = [];
      }
    }

    const formatted = tasks.map((t) => {
      const taskWatchers = allWatchers.filter((w) => w.taskId === t.id);
      const taskShares = allShares.filter((s) => s.taskId === t.id);

      return {
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
        watchers: taskWatchers,
        isWatching: taskWatchers.some((w) => w.userId === currentUser.id),
        shares: taskShares,
        subtasks: t.subtasks,
        commentsCount: t._count.comments,
        attachmentsCount: t._count.attachments,
        watchersCount: taskWatchers.length,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });

    // View post-filter for shared-with-me and shared-with-users if applicable
    let result = formatted;
    if (view === "shared-with-me") {
      result = formatted.filter((t) => t.shares.some((s: any) => s.userId === currentUser.id));
    } else if (view === "shared-with-users") {
      result = formatted.filter((t) => t.shares.length > 0);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Tasks list error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch tasks" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "task.create")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You lack permission to create tasks" } },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      acceptanceCriteria,
      projectId,
      sprintId,
      taskType = "TASK",
      status = "TODO",
      priority = "MEDIUM",
      assigneeIds = [],
      accountableId,
      startDate,
      endDate,
      dueDate,
      estimatedHours = 0,
      subtasks = [],
    } = await request.json();

    if (!title?.trim() || !projectId) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Task title and project are required" } },
        { status: 400 }
      );
    }

    const rawAssigneeList: string[] = Array.isArray(assigneeIds)
      ? assigneeIds
      : assigneeIds
      ? [assigneeIds]
      : [currentUser.id];

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { select: { userId: true } },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Selected project not found" } },
        { status: 404 }
      );
    }

    const isSuper = currentUser.role === "SUPER_ADMIN";
    const isMemberOfProject = project.members.some((m) => m.userId === currentUser.id);
    const isProjectLeadOrManager =
      project.leadId === currentUser.id ||
      project.managerId === currentUser.id ||
      project.teamLeadId === currentUser.id ||
      currentUser.role === "MANAGER" ||
      currentUser.role === "PROJECT_MANAGER";

    if (!isSuper && !isMemberOfProject && !isProjectLeadOrManager) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You are not authorized to create tasks in this project" } },
        { status: 403 }
      );
    }

    // Only assign members who belong to this project or valid users
    const projectMemberUserIds = new Set(project.members.map((m) => m.userId));
    if (project.leadId) projectMemberUserIds.add(project.leadId);
    if (project.managerId) projectMemberUserIds.add(project.managerId);
    if (project.teamLeadId) projectMemberUserIds.add(project.teamLeadId);

    // Deduplicate and filter assignees
    let uniqueAssigneeIds = Array.from(new Set(rawAssigneeList)).filter(
      (uId: string) => isSuper || projectMemberUserIds.size === 0 || projectMemberUserIds.has(uId)
    );

    if (uniqueAssigneeIds.length === 0 && rawAssigneeList.length > 0) {
      uniqueAssigneeIds = rawAssigneeList;
    }
    if (uniqueAssigneeIds.length === 0 && currentUser.id) {
      uniqueAssigneeIds = [currentUser.id];
    }

    // Generate collision-proof unique sequential task key (e.g. TGB-103)
    const existingTasks = await prisma.task.findMany({
      where: { projectId },
      select: { taskKey: true },
    });

    let maxNum = 100;
    for (const t of existingTasks) {
      const match = t.taskKey.match(new RegExp(`^${project.key}-(\\d+)$`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    let nextNum = maxNum + 1;
    let taskKey = `${project.key}-${nextNum}`;
    while (await prisma.task.findUnique({ where: { taskKey } })) {
      nextNum++;
      taskKey = `${project.key}-${nextNum}`;
    }

    const taskCount = existingTasks.length;

    // Sanitize subtasks
    const sanitizedSubtasks = (subtasks || [])
      .filter((st: any) => (typeof st === "string" ? st.trim().length > 0 : Boolean(st?.title?.trim())))
      .map((st: any) => ({
        title: typeof st === "string" ? st.trim() : st.title.trim(),
        completed: typeof st === "object" ? Boolean(st.completed) : false,
      }));

    const task = await prisma.task.create({
      data: {
        taskKey,
        title: title.trim(),
        description: description ? description.trim() : null,
        acceptanceCriteria: acceptanceCriteria ? acceptanceCriteria.trim() : null,
        projectId,
        sprintId: sprintId || null,
        taskType,
        status,
        priority,
        reporterId: currentUser.id,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        dueDate: dueDate ? new Date(dueDate) : (endDate ? new Date(endDate) : null),
        estimatedHours: Number(estimatedHours) || 0,
        position: taskCount,
        assignees: {
          create: uniqueAssigneeIds.map((userId: string) => ({ userId })),
        },
        subtasks: {
          create: sanitizedSubtasks,
        },
      },
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
        assignees: { include: { user: true } },
        subtasks: true,
        reporter: true,
      },
    });

    // Record activity safely
    try {
      await prisma.activity.create({
        data: {
          taskId: task.id,
          projectId: task.projectId,
          userId: currentUser.id,
          action: "CREATED",
          description: `${currentUser.name} created ${task.taskKey}: ${task.title}`,
        },
      });
    } catch (e) {
      console.warn("Activity record warning:", e);
    }

    // Trigger automations for assigned users safely
    try {
      for (const assigneeId of uniqueAssigneeIds) {
        await processAutomations({
          triggerType: "TASK_ASSIGNED",
          taskId: task.id,
          projectId: task.projectId,
          metadata: {
            assigneeId,
            assignerName: currentUser.name,
          },
        });
      }
    } catch (e) {
      console.warn("Automations warning:", e);
    }

    try {
      eventHub.emit("task_created", { taskKey: task.taskKey, projectId: task.projectId });
    } catch (e) {
      // Ignored
    }

    return NextResponse.json({
      success: true,
      data: {
        ...task,
        assignees: task.assignees.map((a) => a.user),
        watchers: [],
        shares: [],
      },
      message: `Task ${task.taskKey} created successfully`,
    });
  } catch (error: any) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error?.message || "Failed to create task" } },
      { status: 500 }
    );
  }
}
