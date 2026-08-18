import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { emitPlatformEvent } from "@/lib/events";

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      jobTitle,
      department,
      portal = "MAIN",
    } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Name, email, and password are required." } },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: { code: "PASSWORD_MISMATCH", message: "Password and Confirm Password do not match." } },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_PASSWORD", message: "Password must be at least 6 characters." } },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "USER_EXISTS", message: "An account with this email address already exists. Please sign in." } },
        { status: 400 }
      );
    }

    const userCount = await prisma.user.count();
    let assignedRole = "MEMBER";
    let hrmsStatus = "PENDING_ACTIVATION";
    let defaultDesignation = jobTitle?.trim() || "Team Member";
    let defaultDepartment = department?.trim() || "General";

    const normPortal = portal?.trim()?.toUpperCase()?.replace(/[^A-Z]/g, "_");
    if (normPortal === "SUPER_ADMIN" || normPortal === "SUPERADMIN") {
      assignedRole = "SUPER_ADMIN";
      hrmsStatus = "ACTIVE";
      defaultDesignation = jobTitle?.trim() || "Super Administrator";
      defaultDepartment = department?.trim() || "Executive Management";
    } else if (normPortal === "HRMS_SUPER_ADMIN" || normPortal === "HRMSSUPERADMIN") {
      assignedRole = "HR_ADMIN";
      hrmsStatus = "ACTIVE";
      defaultDesignation = jobTitle?.trim() || "HR Super Administrator";
      defaultDepartment = department?.trim() || "Human Resources";
    } else {
      // Normal Member registration
      assignedRole = "MEMBER";
      hrmsStatus = "PENDING_ACTIVATION";
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create User (Never auto-assigns projects, never gives unassigned privileges)
    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        role: assignedRole,
        jobTitle: defaultDesignation,
        department: defaultDepartment,
        avatarUrl: null,
        isEmailVerified: true,
        isActive: true,
        hrProfile: {
          create: {
            employeeId: `EMP-${1000 + userCount + 1}`,
            designation: defaultDesignation,
            department: defaultDepartment,
            status: hrmsStatus,
          },
        },
      },
      include: {
        hrProfile: true,
      },
    });

    // Create Notification Preferences
    await prisma.notificationPreference.create({
      data: {
        userId: user.id,
        emailTaskAssigned: true,
        emailTaskUpdated: true,
        emailMention: true,
        emailComment: true,
        emailDueDate: true,
        emailOverdue: true,
        inAppTaskAssigned: true,
        inAppTaskUpdated: true,
        inAppMention: true,
        inAppComment: true,
        inAppDueDate: true,
        inAppOverdue: true,
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_REGISTERED",
        entityType: "USER",
        entityId: user.id,
        detailsJson: JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          portal,
          hrmsStatus,
        }),
      },
    });

    // Send welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to Domain Expansion!",
        message: `Your account has been created successfully. An administrator will assign you to projects and activate your permissions as needed.`,
        type: "SYSTEM",
        link: "/dashboard",
      },
    });

    // Broadcast user registered event
    emitPlatformEvent({
      event: "user_registered",
      data: { userId: user.id, name: user.name, email: user.email, role: user.role },
    });

    // IMPORTANT: DO NOT automatically log in after registration. Return success response.
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          jobTitle: user.jobTitle,
          department: user.department,
          avatarUrl: user.avatarUrl,
        },
      },
      message: "Account created successfully. Please sign in with your credentials.",
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to register account." } },
      { status: 500 }
    );
  }
}
