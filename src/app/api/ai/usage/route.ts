import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const usages = await prisma.aIUsage.findMany({
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const totalRequests = await prisma.aIUsage.count();
    const totalTokensAgg = await prisma.aIUsage.aggregate({
      _sum: { totalTokens: true, estimatedCost: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        usages,
        metrics: {
          totalRequests,
          totalTokens: totalTokensAgg._sum.totalTokens || 0,
          totalCost: Number((totalTokensAgg._sum.estimatedCost || 0).toFixed(4)),
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch AI usage" } }, { status: 500 });
  }
}
