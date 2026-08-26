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

    if (isHRorSuper && !targetUserId) {
      const records = await prisma.offboardingRecord.findMany({ orderBy: { createdAt: "desc" } });
      const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, jobTitle: true, department: true } });
      const userMap = new Map(users.map((u) => [u.id, u]));

      const formatted = records.map((r) => ({
        ...r,
        user: userMap.get(r.userId) || null,
      }));

      return NextResponse.json({ success: true, data: formatted });
    }

    const record = await prisma.offboardingRecord.findUnique({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch offboarding data" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { userId, lastWorkingDay, exitReason, noticePeriodDays = 30 } = await request.json();
    const targetUserId = userId && (isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role)) ? userId : currentUser.id;

    if (!lastWorkingDay) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Last working day is required" } }, { status: 400 });
    }

    const offboarding = await prisma.offboardingRecord.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        resignationDate: new Date(),
        lastWorkingDay: new Date(lastWorkingDay),
        exitReason: exitReason?.trim() || "Career Growth",
        noticePeriodDays: Number(noticePeriodDays) || 30,
        finalStatus: "RESIGNED",
      },
      update: {
        lastWorkingDay: new Date(lastWorkingDay),
        exitReason: exitReason?.trim() || "Career Growth",
        noticePeriodDays: Number(noticePeriodDays) || 30,
      },
    });

    // Record timeline
    await prisma.employeeTimeline.create({
      data: {
        userId: targetUserId,
        eventType: "RESIGNATION",
        title: "Resignation Submitted",
        description: `Last working day set to ${new Date(lastWorkingDay).toLocaleDateString()}. Reason: ${exitReason || "Career Growth"}`,
        effectiveDate: new Date(),
        recordedById: currentUser.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: offboarding,
      message: "Resignation / Exit process initiated successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to process offboarding" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin permission required" } }, { status: 403 });
    }

    const { userId, managerApproval, hrApproval, exitInterviewDone, assetCleared, documentCleared, finalStatus, notes } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "User ID is required" } }, { status: 400 });
    }

    const updateData: any = {};
    if (managerApproval !== undefined) updateData.managerApproval = Boolean(managerApproval);
    if (hrApproval !== undefined) updateData.hrApproval = Boolean(hrApproval);
    if (exitInterviewDone !== undefined) updateData.exitInterviewDone = Boolean(exitInterviewDone);
    if (assetCleared !== undefined) updateData.assetCleared = Boolean(assetCleared);
    if (documentCleared !== undefined) updateData.documentCleared = Boolean(documentCleared);
    if (finalStatus !== undefined) updateData.finalStatus = finalStatus;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.offboardingRecord.update({
      where: { userId },
      data: updateData,
    });

    // If final exit approval completed, deactivate user account safely (do not delete)
    if (finalStatus && (finalStatus === "TERMINATED" || finalStatus === "RESIGNED" || finalStatus === "INACTIVE")) {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });
      await prisma.hRProfile.update({
        where: { userId },
        data: { status: finalStatus },
      });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Offboarding record updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to update offboarding" } }, { status: 500 });
  }
}
