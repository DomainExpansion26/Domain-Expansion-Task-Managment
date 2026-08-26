"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Clock,
  Calendar,
  FileText,
  Briefcase,
  Layers,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit3,
  Save,
  Phone,
  Mail,
  Building,
  Shield,
  ExternalLink,
  Plus,
  TrendingUp,
} from "lucide-react";
import { formatDateTime, getInitials, getAvatarGradient } from "@/lib/utils";

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onEmployeeUpdated?: () => void;
  currentUser: any;
}

export function EmployeeDetailModal({
  isOpen,
  onClose,
  userId,
  onEmployeeUpdated,
  currentUser,
}: EmployeeDetailModalProps) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "attendance" | "leaves" | "documents" | "projects" | "activity"
  >("profile");

  const [employeeData, setEmployeeData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit Form Fields
  const [editName, setEditName] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmergency, setEditEmergency] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");

  // Leave approval response comment
  const [leaveComment, setLeaveComment] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchDetails = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hrms/employees/${userId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setEmployeeData(json.data);
        const u = json.data.user;
        setEditName(u.name || "");
        setEditJobTitle(u.jobTitle || "");
        setEditDepartment(u.department || "");
        setEditPhone(u.hrProfile?.phone || "");
        setEditEmergency(u.hrProfile?.emergencyContact || "");
        setEditAddress(u.hrProfile?.address || "");
        setEditStatus(u.hrProfile?.status || (u.isActive ? "ACTIVE" : "INACTIVE"));
      }
    } catch (err) {
      console.error("Failed to load employee details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchDetails();
      setIsEditing(false);
      setActiveTab("profile");
    }
  }, [isOpen, userId]);

  if (!isOpen || !userId) return null;

  // Handle Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/hrms/employees/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          jobTitle: editJobTitle,
          department: editDepartment,
          phone: editPhone,
          emergencyContact: editEmergency,
          address: editAddress,
          status: editStatus,
          isActive: editStatus !== "TERMINATED" && editStatus !== "INACTIVE",
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Employee profile updated successfully");
        setIsEditing(false);
        fetchDetails();
        if (onEmployeeUpdated) onEmployeeUpdated();
      } else {
        alert(json.error?.message || "Failed to update profile");
      }
    } catch (err) {
      alert("Network error updating profile");
    } finally {
      setSaving(false);
    }
  };

  // Handle Leave Approval / Rejection
  const handleLeaveDecision = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/hrms/leave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, status, approverComment: leaveComment || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Leave request ${status.toLowerCase()} successfully`);
        setLeaveComment("");
        fetchDetails();
        if (onEmployeeUpdated) onEmployeeUpdated();
      } else {
        alert(json.error?.message || "Failed to update leave");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const user = employeeData?.user;
  const attSummary = employeeData?.attendanceSummary;
  const leaves = employeeData?.leaves;
  const docs = employeeData?.documents || [];
  const projects = employeeData?.projects || [];
  const tasks = employeeData?.tasks || [];
  const timeline = employeeData?.timeline || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in text-[#F3F4F6]">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#141414] border border-[#2E2E2E] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Toast Notification */}
        {toastMsg && (
          <div className="absolute top-4 right-16 z-50 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
          <div className="flex items-center gap-3 min-w-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-11 h-11 rounded-2xl object-cover" />
            ) : (
              <div
                className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                  user?.name || "Employee"
                )} flex items-center justify-center font-bold text-white text-sm uppercase flex-shrink-0`}
              >
                {getInitials(user?.name || "Employee")}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-white truncate">{user?.name || "Loading..."}</h2>
                <span className="px-2 py-0.5 rounded-full bg-[#FF6200]/15 text-[#FF8C42] border border-[#FF6200]/30 font-mono text-[10px] font-bold">
                  {user?.hrProfile?.employeeId || "EMP-ID"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    user?.hrProfile?.status === "ACTIVE" || user?.isActive
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-red-500/15 text-red-400 border-red-500/30"
                  }`}
                >
                  {user?.hrProfile?.status || (user?.isActive ? "ACTIVE" : "INACTIVE")}
                </span>
              </div>
              <p className="text-xs text-[#888898] truncate">
                {user?.jobTitle} &bull; {user?.department} &bull; {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#888898] hover:text-white hover:bg-[#252525] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-6 py-2 border-b border-[#2E2E2E] bg-[#141414] overflow-x-auto no-scrollbar">
          {[
            { id: "profile", label: "Profile & Overview", icon: User },
            { id: "attendance", label: "Attendance Ledger", icon: Clock },
            { id: "leaves", label: `Leaves (${leaves?.history?.length || 0})`, icon: Calendar },
            { id: "documents", label: `Documents (${docs.length})`, icon: FileText },
            { id: "projects", label: `Projects & Tasks (${projects.length}/${tasks.length})`, icon: Briefcase },
            { id: "activity", label: "Activity History", icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#FF6200] text-white shadow-md shadow-[#FF6200]/20 font-bold"
                    : "text-[#ACACB8] hover:text-white hover:bg-[#1A1A1A]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-6">
          {loading ? (
            <div className="p-12 text-center text-[#888898]">Loading 360° employee information...</div>
          ) : (
            <>
              {/* ========================================================= */}
              {/* TAB 1: PROFILE & OVERVIEW */}
              {/* ========================================================= */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  {/* Action Bar */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Employee HRMS Master Record
                    </h3>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#252525] hover:bg-[#FF6200] text-[#ACACB8] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Employee Details</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1.5 rounded-xl bg-[#1A1A1A] text-[#888898] hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{saving ? "Saving..." : "Save Changes"}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Personal Info */}
                      <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-3">
                        <span className="text-[10px] font-bold text-[#FF8C42] uppercase font-mono block">
                          Personal Information
                        </span>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-[#888898]">Full Name:</span>
                            <span className="font-bold text-white">{user?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#888898]">Email:</span>
                            <span className="text-white">{user?.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#888898]">Phone:</span>
                            <span className="text-white font-mono">{user?.hrProfile?.phone || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#888898]">Emergency Contact:</span>
                            <span className="text-white">{user?.hrProfile?.emergencyContact || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#888898]">Address:</span>
                            <span className="text-white">{user?.hrProfile?.address || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Professional Info */}
                      <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-3">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono block">
                          Professional & Account Details
                        </span>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-[#888898]">Employee ID:</span>
                            <span className="font-bold text-white font-mono">{user?.hrProfile?.employeeId || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#888898]">Designation:</span>
                            <span className="text-white">{user?.jobTitle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#888898]">Department:</span>
                            <span className="text-white font-mono">{user?.department}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#888898]">Reporting Manager:</span>
                            <span className="text-white">{user?.manager?.name || "Direct to CTO"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#888898]">Joining Date:</span>
                            <span className="text-white font-mono">
                              {new Date(user?.hrProfile?.joiningDate || user?.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#888898]">Account Status:</span>
                            <span className="font-bold text-emerald-400 font-mono">{user?.hrProfile?.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[#888898] mb-1 font-semibold">Full Name</label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#888898] mb-1 font-semibold">Designation</label>
                          <input
                            type="text"
                            required
                            value={editJobTitle}
                            onChange={(e) => setEditJobTitle(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#888898] mb-1 font-semibold">Department</label>
                          <input
                            type="text"
                            required
                            value={editDepartment}
                            onChange={(e) => setEditDepartment(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#888898] mb-1 font-semibold">Account Status</label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="PENDING_ACTIVATION">PENDING ACTIVATION</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                            <option value="RESIGNED">RESIGNED</option>
                            <option value="TERMINATED">TERMINATED</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[#888898] mb-1 font-semibold">Mobile Phone</label>
                          <input
                            type="text"
                            placeholder="+91 98765 43210"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#888898] mb-1 font-semibold">Emergency Contact</label>
                          <input
                            type="text"
                            placeholder="Family Name - +91 98765 00000"
                            value={editEmergency}
                            onChange={(e) => setEditEmergency(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                          />
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: ATTENDANCE LEDGER */}
              {/* ========================================================= */}
              {activeTab === "attendance" && (
                <div className="space-y-4">
                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                      <span className="text-[10px] text-[#888898] uppercase block">Present Days</span>
                      <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
                        {attSummary?.presentDays || 0}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                      <span className="text-[10px] text-[#888898] uppercase block">Half Days</span>
                      <span className="text-lg font-bold text-amber-400 font-mono mt-0.5 block">
                        {attSummary?.halfDays || 0}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                      <span className="text-[10px] text-[#888898] uppercase block">Leave Days</span>
                      <span className="text-lg font-bold text-purple-400 font-mono mt-0.5 block">
                        {attSummary?.leaveDays || 0}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                      <span className="text-[10px] text-[#888898] uppercase block">Late Marks</span>
                      <span className="text-lg font-bold text-pink-400 font-mono mt-0.5 block">
                        {attSummary?.lateArrivals || 0}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                      <span className="text-[10px] text-[#888898] uppercase block">Total Hours</span>
                      <span className="text-lg font-bold text-[#FF8C42] font-mono mt-0.5 block">
                        {attSummary?.totalWorkingHours || 0} hrs
                      </span>
                    </div>
                  </div>

                  {/* Attendance Records Table */}
                  <div className="rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#202020] text-[#888898] uppercase font-mono text-[10px]">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Punch In</th>
                          <th className="p-3">Punch Out</th>
                          <th className="p-3">Break</th>
                          <th className="p-3">Hours</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2E2E2E]/60 text-white">
                        {attSummary?.recentLogs?.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-[#888898] italic">
                              No attendance recorded yet for this employee.
                            </td>
                          </tr>
                        ) : (
                          attSummary?.recentLogs?.map((rec: any) => (
                            <tr key={rec.id} className="hover:bg-[#252525]/40">
                              <td className="p-3 font-mono font-bold">{new Date(rec.date).toLocaleDateString()}</td>
                              <td className="p-3">{rec.punchIn ? formatDateTime(rec.punchIn) : "--:--"}</td>
                              <td className="p-3">{rec.punchOut ? formatDateTime(rec.punchOut) : "--:--"}</td>
                              <td className="p-3 font-mono">{rec.breakDurationMinutes || 0}m</td>
                              <td className="p-3 font-mono font-bold text-[#FF8C42]">{rec.totalWorkingHours}h</td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    rec.status === "FULL_DAY"
                                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                      : rec.status === "HALF_DAY"
                                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                      : "bg-purple-500/15 text-purple-400 border-purple-500/30"
                                  }`}
                                >
                                  {rec.status.replace("_", " ")}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 3: LEAVES & APPROVALS */}
              {/* ========================================================= */}
              {activeTab === "leaves" && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {leaves?.history?.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] text-center text-[#888898] italic">
                        No leave applications from this employee.
                      </div>
                    ) : (
                      leaves?.history?.map((l: any) => (
                        <div
                          key={l.id}
                          className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-2 flex flex-col justify-between"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-bold text-white text-xs">{l.leaveType}</span>
                              <span className="text-[#888898] text-[11px] ml-2 font-mono">
                                {new Date(l.startDate).toLocaleDateString()} &rarr; {new Date(l.endDate).toLocaleDateString()} ({l.daysCount || 1} day(s))
                              </span>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                l.status === "APPROVED"
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : l.status === "REJECTED"
                                  ? "bg-red-500/15 text-red-400 border-red-500/30"
                                  : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              }`}
                            >
                              {l.status}
                            </span>
                          </div>

                          <p className="text-xs text-[#ACACB8]">{l.reason}</p>

                          {/* Action Buttons for Pending Requests */}
                          {l.status === "PENDING" && (
                            <div className="flex items-center gap-2 pt-2 border-t border-[#2E2E2E]">
                              <input
                                type="text"
                                placeholder="Approver comment..."
                                value={leaveComment}
                                onChange={(e) => setLeaveComment(e.target.value)}
                                className="flex-1 bg-[#141414] border border-[#2E2E2E] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                              />
                              <button
                                onClick={() => handleLeaveDecision(l.id, "APPROVED")}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleLeaveDecision(l.id, "REJECTED")}
                                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 4: DOCUMENTS */}
              {/* ========================================================= */}
              {activeTab === "documents" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {docs.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] text-center text-[#888898] col-span-full italic">
                        No documents uploaded for this employee.
                      </div>
                    ) : (
                      docs.map((d: any) => (
                        <div key={d.id} className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-5 h-5 text-[#FF6200] flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-bold text-white text-xs truncate">{d.fileName}</div>
                              <div className="text-[10px] text-[#888898]">{(d.fileSize / 1024).toFixed(1)} KB</div>
                            </div>
                          </div>
                          <a
                            href={d.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-[#252525] hover:bg-[#FF6200] text-[#ACACB8] hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 5: PROJECTS & TASKS */}
              {/* ========================================================= */}
              {activeTab === "projects" && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-[#FF8C42] uppercase font-mono block mb-2">
                      Assigned Projects ({projects.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {projects.length === 0 ? (
                        <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-[#888898] text-xs col-span-full italic">
                          No active projects assigned.
                        </div>
                      ) : (
                        projects.map((p: any) => (
                          <div key={p.id} className="p-3.5 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] flex justify-between items-center">
                            <span className="font-bold text-white text-xs">{p.name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold font-mono">
                              {p.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono block mb-2">
                      Recent Assigned Tasks ({tasks.length})
                    </span>
                    <div className="space-y-2">
                      {tasks.length === 0 ? (
                        <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-[#888898] text-xs italic">
                          No tasks assigned to this employee.
                        </div>
                      ) : (
                        tasks.map((t: any) => (
                          <div key={t.id} className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-white text-xs">{t.title}</div>
                              <div className="text-[10px] text-[#888898]">Priority: {t.priority}</div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-[#252525] text-[#ACACB8] text-[10px] font-mono font-bold">
                              {t.status.replace("_", " ")}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 6: ACTIVITY HISTORY */}
              {/* ========================================================= */}
              {activeTab === "activity" && (
                <div className="space-y-3">
                  {timeline.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] text-center text-[#888898] italic">
                      No lifecycle events or promotions recorded yet.
                    </div>
                  ) : (
                    timeline.map((event: any) => (
                      <div key={event.id} className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-[#FF6200]/15 text-[#FF8C42] border border-[#FF6200]/30 flex-shrink-0">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{event.title}</div>
                          <div className="text-[11px] text-[#888898] mt-0.5">{event.description}</div>
                          <div className="text-[10px] text-[#FF8C42] font-mono mt-1">
                            {new Date(event.effectiveDate || event.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
