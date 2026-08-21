import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { emitPlatformEvent } from "@/lib/events";
import { sendEmail } from "@/lib/email";

// GET /api/qa/bugs/[id] - Fetch complete bug details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { id } = await params;
    const bug = await prisma.qABug.findFirst({
      where: { OR: [{ id }, { bugKey: id.toUpperCase() }] },
      include: {
        relatedTask: {
          include: {
            assignees: { include: { user: true } },
            reporter: true,
          },
        },
        ticket: true,
        project: { select: { id: true, name: true, key: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true, jobTitle: true } },
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true, jobTitle: true } },
        comments: {
          include: { author: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
        activities: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
          orderBy: { createdAt: "desc" },
        },
        attachments: {
          include: { uploadedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!bug) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "QA Bug not found" } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: bug });
  } catch (error: any) {
    console.error("Fetch bug error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch QA Bug" } }, { status: 500 });
  }
}

// PATCH /api/qa/bugs/[id] - Update status, workflow transitions, assignments, or properties
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "qa.bug.update")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.qABug.findFirst({
      where: { OR: [{ id }, { bugKey: id.toUpperCase() }] },
      include: {
        relatedTask: true,
        assignedTo: true,
        createdBy: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "QA Bug not found" } }, { status: 404 });
    }

    const updateData: any = {};
    const activitiesToCreate: any[] = [];
    const notificationsToCreate: any[] = [];

    // 1. Status Transition Handling
    if (body.status && body.status !== existing.status) {
      updateData.status = body.status;

      let actionName = "STATUS_CHANGED";
      let desc = `${currentUser.name} updated ${existing.bugKey} status to ${body.status}`;

      if (body.status === "READY_FOR_TESTING") {
        actionName = "QA_BUG_READY_FOR_TESTING";
        desc = `${currentUser.name} marked ${existing.bugKey} as Ready for Testing`;

        // Notify QA reporter
        if (existing.createdById && existing.createdById !== currentUser.id) {
          notificationsToCreate.push({
            userId: existing.createdById,
            senderUserId: currentUser.id,
            title: `${existing.bugKey} is Ready for Testing`,
            message: `${currentUser.name} marked ${existing.bugKey} as Ready for Testing.`,
            type: "BUG_READY_FOR_TESTING",
            bugId: existing.id,
            taskId: existing.relatedTaskId || undefined,
            link: existing.relatedTask ? `/tasks/${existing.relatedTask.taskKey}?bug=${existing.bugKey}` : `/qa?bug=${existing.bugKey}`,
          });

          if (existing.createdBy?.email) {
            await sendEmail({
              to: existing.createdBy.email,
              subject: `[${existing.bugKey}] Ready for Testing: ${existing.title}`,
              template: "TASK_UPDATED",
              data: {
                userName: existing.createdBy.name,
                updaterName: currentUser.name,
                taskKey: existing.bugKey,
                taskTitle: existing.title,
                changeSummary: "Bug marked as Ready for Testing",
              },
            });
          }
        }
      } else if (body.status === "FAILED") {
        actionName = "QA_BUG_FAILED";
        const reasonStr = body.failureReason ? ` Reason: ${body.failureReason}` : "";
        desc = `${currentUser.name} marked ${existing.bugKey} as Failed.${reasonStr}`;
        if (body.failureReason) updateData.failureReason = body.failureReason;
        if (body.actualResult) updateData.actualResult = body.actualResult;

        // If QA added a failure comment
        if (body.failureComment && body.failureComment.trim()) {
          await prisma.comment.create({
            data: {
              bugId: existing.id,
              authorId: currentUser.id,
              content: `❌ **QA Test Failed**: ${body.failureReason || ""}\n\n${body.failureComment.trim()}`,
            },
          });
        }

        // Notify assigned Developer
        if (existing.assignedToId && existing.assignedToId !== currentUser.id) {
          notificationsToCreate.push({
            userId: existing.assignedToId,
            senderUserId: currentUser.id,
            title: `${existing.bugKey} Failed QA Testing`,
            message: `${currentUser.name} marked ${existing.bugKey} as Failed: "${body.failureReason || "QA defect test did not pass"}"`,
            type: "BUG_FAILED",
            bugId: existing.id,
            taskId: existing.relatedTaskId || undefined,
            link: existing.relatedTask ? `/tasks/${existing.relatedTask.taskKey}?bug=${existing.bugKey}` : `/qa?bug=${existing.bugKey}`,
          });

          if (existing.assignedTo?.email) {
            await sendEmail({
              to: existing.assignedTo.email,
              subject: `[${existing.bugKey}] QA Failed: ${existing.title}`,
              template: "TASK_UPDATED",
              data: {
                userName: existing.assignedTo.name,
                updaterName: currentUser.name,
                taskKey: existing.bugKey,
                taskTitle: existing.title,
                changeSummary: `QA verification failed: ${body.failureReason || "Please re-test and resolve"}`,
              },
            });
          }
        }
      } else if (body.status === "PASSED" || body.status === "CLOSED") {
        actionName = "QA_BUG_PASSED";
        desc = `${currentUser.name} verified and marked ${existing.bugKey} as ${body.status}`;

        // Notify developer
        if (existing.assignedToId && existing.assignedToId !== currentUser.id) {
          notificationsToCreate.push({
            userId: existing.assignedToId,
            senderUserId: currentUser.id,
            title: `${existing.bugKey} Passed QA Verification`,
            message: `${currentUser.name} verified ${existing.bugKey} as Passed.`,
            type: "BUG_PASSED",
            bugId: existing.id,
            taskId: existing.relatedTaskId || undefined,
            link: existing.relatedTask ? `/tasks/${existing.relatedTask.taskKey}?bug=${existing.bugKey}` : `/qa?bug=${existing.bugKey}`,
          });
        }
      }

      activitiesToCreate.push({
        bugId: existing.id,
        taskId: existing.relatedTaskId || undefined,
        projectId: existing.projectId,
        userId: currentUser.id,
        action: actionName,
        fieldChanged: "status",
        oldValue: existing.status,
        newValue: body.status,
        description: desc,
        metadata: body.failureReason ? JSON.stringify({ failureReason: body.failureReason, actualResult: body.actualResult }) : undefined,
      });
    }

    // 2. Assignee change
    if (body.assignedToId !== undefined && body.assignedToId !== existing.assignedToId) {
      updateData.assignedToId = body.assignedToId || null;
      if (body.assignedToId) {
        const newAssignee = await prisma.user.findUnique({ where: { id: body.assignedToId } });
        activitiesToCreate.push({
          bugId: existing.id,
          taskId: existing.relatedTaskId || undefined,
          projectId: existing.projectId,
          userId: currentUser.id,
          action: "ASSIGNED",
          fieldChanged: "assignedTo",
          oldValue: existing.assignedTo?.name || "Unassigned",
          newValue: newAssignee?.name || "Unassigned",
          description: `${currentUser.name} assigned ${existing.bugKey} to ${newAssignee?.name || "Unassigned"}`,
        });

        if (newAssignee && newAssignee.id !== currentUser.id) {
          notificationsToCreate.push({
            userId: newAssignee.id,
            senderUserId: currentUser.id,
            title: `Assigned to ${existing.bugKey}`,
            message: `${currentUser.name} assigned ${existing.bugKey}: "${existing.title}" to you.`,
            type: "BUG_ASSIGNED",
            bugId: existing.id,
            taskId: existing.relatedTaskId || undefined,
            link: existing.relatedTask ? `/tasks/${existing.relatedTask.taskKey}?bug=${existing.bugKey}` : `/qa?bug=${existing.bugKey}`,
          });
        }
      }
    }

    // 3. Priority & Severity Changes
    if (body.priority && body.priority !== existing.priority) {
      updateData.priority = body.priority;
      activitiesToCreate.push({
        bugId: existing.id,
        projectId: existing.projectId,
        userId: currentUser.id,
        action: "UPDATED",
        fieldChanged: "priority",
        oldValue: existing.priority,
        newValue: body.priority,
        description: `${currentUser.name} changed priority of ${existing.bugKey} to ${body.priority}`,
      });
    }

    if (body.severity && body.severity !== existing.severity) {
      updateData.severity = body.severity;
      activitiesToCreate.push({
        bugId: existing.id,
        projectId: existing.projectId,
        userId: currentUser.id,
        action: "UPDATED",
        fieldChanged: "severity",
        oldValue: existing.severity,
        newValue: body.severity,
        description: `${currentUser.name} changed severity of ${existing.bugKey} to ${body.severity}`,
      });
    }

    // 4. Other fields
    if (body.title) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.environment !== undefined) updateData.environment = body.environment;
    if (body.stepsToReproduce !== undefined) updateData.stepsToReproduce = body.stepsToReproduce;
    if (body.expectedResult !== undefined) updateData.expectedResult = body.expectedResult;
    if (body.actualResult !== undefined) updateData.actualResult = body.actualResult;
    if (body.failureReason !== undefined) updateData.failureReason = body.failureReason;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;

    // Apply updates
    const updated = await prisma.qABug.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        relatedTask: true,
        project: true,
        assignedTo: true,
        createdBy: true,
        activities: { include: { user: true }, orderBy: { createdAt: "desc" } },
        comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
        attachments: true,
      },
    });

    // Save activities
    for (const act of activitiesToCreate) {
      await prisma.activity.create({ data: act });
    }

    // Save notifications
    for (const notif of notificationsToCreate) {
      await prisma.notification.create({ data: notif });
    }

    emitPlatformEvent({
      event: "qa_bug_updated",
      data: { bugKey: existing.bugKey, status: updated.status, id: existing.id },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Bug ${existing.bugKey} updated successfully`,
    });
  } catch (error: any) {
    console.error("Update QA bug error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update QA bug" } }, { status: 500 });
  }
}

// DELETE /api/qa/bugs/[id] - Delete a QA bug
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "qa.bug.delete")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.qABug.findFirst({
      where: { OR: [{ id }, { bugKey: id.toUpperCase() }] },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "QA Bug not found" } }, { status: 404 });
    }

    await prisma.qABug.delete({ where: { id: existing.id } });

    return NextResponse.json({
      success: true,
      message: `Bug ${existing.bugKey} deleted successfully`,
    });
  } catch (error: any) {
    console.error("Delete bug error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to delete QA bug" } }, { status: 500 });
  }
}
