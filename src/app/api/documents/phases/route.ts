import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    const category = searchParams.get("category");

    const where: any = {};
    if (department && department !== "ALL_DEPTS") where.department = department.toUpperCase();
    if (category && category !== "ALL_CATEGORIES") where.category = category;

    const phases = await prisma.docPhase.findMany({
      where,
      orderBy: [{ department: "asc" }, { phaseNumber: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: phases,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch phases" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !isSuperAdmin(currentUser)) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Super Admin permission required" } }, { status: 403 });
    }

    const { department, category = "General", phaseNumber, phaseName, description } = await request.json();

    if (!department || !phaseNumber || !phaseName?.trim()) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Department, Phase Number, and Phase Name are required" } }, { status: 400 });
    }

    const phase = await prisma.docPhase.upsert({
      where: {
        department_category_phaseNumber: {
          department: department.trim().toUpperCase(),
          category: category.trim(),
          phaseNumber: Number(phaseNumber),
        },
      },
      create: {
        department: department.trim().toUpperCase(),
        category: category.trim(),
        phaseNumber: Number(phaseNumber),
        phaseName: phaseName.trim(),
        description: description?.trim() || null,
      },
      update: {
        phaseName: phaseName.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: phase,
      message: `Phase ${phase.phaseNumber} (${phase.phaseName}) created for ${phase.department} / ${phase.category}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to create phase" } }, { status: 500 });
  }
}
