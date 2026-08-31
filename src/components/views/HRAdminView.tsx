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
  Eye,
  EyeOff,
  Lock,
  DollarSign,
  Briefcase,
  Layers,
  Filter,
  CheckCircle2,
  Download,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { AttendanceDetailModal } from "@/components/modals/AttendanceDetailModal";
import { EmployeeDetailModal } from "@/components/modals/EmployeeDetailModal";
import { getInitials, getAvatarGradient, formatDate, formatDateTime } from "@/lib/utils";

interface HRAdminViewProps {
  currentUser: any;
}

export function HRAdminView({ currentUser }: HRAdminViewProps) {
  const [activeTab, setActiveTab] = useState<"directory" | "attendance" | "leaves" | "payroll" | "organization">("directory");
  const [employees, setEmployees] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [payrollList, setPayrollList] = useState<any[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Loading & Actions State
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [approverComment, setApproverComment] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Add Employee Modal State
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [empName, setEmpName] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empPassword, setEmpPassword] = useState("");
  const [empEmployeeId, setEmpEmployeeId] = useState("");
  const [empJobTitle, setEmpJobTitle] = useState("");
  const [empDepartment, setEmpDepartment] = useState("");
  const [empRole, setEmpRole] = useState("MEMBER");
  const [addError, setAddError] = useState<string | null>(null);

  // Generate Payslip Modal State
  const [isGeneratePayslipOpen, setIsGeneratePayslipOpen] = useState(false);
  const [payslipMonth, setPayslipMonth] = useState(new Date().getMonth() + 1);
  const [payslipYear, setPayslipYear] = useState(new Date().getFullYear());
  const [payslipSuccessMsg, setPayslipSuccessMsg] = useState<string | null>(null);

  // Add Department/Designation State
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDesigTitle, setNewDesigTitle] = useState("");

  const fetchHRData = async () => {
    setLoading(true);
    try {
      const [empRes, leaveRes, deptRes, desigRes, payRes, attRes] = await Promise.all([
        fetch("/api/hrms/employees"),
        fetch("/api/hrms/leave?viewAll=true"),
        fetch("/api/hrms/departments"),
        fetch("/api/hrms/designations"),
        fetch("/api/hrms/payroll"),
        fetch(`/api/hrms/attendance?viewAll=true&date=${attendanceDate}`),
      ]);

      const [empJson, leaveJson, deptJson, desigJson, payJson, attJson] = await Promise.all([
        empRes.json(),
        leaveRes.json(),
        deptRes.json(),
        desigRes.json(),
        payRes.json(),
        attRes.json(),
      ]);

      if (empJson.success) setEmployees(empJson.data || []);
      if (leaveJson.success) {
        setAllLeaves(leaveJson.data || []);
        setPendingLeaves((leaveJson.data || []).filter((l: any) => l.status === "PENDING"));
      }
      if (deptJson.success) setDepartments(deptJson.data || []);
      if (desigJson.success) setDesignations(desigJson.data || []);
      if (payJson.success) setPayrollList(payJson.data || []);
      if (attJson.success) setAttendanceRecords(attJson.data || []);
    } catch (err) {
      console.error("Failed to load HR Admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, [attendanceDate]);

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

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setActionLoading(true);
    try {
      const res = await fetch("/api/hrms/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: empName.trim(),
          email: empEmail.trim(),
          password: empPassword.trim(),
          employeeId: empEmployeeId.trim() || undefined,
          jobTitle: empJobTitle.trim() || undefined,
          department: empDepartment.trim() || undefined,
          role: empRole,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsAddEmployeeOpen(false);
        setEmpName("");
        setEmpEmail("");
        setEmpPassword("");
        setEmpEmployeeId("");
        setEmpJobTitle("");
        setEmpDepartment("");
        fetchHRData();
      } else {
        setAddError(json.error?.message || "Failed to create employee");
      }
    } catch (err: any) {
      setAddError("Network error creating employee");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGeneratePayslips = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/hrms/payroll/payslips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: payslipMonth,
          year: payslipYear,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPayslipSuccessMsg(`Payslips successfully generated for ${payslipMonth}/${payslipYear}`);
        setTimeout(() => {
          setIsGeneratePayslipOpen(false);
          setPayslipSuccessMsg(null);
        }, 1500);
      }
    } catch (err) {
      console.error("Generate payslips error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptCode.trim()) return;
    try {
      const res = await fetch("/api/hrms/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDeptName.trim(), code: newDeptCode.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setNewDeptName("");
        setNewDeptCode("");
        fetchHRData();
      }
    } catch (err) {
      console.error("Add department error:", err);
    }
  };

  const handleAddDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesigTitle.trim()) return;
    try {
      const res = await fetch("/api/hrms/designations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newDesigTitle.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setNewDesigTitle("");
        fetchHRData();
      }
    } catch (err) {
      console.error("Add designation error:", err);
    }
  };

  // Filtered Employees
  const filteredEmployees = employees.filter((emp) => {
    if (deptFilter !== "ALL" && (emp.department || emp.hrProfile?.department) !== deptFilter) return false;
    if (statusFilter !== "ALL") {
      const currentStatus = emp.hrProfile?.status || (emp.isActive ? "ACTIVE" : "INACTIVE");
      if (currentStatus !== statusFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (emp.name || "").toLowerCase().includes(q);
      const matchEmail = (emp.email || "").toLowerCase().includes(q);
      const matchId = (emp.hrProfile?.employeeId || "").toLowerCase().includes(q);
      const matchDept = (emp.department || emp.hrProfile?.department || "").toLowerCase().includes(q);
      const matchTitle = (emp.jobTitle || emp.hrProfile?.designation || "").toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchId && !matchDept && !matchTitle) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-gray-900 dark:text-[#F3F4F6]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-[#888898] mb-1 font-semibold uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>HRMS Workforce Administration</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            Human Resources Management Portal
          </h1>
          <p className="text-xs text-gray-500 dark:text-[#888898] mt-1">
            Manage real employee records, attendance monitoring, leave approvals, payroll, and organizational structures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAddEmployeeOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Employee</span>
          </button>

          <button
            onClick={fetchHRData}
            title="Refresh records"
            className="p-2.5 rounded-2xl border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-600 dark:text-[#ACACB8] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#141414] rounded-2xl px-4 overflow-x-auto shadow-sm text-xs font-bold">
        <button
          onClick={() => setActiveTab("directory")}
          className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "directory"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-gray-500 dark:text-[#888898] hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          👥 Employee Directory ({employees.length})
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "attendance"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-gray-500 dark:text-[#888898] hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          ⏱️ Attendance Monitoring ({attendanceRecords.length})
        </button>

        <button
          onClick={() => setActiveTab("leaves")}
          className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "leaves"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-gray-500 dark:text-[#888898] hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <span>🏖️ Leave Approvals</span>
          {pendingLeaves.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-mono text-[10px]">
              {pendingLeaves.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("payroll")}
          className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "payroll"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-gray-500 dark:text-[#888898] hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          💰 Payroll & Compensation
        </button>

        <button
          onClick={() => setActiveTab("organization")}
          className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "organization"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-gray-500 dark:text-[#888898] hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          🏢 Departments & Designations
        </button>
      </div>

      {/* TAB 1: EMPLOYEE DIRECTORY */}
      {activeTab === "directory" && (
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-3xl p-6 space-y-5 shadow-sm">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Employee ID, Name, Email, Department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl pl-9 pr-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-2 font-semibold text-gray-700 dark:text-[#ACACB8] focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">Department: All</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-2 font-semibold text-gray-700 dark:text-[#ACACB8] focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">Status: All</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="PROBATION">Probation</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Employees Table */}
          {filteredEmployees.length === 0 ? (
            <div className="py-20 text-center text-gray-400 dark:text-[#666] text-xs italic">
              No employees found matching the filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#2E2E2E] text-gray-500 dark:text-[#888898] font-bold text-[10px] uppercase tracking-wider bg-gray-50/50 dark:bg-[#181818]">
                    <th className="py-3 px-4">EMPLOYEE ID</th>
                    <th className="py-3 px-4">EMPLOYEE NAME</th>
                    <th className="py-3 px-3">DEPARTMENT</th>
                    <th className="py-3 px-3">DESIGNATION</th>
                    <th className="py-3 px-3">JOINING DATE</th>
                    <th className="py-3 px-3">STATUS</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#252525]">
                  {filteredEmployees.map((emp) => {
                    const empId = emp.hrProfile?.employeeId || "EMP-" + emp.id.slice(0, 5).toUpperCase();
                    const status = emp.hrProfile?.status || (emp.isActive ? "ACTIVE" : "INACTIVE");

                    return (
                      <tr
                        key={emp.id}
                        onClick={() => setSelectedEmployeeId(emp.id)}
                        className="hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          {empId}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                emp.name
                              )} flex items-center justify-center text-[10px] font-black text-white uppercase flex-shrink-0`}
                            >
                              {getInitials(emp.name)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                                {emp.name}
                              </div>
                              <div className="text-[10px] text-gray-400">{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-700 dark:text-[#D1D5DB]">
                          {emp.department || emp.hrProfile?.department || "General"}
                        </td>
                        <td className="py-3 px-3 text-gray-600 dark:text-[#ACACB8]">
                          {emp.jobTitle || emp.hrProfile?.designation || "Employee"}
                        </td>
                        <td className="py-3 px-3 font-mono text-gray-500 dark:text-[#888898]">
                          {emp.hrProfile?.joiningDate ? formatDate(emp.hrProfile.joiningDate) : "-"}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              status === "ACTIVE"
                                ? "bg-emerald-500/15 text-emerald-500"
                                : status === "ON_LEAVE"
                                ? "bg-purple-500/15 text-purple-500"
                                : "bg-amber-500/15 text-amber-500"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployeeId(emp.id);
                            }}
                            className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-[#252525] hover:bg-cyan-600 hover:text-white text-gray-700 dark:text-[#ACACB8] font-bold text-[11px] transition-colors"
                          >
                            Manage Profile
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ATTENDANCE MONITORING */}
      {activeTab === "attendance" && (
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-3xl p-6 space-y-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <label className="font-bold text-gray-500 dark:text-[#888898] uppercase tracking-wider text-[11px]">
                Date:
              </label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-1.5 font-mono text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="text-xs text-gray-500 dark:text-[#888898]">
              Total Records on {attendanceDate}: <span className="font-bold text-gray-900 dark:text-white">{attendanceRecords.length}</span>
            </div>
          </div>

          {attendanceRecords.length === 0 ? (
            <div className="py-20 text-center text-gray-400 dark:text-[#666] text-xs italic">
              No attendance records recorded on {attendanceDate}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#2E2E2E] text-gray-500 dark:text-[#888898] font-bold text-[10px] uppercase tracking-wider bg-gray-50/50 dark:bg-[#181818]">
                    <th className="py-3 px-4">EMPLOYEE</th>
                    <th className="py-3 px-3">DEPARTMENT</th>
                    <th className="py-3 px-3">PUNCH IN</th>
                    <th className="py-3 px-3">PUNCH OUT</th>
                    <th className="py-3 px-3">BREAK</th>
                    <th className="py-3 px-3">TOTAL HOURS</th>
                    <th className="py-3 px-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#252525]">
                  {attendanceRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-[#1A1A1A]">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 dark:text-white">{rec.user?.name || "Employee"}</div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {rec.user?.hrProfile?.employeeId || rec.user?.email}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-[#ACACB8]">
                        {rec.user?.department || "General"}
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-700 dark:text-[#D1D5DB]">
                        {rec.punchIn ? new Date(rec.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-700 dark:text-[#D1D5DB]">
                        {rec.punchOut ? new Date(rec.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-500">{rec.breakDurationMinutes || 0}m</td>
                      <td className="py-3 px-3 font-mono font-bold text-gray-900 dark:text-white">
                        {rec.totalWorkingHours || 0}h
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rec.status === "FULL_DAY" || rec.status === "PRESENT"
                              ? "bg-emerald-500/15 text-emerald-500"
                              : rec.status === "HALF_DAY"
                              ? "bg-amber-500/15 text-amber-500"
                              : "bg-purple-500/15 text-purple-500"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LEAVE APPROVALS */}
      {activeTab === "leaves" && (
        <div className="space-y-6">
          {/* Corporate Policy Specification Reference */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-cyan-50/60 via-white to-blue-50/40 dark:from-[#161616] dark:via-[#141414] dark:to-[#1A1A1A] border border-cyan-200/80 dark:border-[#2E2E2E] shadow-sm space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-100 dark:border-[#282828] pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Corporate Leave Policy: 24 Days / Year (2 Leaves Accrued Monthly on 1st)
                </h3>
              </div>
              <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                Dec Year-End Carry Forward Enabled
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#282828]">
                <strong className="text-cyan-600 dark:text-cyan-400 block">Casual/Sick (CL/SL): 12 Days</strong>
                <span className="text-gray-500 text-[10px]">1 day/month on 1st &bull; Carry forward active</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#282828]">
                <strong className="text-emerald-600 dark:text-emerald-400 block">Privilege (PL/EL): 12 Days</strong>
                <span className="text-gray-500 text-[10px]">1 day/month on 1st &bull; Carry forward active</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#282828]">
                <strong className="text-pink-600 dark:text-pink-400 block">Maternity: 26 Weeks (182d)</strong>
                <span className="text-gray-500 text-[10px]">Maternity Benefit Act 2017</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#282828]">
                <strong className="text-blue-600 dark:text-blue-400 block">Paternity: 10 Days Paid</strong>
                <span className="text-gray-500 text-[10px]">Company Paternity Policy</span>
              </div>
            </div>
          </div>

          {/* Pending Approvals Section */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-3xl p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Pending Leave Applications ({pendingLeaves.length})</span>
            </h2>

            {pendingLeaves.length === 0 ? (
              <div className="py-12 text-center text-gray-400 dark:text-[#666] text-xs italic">
                No pending leave applications requiring approval.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLeaves.map((l) => (
                  <div
                    key={l.id}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 dark:text-white text-sm">{l.user?.name}</span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-gray-200 dark:bg-[#252525] text-gray-600 dark:text-[#AAA]">
                          {l.user?.role}
                        </span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold">
                          {l.leaveType}
                        </span>
                        <span className="font-mono font-bold text-gray-500">{l.daysCount} Day(s)</span>
                        {["TEAM_LEAD", "MANAGER", "PROJECT_MANAGER", "HR_ADMIN"].includes(l.user?.role) && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            Requires Super Admin Approval
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500 font-mono text-[11px]">
                        Period: {formatDate(l.startDate)} - {formatDate(l.endDate)}
                      </div>
                      <div className="text-gray-700 dark:text-[#D1D5DB] italic">"{l.reason}"</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {["TEAM_LEAD", "MANAGER", "PROJECT_MANAGER", "HR_ADMIN"].includes(l.user?.role) && currentUser.role !== "SUPER_ADMIN" ? (
                        <span className="text-[11px] text-amber-500 italic">
                          Awaiting Super Admin Decision
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleLeaveDecision(l.id, "APPROVED")}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleLeaveDecision(l.id, "REJECTED")}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Complete Leave History */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-3xl p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              All Leave Records & History ({allLeaves.length})
            </h2>

            {allLeaves.length === 0 ? (
              <div className="py-12 text-center text-gray-400 dark:text-[#666] text-xs italic">
                No leave records found in database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-[#2E2E2E] text-gray-500 dark:text-[#888898] font-bold text-[10px] uppercase">
                      <th className="py-2.5 px-3">APPLICANT</th>
                      <th className="py-2.5 px-3">TYPE</th>
                      <th className="py-2.5 px-3">DATES</th>
                      <th className="py-2.5 px-3">DAYS</th>
                      <th className="py-2.5 px-3">REASON</th>
                      <th className="py-2.5 px-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#252525]">
                    {allLeaves.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-[#1A1A1A]">
                        <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">{l.user?.name}</td>
                        <td className="py-2.5 px-3 font-semibold">{l.leaveType}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-600 dark:text-[#ACACB8]">
                          {formatDate(l.startDate)} - {formatDate(l.endDate)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">{l.daysCount}</td>
                        <td className="py-2.5 px-3 text-gray-600 dark:text-[#ACACB8]">{l.reason}</td>
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PAYROLL */}
      {activeTab === "payroll" && (
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Employee Compensation & Payroll Management
              </h2>
              <p className="text-xs text-gray-500 dark:text-[#888898]">
                Configure individual salary structures and generate monthly employee payslips.
              </p>
            </div>

            <button
              onClick={() => setIsGeneratePayslipOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>+ Generate Monthly Payslips</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2E2E2E] text-gray-500 dark:text-[#888898] font-bold text-[10px] uppercase bg-gray-50/50 dark:bg-[#181818]">
                  <th className="py-3 px-4">EMPLOYEE</th>
                  <th className="py-3 px-3">BASIC (₹)</th>
                  <th className="py-3 px-3">HRA (₹)</th>
                  <th className="py-3 px-3">ALLOWANCES (₹)</th>
                  <th className="py-3 px-3">DEDUCTIONS (₹)</th>
                  <th className="py-3 px-3">NET SALARY (₹)</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#252525]">
                {employees.map((emp) => {
                  const s = payrollList.find((p) => p.userId === emp.id);

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-[#1A1A1A]">
                      <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                        {emp.name}
                        <div className="text-[10px] text-gray-400 font-mono">
                          {emp.hrProfile?.employeeId || emp.email}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono">{s ? `₹${(s.basic || 0).toLocaleString()}` : "-"}</td>
                      <td className="py-3 px-3 font-mono">{s ? `₹${(s.hra || 0).toLocaleString()}` : "-"}</td>
                      <td className="py-3 px-3 font-mono">{s ? `₹${(s.allowances || 0).toLocaleString()}` : "-"}</td>
                      <td className="py-3 px-3 font-mono text-rose-500">{s ? `₹${(s.deductions || 0).toLocaleString()}` : "-"}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-500">
                        {s ? `₹${(s.netSalary || 0).toLocaleString()}` : "Not Configured"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEmployeeId(emp.id)}
                          className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-[#252525] hover:bg-cyan-600 hover:text-white text-gray-700 dark:text-[#ACACB8] font-bold text-[11px]"
                        >
                          Configure Salary
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

      {/* TAB 5: ORGANIZATION */}
      {activeTab === "organization" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Departments Box */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-3xl p-6 space-y-4 shadow-sm text-xs">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Departments ({departments.length})
            </h2>

            <form onSubmit={handleAddDepartment} className="flex gap-2">
              <input
                type="text"
                placeholder="Name (e.g. Finance)"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="flex-1 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="Code (e.g. FIN)"
                value={newDeptCode}
                onChange={(e) => setNewDeptCode(e.target.value)}
                className="w-24 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none uppercase font-mono"
              />
              <button type="submit" className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white font-bold">
                Add
              </button>
            </form>

            <div className="space-y-2">
              {departments.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E]">
                  <span className="font-bold text-gray-900 dark:text-white">{d.name}</span>
                  <span className="font-mono text-gray-400 font-bold">{d.code}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Designations Box */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-3xl p-6 space-y-4 shadow-sm text-xs">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Designations ({designations.length})
            </h2>

            <form onSubmit={handleAddDesignation} className="flex gap-2">
              <input
                type="text"
                placeholder="Title (e.g. Senior Frontend Engineer)"
                value={newDesigTitle}
                onChange={(e) => setNewDesigTitle(e.target.value)}
                className="flex-1 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none"
              />
              <button type="submit" className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white font-bold">
                Add
              </button>
            </form>

            <div className="space-y-2">
              {designations.map((des) => (
                <div key={des.id} className="p-3 rounded-2xl bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E]">
                  <span className="font-bold text-gray-900 dark:text-white">{des.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleAddEmployee}
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Add New Employee</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddEmployeeOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs">
                {addError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 dark:text-[#888898] font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 dark:text-[#888898] font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 dark:text-[#888898] font-semibold mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 characters"
                  value={empPassword}
                  onChange={(e) => setEmpPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 dark:text-[#888898] font-semibold mb-1">Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g. EMP004"
                  value={empEmployeeId}
                  onChange={(e) => setEmpEmployeeId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 dark:text-[#888898] font-semibold mb-1">Designation</label>
                <input
                  type="text"
                  placeholder="Software Engineer"
                  value={empJobTitle}
                  onChange={(e) => setEmpJobTitle(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 dark:text-[#888898] font-semibold mb-1">Department</label>
                <input
                  type="text"
                  placeholder="Engineering"
                  value={empDepartment}
                  onChange={(e) => setEmpDepartment(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddEmployeeOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md disabled:opacity-50"
              >
                {actionLoading ? "Creating..." : "Create Employee"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GENERATE PAYSLIPS MODAL */}
      {isGeneratePayslipOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleGeneratePayslips}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Generate Monthly Payslips</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsGeneratePayslipOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {payslipSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs">
                {payslipSuccessMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-gray-500 dark:text-[#888898] font-semibold mb-1">Month (1 - 12)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  required
                  value={payslipMonth}
                  onChange={(e) => setPayslipMonth(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-2 text-gray-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-500 dark:text-[#888898] font-semibold mb-1">Year</label>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  required
                  value={payslipYear}
                  onChange={(e) => setPayslipYear(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-2 text-gray-900 dark:text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsGeneratePayslipOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md disabled:opacity-50"
              >
                {actionLoading ? "Generating..." : "Generate For All"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manage Employee Modal */}
      {selectedEmployeeId && (
        <EmployeeDetailModal
          isOpen={Boolean(selectedEmployeeId)}
          onClose={() => setSelectedEmployeeId(null)}
          userId={selectedEmployeeId}
          onEmployeeUpdated={fetchHRData}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
