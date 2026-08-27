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
    const month = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;

    const isHRorSuper = isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role);
    const userId = isHRorSuper && targetUserId ? targetUserId : currentUser.id;

    const where: any = { userId };
    if (month) where.month = month;
    if (year) where.year = year;

    const payslips = await prisma.payslip.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, jobTitle: true, department: true, hrProfile: true },
    });

    // Zero fake data: if no payslips in DB, return empty array
    if (payslips.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const formatted = payslips.map((p) => {
      let earnings: any[] = [];
      let deductionsList: any[] = [];
      try {
        earnings = JSON.parse(p.earningsJson);
        deductionsList = JSON.parse(p.deductionsJson);
      } catch (e) {}

      if (earnings.length === 0) {
        earnings = [
          { label: "Basic Salary", amount: p.basic },
          { label: "House Rent Allowance (HRA)", amount: p.hra },
          { label: "Special Allowance", amount: p.allowances },
          { label: "Performance Bonus", amount: p.bonus },
        ];
      }

      if (deductionsList.length === 0) {
        deductionsList = [
          { label: "Provident Fund (PF)", amount: Math.round(p.deductions * 0.6) },
          { label: "Professional Tax", amount: Math.round(p.deductions * 0.4) },
        ];
      }

      return {
        ...p,
        employeeName: user?.name || "Employee",
        employeeId: user?.hrProfile?.employeeId || "EMP-" + userId.slice(0, 5),
        designation: user?.jobTitle || user?.hrProfile?.designation || "Team Member",
        department: user?.department || user?.hrProfile?.department || "General",
        earningsBreakdown: earnings,
        deductionsBreakdown: deductionsList,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("GET payslips error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to load payslips" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin permission required" } }, { status: 403 });
    }

    const { userId, month, year } = await request.json();

    if (!month || !year) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Month and Year are required" } }, { status: 400 });
    }

    const userIds = userId ? [userId] : (await prisma.user.findMany({ where: { isActive: true }, select: { id: true } })).map((u) => u.id);

    const generatedList: any[] = [];
    for (const uid of userIds) {
      const salary = await prisma.salaryStructure.findUnique({ where: { userId: uid } });
      const basic = salary?.basic || 0;
      const hra = salary?.hra || 0;
      const allowances = salary?.allowances || 0;
      const bonus = salary?.bonus || 0;
      const deductions = salary?.deductions || 0;
      const gross = basic + hra + allowances + bonus;
      const net = Math.max(0, gross - deductions);

      const payslip = await prisma.payslip.upsert({
        where: {
          userId_month_year: {
            userId: uid,
            month: Number(month),
            year: Number(year),
          },
        },
        create: {
          userId: uid,
          month: Number(month),
          year: Number(year),
          basic,
          hra,
          allowances,
          bonus,
          deductions,
          grossSalary: gross,
          netSalary: net,
          status: "GENERATED",
          generatedAt: new Date(),
        },
        update: {
          basic,
          hra,
          allowances,
          bonus,
          deductions,
          grossSalary: gross,
          netSalary: net,
          status: "GENERATED",
          generatedAt: new Date(),
        },
      });
      generatedList.push(payslip);
    }

    return NextResponse.json({
      success: true,
      data: generatedList,
      message: `Generated ${generatedList.length} payslip(s) for ${month}/${year}`,
    });
  } catch (error: any) {
    console.error("POST payslips error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to generate payslips" } }, { status: 500 });
  }
}
