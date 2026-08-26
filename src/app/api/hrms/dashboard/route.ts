import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isHRAdmin, isSuperAdmin, isManager, isTeamLead } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const isHRorSuper = isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role);
    const isLeadOrManager = isManager(currentUser.role) || isTeamLead(currentUser.role);

    // 1. Common data needed across dashboards
    const [
      myTodayPunch,
      myLeaves,
      upcomingHolidays,
      activeAnnouncements,
      todayBirthdays,
      myHRProfile,
    ] = await Promise.all([
      prisma.attendance.findUnique({
        where: { userId_date: { userId: currentUser.id, date: today } },
      }),
      prisma.leave.findMany({
        where: { userId: currentUser.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.holiday.findMany({
        where: { date: { gte: today } },
        orderBy: { date: "asc" },
        take: 5,
      }),
      prisma.hRAnnouncement.findMany({
        where: {
          OR: [
            { targetDepartment: "ALL" },
            { targetDepartment: currentUser.department || "General" },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.hRProfile.findMany({
        where: { dateOfBirth: { not: null }, status: "ACTIVE" },
        include: { user: { select: { id: true, name: true, jobTitle: true, department: true, avatarUrl: true } } },
      }),
      prisma.hRProfile.findUnique({
        where: { userId: currentUser.id },
      }),
    ]);

    // Format today/tomorrow birthdays
    const bdayTodayList = todayBirthdays.filter((p) => {
      if (!p.dateOfBirth) return false;
      const dob = new Date(p.dateOfBirth);
      return dob.getUTCMonth() === today.getUTCMonth() && dob.getUTCDate() === today.getUTCDate();
    });

    // 2. Executive HR Dashboard Data (if Super Admin or HR Admin)
    let adminMetrics: any = null;
    if (isHRorSuper) {
      const [
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        allTodayAttendance,
        pendingLeavesCount,
        approvedLeavesCount,
        pendingRequestsCount,
        departments,
        recentActivities,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { isActive: false } }),
        prisma.attendance.findMany({
          where: { date: today },
          include: { user: { select: { id: true, name: true, jobTitle: true, department: true, avatarUrl: true } } },
        }),
        prisma.leave.count({ where: { status: "PENDING" } }),
        prisma.leave.count({ where: { status: "APPROVED" } }),
        prisma.hRRequest.count({ where: { status: "PENDING" } }),
        prisma.department.findMany({ where: { isActive: true } }),
        prisma.auditLog.findMany({
          where: { entityType: { in: ["EMPLOYEE", "LEAVE", "ATTENDANCE", "PAYROLL", "HR_REQUEST"] } },
          orderBy: { createdAt: "desc" },
          take: 8,
          include: { user: { select: { name: true, avatarUrl: true } } },
        }),
      ]);

      const presentCount = allTodayAttendance.filter((a) => a.status === "PRESENT" || a.status === "FULL_DAY" || a.status === "HALF_DAY").length;
      const fullDayCount = allTodayAttendance.filter((a) => a.status === "FULL_DAY").length;
      const halfDayCount = allTodayAttendance.filter((a) => a.status === "HALF_DAY").length;
      const onLeaveCount = allTodayAttendance.filter((a) => a.status === "LEAVE").length;
      const absentCount = Math.max(0, activeEmployees - presentCount - onLeaveCount);

      // Late mark logic (e.g. punchIn > 09:30 AM)
      const lateEmployees = allTodayAttendance.filter((a) => {
        if (!a.punchIn) return false;
        const punch = new Date(a.punchIn);
        const punchHour = punch.getUTCHours() * 60 + punch.getUTCMinutes();
        return punchHour > 9 * 60 + 30; // After 9:30 AM UTC/Local
      });

      adminMetrics = {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        todayPresent: presentCount,
        todayFullDay: fullDayCount,
        todayHalfDay: halfDayCount,
        todayOnLeave: onLeaveCount,
        todayAbsent: absentCount,
        lateEmployeesCount: lateEmployees.length,
        pendingLeavesCount,
        approvedLeavesCount,
        pendingRequestsCount,
        departmentsCount: departments.length,
        todayAttendanceList: allTodayAttendance,
        recentActivities,
      };
    }

    // 3. Employee Self-Service Stats
    const approvedLeaveDays = myLeaves
      .filter((l) => l.status === "APPROVED")
      .reduce((sum, l) => sum + (l.daysCount || 1), 0);

    const pendingLeaveDays = myLeaves
      .filter((l) => l.status === "PENDING")
      .reduce((sum, l) => sum + (l.daysCount || 1), 0);

    const employeeDashboard = {
      todayPunch: myTodayPunch || {
        date: today,
        punchIn: null,
        punchOut: null,
        breakDurationMinutes: 0,
        totalWorkingHours: 0,
        status: "NOT_RECORDED",
      },
      leaveBalances: {
        totalAllowance: 24,
        used: approvedLeaveDays,
        pending: pendingLeaveDays,
        remaining: Math.max(0, 24 - approvedLeaveDays),
      },
      myLeaves,
      upcomingHolidays,
      announcements: activeAnnouncements,
      todayBirthdays: bdayTodayList.map((b) => ({
        name: b.user.name,
        jobTitle: b.user.jobTitle,
        department: b.user.department,
        avatarUrl: b.user.avatarUrl,
      })),
      profileSummary: {
        employeeId: myHRProfile?.employeeId || "EMP-" + currentUser.id.slice(0, 5),
        designation: myHRProfile?.designation || currentUser.jobTitle || "Team Member",
        department: myHRProfile?.department || currentUser.department || "General",
        joiningDate: myHRProfile?.joiningDate || currentUser.createdAt,
        status: myHRProfile?.status || "ACTIVE",
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        isHRorSuper,
        isLeadOrManager,
        adminMetrics,
        employeeDashboard,
      },
    });
  } catch (error: any) {
    console.error("HRMS Dashboard error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to load HRMS dashboard" } }, { status: 500 });
  }
}
