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

  const elapsedMs = Math.max(0, outTime - inTime);
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  // Apply standard 1-hour (60 mins) break for shifts of 5+ hours, or when shift reaches 9 hours
  let breakMs = (breakDurationMinutes ?? 60) * 60 * 1000;
  if (elapsedHours < 5.0 && breakDurationMinutes === 60) {
    breakMs = 0; // Short initial punches do not prematurely deduct 1 hour
  } else if (elapsedHours >= 9.0) {
    breakMs = Math.max(breakMs, 60 * 60 * 1000);
  }

  const netWorkingMs = Math.max(0, elapsedMs - breakMs);
  const totalWorkingHours = Math.round((netWorkingMs / (1000 * 60 * 60)) * 100) / 100;

  let status: "FULL_DAY" | "HALF_DAY" | "PRESENT" | "NOT_RECORDED" = "PRESENT";
  if (punchOut) {
    status = totalWorkingHours >= 8.0 ? "FULL_DAY" : "HALF_DAY";
  }

  return {
    totalWorkingHours,
    breakDurationMinutes: Math.round(breakMs / (60 * 1000)),
    status,
  };
}

/**
 * Calculates accumulated working hours across MULTIPLE punch sessions throughout the day.
 * Employees can punch in and punch out multiple times.
 * In a 9-hour total shift span, a 1-hour break is standard and 8.0 hours net work achieves FULL_DAY.
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

  let totalActiveMs = 0;
  let hasOpenSession = false;
  let earliestIn: number | null = null;
  let latestOut: number | null = null;

  for (const s of sessions) {
    if (s.punchIn) {
      const inMs = new Date(s.punchIn).getTime();
      if (earliestIn === null || inMs < earliestIn) earliestIn = inMs;

      if (s.punchOut) {
        const outMs = new Date(s.punchOut).getTime();
        if (latestOut === null || outMs > latestOut) latestOut = outMs;
        const dur = Math.max(0, outMs - inMs);
        totalActiveMs += dur;
      } else {
        hasOpenSession = true;
        const nowMs = Date.now();
        if (latestOut === null || nowMs > latestOut) latestOut = nowMs;
        totalActiveMs += Math.max(0, nowMs - inMs);
      }
    }
  }

  // Calculate natural breaks between sessions
  let naturalBreakMs = 0;
  if (earliestIn !== null && latestOut !== null) {
    const totalSpanMs = Math.max(0, latestOut - earliestIn);
    naturalBreakMs = Math.max(0, totalSpanMs - totalActiveMs);
  }

  // If total span reaches 9 hours and natural breaks are less than standard 1 hour break, apply 1-hour break
  let effectiveBreakMinutes = Math.round(naturalBreakMs / (60 * 1000));
  if (effectiveBreakMinutes < standardBreakMinutes && earliestIn !== null && latestOut !== null) {
    const totalSpanHours = (latestOut - earliestIn) / (1000 * 60 * 60);
    if (totalSpanHours >= 9.0) {
      const additionalBreakMs = (standardBreakMinutes * 60 * 1000) - naturalBreakMs;
      totalActiveMs = Math.max(0, totalActiveMs - additionalBreakMs);
      effectiveBreakMinutes = standardBreakMinutes;
    }
  }

  const totalWorkingHours = Math.round((totalActiveMs / (1000 * 60 * 60)) * 100) / 100;

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

  for (const record of attendances) {
    totalWorkingHours += record.totalWorkingHours || 0;
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

  // Approved leaves count
  for (const leave of leaves) {
    if (leave.status === "APPROVED") {
      leaveDays += leave.daysCount || 1;
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
