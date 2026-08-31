import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHRAdmin, hashPassword, getCurrentUserFromRequest } from "@/lib/auth";
import { normalizeRole } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const employees = await prisma.user.findMany({
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
        hrProfile: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = employees.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      role: normalizeRole(e.role),
      jobTitle: e.jobTitle || e.hrProfile?.designation || "Employee",
      department: e.department || e.hrProfile?.department || "General",
      avatarUrl: e.avatarUrl,
      isActive: e.isActive,
      manager: e.manager,
      teamLead: e.teamLead,
      employeeId: e.hrProfile?.employeeId || "N/A",
      joiningDate: e.hrProfile?.joiningDate || e.createdAt,
      dateOfBirth: e.hrProfile?.dateOfBirth || null,
      phone: e.hrProfile?.phone || null,
      hrmsStatus: e.hrProfile?.status || (e.isActive ? "ACTIVE" : "INACTIVE"),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin privileges required" } }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch employees" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireHRAdmin(request);
    const {
      name,
      email,
      password,
      jobTitle,
      department,
      employeeId,
      joiningDate,
      dateOfBirth,
      phone,
      managerId,
      teamLeadId,
      status = "ACTIVE",
    } = await request.json();

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

    const userCount = await prisma.user.count();
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: "MEMBER",
        jobTitle: jobTitle?.trim() || null,
        department: department?.trim() || null,
        managerId: managerId || null,
        teamLeadId: teamLeadId || null,
        avatarUrl: null,
        isActive: status !== "TERMINATED",
        hrProfile: {
          create: {
            employeeId: employeeId?.trim() || `EMP-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
            phone: phone?.trim() || null,
            designation: jobTitle?.trim() || null,
            department: department?.trim() || null,
            status: status || "ACTIVE",
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
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "EMPLOYEE_CREATED",
        entityType: "EMPLOYEE",
        entityId: user.id,
        detailsJson: JSON.stringify({
          name: user.name,
          email: user.email,
          employeeId: user.hrProfile?.employeeId,
          department: user.department,
          status,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: `Employee ${user.name} created and activated successfully`,
    });
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin privileges required" } }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to create employee" } }, { status: 500 });
  }
}
