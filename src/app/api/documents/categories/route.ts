import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isSuperAdmin, isManager, isTeamLead } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");

    const where: any = {};
    if (department && department !== "ALL_DEPTS") {
      where.department = department.toUpperCase();
    }

    const categories = await prisma.docCategory.findMany({
      where,
      orderBy: [{ department: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch categories" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    const canManage = isSuperAdmin(currentUser) || isManager(currentUser) || isTeamLead(currentUser?.role);
    if (!currentUser || !canManage) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Manager, Team Lead, or Admin permission required" } }, { status: 403 });
    }

    const { name, department, description, sortOrder = 0 } = await request.json();

    if (!name?.trim() || !department) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Category name and department are required" } }, { status: 400 });
    }

    const category = await prisma.docCategory.upsert({
      where: {
        department_name: {
          department: department.trim().toUpperCase(),
          name: name.trim(),
        },
      },
      create: {
        name: name.trim(),
        department: department.trim().toUpperCase(),
        description: description?.trim() || null,
        sortOrder: Number(sortOrder) || 0,
      },
      update: {
        description: description?.trim() || null,
        sortOrder: Number(sortOrder) || 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
      message: `Category "${category.name}" added to ${category.department}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to create category" } }, { status: 500 });
  }
}
