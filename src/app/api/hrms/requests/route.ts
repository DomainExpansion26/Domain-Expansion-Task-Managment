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
    const where: any = isHRorSuper ? {} : { userId: currentUser.id };

    const requests = await prisma.hRRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, jobTitle: true, department: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const formatted = requests.map((r) => ({
      ...r,
      user: userMap.get(r.userId) || { name: "Employee", email: "", jobTitle: "", department: "" },
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch HR requests" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { requestType, subject, description, priority = "MEDIUM" } = await request.json();

    if (!requestType || !subject?.trim() || !description?.trim()) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Request type, subject, and description are required" } }, { status: 400 });
    }

    const req = await prisma.hRRequest.create({
      data: {
        userId: currentUser.id,
        requestType,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      data: req,
      message: "HR request submitted successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to submit request" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin permission required" } }, { status: 403 });
    }

    const { id, status, resolutionNotes } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Request ID and status are required" } }, { status: 400 });
    }

    const updated = await prisma.hRRequest.update({
      where: { id },
      data: {
        status,
        resolutionNotes: resolutionNotes?.trim() || null,
        resolverId: currentUser.id,
      },
    });

    // Notify employee of resolution
    await prisma.notification.create({
      data: {
        userId: updated.userId,
        title: `HR Request ${status.replace("_", " ")}`,
        message: `Your request "${updated.subject}" has been marked as ${status.toLowerCase()}.${resolutionNotes ? ` Notes: ${resolutionNotes}` : ""}`,
        type: "SYSTEM",
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `HR Request marked as ${status.toLowerCase()}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to update HR request" } }, { status: 500 });
  }
}
