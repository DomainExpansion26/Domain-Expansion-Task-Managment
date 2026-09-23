import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isHRAdmin, isSuperAdmin, isManager, isTeamLead } from "@/lib/permissions";
import { autoCloseDanglingSessions, calculateMultiSessionHours, PunchSession } from "@/lib/hrms";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const isHRorSuper = isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role);
    const isLeadOrManager = isManager(currentUser.role) || isTeamLead(currentUser.role);

    // Auto-close dangling past sessions first so they never leak into today
    await autoCloseDanglingSessions(prisma, currentUser.id, today);

    // 1. Fetch real DB entities
    const [
      myTodayPunch,
      myLeaves,
      upcomingHolidays,
      activeAnnouncements,
      allProfiles,
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
        take: 6,
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
        include: {
          user: {
            select: { id: true, name: true, jobTitle: true, department: true, avatarUrl: true, isActive: true },
          },
        },
      }),
      prisma.hRProfile.findUnique({
        where: { userId: currentUser.id },
      }),
    ]);

    // 2. Compute Upcoming Birthdays & Today's Birthdays (Robust date math)
    const upcomingBirthdays: any[] = [];
    const todayBirthdays: any[] = [];
    let isMyBirthday = false;

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 - 11
    const currentDate = now.getDate(); // 1 - 31

    for (const p of allProfiles) {
      if (p.dateOfBirth && p.user?.name) {
        const dob = new Date(p.dateOfBirth);
        // Handle timezone shift safely by using UTC / local components
        const bMonth = dob.getUTCMonth();
        const bDay = dob.getUTCDate();

        // Calculate days difference
        let bdayDateThisYear = new Date(currentYear, bMonth, bDay);
        const todayDateObj = new Date(currentYear, currentMonth, currentDate);
        
        let diffMs = bdayDateThisYear.getTime() - todayDateObj.getTime();
        let diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          // Birthday already passed this year, compute for next year
          bdayDateThisYear = new Date(currentYear + 1, bMonth, bDay);
          diffMs = bdayDateThisYear.getTime() - todayDateObj.getTime();
          diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        }

        const isToday = diffDays === 0;

        if (isToday && p.userId === currentUser.id) {
          isMyBirthday = true;
        }

        const bdayInfo = {
          id: p.userId,
          name: p.user.name,
          avatarUrl: p.user.avatarUrl,
          department: p.department || p.user.department || "General",
          jobTitle: p.designation || p.user.jobTitle || "Employee",
          dateOfBirth: p.dateOfBirth,
          day: bDay,
          month: new Date(2000, bMonth, 1).toLocaleString("default", { month: "short" }),
          isToday,
          daysUntil: diffDays,
        };

        if (isToday) {
          todayBirthdays.push(bdayInfo);
        }

        if (diffDays >= 0 && diffDays <= 45) {
          upcomingBirthdays.push(bdayInfo);
        }
      }
    }
    upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);

    // 3. Compute Upcoming Work Anniversaries
    const upcomingAnniversaries: any[] = [];
    for (const p of allProfiles) {
      if (p.joiningDate && p.user?.name) {
        const jDate = new Date(p.joiningDate);
        const jMonth = jDate.getUTCMonth();
        const jDay = jDate.getUTCDate();

        let annivDateThisYear = new Date(currentYear, jMonth, jDay);
        const todayDateObj = new Date(currentYear, currentMonth, currentDate);
        
        let diffMs = annivDateThisYear.getTime() - todayDateObj.getTime();
        let diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        let years = currentYear - jDate.getUTCFullYear();

        if (diffDays < 0) {
          annivDateThisYear = new Date(currentYear + 1, jMonth, jDay);
          diffMs = annivDateThisYear.getTime() - todayDateObj.getTime();
          diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          years += 1;
        }

        if (diffDays >= 0 && diffDays <= 45 && years > 0) {
          upcomingAnniversaries.push({
            id: p.userId,
            name: p.user.name,
            avatarUrl: p.user.avatarUrl,
            department: p.department || p.user.department || "General",
            jobTitle: p.designation || p.user.jobTitle || "Employee",
            joiningDate: p.joiningDate,
            yearsCompleted: years,
            isToday: diffDays === 0,
            daysUntil: diffDays,
          });
        }
      }
    }
    upcomingAnniversaries.sort((a, b) => a.daysUntil - b.daysUntil);

    // 4. Executive HR Dashboard Data (if Super Admin or HR Admin)
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
      ]);

      const presentCount = allTodayAttendance.filter((a) => a.status === "PRESENT" || a.status === "FULL_DAY" || a.status === "HALF_DAY").length;
      const fullDayCount = allTodayAttendance.filter((a) => a.status === "FULL_DAY").length;
      const halfDayCount = allTodayAttendance.filter((a) => a.status === "HALF_DAY").length;
      const onLeaveCount = allTodayAttendance.filter((a) => a.status === "LEAVE").length;
      const absentCount = Math.max(0, activeEmployees - presentCount - onLeaveCount);

      adminMetrics = {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        todayPresent: presentCount,
        todayFullDay: fullDayCount,
        todayHalfDay: halfDayCount,
        todayOnLeave: onLeaveCount,
        todayAbsent: absentCount,
        pendingLeavesCount,
        approvedLeavesCount,
        pendingRequestsCount,
        departmentsCount: departments.length,
      };
    }

    // 5. Employee Self-Service Stats
    const approvedLeaveDays = myLeaves
      .filter((l) => l.status === "APPROVED")
      .reduce((sum, l) => sum + (l.daysCount || 1), 0);

    const pendingLeaveDays = myLeaves
      .filter((l) => l.status === "PENDING")
      .reduce((sum, l) => sum + (l.daysCount || 1), 0);

    let liveTodayPunch: any = myTodayPunch;
    let todaySessions: PunchSession[] = [];
    if (myTodayPunch?.notes) {
      try {
        const parsed = JSON.parse(myTodayPunch.notes);
        if (Array.isArray(parsed.punches)) todaySessions = parsed.punches;
      } catch (e) {}
    }
    if (todaySessions.length === 0 && myTodayPunch?.punchIn) {
      todaySessions.push({
        punchIn: new Date(myTodayPunch.punchIn).toISOString(),
        punchOut: myTodayPunch.punchOut ? new Date(myTodayPunch.punchOut).toISOString() : null,
      });
    }

    if (myTodayPunch?.punchIn && !myTodayPunch?.punchOut) {
      const calc = calculateMultiSessionHours(todaySessions, myTodayPunch.punchIn, null, myTodayPunch.breakDurationMinutes ?? 60);
      liveTodayPunch = {
        ...myTodayPunch,
        totalWorkingHours: calc.totalWorkingHours,
        status: calc.status,
        sessions: todaySessions,
      };
    } else if (liveTodayPunch) {
      liveTodayPunch = {
        ...liveTodayPunch,
        sessions: todaySessions,
      };
    }

    const employeeDashboard = {
      todayPunch: liveTodayPunch || {
        date: today,
        punchIn: null,
        punchOut: null,
        breakDurationMinutes: 0,
        totalWorkingHours: 0,
        status: "NOT_RECORDED",
        sessions: [],
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
      todayBirthdays,
      upcomingBirthdays,
      upcomingAnniversaries,
      isMyBirthday,
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
