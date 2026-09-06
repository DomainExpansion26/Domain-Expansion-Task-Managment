import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: { OR: [{ id }, { taskKey: id.toUpperCase() }] },
      include: {
        parentTask: {
          select: { id: true, taskKey: true, title: true, status: true, priority: true },
        },
        childTasks: {
          select: { id: true, taskKey: true, title: true, status: true, priority: true },
        },
        relationsAsSource: {
          include: {
            targetTask: { select: { id: true, taskKey: true, title: true, status: true, priority: true } },
          },
        },
        relationsAsTarget: {
          include: {
            sourceTask: { select: { id: true, taskKey: true, title: true, status: true, priority: true } },
          },
        },
        qaTickets: {
          include: {
            bugs: { select: { id: true, bugKey: true, title: true, status: true, severity: true } },
            assignedTo: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Task not found" } }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        taskId: task.id,
        taskKey: task.taskKey,
        parent: task.parentTask,
        children: task.childTasks,
        relatedTasks: [
          ...task.relationsAsSource.map((r) => ({ relationId: r.id, type: r.relationType, task: r.targetTask, direction: "OUTGOING" })),
          ...task.relationsAsTarget.map((r) => ({ relationId: r.id, type: r.relationType, task: r.sourceTask, direction: "INCOMING" })),
        ],
        qaTickets: task.qaTickets,
        qaBugs: task.qaTickets.flatMap((t) => t.bugs),
      },
    });
  } catch (error: any) {
    console.error("Task relations error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch task relations" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { id } = await params;
    const { targetTaskId, relationType = "RELATES_TO" } = await request.json();

    const sourceTask = await prisma.task.findFirst({
      where: { OR: [{ id }, { taskKey: id.toUpperCase() }] },
    });

    const targetTask = await prisma.task.findFirst({
      where: { OR: [{ id: targetTaskId }, { taskKey: targetTaskId?.toUpperCase() }] },
    });

    if (!sourceTask || !targetTask) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Source or Target task not found" } }, { status: 404 });
    }

    if (sourceTask.id === targetTask.id) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Cannot relate a task to itself" } }, { status: 400 });
    }

    const relation = await prisma.taskRelation.create({
      data: {
        sourceTaskId: sourceTask.id,
        targetTaskId: targetTask.id,
        relationType,
      },
      include: {
        targetTask: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: relation,
      message: `Relation created between ${sourceTask.taskKey} and ${targetTask.taskKey}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to create relation" } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const relationId = searchParams.get("relationId");

    if (!relationId) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "relationId is required" } }, { status: 400 });
    }

    await prisma.taskRelation.delete({
      where: { id: relationId },
    });

    return NextResponse.json({
      success: true,
      message: "Task relation deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete task relation error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to delete relation" } }, { status: 500 });
  }
}

