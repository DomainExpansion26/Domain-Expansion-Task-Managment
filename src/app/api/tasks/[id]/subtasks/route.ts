import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { id } = await params;
    const { title, assigneeId } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Subtask title is required" } }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { OR: [{ id }, { taskKey: id.toUpperCase() }] },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Task not found" } }, { status: 404 });
    }

    const subtask = await prisma.subtask.create({
      data: {
        parentTaskId: task.id,
        title: title.trim(),
        completed: false,
        assigneeId: assigneeId || null,
      },
      include: { assignee: true },
    });

    return NextResponse.json({ success: true, data: subtask, message: "Subtask added" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to add subtask" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { subtaskId, completed, title } = await request.json();

    const subtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data: {
        ...(completed !== undefined ? { completed: Boolean(completed) } : {}),
        ...(title ? { title } : {}),
      },
    });

    return NextResponse.json({ success: true, data: subtask, message: "Subtask updated" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update subtask" } }, { status: 500 });
  }
}
