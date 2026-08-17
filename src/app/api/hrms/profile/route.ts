import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isHRAdmin, isSuperAdmin } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

    const userId = targetUserId && (isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role))
      ? targetUserId
      : currentUser.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        department: true,
        avatarUrl: true,
        createdAt: true,
        manager: { select: { id: true, name: true, email: true, jobTitle: true } },
        teamLead: { select: { id: true, name: true, email: true, jobTitle: true } },
        hrProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Employee not found" } }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch HR profile" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { userId, phone, emergencyContact, address, dateOfBirth } = await request.json();

    const targetUserId = userId && (isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role))
      ? userId
      : currentUser.id;

    const profile = await prisma.hRProfile.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        phone: phone || null,
        emergencyContact: emergencyContact || null,
        address: address || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
      update: {
        ...(phone !== undefined ? { phone } : {}),
        ...(emergencyContact !== undefined ? { emergencyContact } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(dateOfBirth !== undefined ? { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data: profile,
      message: "HR Profile updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update HR profile" } }, { status: 500 });
  }
}
