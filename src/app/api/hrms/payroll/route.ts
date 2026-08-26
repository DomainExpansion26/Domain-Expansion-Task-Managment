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

    // Regular users can only access their own salary structure
    const userId = isHRorSuper && targetUserId ? targetUserId : currentUser.id;

    if (isHRorSuper && !targetUserId) {
      // Return salary summary for all employees
      const structures = await prisma.salaryStructure.findMany();
      return NextResponse.json({ success: true, data: structures });
    }

    const salary = await prisma.salaryStructure.findUnique({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      data: salary || {
        userId,
        basic: 45000,
        hra: 18000,
        allowances: 12000,
        bonus: 5000,
        deductions: 4000,
        grossSalary: 80000,
        netSalary: 76000,
        currency: "INR",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch salary structure" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin permission required" } }, { status: 403 });
    }

    const { userId, basic = 0, hra = 0, allowances = 0, bonus = 0, deductions = 0, currency = "INR" } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "User ID is required" } }, { status: 400 });
    }

    const numBasic = Number(basic) || 0;
    const numHra = Number(hra) || 0;
    const numAllowances = Number(allowances) || 0;
    const numBonus = Number(bonus) || 0;
    const numDeductions = Number(deductions) || 0;

    const grossSalary = numBasic + numHra + numAllowances + numBonus;
    const netSalary = Math.max(0, grossSalary - numDeductions);

    const salary = await prisma.salaryStructure.upsert({
      where: { userId },
      create: {
        userId,
        basic: numBasic,
        hra: numHra,
        allowances: numAllowances,
        bonus: numBonus,
        deductions: numDeductions,
        grossSalary,
        netSalary,
        currency,
      },
      update: {
        basic: numBasic,
        hra: numHra,
        allowances: numAllowances,
        bonus: numBonus,
        deductions: numDeductions,
        grossSalary,
        netSalary,
        currency,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "SALARY_UPDATED",
        entityType: "PAYROLL",
        entityId: userId,
        detailsJson: JSON.stringify({ grossSalary, netSalary }),
      },
    });

    return NextResponse.json({
      success: true,
      data: salary,
      message: "Salary structure updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to update salary" } }, { status: 500 });
  }
}
