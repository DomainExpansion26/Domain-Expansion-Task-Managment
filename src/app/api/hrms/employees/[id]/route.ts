import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHRAdmin } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await requireHRAdmin(request);
    const { id } = await params;
    const body = await request.json();

    const user = await prisma.user.findUnique({
      where: { id },
      include: { hrProfile: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Employee not found" } }, { status: 404 });
    }

    const userUpdate: any = {};
    if (body.name) userUpdate.name = body.name.trim();
    if (body.jobTitle !== undefined) userUpdate.jobTitle = body.jobTitle.trim();
    if (body.department !== undefined) userUpdate.department = body.department.trim();
    if (body.managerId !== undefined) userUpdate.managerId = body.managerId || null;
    if (body.teamLeadId !== undefined) userUpdate.teamLeadId = body.teamLeadId || null;
    if (body.isActive !== undefined) userUpdate.isActive = Boolean(body.isActive);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: userUpdate,
    });

    // Update HR Profile
    const hrUpdate: any = {};
    if (body.employeeId !== undefined) hrUpdate.employeeId = body.employeeId || null;
    if (body.designation !== undefined) hrUpdate.designation = body.designation;
    if (body.department !== undefined) hrUpdate.department = body.department;
    if (body.joiningDate !== undefined) hrUpdate.joiningDate = body.joiningDate ? new Date(body.joiningDate) : new Date();
    if (body.dateOfBirth !== undefined) hrUpdate.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
    if (body.phone !== undefined) hrUpdate.phone = body.phone || null;
    if (body.status !== undefined) hrUpdate.status = body.status;

    const updatedHr = await prisma.hRProfile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        employeeId: body.employeeId || null,
        designation: body.designation || updatedUser.jobTitle || "Employee",
        department: body.department || updatedUser.department || "General",
        joiningDate: body.joiningDate ? new Date(body.joiningDate) : new Date(),
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        phone: body.phone || null,
        status: body.status || "ACTIVE",
      },
      update: hrUpdate,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "EMPLOYEE_UPDATED",
        entityType: "EMPLOYEE",
        entityId: id,
        detailsJson: JSON.stringify({
          updatedBy: currentUser.name,
          employeeName: updatedUser.name,
          status: updatedHr.status,
          updatedFields: Object.keys(body),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedUser,
        hrProfile: updatedHr,
      },
      message: `Employee ${updatedUser.name} profile updated successfully`,
    });
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin privileges required" } }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update employee" } }, { status: 500 });
  }
}
