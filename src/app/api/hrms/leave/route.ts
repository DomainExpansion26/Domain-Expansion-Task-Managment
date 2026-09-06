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

    const isSuper = isSuperAdmin(currentUser.role);
    const isHR = isHRAdmin(currentUser.role);
    const isLead = isTeamLead(currentUser.role) || isManager(currentUser.role);

    if (viewAll && (isSuper || isHR)) {
      // Super Admin & HR Admin can view all leaves
    } else if (isLead || viewAll) {
      // Team Leads & Managers: view own leaves + team members' leaves
      const conditions: any[] = [{ userId: currentUser.id }];
      conditions.push({ user: { teamLeadId: currentUser.id } });
      conditions.push({ user: { managerId: currentUser.id } });
      if (currentUser.department) {
        conditions.push({ user: { department: currentUser.department } });
      }
      where.OR = conditions;
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
    console.error("Fetch leaves error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch leaves" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { leaveType, startDate, endDate, reason, isHalfDay, halfDaySession, daysCount: requestedDays } = await request.json();

    if (!leaveType || !startDate || !reason?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Leave type, date, and reason are required" } },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = isHalfDay ? new Date(startDate) : new Date(endDate || startDate);
    
    let daysCount = 1;
    if (isHalfDay || requestedDays === 0.5) {
      daysCount = 0.5;
    } else {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    }

    const sessionLabel = isHalfDay
      ? halfDaySession === "SECOND_HALF"
        ? " (Half Day - 2nd Half)"
        : " (Half Day - 1st Half)"
      : "";

    const leave = await prisma.leave.create({
      data: {
        userId: currentUser.id,
        leaveType,
        startDate: start,
        endDate: end,
        daysCount,
        reason: `${reason.trim()}${sessionLabel}`,
        status: "PENDING",
      },
      include: { user: true },
    });

    // Notification routing:
    const applicantRole = currentUser.role;
    const isHigherTier =
      applicantRole === "TEAM_LEAD" ||
      applicantRole === "MANAGER" ||
      applicantRole === "PROJECT_MANAGER" ||
      applicantRole === "HR_ADMIN";

    const durationText = daysCount === 0.5 ? `0.5 day${sessionLabel}` : `${daysCount} day(s)`;

    if (isHigherTier) {
      // Notify Super Admins
      const superAdmins = await prisma.user.findMany({ where: { role: "SUPER_ADMIN" }, select: { id: true } });
      for (const sa of superAdmins) {
        await prisma.notification.create({
          data: {
            userId: sa.id,
            title: `Executive Leave Request: ${currentUser.name} (${applicantRole})`,
            message: `${currentUser.name} (${applicantRole}) applied for ${durationText} ${leaveType} leave. Requires Super Admin approval.`,
            type: "LEAVE_UPDATE",
            link: "/hrms/leave",
          },
        });
      }
    } else {
      // Notify Team Lead & Manager
      const userWithLeads = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { managerId: true, teamLeadId: true, department: true },
      });

      const approverIds = [userWithLeads?.managerId, userWithLeads?.teamLeadId].filter(Boolean) as string[];
      if (approverIds.length === 0 && userWithLeads?.department) {
        const deptLeads = await prisma.user.findMany({
          where: { department: userWithLeads.department, role: { in: ["TEAM_LEAD", "MANAGER", "PROJECT_MANAGER"] } },
          select: { id: true },
        });
        approverIds.push(...deptLeads.map((l) => l.id));
      }

      for (const approverId of approverIds) {
        await prisma.notification.create({
          data: {
            userId: approverId,
            title: "New Team Member Leave Application",
            message: `${currentUser.name} applied for ${durationText} ${leaveType} leave (${start.toLocaleDateString()}${daysCount > 1 ? ` - ${end.toLocaleDateString()}` : ""}).`,
            type: "LEAVE_UPDATE",
            link: "/hrms/dashboard?tab=leaves",
          },
        });
      }
    }

    emitPlatformEvent({
      event: "leave_applied",
      data: { leaveId: leave.id, userName: currentUser.name },
    });

    return NextResponse.json({
      success: true,
      data: leave,
      message: isHigherTier
        ? "Leave application submitted. Executive leave requires Super Admin approval."
        : "Leave application submitted. Sent to your Team Lead for review.",
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

    const isSelfCancel = status === "CANCELLED" && leave.userId === currentUser.id;

    if (!isSelfCancel) {
      const applicantRole = leave.user.role;
      const isHigherTierApplicant =
        applicantRole === "TEAM_LEAD" ||
        applicantRole === "MANAGER" ||
        applicantRole === "PROJECT_MANAGER" ||
        applicantRole === "HR_ADMIN";

      if (isSuperAdmin(currentUser.role)) {
        // Super Admin can approve ANY leave
      } else if (isHigherTierApplicant) {
        // Team Lead / Manager / HR Admin leaves REQUIRE Super Admin!
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "SUPER_ADMIN_REQUIRED",
              message: `Leave applications for ${applicantRole} (${leave.user.name}) can only be approved by the Super Admin.`,
            },
          },
          { status: 403 }
        );
      } else {
        // Regular members: Team Lead, Manager, or HR Admin can approve
        const isAuthorized =
          isHRAdmin(currentUser.role) ||
          isTeamLead(currentUser.role) ||
          isManager(currentUser.role) ||
          leave.user.teamLeadId === currentUser.id ||
          leave.user.managerId === currentUser.id ||
          (Boolean(currentUser.department) && currentUser.department === leave.user.department);

        if (!isAuthorized) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "FORBIDDEN",
                message: "You lack authority to approve/reject this leave request.",
              },
            },
            { status: 403 }
          );
        }
      }
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
      const s = new Date(leave.startDate);
      const e = new Date(leave.endDate);
      const startMs = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
      const endMs = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate());
      const ONE_DAY = 24 * 60 * 60 * 1000;

      const isHalfDayLeave = leave.daysCount <= 0.5;
      const attendanceStatus = isHalfDayLeave ? "HALF_DAY" : "LEAVE";
      const notePrefix = isHalfDayLeave ? "Half-Day Leave" : `${leave.leaveType} Leave`;

      for (let t = startMs; t <= endMs; t += ONE_DAY) {
        const dateUtc = new Date(t);
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
            status: attendanceStatus,
            notes: `${notePrefix} (Approved by ${currentUser.name})`,
          },
          update: {
            status: attendanceStatus,
            notes: `${notePrefix} (Approved by ${currentUser.name})`,
          },
        });
      }
    }

    // Notify employee of decision
    await prisma.notification.create({
      data: {
        userId: leave.userId,
        title: `Leave Request ${status === "APPROVED" ? "Approved" : "Rejected"}`,
        message: `${currentUser.name} has ${status.toLowerCase()} your ${leave.leaveType} leave request (${new Date(leave.startDate).toLocaleDateString()} - ${new Date(leave.endDate).toLocaleDateString()}).`,
        type: "LEAVE_UPDATE",
        link: "/hrms/dashboard?tab=leaves",
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
          applicantRole: leave.user.role,
          approver: currentUser.name,
          approverRole: currentUser.role,
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
      message: `Leave application ${status.toLowerCase()} successfully. ${status === "APPROVED" ? `${leave.daysCount} day(s) deducted from leave balance.` : ""}`,
    });
  } catch (error: any) {
    console.error("Leave decision error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error?.message || "Failed to update leave status" } }, { status: 500 });
  }
}
