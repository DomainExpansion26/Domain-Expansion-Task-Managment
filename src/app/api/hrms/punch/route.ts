import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { calculateMultiSessionHours, PunchSession } from "@/lib/hrms";

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
        breakDurationMinutes: 60,
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

    if (currentUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SUPER_ADMIN_EXEMPT",
            message: "Super Administrators oversee system administration and do not record daily employee punch logs.",
          },
        },
        { status: 400 }
      );
    }

    const { action, notes } = await request.json(); // action: "PUNCH_IN" | "PUNCH_OUT"

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

    // Parse existing punch sessions
    let sessions: PunchSession[] = [];
    if (existing?.notes) {
      try {
        const parsed = JSON.parse(existing.notes);
        if (Array.isArray(parsed.punches)) {
          sessions = parsed.punches;
        }
      } catch (e) {}
    }

    // Fallback if existing record has punchIn/punchOut without JSON log in notes
    if (sessions.length === 0 && existing?.punchIn) {
      sessions.push({
        punchIn: new Date(existing.punchIn).toISOString(),
        punchOut: existing.punchOut ? new Date(existing.punchOut).toISOString() : null,
      });
    }

    const isCurrentlyActive = existing?.punchIn && !existing?.punchOut;

    if (action === "PUNCH_IN") {
      if (isCurrentlyActive) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "ALREADY_PUNCHED_IN",
              message: "You are currently clocked in. Please punch out before punching in again.",
            },
          },
          { status: 400 }
        );
      }

      // Start new punch session
      sessions.push({
        punchIn: now.toISOString(),
        punchOut: null,
      });

      const firstPunchIn = existing?.punchIn ? existing.punchIn : now;
      const calc = calculateMultiSessionHours(sessions, firstPunchIn, null, 60);

      const notesPayload = JSON.stringify({
        punches: sessions,
        customNotes: notes || undefined,
        shiftRule: "9h Shift (8h Work + 1h Break)",
      });

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
          breakDurationMinutes: 60,
          totalWorkingHours: calc.totalWorkingHours,
          status: "PRESENT",
          notes: notesPayload,
        },
        update: {
          punchIn: firstPunchIn,
          punchOut: null,
          status: "PRESENT",
          totalWorkingHours: calc.totalWorkingHours,
          breakDurationMinutes: calc.breakDurationMinutes || 60,
          notes: notesPayload,
        },
      });

      return NextResponse.json({
        success: true,
        data: attendance,
        message: `Punched in successfully at ${now.toLocaleTimeString()} (Session #${sessions.length})`,
      });
    }

    if (action === "PUNCH_OUT") {
      if (!isCurrentlyActive && (!existing || existing.punchOut)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "NOT_PUNCHED_IN",
              message: "You are not currently clocked in. Please punch in first.",
            },
          },
          { status: 400 }
        );
      }

      // Close the open session
      let closed = false;
      for (let i = sessions.length - 1; i >= 0; i--) {
        if (!sessions[i].punchOut) {
          sessions[i].punchOut = now.toISOString();
          const inMs = new Date(sessions[i].punchIn).getTime();
          const outMs = now.getTime();
          sessions[i].durationMinutes = Math.round((outMs - inMs) / (60 * 1000));
          closed = true;
          break;
        }
      }

      if (!closed) {
        sessions.push({
          punchIn: (existing?.punchIn || now).toISOString(),
          punchOut: now.toISOString(),
          durationMinutes: Math.round((now.getTime() - new Date(existing?.punchIn || now).getTime()) / (60 * 1000)),
        });
      }

      const firstPunchIn = existing?.punchIn ? existing.punchIn : now;
      const calc = calculateMultiSessionHours(sessions, firstPunchIn, now, 60);

      const notesPayload = JSON.stringify({
        punches: sessions,
        customNotes: notes || undefined,
        shiftRule: "9h Shift (8h Work + 1h Break)",
      });

      const attendance = await prisma.attendance.update({
        where: { id: existing!.id },
        data: {
          punchOut: now,
          breakDurationMinutes: calc.breakDurationMinutes || 60,
          totalWorkingHours: calc.totalWorkingHours,
          status: calc.status,
          notes: notesPayload,
        },
      });

      return NextResponse.json({
        success: true,
        data: attendance,
        message: `Punched out at ${now.toLocaleTimeString()}. Logged: ${calc.totalWorkingHours}h (${calc.status === "FULL_DAY" ? "Full Day Complete: 8+ hrs" : "Half Day: <8 hrs"})`,
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
