import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        department: true,
        avatarUrl: true,
        createdAt: true,
        assignedTasks: {
          include: {
            task: {
              select: {
                id: true,
                taskKey: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
                projectId: true,
                project: { select: { name: true, key: true } },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const now = new Date();

    const formatted = users.map((u) => {
      const allTasks = u.assignedTasks.map((a) => a.task);
      const active = allTasks.filter((t) => t.status !== "DONE").length;
      const completed = allTasks.filter((t) => t.status === "DONE").length;
      const inReview = allTasks.filter((t) => t.status === "IN_REVIEW").length;
      const inProgress = allTasks.filter((t) => t.status === "IN_PROGRESS").length;
      const overdue = allTasks.filter((t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < now).length;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        jobTitle: u.jobTitle || "Team Member",
        department: u.department || "General",
        avatarUrl: u.avatarUrl,
        stats: {
          total: allTasks.length,
          active,
          completed,
          inReview,
          inProgress,
          overdue,
        },
        tasks: allTasks,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("Users list error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch users" } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { id, role, jobTitle, department, name } = await request.json();

    // Only super admin can change role
    if (role && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only Super Admins can modify roles" } },
        { status: 403 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: id || currentUser.id },
      data: {
        ...(role ? { role } : {}),
        ...(jobTitle ? { jobTitle } : {}),
        ...(department ? { department } : {}),
        ...(name ? { name } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "User profile updated",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update user" } },
      { status: 500 }
    );
  }
}
