"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Cake,
  FileText,
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { AttendanceDetailModal } from "@/components/modals/AttendanceDetailModal";
import { LeaveApplyModal } from "@/components/modals/LeaveApplyModal";
import { formatDateTime } from "@/lib/utils";

interface HRMSViewProps {
  currentUser: any;
}

export function HRMSView({ currentUser }: HRMSViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"attendance" | "leave" | "profile">("attendance");
  const [punchData, setPunchData] = useState<any | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any | null>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any>({ tomorrow: [], today: [] });
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(0);

  // Month navigation
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modals
  const [selectedDayRecord, setSelectedDayRecord] = useState<{ record: any; dateStr: string } | null>(null);
  const [isLeaveApplyOpen, setIsLeaveApplyOpen] = useState(false);

  const fetchHRMSData = async () => {
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const [punchRes, attendanceRes, leaveRes, birthdayRes] = await Promise.all([
        fetch("/api/hrms/punch"),
        fetch(`/api/hrms/attendance?month=${month}&year=${year}`),
        fetch("/api/hrms/leave"),
        fetch("/api/hrms/birthdays"),
      ]);

      const punchJson = await punchRes.json();
      const attendanceJson = await attendanceRes.json();
      const leaveJson = await leaveRes.json();
      const birthdayJson = await birthdayRes.json();

      if (punchJson.success) setPunchData(punchJson.data);
      if (attendanceJson.success) {
        setAttendanceRecords(attendanceJson.data.attendances || []);
        setMonthlyStats(attendanceJson.data.stats);
      }
      if (leaveJson.success) setLeaves(leaveJson.data);
      if (birthdayJson.success) setBirthdays(birthdayJson.data);
    } catch (err) {
      console.error("Failed to load HRMS data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRMSData();
  }, [currentDate]);

  const handlePunch = async (action: "PUNCH_IN" | "PUNCH_OUT") => {
    setPunchLoading(true);
    try {
      const res = await fetch("/api/hrms/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          breakMinutes: breakMinutes || 0,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchHRMSData();
      }
    } catch (err) {
      console.error("Punch error:", err);
    } finally {
      setPunchLoading(false);
    }
  };

  // Build Calendar Days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record = attendanceRecords.find((a) => a.date.slice(0, 10) === dateStr);
    calendarDays.push({ day, dateStr, record });
  }

  const getDayPillColor = (status?: string) => {
    switch (status) {
      case "FULL_DAY":
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      case "HALF_DAY":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "PRESENT":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "LEAVE":
        return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
      case "ABSENT":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      default:
        return "bg-[#1E1E1E] text-[#888898] border border-[#2E2E2E]";
    }
  };

  const isPunchedIn = Boolean(punchData?.punchIn && !punchData?.punchOut);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[#FF6200]/15 border border-[#FF6200]/30 text-[#FF8C42] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>HRMS & Attendance Portal</span>
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Employee HR & Attendance Management</h1>
          <p className="text-xs text-[#888898]">
            Automated 8-hour workday rule, monthly attendance calendar, leave workflows & organization identity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLeaveApplyOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] hover:opacity-95 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(255,98,0,0.3)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: BIRTHDAY BANNER (Master Prompt Section 30) */}
      {birthdays.tomorrow && birthdays.tomorrow.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 border border-pink-500/40 text-white flex items-center gap-3.5 shadow-[0_0_30px_rgba(236,72,153,0.15)] animate-fade-in">
          <div className="p-3 rounded-2xl bg-pink-500 text-white shadow-lg flex-shrink-0">
            <Cake className="w-6 h-6 animate-bounce" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-extrabold text-pink-300 uppercase tracking-wider mb-0.5">
              Birthday Announcement
            </div>
            {birthdays.tomorrow.map((b: any) => (
              <div key={b.userId} className="text-sm font-bold text-white">
                {b.bannerMessage}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: TOP PUNCH IN / OUT WIDGET & 8-HOUR RULE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Punch In / Out Card */}
        <div className="md:col-span-5 p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF6200] animate-pulse" />
              <h2 className="text-sm font-bold text-white">Daily Punch In / Punch Out</h2>
            </div>
            <span className="text-[11px] font-mono text-[#888898]">{new Date().toDateString()}</span>
          </div>

          {/* Current Punch Status */}
          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#888898]">Punch In Time:</span>
              <span className="font-mono font-bold text-white">
                {punchData?.punchIn ? new Date(punchData.punchIn).toLocaleTimeString() : "Not punched in"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#888898]">Punch Out Time:</span>
              <span className="font-mono font-bold text-white">
                {punchData?.punchOut ? new Date(punchData.punchOut).toLocaleTimeString() : isPunchedIn ? "Active (In Progress)" : "—"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#888898]">Break Duration:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={240}
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
                  disabled={!isPunchedIn}
                  className="w-16 bg-[#141414] border border-[#2E2E2E] rounded px-2 py-0.5 text-right text-white text-xs"
                />
                <span className="text-[#888898]">mins</span>
              </div>
            </div>

            {/* 8-Hour Rule Indicator (Master Prompt Section 25) */}
            <div className="pt-2 border-t border-[#2E2E2E] flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-[#888898] uppercase block">
                  8-Hour Rule Calculation
                </span>
                <span className="text-xs font-bold text-white">
                  Total Logged: {punchData?.totalWorkingHours || 0} hrs
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-black tracking-wide border ${
                  punchData?.status === "FULL_DAY"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : punchData?.status === "HALF_DAY"
                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                }`}
              >
                {punchData?.status === "FULL_DAY"
                  ? "FULL DAY ( $\\ge 8$h )"
                  : punchData?.status === "HALF_DAY"
                  ? "HALF DAY ( $< 8$h )"
                  : punchData?.status?.replace("_", " ") || "NOT RECORDED"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => handlePunch("PUNCH_IN")}
              disabled={isPunchedIn || punchLoading}
              className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>Punch In</span>
            </button>

            <button
              onClick={() => handlePunch("PUNCH_OUT")}
              disabled={!isPunchedIn || punchLoading}
              className="py-3 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] disabled:opacity-40 text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(255,98,0,0.3)] flex items-center justify-center gap-2"
            >
              <Coffee className="w-4 h-4" />
              <span>Punch Out</span>
            </button>
          </div>
        </div>

        {/* Monthly Summary Statistics Cards (Master Prompt Section 26) */}
        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E] flex flex-col justify-between">
            <span className="text-[11px] font-bold text-[#888898] uppercase">Total Working Days</span>
            <div className="text-2xl font-black text-white">{monthlyStats?.totalWorkingDays || 0}</div>
            <span className="text-[10px] text-[#888898]">This Month</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-emerald-500/30 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase">Present (Full Day)</span>
            <div className="text-2xl font-black text-emerald-400">{monthlyStats?.presentDays || 0}</div>
            <span className="text-[10px] text-emerald-500/70">$\\ge 8$ hours logged</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-yellow-500/30 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-yellow-400 uppercase">Half Days</span>
            <div className="text-2xl font-black text-yellow-400">{monthlyStats?.halfDays || 0}</div>
            <span className="text-[10px] text-yellow-500/70">$&lt; 8$ hours logged</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-purple-500/30 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-purple-400 uppercase">Leaves Taken</span>
            <div className="text-2xl font-black text-purple-400">{monthlyStats?.leaveDays || 0}</div>
            <span className="text-[10px] text-purple-500/70">Approved Time-off</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-red-500/30 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-red-400 uppercase">Absent Days</span>
            <div className="text-2xl font-black text-red-400">{monthlyStats?.absentDays || 0}</div>
            <span className="text-[10px] text-red-500/70">Unrecorded</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-[#FF6200]/30 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-[#FF8C42] uppercase">Total Hours</span>
            <div className="text-2xl font-black text-[#FF8C42]">{monthlyStats?.totalWorkingHours || 0}h</div>
            <span className="text-[10px] text-[#888898]">Cumulative</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2E2E2E] pb-3 text-xs">
        <button
          onClick={() => setActiveSubTab("attendance")}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeSubTab === "attendance"
              ? "bg-[#1A1A1A] border border-[#FF6200]/50 text-[#FF8C42]"
              : "text-[#888898] hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Attendance Calendar View</span>
        </button>

        <button
          onClick={() => setActiveSubTab("leave")}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeSubTab === "leave"
              ? "bg-[#1A1A1A] border border-[#FF6200]/50 text-[#FF8C42]"
              : "text-[#888898] hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Leave Management & History ({leaves.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("profile")}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeSubTab === "profile"
              ? "bg-[#1A1A1A] border border-[#FF6200]/50 text-[#FF8C42]"
              : "text-[#888898] hover:text-white"
          }`}
        >
          <User className="w-4 h-4" />
          <span>HR Identity & Hierarchy</span>
        </button>
      </div>

      {/* SUBTAB 1: ATTENDANCE CALENDAR */}
      {activeSubTab === "attendance" && (
        <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-4">
          {/* Month Navigator */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()} Attendance
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#252525] text-[#888898] hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 rounded-lg bg-[#1A1A1A] hover:bg-[#252525] text-xs font-semibold text-white"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#252525] text-[#888898] hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2 text-[10px] font-bold text-[#888898] uppercase">
                {day}
              </div>
            ))}

            {calendarDays.map((item, idx) => {
              if (!item) {
                return <div key={`empty-${idx}`} className="p-4 rounded-xl bg-transparent" />;
              }

              return (
                <div
                  key={item.dateStr}
                  onClick={() => setSelectedDayRecord({ record: item.record, dateStr: item.dateStr })}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[85px] hover:border-[#FF6200]/60 ${
                    item.record
                      ? getDayPillColor(item.record.status)
                      : "bg-[#1A1A1A] border-[#2E2E2E] text-slate-400"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs">{item.day}</span>
                    {item.record && (
                      <span className="text-[9px] font-mono font-bold">
                        {item.record.totalWorkingHours || 0}h
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] font-semibold tracking-tight uppercase">
                    {item.record?.status?.replace("_", " ") || "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: LEAVE MANAGEMENT */}
      {activeSubTab === "leave" && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#141414] border border-[#2E2E2E] overflow-hidden">
            <div className="p-4 border-b border-[#2E2E2E] bg-[#1A1A1A] flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Leave Applications & Approval Status</h2>
              <button
                onClick={() => setIsLeaveApplyOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-[#FF6200] text-white text-xs font-bold"
              >
                + Apply Leave
              </button>
            </div>

            {leaves.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#888898]">No leave applications recorded yet.</div>
            ) : (
              <div className="divide-y divide-[#2E2E2E]/60 text-xs">
                {leaves.map((leave) => (
                  <div key={leave.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white uppercase">{leave.leaveType} LEAVE</span>
                        <span className="text-[11px] text-[#888898]">({leave.daysCount} days)</span>
                      </div>
                      <p className="text-slate-300 text-xs">{leave.reason}</p>
                      <div className="text-[11px] text-[#888898]">
                        Dates: {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${
                          leave.status === "APPROVED"
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                            : leave.status === "REJECTED"
                            ? "bg-red-500/15 border-red-500/30 text-red-400"
                            : "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                        }`}
                      >
                        {leave.status}
                      </span>
                      {leave.approverComment && (
                        <div className="text-[10px] text-[#888898] italic">Note: {leave.approverComment}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: HR IDENTITY & HIERARCHY */}
      {activeSubTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#2E2E2E] space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white pb-2 border-b border-[#2E2E2E]">
              Employment Profile Identity
            </h2>

            <div className="space-y-3 text-slate-300">
              <div className="flex justify-between">
                <span className="text-[#888898]">Full Name:</span>
                <span className="font-bold text-white">{currentUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888898]">Official Email:</span>
                <span className="text-white font-mono">{currentUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888898]">Role / Access Level:</span>
                <span className="text-[#FF8C42] font-bold">{currentUser.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888898]">Designation:</span>
                <span className="text-white">{currentUser.jobTitle || "Software Engineer"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888898]">Department:</span>
                <span className="text-white">{currentUser.department || "Engineering"}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#141414] border border-[#2E2E2E] space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white pb-2 border-b border-[#2E2E2E]">
              Reporting Line Hierarchy
            </h2>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase">Assigned Manager</span>
                <div className="text-white font-bold">{currentUser.manager?.name || "None Assigned"}</div>
                <div className="text-[11px] text-[#888898]">{currentUser.manager?.email || "—"}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase">Assigned Team Lead</span>
                <div className="text-white font-bold">{currentUser.teamLead?.name || "None Assigned"}</div>
                <div className="text-[11px] text-[#888898]">{currentUser.teamLead?.email || "—"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Detail / Correction Modal */}
      {selectedDayRecord && (
        <AttendanceDetailModal
          isOpen={Boolean(selectedDayRecord)}
          onClose={() => setSelectedDayRecord(null)}
          record={selectedDayRecord.record}
          dateStr={selectedDayRecord.dateStr}
          isHRAdmin={currentUser.role === "HR_ADMIN" || currentUser.role === "SUPER_ADMIN"}
          onRecordUpdated={fetchHRMSData}
        />
      )}

      {/* Leave Apply Modal */}
      {isLeaveApplyOpen && (
        <LeaveApplyModal
          isOpen={isLeaveApplyOpen}
          onClose={() => setIsLeaveApplyOpen(false)}
          onLeaveApplied={fetchHRMSData}
        />
      )}
    </div>
  );
}
