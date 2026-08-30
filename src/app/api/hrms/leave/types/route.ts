import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isHRAdmin, isSuperAdmin } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");
    const isHRorSuper = isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role);
    const userId = isHRorSuper && targetUserId ? targetUserId : currentUser.id;

    const [types, userLeaves] = await Promise.all([
      prisma.leaveTypeConfig.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.leave.findMany({ where: { userId } }),
    ]);

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1 to 12

    // Calculate balances for each leave type based on monthly accrual
    const balances = types.map((lt) => {
      const isMonthlyAccrual = lt.code === "CL" || lt.code === "PL" || lt.code === "EL" || lt.code === "SL";
      const accruedDays = isMonthlyAccrual ? Math.min(lt.daysAllowed, currentMonth * 1) : lt.daysAllowed;

      const matchingLeaves = userLeaves.filter(
        (l) =>
          (l.leaveType || "").toUpperCase() === lt.code ||
          (l.leaveType || "").toLowerCase() === lt.name.toLowerCase() ||
          (lt.code === "CL" && (l.leaveType === "CASUAL" || l.leaveType === "SICK")) ||
          (lt.code === "PL" && (l.leaveType === "PAID" || l.leaveType === "EARNED")) ||
          (lt.code === "ML" && l.leaveType === "MATERNITY") ||
          (lt.code === "PTL" && l.leaveType === "PATERNITY")
      );

      const approvedDays = matchingLeaves.filter((l) => l.status === "APPROVED").reduce((sum, l) => sum + (l.daysCount || 1), 0);
      const pendingDays = matchingLeaves.filter((l) => l.status === "PENDING").reduce((sum, l) => sum + (l.daysCount || 1), 0);
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
        currentMonthAccrual: isMonthlyAccrual ? currentMonth : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: balances,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch leave types and balances" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin permission required" } }, { status: 403 });
    }

    const { name, code, daysAllowed = 12, isPaid = true, carryForward = true, maxConsecutive = 5 } = await request.json();

    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Name and code are required" } }, { status: 400 });
    }

    const leaveType = await prisma.leaveTypeConfig.upsert({
      where: { code: code.trim().toUpperCase() },
      create: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        daysAllowed: Number(daysAllowed) || 12,
        isPaid: Boolean(isPaid),
        carryForward: Boolean(carryForward),
        maxConsecutive: Number(maxConsecutive) || 5,
        isActive: true,
      },
      update: {
        name: name.trim(),
        daysAllowed: Number(daysAllowed) || 12,
        isPaid: Boolean(isPaid),
        carryForward: Boolean(carryForward),
        maxConsecutive: Number(maxConsecutive) || 5,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: leaveType,
      message: `Leave type ${leaveType.name} configured successfully`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to configure leave type" } }, { status: 500 });
  }
}
