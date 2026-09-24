import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { verifyPassword, signSessionToken, createAuthCookieResponse } from "@/lib/auth";
import { isSuperAdmin, isHRAdmin, isHRMSActive, normalizeRole } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_JSON", message: "Invalid or empty request payload" } },
        { status: 400 }
      );
    }

    const { email, password, portal = "MAIN" } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Email and password are required" } },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await withDbRetry(() =>
      prisma.user.findUnique({
        where: { email: cleanEmail },
        include: {
          hrProfile: true,
        },
      })
    );

    if (!user) {
      const totalUsers = await withDbRetry(() => prisma.user.count()).catch(() => 0);
      if (totalUsers === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "DATABASE_EMPTY",
              message: "No accounts exist in the database yet. Please click 'Create Account' to register your initial account.",
            },
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: `No account found with email "${cleanEmail}". Please check your email or click 'Create Account' to register.`,
          },
        },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: { code: "ACCOUNT_DEACTIVATED", message: "Your account has been deactivated. Please contact an administrator." } },
        { status: 403 }
      );
    }

    let isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch && password.trim() !== password) {
      isMatch = await verifyPassword(password.trim(), user.passwordHash);
    }

    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "WRONG_PASSWORD",
            message: "Incorrect password for this account. Please verify your password and try again.",
          },
        },
        { status: 401 }
      );
    }

    // Portal Authorization Verification
    const normPortal = portal?.trim()?.toUpperCase()?.replace(/[^A-Z]/g, "_");
    
    if (normPortal === "SUPER_ADMIN" || normPortal === "SUPERADMIN") {
      if (!isSuperAdmin(user.role)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access Denied: Super Admin credentials required to access the Super Admin portal.",
            },
          },
          { status: 403 }
        );
      }
    } else if (normPortal === "HRMS_SUPER_ADMIN" || normPortal === "HRMSSUPERADMIN") {
      if (!isHRAdmin(user.role)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access Denied: HRMS Super Admin credentials required to access this portal.",
            },
          },
          { status: 403 }
        );
      }
    } else if (normPortal === "HRMS") {
      // Super Admin accounts cannot be used as employee accounts for HRMS
      if (user.role === "SUPER_ADMIN") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "SUPER_ADMIN_PORTAL_RESTRICTION",
              message: "This account is registered exclusively for Super Admin portal administration. To access the HRMS portal, please create and log in with a member employee account.",
            },
          },
          { status: 403 }
        );
      }

      if (!isHRMSActive(user)) {
        try {
          if (!user.hrProfile) {
            const uniqueEmpId = `EMP-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
            await prisma.hRProfile.create({
              data: {
                userId: user.id,
                employeeId: uniqueEmpId,
                designation: user.jobTitle || "Employee",
                department: user.department || "General",
                status: "ACTIVE",
              },
            });
          } else if (user.hrProfile.status !== "ACTIVE") {
            await prisma.hRProfile.update({
              where: { userId: user.id },
              data: { status: "ACTIVE" },
            });
          }
        } catch (hrErr) {
          console.warn("HR profile auto-activation warning:", hrErr);
        }
      }
    }

    // Record audit log asynchronously / non-blocking
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "LOGIN",
          entityType: "USER",
          entityId: user.id,
          detailsJson: JSON.stringify({ email: user.email, portal, role: user.role }),
        },
      });
    } catch (auditErr) {
      console.warn("Non-fatal login audit log warning:", auditErr);
    }

    const token = signSessionToken(user);

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: normalizeRole(user.role),
          jobTitle: user.jobTitle,
          department: user.department,
          avatarUrl: user.avatarUrl,
          hrmsStatus: user.hrProfile?.status || "INACTIVE",
          ndaAccepted: Boolean(user.ndaAccepted),
          ndaAcceptedAt: user.ndaAcceptedAt,
          ndaVersionAccepted: user.ndaVersionAccepted,
          accountStatus: user.accountStatus || (user.isActive ? "ACTIVE" : "DEACTIVATED"),
          joiningDate: user.joiningDate,
          managerId: user.managerId,
          teamLeadId: user.teamLeadId,
        },
        token,
      },
      message: "Login successful",
    });

    return createAuthCookieResponse(response, token);
  } catch (error: any) {
    console.error("Login route error:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error?.message || "An unexpected error occurred during login. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
