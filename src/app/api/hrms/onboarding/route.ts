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

    const checklist = await prisma.onboardingChecklist.findUnique({
      where: { userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, jobTitle: true, department: true, hrProfile: true },
    });

    return NextResponse.json({
      success: true,
      data: checklist || {
        userId,
        accountCreated: true,
        profileCompleted: Boolean(user?.name && user?.hrProfile?.phone),
        departmentAssigned: Boolean(user?.department),
        managerAssigned: false,
        projectAssigned: false,
        documentsUploaded: false,
        hrOrientation: false,
        policyAcknowledged: false,
        status: "IN_PROGRESS",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch onboarding checklist" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { userId, stepKey, completed = true } = await request.json();
    const targetUserId = userId || currentUser.id;

    const currentChecklist = await prisma.onboardingChecklist.findUnique({ where: { userId: targetUserId } });

    const updatedData: any = {
      ...(currentChecklist || { userId: targetUserId, accountCreated: true }),
      [stepKey]: Boolean(completed),
    };

    // Calculate if all steps are completed
    const allDone =
      updatedData.accountCreated &&
      updatedData.profileCompleted &&
      updatedData.departmentAssigned &&
      updatedData.managerAssigned &&
      updatedData.projectAssigned &&
      updatedData.documentsUploaded &&
      updatedData.hrOrientation &&
      updatedData.policyAcknowledged;

    updatedData.status = allDone ? "COMPLETED" : "IN_PROGRESS";

    const saved = await prisma.onboardingChecklist.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        accountCreated: true,
        [stepKey]: Boolean(completed),
        status: updatedData.status,
      },
      update: {
        [stepKey]: Boolean(completed),
        status: updatedData.status,
      },
    });

    return NextResponse.json({
      success: true,
      data: saved,
      message: `Onboarding step "${stepKey}" updated`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to update onboarding" } }, { status: 500 });
  }
}
