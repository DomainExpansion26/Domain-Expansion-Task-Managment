/**
 * HRMS Utility Functions: 8-Hour Working Rule in 9-Hour Shift, Multi-Session Punch, Monthly Stats, Birthday Checker
 */

export interface DailyHoursResult {
  totalWorkingHours: number;
  breakDurationMinutes: number;
  status: "FULL_DAY" | "HALF_DAY" | "PRESENT" | "NOT_RECORDED";
}

export interface PunchSession {
  punchIn: string; // ISO string
  punchOut?: string | null; // ISO string
  durationMinutes?: number;
}

/**
 * 9-HOUR SHIFT & 8-HOUR WORKING RULE:
 * - Shift Window: 9.0 hours section
 * - 1 Hour (60 minutes) standard break allowance
 * - Target working hours: 8.0 hours net for FULL_DAY
 * - Net hours >= 8.0 -> FULL_DAY
 * - Net hours < 8.0 (and > 0) -> HALF_DAY
 */
export function calculateWorkingHours(
  punchIn: Date | string | null | undefined,
  punchOut: Date | string | null | undefined,
  breakDurationMinutes = 60
): DailyHoursResult {
  if (!punchIn) {
    return {
      totalWorkingHours: 0,
      breakDurationMinutes: 0,
      status: "NOT_RECORDED",
    };
  }

  const inTime = new Date(punchIn).getTime();
  const outTime = punchOut ? new Date(punchOut).getTime() : Date.now();

  // Cap single session span to maximum 12 hours to prevent runaway hours if unclosed
  const MAX_SHIFT_MS = 12 * 60 * 60 * 1000;
  const elapsedMs = Math.min(Math.max(0, outTime - inTime), MAX_SHIFT_MS);
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  // In a standard 9-hour shift (8 hours work + 1 hour break):
  // - For <= 8 hours: no automatic break deduction is penalized unless user specified explicit break
  // - Between 8 and 9 hours: time beyond 8 hours is treated as break window
  // - For >= 9 hours: standard 1-hour break is applied
  let breakMs = 0;
  if (breakDurationMinutes > 0 && breakDurationMinutes !== 60) {
    breakMs = breakDurationMinutes * 60 * 1000;
  } else if (elapsedHours >= 9.0) {
    breakMs = 60 * 60 * 1000;
  } else if (elapsedHours > 8.0) {
    breakMs = Math.min(60 * 60 * 1000, elapsedMs - (8 * 60 * 60 * 1000));
  }

  const netWorkingMs = Math.max(0, elapsedMs - breakMs);
  const totalWorkingHours = Math.min(12.0, Math.round((netWorkingMs / (1000 * 60 * 60)) * 100) / 100);

  let status: "FULL_DAY" | "HALF_DAY" | "PRESENT" | "NOT_RECORDED" = "PRESENT";
  if (punchOut) {
    status = totalWorkingHours >= 8.0 ? "FULL_DAY" : totalWorkingHours > 0 ? "HALF_DAY" : "NOT_RECORDED";
  } else if (totalWorkingHours >= 8.0) {
    status = "FULL_DAY";
  }

  return {
    totalWorkingHours,
    breakDurationMinutes: Math.round(breakMs / (60 * 1000)),
    status,
  };
}

/**
 * Calculates accumulated working hours across MULTIPLE punch sessions throughout the day.
 * Employees can punch in and punch out multiple times (e.g. for breaks).
 * Each session [punchIn, punchOut] adds to active work hours.
 * Time between sessions is natural break time.
 */
export function calculateMultiSessionHours(
  sessions: PunchSession[],
  currentPunchIn?: Date | string | null,
  currentPunchOut?: Date | string | null,
  standardBreakMinutes = 60
): DailyHoursResult {
  if (!sessions || sessions.length === 0) {
    if (!currentPunchIn) {
      return { totalWorkingHours: 0, breakDurationMinutes: 0, status: "NOT_RECORDED" };
    }
    return calculateWorkingHours(currentPunchIn, currentPunchOut, standardBreakMinutes);
  }

  const MAX_SESSION_MS = 12 * 60 * 60 * 1000;
  let totalActiveMs = 0;
  let hasOpenSession = false;
  let earliestIn: number | null = null;
  let latestOut: number | null = null;

  for (const s of sessions) {
    if (s.punchIn) {
      const inMs = new Date(s.punchIn).getTime();
      if (isNaN(inMs)) continue;
      if (earliestIn === null || inMs < earliestIn) earliestIn = inMs;

      if (s.punchOut) {
        const outMs = new Date(s.punchOut).getTime();
        if (isNaN(outMs)) continue;
        if (latestOut === null || outMs > latestOut) latestOut = outMs;
        const dur = Math.min(Math.max(0, outMs - inMs), MAX_SESSION_MS);
        totalActiveMs += dur;
      } else {
        hasOpenSession = true;
        const nowMs = Date.now();
        if (latestOut === null || nowMs > latestOut) latestOut = nowMs;
        const dur = Math.min(Math.max(0, nowMs - inMs), MAX_SESSION_MS);
        totalActiveMs += dur;
      }
    }
  }

  // Calculate natural breaks between sessions
  let naturalBreakMs = 0;
  if (earliestIn !== null && latestOut !== null) {
    const totalSpanMs = Math.max(0, latestOut - earliestIn);
    naturalBreakMs = Math.max(0, totalSpanMs - totalActiveMs);
  }

  let effectiveBreakMinutes = Math.round(naturalBreakMs / (60 * 1000));
  // If user only had 1 session and total span reaches 9 hours with no natural breaks, deduct standard 1-hour break window
  if (effectiveBreakMinutes < standardBreakMinutes && earliestIn !== null && latestOut !== null && sessions.length <= 1) {
    const totalSpanHours = (latestOut - earliestIn) / (1000 * 60 * 60);
    if (totalSpanHours >= 9.0) {
      const additionalBreakMs = (standardBreakMinutes * 60 * 1000) - naturalBreakMs;
      totalActiveMs = Math.max(0, totalActiveMs - additionalBreakMs);
      effectiveBreakMinutes = standardBreakMinutes;
    }
  }

  // Cap total active hours per day to 12.0 hours max
  const totalWorkingHours = Math.min(12.0, Math.round((totalActiveMs / (1000 * 60 * 60)) * 100) / 100);

  let status: "FULL_DAY" | "HALF_DAY" | "PRESENT" | "NOT_RECORDED" = "PRESENT";
  if (!hasOpenSession) {
    status = totalWorkingHours >= 8.0 ? "FULL_DAY" : totalWorkingHours > 0 ? "HALF_DAY" : "NOT_RECORDED";
  } else if (totalWorkingHours >= 8.0) {
    status = "FULL_DAY";
  }

  return {
    totalWorkingHours,
    breakDurationMinutes: effectiveBreakMinutes,
    status,
  };
}

