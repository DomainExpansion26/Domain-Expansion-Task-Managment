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

    const timeline = await prisma.employeeTimeline.findMany({
      where: { userId },
      orderBy: { effectiveDate: "desc" },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, createdAt: true, hrProfile: true },
    });

    // If no timeline recorded yet, provide default joining event
    if (timeline.length === 0 && user) {
      return NextResponse.json({
        success: true,
        data: [
          {
            id: `TL-JOIN-${userId}`,
            userId,
            eventType: "JOINED",
            title: "Joined Domain Expansion",
            description: `Employee commenced active service on ${new Date(user.hrProfile?.joiningDate || user.createdAt).toLocaleDateString()}`,
            effectiveDate: user.hrProfile?.joiningDate || user.createdAt,
          },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      data: timeline,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch timeline" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin permission required" } }, { status: 403 });
    }

    const { userId, eventType, title, description, effectiveDate, newDepartment, newDesignation, newManagerId } = await request.json();

    if (!userId || !eventType || !title?.trim()) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "User ID, event type, and title are required" } }, { status: 400 });
    }

    const event = await prisma.employeeTimeline.create({
      data: {
        userId,
        eventType,
        title: title.trim(),
        description: description?.trim() || null,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        recordedById: currentUser.id,
      },
    });

    // If promotion or transfer, update user & HRProfile accordingly
    if (eventType === "PROMOTION" && newDesignation) {
      await prisma.user.update({
        where: { id: userId },
        data: { jobTitle: newDesignation.trim() },
      });
      await prisma.hRProfile.update({
        where: { userId },
        data: { designation: newDesignation.trim() },
      });
    }

    if (eventType === "TRANSFER") {
      const userUpdate: any = {};
      if (newDepartment) userUpdate.department = newDepartment.trim();
      if (newManagerId) userUpdate.managerId = newManagerId;

      if (Object.keys(userUpdate).length > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: userUpdate,
        });
      }

      if (newDepartment) {
        await prisma.hRProfile.update({
          where: { userId },
          data: { department: newDepartment.trim() },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: event,
      message: `Event "${event.title}" recorded in employee timeline`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to record timeline event" } }, { status: 500 });
  }
}
