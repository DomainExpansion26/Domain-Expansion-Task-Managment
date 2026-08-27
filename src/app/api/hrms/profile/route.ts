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
    console.error("Fetch profile error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch HR profile" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const body = await request.json();
    const { userId, name, avatarUrl, phone, emergencyContact, address, dateOfBirth, gender, designation, department, employeeId, joiningDate, status } = body;

    const isAdmin = isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role);
    const targetUserId = userId && isAdmin ? userId : currentUser.id;

    // 1. Update User basic info if allowed
    const userUpdate: any = {};
    if (avatarUrl !== undefined) userUpdate.avatarUrl = avatarUrl;
    if (isAdmin) {
      if (name !== undefined) userUpdate.name = name;
      if (department !== undefined) userUpdate.department = department;
      if (designation !== undefined) userUpdate.jobTitle = designation;
    }

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: userUpdate,
      });
    }

    // 2. Update / Upsert HRProfile
    const hrProfileData: any = {};
    if (phone !== undefined) hrProfileData.phone = phone || null;
    if (emergencyContact !== undefined) hrProfileData.emergencyContact = emergencyContact || null;
    if (address !== undefined) hrProfileData.address = address || null;
    if (dateOfBirth !== undefined) hrProfileData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    
    if (isAdmin) {
      if (department !== undefined) hrProfileData.department = department;
      if (designation !== undefined) hrProfileData.designation = designation;
      if (employeeId !== undefined) hrProfileData.employeeId = employeeId || null;
      if (joiningDate !== undefined) hrProfileData.joiningDate = joiningDate ? new Date(joiningDate) : null;
      if (status !== undefined) hrProfileData.status = status;
    }

    const profile = await prisma.hRProfile.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        ...hrProfileData,
      },
      update: hrProfileData,
    });

    return NextResponse.json({
      success: true,
      data: profile,
      message: "HR Profile updated successfully",
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update HR profile" } }, { status: 500 });
  }
}
