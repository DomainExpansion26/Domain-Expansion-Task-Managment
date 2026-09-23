import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { getCurrentUserFromRequest, hashPassword, verifyPassword } from "@/lib/auth";
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
          isActive: true,
          createdAt: true,
          managerId: true,
          manager: { select: { id: true, name: true, email: true, role: true } },
          teamLeadId: true,
          teamLead: { select: { id: true, name: true, email: true, role: true } },
          hrProfile: {
            select: {
              employeeId: true,
              status: true,
              joiningDate: true,
              phone: true,
            },
          },
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
        isActive: u.isActive,
        createdAt: u.createdAt,
        manager: u.manager,
        teamLead: u.teamLead,
        hrProfile: u.hrProfile,
        employeeId: u.hrProfile?.employeeId || null,
        phone: u.hrProfile?.phone || null,
        joiningDate: u.hrProfile?.joiningDate || u.createdAt,
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

    const body = await request.json();
    const { id, role, jobTitle, department, name, avatarUrl, phone, newPassword, currentPassword } = body;

    const targetUserId = id || currentUser.id;
    const isSuper = currentUser.role === "SUPER_ADMIN";

    // Non-superadmins cannot edit other users
    if (targetUserId !== currentUser.id && !isSuper) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You are only allowed to update your own profile" } },
        { status: 403 }
      );
    }

    // Only super admin can change role
    if (role && role !== currentUser.role && !isSuper) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only Super Admins can modify roles" } },
        { status: 403 }
      );
    }

    if (role === "SUPER_ADMIN") {
      const superAdminCount = await prisma.user.count({ where: { role: "SUPER_ADMIN", id: { not: targetUserId } } });
      if (superAdminCount >= 2) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "SUPER_ADMIN_LIMIT_REACHED",
              message: "Maximum limit of 2 Super Admin accounts has been reached.",
            },
          },
          { status: 403 }
        );
      }
    }

    const updateData: any = {};
    if (role && isSuper) updateData.role = role;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle.trim();
    if (department !== undefined) updateData.department = department.trim();
    if (name !== undefined && name.trim()) updateData.name = name.trim();
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    // Handle password update
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: { code: "INVALID_INPUT", message: "New password must be at least 6 characters" } },
          { status: 400 }
        );
      }

      // If non-superadmin changing their own password, verify current password if provided
      if (!isSuper && currentPassword) {
        const fullUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (fullUser) {
          const isValid = await verifyPassword(currentPassword, fullUser.passwordHash);
          if (!isValid) {
            return NextResponse.json(
              { success: false, error: { code: "INVALID_CREDENTIALS", message: "Current password is incorrect" } },
              { status: 400 }
            );
          }
        }
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        department: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        managerId: true,
        teamLeadId: true,
        manager: { select: { id: true, name: true, email: true } },
        teamLead: { select: { id: true, name: true, email: true } },
        hrProfile: true,
      },
    });

    // Update phone in HRProfile if provided
    if (phone !== undefined) {
      await prisma.hRProfile.upsert({
        where: { userId: targetUserId },
        create: {
          userId: targetUserId,
          phone: phone.trim(),
          designation: updated.jobTitle || "Team Member",
          department: updated.department || "General",
        },
        update: {
          phone: phone.trim(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Profile updated successfully",
    });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update user profile" } },
      { status: 500 }
    );
  }
}
