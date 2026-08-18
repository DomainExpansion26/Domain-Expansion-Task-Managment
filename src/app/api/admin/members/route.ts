import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, hashPassword } from "@/lib/auth";
import { normalizeRole } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireSuperAdmin(request);

    const members = await prisma.user.findMany({
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
        manager: { select: { id: true, name: true, email: true } },
        teamLeadId: true,
        teamLead: { select: { id: true, name: true, email: true } },
        hrProfile: {
          select: {
            employeeId: true,
            status: true,
            joiningDate: true,
            dateOfBirth: true,
            phone: true,
          },
        },
        _count: {
          select: {
            assignedTasks: true,
            qaTicketsAssigned: true,
            qaBugsAssigned: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: normalizeRole(m.role),
      jobTitle: m.jobTitle || "Employee",
      department: m.department || "General",
      avatarUrl: m.avatarUrl,
      isActive: m.isActive,
      joiningDate: m.hrProfile?.joiningDate || m.createdAt,
      manager: m.manager,
      teamLead: m.teamLead,
      hrmsStatus: m.hrProfile?.status || (m.isActive ? "ACTIVE" : "INACTIVE"),
      employeeId: m.hrProfile?.employeeId || "N/A",
      assignedTasksCount: m._count.assignedTasks,
      qaTicketsCount: m._count.qaTicketsAssigned,
      qaBugsCount: m._count.qaBugsAssigned,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Super Admin privileges required" } }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch members" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireSuperAdmin(request);
    const { name, email, password, role, jobTitle, department, managerId, teamLeadId, employeeId, dateOfBirth } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Name, email, and password are required" } },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "USER_EXISTS", message: "A user with this email address already exists" } },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const targetRole = normalizeRole(role || "MEMBER");

    const userCount = await prisma.user.count();

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: targetRole,
        jobTitle: jobTitle?.trim() || "Team Member",
        department: department?.trim() || "General",
        managerId: managerId || null,
        teamLeadId: teamLeadId || null,
        avatarUrl: null,
        isActive: true,
        hrProfile: {
          create: {
            employeeId: employeeId?.trim() || `EMP-${1000 + userCount + 1}`,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            designation: jobTitle?.trim() || "Team Member",
            department: department?.trim() || "General",
            status: "ACTIVE",
          },
        },
        notificationPref: {
          create: {
            emailTaskAssigned: true,
            emailTaskUpdated: true,
            emailMention: true,
            emailComment: true,
            emailDueDate: true,
            emailOverdue: true,
            inAppTaskAssigned: true,
            inAppTaskUpdated: true,
            inAppMention: true,
            inAppComment: true,
            inAppDueDate: true,
            inAppOverdue: true,
          },
        },
      },
      include: {
        hrProfile: true,
        manager: true,
        teamLead: true,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "MEMBER_CREATED",
        entityType: "USER",
        entityId: user.id,
        detailsJson: JSON.stringify({
          createdUser: user.name,
          email: user.email,
          role: user.role,
          managerId: user.managerId,
          teamLeadId: user.teamLeadId,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: `Member ${user.name} created successfully with role ${user.role}`,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Super Admin privileges required" } }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to create member" } }, { status: 500 });
  }
}
