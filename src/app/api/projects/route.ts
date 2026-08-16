import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const projects = await prisma.project.findMany({
      include: {
        lead: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
          },
        },
        tasks: {
          select: { id: true, status: true, priority: true, dueDate: true },
        },
        sprints: {
          select: { id: true, name: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = projects.map((p) => {
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.status === "DONE").length;
      const inProgress = p.tasks.filter((t) => t.status === "IN_PROGRESS").length;
      const blocked = p.tasks.filter((t) => t.status === "BLOCKED").length;
      const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        key: p.key,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        lead: p.lead,
        members: p.members.map((m) => m.user),
        sprints: p.sprints,
        stats: {
          totalTasks: total,
          completedTasks: done,
          inProgressTasks: inProgress,
          blockedTasks: blocked,
          progressPercent,
        },
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("Projects list error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch projects" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "project.create")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You lack permission to create projects" } },
        { status: 403 }
      );
    }

    const { name, key, description, leadId, startDate, endDate, memberIds = [] } = await request.json();

    if (!name || !key) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Project name and key are required" } },
        { status: 400 }
      );
    }

    const formattedKey = key.trim().toUpperCase();

    // Check key uniqueness
    const existing = await prisma.project.findUnique({ where: { key: formattedKey } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "KEY_EXISTS", message: `Project key '${formattedKey}' is already taken` } },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        key: formattedKey,
        description,
        leadId: leadId || currentUser.id,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: "ACTIVE",
        members: {
          create: Array.from(new Set([currentUser.id, leadId || currentUser.id, ...memberIds])).map((uId) => ({
            userId: uId as string,
            role: uId === (leadId || currentUser.id) ? "LEAD" : "MEMBER",
          })),
        },
        labels: {
          create: [
            { name: "Frontend", color: "#FF6200" },
            { name: "Backend", color: "#6D28D9" },
            { name: "Bug", color: "#EF4444" },
            { name: "Design", color: "#EC4899" },
          ],
        },
      },
      include: {
        lead: true,
        members: { include: { user: true } },
      },
    });

    // Record activity
    await prisma.activity.create({
      data: {
        projectId: project.id,
        userId: currentUser.id,
        action: "CREATED",
        description: `${currentUser.name} created project ${project.name} (${project.key})`,
      },
    });

    return NextResponse.json({
      success: true,
      data: project,
      message: "Project created successfully",
    });
  } catch (error: any) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create project" } },
      { status: 500 }
    );
  }
}
