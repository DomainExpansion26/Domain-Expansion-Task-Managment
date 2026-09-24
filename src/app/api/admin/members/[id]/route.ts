import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, hashPassword } from "@/lib/auth";
import { normalizeRole } from "@/lib/permissions";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, email: true, role: true } },
        teamLead: { select: { id: true, name: true, email: true, role: true } },
        hrProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        role: normalizeRole(user.role),
      },
    });
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Super Admin privileges required" } }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch user" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.user.findUnique({ where: { id }, include: { hrProfile: true } });
    if (!existing) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name.trim();
    if (body.email) updateData.email = body.email.trim().toLowerCase();
    if (body.role) updateData.role = normalizeRole(body.role);
    if (body.jobTitle !== undefined) updateData.jobTitle = body.jobTitle.trim();
    if (body.department !== undefined) updateData.department = body.department.trim();
    if (body.managerId !== undefined) updateData.managerId = body.managerId || null;
    if (body.teamLeadId !== undefined) updateData.teamLeadId = body.teamLeadId || null;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.accountStatus !== undefined) {
      updateData.accountStatus = body.accountStatus;
      if (body.accountStatus === "DEACTIVATED" || body.accountStatus === "SUSPENDED") {
        updateData.isActive = false;
      } else if (body.accountStatus === "ACTIVE") {
        updateData.isActive = true;
      }
    }
    if (body.joiningDate !== undefined) updateData.joiningDate = body.joiningDate ? new Date(body.joiningDate) : null;
    if (body.ndaAccepted !== undefined) updateData.ndaAccepted = Boolean(body.ndaAccepted);

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        manager: true,
        teamLead: true,
        hrProfile: true,
      },
    });

    // Update HR Profile if fields provided
    if (body.employeeId || body.dateOfBirth || body.joiningDate || body.phone || body.status) {
      await prisma.hRProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          employeeId: body.employeeId || null,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
          joiningDate: body.joiningDate ? new Date(body.joiningDate) : new Date(),
          phone: body.phone || null,
          status: body.status || (updated.isActive ? "ACTIVE" : "INACTIVE"),
          designation: updated.jobTitle || "Employee",
          department: updated.department || "General",
        },
        update: {
          ...(body.employeeId !== undefined ? { employeeId: body.employeeId || null } : {}),
          ...(body.dateOfBirth !== undefined ? { dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null } : {}),
          ...(body.joiningDate !== undefined ? { joiningDate: body.joiningDate ? new Date(body.joiningDate) : undefined } : {}),
          ...(body.phone !== undefined ? { phone: body.phone } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          designation: updated.jobTitle || "Employee",
          department: updated.department || "General",
        },
      });
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "MEMBER_UPDATED",
        entityType: "USER",
        entityId: id,
        detailsJson: JSON.stringify({
          updatedFields: Object.keys(body),
          targetEmail: updated.email,
          newRole: updated.role,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Member ${updated.name} updated successfully`,
    });
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Super Admin privileges required" } }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update member" } }, { status: 500 });
  }
}

// Reset / Change Password by Super Admin
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await requireSuperAdmin(request);
    const { id } = await params;
    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_PASSWORD", message: "Password must be at least 6 characters" } },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    const user = await prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: { id: true, name: true, email: true },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "PASSWORD_RESET",
        entityType: "USER",
        entityId: id,
        detailsJson: JSON.stringify({ resetForUser: user.name, targetEmail: user.email }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${user.name}`,
    });
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Super Admin privileges required" } }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to reset password" } }, { status: 500 });
  }
}

// Remove or Deactivate Member from Portal (Super Admin Only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await requireSuperAdmin(request);
    const { id } = await params;

    if (currentUser.id === id) {
      return NextResponse.json(
        { success: false, error: { code: "CANNOT_DELETE_SELF", message: "You cannot remove your own Super Admin account from the portal" } },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
      // Remove member from portal permanently
      await prisma.user.delete({
        where: { id },
      });

      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: "MEMBER_PERMANENTLY_DELETED",
          entityType: "USER",
          entityId: id,
          detailsJson: JSON.stringify({ deletedUser: user.name, email: user.email }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Member ${user.name} has been permanently removed from the portal.`,
      });
    }

    // Standard portal removal: set isActive = false and HR Profile = TERMINATED
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.hRProfile.updateMany({
      where: { userId: id },
      data: { status: "TERMINATED" },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "MEMBER_REMOVED_FROM_PORTAL",
        entityType: "USER",
        entityId: id,
        detailsJson: JSON.stringify({ removedUser: user.name, email: user.email }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Member ${user.name} has been successfully removed from the portal.`,
    });
  } catch (error: any) {
    if (error.message === "FORBIDDEN" || error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Only Super Admin has access to remove members from the portal" } }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to remove member from portal" } }, { status: 500 });
  }
}
