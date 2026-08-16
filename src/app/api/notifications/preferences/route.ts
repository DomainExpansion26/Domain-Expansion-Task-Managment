import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    let pref = await prisma.notificationPreference.findUnique({
      where: { userId: currentUser.id },
    });

    if (!pref) {
      pref = await prisma.notificationPreference.create({
        data: { userId: currentUser.id },
      });
    }

    return NextResponse.json({ success: true, data: pref });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch preferences" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const body = await request.json();

    const pref = await prisma.notificationPreference.upsert({
      where: { userId: currentUser.id },
      create: { userId: currentUser.id, ...body },
      update: body,
    });

    return NextResponse.json({ success: true, data: pref, message: "Preferences updated" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update preferences" } }, { status: 500 });
  }
}
