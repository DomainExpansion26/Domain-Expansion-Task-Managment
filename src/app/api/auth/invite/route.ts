import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { getCurrentUserFromRequest, hashPassword, signSessionToken, createAuthCookieResponse } from "@/lib/auth";
import { hasPermission, isSuperAdmin, isHRAdmin, normalizeRole } from "@/lib/permissions";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

// 1. Send Invitation (Super Admin / HR Admin / PM / Team Lead)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const userRole = currentUser.role;
    const isSuper = isSuperAdmin(userRole);
    const isHR = isHRAdmin(userRole);
    const isPM = userRole === "MANAGER" || userRole === "PROJECT_MANAGER";
    const isLead = userRole === "TEAM_LEAD";

    if (!isSuper && !isHR && !isPM && !isLead) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only Admins, Project Managers, and Team Leads can invite members" } },
        { status: 403 }
      );
    }

    const { name, email, role = "MEMBER" } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Name and email are required" } },
        { status: 400 }
      );
    }

    const normalizedTargetRole = normalizeRole(role);

    // Role restrictions based on hierarchy:
    // Team Lead can only invite MEMBER or QA
    if (isLead && normalizedTargetRole !== "MEMBER" && normalizedTargetRole !== "QA") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Team Leads can only invite Team Members and QA Engineers" } },
        { status: 403 }
      );
    }

    // Project Manager can invite TEAM_LEAD, MEMBER, QA (not Super Admin)
    if (isPM && (normalizedTargetRole === "SUPER_ADMIN" || normalizedTargetRole === "HR_ADMIN")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Project Managers can only invite Team Leads, Members, and QA" } },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existing = await withDbRetry(() =>
      prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      })
    );

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "USER_EXISTS", message: "A user with this email already exists" } },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const invitation = await withDbRetry(() =>
      prisma.invitation.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          role: normalizedTargetRole,
          token,
          status: "PENDING",
          expiresAt,
          invitedById: currentUser.id,
        },
      })
    );

    // Send transactional invitation email
    await sendEmail({
      to: invitation.email,
      subject: "You're invited to Domain Expansion Task Management",
      template: "INVITATION",
      data: {
        name: invitation.name,
        role: invitation.role,
        token: invitation.token,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "INVITE_SENT",
        entityType: "INVITATION",
        entityId: invitation.id,
        detailsJson: JSON.stringify({ email: invitation.email, role: invitation.role }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { invitation },
      message: `Invitation sent to ${invitation.email}`,
    });
  } catch (error: any) {
    console.error("Invitation error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to send invitation" } },
      { status: 500 }
    );
  }
}

// 2. Validate Invitation Token
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_TOKEN", message: "Invitation token required" } },
      { status: 400 }
    );
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { invitedBy: { select: { name: true, email: true } } },
  });

  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    return NextResponse.json(
      { success: false, error: { code: "EXPIRED_TOKEN", message: "Invitation is invalid or has expired" } },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      name: invitation.name,
      email: invitation.email,
      role: invitation.role,
      invitedBy: invitation.invitedBy?.name || "Team Lead",
    },
  });
}

// 3. Accept Invitation & Setup Account
export async function PUT(request: NextRequest) {
  try {
    const { token, name, password, jobTitle, department } = await request.json();

    if (!token || !password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Password must be at least 6 characters" } },
        { status: 400 }
      );
    }

    const invitation = await withDbRetry(() =>
      prisma.invitation.findUnique({
        where: { token },
      })
    );

    if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: { code: "EXPIRED_TOKEN", message: "Invitation is invalid or has expired" } },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    // If invited by Team Lead or Manager, auto-link hierarchy
    let managerId: string | null = null;
    let teamLeadId: string | null = null;

    if (invitation.invitedById) {
      const inviterId = invitation.invitedById;
      const inviter = await withDbRetry(() =>
        prisma.user.findUnique({ where: { id: inviterId } })
      );
      if (inviter) {
        if (inviter.role === "TEAM_LEAD") {
          teamLeadId = inviter.id;
          managerId = inviter.managerId || null;
        } else if (inviter.role === "MANAGER" || inviter.role === "PROJECT_MANAGER") {
          managerId = inviter.id;
        }
      }
    }

    const user = await withDbRetry(() =>
      prisma.user.create({
        data: {
          name: name || invitation.name,
          email: invitation.email,
          passwordHash,
          role: normalizeRole(invitation.role),
          jobTitle: jobTitle || "Team Member",
          department: department || "Engineering",
          managerId: managerId || undefined,
          teamLeadId: teamLeadId || undefined,
          isEmailVerified: true,
          isActive: true,
          notificationPref: {
            create: {
              emailTaskAssigned: true,
              emailTaskUpdated: true,
              emailMention: true,
              emailComment: true,
              emailDueDate: true,
              emailOverdue: true,
            },
          },
        },
      })
    );

    // Mark invitation accepted
    await withDbRetry(() =>
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      })
    );

    // Add to all active projects automatically as MEMBER
    const activeProjects = await prisma.project.findMany({ where: { status: "ACTIVE" } });
    for (const project of activeProjects) {
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: "MEMBER",
        },
      });
    }

    const sessionToken = signSessionToken(user);

    const response = NextResponse.json({
      success: true,
      data: { user, token: sessionToken },
      message: "Account created successfully. Welcome to Domain Expansion!",
    });

    return createAuthCookieResponse(response, sessionToken);
  } catch (error: any) {
    console.error("Accept invitation error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to setup account" } },
      { status: 500 }
    );
  }
}
