import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { calculateWorkingHours } from "@/lib/hrms";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: currentUser.id,
          date: today,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: attendance || {
        date: today,
        punchIn: null,
        punchOut: null,
        breakDurationMinutes: 0,
        totalWorkingHours: 0,
        status: "NOT_RECORDED",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to get punch status" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { action, breakMinutes = 0, notes } = await request.json(); // action: "PUNCH_IN" | "PUNCH_OUT"

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const now = new Date();

    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: currentUser.id,
          date: today,
        },
      },
    });

    if (action === "PUNCH_IN") {
      if (existing && existing.punchIn && !existing.punchOut) {
        return NextResponse.json(
          { success: false, error: { code: "ALREADY_PUNCHED_IN", message: "You have already punched in today." } },
          { status: 400 }
        );
      }

      const attendance = await prisma.attendance.upsert({
        where: {
          userId_date: {
            userId: currentUser.id,
            date: today,
          },
        },
        create: {
          userId: currentUser.id,
          date: today,
          punchIn: now,
          punchOut: null,
          breakDurationMinutes: Number(breakMinutes) || 0,
          totalWorkingHours: 0,
          status: "PRESENT",
          notes: notes || null,
        },
        update: {
          punchIn: existing?.punchIn || now,
          punchOut: null,
          status: "PRESENT",
          notes: notes !== undefined ? notes : existing?.notes,
        },
      });

      return NextResponse.json({
        success: true,
        data: attendance,
        message: `Punched in successfully at ${now.toLocaleTimeString()}`,
      });
    }

    if (action === "PUNCH_OUT") {
      if (!existing || !existing.punchIn) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_PUNCHED_IN", message: "You must punch in first before punching out." } },
          { status: 400 }
        );
      }

      const breakDuration = Number(breakMinutes) || existing.breakDurationMinutes || 0;
      const { totalWorkingHours, status } = calculateWorkingHours(existing.punchIn, now, breakDuration);

      const attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          punchOut: now,
          breakDurationMinutes: breakDuration,
          totalWorkingHours,
          status,
          notes: notes !== undefined ? notes : existing.notes,
        },
      });

      return NextResponse.json({
        success: true,
        data: attendance,
        message: `Punched out at ${now.toLocaleTimeString()}. Logged: ${totalWorkingHours}h (${status.replace("_", " ")})`,
      });
    }

    return NextResponse.json(
      { success: false, error: { code: "INVALID_ACTION", message: "Action must be PUNCH_IN or PUNCH_OUT" } },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Punch error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to record punch action" } }, { status: 500 });
  }
}
