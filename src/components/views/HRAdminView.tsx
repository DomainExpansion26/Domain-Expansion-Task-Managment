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
  UserX,
  Edit3,
  Plus,
  X,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { AttendanceDetailModal } from "@/components/modals/AttendanceDetailModal";
import { getInitials, getAvatarGradient } from "@/lib/utils";

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

  // Add Employee Modal
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [empName, setEmpName] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empPassword, setEmpPassword] = useState("");
  const [empJobTitle, setEmpJobTitle] = useState("");
  const [empDepartment, setEmpDepartment] = useState("");
  const [empStatus, setEmpStatus] = useState("ACTIVE");
  const [addError, setAddError] = useState<string | null>(null);

  const fetchHRData = async () => {
    setLoading(true);
    try {
      const [repRes, leaveRes, memberRes] = await Promise.all([
        fetch("/api/hrms/reports"),
        fetch("/api/hrms/leave?viewAll=true"),
        fetch("/api/hrms/employees"),
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

  const handleToggleEmployeeActivation = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PENDING_ACTIVATION" : "ACTIVE";
    setActionLoading(true);
    try {
      const res = await fetch(`/api/hrms/employees/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchHRData();
      }
    } catch (err) {
      console.error("Failed to toggle employee status:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empEmail.trim() || !empPassword) {
      setAddError("Name, email, and password are required.");
      return;
    }

    setActionLoading(true);
    setAddError(null);
    try {
      const res = await fetch("/api/hrms/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: empName.trim(),
          email: empEmail.trim(),
          password: empPassword,
          jobTitle: empJobTitle.trim() || "Employee",
          department: empDepartment.trim() || "General",
          status: empStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEmpName("");
        setEmpEmail("");
        setEmpPassword("");
        setEmpJobTitle("");
        setEmpDepartment("");
        setIsAddEmployeeOpen(false);
        fetchHRData();
      } else {
        setAddError(json.error?.message || "Failed to add employee");
      }
    } catch (err) {
      setAddError("Network error creating employee");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-2 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
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
            Approve leave requests, manage employee activation status, attendance corrections, and workforce records.
          </p>
        </div>

        <button
          onClick={() => setIsAddEmployeeOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:opacity-95 text-white font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add & Activate Employee</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E]">
          <span className="text-[10px] font-bold text-[#888898] uppercase">Total Active Employees</span>
          <div className="text-2xl font-black text-white mt-1">
            {members.filter((m) => m.hrmsStatus === "ACTIVE").length}
          </div>
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
              ? "bg-[#1A1A1A] border border-pink-500/50 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.15)]"
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
              ? "bg-[#1A1A1A] border border-pink-500/50 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.15)]"
              : "text-[#888898] hover:text-white"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Today&apos;s Attendance Logs</span>
        </button>

        <button
          onClick={() => setActiveTab("directory")}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === "directory"
              ? "bg-[#1A1A1A] border border-pink-500/50 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.15)]"
              : "text-[#888898] hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employee Directory & Activation ({members.length})</span>
        </button>
      </div>

      {/* TAB 1: LEAVE APPROVALS QUEUE */}
      {activeTab === "leaves" && (
        <div className="space-y-4">
          <div className="space-y-3">
            {pendingLeaves.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#141414] border border-[#2E2E2E] space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Pending Leave Requests</h3>
                <p className="text-xs text-[#888898]">All team leave applications have been reviewed.</p>
              </div>
            ) : (
              pendingLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="p-5 rounded-2xl bg-[#141414] border border-[#2E2E2E] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{leave.user?.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A1A1A] text-[#FF8C42] border border-[#2E2E2E]">
                        {leave.user?.department || "Team"}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                        {leave.leaveType} LEAVE
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">
                      <span className="text-[#888898]">Duration: </span>
                      <span className="font-semibold text-white">
                        {new Date(leave.startDate).toLocaleDateString()} &rarr; {new Date(leave.endDate).toLocaleDateString()} ({leave.daysCount} days)
                      </span>
                    </div>

                    <p className="text-xs text-[#888898] italic bg-[#1A1A1A] p-2 rounded-lg border border-[#2E2E2E]/60 max-w-xl">
                      &quot;{leave.reason}&quot;
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="Reviewer notes (optional)..."
                      value={approverComment}
                      onChange={(e) => setApproverComment(e.target.value)}
                      className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white placeholder-[#666] focus:outline-none focus:border-pink-500"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLeaveDecision(leave.id, "APPROVED")}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => handleLeaveDecision(leave.id, "REJECTED")}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE LOGS */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E] space-y-3">
            <h2 className="text-sm font-bold text-white">Daily Punch Logs</h2>
            {reports?.todayLogs?.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#888898]">No attendance punches recorded yet today.</div>
            ) : (
              reports?.todayLogs?.map((rec: any) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E]"
                >
                  <div className="flex items-center gap-3">
                    {rec.user?.avatarUrl ? (
                      <img
                        src={rec.user.avatarUrl}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getAvatarGradient(rec.user?.name)} flex items-center justify-center text-[10px] font-bold text-white uppercase flex-shrink-0`}
                      >
                        {getInitials(rec.user?.name)}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-white text-xs">{rec.user?.name}</div>
                      <div className="text-[11px] text-[#888898]">{rec.user?.department} &bull; {rec.user?.jobTitle}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
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
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        rec.status === "FULL_DAY"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : rec.status === "HALF_DAY"
                          ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-blue-500/15 text-blue-400"
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EMPLOYEE HR DIRECTORY & ACTIVATION (Requirement #8) */}
      {activeTab === "directory" && (
        <div className="rounded-2xl bg-[#141414] border border-[#2E2E2E] overflow-hidden">
          <div className="p-4 border-b border-[#2E2E2E] bg-[#1A1A1A] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Employee HR Directory & Activation Controls</h2>
              <p className="text-[11px] text-[#888898]">Activate or deactivate HRMS access for organization members</p>
            </div>
            <button
              onClick={() => setIsAddEmployeeOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2E2E2E] bg-[#1A1A1A] text-[#888898] text-[10px] uppercase font-bold">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Department & Designation</th>
                  <th className="py-3 px-4">HRMS Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E]/60 text-slate-300">
                {members.map((m) => {
                  const isActive = m.hrmsStatus === "ACTIVE" || m.hrmsStatus === "PROBATION";
                  return (
                    <tr key={m.id} className="hover:bg-[#1A1A1A]/40">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{m.name}</div>
                        <div className="text-[11px] text-[#888898]">{m.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">{m.employeeId || "N/A"}</td>
                      <td className="py-3 px-4">
                        <div className="text-white">{m.jobTitle}</div>
                        <div className="text-[10px] text-[#888898]">{m.department}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isActive
                              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                              : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                          }`}
                        >
                          {m.hrmsStatus || "PENDING"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleEmployeeActivation(m.id, m.hrmsStatus)}
                          disabled={actionLoading}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 ml-auto ${
                            isActive
                              ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {isActive ? (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span>Deactivate HRMS</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Activate HRMS</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Employee Modal (Requirement #8) */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-[#141414] border border-pink-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-pink-400" />
                <h3 className="text-sm font-bold text-white">Add & Activate HRMS Employee</h3>
              </div>
              <button onClick={() => setIsAddEmployeeOpen(false)} className="text-[#888898] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Employee Name"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="employee@domainexpansion.in"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 chars"
                  value={empPassword}
                  onChange={(e) => setEmpPassword(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#ACACB8] font-semibold mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Engineer"
                    value={empJobTitle}
                    onChange={(e) => setEmpJobTitle(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#ACACB8] font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering"
                    value={empDepartment}
                    onChange={(e) => setEmpDepartment(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">HRMS Initial Status</label>
                <select
                  value={empStatus}
                  onChange={(e) => setEmpStatus(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE (Can access HRMS immediately)</option>
                  <option value="PROBATION">PROBATION (Active)</option>
                  <option value="PENDING_ACTIVATION">PENDING_ACTIVATION (Access Blocked)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setIsAddEmployeeOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#888898] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold transition-all shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                >
                  {actionLoading ? "Saving..." : "Create Employee"}
                </button>
              </div>
            </form>
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
