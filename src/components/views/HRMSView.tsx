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
  Users,
  Search,
  DollarSign,
  Download,
  Printer,
  Gift,
  Building,
  Mail,
  Phone,
  Briefcase,
  Layers,
  Flame,
  Check,
} from "lucide-react";
import { AttendanceDetailModal } from "@/components/modals/AttendanceDetailModal";
import { LeaveApplyModal } from "@/components/modals/LeaveApplyModal";
import { formatDateTime, getInitials, getAvatarGradient } from "@/lib/utils";

interface HRMSViewProps {
  currentUser: any;
}

export function HRMSView({ currentUser }: HRMSViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "attendance" | "leave" | "directory" | "holidays" | "payslip" | "profile"
  >("attendance");
  const [punchData, setPunchData] = useState<any | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any | null>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [directorySearch, setDirectorySearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayType, setNewHolidayType] = useState("Gazetted");
  const [punchNote, setPunchNote] = useState("");
  const [breakMinutes, setBreakMinutes] = useState(0);

  // Live timer state for continuous working hours ticker
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial today status & monthly logs
  const fetchAttendance = async () => {
    try {
      const res = await fetch(`/api/hrms/attendance?month=${selectedMonth}&year=${selectedYear}`);
      const json = await res.json();
      if (json.success) {
        setPunchData(json.data.today);
        setAttendanceRecords(json.data.monthlyLogs || []);
        setMonthlyStats(json.data.stats || null);
        if (json.data.today?.breakDurationMinutes) {
          setBreakMinutes(json.data.today.breakDurationMinutes);
        }
      }
    } catch (err) {
      console.error("Failed to load attendance", err);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await fetch("/api/hrms/leaves");
      const json = await res.json();
      if (json.success) {
        setLeaves(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load leaves", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/hrms/employees");
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load employees", err);
    }
  };

  const fetchHolidays = async () => {
    setLoadingHolidays(true);
    try {
      const res = await fetch("/api/hrms/holidays");
      const json = await res.json();
      if (json.success) {
        setHolidays(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load holidays", err);
    } finally {
      setLoadingHolidays(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchLeaves();
    fetchEmployees();
    fetchHolidays();
  }, [selectedMonth, selectedYear]);

  // Handle Punch In / Out
  const handlePunch = async (type: "IN" | "OUT") => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/hrms/attendance/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          notes: punchNote || undefined,
          breakDurationMinutes: breakMinutes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPunchData(json.data);
        setPunchNote("");
        fetchAttendance();
      } else {
        setErrorMsg(json.error?.message || "Failed to record punch");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Holiday (For HR Admin / Super Admin)
  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayName.trim() || !newHolidayDate) return;
    try {
      const res = await fetch("/api/hrms/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newHolidayName.trim(),
          date: newHolidayDate,
          type: newHolidayType,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNewHolidayName("");
        setNewHolidayDate("");
        setShowAddHolidayModal(false);
        fetchHolidays();
      }
    } catch (err) {
      console.error("Failed to create holiday", err);
    }
  };

  // Calculate live hours worked today
  const calculateLiveHours = () => {
    if (!punchData?.punchIn) return "0.00";
    const start = new Date(punchData.punchIn).getTime();
    const end = punchData.punchOut ? new Date(punchData.punchOut).getTime() : currentTime.getTime();
    const diffMs = Math.max(0, end - start);
    const grossHours = diffMs / (1000 * 60 * 60);
    const netHours = Math.max(0, grossHours - (breakMinutes || 0) / 60);
    return netHours.toFixed(2);
  };

  // Live timer format HH:MM:SS
  const formatLiveDuration = () => {
    if (!punchData?.punchIn) return "00:00:00";
    const start = new Date(punchData.punchIn).getTime();
    const end = punchData.punchOut ? new Date(punchData.punchOut).getTime() : currentTime.getTime();
    let diffSec = Math.max(0, Math.floor((end - start) / 1000) - (breakMinutes || 0) * 60);
    const hrs = Math.floor(diffSec / 3600);
    diffSec %= 3600;
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isPunchedIn = punchData?.punchIn && !punchData?.punchOut;
  const isPunchedOut = punchData?.punchIn && punchData?.punchOut;
  const currentDate = new Date();

  // Dynamic Approved Leaves Calculation
  const approvedCasual = leaves.filter((l) => l.status === "APPROVED" && l.leaveType === "CASUAL").reduce((a, b) => a + (b.daysCount || 1), 0);
  const approvedSick = leaves.filter((l) => l.status === "APPROVED" && l.leaveType === "SICK").reduce((a, b) => a + (b.daysCount || 1), 0);
  const approvedPaid = leaves.filter((l) => l.status === "APPROVED" && l.leaveType === "PAID").reduce((a, b) => a + (b.daysCount || 1), 0);
  const approvedEmergency = leaves.filter((l) => l.status === "APPROVED" && l.leaveType === "EMERGENCY").reduce((a, b) => a + (b.daysCount || 1), 0);

  // Filtered employees for directory
  const filteredEmployees = employees.filter((emp) => {
    const q = directorySearch.toLowerCase();
    const name = emp.name || emp.user?.name || "";
    const email = emp.email || emp.user?.email || "";
    const dep = emp.department || emp.user?.department || "";
    const job = emp.designation || emp.jobTitle || emp.user?.jobTitle || "";
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || dep.toLowerCase().includes(q) || job.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-[#FF6200]" />
            <span>Employee HRMS & Self-Service</span>
          </h1>
          <p className="text-xs text-[#888898] mt-1">
            Real-time daily attendance, automated time calculations, leave balance, team directory, and company calendar
          </p>
        </div>

        {/* Sub-tab Switcher (Responsive scroll on mobile) */}
        <div className="flex items-center gap-1.5 p-1 bg-[#141414] border border-[#2E2E2E] rounded-2xl overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveSubTab("attendance")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              activeSubTab === "attendance"
                ? "bg-[#FF6200] text-white shadow-lg shadow-[#FF6200]/20"
                : "text-[#888898] hover:text-white hover:bg-[#252525]"
            }`}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveSubTab("leave")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 whitespace-nowrap ${
              activeSubTab === "leave"
                ? "bg-[#FF6200] text-white shadow-lg shadow-[#FF6200]/20"
                : "text-[#888898] hover:text-white hover:bg-[#252525]"
            }`}
          >
            Leaves ({leaves.filter((l) => l.status === "PENDING").length} Pending)
          </button>
          <button
            onClick={() => setActiveSubTab("directory")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 whitespace-nowrap ${
              activeSubTab === "directory"
                ? "bg-[#FF6200] text-white shadow-lg shadow-[#FF6200]/20"
                : "text-[#888898] hover:text-white hover:bg-[#252525]"
            }`}
          >
            Team Directory
          </button>
          <button
            onClick={() => setActiveSubTab("holidays")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 whitespace-nowrap ${
              activeSubTab === "holidays"
                ? "bg-[#FF6200] text-white shadow-lg shadow-[#FF6200]/20"
                : "text-[#888898] hover:text-white hover:bg-[#252525]"
            }`}
          >
            Holidays
          </button>
          <button
            onClick={() => setActiveSubTab("payslip")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 whitespace-nowrap ${
              activeSubTab === "payslip"
                ? "bg-[#FF6200] text-white shadow-lg shadow-[#FF6200]/20"
                : "text-[#888898] hover:text-white hover:bg-[#252525]"
            }`}
          >
            Salary Summary
          </button>
          <button
            onClick={() => setActiveSubTab("profile")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 whitespace-nowrap ${
              activeSubTab === "profile"
                ? "bg-[#FF6200] text-white shadow-lg shadow-[#FF6200]/20"
                : "text-[#888898] hover:text-white hover:bg-[#252525]"
            }`}
          >
            My HR Profile
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SUBTAB 1: ATTENDANCE & PUNCH CLOCK */}
      {activeSubTab === "attendance" && (
        <div className="space-y-6">
          {/* Main Punch Clock Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Realtime Punch In / Out Action Banner */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-[#181818] via-[#141414] to-[#0D0D0D] border border-[#2E2E2E] space-y-6 relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#FF6200]/10 border border-[#FF6200]/30 text-[#FF6200]">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white">Daily Punch Clock</h2>
                    <p className="text-xs text-[#888898]">
                      {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-[#888898] block">Current Time</span>
                  <span className="text-lg font-mono font-black text-white">{currentTime.toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Live Hours Ticker Banner */}
              <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-[#888898] block">Today&apos;s Working Duration</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-mono font-black text-white">{formatLiveDuration()}</span>
                    <span className="text-xs font-mono text-[#FF8C42] font-bold">({calculateLiveHours()} hrs)</span>
                  </div>
                  <div className="text-[11px] text-[#888898] mt-1">
                    Daily target: 8.00 hrs &bull; Break deducted: {breakMinutes} mins
                  </div>
                </div>

                {/* Progress bar towards 8 hours */}
                <div className="sm:w-48 space-y-1.5">
                  <div className="flex justify-between text-[10px] text-[#888898] font-mono">
                    <span>8-Hour Benchmark</span>
                    <span>{Math.min(100, Math.round((parseFloat(calculateLiveHours()) / 8) * 100))}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#252525] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        parseFloat(calculateLiveHours()) >= 8
                          ? "bg-emerald-500"
                          : "bg-gradient-to-r from-[#FF6200] to-[#FF8C42]"
                      }`}
                      style={{
                        width: `${Math.min(100, (parseFloat(calculateLiveHours()) / 8) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Punch Controls */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#888898] mb-1 font-medium">Break Time (Minutes)</label>
                    <input
                      type="number"
                      min={0}
                      max={240}
                      value={breakMinutes}
                      onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF6200]"
                      placeholder="e.g. 45"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#888898] mb-1 font-medium">Daily Note / Shift Handover</label>
                    <input
                      type="text"
                      value={punchNote}
                      onChange={(e) => setPunchNote(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF6200]"
                      placeholder="e.g. Working on API portal & Bug fixes"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {!isPunchedIn && !isPunchedOut && (
                    <button
                      onClick={() => handlePunch("IN")}
                      disabled={loading}
                      className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Clock className="w-4 h-4" />
                      <span>{loading ? "Recording..." : "Punch In Now"}</span>
                    </button>
                  )}

                  {isPunchedIn && (
                    <button
                      onClick={() => handlePunch("OUT")}
                      disabled={loading}
                      className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Clock className="w-4 h-4" />
                      <span>{loading ? "Recording..." : "Punch Out (Complete Day)"}</span>
                    </button>
                  )}

                  {isPunchedOut && (
                    <div className="flex-1 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Day Complete! Punched out at {new Date(punchData.punchOut).toLocaleTimeString()} ({punchData.totalWorkingHours}h recorded)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User Profile & Monthly Overview Card */}
            <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-5 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center gap-3 border-b border-[#2E2E2E] pb-4">
                  {currentUser?.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-[#2E2E2E]"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(currentUser?.name)} flex items-center justify-center text-sm font-bold text-white uppercase border border-[#2E2E2E] shadow-sm flex-shrink-0`}
                    >
                      {getInitials(currentUser?.name)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-white text-sm">{currentUser.name}</h3>
                    <p className="text-xs text-[#888898]">{currentUser.jobTitle || "Employee"}</p>
                    <span className="text-[10px] font-mono text-[#FF8C42] uppercase">{currentUser.role?.replace("_", " ")}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 text-xs">
                  <div className="flex justify-between items-center text-[#888898]">
                    <span>Status</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      ACTIVE (HRMS)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#888898]">
                    <span>Monthly Days Present</span>
                    <span className="font-mono text-white font-bold">{monthlyStats?.presentDays || 0} Days</span>
                  </div>
                  <div className="flex justify-between items-center text-[#888898]">
                    <span>Total Hours Logged</span>
                    <span className="font-mono text-[#FF8C42] font-bold">{monthlyStats?.totalHours?.toFixed(1) || 0} hrs</span>
                  </div>
                  <div className="flex justify-between items-center text-[#888898]">
                    <span>Average Daily Hours</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {monthlyStats?.presentDays ? (monthlyStats.totalHours / monthlyStats.presentDays).toFixed(1) : 0} hrs/day
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2E2E2E]">
                <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#252525] hover:bg-[#303030] text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#2E2E2E]"
                >
                  <Plus className="w-3.5 h-3.5 text-[#FF6200]" />
                  <span>Apply for Leave</span>
                </button>
              </div>
            </div>
          </div>

          {/* Attendance Log Table */}
          <div className="rounded-3xl bg-[#141414] border border-[#2E2E2E] p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2E2E2E] pb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FF6200]" />
                  <span>Monthly Attendance Records</span>
                </h2>
                <p className="text-xs text-[#888898]">Complete record of daily punch times and calculated working hours</p>
              </div>

              {/* Month / Year Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6200]"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2026, i, 1).toLocaleString("default", { month: "long" })}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6200]"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#2E2E2E] text-[#888898] font-mono uppercase text-[10px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Punch In</th>
                    <th className="py-3 px-4">Punch Out</th>
                    <th className="py-3 px-4">Break (Mins)</th>
                    <th className="py-3 px-4">Total Working Hours</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E2E2E]/60 text-slate-200">
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#888898] italic">
                        No attendance records found for this month.
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map((rec) => {
                      const recDate = new Date(rec.date);
                      return (
                        <tr key={rec.id} className="hover:bg-[#1A1A1A] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            {recDate.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-400">
                            {rec.punchIn ? new Date(rec.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td className="py-3 px-4 font-mono text-rose-400">
                            {rec.punchOut ? new Date(rec.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td className="py-3 px-4 font-mono text-[#888898]">{rec.breakDurationMinutes || 0}m</td>
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            {rec.totalWorkingHours ? `${rec.totalWorkingHours.toFixed(2)}h` : "—"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                rec.status === "PRESENT" || rec.status === "FULL_DAY"
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                  : rec.status === "HALF_DAY"
                                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                                  : "bg-red-500/15 border-red-500/30 text-red-400"
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedRecord(rec)}
                              className="text-[11px] text-[#FF8C42] hover:underline font-semibold"
                            >
                              View Logs
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: LEAVE MANAGEMENT */}
      {activeSubTab === "leave" && (
        <div className="space-y-6">
          {/* Leave Balance Cards (Calculated dynamically from real database records) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E] space-y-1">
              <span className="text-[10px] text-[#888898] uppercase font-mono block">Casual Leave</span>
              <div className="text-xl font-bold font-mono text-emerald-400">{Math.max(0, 14 - approvedCasual)} / 14</div>
              <span className="text-[10px] text-[#888898]">{approvedCasual} days approved</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E] space-y-1">
              <span className="text-[10px] text-[#888898] uppercase font-mono block">Sick Leave</span>
              <div className="text-xl font-bold font-mono text-blue-400">{Math.max(0, 10 - approvedSick)} / 10</div>
              <span className="text-[10px] text-[#888898]">{approvedSick} days approved</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E] space-y-1">
              <span className="text-[10px] text-[#888898] uppercase font-mono block">Paid Time Off (PTO)</span>
              <div className="text-xl font-bold font-mono text-purple-400">{Math.max(0, 18 - approvedPaid)} / 18</div>
              <span className="text-[10px] text-[#888898]">{approvedPaid} days approved</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E] space-y-1">
              <span className="text-[10px] text-[#888898] uppercase font-mono block">Emergency Leave</span>
              <div className="text-xl font-bold font-mono text-amber-400">{Math.max(0, 5 - approvedEmergency)} / 5</div>
              <span className="text-[10px] text-[#888898]">{approvedEmergency} days approved</span>
            </div>
          </div>

          <div className="rounded-3xl bg-[#141414] border border-[#2E2E2E] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#FF6200]" />
                  <span>My Leave Applications</span>
                </h2>
                <p className="text-xs text-[#888898]">Track status of leave requests submitted to managers and HR</p>
              </div>

              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Apply for Leave</span>
              </button>
            </div>

            <div className="divide-y divide-[#2E2E2E]/60">
              {leaves.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#888898]">No leave applications recorded in database.</div>
              ) : (
                leaves.map((leave) => (
                  <div key={leave.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{leave.leaveType} LEAVE</span>
                        <span className="text-xs font-mono text-[#FF8C42]">({leave.daysCount} Days)</span>
                      </div>
                      <div className="text-xs text-[#888898] font-mono">
                        {new Date(leave.startDate).toLocaleDateString()} &rarr; {new Date(leave.endDate).toLocaleDateString()}
                      </div>
                      {leave.reason && <p className="text-xs text-slate-300 italic">&ldquo;{leave.reason}&rdquo;</p>}
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border uppercase font-mono ${
                          leave.status === "APPROVED"
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                            : leave.status === "REJECTED"
                            ? "bg-red-500/15 border-red-500/30 text-red-400"
                            : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                        }`}
                      >
                        {leave.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: TEAM DIRECTORY */}
      {activeSubTab === "directory" && (
        <div className="space-y-6">
          {/* Search Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#888898] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search colleagues by name, role, department..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-[#888898] focus:outline-none focus:border-[#FF6200]"
              />
            </div>
            <span className="text-xs text-[#888898]">{filteredEmployees.length} members found</span>
          </div>

          {/* Directory Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredEmployees.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-[#888898]">
                No colleagues matching your search.
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const name = emp.name || emp.user?.name || "Employee";
                const email = emp.email || emp.user?.email || "—";
                const role = emp.role || emp.user?.role || "MEMBER";
                const designation = emp.designation || emp.jobTitle || emp.user?.jobTitle || "Team Member";
                const department = emp.department || emp.user?.department || "General";
                const status = emp.status || "ACTIVE";
                const avatar = emp.avatarUrl || emp.user?.avatarUrl;

                return (
                  <div
                    key={emp.id || emp.userId}
                    className="p-5 rounded-2xl bg-[#141414] border border-[#2E2E2E] hover:border-[#FF6200]/40 transition-all space-y-3 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#FF6200]/30"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-tr ${getAvatarGradient(name)} flex items-center justify-center text-sm font-bold text-white uppercase border-2 border-[#FF6200]/30 flex-shrink-0`}
                        >
                          {getInitials(name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-white text-sm truncate">{name}</h3>
                        <p className="text-xs text-[#FF8C42] font-semibold truncate">{designation}</p>
                        <span className="text-[10px] text-[#888898]">{department}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#2E2E2E]/60 space-y-1.5 text-xs text-[#888898]">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-[#888898]" />
                        <span className="text-slate-300 truncate">{email}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-mono text-[#888898] uppercase">{role}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          {status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 4: COMPANY HOLIDAY CALENDAR */}
      {activeSubTab === "holidays" && (
        <div className="rounded-2xl bg-[#141414] border border-[#2E2E2E] overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2E2E2E] pb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#FF6200]" />
                <span>Official Organization Holidays & Calendar</span>
              </h2>
              <p className="text-xs text-[#888898] mt-0.5">Approved annual holiday roster for all company departments</p>
            </div>
            
            {(currentUser.role === "SUPER_ADMIN" || currentUser.role === "HR_ADMIN") && (
              <button
                onClick={() => setShowAddHolidayModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Holiday</span>
              </button>
            )}
          </div>

          {showAddHolidayModal && (
            <form onSubmit={handleCreateHoliday} className="p-4 rounded-xl bg-[#1A1A1A] border border-[#FF6200]/40 space-y-3">
              <div className="text-xs font-bold text-white">Add New Organization Holiday</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Holiday Name (e.g. Foundation Day)"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  className="bg-[#141414] border border-[#2E2E2E] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6200]"
                />
                <input
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="bg-[#141414] border border-[#2E2E2E] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6200]"
                />
                <select
                  value={newHolidayType}
                  onChange={(e) => setNewHolidayType(e.target.value)}
                  className="bg-[#141414] border border-[#2E2E2E] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6200]"
                >
                  <option value="National">National</option>
                  <option value="Gazetted">Gazetted</option>
                  <option value="Optional">Optional</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddHolidayModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#888898] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#FF6200] text-white text-xs font-bold hover:bg-[#FF8C42]"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          )}

          {loadingHolidays ? (
            <div className="py-12 text-center text-xs text-[#888898]">Loading holidays from database...</div>
          ) : holidays.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#888898] space-y-2">
              <Gift className="w-8 h-8 text-[#888898] mx-auto opacity-50" />
              <div>No organization holidays recorded in the database yet.</div>
              <p className="text-[11px] text-[#666]">HR Administrators can add official company holiday dates above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {holidays.map((h) => {
                const holidayDate = new Date(h.date);
                const isPast = holidayDate < new Date();
                const diffDays = Math.ceil((holidayDate.getTime() - Date.now()) / (1000 * 3600 * 24));

                return (
                  <div
                    key={h.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                      isPast
                        ? "bg-[#1A1A1A]/40 border-[#2E2E2E] opacity-60"
                        : "bg-[#1A1A1A] border-[#2E2E2E] hover:border-[#FF6200]/40"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{h.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#252525] text-[#888898]">
                          {h.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#888898] font-mono">
                        {h.date} ({h.day})
                      </div>
                    </div>

                    <div>
                      {isPast ? (
                        <span className="text-[10px] text-[#888898] italic">Passed</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-[#FF6200]/15 border border-[#FF6200]/30 text-[#FF8C42]">
                          {diffDays === 0 ? "Today!" : `In ${diffDays} days`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 5: PAYSLIP & SALARY PREVIEW (100% Dynamic from DB) */}
      {activeSubTab === "payslip" && (
        <div className="max-w-3xl mx-auto rounded-3xl bg-[#141414] border border-[#2E2E2E] p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-6">
            <div>
              <div className="text-xl font-black text-white">Domain Expansion Technologies</div>
              <div className="text-xs text-[#888898]">Salary & Attendance Summary for {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()}</div>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-[#252525] hover:bg-[#303030] text-xs font-bold text-white flex items-center gap-2 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs bg-[#1A1A1A] p-4 rounded-2xl border border-[#2E2E2E]">
            <div>
              <span className="text-[#888898] block">Employee Name:</span>
              <span className="text-white font-bold">{currentUser.name}</span>
            </div>
            <div>
              <span className="text-[#888898] block">Designation:</span>
              <span className="text-white font-bold">{currentUser.jobTitle || "Team Member"}</span>
            </div>
            <div>
              <span className="text-[#888898] block">Department:</span>
              <span className="text-white font-bold">{currentUser.department || "General"}</span>
            </div>
            <div>
              <span className="text-[#888898] block">Working Days Recorded:</span>
              <span className="text-white font-bold font-mono">{monthlyStats?.presentDays || 0} Days Present</span>
            </div>
          </div>

          {/* Database Attendance & Hours Overview */}
          <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-3 text-xs">
            <span className="text-xs font-extrabold text-white uppercase tracking-wider block">
              Database Time & Attendance Metrics
            </span>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#888898] block uppercase">Days Present</span>
                <span className="text-lg font-bold font-mono text-emerald-400">{monthlyStats?.presentDays || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#888898] block uppercase">Total Hours</span>
                <span className="text-lg font-bold font-mono text-[#FF8C42]">{monthlyStats?.totalHours?.toFixed(1) || 0}h</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#888898] block uppercase">Approved Leaves</span>
                <span className="text-lg font-bold font-mono text-blue-400">
                  {approvedCasual + approvedSick + approvedPaid + approvedEmergency} Days
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141414] border border-[#2E2E2E] text-xs text-[#888898] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#FF6200] flex-shrink-0" />
              <span>
                To configure formal monthly payout CTC, base wage brackets, and tax deductions, please consult your HR administrator.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedRecord && (
        <AttendanceDetailModal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          record={selectedRecord}
          dateStr={new Date(selectedRecord.date).toISOString().split("T")[0]}
          onRecordUpdated={fetchAttendance}
        />
      )}

      {isLeaveModalOpen && (
        <LeaveApplyModal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          onLeaveApplied={fetchLeaves}
        />
      )}
    </div>
  );
}
