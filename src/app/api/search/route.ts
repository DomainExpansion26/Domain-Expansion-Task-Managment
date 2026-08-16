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
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 1) {
      return NextResponse.json({
        success: true,
        data: { tasks: [], projects: [], users: [] },
      });
    }

    const [tasks, projects, users] = await Promise.all([
      prisma.task.findMany({
        where: {
          OR: [
            { taskKey: { contains: q } },
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        },
        include: { project: { select: { name: true, key: true } } },
        take: 8,
      }),
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { key: { contains: q } },
          ],
        },
        take: 5,
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { jobTitle: { contains: q } },
          ],
        },
        select: { id: true, name: true, email: true, role: true, avatarUrl: true, jobTitle: true },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        projects,
        users,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Search failed" } }, { status: 500 });
  }
}
