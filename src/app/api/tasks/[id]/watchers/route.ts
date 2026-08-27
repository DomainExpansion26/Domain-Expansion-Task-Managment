import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";

// GET /api/tasks/[id]/watchers - List watchers
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
      where: { OR: [{ id }, { taskKey: id.toUpperCase() }] },
      select: { id: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
        { status: 404 }
      );
    }

    const watchers = await prisma.taskWatcher.findMany({
      where: { taskId: task.id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const isWatching = watchers.some((w) => w.userId === currentUser.id);

    return NextResponse.json({
      success: true,
      data: {
        watchers: watchers.map((w) => w.user),
        isWatching,
        totalWatchers: watchers.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to get watchers" } },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/watchers - Toggle or add watcher
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
    const task = await prisma.task.findFirst({
      where: { OR: [{ id }, { taskKey: id.toUpperCase() }] },
      select: { id: true, taskKey: true, projectId: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
        { status: 404 }
      );
    }

    let targetUserId = currentUser.id;
    try {
      const body = await request.json();
      if (body.userId) targetUserId = body.userId;
    } catch {
      // Body may be empty when toggling self
    }

    const existing = await prisma.taskWatcher.findUnique({
      where: {
        taskId_userId: { taskId: task.id, userId: targetUserId },
      },
    });

    let isWatching = false;
    if (existing) {
      await prisma.taskWatcher.delete({
        where: { id: existing.id },
      });
      isWatching = false;
    } else {
      await prisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: targetUserId,
        },
      });
      isWatching = true;
    }

    const watchers = await prisma.taskWatcher.findMany({
      where: { taskId: task.id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        isWatching,
        watchers: watchers.map((w) => w.user),
        totalWatchers: watchers.length,
      },
      message: isWatching ? "You are now watching this task" : "Removed from watchers",
    });
  } catch (error: any) {
    console.error("Watchers error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update watchers" } },
      { status: 500 }
    );
  }
}
