import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { emitPlatformEvent } from "@/lib/events";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, jobTitle, department, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Name, email, and password are required." } },
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
    const assignedRole = role || (userCount === 0 ? "SUPER_ADMIN" : "TEAM_MEMBER");
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

    // Auto-join existing projects as a member
    const activeProjects = await prisma.project.findMany();
    for (const project of activeProjects) {
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: assignedRole === "SUPER_ADMIN" ? "ADMIN" : assignedRole === "PROJECT_MANAGER" ? "MANAGER" : "MEMBER",
        },
      });
    }

    // Send welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to Domain Expansion!",
        message: `Your account has been created with role: ${assignedRole.replace("_", " ")}. Start by creating tasks or exploring projects.`,
        type: "SYSTEM",
        link: "/",
      },
    });

    // Broadcast user registered event to all connected team members
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
