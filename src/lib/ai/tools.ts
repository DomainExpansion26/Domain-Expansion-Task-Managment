import { prisma } from "../prisma";

export interface ToolContext {
  userId: string;
  userRole: string;
}

export async function getUserAccessibleProjectIds(userId: string, userRole: string): Promise<string[]> {
  if (userRole === "SUPER_ADMIN") {
    const all = await prisma.project.findMany({ select: { id: true } });
    return all.map((p) => p.id);
  }
  const members = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });
  return members.map((m) => m.projectId);
}

// 1. Read Tools
export async function getMyTasks(ctx: ToolContext) {
  const tasks = await prisma.task.findMany({
    where: {
      assignees: {
        some: { userId: ctx.userId },
      },
    },
    include: {
      project: { select: { name: true, key: true } },
      subtasks: true,
      assignees: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
  });

  return tasks.map((t) => ({
    key: t.taskKey,
    title: t.title,
    status: t.status,
    priority: t.priority,
    project: t.project.name,
    dueDate: t.dueDate?.toISOString().split("T")[0] || "None",
    subtasksCompleted: t.subtasks.filter((s) => s.completed).length,
    subtasksTotal: t.subtasks.length,
  }));
}

export async function getOverdueTasks(ctx: ToolContext) {
  const allowedProjectIds = await getUserAccessibleProjectIds(ctx.userId, ctx.userRole);
  const now = new Date();

  const tasks = await prisma.task.findMany({
    where: {
      projectId: { in: allowedProjectIds },
      dueDate: { lt: now },
      status: { not: "DONE" },
    },
    include: {
      project: { select: { name: true, key: true } },
      assignees: { include: { user: { select: { name: true } } } },
    },
    orderBy: { dueDate: "asc" },
  });

  return tasks.map((t) => ({
    key: t.taskKey,
    title: t.title,
    status: t.status,
    priority: t.priority,
    project: t.project.name,
    dueDate: t.dueDate?.toISOString().split("T")[0],
    assignees: t.assignees.map((a) => a.user.name).join(", ") || "Unassigned",
  }));
}

export async function getBlockedTasks(ctx: ToolContext) {
  const allowedProjectIds = await getUserAccessibleProjectIds(ctx.userId, ctx.userRole);

  const tasks = await prisma.task.findMany({
    where: {
      projectId: { in: allowedProjectIds },
      status: "BLOCKED",
    },
    include: {
      project: { select: { name: true, key: true } },
      assignees: { include: { user: { select: { name: true } } } },
    },
  });

  return tasks.map((t) => ({
    key: t.taskKey,
    title: t.title,
    priority: t.priority,
    project: t.project.name,
    assignees: t.assignees.map((a) => a.user.name).join(", ") || "Unassigned",
    description: t.description,
  }));
}

export async function getProjectStatus(projectNameOrKey: string, ctx: ToolContext) {
  const allowedProjectIds = await getUserAccessibleProjectIds(ctx.userId, ctx.userRole);

  const project = await prisma.project.findFirst({
    where: {
      id: { in: allowedProjectIds },
      OR: [
        { key: { equals: projectNameOrKey } },
        { name: { contains: projectNameOrKey } },
      ],
    },
    include: {
      tasks: true,
      lead: { select: { name: true } },
      sprints: true,
      members: { include: { user: { select: { name: true, role: true } } } },
    },
  });

  if (!project) {
    return { error: `Project '${projectNameOrKey}' not found or access restricted.` };
  }

  const total = project.tasks.length;
  const done = project.tasks.filter((t) => t.status === "DONE").length;
  const inProgress = project.tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const todo = project.tasks.filter((t) => t.status === "TODO").length;
  const blocked = project.tasks.filter((t) => t.status === "BLOCKED").length;
  const inReview = project.tasks.filter((t) => t.status === "IN_REVIEW").length;
  const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    projectName: project.name,
    key: project.key,
    lead: project.lead?.name || "Unassigned",
    progress: `${progressPercent}%`,
    totalTasks: total,
    completed: done,
    inProgress,
    inReview,
    todo,
    blocked,
    activeSprint: project.sprints.find((s) => s.status === "ACTIVE")?.name || "None",
    membersCount: project.members.length,
  };
}

export async function searchTasks(query: string, ctx: ToolContext) {
  const allowedProjectIds = await getUserAccessibleProjectIds(ctx.userId, ctx.userRole);

  const tasks = await prisma.task.findMany({
    where: {
      projectId: { in: allowedProjectIds },
      OR: [
        { taskKey: { contains: query } },
        { title: { contains: query } },
        { description: { contains: query } },
      ],
    },
    include: {
      project: { select: { name: true, key: true } },
      assignees: { include: { user: { select: { name: true } } } },
    },
    take: 10,
  });

  return tasks.map((t) => ({
    key: t.taskKey,
    title: t.title,
    status: t.status,
    priority: t.priority,
    project: t.project.name,
    assignees: t.assignees.map((a) => a.user.name).join(", "),
  }));
}
