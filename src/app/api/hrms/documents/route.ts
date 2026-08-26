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
    const isHRorSuper = isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role);
    const userId = isHRorSuper && targetUserId ? targetUserId : currentUser.id;

    const docs = await prisma.attachment.findMany({
      where: { uploadedById: userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: docs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch documents" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { fileName, fileUrl, fileType = "application/pdf", fileSize = 102400, docCategory = "OTHER", targetUserId } = await request.json();

    if (!fileName?.trim() || !fileUrl?.trim()) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "File name and URL are required" } }, { status: 400 });
    }

    const isHRorSuper = isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role);
    const userId = isHRorSuper && targetUserId ? targetUserId : currentUser.id;

    const doc = await prisma.attachment.create({
      data: {
        fileName: `${docCategory ? `[${docCategory}] ` : ""}${fileName.trim()}`,
        fileUrl: fileUrl.trim(),
        fileType,
        fileSize: Number(fileSize) || 102400,
        uploadedById: userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: doc,
      message: `Document "${doc.fileName}" uploaded successfully`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to upload document" } }, { status: 500 });
  }
}
