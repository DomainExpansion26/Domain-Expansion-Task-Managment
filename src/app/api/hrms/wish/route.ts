import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { targetUserId, message = "Wishing you a very Happy Birthday! Have a wonderful year ahead! 🎉🎂" } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Target user ID is required" } }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
    }

    // Create a real notification for the birthday person
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        title: `🎂 Birthday Wish from ${currentUser.name}`,
        message: `${currentUser.name} wished you: "${message}"`,
        type: "ANNOUNCEMENT",
        link: "/hrms/dashboard",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Birthday wish sent to ${targetUser.name}!`,
    });
  } catch (error: any) {
    console.error("Birthday wish error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to send birthday wish" } }, { status: 500 });
  }
}
