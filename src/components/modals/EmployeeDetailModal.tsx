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
  DollarSign,
  Download,
  Upload,
} from "lucide-react";
import { formatDateTime, formatDate, getInitials, getAvatarGradient } from "@/lib/utils";

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
  const [activeTab, setActiveTab] = useState<"profile" | "attendance" | "leaves" | "documents" | "payroll">("profile");

  const [employeeData, setEmployeeData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit Form Fields
  const [editName, setEditName] = useState("");
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmergency, setEditEmergency] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editDob, setEditDob] = useState("");
  const [editJoiningDate, setEditJoiningDate] = useState("");

  // Payroll Edit Fields
  const [salaryBasic, setSalaryBasic] = useState<number>(0);
  const [salaryHra, setSalaryHra] = useState<number>(0);
  const [salaryAllowances, setSalaryAllowances] = useState<number>(0);
  const [salaryBonus, setSalaryBonus] = useState<number>(0);
  const [salaryDeductions, setSalaryDeductions] = useState<number>(0);
  const [savingSalary, setSavingSalary] = useState(false);

  // Leave approval response comment
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
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
        setEditEmployeeId(u.hrProfile?.employeeId || "");
        setEditJobTitle(u.jobTitle || u.hrProfile?.designation || "");
        setEditDepartment(u.department || u.hrProfile?.department || "");
        setEditPhone(u.hrProfile?.phone || "");
        setEditEmergency(u.hrProfile?.emergencyContact || "");
        setEditAddress(u.hrProfile?.address || "");
        setEditStatus(u.hrProfile?.status || (u.isActive ? "ACTIVE" : "INACTIVE"));
        setEditDob(u.hrProfile?.dateOfBirth ? new Date(u.hrProfile.dateOfBirth).toISOString().split("T")[0] : "");
        setEditJoiningDate(u.hrProfile?.joiningDate ? new Date(u.hrProfile.joiningDate).toISOString().split("T")[0] : "");

        if (json.data.salaryStructure) {
          const s = json.data.salaryStructure;
          setSalaryBasic(s.basic || 0);
          setSalaryHra(s.hra || 0);
          setSalaryAllowances(s.allowances || 0);
          setSalaryBonus(s.bonus || 0);
          setSalaryDeductions(s.deductions || 0);
        }
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/hrms/employees/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          employeeId: editEmployeeId || undefined,
          jobTitle: editJobTitle,
          designation: editJobTitle,
          department: editDepartment,
          phone: editPhone,
          emergencyContact: editEmergency,
          address: editAddress,
          status: editStatus,
          dateOfBirth: editDob || null,
          joiningDate: editJoiningDate || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("Employee profile updated successfully", "success");
        setIsEditing(false);
        fetchDetails();
        if (onEmployeeUpdated) onEmployeeUpdated();
      } else {
        showToast(json.error?.message || "Failed to update profile", "error");
      }
    } catch (err: any) {
      showToast("Network error updating profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSalary(true);
    try {
      const res = await fetch("/api/hrms/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          basic: salaryBasic,
          hra: salaryHra,
          allowances: salaryAllowances,
          bonus: salaryBonus,
          deductions: salaryDeductions,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Salary structure updated successfully", "success");
        fetchDetails();
      } else {
        showToast(json.error?.message || "Failed to update salary", "error");
      }
    } catch (err) {
      showToast("Error updating salary", "error");
    } finally {
      setSavingSalary(false);
    }
  };

  const u = employeeData?.user;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white border border-gray-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-gray-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                u?.name || "User"
              )} flex items-center justify-center text-sm font-black text-white uppercase shadow-md flex-shrink-0`}
            >
              {getInitials(u?.name || "U")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">
                  {u?.name || "Employee Profile"}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 border border-cyan-500/30">
                  {u?.hrProfile?.employeeId || "EMP-" + (userId.slice(0, 5).toUpperCase())}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    (u?.hrProfile?.status || (u?.isActive ? "ACTIVE" : "INACTIVE")) === "ACTIVE"
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-amber-500/15 text-amber-500"
                  }`}
                >
                  {u?.hrProfile?.status || (u?.isActive ? "ACTIVE" : "INACTIVE")}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {u?.jobTitle || "Employee"} • {u?.department || "General"} • {u?.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div
            className={`px-6 py-2 text-xs font-semibold text-white flex items-center gap-2 ${
              toastMsg.type === "success" ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            {toastMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex border-b border-gray-200 px-6 bg-white overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "profile"
                ? "border-cyan-500 text-cyan-600 "
                : "border-transparent text-gray-500  hover:text-gray-900 "
            }`}
          >
            👤 HR Profile
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "attendance"
                ? "border-cyan-500 text-cyan-600 "
                : "border-transparent text-gray-500  hover:text-gray-900 "
            }`}
          >
            ⏱️ Attendance Logs ({employeeData?.attendanceSummary?.recentLogs?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("leaves")}
            className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "leaves"
                ? "border-cyan-500 text-cyan-600 "
                : "border-transparent text-gray-500  hover:text-gray-900 "
            }`}
          >
            🏖️ Leave History ({employeeData?.leaves?.history?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "documents"
                ? "border-cyan-500 text-cyan-600 "
                : "border-transparent text-gray-500  hover:text-gray-900 "
            }`}
          >
            📁 Documents ({employeeData?.documents?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("payroll")}
            className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "payroll"
                ? "border-cyan-500 text-cyan-600 "
                : "border-transparent text-gray-500  hover:text-gray-900 "
            }`}
          >
            💰 Payroll & Salary Structure
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-xs text-gray-500">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading employee HR records...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: PROFILE */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Employee HR Information
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold hover:border-cyan-500 text-gray-700 hover:text-gray-900"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditing ? "Cancel Edit" : "Edit Profile"}</span>
                    </button>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-500 font-semibold mb-1">Full Name</label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-500 font-semibold mb-1">Employee ID</label>
                          <input
                            type="text"
                            value={editEmployeeId}
                            onChange={(e) => setEditEmployeeId(e.target.value)}
                            placeholder="e.g. EMP001"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-500 font-semibold mb-1">Designation / Job Title</label>
                          <input
                            type="text"
                            value={editJobTitle}
                            onChange={(e) => setEditJobTitle(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-500 font-semibold mb-1">Department</label>
                          <input
                            type="text"
                            value={editDepartment}
                            onChange={(e) => setEditDepartment(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-500 font-semibold mb-1">Phone Number</label>
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-500 font-semibold mb-1">Emergency Contact</label>
                          <input
                            type="text"
                            value={editEmergency}
                            onChange={(e) => setEditEmergency(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-500 font-semibold mb-1">Date of Birth</label>
                          <input
                            type="date"
                            value={editDob}
                            onChange={(e) => setEditDob(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-500 font-semibold mb-1">Joining Date</label>
                          <input
                            type="date"
                            value={editJoiningDate}
                            onChange={(e) => setEditJoiningDate(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-500 font-semibold mb-1">Employment Status</label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="ON_LEAVE">ON_LEAVE</option>
                            <option value="PROBATION">PROBATION</option>
                            <option value="INACTIVE">INACTIVE</option>
                            <option value="TERMINATED">TERMINATED</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-500 font-semibold mb-1">Residential Address</label>
                        <textarea
                          rows={2}
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md disabled:opacity-50"
                        >
                          {saving ? "Saving Changes..." : "Save Profile"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      {/* Personal Info Box */}
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                        <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-cyan-500" />
                          <span>Personal Details</span>
                        </h4>
                        <div className="space-y-2 text-gray-600">
                          <div className="flex justify-between">
                            <span>Date of Birth:</span>
                            <span className="font-semibold text-gray-900 font-mono">
                              {u?.hrProfile?.dateOfBirth ? formatDate(u.hrProfile.dateOfBirth) : "-"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Phone:</span>
                            <span className="font-semibold text-gray-900 font-mono">
                              {u?.hrProfile?.phone || "-"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Emergency Contact:</span>
                            <span className="font-semibold text-gray-900 font-mono">
                              {u?.hrProfile?.emergencyContact || "-"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Address:</span>
                            <span className="font-semibold text-gray-900 text-right max-w-[200px]">
                              {u?.hrProfile?.address || "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Employment Info Box */}
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                        <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-cyan-500" />
                          <span>Employment Information</span>
                        </h4>
                        <div className="space-y-2 text-gray-600">
                          <div className="flex justify-between">
                            <span>Department:</span>
                            <span className="font-semibold text-gray-900">
                              {u?.department || u?.hrProfile?.department || "General"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Designation:</span>
                            <span className="font-semibold text-gray-900">
                              {u?.jobTitle || u?.hrProfile?.designation || "Employee"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Joining Date:</span>
                            <span className="font-semibold text-gray-900 font-mono">
                              {u?.hrProfile?.joiningDate ? formatDate(u.hrProfile.joiningDate) : "-"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Manager:</span>
                            <span className="font-semibold text-gray-900">
                              {u?.manager?.name || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ATTENDANCE LOGS */}
              {activeTab === "attendance" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200">
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Present Days</div>
                      <div className="text-lg font-black text-emerald-500 mt-1">
                        {employeeData?.attendanceSummary?.presentDays || 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200">
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Half Days</div>
                      <div className="text-lg font-black text-amber-500 mt-1">
                        {employeeData?.attendanceSummary?.halfDays || 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200">
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Leave Days</div>
                      <div className="text-lg font-black text-purple-500 mt-1">
                        {employeeData?.attendanceSummary?.leaveDays || 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200">
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Total Hours</div>
                      <div className="text-lg font-black text-cyan-500 mt-1 font-mono">
                        {employeeData?.attendanceSummary?.totalWorkingHours || 0}h
                      </div>
                    </div>
                  </div>

                  {employeeData?.attendanceSummary?.recentLogs?.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-xs italic">
                      No attendance records found for this employee.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 font-bold text-[10px] uppercase">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Punch In</th>
                          <th className="py-2.5 px-3">Punch Out</th>
                          <th className="py-2.5 px-3">Hours</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {employeeData.attendanceSummary.recentLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 font-mono font-semibold">{formatDate(log.date)}</td>
                            <td className="py-2.5 px-3 font-mono text-gray-600">
                              {log.punchIn ? new Date(log.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-gray-600">
                              {log.punchOut ? new Date(log.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold">{log.totalWorkingHours || 0}h</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  log.status === "FULL_DAY" || log.status === "PRESENT"
                                    ? "bg-emerald-500/15 text-emerald-500"
                                    : log.status === "HALF_DAY"
                                    ? "bg-amber-500/15 text-amber-500"
                                    : "bg-purple-500/15 text-purple-500"
                                }`}
                              >
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 3: LEAVES */}
              {activeTab === "leaves" && (
                <div className="space-y-4">
                  {employeeData?.leaves?.history?.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-xs italic">
                      No leave records found for this employee.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 font-bold text-[10px] uppercase">
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Dates</th>
                          <th className="py-2.5 px-3">Days</th>
                          <th className="py-2.5 px-3">Reason</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {employeeData.leaves.history.map((l: any) => (
                          <tr key={l.id} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 font-bold">{l.leaveType}</td>
                            <td className="py-2.5 px-3 font-mono text-gray-600">
                              {formatDate(l.startDate)} - {formatDate(l.endDate)}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold">{l.daysCount}</td>
                            <td className="py-2.5 px-3 text-gray-600">{l.reason}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  l.status === "APPROVED"
                                    ? "bg-emerald-500/15 text-emerald-500"
                                    : l.status === "PENDING"
                                    ? "bg-amber-500/15 text-amber-500"
                                    : "bg-rose-500/15 text-rose-500"
                                }`}
                              >
                                {l.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 4: DOCUMENTS */}
              {activeTab === "documents" && (
                <div className="space-y-4">
                  {employeeData?.documents?.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-xs italic">
                      No documents available for this employee.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {employeeData.documents.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-cyan-500" />
                            <div>
                              <div className="font-bold text-gray-900">{doc.fileName}</div>
                              <div className="text-[10px] text-gray-400">
                                {(doc.fileSize / 1024).toFixed(1)} KB • Uploaded on {formatDate(doc.createdAt)}
                              </div>
                            </div>
                          </div>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: PAYROLL & SALARY */}
              {activeTab === "payroll" && (
                <form onSubmit={handleSaveSalary} className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Salary Structure & Compensation (INR)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-500 font-semibold mb-1">Basic Salary</label>
                      <input
                        type="number"
                        min="0"
                        value={salaryBasic}
                        onChange={(e) => setSalaryBasic(Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 font-semibold mb-1">House Rent Allowance (HRA)</label>
                      <input
                        type="number"
                        min="0"
                        value={salaryHra}
                        onChange={(e) => setSalaryHra(Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 font-semibold mb-1">Special Allowances</label>
                      <input
                        type="number"
                        min="0"
                        value={salaryAllowances}
                        onChange={(e) => setSalaryAllowances(Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 font-semibold mb-1">Bonus / Variable</label>
                      <input
                        type="number"
                        min="0"
                        value={salaryBonus}
                        onChange={(e) => setSalaryBonus(Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 font-semibold mb-1">Deductions (PF / Tax)</label>
                      <input
                        type="number"
                        min="0"
                        value={salaryDeductions}
                        onChange={(e) => setSalaryDeductions(Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col justify-center">
                      <div className="text-[10px] text-cyan-600 font-bold uppercase">Calculated Net Pay</div>
                      <div className="text-xl font-black text-cyan-600 font-mono">
                        ₹{(salaryBasic + salaryHra + salaryAllowances + salaryBonus - salaryDeductions).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingSalary}
                      className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md disabled:opacity-50"
                    >
                      {savingSalary ? "Saving..." : "Save Salary Structure"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
