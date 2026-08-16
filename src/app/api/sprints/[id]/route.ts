import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "sprint.manage")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } }, { status: 403 });
    }

    const { id } = await params;
    const { name, goal, startDate, endDate, status, moveIncompleteTasksToSprintId } = await request.json();

    const existing = await prisma.sprint.findUnique({
      where: { id },
      include: { tasks: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Sprint not found" } }, { status: 404 });
    }

    // If completing sprint, handle incomplete tasks
    if (status === "COMPLETED" && existing.status !== "COMPLETED") {
      const incompleteTasks = existing.tasks.filter((t) => t.status !== "DONE");
      if (incompleteTasks.length > 0) {
        await prisma.task.updateMany({
          where: {
            id: { in: incompleteTasks.map((t) => t.id) },
          },
          data: {
            sprintId: moveIncompleteTasksToSprintId || null,
          },
        });
      }
    }

    const updated = await prisma.sprint.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(goal !== undefined ? { goal } : {}),
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Sprint status updated to ${status || updated.status}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update sprint" } }, { status: 500 });
  }
}
