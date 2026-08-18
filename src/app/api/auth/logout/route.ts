import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookieResponse, getCurrentUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (user) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "LOGOUT",
          entityType: "USER",
          entityId: user.id,
          detailsJson: JSON.stringify({ email: user.email }),
        },
      });
    }
  } catch {
    // Ignore audit log error on logout
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
  return clearAuthCookieResponse(response);
}
