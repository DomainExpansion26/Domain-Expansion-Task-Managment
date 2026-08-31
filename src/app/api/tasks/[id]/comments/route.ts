import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { eventHub } from "@/lib/events";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const task = await prisma.task.findFirst({
      where: { OR: [{ id }, { taskKey: id.toUpperCase() }] },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Task not found" } }, { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: { taskId: task.id },
      include: { author: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to load comments" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { id } = await params;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Comment cannot be empty" } }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { OR: [{ id }, { taskKey: id.toUpperCase() }] },
      include: {
        project: true,
        assignees: { include: { user: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Task not found" } }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        taskId: task.id,
        authorId: currentUser.id,
        content: content.trim(),
      },
      include: { author: true },
    });

    // Record activity
    await prisma.activity.create({
      data: {
        taskId: task.id,
        projectId: task.projectId,
        userId: currentUser.id,
        action: "COMMENTED",
        description: `${currentUser.name} commented on ${task.taskKey}`,
      },
    });

    // Check for @mentions in comment text (e.g. @Amit, @Rahul Sharma, @Priya)
    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
    });

    const notifiedUserIds = new Set<string>();

    for (const u of allUsers) {
      if (u.id === currentUser.id) continue;
      // Match exact full name or first name with @
      const escapedName = u.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const firstName = u.name.split(" ")[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const nameRegex = new RegExp(`@(?:${escapedName}|${firstName})\\b`, "i");

      if (nameRegex.test(content) && !notifiedUserIds.has(u.id)) {
        notifiedUserIds.add(u.id);

        // In-app notification
        await prisma.notification.create({
          data: {
            userId: u.id,
            senderUserId: currentUser.id,
            title: `${currentUser.name} tagged you in #${task.taskKey}`,
            message: `${currentUser.name} tagged you in story "${task.title}": "${content.substring(0, 100)}"`,
            type: "MENTION",
            link: `/tasks/${task.taskKey}`,
            taskId: task.taskKey,
          },
        });

        // Email notification
        await sendEmail({
          to: u.email,
          subject: `You were mentioned in ${task.taskKey}: ${task.title}`,
          template: "MENTION",
          data: {
            userName: u.name,
            authorName: currentUser.name,
            taskKey: task.taskKey,
            taskTitle: task.title,
            commentContent: content,
          },
        }).catch((err) => console.error("Email notification error:", err));

        eventHub.emit("notification", { userId: u.id });
      }
    }

    eventHub.emit("task_comment_added", { taskId: task.id, taskKey: task.taskKey });

    return NextResponse.json({
      success: true,
      data: comment,
      message: "Comment added successfully",
    });
  } catch (error: any) {
    console.error("Add comment error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to add comment" } }, { status: 500 });
  }
}

// PATCH /api/tasks/[id]/comments - Edit & Update Comment (Author-Only or Super Admin)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { commentId, content } = body;

    if (!commentId) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Comment ID is required" } }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Comment content cannot be empty" } }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { OR: [{ id }, { taskKey: id.toUpperCase() }] },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Task not found" } }, { status: 404 });
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true },
    });

    if (!existingComment) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Comment not found" } }, { status: 404 });
    }

    // Authorization: Only the author or Super Admin can edit
    const isSuper = currentUser.role === "SUPER_ADMIN";
    if (existingComment.authorId !== currentUser.id && !isSuper) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only the author of this message can edit it." } },
        { status: 403 }
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        updatedAt: new Date(),
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
      },
    });

    // Record activity
    await prisma.activity.create({
      data: {
        taskId: task.id,
        projectId: task.projectId,
        userId: currentUser.id,
        action: "UPDATED",
        description: `${currentUser.name} updated their comment on ${task.taskKey}`,
      },
    }).catch(() => {});

    // Check for newly tagged @mentions in updated comment
    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
    });

    for (const u of allUsers) {
      if (u.id === currentUser.id) continue;
      const escapedName = u.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const firstName = u.name.split(" ")[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const nameRegex = new RegExp(`@(?:${escapedName}|${firstName})\\b`, "i");

      if (nameRegex.test(content)) {
        await prisma.notification.create({
          data: {
            userId: u.id,
            senderUserId: currentUser.id,
            title: `${currentUser.name} updated comment on #${task.taskKey}`,
            message: `${currentUser.name} updated message on story "${task.title}": "${content.substring(0, 100)}"`,
            type: "MENTION",
            link: `/tasks/${task.taskKey}`,
            taskId: task.taskKey,
          },
        }).catch(() => {});

        eventHub.emit("notification", { userId: u.id });
      }
    }

    eventHub.emit("task_comment_updated", { taskId: task.id, taskKey: task.taskKey, commentId });

    return NextResponse.json({
      success: true,
      data: updatedComment,
      message: "Comment updated successfully",
    });
  } catch (error: any) {
    console.error("Update comment error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update comment" } }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]/comments - Delete Comment (Author-Only or Super Admin)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let commentId = searchParams.get("commentId");

    if (!commentId) {
      try {
        const body = await request.json();
        commentId = body?.commentId;
      } catch {}
    }

    if (!commentId) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Comment ID is required" } }, { status: 400 });
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Comment not found" } }, { status: 404 });
    }

    const isSuper = currentUser.role === "SUPER_ADMIN";
    if (existingComment.authorId !== currentUser.id && !isSuper) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only the author of this message can delete it." } },
        { status: 403 }
      );
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete comment error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to delete comment" } }, { status: 500 });
  }
}
