import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isHRAdmin, isSuperAdmin } from "@/lib/permissions";
import { calculateMonthlyStats, calculateWorkingHours, calculateMultiSessionHours, PunchSession } from "@/lib/hrms";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    const viewAll = searchParams.get("viewAll") === "true";
    const dateParam = searchParams.get("date"); // YYYY-MM-DD
    const departmentParam = searchParams.get("department");
    const month = searchParams.get("month"); // 1 - 12
    const year = searchParams.get("year");   // e.g. 2026

    const isHRorSuper = isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role);

    // If HR admin requesting viewAll for a specific date or department
    if (viewAll && isHRorSuper) {
      const where: any = {};
      if (dateParam) {
        const d = new Date(dateParam);
        const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
        where.date = { gte: start, lte: end };
      }
      if (userIdParam) {
        where.userId = userIdParam;
      }
      if (departmentParam && departmentParam !== "ALL") {
        where.user = { department: departmentParam };
      }

      const records = await prisma.attendance.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              department: true,
              jobTitle: true,
              hrProfile: { select: { employeeId: true } },
            },
          },
        },
        orderBy: { date: "desc" },
      });

      // Dynamically compute live hours for currently clocked-in team members
      const processedRecords = records.map((rec) => {
        let liveHours = rec.totalWorkingHours || 0;
        let liveStatus = rec.status;
        if (rec.punchIn && !rec.punchOut) {
          let sessions: PunchSession[] = [];
          if (rec.notes) {
            try {
              const parsed = JSON.parse(rec.notes);
              if (Array.isArray(parsed.punches)) sessions = parsed.punches;
            } catch (e) {}
          }
          if (sessions.length === 0) {
            sessions.push({ punchIn: new Date(rec.punchIn).toISOString(), punchOut: null });
          }
          const calc = calculateMultiSessionHours(sessions, rec.punchIn, null, rec.breakDurationMinutes ?? 60);
          liveHours = calc.totalWorkingHours;
          liveStatus = calc.status;
        }
        return {
          ...rec,
          totalWorkingHours: liveHours,
          status: liveStatus,
        };
      });

      return NextResponse.json({
        success: true,
        data: processedRecords,
      });
    }

    const targetUserId = userIdParam && isHRorSuper
      ? userIdParam
      : currentUser.id;

    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month, 10) - 1 : new Date().getMonth();

    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth, 1));
    const endOfMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999));

    const [rawAttendances, leaves] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          userId: targetUserId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        orderBy: { date: "asc" },
      }),
      prisma.leave.findMany({
        where: {
          userId: targetUserId,
          status: "APPROVED",
          startDate: { lte: endOfMonth },
          endDate: { gte: startOfMonth },
        },
      }),
    ]);

    // Dynamically compute live hours for any active session in the month
    const attendances = rawAttendances.map((rec) => {
      let liveHours = rec.totalWorkingHours || 0;
      let liveStatus = rec.status;
      if (rec.punchIn && !rec.punchOut) {
        let sessions: PunchSession[] = [];
        if (rec.notes) {
          try {
            const parsed = JSON.parse(rec.notes);
            if (Array.isArray(parsed.punches)) sessions = parsed.punches;
          } catch (e) {}
        }
        if (sessions.length === 0) {
          sessions.push({ punchIn: new Date(rec.punchIn).toISOString(), punchOut: null });
        }
        const calc = calculateMultiSessionHours(sessions, rec.punchIn, null, rec.breakDurationMinutes ?? 60);
        liveHours = calc.totalWorkingHours;
        liveStatus = calc.status;
      }
      return {
        ...rec,
        totalWorkingHours: liveHours,
        status: liveStatus,
      };
    });

    const stats = calculateMonthlyStats(attendances, leaves);

    return NextResponse.json({
      success: true,
      data: {
        attendances,
        stats,
        month: targetMonth + 1,
        year: targetYear,
      },
    });
  } catch (error: any) {
    console.error("Attendance API error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch attendance" } }, { status: 500 });
  }
}

// Attendance Correction (HR_ADMIN / SUPER_ADMIN)
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin permission required for attendance correction" } },
        { status: 403 }
      );
    }

    const { attendanceId, userId, date, punchIn, punchOut, breakDurationMinutes, status, notes } = await request.json();

    let targetDate = date ? new Date(date) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    let calculatedStatus = status;
    let totalWorkingHours = 0;

    if (punchIn && punchOut) {
      const calc = calculateWorkingHours(punchIn, punchOut, breakDurationMinutes || 0);
      totalWorkingHours = calc.totalWorkingHours;
      if (!status) calculatedStatus = calc.status;
    }

    let record;
    if (attendanceId) {
      record = await prisma.attendance.update({
        where: { id: attendanceId },
        data: {
          ...(punchIn ? { punchIn: new Date(punchIn) } : {}),
          ...(punchOut ? { punchOut: new Date(punchOut) } : {}),
          ...(breakDurationMinutes !== undefined ? { breakDurationMinutes: Number(breakDurationMinutes) } : {}),
          ...(totalWorkingHours > 0 ? { totalWorkingHours } : {}),
          ...(calculatedStatus ? { status: calculatedStatus } : {}),
          ...(notes !== undefined ? { notes } : {}),
          correctedById: currentUser.id,
        },
      });
    } else if (userId && date) {
      record = await prisma.attendance.upsert({
        where: {
          userId_date: {
            userId,
            date: targetDate,
          },
        },
        create: {
          userId,
          date: targetDate,
          punchIn: punchIn ? new Date(punchIn) : null,
          punchOut: punchOut ? new Date(punchOut) : null,
          breakDurationMinutes: Number(breakDurationMinutes) || 0,
          totalWorkingHours,
          status: calculatedStatus || "PRESENT",
          notes: notes || null,
          correctedById: currentUser.id,
        },
        update: {
          punchIn: punchIn ? new Date(punchIn) : undefined,
          punchOut: punchOut ? new Date(punchOut) : undefined,
          breakDurationMinutes: breakDurationMinutes !== undefined ? Number(breakDurationMinutes) : undefined,
          totalWorkingHours: totalWorkingHours > 0 ? totalWorkingHours : undefined,
          status: calculatedStatus || undefined,
          notes: notes !== undefined ? notes : undefined,
          correctedById: currentUser.id,
        },
      });
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "ATTENDANCE_CORRECTED",
        entityType: "ATTENDANCE",
        entityId: record?.id,
        detailsJson: JSON.stringify({
          correctedBy: currentUser.name,
          date: targetDate.toISOString(),
          newStatus: calculatedStatus,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: record,
      message: "Attendance corrected successfully",
    });
  } catch (error: any) {
    console.error("Attendance correction error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to correct attendance" } }, { status: 500 });
  }
}
