import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { emitPlatformEvent } from "@/lib/events";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, jobTitle, department } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Name, email, and password are required." } },
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

    // Master Prompt Section 6: Public registration MUST NOT allow choosing privileged roles.
    // First ever registered user becomes SUPER_ADMIN if db is empty; all subsequent public signups are strictly MEMBER.
    const userCount = await prisma.user.count();
    const assignedRole = userCount === 0 ? "SUPER_ADMIN" : "MEMBER";
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User
    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        role: assignedRole,
        jobTitle: jobTitle?.trim() || "Software Engineer",
        department: department?.trim() || "Engineering",
        avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + (cleanEmail.length % 500)}?w=150&auto=format&fit=crop&q=80`,
        isEmailVerified: true,
        isActive: true,
        hrProfile: {
          create: {
            employeeId: `EMP-${1000 + userCount + 1}`,
            designation: jobTitle?.trim() || "Software Engineer",
            department: department?.trim() || "Engineering",
            status: "ACTIVE",
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

    // Auto-join existing active projects as a MEMBER
    const activeProjects = await prisma.project.findMany({ where: { status: "ACTIVE" } });
    for (const project of activeProjects) {
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: assignedRole === "SUPER_ADMIN" ? "LEAD" : "MEMBER",
        },
      });
    }

    // Send welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to Domain Expansion!",
        message: `Your account has been created with role: ${assignedRole.replace("_", " ")}. Start by viewing your assigned tasks or checking in on HRMS.`,
        type: "SYSTEM",
        link: "/",
      },
    });

    // Broadcast user registered event
    emitPlatformEvent({
      event: "user_registered",
      data: { userId: user.id, name: user.name, email: user.email, role: user.role },
    });

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
      message: "Account created successfully. Please sign in to continue.",
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to register account." } },
      { status: 500 }
    );
  }
}
