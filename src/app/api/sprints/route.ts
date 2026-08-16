import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const sprints = await prisma.sprint.findMany({
      where: projectId ? { projectId } : {},
      include: {
        project: { select: { name: true, key: true } },
        tasks: {
          include: {
            assignees: { include: { user: true } },
            subtasks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: sprints });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch sprints" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "sprint.manage")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } }, { status: 403 });
    }

    const { projectId, name, goal, startDate, endDate } = await request.json();

    if (!projectId || !name) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Project and sprint name are required" } }, { status: 400 });
    }

    const sprint = await prisma.sprint.create({
      data: {
        projectId,
        name,
        goal,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: "PLANNED",
      },
    });

    return NextResponse.json({ success: true, data: sprint, message: `Sprint '${sprint.name}' created` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to create sprint" } }, { status: 500 });
  }
}
