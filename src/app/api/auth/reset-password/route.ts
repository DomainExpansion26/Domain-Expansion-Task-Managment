import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { decodePasswordResetToken, verifyPasswordResetToken, hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_TOKEN", message: "Password reset token is required." } },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "New password must be at least 6 characters." } },
        { status: 400 }
      );
    }

    // 1. Decode token to find user ID
    const decoded = decodePasswordResetToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_TOKEN", message: "The reset link is invalid or expired." } },
        { status: 400 }
      );
    }

    // 2. Fetch user to retrieve their current password hash
    const user = await withDbRetry(() =>
      prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, passwordHash: true, isActive: true },
      })
    );

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User account not found or is inactive." } },
        { status: 404 }
      );
    }

    // 3. Verify the token against the user's passwordHash
    const verified = verifyPasswordResetToken(token, user.passwordHash);
    if (!verified) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EXPIRED_TOKEN",
            message: "This password reset link has already been used or has expired. Please request a new one.",
          },
        },
        { status: 400 }
      );
    }

    // 4. Hash new password and update user without touching any other fields or relations
    const newHash = await hashPassword(newPassword);

    await withDbRetry(() =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newHash,
        },
      })
    );

    // 5. Record AuditLog
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET",
        entityType: "User",
        entityId: user.id,
        detailsJson: JSON.stringify({
          action: "PASSWORD_CHANGED_VIA_RESET",
          email: user.email,
        }),
      },
    }).catch((err) => console.error("Audit log error:", err));

    return NextResponse.json({
      success: true,
      message: "Password has been successfully reset! You can now sign in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to reset password. Please try again." } },
      { status: 500 }
    );
  }
}
