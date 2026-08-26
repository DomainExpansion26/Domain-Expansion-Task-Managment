import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isHRAdmin, isSuperAdmin, isManager, isTeamLead } from "@/lib/permissions";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { id } = await params;

    const isHRorSuper = isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role);
    const isLeadOrManager = isManager(currentUser.role) || isTeamLead(currentUser.role);

    // If regular employee, only allow viewing own details
    if (!isHRorSuper && !isLeadOrManager && currentUser.id !== id) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "You can only view your own employee details" } }, { status: 403 });
    }

    const user: any = await prisma.user.findUnique({
      where: { id },
      include: {
        hrProfile: true,
        manager: { select: { id: true, name: true, email: true, jobTitle: true } },
        teamLead: { select: { id: true, name: true, email: true, jobTitle: true } },
        projectMembers: {
          include: {
            project: { select: { id: true, name: true, status: true } },
          },
        },
        assignedTasks: {
          include: {
            task: { select: { id: true, title: true, status: true, priority: true, dueDate: true, projectId: true } },
          },
          take: 15,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Employee not found" } }, { status: 404 });
    }

    // Parallel fetch attendance, leaves, documents, salary, and timeline
    const [attendances, leaves, documents, salaryStructure, timeline, onboardingChecklist, offboardingRecord] = await Promise.all([
      prisma.attendance.findMany({
        where: { userId: id },
        orderBy: { date: "desc" },
        take: 30,
      }),
      prisma.leave.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.attachment.findMany({
        where: { uploadedById: id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.salaryStructure.findUnique({
        where: { userId: id },
      }),
      prisma.employeeTimeline.findMany({
        where: { userId: id },
        orderBy: { effectiveDate: "desc" },
      }),
      prisma.onboardingChecklist.findUnique({
        where: { userId: id },
      }),
      prisma.offboardingRecord.findUnique({
        where: { userId: id },
      }),
    ]);

    // Calculate attendance summary
    const presentDays = attendances.filter((a) => a.status === "FULL_DAY").length;
    const halfDays = attendances.filter((a) => a.status === "HALF_DAY").length;
    const leaveDays = attendances.filter((a) => a.status === "LEAVE").length;
    const lateArrivals = attendances.filter((a) => {
      if (!a.punchIn) return false;
      const punchDate = new Date(a.punchIn);
      const minutes = punchDate.getHours() * 60 + punchDate.getMinutes();
      return minutes > 570; // After 9:30 AM
    }).length;
    const totalWorkingHours = parseFloat(attendances.reduce((sum, a) => sum + (a.totalWorkingHours || 0), 0).toFixed(1));

    const assignedTaskList = (user.assignedTasks || [])
      .map((at: any) => at.task)
      .filter(Boolean);

    const projectList = (user.projectMembers || [])
      .map((pm: any) => pm.project)
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          jobTitle: user.jobTitle || user.hrProfile?.designation || "Employee",
          department: user.department || user.hrProfile?.department || "General",
          avatarUrl: user.avatarUrl,
          isActive: user.isActive,
          createdAt: user.createdAt,
          manager: user.manager,
          teamLead: user.teamLead,
          hrProfile: user.hrProfile,
        },
        attendanceSummary: {
          presentDays,
          halfDays,
          leaveDays,
          lateArrivals,
          totalWorkingHours,
          recentLogs: attendances,
        },
        leaves: {
          history: leaves,
          pendingCount: leaves.filter((l) => l.status === "PENDING").length,
          approvedCount: leaves.filter((l) => l.status === "APPROVED").length,
        },
        documents,
        salaryStructure,
        projects: projectList,
        tasks: assignedTaskList,
        timeline,
        onboardingChecklist,
        offboardingRecord,
      },
    });
  } catch (error: any) {
    console.error("GET /api/hrms/employees/[id] error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to fetch employee details" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin privileges required" } }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const user = await prisma.user.findUnique({
      where: { id },
      include: { hrProfile: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Employee not found" } }, { status: 404 });
    }

    const userUpdate: any = {};
    if (body.name) userUpdate.name = body.name.trim();
    if (body.jobTitle !== undefined) userUpdate.jobTitle = body.jobTitle?.trim() || "Employee";
    if (body.department !== undefined) userUpdate.department = body.department?.trim() || "General";
    if (body.managerId !== undefined) userUpdate.managerId = body.managerId || null;
    if (body.teamLeadId !== undefined) userUpdate.teamLeadId = body.teamLeadId || null;
    if (body.isActive !== undefined) userUpdate.isActive = Boolean(body.isActive);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: userUpdate,
    });

    // Update HR Profile
    const hrUpdate: any = {};
    if (body.employeeId !== undefined) hrUpdate.employeeId = body.employeeId || null;
    if (body.designation !== undefined) hrUpdate.designation = body.designation || updatedUser.jobTitle;
    if (body.department !== undefined) hrUpdate.department = body.department || updatedUser.department;
    if (body.joiningDate !== undefined) hrUpdate.joiningDate = body.joiningDate ? new Date(body.joiningDate) : new Date();
    if (body.dateOfBirth !== undefined) hrUpdate.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
    if (body.phone !== undefined) hrUpdate.phone = body.phone || null;
    if (body.status !== undefined) hrUpdate.status = body.status;
    if (body.emergencyContact !== undefined) hrUpdate.emergencyContact = body.emergencyContact || null;
    if (body.address !== undefined) hrUpdate.address = body.address || null;

    const updatedHr = await prisma.hRProfile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        employeeId: body.employeeId || null,
        designation: body.designation || updatedUser.jobTitle || "Employee",
        department: body.department || updatedUser.department || "General",
        joiningDate: body.joiningDate ? new Date(body.joiningDate) : new Date(),
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        phone: body.phone || null,
        status: body.status || "ACTIVE",
        emergencyContact: body.emergencyContact || null,
        address: body.address || null,
      },
      update: hrUpdate,
    });

    // Record timeline if promotion or transfer occurred
    if (body.jobTitle && body.jobTitle !== user.jobTitle) {
      await prisma.employeeTimeline.create({
        data: {
          userId: id,
          eventType: "PROMOTION",
          title: `Role updated to ${body.jobTitle}`,
          description: `Designation changed from ${user.jobTitle || "Employee"} to ${body.jobTitle}`,
          effectiveDate: new Date(),
          recordedById: currentUser.id,
        },
      });
    }

    if (body.department && body.department !== user.department) {
      await prisma.employeeTimeline.create({
        data: {
          userId: id,
          eventType: "TRANSFER",
          title: `Transferred to ${body.department}`,
          description: `Department changed from ${user.department || "General"} to ${body.department}`,
          effectiveDate: new Date(),
          recordedById: currentUser.id,
        },
      });
    }

    // Record audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: "EMPLOYEE_UPDATED",
          entityType: "EMPLOYEE",
          entityId: id,
          detailsJson: JSON.stringify({
            updatedBy: currentUser.name,
            employeeName: updatedUser.name,
            status: updatedHr.status,
            updatedFields: Object.keys(body),
          }),
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      data: {
        ...updatedUser,
        hrProfile: updatedHr,
      },
      message: `Employee ${updatedUser.name} profile updated successfully`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to update employee" } }, { status: 500 });
  }
}
