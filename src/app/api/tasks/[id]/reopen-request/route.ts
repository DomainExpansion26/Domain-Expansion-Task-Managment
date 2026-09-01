import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { eventHub } from "@/lib/events";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const reason = body?.reason?.trim();

    if (!reason) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "A reason is required to request reopening this closed task." } },
        { status: 400 }
      );
    }

    const task = await prisma.task.findFirst({
      where: { OR: [{ id }, { taskKey: id.toUpperCase() }] },
      include: { project: true },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Task not found" } }, { status: 404 });
    }

    if (task.status !== "CLOSED") {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_STATE", message: "Task is not currently closed." } },
        { status: 400 }
      );
    }

    // 1. Find all active Super Admins
    const superAdmins = await prisma.user.findMany({
      where: {
        role: "SUPER_ADMIN",
        isActive: true,
      },
      select: { id: true, name: true, email: true },
    });

    // 2. Create notifications for all Super Admins
    for (const admin of superAdmins) {
      try {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "REOPEN_REQUEST",
            title: `Reopen Requested: #${task.taskKey}`,
            message: `${currentUser.name} requested to reopen task ${task.taskKey}: "${reason}"`,
            taskId: task.taskKey,
            isRead: false,
          },
        });
      } catch (err) {
        console.warn("Super admin notification error:", err);
      }
    }

    // 3. Record task activity
    try {
      await prisma.activity.create({
        data: {
          taskId: task.id,
          projectId: task.projectId,
          userId: currentUser.id,
          action: "REOPEN_REQUESTED",
          description: `Reopen requested by ${currentUser.name}: "${reason}"`,
        },
      });
    } catch (err) {
      console.warn("Activity creation error:", err);
    }

    try {
      eventHub.emit("task_updated", { taskKey: task.taskKey, projectId: task.projectId });
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Reopen request submitted successfully. Super Admins have been notified.",
    });
  } catch (error: any) {
    console.error("Reopen request error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
