import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isHRAdmin, isSuperAdmin, isManager, isTeamLead } from "@/lib/permissions";
import { emitPlatformEvent } from "@/lib/events";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const viewAll = searchParams.get("viewAll") === "true";
    const status = searchParams.get("status");

    let where: any = {};
    if (status) where.status = status;

    if (viewAll && (isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role))) {
      // HR Admin and Super Admin can view all leaves
    } else if (viewAll && (isManager(currentUser.role) || isTeamLead(currentUser.role))) {
      // Managers / Team Leads can view their subordinates' leaves
      where.OR = [
        { userId: currentUser.id },
        { user: { managerId: currentUser.id } },
        { user: { teamLeadId: currentUser.id } },
      ];
    } else {
      // Regular users view only their own leaves
      where.userId = currentUser.id;
    }

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: leaves,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch leaves" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { leaveType, startDate, endDate, reason } = await request.json();

    // Master Prompt Section 28 & 39: Mandatory validation
    if (!leaveType || !startDate || !endDate || !reason?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Leave type, start date, end date, and reason are required" } },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const leave = await prisma.leave.create({
      data: {
        userId: currentUser.id,
        leaveType,
        startDate: start,
        endDate: end,
        daysCount,
        reason: reason.trim(),
        status: "PENDING",
      },
      include: { user: true },
    });

    // Notify Manager or Team Lead if assigned
    const userWithLeads = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { managerId: true, teamLeadId: true },
    });

    const approverIds = [userWithLeads?.managerId, userWithLeads?.teamLeadId].filter(Boolean) as string[];
    for (const approverId of approverIds) {
      await prisma.notification.create({
        data: {
          userId: approverId,
          title: "New Leave Application Pending Review",
          message: `${currentUser.name} applied for ${daysCount} day(s) ${leaveType} leave (${start.toLocaleDateString()} - ${end.toLocaleDateString()}).`,
          type: "LEAVE_UPDATE",
          link: "/hrms/leave",
        },
      });
    }

    emitPlatformEvent({
      event: "leave_applied",
      data: { leaveId: leave.id, userName: currentUser.name },
    });

    return NextResponse.json({
      success: true,
      data: leave,
      message: "Leave application submitted successfully for review.",
    });
  } catch (error: any) {
    console.error("Apply leave error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to apply for leave" } }, { status: 500 });
  }
}

// Approve or Reject Leave
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { leaveId, status, approverComment } = await request.json(); // status: "APPROVED" | "REJECTED" | "CANCELLED"

    if (!leaveId || !status) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "leaveId and status are required" } }, { status: 400 });
    }

    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: { user: true },
    });

    if (!leave) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Leave application not found" } }, { status: 404 });
    }

    // Permission check: User can cancel their own pending leave. Otherwise must be Manager/TeamLead of employee, HR_ADMIN, or SUPER_ADMIN.
    const isSelfCancel = status === "CANCELLED" && leave.userId === currentUser.id;
    const isAuthorizedApprover =
      isSuperAdmin(currentUser.role) ||
      isHRAdmin(currentUser.role) ||
      leave.user.managerId === currentUser.id ||
      leave.user.teamLeadId === currentUser.id;

    if (!isSelfCancel && !isAuthorizedApprover) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You lack authority to approve/reject this leave request" } },
        { status: 403 }
      );
    }

    const updated = await prisma.leave.update({
      where: { id: leaveId },
      data: {
        status,
        approverId: currentUser.id,
        approverComment: approverComment || null,
        actionAt: new Date(),
      },
    });

    // If approved, update attendance records for the leave date range
    if (status === "APPROVED") {
      const curDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      while (curDate <= endDate) {
        const dateUtc = new Date(Date.UTC(curDate.getUTCFullYear(), curDate.getUTCMonth(), curDate.getUTCDate()));
        await prisma.attendance.upsert({
          where: {
            userId_date: {
              userId: leave.userId,
              date: dateUtc,
            },
          },
          create: {
            userId: leave.userId,
            date: dateUtc,
            status: "LEAVE",
            notes: `${leave.leaveType} Leave (Approved by ${currentUser.name})`,
          },
          update: {
            status: "LEAVE",
            notes: `${leave.leaveType} Leave (Approved by ${currentUser.name})`,
          },
        });
        curDate.setDate(curDate.getDate() + 1);
      }
    }

    // Notify employee of decision
    await prisma.notification.create({
      data: {
        userId: leave.userId,
        title: `Leave Request ${status === "APPROVED" ? "Approved" : "Rejected"}`,
        message: `${currentUser.name} has ${status.toLowerCase()} your ${leave.leaveType} leave request (${new Date(leave.startDate).toLocaleDateString()} - ${new Date(leave.endDate).toLocaleDateString()}).`,
        type: "LEAVE_UPDATE",
        link: "/hrms/leave",
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
        entityType: "LEAVE",
        entityId: leave.id,
        detailsJson: JSON.stringify({
          applicant: leave.user.name,
          approver: currentUser.name,
          decision: status,
          comments: approverComment,
        }),
      },
    });

    emitPlatformEvent({
      event: "leave_status_updated",
      data: { leaveId: leave.id, status },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Leave application ${status.toLowerCase()}`,
    });
  } catch (error: any) {
    console.error("Leave decision error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update leave status" } }, { status: 500 });
  }
}
