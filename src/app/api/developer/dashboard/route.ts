import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const now = new Date();

    const [tasksAssigned, myBugs, mentions, activities] = await Promise.all([
      prisma.task.findMany({
        where: {
          assignees: { some: { userId: currentUser.id } },
        },
        include: {
          project: { select: { id: true, name: true, key: true } },
          assignees: { include: { user: true } },
          qaBugs: {
            select: {
              id: true,
              bugKey: true,
              title: true,
              status: true,
              priority: true,
              severity: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.qABug.findMany({
        where: { assignedToId: currentUser.id },
        include: {
          relatedTask: { select: { id: true, taskKey: true, title: true, status: true } },
          project: { select: { id: true, name: true, key: true } },
          createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.notification.findMany({
        where: {
          userId: currentUser.id,
          type: { in: ["MENTION", "BUG_FAILED", "BUG_READY_FOR_TESTING", "BUG_ASSIGNED"] },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.activity.findMany({
        where: {
          OR: [
            { userId: currentUser.id },
            { task: { assignees: { some: { userId: currentUser.id } } } },
            { bug: { assignedToId: currentUser.id } },
          ],
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          task: { select: { id: true, taskKey: true, title: true } },
          bug: { select: { id: true, bugKey: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

    const activeBugs = myBugs.filter((b) => b.status !== "PASSED" && b.status !== "CLOSED");
    const failedBugs = myBugs.filter((b) => b.status === "FAILED" || b.status === "REOPENED");
    const readyForTestingBugs = myBugs.filter((b) => b.status === "READY_FOR_TESTING");
    const inProgressBugs = myBugs.filter((b) => b.status === "IN_PROGRESS" || b.status === "ASSIGNED" || b.status === "OPEN");
    const overdueBugs = myBugs.filter((b) => b.endDate && new Date(b.endDate) < now && b.status !== "PASSED" && b.status !== "CLOSED");

    return NextResponse.json({
      success: true,
      data: {
        myTasks: tasksAssigned,
        myBugs,
        activeBugs,
        failedBugs,
        readyForTesting: readyForTestingBugs,
        readyForTestingBugs,
        inProgressBugs,
        overdueBugs,
        mentions,
        recentActivities: activities,
        counts: {
          totalAssignedTasks: tasksAssigned.length,
          totalAssignedBugs: myBugs.length,
          activeBugsCount: activeBugs.length,
          failedBugsCount: failedBugs.length,
          readyCount: readyForTestingBugs.length,
        },
      },
    });
  } catch (error: any) {
    console.error("Developer cockpit error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to load developer dashboard" } }, { status: 500 });
  }
}
