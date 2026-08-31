import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { eventHub } from "@/lib/events";

// GET /api/qa/bugs/[id]/comments - Get comments for a bug
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bug = await prisma.qABug.findFirst({
      where: { OR: [{ id }, { bugKey: id.toUpperCase() }] },
    });

    if (!bug) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "QA Bug not found" } }, { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: { bugId: bug.id },
      include: { author: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to load bug comments" } }, { status: 500 });
  }
}

// POST /api/qa/bugs/[id]/comments - Add comment with @mention parsing
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

    const bug = await prisma.qABug.findFirst({
      where: { OR: [{ id }, { bugKey: id.toUpperCase() }] },
      include: {
        relatedTask: true,
        assignedTo: true,
        createdBy: true,
      },
    });

    if (!bug) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Bug not found" } }, { status: 404 });
    }

    // Check for @mentions in comment text (e.g. @Rahul, @Sneha Patel)
    const mentionMatches = content.match(/@([a-zA-Z0-9_\.\-]+(?:\s+[a-zA-Z0-9_\.\-]+)?)/g);
    let matchedUserNames: string[] = [];

    if (mentionMatches) {
      const allUsers = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
      for (const mentionStr of mentionMatches) {
        const query = mentionStr.substring(1).toLowerCase().trim();
        const found = allUsers.find((u) => u.name.toLowerCase().includes(query) || query.includes(u.name.toLowerCase().split(" ")[0]));
        if (found && !matchedUserNames.includes(found.name)) {
          matchedUserNames.push(found.name);
        }
      }
    }

    const comment = await prisma.comment.create({
      data: {
        bugId: bug.id,
        authorId: currentUser.id,
        content: content.trim(),
        mentions: matchedUserNames.length > 0 ? JSON.stringify(matchedUserNames) : null,
      },
      include: { author: true },
    });

    // Record activity
    await prisma.activity.create({
      data: {
        bugId: bug.id,
        taskId: bug.relatedTaskId || undefined,
        projectId: bug.projectId,
        userId: currentUser.id,
        action: "COMMENTED",
        description: `${currentUser.name} commented on ${bug.bugKey}`,
      },
    });
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
              senderUserId: currentUser.id,
              title: `You were mentioned in ${bug.bugKey}`,
              message: `${currentUser.name} mentioned you on ${bug.bugKey}: "${content.substring(0, 80)}"`,
              type: "MENTION",
              bugId: bug.id,
              taskId: bug.relatedTaskId || undefined,
              link: bug.relatedTask ? `/tasks/${bug.relatedTask.taskKey}?bug=${bug.bugKey}` : `/qa?bug=${bug.bugKey}`,
            },
          });

          // Email notification
          await sendEmail({
            to: mentionedUser.email,
            subject: `You were mentioned in ${bug.bugKey}`,
            template: "MENTION",
            data: {
              userName: mentionedUser.name,
              authorName: currentUser.name,
              taskKey: bug.bugKey,
              taskTitle: bug.title,
              commentContent: content,
            },
          });

          eventHub.emit("notification", { userId: mentionedUser.id });
        }
      }
    }

    eventHub.emit("qa_bug_comment_added", { bugId: bug.id, bugKey: bug.bugKey });

    return NextResponse.json({
      success: true,
      data: comment,
      message: "Comment added successfully",
    });
  } catch (error: any) {
    console.error("Add bug comment error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to add comment" } }, { status: 500 });
  }
}

// PATCH /api/qa/bugs/[id]/comments - Edit & Update Bug Comment
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const body = await request.json();
    const { commentId, content } = body;

    if (!commentId || !content || !content.trim()) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Comment ID and updated content are required" } }, { status: 400 });
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true },
    });

    if (!existingComment) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Comment not found" } }, { status: 404 });
    }

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

    return NextResponse.json({
      success: true,
      data: updatedComment,
      message: "Comment updated successfully",
    });
  } catch (error: any) {
    console.error("Update bug comment error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update comment" } }, { status: 500 });
  }
}

// DELETE /api/qa/bugs/[id]/comments - Delete Bug Comment
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
    console.error("Delete bug comment error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to delete comment" } }, { status: 500 });
  }
}
