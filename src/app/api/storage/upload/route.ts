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
    const projectId = formData.get("projectId") as string | null;
    const taskId = formData.get("taskId") as string | null;
    const bugId = formData.get("bugId") as string | null;
    const folder = (formData.get("folder") as string) || "attachments";

    // Collect all uploaded files from formData ("files" or "file")
    const rawFiles: (File | null)[] = [
      ...formData.getAll("files"),
      ...formData.getAll("file"),
    ] as (File | null)[];

    const files = rawFiles.filter((f): f is File => f !== null && typeof f === "object" && typeof f.name === "string" && f.size > 0);

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: { code: "NO_FILE", message: "No files provided for upload" } }, { status: 400 });
    }

    let resolvedTaskId: string | null = null;
    let resolvedProjectId: string | null = projectId || null;
    let resolvedBugId: string | null = null;

    if (taskId) {
      const task = await prisma.task.findFirst({
        where: { OR: [{ id: taskId }, { taskKey: taskId }, { taskKey: taskId.toUpperCase() }] },
        select: { id: true, projectId: true },
      });
      if (task) {
        resolvedTaskId = task.id;
        if (!resolvedProjectId) resolvedProjectId = task.projectId;
      }
    }

    if (bugId) {
      const bug = await prisma.qABug.findFirst({
        where: { OR: [{ id: bugId }, { bugKey: bugId }, { bugKey: bugId.toUpperCase() }] },
        select: { id: true, projectId: true },
      });
      if (bug) {
        resolvedBugId = bug.id;
        if (!resolvedProjectId) resolvedProjectId = bug.projectId;
      }
    }

    // Upload all files in parallel
    const uploadPromises = files.map(async (file) => {
      const uploaded = await uploadFileToStorage(file, file.name, file.type || "application/octet-stream", folder);

      const attachment = await prisma.attachment.create({
        data: {
          fileName: uploaded.fileName,
          fileUrl: uploaded.fileUrl,
          fileSize: uploaded.fileSize,
          fileType: uploaded.fileType,
          projectId: resolvedProjectId,
          taskId: resolvedTaskId,
          bugId: resolvedBugId,
          uploadedById: currentUser.id,
        },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });

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
            projectId: resolvedProjectId,
            taskId: resolvedTaskId,
            bugId: resolvedBugId,
          }),
        },
      }).catch(() => {});

      return attachment;
    });

    const createdAttachments = await Promise.all(uploadPromises);

    return NextResponse.json({
      success: true,
      data: createdAttachments.length === 1 ? createdAttachments[0] : createdAttachments,
      attachments: createdAttachments,
      count: createdAttachments.length,
      message: `${createdAttachments.length} file(s) uploaded successfully`,
    });
  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to upload file(s)" } }, { status: 500 });
  }
}
