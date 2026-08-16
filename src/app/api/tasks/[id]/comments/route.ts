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

    // Check for @mentions in comment text (e.g. @Amit, @Rahul Sharma)
    const mentionMatches = content.match(/@(\w+(?:\s+\w+)?)/g);
    if (mentionMatches) {
      const allUsers = await prisma.user.findMany({ select: { id: true, name: true, email: true } });

      for (const mentionStr of mentionMatches) {
        const query = mentionStr.substring(1).toLowerCase();
        const mentionedUser = allUsers.find((u) => u.name.toLowerCase().includes(query) && u.id !== currentUser.id);

        if (mentionedUser) {
          // In-app notification
          await prisma.notification.create({
            data: {
              userId: mentionedUser.id,
              title: "You were mentioned in a comment",
              message: `${currentUser.name} mentioned you on ${task.taskKey}: "${content.substring(0, 80)}"`,
              type: "MENTION",
              link: `/tasks/${task.taskKey}`,
            },
          });

          // Email notification
          await sendEmail({
            to: mentionedUser.email,
            subject: `You were mentioned in ${task.taskKey}`,
            template: "MENTION",
            data: {
              userName: mentionedUser.name,
              authorName: currentUser.name,
              taskKey: task.taskKey,
              taskTitle: task.title,
              commentContent: content,
            },
          });

          eventHub.emit("notification", { userId: mentionedUser.id });
        }
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
