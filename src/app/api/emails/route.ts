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
    const id = searchParams.get("id");

    if (id) {
      const email = await prisma.sentEmailLog.findUnique({ where: { id } });
      if (!email) {
        return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Email not found" } }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: email });
    }

    const emails = await prisma.sentEmailLog.findMany({
      orderBy: { sentAt: "desc" },
      take: 40,
    });

    return NextResponse.json({ success: true, data: emails });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch emails" } }, { status: 500 });
  }
}
