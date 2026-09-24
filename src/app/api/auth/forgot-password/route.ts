import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { signPasswordResetToken } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Email address is required." } },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look up user by email safely
    const user = await withDbRetry(() =>
      prisma.user.findUnique({
        where: { email: cleanEmail },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          isActive: true,
          role: true,
        },
      })
    );

    // If user does not exist or is inactive, return standard success message to avoid email enumeration
    if (!user || !user.isActive) {
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent to your inbox.",
      });
    }

    // Generate secure reset token
    const token = signPasswordResetToken({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
    });

    // Send password reset email via live Resend API and/or Dev Mailbox
    const emailResult = await sendEmail({
      to: user.email,
      subject: "Reset your Domain Expansion password",
      template: "PASSWORD_RESET",
      data: {
        name: user.name,
        token,
      },
    });

    // Also record in AuditLog
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET",
        entityType: "User",
        entityId: user.id,
        detailsJson: JSON.stringify({
          action: "REQUESTED_RESET",
          email: user.email,
          emailResultSuccess: emailResult.success,
        }),
      },
    }).catch((err) => console.error("Audit log error:", err));

    return NextResponse.json({
      success: true,
      message: "Password reset link has been dispatched to your email.",
      token: token,
      devToken: token,
      resetUrl: `/reset-password?token=${token}`,
      email: user.email,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred. Please try again." } },
      { status: 500 }
    );
  }
}
