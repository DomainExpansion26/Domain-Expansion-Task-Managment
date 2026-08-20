import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
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

    const users = await withDbRetry(() =>
      prisma.user.findMany({
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
          _count: {
            select: {
              assignedTasks: true,
            },
          },
        },
        orderBy: { name: "asc" },
      })
    );

    const formatted = users.map((u) => {
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        jobTitle: u.jobTitle || "Team Member",
        department: u.department || "General",
        avatarUrl: u.avatarUrl,
        stats: {
          total: u._count.assignedTasks,
          active: u._count.assignedTasks,
          completed: 0,
          inReview: 0,
          inProgress: 0,
          overdue: 0,
        },
        tasks: [],
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
