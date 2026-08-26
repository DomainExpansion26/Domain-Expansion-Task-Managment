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

    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });

    // Compute employee counts per department
    const users = await prisma.user.findMany({
      select: { department: true, isActive: true },
    });

    const deptWithCounts = departments.map((d) => {
      const activeCount = users.filter((u) => (u.department || "").toLowerCase() === d.name.toLowerCase() && u.isActive).length;
      const totalCount = users.filter((u) => (u.department || "").toLowerCase() === d.name.toLowerCase()).length;
      return {
        ...d,
        activeEmployees: activeCount,
        totalEmployees: totalCount,
      };
    });

    return NextResponse.json({
      success: true,
      data: deptWithCounts,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch departments" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin permission required" } }, { status: 403 });
    }

    const { name, code, description, managerId } = await request.json();

    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Department name and code are required" } }, { status: 400 });
    }

    const existing = await prisma.department.findFirst({
      where: {
        OR: [
          { name: { equals: name.trim(), mode: "insensitive" } },
          { code: { equals: code.trim().toUpperCase(), mode: "insensitive" } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: { code: "DUPLICATE", message: "Department name or code already exists" } }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        managerId: managerId || null,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "DEPARTMENT_CREATED",
        entityType: "DEPARTMENT",
        entityId: department.id,
        detailsJson: JSON.stringify({ name: department.name, code: department.code }),
      },
    });

    return NextResponse.json({
      success: true,
      data: department,
      message: `Department ${department.name} created successfully`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to create department" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin permission required" } }, { status: 403 });
    }

    const { id, name, description, managerId, isActive } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Department ID is required" } }, { status: 400 });
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(managerId !== undefined ? { managerId: managerId || null } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Department ${updated.name} updated successfully`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to update department" } }, { status: 500 });
  }
}
