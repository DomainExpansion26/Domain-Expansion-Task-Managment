import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission, isSuperAdmin, isManager, isTeamLead } from "@/lib/permissions";
import { processAutomations } from "@/lib/automations";
import { eventHub } from "@/lib/events";

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

    const task = await prisma.task.findFirst({
      where: {
        OR: [{ id }, { taskKey: id.toUpperCase() }],
      },
      include: {
        project: {
          include: {
            lead: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
            teamLead: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
            manager: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
              },
            },
            sprints: true,
          },
        },
        assignees: { include: { user: true } },
        reporter: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        sprint: true,
        subtasks: {
          include: { assignee: true },
          orderBy: { createdAt: "asc" },
        },
        comments: {
          include: { author: true },
          orderBy: { createdAt: "asc" },
        },
        attachments: {
          include: { uploadedBy: true },
          orderBy: { createdAt: "desc" },
        },
        activities: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
        qaBugs: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true } },
            createdBy: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true } },
            comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
            activities: { include: { user: true }, orderBy: { createdAt: "desc" } },
          },
          orderBy: { createdAt: "desc" },
        },
        relationsAsSource: {
          include: { targetTask: { select: { id: true, taskKey: true, title: true, status: true, priority: true } } },
        },
        relationsAsTarget: {
          include: { sourceTask: { select: { id: true, taskKey: true, title: true, status: true, priority: true } } },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
        { status: 404 }
      );
    }

    // Fetch watchers & shares safely
    let taskWatchers: any[] = [];
    let taskShares: any[] = [];
    let accountableUser: any = null;

    try {
      taskWatchers = (await prisma.$queryRaw`
        SELECT w.id, w."taskId", w."userId", u.name, u.email, u."avatarUrl", u.role
        FROM "TaskWatcher" w
        JOIN "User" u ON w."userId" = u.id
        WHERE w."taskId" = ${task.id}
      `) as any[];
    } catch {
      taskWatchers = [];
    }

    try {
      taskShares = (await prisma.$queryRaw`
        SELECT s.id, s."taskId", s."userId", u.name, u.email, u."avatarUrl", u.role, sb.name as "sharedByName"
        FROM "TaskShare" s
        JOIN "User" u ON s."userId" = u.id
        JOIN "User" sb ON s."sharedById" = sb.id
        WHERE s."taskId" = ${task.id}
      `) as any[];
    } catch {
      taskShares = [];
    }

    if ((task as any).accountableId) {
      try {
        accountableUser = await prisma.user.findUnique({
          where: { id: (task as any).accountableId },
          select: { id: true, name: true, email: true, avatarUrl: true, role: true },
        });
      } catch {
        accountableUser = null;
      }
    }

    const bugs = task.qaBugs || [];
    const bugStats = {
      total: bugs.length,
      open: bugs.filter((b) => b.status === "OPEN" || b.status === "ASSIGNED" || b.status === "IN_PROGRESS").length,
      readyForTesting: bugs.filter((b) => b.status === "READY_FOR_TESTING").length,
      inTesting: bugs.filter((b) => b.status === "IN_TESTING").length,
      passed: bugs.filter((b) => b.status === "PASSED" || b.status === "CLOSED").length,
      failed: bugs.filter((b) => b.status === "FAILED" || b.status === "REOPENED").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        ...task,
        progress: (task as any).progress ?? 0,
        category: (task as any).category,
        version: (task as any).version,
        accountable: accountableUser,
        accountableId: (task as any).accountableId,
        assignees: task.assignees.map((a) => a.user),
        watchers: taskWatchers,
        isWatching: taskWatchers.some((w: any) => w.userId === currentUser.id),
        shares: taskShares,
        bugStats,
      },
    });
  } catch (error: any) {
    console.error("Task detail fetch error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch task" } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "task.update")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.task.findFirst({
      where: { OR: [{ id }, { taskKey: id.toUpperCase() }] },
      include: {
        assignees: { include: { user: true } },
        project: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
        { status: 404 }
      );
    }

    const updateData: any = {};
    const activitiesToCreate: any[] = [];
    const isSuper = isSuperAdmin(currentUser);

    // 1. Status change & Closed Protection
    if (body.status && body.status !== existing.status) {
      // If task is currently CLOSED and non-super-admin tries to change status:
      if (existing.status === "CLOSED" && body.status !== "CLOSED" && !isSuper) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Closed tasks are locked. Only Super Admins can reopen closed tasks. Please submit a Reopen Request to notify the Super Admin.",
            },
          },
          { status: 403 }
        );
      }

      updateData.status = body.status;
      activitiesToCreate.push({
        taskId: existing.id,
        projectId: existing.projectId,
        userId: currentUser.id,
        action: "STATUS_CHANGED",
        fieldChanged: "status",
        oldValue: existing.status,
        newValue: body.status,
        description: `Status changed from ${existing.status} to ${body.status}`,
      });
    }

    // Accountable user change
    let newAccountableId: string | null = null;
    if (body.accountableId !== undefined) {
      const sanitizedAccountableId = body.accountableId ? String(body.accountableId) : null;
      if (sanitizedAccountableId !== (existing as any).accountableId) {
        updateData.accountableId = sanitizedAccountableId;
        newAccountableId = sanitizedAccountableId;
        activitiesToCreate.push({
          taskId: existing.id,
          projectId: existing.projectId,
          userId: currentUser.id,
          action: "UPDATED",
          fieldChanged: "accountable",
          oldValue: (existing as any).accountableId || null,
          newValue: sanitizedAccountableId,
          description: `Accountable reviewer updated`,
        });
      }
    }

    // 2. Priority change
    if (body.priority && body.priority !== existing.priority) {
      updateData.priority = body.priority;
      activitiesToCreate.push({
        taskId: existing.id,
        projectId: existing.projectId,
        userId: currentUser.id,
        action: "UPDATED",
        fieldChanged: "priority",
        oldValue: existing.priority,
        newValue: body.priority,
        description: `Priority changed from ${existing.priority} to ${body.priority}`,
      });
    }

    // 3. Title change
    if (body.title && body.title !== existing.title) {
      updateData.title = body.title;
      activitiesToCreate.push({
        taskId: existing.id,
        projectId: existing.projectId,
        userId: currentUser.id,
        action: "UPDATED",
        fieldChanged: "title",
        oldValue: existing.title,
        newValue: body.title,
        description: `Subject changed to "${body.title}"`,
      });
    }

    // 4. Description change
    if (body.description !== undefined && body.description !== existing.description) {
      updateData.description = body.description;
      activitiesToCreate.push({
        taskId: existing.id,
        projectId: existing.projectId,
        userId: currentUser.id,
        action: "UPDATED",
        fieldChanged: "description",
        description: `Description updated`,
      });
    }

    if (body.acceptanceCriteria !== undefined) {
      updateData.acceptanceCriteria = body.acceptanceCriteria;
    }

    if (body.taskType && body.taskType !== existing.taskType) {
      updateData.taskType = body.taskType;
      activitiesToCreate.push({
        taskId: existing.id,
        projectId: existing.projectId,
        userId: currentUser.id,
        action: "UPDATED",
        fieldChanged: "taskType",
        oldValue: existing.taskType,
        newValue: body.taskType,
        description: `Type changed from ${existing.taskType} to ${body.taskType}`,
      });
    }

    // 5. Dates change
    if (body.startDate !== undefined) {
      const newStartDate = body.startDate ? new Date(body.startDate) : null;
      updateData.startDate = newStartDate;
      activitiesToCreate.push({
        taskId: existing.id,
        projectId: existing.projectId,
        userId: currentUser.id,
        action: "UPDATED",
        fieldChanged: "startDate",
        description: `Start date set to ${body.startDate ? new Date(body.startDate).toLocaleDateString() : "None"}`,
      });
    }

    if (body.endDate !== undefined) {
      const newEndDate = body.endDate ? new Date(body.endDate) : null;
      updateData.endDate = newEndDate;
      activitiesToCreate.push({
        taskId: existing.id,
        projectId: existing.projectId,
        userId: currentUser.id,
        action: "UPDATED",
        fieldChanged: "endDate",
        description: `End date set to ${body.endDate ? new Date(body.endDate).toLocaleDateString() : "None"}`,
      });
    }

    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    // 6. Progress, Category & Version (activity tracking)
    if (body.progress !== undefined) {
      const newProgress = Math.min(100, Math.max(0, parseInt(body.progress, 10) || 0));
      activitiesToCreate.push({
        taskId: existing.id,
        projectId: existing.projectId,
        userId: currentUser.id,
        action: "UPDATED",
        fieldChanged: "progress",
        oldValue: `${(existing as any).progress ?? 0}%`,
        newValue: `${newProgress}%`,
        description: `% Complete changed to ${newProgress}%`,
      });
    }

    // 9. Estimates & Logged hours
    if (body.estimatedHours !== undefined) {
      updateData.estimatedHours = Number(body.estimatedHours);
      activitiesToCreate.push({
        taskId: existing.id,
        projectId: existing.projectId,
        userId: currentUser.id,
        action: "UPDATED",
        fieldChanged: "estimatedHours",
        oldValue: String(existing.estimatedHours || 0),
        newValue: String(body.estimatedHours),
        description: `Estimated hours set to ${body.estimatedHours}h`,
      });
    }

    if (body.addLoggedHours !== undefined && Number(body.addLoggedHours) > 0) {
      const added = Number(body.addLoggedHours);
      const newTotal = (existing.loggedHours || 0) + added;
      updateData.loggedHours = newTotal;
      activitiesToCreate.push({
        taskId: existing.id,
        projectId: existing.projectId,
        userId: currentUser.id,
        action: "UPDATED",
        fieldChanged: "loggedHours",
        oldValue: String(existing.loggedHours || 0),
        newValue: String(newTotal),
        description: `Logged ${added}h${body.worklogNote ? ` ("${body.worklogNote}")` : ""}`,
      });
    } else if (body.loggedHours !== undefined) {
      updateData.loggedHours = Number(body.loggedHours);
    }

    if (body.position !== undefined) {
      updateData.position = Number(body.position);
    }

    // 10. Handle Assignees update
    if (body.assigneeIds && Array.isArray(body.assigneeIds)) {
      await prisma.taskAssignee.deleteMany({ where: { taskId: existing.id } });
      if (body.assigneeIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: body.assigneeIds.map((userId: string) => ({
            taskId: existing.id,
            userId,
          })),
        });
      }

      // Record assignment activity
      activitiesToCreate.push({
        taskId: existing.id,
        projectId: existing.projectId,
        userId: currentUser.id,
        action: "ASSIGNED",
        description: `Assignee updated`,
      });

      for (const newAssigneeId of body.assigneeIds) {
        if (!existing.assignees.some((a) => a.userId === newAssigneeId)) {
          await processAutomations({
            triggerType: "TASK_ASSIGNED",
            taskId: existing.id,
            projectId: existing.projectId,
            metadata: {
              assigneeId: newAssigneeId,
              assignerName: currentUser.name,
            },
          });
        }
      }
    }

    const updated = await prisma.task.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        project: {
          include: {
            lead: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
            teamLead: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
            manager: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
              },
            },
            sprints: true,
          },
        },
        assignees: { include: { user: true } },
        reporter: true,
        sprint: true,
        subtasks: true,
      },
    });

    // Create recorded activities
    for (const act of activitiesToCreate) {
      await prisma.activity.create({ data: act });
    }

    // Trigger notification for newly assigned accountable reviewer
    if (newAccountableId && newAccountableId !== currentUser.id) {
      try {
        await prisma.notification.create({
          data: {
            userId: newAccountableId,
            type: "TASK_ASSIGNED",
            title: `Review Assigned: #${existing.taskKey}`,
            message: `${currentUser.name} assigned you as Accountable for review on ${existing.taskKey}: "${existing.title}"`,
            taskId: existing.taskKey,
            isRead: false,
          },
        });
      } catch (e) {
        console.warn("Accountable notification warning:", e);
      }
    }

    // Fire status change automations & notifications
    if (body.status && body.status !== existing.status) {
      // If task was closed
      if (body.status === "CLOSED") {
        const notifyUserIds = new Set<string>();
        if (existing.reporterId && existing.reporterId !== currentUser.id) notifyUserIds.add(existing.reporterId);
        existing.assignees?.forEach((a) => {
          if (a.userId && a.userId !== currentUser.id) notifyUserIds.add(a.userId);
        });

        for (const uId of notifyUserIds) {
          try {
            await prisma.notification.create({
              data: {
                userId: uId,
                type: "TASK_STATUS_CHANGED",
                title: `Task Closed & Verified: #${existing.taskKey}`,
                message: `${currentUser.name} has reviewed and closed task ${existing.taskKey}: "${existing.title}"`,
                taskId: existing.taskKey,
                isRead: false,
              },
            });
          } catch (e) {}
        }
      }

      // If a closed task was reopened by Super Admin
      if (existing.status === "CLOSED" && body.status !== "CLOSED") {
        const notifyUserIds = new Set<string>();
        if (existing.reporterId && existing.reporterId !== currentUser.id) notifyUserIds.add(existing.reporterId);
        existing.assignees?.forEach((a) => {
          if (a.userId && a.userId !== currentUser.id) notifyUserIds.add(a.userId);
        });
        if ((existing as any).accountableId && (existing as any).accountableId !== currentUser.id) {
          notifyUserIds.add((existing as any).accountableId);
        }

        for (const uId of notifyUserIds) {
          try {
            await prisma.notification.create({
              data: {
                userId: uId,
                type: "TASK_STATUS_CHANGED",
                title: `Task Reopened by Super Admin: #${existing.taskKey}`,
                message: `Super Admin ${currentUser.name} reopened task ${existing.taskKey} to ${body.status}`,
                taskId: existing.taskKey,
                isRead: false,
              },
            });
          } catch (e) {}
        }
      }

      await processAutomations({
        triggerType: "STATUS_CHANGED",
        taskId: existing.id,
        projectId: existing.projectId,
        metadata: {
          toStatus: body.status,
          fromStatus: existing.status,
          actorId: currentUser.id,
          actorName: currentUser.name,
        },
      });

      eventHub.emit("task_status_changed", {
        taskId: existing.id,
        taskKey: existing.taskKey,
        status: body.status,
      });
    }

    // Fetch watchers & accountable
    let taskWatchers: any[] = [];
    let accountableUser: any = null;
    try {
      taskWatchers = (await prisma.$queryRaw`
        SELECT w.id, w."taskId", w."userId", u.name, u.email, u."avatarUrl", u.role
        FROM "TaskWatcher" w
        JOIN "User" u ON w."userId" = u.id
        WHERE w."taskId" = ${updated.id}
      `) as any[];
    } catch {
      taskWatchers = [];
    }

    if ((updated as any).accountableId) {
      try {
        accountableUser = await prisma.user.findUnique({
          where: { id: (updated as any).accountableId },
          select: { id: true, name: true, email: true, avatarUrl: true, role: true },
        });
      } catch {
        accountableUser = null;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        progress: (updated as any).progress ?? 0,
        category: (updated as any).category,
        version: (updated as any).version,
        accountable: accountableUser,
        accountableId: (updated as any).accountableId,
        assignees: updated.assignees.map((a) => a.user),
        watchers: taskWatchers,
        isWatching: taskWatchers.some((w: any) => w.userId === currentUser.id),
      },
      message: `Task ${existing.taskKey} updated`,
    });
  } catch (error: any) {
    console.error("Update task error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update task" } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "task.delete")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const task = await prisma.task.findFirst({
      where: { OR: [{ id }, { taskKey: id.toUpperCase() }] },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
        { status: 404 }
      );
    }

    await prisma.task.delete({ where: { id: task.id } });

    return NextResponse.json({
      success: true,
      message: `Task ${task.taskKey} deleted successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to delete task" } },
      { status: 500 }
    );
  }
}
