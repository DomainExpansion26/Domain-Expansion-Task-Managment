import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: any = {};
    if (projectId && projectId !== "ALL") where.projectId = projectId;

    const [allBugs, allTickets, recentActivities] = await Promise.all([
      prisma.qABug.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true, department: true } },
          createdBy: { select: { id: true, name: true, email: true, avatarUrl: true, department: true } },
          project: { select: { id: true, name: true, key: true } },
          relatedTask: { select: { id: true, taskKey: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.qATicket.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true, key: true } },
        },
      }),
      prisma.activity.findMany({
        where: {
          OR: [
            { action: { in: ["QA_BUG_LOGGED", "QA_BUG_FAILED", "QA_BUG_PASSED", "QA_BUG_READY_FOR_TESTING"] } },
            { bugId: { not: null } },
          ],
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          bug: { select: { id: true, bugKey: true, title: true } },
          task: { select: { id: true, taskKey: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

    const counts = {
      totalBugs: allBugs.length,
      open: allBugs.filter((b) => b.status === "OPEN" || b.status === "ASSIGNED").length,
      inProgress: allBugs.filter((b) => b.status === "IN_PROGRESS").length,
      readyForTesting: allBugs.filter((b) => b.status === "READY_FOR_TESTING").length,
      inTesting: allBugs.filter((b) => b.status === "IN_TESTING").length,
      failed: allBugs.filter((b) => b.status === "FAILED" || b.status === "REOPENED").length,
      passed: allBugs.filter((b) => b.status === "PASSED").length,
      closed: allBugs.filter((b) => b.status === "CLOSED").length,
      critical: allBugs.filter((b) => (b.priority === "CRITICAL" || b.severity === "CRITICAL") && b.status !== "CLOSED" && b.status !== "PASSED").length,
    };

    // Grouping by Developer
    const devMap: Record<string, { name: string; avatarUrl?: string | null; count: number; failed: number; ready: number }> = {};
    for (const b of allBugs) {
      const devName = b.assignedTo?.name || "Unassigned";
      if (!devMap[devName]) {
        devMap[devName] = { name: devName, avatarUrl: b.assignedTo?.avatarUrl, count: 0, failed: 0, ready: 0 };
      }
      devMap[devName].count++;
      if (b.status === "FAILED") devMap[devName].failed++;
      if (b.status === "READY_FOR_TESTING") devMap[devName].ready++;
    }

    // Grouping by QA Reporter
    const qaMap: Record<string, { name: string; avatarUrl?: string | null; reportedCount: number; passedCount: number; failedCount: number }> = {};
    for (const b of allBugs) {
      const qaName = b.createdBy?.name || "Unknown QA";
      if (!qaMap[qaName]) {
        qaMap[qaName] = { name: qaName, avatarUrl: b.createdBy?.avatarUrl, reportedCount: 0, passedCount: 0, failedCount: 0 };
      }
      qaMap[qaName].reportedCount++;
      if (b.status === "PASSED" || b.status === "CLOSED") qaMap[qaName].passedCount++;
      if (b.status === "FAILED") qaMap[qaName].failedCount++;
    }

    const byPriority = {
      critical: allBugs.filter((b) => b.priority === "CRITICAL").length,
      high: allBugs.filter((b) => b.priority === "HIGH").length,
      medium: allBugs.filter((b) => b.priority === "MEDIUM").length,
      low: allBugs.filter((b) => b.priority === "LOW").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        counts,
        bugs: allBugs,
        tickets: allTickets,
        developerStats: Object.values(devMap),
        byDeveloper: Object.values(devMap),
        byPriority,
        qaStats: Object.values(qaMap),
        recentActivities,
      },
    });
  } catch (error: any) {
    console.error("QA dashboard stats error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to load QA dashboard metrics" } }, { status: 500 });
  }
}
