import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Attachment ID is required" } },
        { status: 400 }
      );
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Attachment not found" } },
        { status: 404 }
      );
    }

    const isSuper = isSuperAdmin(currentUser.role);
    const isOwner = attachment.uploadedById === currentUser.id;

    if (!isSuper && !isOwner) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only attachment uploader or Super Admin can delete this file" } },
        { status: 403 }
      );
    }

    await prisma.attachment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Attachment '${attachment.fileName}' deleted successfully`,
    });
  } catch (error: any) {
    console.error("Delete attachment error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to delete attachment" } },
      { status: 500 }
    );
  }
}