/**
 * Auto-closes any unclosed attendance records from previous calendar days.
 * Caps their hours to 8.0h (standard shift) to prevent cross-day mega hours.
 */
export async function autoCloseDanglingSessions(prismaClient: any, userId: string, todayUtcMidnight: Date) {
  try {
    const danglingRecords = await prismaClient.attendance.findMany({
      where: {
        userId,
        date: { lt: todayUtcMidnight },
        punchIn: { not: null },
        punchOut: null,
      },
    });

    for (const rec of danglingRecords) {
      if (!rec.punchIn) continue;
      const inDate = new Date(rec.punchIn);
      const cappedOut = new Date(Math.min(inDate.getTime() + 8 * 60 * 60 * 1000, new Date(rec.date).getTime() + 23 * 3600000 + 59 * 60000));
      
      let sessions: PunchSession[] = [];
      if (rec.notes) {
        try {
          const parsed = JSON.parse(rec.notes);
          if (Array.isArray(parsed.punches)) sessions = parsed.punches;
        } catch (e) {}
      }
      if (sessions.length === 0) {
        sessions.push({ punchIn: inDate.toISOString(), punchOut: cappedOut.toISOString(), durationMinutes: 480 });
      } else {
        for (const s of sessions) {
          if (!s.punchOut) {
            s.punchOut = cappedOut.toISOString();
            s.durationMinutes = Math.min(480, Math.round((cappedOut.getTime() - new Date(s.punchIn).getTime()) / 60000));
          }
        }
      }

      await prismaClient.attendance.update({
        where: { id: rec.id },
        data: {
          punchOut: cappedOut,
          totalWorkingHours: 8.0,
          status: "FULL_DAY",
          notes: JSON.stringify({
            punches: sessions,
            shiftRule: "9h Shift (8h Work + 1h Break)",
            autoClosed: true,
          }),
        },
      });
    }
  } catch (err) {
    console.error("Error auto-closing dangling sessions:", err);
  }
}

/**
 * Checks if a user's date of birth is tomorrow
 */
export function isBirthdayTomorrow(dateOfBirth?: Date | string | null): boolean {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return false;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return dob.getUTCMonth() === tomorrow.getUTCMonth() && dob.getUTCDate() === tomorrow.getUTCDate();
}

/**
 * Checks if a user's date of birth is today
 */
export function isBirthdayToday(dateOfBirth?: Date | string | null): boolean {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return false;

  const today = new Date();
  return dob.getUTCMonth() === today.getUTCMonth() && dob.getUTCDate() === today.getUTCDate();
}

/**
 * Formats monthly attendance statistics
 */
export function calculateMonthlyStats(attendances: any[], leaves: any[] = []) {
  let presentDays = 0;
  let halfDays = 0;
  let leaveDays = 0;
  let absentDays = 0;
  let totalWorkingHours = 0;

  const attendanceDates = new Set<string>();

  for (const record of attendances) {
    totalWorkingHours += record.totalWorkingHours || 0;
    if (record.date) {
      const d = new Date(record.date);
      attendanceDates.add(`${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`);
    }
    if (record.status === "FULL_DAY" || record.status === "PRESENT") {
      presentDays++;
    } else if (record.status === "HALF_DAY") {
      halfDays++;
    } else if (record.status === "LEAVE") {
      leaveDays++;
    } else if (record.status === "ABSENT") {
      absentDays++;
    }
  }

  // Add approved leaves only if not already counted via an attendance record
  for (const leave of leaves) {
    if (leave.status === "APPROVED") {
      const s = new Date(leave.startDate);
      const e = new Date(leave.endDate);
      const startMs = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
      const endMs = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate());
      const ONE_DAY = 24 * 60 * 60 * 1000;
      for (let t = startMs; t <= endMs; t += ONE_DAY) {
        const d = new Date(t);
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
        if (!attendanceDates.has(key)) {
          leaveDays += leave.daysCount <= 0.5 ? 0.5 : 1;
        }
      }
    }
  }

  const totalWorkingDays = presentDays + halfDays + leaveDays + absentDays;

  return {
    totalWorkingDays,
    presentDays,
    halfDays,
    leaveDays,
    absentDays,
    totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
  };
}
