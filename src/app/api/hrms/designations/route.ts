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

    const designations = await prisma.designation.findMany({
      orderBy: { title: "asc" },
    });

    const users = await prisma.user.findMany({
      select: { jobTitle: true, isActive: true },
    });

    const desigWithCounts = designations.map((d) => {
      const activeCount = users.filter((u) => (u.jobTitle || "").toLowerCase() === d.title.toLowerCase() && u.isActive).length;
      return {
        ...d,
        activeEmployees: activeCount,
      };
    });

    return NextResponse.json({
      success: true,
      data: desigWithCounts,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch designations" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin permission required" } }, { status: 403 });
    }

    const { title, department, level, description } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Designation title is required" } }, { status: 400 });
    }

    const designation = await prisma.designation.upsert({
      where: { title: title.trim() },
      create: {
        title: title.trim(),
        department: department?.trim() || null,
        level: level || "Mid-Level",
        description: description?.trim() || null,
        isActive: true,
      },
      update: {
        department: department?.trim() || null,
        level: level || "Mid-Level",
        description: description?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: designation,
      message: `Designation ${designation.title} saved successfully`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to save designation" } }, { status: 500 });
  }
}
