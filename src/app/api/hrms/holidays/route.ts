import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest, requireHRAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    // 1. Retrieve holidays directly from Holiday table
    const dbHolidays = await prisma.holiday.findMany({
      orderBy: { date: "asc" },
    });

    const holidays = dbHolidays.map((h) => {
      const d = new Date(h.date);
      const dayName = d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
      return {
        id: h.id,
        name: h.name,
        date: h.date.toISOString().split("T")[0],
        day: dayName,
        type: h.holidayType || "Gazetted",
        year: h.year,
        description: h.description,
        createdAt: h.createdAt,
      };
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
    const { name, date, type = "Gazetted", description = "" } = await request.json();

    if (!name || !date) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Holiday name and date are required" } },
        { status: 400 }
      );
    }

    const d = new Date(`${date}T00:00:00.000Z`);
    const dayName = d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
    const year = d.getUTCFullYear();

    const holiday = await prisma.holiday.create({
      data: {
        name: name.trim(),
        date: d,
        holidayType: type,
        year,
        description: description || `${name.trim()} Celebration`,
      },
    });

    // Also write an audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: "HOLIDAY_CREATED",
        entityType: "COMPANY_HOLIDAY",
        entityId: holiday.id,
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
        id: holiday.id,
        name: holiday.name,
        date,
        day: dayName,
        type: holiday.holidayType,
        year: holiday.year,
        description: holiday.description,
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
