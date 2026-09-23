import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isSuperAdmin, isHRAdmin } from "@/lib/permissions";

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { managerId, teamLeadId, targetUserId } = await request.json();

    // Determine target user to update
    const isTargetingOther = Boolean(targetUserId && targetUserId !== currentUser.id);

    if (isTargetingOther) {
      const userRole = currentUser.role;
      const canManage =
        isSuperAdmin(userRole) ||
        isHRAdmin(userRole) ||
        userRole === "MANAGER" ||
        userRole === "PROJECT_MANAGER" ||
        userRole === "TEAM_LEAD";

      if (!canManage) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Only Admins, Managers, or Team Leads can update another member's reporting line.",
            },
          },
          { status: 403 }
        );
      }
    }

    const updateUserId = isTargetingOther ? targetUserId : currentUser.id;

    // Validate that at least one of manager or team lead is selected (unless target is super admin)
    const targetUser = await withDbRetry(() =>
      prisma.user.findUnique({
        where: { id: updateUserId },
        select: { id: true, role: true, name: true, email: true },
      })
    );

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    const cleanManagerId = managerId ? String(managerId).trim() : null;
    const cleanTeamLeadId = teamLeadId ? String(teamLeadId).trim() : null;

    if (targetUser.role !== "SUPER_ADMIN" && !cleanManagerId && !cleanTeamLeadId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "HIERARCHY_REQUIRED",
            message: "Every member must have a Reporting Manager or Reporting Team Lead selected.",
          },
        },
        { status: 400 }
      );
    }

    // Prevent circular reference (user cannot report to themselves)
    if (cleanManagerId && cleanManagerId === updateUserId) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_HIERARCHY", message: "You cannot select yourself as your Reporting Manager." } },
        { status: 400 }
      );
    }

    if (cleanTeamLeadId && cleanTeamLeadId === updateUserId) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_HIERARCHY", message: "You cannot select yourself as your Team Lead." } },
        { status: 400 }
      );
    }

    // Verify manager exists if provided
    if (cleanManagerId) {
      const managerExists = await withDbRetry(() =>
        prisma.user.findUnique({ where: { id: cleanManagerId }, select: { id: true, name: true } })
      );
      if (!managerExists) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Selected Reporting Manager does not exist." } },
          { status: 400 }
        );
      }
    }

    // Verify team lead exists if provided
    if (cleanTeamLeadId) {
      const leadExists = await withDbRetry(() =>
        prisma.user.findUnique({ where: { id: cleanTeamLeadId }, select: { id: true, name: true } })
      );
      if (!leadExists) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Selected Reporting Team Lead does not exist." } },
          { status: 400 }
        );
      }
    }

    // Update user record
    const updatedUser = await withDbRetry(() =>
      prisma.user.update({
        where: { id: updateUserId },
        data: {
          managerId: cleanManagerId,
          teamLeadId: cleanTeamLeadId,
        },
        include: {
          manager: { select: { id: true, name: true, email: true, role: true } },
          teamLead: { select: { id: true, name: true, email: true, role: true } },
          hrProfile: true,
        },
      })
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "HIERARCHY_UPDATED",
        entityType: "USER",
        entityId: updateUserId,
        detailsJson: JSON.stringify({
          managerId: cleanManagerId,
          teamLeadId: cleanTeamLeadId,
          updatedBy: currentUser.name,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
      message: "Reporting line successfully configured.",
    });
  } catch (error: any) {
    console.error("Hierarchy update error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update reporting line." } },
      { status: 500 }
    );
  }
}
