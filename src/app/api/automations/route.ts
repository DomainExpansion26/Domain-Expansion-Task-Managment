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

    const rules = await prisma.automationRule.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch automations" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "settings.manage")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Admin permission required" } }, { status: 403 });
    }

    const { name, triggerType, actionType, conditions, actionPayload, isEnabled } = await request.json();

    const rule = await prisma.automationRule.create({
      data: {
        name,
        triggerType,
        actionType,
        conditionsJson: JSON.stringify(conditions || {}),
        actionPayloadJson: JSON.stringify(actionPayload || {}),
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
        createdById: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, data: rule, message: "Automation rule created" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to create automation rule" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser.role, "settings.manage")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Admin permission required" } }, { status: 403 });
    }

    const { id, isEnabled, name } = await request.json();

    const rule = await prisma.automationRule.update({
      where: { id },
      data: {
        ...(isEnabled !== undefined ? { isEnabled: Boolean(isEnabled) } : {}),
        ...(name ? { name } : {}),
      },
    });

    return NextResponse.json({ success: true, data: rule, message: "Automation rule updated" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to update automation rule" } }, { status: 500 });
  }
}
