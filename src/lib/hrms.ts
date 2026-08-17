/**
 * HRMS Utility Functions: 8-Hour Rule, Monthly Attendance Stats, Birthday Checker
 */

export interface DailyHoursResult {
  totalWorkingHours: number;
  breakDurationMinutes: number;
  status: "FULL_DAY" | "HALF_DAY" | "PRESENT" | "NOT_RECORDED";
}

/**
 * 8-HOUR WORKING RULE (Master Prompt Section 25):
 * Total Working Hours = Punch Out - Punch In - Break Duration
 * If Total >= 8.0 hours -> FULL_DAY
 * If Total < 8.0 hours -> HALF_DAY
 */
export function calculateWorkingHours(
  punchIn: Date | string | null | undefined,
  punchOut: Date | string | null | undefined,
  breakDurationMinutes = 0
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
  const breakMs = (breakDurationMinutes || 0) * 60 * 1000;
  const netWorkingMs = Math.max(0, elapsedMs - breakMs);

  const totalWorkingHours = Math.round((netWorkingMs / (1000 * 60 * 60)) * 100) / 100;

  let status: "FULL_DAY" | "HALF_DAY" | "PRESENT" | "NOT_RECORDED" = "PRESENT";
  if (punchOut) {
    status = totalWorkingHours >= 8.0 ? "FULL_DAY" : "HALF_DAY";
  }

  return {
    totalWorkingHours,
    breakDurationMinutes,
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
