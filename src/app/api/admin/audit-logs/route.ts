import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Super Admin privileges required" } }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch audit logs" } }, { status: 500 });
  }
}
