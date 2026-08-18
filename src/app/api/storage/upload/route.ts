import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { uploadFileToStorage } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;
    const taskId = formData.get("taskId") as string | null;
    const folder = (formData.get("folder") as string) || "attachments";

    if (!file) {
      return NextResponse.json({ success: false, error: { code: "NO_FILE", message: "No file provided" } }, { status: 400 });
    }

    const uploaded = await uploadFileToStorage(file, file.name, file.type || "application/octet-stream", folder);

    // Save attachment record in PostgreSQL database
    const attachment = await prisma.attachment.create({
      data: {
        fileName: uploaded.fileName,
        fileUrl: uploaded.fileUrl,
        fileSize: uploaded.fileSize,
        fileType: uploaded.fileType,
        projectId: projectId || null,
        taskId: taskId || null,
        uploadedById: currentUser.id,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "FILE_UPLOADED",
        entityType: "ATTACHMENT",
        entityId: attachment.id,
        detailsJson: JSON.stringify({
          fileName: uploaded.fileName,
          fileSize: uploaded.fileSize,
          storagePath: uploaded.storagePath,
          projectId,
          taskId,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: attachment,
      message: "File uploaded successfully",
    });
  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to upload file" } }, { status: 500 });
  }
}
