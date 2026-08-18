import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest, requireHRAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    // Retrieve holidays recorded in AuditLog or settings
    const holidayLogs = await prisma.auditLog.findMany({
      where: {
        entityType: "COMPANY_HOLIDAY",
      },
      orderBy: { createdAt: "desc" },
    });

    const holidays = holidayLogs.map((log) => {
      try {
        const parsed = JSON.parse(log.detailsJson || "{}");
        return {
          id: log.id,
          name: parsed.name,
          date: parsed.date,
          day: parsed.day,
          type: parsed.type || "Gazetted",
          createdAt: log.createdAt,
        };
      } catch {
        return {
          id: log.id,
          name: "Holiday",
          date: log.createdAt.toISOString().split("T")[0],
          day: "—",
          type: "Gazetted",
          createdAt: log.createdAt,
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: holidays,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch holidays" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireHRAdmin(request);
    const { name, date, type = "Gazetted" } = await request.json();

    if (!name || !date) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Holiday name and date are required" } },
        { status: 400 }
      );
    }

    const d = new Date(date);
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });

    const log = await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "HOLIDAY_CREATED",
        entityType: "COMPANY_HOLIDAY",
        entityId: `holiday-${Date.now()}`,
        detailsJson: JSON.stringify({
          name: name.trim(),
          date,
          day: dayName,
          type,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: log.id,
        name: name.trim(),
        date,
        day: dayName,
        type,
      },
      message: `Holiday ${name} created successfully`,
    });
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin privileges required" } }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to create holiday" } }, { status: 500 });
  }
}
