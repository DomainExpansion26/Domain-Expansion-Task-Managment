import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { autoCloseDanglingSessions, calculateMultiSessionHours, PunchSession } from "@/lib/hrms";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Auto-close any dangling sessions from previous calendar days so they don't leak into today
    await autoCloseDanglingSessions(prisma, currentUser.id, today);

    // Query strictly today's attendance record
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: currentUser.id,
          date: today,
        },
      },
    });

    if (!attendance) {
      return NextResponse.json({
        success: true,
        data: {
          date: today,
          punchIn: null,
          punchOut: null,
          breakDurationMinutes: 0,
          totalWorkingHours: 0,
          status: "NOT_RECORDED",
          sessions: [],
        },
      });
    }

    // Parse sessions from notes
    let sessions: PunchSession[] = [];
    if (attendance.notes) {
      try {
        const parsed = JSON.parse(attendance.notes);
        if (Array.isArray(parsed.punches)) {
          sessions = parsed.punches;
        }
      } catch (e) {}
    }

    if (sessions.length === 0 && attendance.punchIn) {
      sessions.push({
        punchIn: new Date(attendance.punchIn).toISOString(),
        punchOut: attendance.punchOut ? new Date(attendance.punchOut).toISOString() : null,
      });
    }

    // If user is currently active (clocked in today), dynamically compute live working hours
    let currentWorkingHours = attendance.totalWorkingHours || 0;
    let currentStatus = attendance.status;

    if (attendance.punchIn && !attendance.punchOut) {
      const calc = calculateMultiSessionHours(sessions, attendance.punchIn, null, attendance.breakDurationMinutes ?? 60);
      currentWorkingHours = calc.totalWorkingHours;
      currentStatus = calc.status;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...attendance,
        totalWorkingHours: currentWorkingHours,
        status: currentStatus,
        sessions,
      },
    });
  } catch (error: any) {
    console.error("Get punch status error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to get punch status" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { action, notes } = await request.json(); // action: "PUNCH_IN" | "PUNCH_OUT"

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const now = new Date();

    // Auto-close any unclosed past days' sessions first so they never block today
    await autoCloseDanglingSessions(prisma, currentUser.id, today);

    // Fetch today's record strictly
    const existingToday = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: currentUser.id,
          date: today,
        },
      },
    });

    if (action === "PUNCH_IN") {
      // Check if user is already clocked in today
      const isCurrentlyClockedIn = Boolean(existingToday?.punchIn && !existingToday?.punchOut);
      if (isCurrentlyClockedIn) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "ALREADY_PUNCHED_IN",
              message: "You are currently clocked in. Please punch out / take a break before punching in again.",
            },
          },
          { status: 400 }
        );
      }

      // Parse existing punch sessions from today's record
      let sessions: PunchSession[] = [];
      if (existingToday?.notes) {
        try {
          const parsed = JSON.parse(existingToday.notes);
          if (Array.isArray(parsed.punches)) {
            sessions = parsed.punches;
          }
        } catch (e) {}
      }

      if (sessions.length === 0 && existingToday?.punchIn) {
        sessions.push({
          punchIn: new Date(existingToday.punchIn).toISOString(),
          punchOut: existingToday.punchOut ? new Date(existingToday.punchOut).toISOString() : null,
        });
      }

      // Start new punch session
      sessions.push({
        punchIn: now.toISOString(),
        punchOut: null,
      });

      const firstPunchIn = existingToday?.punchIn ? existingToday.punchIn : now;
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
          breakDurationMinutes: calc.breakDurationMinutes !== undefined ? calc.breakDurationMinutes : 0,
          totalWorkingHours: calc.totalWorkingHours,
          status: "PRESENT",
          notes: notesPayload,
        },
        update: {
          punchIn: firstPunchIn,
          punchOut: null, // Actively clocked in
          status: "PRESENT",
          totalWorkingHours: calc.totalWorkingHours,
          breakDurationMinutes: calc.breakDurationMinutes !== undefined ? calc.breakDurationMinutes : 0,
          notes: notesPayload,
        },
      });

      const sessionNum = sessions.length;
      return NextResponse.json({
        success: true,
        data: { ...attendance, sessions },
        message: `Punched in successfully at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (Session #${sessionNum})`,
      });
    }

    if (action === "PUNCH_OUT") {
      // Must be clocked in today to punch out
      if (!existingToday || !existingToday.punchIn || existingToday.punchOut) {
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

      // Parse sessions
      let sessions: PunchSession[] = [];
      if (existingToday.notes) {
        try {
          const parsed = JSON.parse(existingToday.notes);
          if (Array.isArray(parsed.punches)) {
            sessions = parsed.punches;
          }
        } catch (e) {}
      }

      if (sessions.length === 0 && existingToday.punchIn) {
        sessions.push({
          punchIn: new Date(existingToday.punchIn).toISOString(),
          punchOut: null,
        });
      }

      // Close the open session
      let closed = false;
      for (let i = sessions.length - 1; i >= 0; i--) {
        if (!sessions[i].punchOut) {
          sessions[i].punchOut = now.toISOString();
          const inMs = new Date(sessions[i].punchIn).getTime();
          const outMs = now.getTime();
          sessions[i].durationMinutes = Math.max(0, Math.round((outMs - inMs) / (60 * 1000)));
          closed = true;
          break;
        }
      }

      if (!closed) {
        sessions.push({
          punchIn: (existingToday.punchIn || now).toISOString(),
          punchOut: now.toISOString(),
          durationMinutes: Math.max(0, Math.round((now.getTime() - new Date(existingToday.punchIn || now).getTime()) / (60 * 1000))),
        });
      }

      const firstPunchIn = existingToday.punchIn || now;
      const calc = calculateMultiSessionHours(sessions, firstPunchIn, now, 60);

      const notesPayload = JSON.stringify({
        punches: sessions,
        customNotes: notes || undefined,
        shiftRule: "9h Shift (8h Work + 1h Break)",
      });

      const attendance = await prisma.attendance.update({
        where: { id: existingToday.id },
        data: {
          punchOut: now,
          breakDurationMinutes: calc.breakDurationMinutes !== undefined ? calc.breakDurationMinutes : 0,
          totalWorkingHours: calc.totalWorkingHours,
          status: calc.status,
          notes: notesPayload,
        },
      });

      return NextResponse.json({
        success: true,
        data: { ...attendance, sessions },
        message: `Punched out at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Logged: ${calc.totalWorkingHours}h (${calc.status === "FULL_DAY" ? "Full Day Complete: 8+ hrs" : "Break / Half Day: <8 hrs"})`,
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
