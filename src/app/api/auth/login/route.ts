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
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: { code: "ACCOUNT_DEACTIVATED", message: "Your account has been deactivated. Please contact an administrator." } },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } },
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
              message: "Access Denied: Super Admin role required to enter the Super Admin portal.",
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
              message: "Access Denied: HRMS Super Admin role required to enter this portal.",
            },
          },
          { status: 403 }
        );
      }
    } else if (normPortal === "HRMS") {
      if (!isHRMSActive(user)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "HRMS_NOT_ACTIVATED",
              message: "HRMS Access Not Available: Your account has not been activated for HRMS. Please contact your administrator.",
            },
          },
          { status: 403 }
        );
      }
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        entityType: "USER",
        entityId: user.id,
        detailsJson: JSON.stringify({ email: user.email, portal, role: user.role }),
      },
    });

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
        },
        token,
      },
      message: "Login successful",
    });

    return createAuthCookieResponse(response, token);
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
