"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Search,
  FileText,
  AlertCircle,
  UserCheck,
  Edit3,
} from "lucide-react";
import { AttendanceDetailModal } from "@/components/modals/AttendanceDetailModal";

interface HRAdminViewProps {
  currentUser: any;
}

export function HRAdminView({ currentUser }: HRAdminViewProps) {
  const [activeTab, setActiveTab] = useState<"leaves" | "attendance" | "directory">("leaves");
  const [reports, setReports] = useState<any | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [approverComment, setApproverComment] = useState("");
  const [selectedDayRecord, setSelectedDayRecord] = useState<{ record: any; dateStr: string } | null>(null);

  const fetchHRData = async () => {
    setLoading(true);
    try {
      const [repRes, leaveRes, memberRes] = await Promise.all([
        fetch("/api/hrms/reports"),
        fetch("/api/hrms/leave?viewAll=true"),
        fetch("/api/admin/members"),
      ]);

      const repJson = await repRes.json();
      const leaveJson = await leaveRes.json();
      const memberJson = await memberRes.json();

      if (repJson.success) setReports(repJson.data);
      if (leaveJson.success) {
        setAllLeaves(leaveJson.data);
        setPendingLeaves(leaveJson.data.filter((l: any) => l.status === "PENDING"));
      }
      if (memberJson.success) setMembers(memberJson.data);
    } catch (err) {
      console.error("Failed to load HR Admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  const handleLeaveDecision = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/hrms/leave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveId,
          status,
          approverComment: approverComment || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setApproverComment("");
        fetchHRData();
      }
    } catch (err) {
      console.error("Leave decision error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span>HR Administration</span>
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">HR Admin & Workforce Operations</h1>
          <p className="text-xs text-[#888898]">
            Approve leave requests, manage attendance corrections, employee records, and workforce analytics
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E]">
          <span className="text-[10px] font-bold text-[#888898] uppercase">Total Active Employees</span>
          <div className="text-2xl font-black text-white mt-1">{reports?.activeEmployees || members.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141414] border border-emerald-500/30">
          <span className="text-[10px] font-bold text-emerald-400 uppercase">Present Today</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{reports?.todayPresent || 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141414] border border-yellow-500/30">
          <span className="text-[10px] font-bold text-yellow-400 uppercase">Pending Leave Requests</span>
          <div className="text-2xl font-black text-yellow-400 mt-1">{pendingLeaves.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141414] border border-[#FF6200]/30">
          <span className="text-[10px] font-bold text-[#FF8C42] uppercase">Half-Days Logged</span>
          <div className="text-2xl font-black text-[#FF8C42] mt-1">{reports?.todayHalfDay || 0}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2E2E2E] pb-3 text-xs">
        <button
          onClick={() => setActiveTab("leaves")}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === "leaves"
              ? "bg-[#1A1A1A] border border-[#FF6200]/50 text-[#FF8C42]"
              : "text-[#888898] hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Leave Approvals Queue ({pendingLeaves.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === "attendance"
              ? "bg-[#1A1A1A] border border-[#FF6200]/50 text-[#FF8C42]"
              : "text-[#888898] hover:text-white"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Today's Attendance ({reports?.todayAttendance?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("directory")}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === "directory"
              ? "bg-[#1A1A1A] border border-[#FF6200]/50 text-[#FF8C42]"
              : "text-[#888898] hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employee HR Directory ({members.length})</span>
        </button>
      </div>

      {/* TAB 1: LEAVE APPROVALS QUEUE */}
      {activeTab === "leaves" && (
        <div className="rounded-2xl bg-[#141414] border border-[#2E2E2E] overflow-hidden space-y-4">
          <div className="p-4 border-b border-[#2E2E2E] bg-[#1A1A1A] flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Pending Employee Leave Requests</h2>
            <span className="text-xs text-[#888898]">{pendingLeaves.length} awaiting decision</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#888898]">Loading leave requests...</div>
          ) : pendingLeaves.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#888898]">
              No pending leave requests at this time. All caught up!
            </div>
          ) : (
            <div className="divide-y divide-[#2E2E2E]/60 text-xs">
              {pendingLeaves.map((leave) => (
                <div key={leave.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{leave.user?.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                        {leave.user?.department}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold">
                        {leave.leaveType} LEAVE ({leave.daysCount} days)
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed">{leave.reason}</p>

                    <div className="text-[11px] text-[#888898]">
                      Duration: {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLeaveDecision(leave.id, "APPROVED")}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => handleLeaveDecision(leave.id, "REJECTED")}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-red-600/20 border border-red-500/40 hover:bg-red-600/30 text-red-400 font-bold transition-all flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TODAY'S ATTENDANCE */}
      {activeTab === "attendance" && (
        <div className="rounded-2xl bg-[#141414] border border-[#2E2E2E] overflow-hidden">
          <div className="p-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
            <h2 className="text-sm font-bold text-white">Daily Punches & Attendance Live Feed</h2>
            <p className="text-xs text-[#888898]">Review daily work hours and apply corrections</p>
          </div>

          <div className="divide-y divide-[#2E2E2E]/60 text-xs">
            {reports?.todayAttendance?.length === 0 ? (
              <div className="py-12 text-center text-[#888898]">No attendance punches recorded for today yet.</div>
            ) : (
              reports?.todayAttendance?.map((rec: any) => (
                <div key={rec.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#1A1A1A]/40">
                  <div className="flex items-center gap-3">
                    <img
                      src={rec.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(rec.user?.name || "User")}`}
                      alt={rec.user?.name}
                      className="w-8 h-8 rounded-full border border-[#2E2E2E]"
                    />
                    <div>
                      <div className="font-bold text-white">{rec.user?.name}</div>
                      <div className="text-[11px] text-[#888898]">{rec.user?.department} • {rec.user?.jobTitle}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[11px]">
                    <div>
                      <span className="text-[#888898]">Punch In: </span>
                      <span className="text-white font-mono">{rec.punchIn ? new Date(rec.punchIn).toLocaleTimeString() : "—"}</span>
                    </div>
                    <div>
                      <span className="text-[#888898]">Punch Out: </span>
                      <span className="text-white font-mono">{rec.punchOut ? new Date(rec.punchOut).toLocaleTimeString() : "In Progress"}</span>
                    </div>
                    <div>
                      <span className="text-[#888898]">Total: </span>
                      <span className="text-[#FF8C42] font-bold font-mono">{rec.totalWorkingHours || 0}h</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rec.status === "FULL_DAY"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : rec.status === "HALF_DAY"
                          ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-blue-500/15 text-blue-400"
                      }`}
                    >
                      {rec.status}
                    </span>
                    <button
                      onClick={() => setSelectedDayRecord({ record: rec, dateStr: new Date().toISOString().slice(0, 10) })}
                      className="p-1.5 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#FF6200] text-[#888898] hover:text-white"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EMPLOYEE HR DIRECTORY */}
      {activeTab === "directory" && (
        <div className="rounded-2xl bg-[#141414] border border-[#2E2E2E] overflow-hidden">
          <div className="p-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
            <h2 className="text-sm font-bold text-white">Employee HR Directory & Birthdays</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2E2E2E] bg-[#1A1A1A] text-[#888898] text-[10px] uppercase font-bold">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4">HR Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E]/60 text-slate-300">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-[#1A1A1A]/40">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{m.name}</div>
                      <div className="text-[11px] text-[#888898]">{m.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">{m.employeeId || "EMP-1001"}</td>
                    <td className="py-3 px-4">{m.department} ({m.role})</td>
                    <td className="py-3 px-4">{new Date(m.joiningDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                        {m.hrmsStatus || "ACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          isHRAdmin={true}
          onRecordUpdated={fetchHRData}
        />
      )}
    </div>
  );
}
