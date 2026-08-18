import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    if (search) {
      where.OR = [
        { taskKey: { contains: search } },
        { title: { contains: search } },
        { description: { contains: search } },
      ];
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

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, key: true } },
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
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });

    const formatted = tasks.map((t) => ({
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
      dueDate: t.dueDate,
      estimatedHours: t.estimatedHours,
      loggedHours: t.loggedHours,
      position: t.position,
      reporter: t.reporter,
      assignees: t.assignees.map((a) => a.user),
      subtasks: t.subtasks,
      commentsCount: t._count.comments,
      attachmentsCount: t._count.attachments,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
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
      dueDate,
      estimatedHours = 0,
      subtasks = [],
    } = await request.json();

    if (!title || !projectId) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Title and project are required" } },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { tasks: { select: { id: true } } },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    // Generate unique sequential task key, e.g. WEB-106
    const taskCount = await prisma.task.count({ where: { projectId } });
    const taskKey = `${project.key}-${100 + taskCount + 1}`;

    const task = await prisma.task.create({
      data: {
        taskKey,
        title,
        description,
        acceptanceCriteria,
        projectId,
        sprintId: sprintId || null,
        taskType,
        status,
        priority,
        reporterId: currentUser.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: Number(estimatedHours) || 0,
        position: taskCount,
        assignees: {
          create: assigneeIds.map((userId: string) => ({ userId })),
        },
        subtasks: {
          create: subtasks.map((st: string | { title: string; completed?: boolean }) => ({
            title: typeof st === "string" ? st : st.title,
            completed: typeof st === "object" ? Boolean(st.completed) : false,
          })),
        },
      },
      include: {
        project: true,
        assignees: { include: { user: true } },
        subtasks: true,
        reporter: true,
      },
    });

    // Record activity
    await prisma.activity.create({
      data: {
        taskId: task.id,
        projectId: task.projectId,
        userId: currentUser.id,
        action: "CREATED",
        description: `${currentUser.name} created ${task.taskKey}: ${task.title}`,
      },
    });

    // Trigger automations for assigned users
    for (const assigneeId of assigneeIds) {
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

    eventHub.emit("task_created", { taskKey: task.taskKey, projectId: task.projectId });

    return NextResponse.json({
      success: true,
      data: task,
      message: `Task ${task.taskKey} created successfully`,
    });
  } catch (error: any) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create task" } },
      { status: 500 }
    );
  }
}
