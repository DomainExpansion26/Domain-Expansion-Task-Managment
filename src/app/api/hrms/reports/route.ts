import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isHRAdmin, isSuperAdmin } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin permission required" } }, { status: 403 });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [totalEmployees, activeEmployees, todayPunches, pendingLeaves, recentLeaves] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.attendance.findMany({
        where: { date: today },
        include: {
          user: { select: { id: true, name: true, email: true, jobTitle: true, department: true, avatarUrl: true } },
        },
      }),
      prisma.leave.count({ where: { status: "PENDING" } }),
      prisma.leave.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, department: true } },
        },
      }),
    ]);

    const presentCount = todayPunches.filter((p) => p.status === "PRESENT" || p.status === "FULL_DAY" || p.status === "HALF_DAY").length;
    const fullDayCount = todayPunches.filter((p) => p.status === "FULL_DAY").length;
    const halfDayCount = todayPunches.filter((p) => p.status === "HALF_DAY").length;

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        todayPresent: presentCount,
        todayFullDay: fullDayCount,
        todayHalfDay: halfDayCount,
        todayAttendance: todayPunches,
        pendingLeaves,
        recentLeaves,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to generate HR reports" } }, { status: 500 });
  }
}
