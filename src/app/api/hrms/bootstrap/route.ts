import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isHRAdmin, isSuperAdmin, isTeamLead, isManager } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const todayUtcMidnight = new Date();
    todayUtcMidnight.setUTCHours(0, 0, 0, 0);

    const isLeadOrManager = isTeamLead(currentUser.role) || isManager(currentUser.role);
    const isHR = isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role);

    // Run all HRMS queries concurrently in a single database connection session
    const [
      userWithProfile,
      todayAttendance,
      monthlyAttendances,
      userLeaves,
      teamLeaves,
      leaveTypeConfigs,
      documents,
      salaryStructure,
      payslips,
      directoryUsers,
      hrRequests,
      allProfiles,
      announcements,
      upcomingHolidays,
    ] = await Promise.all([
      // 1. User HR Profile
      withDbRetry(() =>
        prisma.user.findUnique({
          where: { id: currentUser.id },
          include: {
            hrProfile: true,
            manager: { select: { id: true, name: true, email: true, role: true } },
          },
        })
      ),

      // 2. Today's Punch
      withDbRetry(() =>
        prisma.attendance.findFirst({
          where: {
            userId: currentUser.id,
            date: todayUtcMidnight,
          },
        })
      ),

      // 3. Monthly Attendance
      withDbRetry(() =>
        prisma.attendance.findMany({
          where: {
            userId: currentUser.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { date: "desc" },
        })
      ),

      // 4. User Leaves
      withDbRetry(() =>
        prisma.leave.findMany({
          where: { userId: currentUser.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      ),

      // 5. Team Pending Leaves (Only for HR Admin & Super Admin)
      isHR
        ? withDbRetry(() => {
            return prisma.leave.findMany({
              where: {
                status: "PENDING",
                userId: { not: currentUser.id },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    jobTitle: true,
                    department: true,
                    avatarUrl: true,
                    managerId: true,
                    teamLeadId: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 50,
            });
          })
        : Promise.resolve([]),

      // 6. Leave Type Configurations (used to calculate leave balances)
      withDbRetry(() =>
        prisma.leaveTypeConfig.findMany({
          where: { isActive: true },
          orderBy: { name: "asc" },
        })
      ),

      // 7. Documents (attachments uploaded by user)
      withDbRetry(() =>
        prisma.attachment.findMany({
          where: {
            uploadedById: currentUser.id,
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      ),

      // 8. Salary Structure
      withDbRetry(() =>
        prisma.salaryStructure.findUnique({
          where: { userId: currentUser.id },
        })
      ),

      // 9. Payslips
      withDbRetry(() =>
        prisma.payslip.findMany({
          where: { userId: currentUser.id },
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 12,
        })
      ),

      // 10. Directory Employees
      withDbRetry(() =>
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            jobTitle: true,
            department: true,
            avatarUrl: true,
            isActive: true,
            manager: { select: { id: true, name: true } },
            hrProfile: {
              select: {
                phone: true,
                emergencyContact: true,
                address: true,
                dateOfBirth: true,
                joiningDate: true,
                designation: true,
                department: true,
                status: true,
              },
            },
          },
          orderBy: { name: "asc" },
        })
      ),

      // 11. HR Requests
      withDbRetry(() =>
        prisma.hRRequest.findMany({
          where: isHR ? {} : { userId: currentUser.id },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      ),

      // 12. HR Profiles with users for birthdays & anniversaries
      withDbRetry(() =>
        prisma.hRProfile.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                jobTitle: true,
                department: true,
                avatarUrl: true,
                isActive: true,
              },
            },
          },
        })
      ),

      // 13. Announcements
      withDbRetry(() =>
        prisma.hRAnnouncement.findMany({
          where: {
            OR: [
              { targetDepartment: "ALL" },
              { targetDepartment: null },
              { targetDepartment: currentUser.department || undefined },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      ),

      // 14. Holidays
      withDbRetry(() =>
        prisma.holiday.findMany({
          where: { date: { gte: todayUtcMidnight } },
          orderBy: { date: "asc" },
          take: 6,
        })
      ),
    ]);

    // Calculate leave balances from configs and user leaves with monthly accrual
    const currentMonthNum = new Date().getMonth() + 1; // 1 to 12
    const leaveBalances = leaveTypeConfigs.map((lt) => {
      const isMonthlyAccrual = lt.code === "CL" || lt.code === "PL" || lt.code === "EL" || lt.code === "SL";
      const accruedDays = isMonthlyAccrual ? Math.min(lt.daysAllowed, currentMonthNum * 1) : lt.daysAllowed;

      const matchingLeaves = userLeaves.filter(
        (l) =>
          (l.leaveType || "").toUpperCase() === lt.code ||
          (l.leaveType || "").toLowerCase() === lt.name.toLowerCase() ||
          (lt.code === "CL" && (l.leaveType === "CASUAL" || l.leaveType === "SICK")) ||
          (lt.code === "PL" && (l.leaveType === "PAID" || l.leaveType === "EARNED")) ||
          (lt.code === "ML" && l.leaveType === "MATERNITY") ||
          (lt.code === "PTL" && l.leaveType === "PATERNITY")
      );
      const approvedDays = matchingLeaves
        .filter((l) => l.status === "APPROVED")
        .reduce((sum, l) => sum + (l.daysCount || 1), 0);
      const pendingDays = matchingLeaves
        .filter((l) => l.status === "PENDING")
        .reduce((sum, l) => sum + (l.daysCount || 1), 0);
      const remainingDays = Math.max(0, accruedDays - approvedDays);
      const annualRemaining = Math.max(0, lt.daysAllowed - approvedDays);

      return {
        id: lt.id,
        name: lt.name,
        code: lt.code,
        daysAllowed: lt.daysAllowed,
        accruedDays,
        accrualRate: isMonthlyAccrual ? "1 day credited on the 1st of every month" : "Allocated per statutory policy",
        isPaid: lt.isPaid,
        carryForward: lt.carryForward,
        maxConsecutive: lt.maxConsecutive,
        approvedDays,
        pendingDays,
        remainingDays,
        annualRemaining,
        currentMonthAccrual: isMonthlyAccrual ? currentMonthNum : null,
      };
    });

    // Format HR requests with user details
    const directoryUserMap = new Map(directoryUsers.map((u) => [u.id, u]));
    const formattedHrRequests = hrRequests.map((r) => ({
      ...r,
      user: directoryUserMap.get(r.userId) || {
        id: r.userId,
        name: "Employee",
        email: "",
        department: "",
      },
    }));

    // Calculate upcoming and today birthdays + anniversaries
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    const upcomingBirthdays: any[] = [];
    const todayBirthdays: any[] = [];
    let isMyBirthday = false;

    for (const p of allProfiles) {
      if (p.dateOfBirth && p.user?.name) {
        const dob = new Date(p.dateOfBirth);
        const bMonth = dob.getUTCMonth();
        const bDay = dob.getUTCDate();

        let bdayDateThisYear = new Date(currentYear, bMonth, bDay);
        const todayDateObj = new Date(currentYear, currentMonth, currentDate);

        let diffMs = bdayDateThisYear.getTime() - todayDateObj.getTime();
        let diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
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

    // Upcoming Work Anniversaries
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

    // Compute monthly attendance statistics
    const totalPresent = monthlyAttendances.filter((a) => a.status === "PRESENT" || a.status === "FULL_DAY" || a.status === "HALF_DAY").length;
    const totalLate = monthlyAttendances.filter((a) => {
      if (!a.punchIn) return false;
      const punchInDate = new Date(a.punchIn);
      const hours = punchInDate.getUTCHours();
      const minutes = punchInDate.getUTCMinutes();
      return hours > 9 || (hours === 9 && minutes > 30);
    }).length;
    const totalLeave = monthlyAttendances.filter((a) => a.status === "LEAVE").length;
    const totalHours = monthlyAttendances.reduce((acc, a) => acc + (a.totalWorkingHours || 0), 0);

    const monthlyStats = {
      totalPresent,
      totalLate,
      totalLeave,
      totalHours: Math.round(totalHours * 10) / 10,
      totalWorkingHours: Math.round(totalHours * 10) / 10,
      presentDays: totalPresent,
      halfDays: monthlyAttendances.filter((a) => a.status === "HALF_DAY").length,
      leaveDays: totalLeave,
    };

    return NextResponse.json({
      success: true,
      data: {
        profile: userWithProfile,
        dashboard: {
          todayPunch: todayAttendance || {
            date: todayUtcMidnight,
            punchIn: null,
            punchOut: null,
            breakDurationMinutes: 0,
            totalWorkingHours: 0,
            status: "NOT_RECORDED",
          },
          upcomingBirthdays,
          todayBirthdays,
          isMyBirthday,
          upcomingAnniversaries,
          upcomingHolidays,
          announcements,
          leaveBalances,
          monthlyStats,
        },
        punch: todayAttendance,
        attendance: {
          attendances: monthlyAttendances,
          stats: monthlyStats,
        },
        leaves: userLeaves,
        teamPendingLeaves: teamLeaves,
        leaveBalances,
        documents,
        payroll: {
          salaryStructure,
          payslips,
        },
        directory: directoryUsers,
        requests: formattedHrRequests,
      },
    });
  } catch (error: any) {
    console.error("HRMS Bootstrap error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to load HRMS workspace" } },
      { status: 500 }
    );
  }
}
