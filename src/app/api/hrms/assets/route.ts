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

    const isHRorSuper = isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role);
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

    let where: any = {};
    if (!isHRorSuper) {
      where.assignedToId = currentUser.id;
    } else if (targetUserId) {
      where.assignedToId = targetUserId;
    }

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, department: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const formatted = assets.map((a) => ({
      ...a,
      assignedUser: a.assignedToId ? userMap.get(a.assignedToId) || null : null,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch assets" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin permission required" } }, { status: 403 });
    }

    const { assetTag, name, type, serialNumber, assignedToId, condition = "EXCELLENT", notes } = await request.json();

    if (!assetTag?.trim() || !name?.trim() || !type) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Asset tag, name, and type are required" } }, { status: 400 });
    }

    const asset = await prisma.asset.create({
      data: {
        assetTag: assetTag.trim().toUpperCase(),
        name: name.trim(),
        type,
        serialNumber: serialNumber?.trim() || null,
        assignedToId: assignedToId || null,
        status: assignedToId ? "ASSIGNED" : "AVAILABLE",
        condition,
        assignedDate: assignedToId ? new Date() : null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: asset,
      message: `Asset ${asset.name} (${asset.assetTag}) registered successfully`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to create asset" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin permission required" } }, { status: 403 });
    }

    const { id, assignedToId, status, condition, notes, action } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Asset ID is required" } }, { status: 400 });
    }

    const updateData: any = {};
    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId || null;
      updateData.status = assignedToId ? "ASSIGNED" : "AVAILABLE";
      updateData.assignedDate = assignedToId ? new Date() : null;
    }
    if (action === "RETURN") {
      updateData.assignedToId = null;
      updateData.status = "RETURNED";
      updateData.returnDate = new Date();
    }
    if (status) updateData.status = status;
    if (condition) updateData.condition = condition;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.asset.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Asset details updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to update asset" } }, { status: 500 });
  }
}
