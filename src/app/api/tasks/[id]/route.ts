import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
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
            members: { include: { user: true } },
            sprints: true,
          },
        },
        assignees: { include: { user: true } },
        reporter: true,
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
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...task,
        assignees: task.assignees.map((a) => a.user),
      },
    });
  } catch (error: any) {
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
      include: { assignees: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
        { status: 404 }
      );
    }

    const updateData: any = {};
    const activitiesToCreate: any[] = [];

    // Check status change
    if (body.status && body.status !== existing.status) {
      updateData.status = body.status;
      activitiesToCreate.push({
        taskId: existing.id,
        projectId: existing.projectId,
        userId: currentUser.id,
        action: "STATUS_CHANGED",
        fieldChanged: "status",
        oldValue: existing.status,
        newValue: body.status,
        description: `${currentUser.name} moved ${existing.taskKey} from ${existing.status} to ${body.status}`,
      });
    }

    // Check priority change
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
        description: `${currentUser.name} changed priority of ${existing.taskKey} to ${body.priority}`,
      });
    }

    // Check title/description
    if (body.title && body.title !== existing.title) {
      updateData.title = body.title;
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.acceptanceCriteria !== undefined) {
      updateData.acceptanceCriteria = body.acceptanceCriteria;
    }
    if (body.taskType && body.taskType !== existing.taskType) {
      updateData.taskType = body.taskType;
    }
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }
    if (body.sprintId !== undefined) {
      updateData.sprintId = body.sprintId || null;
    }
    if (body.loggedHours !== undefined) {
      updateData.loggedHours = Number(body.loggedHours);
    }
    if (body.position !== undefined) {
      updateData.position = Number(body.position);
    }

    // Handle Assignees update
    if (body.assigneeIds && Array.isArray(body.assigneeIds)) {
      await prisma.taskAssignee.deleteMany({ where: { taskId: existing.id } });
      await prisma.taskAssignee.createMany({
        data: body.assigneeIds.map((userId: string) => ({
          taskId: existing.id,
          userId,
        })),
      });

      // Record assignment activity
      activitiesToCreate.push({
        taskId: existing.id,
        projectId: existing.projectId,
        userId: currentUser.id,
        action: "ASSIGNED",
        description: `${currentUser.name} updated assignees for ${existing.taskKey}`,
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
        project: true,
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

    // Fire status change automations
    if (body.status && body.status !== existing.status) {
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

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        assignees: updated.assignees.map((a) => a.user),
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
