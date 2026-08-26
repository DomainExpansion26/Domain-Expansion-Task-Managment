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
  Building2,
  Award,
  BookOpen,
  UserPlus,
  UserMinus,
  HelpCircle,
  BarChart3,
  Settings,
  Laptop,
  Radio,
  Send,
  Eye,
  Trash2,
  RefreshCw,
  ExternalLink,
  Shield,
  FileCheck,
  TrendingUp,
  Sliders,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AttendanceDetailModal } from "@/components/modals/AttendanceDetailModal";
import { LeaveApplyModal } from "@/components/modals/LeaveApplyModal";
import { EmployeeDetailModal } from "@/components/modals/EmployeeDetailModal";
import { formatDateTime, getInitials, getAvatarGradient } from "@/lib/utils";
import { isHRAdmin, isSuperAdmin, isManager, isTeamLead } from "@/lib/permissions";

interface HRMSViewProps {
  currentUser: any;
}

export function HRMSView({ currentUser }: HRMSViewProps) {
  const isHRorSuper = isHRAdmin(currentUser?.role) || isSuperAdmin(currentUser?.role);
  const isLeadOrManager = isManager(currentUser?.role) || isTeamLead(currentUser?.role);

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<
    | "dashboard"
    | "attendance"
    | "leaves"
    | "directory"
    | "organization"
    | "payroll"
    | "documents"
    | "performance"
    | "training"
    | "recruitment"
    | "assets"
    | "onboarding"
    | "offboarding"
    | "announcements"
    | "requests"
    | "reports"
    | "settings"
  >("dashboard");

  // Live Timer for Continuous Working Hours Ticker
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Attendance State
  const [punchData, setPunchData] = useState<any | null>(null);
  const [punchNote, setPunchNote] = useState("");
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [punchLoading, setPunchLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Leaves State
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Employees Directory State
  const [employees, setEmployees] = useState<any[]>([]);
  const [directorySearch, setDirectorySearch] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
  const [selectedEmployeeProfile, setSelectedEmployeeProfile] = useState<any | null>(null);

  // Organization State (Departments & Designations)
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDesigTitle, setNewDesigTitle] = useState("");
  const [newDesigDept, setNewDesigDept] = useState("Engineering");

  // Payroll & Payslips State
  const [payslips, setPayslips] = useState<any[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);
  const [salaryStructure, setSalaryStructure] = useState<any | null>(null);

  // Documents & Vault State
  const [documents, setDocuments] = useState<any[]>([]);
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docCategory, setDocCategory] = useState("RESUME");

  // Performance & Goals State
  const [reviews, setReviews] = useState<any[]>([]);
  const [selfReviewText, setSelfReviewText] = useState("");
  const [performanceRating, setPerformanceRating] = useState(5.0);

  // Training & Recruitment & Assets & Requests & Announcements State
  const [trainings, setTrainings] = useState<any[]>([]);
  const [recruitmentData, setRecruitmentData] = useState<{ openings: any[]; candidates: any[] }>({ openings: [], candidates: [] });
  const [assets, setAssets] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("");
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("");
  const [newAnnouncementPriority, setNewAnnouncementPriority] = useState("NORMAL");
  const [hrRequests, setHrRequests] = useState<any[]>([]);
  const [newReqType, setNewReqType] = useState("DOCUMENT_REQUEST");
  const [newReqSubject, setNewReqSubject] = useState("");
  const [newReqDesc, setNewReqDesc] = useState("");

  // Onboarding & Offboarding State
  const [onboardingChecklist, setOnboardingChecklist] = useState<any | null>(null);
  const [offboardingRecord, setOffboardingRecord] = useState<any | null>(null);
  const [resignationDate, setResignationDate] = useState("");
  const [exitReason, setExitReason] = useState("");

  // Notification Toast Message
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 1. Fetch Dashboard & Core Data
  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const res = await fetch("/api/hrms/dashboard");
      const json = await res.json();
      if (json.success && json.data) {
        setDashboardData(json.data);
        if (json.data.employeeDashboard?.todayPunch) {
          setPunchData(json.data.employeeDashboard.todayPunch);
          if (json.data.employeeDashboard.todayPunch.breakDurationMinutes) {
            setBreakMinutes(json.data.employeeDashboard.todayPunch.breakDurationMinutes);
          }
        }
      }
    } catch (err) {
      console.error("Dashboard load error", err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // 2. Fetch Attendance History
  const fetchAttendance = async () => {
    try {
      const [punchRes, attRes] = await Promise.all([
        fetch("/api/hrms/punch"),
        fetch(`/api/hrms/attendance?month=${selectedMonth}&year=${selectedYear}`),
      ]);
      const [punchJson, attJson] = await Promise.all([punchRes.json(), attRes.json()]);
      if (punchJson.success) setPunchData(punchJson.data);
      if (attJson.success) {
        setAttendanceRecords(attJson.data.attendances || []);
        setMonthlyStats(attJson.data.stats || null);
      }
    } catch (err) {
      console.error("Attendance fetch error", err);
    }
  };

  // 3. Fetch Leaves & Balances
  const fetchLeaves = async () => {
    try {
      const [leaveRes, balRes] = await Promise.all([
        fetch("/api/hrms/leave"),
        fetch("/api/hrms/leave/types"),
      ]);
      const [leaveJson, balJson] = await Promise.all([leaveRes.json(), balRes.json()]);
      if (leaveJson.success) setLeaves(leaveJson.data || []);
      if (balJson.success) setLeaveBalances(balJson.data || []);
    } catch (err) {
      console.error("Leaves fetch error", err);
    }
  };

  // 4. Fetch Employees
  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/hrms/employees");
      const json = await res.json();
      if (json.success) setEmployees(json.data || []);
    } catch (err) {
      console.error("Employees fetch error", err);
    }
  };

  // 5. Fetch Organization (Departments & Designations)
  const fetchOrg = async () => {
    try {
      const [deptRes, desigRes] = await Promise.all([
        fetch("/api/hrms/departments"),
        fetch("/api/hrms/designations"),
      ]);
      const [deptJson, desigJson] = await Promise.all([deptRes.json(), desigRes.json()]);
      if (deptJson.success) setDepartments(deptJson.data || []);
      if (desigJson.success) setDesignations(desigJson.data || []);
    } catch (err) {
      console.error("Org fetch error", err);
    }
  };

  // 6. Fetch Payroll & Payslips
  const fetchPayroll = async () => {
    try {
      const [payRes, slipRes] = await Promise.all([
        fetch("/api/hrms/payroll"),
        fetch("/api/hrms/payroll/payslips"),
      ]);
      const [payJson, slipJson] = await Promise.all([payRes.json(), slipRes.json()]);
      if (payJson.success) setSalaryStructure(payJson.data || null);
      if (slipJson.success) {
        setPayslips(slipJson.data || []);
        if (slipJson.data?.length > 0 && !selectedPayslip) {
          setSelectedPayslip(slipJson.data[0]);
        }
      }
    } catch (err) {
      console.error("Payroll fetch error", err);
    }
  };

  // 7. Fetch Documents
  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/hrms/documents");
      const json = await res.json();
      if (json.success) setDocuments(json.data || []);
    } catch (err) {
      console.error("Docs fetch error", err);
    }
  };

  // 8. Fetch Performance Reviews
  const fetchPerformance = async () => {
    try {
      const res = await fetch("/api/hrms/performance");
      const json = await res.json();
      if (json.success) setReviews(json.data || []);
    } catch (err) {
      console.error("Performance fetch error", err);
    }
  };

  // 9. Fetch Trainings, Recruitment, Assets, Announcements, Requests, Onboarding, Offboarding
  const fetchModularData = async () => {
    try {
      const [tRes, rRes, aRes, annRes, reqRes, onRes, offRes] = await Promise.all([
        fetch("/api/hrms/training"),
        fetch("/api/hrms/recruitment"),
        fetch("/api/hrms/assets"),
        fetch("/api/hrms/announcements"),
        fetch("/api/hrms/requests"),
        fetch("/api/hrms/onboarding"),
        fetch("/api/hrms/offboarding"),
      ]);
      const [tJson, rJson, aJson, annJson, reqJson, onJson, offJson] = await Promise.all([
        tRes.json(),
        rRes.json(),
        aRes.json(),
        annRes.json(),
        reqRes.json(),
        onRes.json(),
        offRes.json(),
      ]);

      if (tJson.success) setTrainings(tJson.data || []);
      if (rJson.success) setRecruitmentData(rJson.data || { openings: [], candidates: [] });
      if (aJson.success) setAssets(aJson.data || []);
      if (annJson.success) setAnnouncements(annJson.data || []);
      if (reqJson.success) setHrRequests(reqJson.data || []);
      if (onJson.success) setOnboardingChecklist(onJson.data || null);
      if (offJson.success) setOffboardingRecord(offJson.data || null);
    } catch (err) {
      console.error("Modular fetch error", err);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchDashboard();
    fetchAttendance();
    fetchLeaves();
    fetchEmployees();
    fetchOrg();
    fetchPayroll();
    fetchDocuments();
    fetchPerformance();
    fetchModularData();
  }, [selectedMonth, selectedYear]);

  // Handle Punch In / Punch Out Action
  const handlePunchAction = async (action: "PUNCH_IN" | "PUNCH_OUT") => {
    setPunchLoading(true);
    try {
      const res = await fetch("/api/hrms/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          breakMinutes: Number(breakMinutes) || 0,
          notes: punchNote || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPunchData(json.data);
        showToast(json.message || "Attendance recorded successfully");
        fetchDashboard();
        fetchAttendance();
      } else {
        showToast(json.error?.message || "Failed to record punch", "error");
      }
    } catch (err) {
      showToast("Network error executing punch", "error");
    } finally {
      setPunchLoading(false);
    }
  };

  // Handle Create Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptCode.trim()) return;
    try {
      const res = await fetch("/api/hrms/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDeptName, code: newDeptCode }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Department created successfully");
        setNewDeptName("");
        setNewDeptCode("");
        fetchOrg();
      } else {
        showToast(json.error?.message || "Failed to create department", "error");
      }
    } catch (err) {
      showToast("Network error creating department", "error");
    }
  };

  // Handle Create Designation
  const handleCreateDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesigTitle.trim()) return;
    try {
      const res = await fetch("/api/hrms/designations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newDesigTitle, department: newDesigDept }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Designation created successfully");
        setNewDesigTitle("");
        fetchOrg();
      } else {
        showToast(json.error?.message || "Failed to create designation", "error");
      }
    } catch (err) {
      showToast("Network error creating designation", "error");
    }
  };

  // Handle Upload Document
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docUrl.trim()) return;
    try {
      const res = await fetch("/api/hrms/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: docName, fileUrl: docUrl, docCategory }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Document uploaded to vault");
        setDocName("");
        setDocUrl("");
        fetchDocuments();
      } else {
        showToast(json.error?.message || "Failed to upload document", "error");
      }
    } catch (err) {
      showToast("Network error uploading document", "error");
    }
  };

  // Handle Submit HR Request
  const handleSubmitHRRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqSubject.trim() || !newReqDesc.trim()) return;
    try {
      const res = await fetch("/api/hrms/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType: newReqType, subject: newReqSubject, description: newReqDesc }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("HR Request submitted successfully");
        setNewReqSubject("");
        setNewReqDesc("");
        fetchModularData();
      } else {
        showToast(json.error?.message || "Failed to submit request", "error");
      }
    } catch (err) {
      showToast("Network error submitting request", "error");
    }
  };

  // Handle Publish Announcement
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementTitle.trim() || !newAnnouncementContent.trim()) return;
    try {
      const res = await fetch("/api/hrms/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAnnouncementTitle,
          content: newAnnouncementContent,
          priority: newAnnouncementPriority,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Announcement published company-wide");
        setNewAnnouncementTitle("");
        setNewAnnouncementContent("");
        fetchModularData();
      } else {
        showToast(json.error?.message || "Failed to publish announcement", "error");
      }
    } catch (err) {
      showToast("Network error publishing announcement", "error");
    }
  };

  // Navigation Items
  const hrmsNavItems = [
    { id: "dashboard", label: "Dashboard", icon: Flame },
    { id: "attendance", label: "Attendance & Punch", icon: Clock },
    { id: "leaves", label: "Leave Management", icon: Calendar },
    { id: "directory", label: "Employee Directory", icon: Users },
    { id: "organization", label: "Organization Structure", icon: Building2 },
    { id: "payroll", label: "Payroll & Payslips", icon: DollarSign },
    { id: "documents", label: "Documents & Vault", icon: FileText },
    { id: "performance", label: "Performance & Goals", icon: Award },
    { id: "training", label: "Training & Dev", icon: BookOpen },
    { id: "recruitment", label: "Recruitment", icon: UserPlus },
    { id: "assets", label: "Asset Management", icon: Laptop },
    { id: "onboarding", label: "Onboarding Checklist", icon: CheckCircle2 },
    { id: "offboarding", label: "Offboarding & Exit", icon: UserMinus },
    { id: "announcements", label: "Announcements & Feed", icon: Radio },
    { id: "requests", label: "HR Helpdesk Requests", icon: HelpCircle },
    { id: "reports", label: "HR Reports & Analytics", icon: BarChart3 },
    { id: "settings", label: "HRMS Settings & Policy", icon: Settings },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-[#F3F4F6]">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 text-xs font-semibold animate-fade-in ${
            toastMsg.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/15 border-red-500/30 text-red-400"
          }`}
        >
          {toastMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Main HRMS Command Center Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-[#141414] to-[#1A1A1A] border border-[#2E2E2E] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-[#FF6200] to-[#FF8C42] text-white shadow-lg shadow-[#FF6200]/25 flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">Enterprise HRMS Command Center</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF6200]/15 text-[#FF8C42] border border-[#FF6200]/30 font-mono text-[10px] font-bold uppercase">
                {currentUser?.role?.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-[#888898] mt-0.5">
              Role-based human resource management, live 8-hour attendance, leave workflows, payroll, lifecycle, and analytics
            </p>
          </div>
        </div>

        {/* Live Clock & Quick Action */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2 rounded-2xl bg-[#141414] border border-[#2E2E2E] flex items-center gap-2.5 text-xs font-mono">
            <Clock className="w-4 h-4 text-[#FF6200] animate-pulse" />
            <span className="text-white font-bold">{currentTime ? currentTime.toLocaleTimeString() : "--:--:--"}</span>
            <span className="text-[#888898] text-[10px] hidden sm:inline">
              | {currentTime ? currentTime.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "--"}
            </span>
          </div>

          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-[#FF6200]/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Apply Leave</span>
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Sub-Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#141414] border border-[#2E2E2E] overflow-x-auto no-scrollbar">
        {hrmsNavItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-[#FF6200] text-white shadow-md shadow-[#FF6200]/20 scale-105"
                  : "text-[#ACACB8] hover:text-white hover:bg-[#1A1A1A]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. DASHBOARD TAB (Executive Metrics + Employee Self-Service) */}
      {/* ========================================================================= */}
      {activeSubTab === "dashboard" && (
        <div className="space-y-6">
          {/* Executive Metrics for Super Admin & HR Admin */}
          {isHRorSuper && dashboardData?.adminMetrics && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#FF6200]" />
                  <span>Executive HR Overview & Real-Time Headcount</span>
                </h3>
                <span className="text-[10px] text-[#888898] font-mono">Real-Time Sync Active</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E]">
                  <span className="text-[10px] text-[#888898] uppercase font-mono block">Total Employees</span>
                  <span className="text-2xl font-black text-white mt-1 block font-mono">
                    {dashboardData.adminMetrics.totalEmployees}
                  </span>
                  <span className="text-[10px] text-emerald-400 mt-1 block">Active: {dashboardData.adminMetrics.activeEmployees}</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E]">
                  <span className="text-[10px] text-[#888898] uppercase font-mono block">Today Present</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block font-mono">
                    {dashboardData.adminMetrics.todayPresent}
                  </span>
                  <span className="text-[10px] text-[#888898] mt-1 block">Full: {dashboardData.adminMetrics.todayFullDay} | Half: {dashboardData.adminMetrics.todayHalfDay}</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E]">
                  <span className="text-[10px] text-[#888898] uppercase font-mono block">Today on Leave</span>
                  <span className="text-2xl font-black text-amber-400 mt-1 block font-mono">
                    {dashboardData.adminMetrics.todayOnLeave}
                  </span>
                  <span className="text-[10px] text-[#888898] mt-1 block">Approved Leaves</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E]">
                  <span className="text-[10px] text-[#888898] uppercase font-mono block">Late Arrivals</span>
                  <span className="text-2xl font-black text-purple-400 mt-1 block font-mono">
                    {dashboardData.adminMetrics.lateEmployeesCount}
                  </span>
                  <span className="text-[10px] text-[#888898] mt-1 block">After 9:30 AM</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E]">
                  <span className="text-[10px] text-[#888898] uppercase font-mono block">Pending Leaves</span>
                  <span className="text-2xl font-black text-[#FF8C42] mt-1 block font-mono">
                    {dashboardData.adminMetrics.pendingLeavesCount}
                  </span>
                  <span className="text-[10px] text-[#888898] mt-1 block">Action Required</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E]">
                  <span className="text-[10px] text-[#888898] uppercase font-mono block">HR Requests</span>
                  <span className="text-2xl font-black text-sky-400 mt-1 block font-mono">
                    {dashboardData.adminMetrics.pendingRequestsCount}
                  </span>
                  <span className="text-[10px] text-[#888898] mt-1 block">Tickets Open</span>
                </div>
              </div>
            </div>
          )}

          {/* Employee Self-Service Punch In / Out Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Punch & Working Hours Widget */}
            <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-5 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF6200]" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Today's Attendance & Working Hours (8-Hour Rule)
                  </h3>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                    punchData?.status === "FULL_DAY"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : punchData?.status === "HALF_DAY"
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      : punchData?.punchIn
                      ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                      : "bg-[#1A1A1A] text-[#888898] border-[#2E2E2E]"
                  }`}
                >
                  Status: {punchData?.status ? punchData.status.replace("_", " ") : "NOT RECORDED"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                  <span className="text-[10px] text-[#888898] uppercase font-mono block">Punch In Time</span>
                  <span className="text-lg font-bold text-white mt-1 block">
                    {punchData?.punchIn ? formatDateTime(punchData.punchIn) : "--:--"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                  <span className="text-[10px] text-[#888898] uppercase font-mono block">Punch Out Time</span>
                  <span className="text-lg font-bold text-white mt-1 block">
                    {punchData?.punchOut ? formatDateTime(punchData.punchOut) : "--:--"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                  <span className="text-[10px] text-[#888898] uppercase font-mono block">Logged Working Hours</span>
                  <span className="text-lg font-bold text-[#FF8C42] mt-1 block font-mono">
                    {punchData?.totalWorkingHours ? `${punchData.totalWorkingHours} hrs` : punchData?.punchIn ? "In Progress" : "0.0 hrs"}
                  </span>
                </div>
              </div>

              {/* Punch Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <div className="flex-1 flex items-center gap-2 bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl px-3.5 py-2.5">
                  <Coffee className="w-4 h-4 text-[#888898] flex-shrink-0" />
                  <input
                    type="number"
                    min="0"
                    placeholder="Break duration (mins)"
                    value={breakMinutes || ""}
                    onChange={(e) => setBreakMinutes(Number(e.target.value))}
                    className="bg-transparent text-xs text-white placeholder-[#666] focus:outline-none w-full"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePunchAction("PUNCH_IN")}
                    disabled={punchLoading || Boolean(punchData?.punchIn)}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      punchData?.punchIn
                        ? "bg-[#252525] text-[#666] cursor-not-allowed border border-[#2E2E2E]"
                        : "bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 text-white shadow-lg shadow-emerald-600/20"
                    }`}
                  >
                    {punchData?.punchIn ? "Punched In ✓" : "Punch In"}
                  </button>

                  <button
                    onClick={() => handlePunchAction("PUNCH_OUT")}
                    disabled={punchLoading || !punchData?.punchIn || Boolean(punchData?.punchOut)}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      punchData?.punchOut || !punchData?.punchIn
                        ? "bg-[#252525] text-[#666] cursor-not-allowed border border-[#2E2E2E]"
                        : "bg-gradient-to-r from-red-600 to-rose-500 hover:opacity-95 text-white shadow-lg shadow-red-600/20"
                    }`}
                  >
                    {punchData?.punchOut ? "Completed ✓" : "Punch Out"}
                  </button>
                </div>
              </div>
            </div>

            {/* Leave Balance Overview */}
            <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FF6200]" />
                <span>My Annual Leave Balance</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                  <span className="text-[#ACACB8]">Total Annual Allowance</span>
                  <span className="font-bold text-white font-mono">24 Days</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                  <span className="text-[#ACACB8]">Approved / Used</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {dashboardData?.employeeDashboard?.leaveBalances?.used || 0} Days
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                  <span className="text-[#ACACB8]">Pending Approval</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {dashboardData?.employeeDashboard?.leaveBalances?.pending || 0} Days
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                  <span className="text-[#ACACB8]">Remaining Available</span>
                  <span className="font-bold text-[#FF8C42] font-mono">
                    {dashboardData?.employeeDashboard?.leaveBalances?.remaining || 24} Days
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="w-full py-2.5 rounded-2xl bg-[#252525] hover:bg-[#FF6200] text-[#ACACB8] hover:text-white text-xs font-bold border border-[#2E2E2E] transition-all cursor-pointer"
              >
                Apply for Time Off
              </button>
            </div>
          </div>

          {/* Announcements & Birthdays & Upcoming Holidays Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Announcements */}
            <div className="p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#FF6200]" />
                <span>HR Announcements</span>
              </h3>
              <div className="space-y-2 text-xs">
                {announcements.slice(0, 3).map((a) => (
                  <div key={a.id} className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                    <div className="font-semibold text-white">{a.title}</div>
                    <div className="text-[11px] text-[#888898] line-clamp-2 mt-1">{a.content}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Holidays */}
            <div className="p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-400" />
                <span>Upcoming Holidays</span>
              </h3>
              <div className="space-y-2 text-xs">
                {dashboardData?.employeeDashboard?.upcomingHolidays?.map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                    <div>
                      <div className="font-semibold text-white">{h.name}</div>
                      <div className="text-[10px] text-[#888898]">{h.holidayType}</div>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {new Date(h.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Today Birthdays & Anniversaries */}
            <div className="p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cake className="w-4 h-4 text-pink-400" />
                <span>Celebrations Today</span>
              </h3>
              {dashboardData?.employeeDashboard?.todayBirthdays?.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] text-center text-xs text-[#888898]">
                  No birthdays today. Check back tomorrow!
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {dashboardData?.employeeDashboard?.todayBirthdays?.map((b: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 text-white font-bold flex items-center justify-center text-xs">
                        {getInitials(b.name)}
                      </div>
                      <div>
                        <div className="font-bold text-white">{b.name}</div>
                        <div className="text-[10px] text-pink-400">🎉 Happy Birthday!</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ATTENDANCE & PUNCH TAB (Monthly Logs, Overtime & Late Mark Tracker) */}
      {/* ========================================================================= */}
      {activeSubTab === "attendance" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E]">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#FF6200]" />
              <div>
                <h3 className="text-sm font-bold text-white">Monthly Attendance Ledger & 8-Hour Rule</h3>
                <p className="text-xs text-[#888898]">Review your punch-in logs, total logged hours, and half-day records</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>

          {/* Monthly Stats */}
          {monthlyStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#888898] uppercase font-mono">Present Days</span>
                <span className="text-xl font-bold text-emerald-400 mt-1 block font-mono">
                  {monthlyStats.presentDays} Days
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#888898] uppercase font-mono">Half Days</span>
                <span className="text-xl font-bold text-amber-400 mt-1 block font-mono">
                  {monthlyStats.halfDays} Days
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#888898] uppercase font-mono">Leave Days</span>
                <span className="text-xl font-bold text-purple-400 mt-1 block font-mono">
                  {monthlyStats.leaveDays} Days
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#888898] uppercase font-mono">Total Logged Hours</span>
                <span className="text-xl font-bold text-[#FF8C42] mt-1 block font-mono">
                  {monthlyStats.totalWorkingHours} hrs
                </span>
              </div>
            </div>
          )}

          {/* Attendance Table */}
          <div className="rounded-3xl bg-[#141414] border border-[#2E2E2E] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1A1A1A] border-b border-[#2E2E2E] text-[#888898] uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Punch In</th>
                  <th className="p-4">Punch Out</th>
                  <th className="p-4">Break (mins)</th>
                  <th className="p-4">Total Hours</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E]/60 text-white">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#888898] italic">
                      No attendance logs recorded for this month.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                      <td className="p-4 font-mono font-bold">{new Date(rec.date).toLocaleDateString()}</td>
                      <td className="p-4">{rec.punchIn ? formatDateTime(rec.punchIn) : "--:--"}</td>
                      <td className="p-4">{rec.punchOut ? formatDateTime(rec.punchOut) : "--:--"}</td>
                      <td className="p-4 font-mono">{rec.breakDurationMinutes || 0}</td>
                      <td className="p-4 font-mono font-bold text-[#FF8C42]">{rec.totalWorkingHours}h</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            rec.status === "FULL_DAY"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : rec.status === "HALF_DAY"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : rec.status === "LEAVE"
                              ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                              : "bg-[#252525] text-[#888898] border-[#2E2E2E]"
                          }`}
                        >
                          {rec.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedRecord(rec)}
                          className="px-2.5 py-1 rounded-lg bg-[#252525] hover:bg-[#FF6200] text-[#ACACB8] hover:text-white transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LEAVE MANAGEMENT TAB (Apply, Balance cards, History, Approvals) */}
      {/* ========================================================================= */}
      {activeSubTab === "leaves" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E]">
            <div>
              <h3 className="text-sm font-bold text-white">Leave Balances & Time-Off History</h3>
              <p className="text-xs text-[#888898]">Apply for casual, sick, earned, or emergency leaves and track approver responses</p>
            </div>
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] text-white text-xs font-bold shadow-md shadow-[#FF6200]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply Leave</span>
            </button>
          </div>

          {/* Dynamic Leave Types Balance Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {leaveBalances.map((lt) => (
              <div key={lt.id} className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E] space-y-1">
                <span className="text-[10px] text-[#888898] uppercase font-mono block">{lt.name}</span>
                <span className="text-xl font-bold text-white block font-mono">
                  {lt.remainingDays} / {lt.daysAllowed}
                </span>
                <span className="text-[10px] text-[#ACACB8] block">
                  Used: {lt.approvedDays}d | Pending: {lt.pendingDays}d
                </span>
              </div>
            ))}
          </div>

          {/* Leaves History Table */}
          <div className="rounded-3xl bg-[#141414] border border-[#2E2E2E] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1A1A1A] border-b border-[#2E2E2E] text-[#888898] uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-4">Type</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">End Date</th>
                  <th className="p-4">Days</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E]/60 text-white">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#888898] italic">
                      No leave applications recorded.
                    </td>
                  </tr>
                ) : (
                  leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                      <td className="p-4 font-bold text-[#FF8C42]">{l.leaveType}</td>
                      <td className="p-4 font-mono">{new Date(l.startDate).toLocaleDateString()}</td>
                      <td className="p-4 font-mono">{new Date(l.endDate).toLocaleDateString()}</td>
                      <td className="p-4 font-mono font-bold">{l.daysCount || 1} day(s)</td>
                      <td className="p-4 max-w-xs truncate">{l.reason}</td>
                      <td className="p-4">
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. EMPLOYEE DIRECTORY & PROFILE TAB */}
      {/* ========================================================================= */}
      {activeSubTab === "directory" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E]">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#FF6200]" />
              <div>
                <h3 className="text-sm font-bold text-white">Employee Directory ({employees.length})</h3>
                <p className="text-xs text-[#888898]">Search and browse organizational members and hierarchy</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, role..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-[#666] focus:outline-none w-56 sm:w-64"
                />
              </div>

              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Directory Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees
              .filter((emp) => {
                if (selectedDeptFilter !== "ALL" && emp.department !== selectedDeptFilter) return false;
                if (directorySearch) {
                  const s = directorySearch.toLowerCase();
                  return (
                    emp.name?.toLowerCase().includes(s) ||
                    emp.email?.toLowerCase().includes(s) ||
                    emp.jobTitle?.toLowerCase().includes(s) ||
                    emp.department?.toLowerCase().includes(s)
                  );
                }
                return true;
              })
              .map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployeeProfile(emp)}
                  className="p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E] hover:border-[#FF6200]/40 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
                >
                  <div className="flex items-start gap-3.5">
                    {emp.avatarUrl ? (
                      <img src={emp.avatarUrl} alt={emp.name} className="w-12 h-12 rounded-2xl object-cover" />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                          emp.name
                        )} flex items-center justify-center font-bold text-white text-base uppercase flex-shrink-0`}
                      >
                        {getInitials(emp.name)}
                      </div>
                    )}
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-white group-hover:text-[#FF8C42] transition-colors truncate">
                        {emp.name}
                      </div>
                      <div className="text-[11px] text-[#888898] truncate">{emp.email}</div>
                      <div className="text-[11px] text-[#ACACB8]">{emp.jobTitle || "Team Member"}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#2E2E2E]/60 text-[10px] text-[#888898]">
                    <span className="font-mono">{emp.department || "General"}</span>
                    <span className="font-mono text-emerald-400 font-bold">{emp.hrmsStatus || "ACTIVE"}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ORGANIZATION STRUCTURE (Departments & Designations & Hierarchy) */}
      {/* ========================================================================= */}
      {activeSubTab === "organization" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Departments */}
            <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-4">
              <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#FF6200]" />
                  <span>Departments ({departments.length})</span>
                </h3>
              </div>

              {isHRorSuper && (
                <form onSubmit={handleCreateDepartment} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Dept Name (e.g. Design)"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="flex-1 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white placeholder-[#666] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Code (DSG)"
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value)}
                    className="w-24 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white placeholder-[#666] focus:outline-none uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              )}

              <div className="space-y-2 text-xs">
                {departments.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                    <div>
                      <div className="font-bold text-white">{d.name}</div>
                      <div className="text-[10px] text-[#888898] font-mono">Code: {d.code}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#252525] text-[#FF8C42] font-mono text-[10px] font-bold">
                      {d.activeEmployees || 0} Members
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Designations */}
            <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-4">
              <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#FF6200]" />
                  <span>Designations ({designations.length})</span>
                </h3>
              </div>

              {isHRorSuper && (
                <form onSubmit={handleCreateDesignation} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Title (e.g. Lead QA)"
                    value={newDesigTitle}
                    onChange={(e) => setNewDesigTitle(e.target.value)}
                    className="flex-1 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white placeholder-[#666] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              )}

              <div className="space-y-2 text-xs max-h-96 overflow-y-auto pr-1">
                {designations.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                    <div>
                      <div className="font-bold text-white">{d.title}</div>
                      <div className="text-[10px] text-[#888898]">{d.department || "General"} &bull; {d.level}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#252525] text-white text-[10px] font-mono">
                      {d.activeEmployees || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PAYROLL & PAYSLIPS TAB */}
      {/* ========================================================================= */}
      {activeSubTab === "payroll" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E]">
            <div>
              <h3 className="text-sm font-bold text-white">Payroll & Itemized Payslips</h3>
              <p className="text-xs text-[#888898]">Secure employee earnings, tax deductions, and downloadable PDF payslips</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#252525] hover:bg-[#FF6200] text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Payslip</span>
            </button>
          </div>

          {selectedPayslip && (
            <div className="p-8 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-6 max-w-3xl mx-auto shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-4">
                <div>
                  <div className="text-lg font-black text-white">DOMAIN EXPANSION TECH</div>
                  <div className="text-[11px] text-[#888898]">Enterprise Salary Statement</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-[#FF8C42] font-mono">
                    Month: {selectedPayslip.month}/{selectedPayslip.year}
                  </div>
                  <div className="text-[10px] text-[#888898]">Status: GENERATED & VERIFIED</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                  <span className="text-[10px] text-[#888898] block">Employee</span>
                  <span className="font-bold text-white mt-0.5 block">{selectedPayslip.employeeName}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                  <span className="text-[10px] text-[#888898] block">ID</span>
                  <span className="font-bold text-white font-mono mt-0.5 block">{selectedPayslip.employeeId}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                  <span className="text-[10px] text-[#888898] block">Designation</span>
                  <span className="font-bold text-white mt-0.5 block">{selectedPayslip.designation}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                  <span className="text-[10px] text-[#888898] block">Department</span>
                  <span className="font-bold text-white mt-0.5 block">{selectedPayslip.department}</span>
                </div>
              </div>

              {/* Earnings vs Deductions Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Earnings */}
                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-2">
                  <span className="text-[10px] font-bold uppercase text-emerald-400 block border-b border-[#2E2E2E] pb-1.5">
                    Earnings Breakdown
                  </span>
                  {selectedPayslip.earningsBreakdown?.map((eb: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-[#ACACB8]">{eb.label}</span>
                      <span className="font-mono font-bold text-white">₹{eb.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-[#2E2E2E] font-bold">
                    <span className="text-white">Gross Total</span>
                    <span className="font-mono text-emerald-400">₹{selectedPayslip.grossSalary?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-2">
                  <span className="text-[10px] font-bold uppercase text-red-400 block border-b border-[#2E2E2E] pb-1.5">
                    Deductions Breakdown
                  </span>
                  {selectedPayslip.deductionsBreakdown?.map((db: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-[#ACACB8]">{db.label}</span>
                      <span className="font-mono font-bold text-white">₹{db.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-[#2E2E2E] font-bold">
                    <span className="text-white">Total Deductions</span>
                    <span className="font-mono text-red-400">₹{selectedPayslip.deductions?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FF6200]/20 to-[#FF8C42]/20 border border-[#FF6200]/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#FF8C42] uppercase font-mono block font-bold">Take-Home Net Salary</span>
                  <span className="text-2xl font-black text-white font-mono mt-0.5 block">
                    ₹{selectedPayslip.netSalary?.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-[#ACACB8]">Direct Bank Deposit</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. DOCUMENTS & VAULT TAB */}
      {/* ========================================================================= */}
      {activeSubTab === "documents" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E]">
            <div>
              <h3 className="text-sm font-bold text-white">Employee Document Vault & Verification</h3>
              <p className="text-xs text-[#888898]">Upload and maintain government IDs, certificates, resumes, and offer letters</p>
            </div>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleUploadDocument} className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Upload New Document</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <input
                type="text"
                required
                placeholder="Document Title (e.g. Aadhaar Card)"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none"
              />
              <input
                type="url"
                required
                placeholder="Secure File URL (https://...)"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none"
              />
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
              >
                <option value="RESUME">Resume</option>
                <option value="ID_CARD">Aadhaar / Passport ID</option>
                <option value="PAN">PAN Card</option>
                <option value="EDUCATION">Education Certificate</option>
                <option value="OFFER_LETTER">Offer Letter</option>
                <option value="EXPERIENCE">Experience Letter</option>
                <option value="OTHER">Other HR Document</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold cursor-pointer"
            >
              Upload Document
            </button>
          </form>

          {/* Documents List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((d) => (
              <div key={d.id} className="p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#FF6200]/15 text-[#FF8C42] border border-[#FF6200]/30">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white text-xs truncate">{d.fileName}</div>
                    <div className="text-[10px] text-[#888898]">{new Date(d.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#252525] hover:bg-[#FF6200] text-[#ACACB8] hover:text-white text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Document</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. PERFORMANCE & GOALS TAB */}
      {/* ========================================================================= */}
      {activeSubTab === "performance" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E]">
            <div>
              <h3 className="text-sm font-bold text-white">Performance Management & KPI Goals</h3>
              <p className="text-xs text-[#888898]">Quarterly reviews, manager feedback, and milestone progress</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Submit Self-Review */}
            <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-4 md:col-span-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Submit Quarterly Performance Self-Review</h4>
              <textarea
                rows={4}
                placeholder="Detail your major accomplishments, feature deliverables, goals met, and areas where you excelled..."
                value={selfReviewText}
                onChange={(e) => setSelfReviewText(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl p-4 text-xs text-white placeholder-[#666] focus:outline-none"
              />
              <button
                onClick={async () => {
                  if (!selfReviewText.trim()) return;
                  await fetch("/api/hrms/performance", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ selfReview: selfReviewText, period: "Q1 2026" }),
                  });
                  showToast("Self-review submitted to manager");
                  setSelfReviewText("");
                  fetchPerformance();
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] text-white text-xs font-bold cursor-pointer"
              >
                Submit Self-Review
              </button>
            </div>

            {/* Performance Rating Summary */}
            <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Average Rating</h4>
              <div className="text-center py-6">
                <span className="text-5xl font-black text-[#FF8C42] font-mono">4.9</span>
                <span className="text-xs text-[#888898] block mt-1">out of 5.0 (Exceptional)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. RECRUITMENT & CANDIDATE PIPELINE TAB */}
      {activeSubTab === "recruitment" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E]">
            <div>
              <h3 className="text-sm font-bold text-white">Recruitment & Candidate Pipeline</h3>
              <p className="text-xs text-[#888898]">Job openings, applicant screening, and interview scheduling</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recruitmentData.openings.map((job) => (
              <div key={job.id} className="p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-white text-sm">{job.title}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                    {job.status}
                  </span>
                </div>
                <div className="text-xs text-[#888898]">{job.department} &bull; {job.location}</div>
                <div className="text-[11px] text-[#ACACB8]">Openings: {job.openingsCount} &bull; Exp: {job.experienceRequired}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. ASSET MANAGEMENT TAB */}
      {activeSubTab === "assets" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E]">
            <div>
              <h3 className="text-sm font-bold text-white">Company Asset Management & Equipment Tracking</h3>
              <p className="text-xs text-[#888898]">Laptops, monitors, devices, and clearance status during offboarding</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((ast) => (
              <div key={ast.id} className="p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-3">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-white text-xs">{ast.name}</div>
                  <span className="px-2 py-0.5 rounded-full bg-[#FF6200]/15 text-[#FF8C42] text-[10px] font-mono font-bold">
                    {ast.assetTag}
                  </span>
                </div>
                <div className="text-xs text-[#888898]">{ast.type} &bull; Condition: {ast.condition}</div>
                <div className="text-[11px] text-emerald-400 font-semibold">Status: {ast.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. ANNOUNCEMENTS TAB */}
      {activeSubTab === "announcements" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E]">
            <div>
              <h3 className="text-sm font-bold text-white">Company Announcements & HR Feed</h3>
              <p className="text-xs text-[#888898]">Official broadcasts, holiday notices, and culture updates</p>
            </div>
          </div>

          {isHRorSuper && (
            <form onSubmit={handlePublishAnnouncement} className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Publish New Broadcast</h4>
              <input
                type="text"
                required
                placeholder="Announcement Title"
                value={newAnnouncementTitle}
                onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#666] focus:outline-none"
              />
              <textarea
                rows={3}
                required
                placeholder="Broadcast body content..."
                value={newAnnouncementContent}
                onChange={(e) => setNewAnnouncementContent(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-3.5 text-xs text-white placeholder-[#666] focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] text-white text-xs font-bold cursor-pointer"
              >
                Publish Broadcast
              </button>
            </form>
          )}

          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-2">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-white text-sm">{a.title}</div>
                  <span className="text-[10px] text-[#888898] font-mono">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-[#ACACB8] leading-relaxed">{a.content}</p>
                <div className="text-[10px] text-[#888898] pt-2 border-t border-[#2E2E2E]/40">
                  Posted by: {a.authorName || "HR Operations"} &bull; Target: {a.targetDepartment}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. HR HELPDESK REQUESTS TAB */}
      {activeSubTab === "requests" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E]">
            <div>
              <h3 className="text-sm font-bold text-white">HR Helpdesk & Employee Requests</h3>
              <p className="text-xs text-[#888898]">Request salary certificates, experience letters, profile updates, and queries</p>
            </div>
          </div>

          {/* Submit Request Form */}
          <form onSubmit={handleSubmitHRRequest} className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Create New Request Ticket</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <select
                value={newReqType}
                onChange={(e) => setNewReqType(e.target.value)}
                className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
              >
                <option value="DOCUMENT_REQUEST">Document Request</option>
                <option value="SALARY_CERTIFICATE">Salary Certificate Request</option>
                <option value="EXPERIENCE_LETTER">Experience Letter Request</option>
                <option value="PROFILE_UPDATE">Profile Update Request</option>
                <option value="HR_QUERY">General HR Query</option>
              </select>
              <input
                type="text"
                required
                placeholder="Subject (e.g. Need salary certificate for visa)"
                value={newReqSubject}
                onChange={(e) => setNewReqSubject(e.target.value)}
                className="sm:col-span-2 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none"
              />
            </div>
            <textarea
              rows={3}
              required
              placeholder="Detailed explanation of your request..."
              value={newReqDesc}
              onChange={(e) => setNewReqDesc(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-3.5 text-xs text-white placeholder-[#666] focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold cursor-pointer"
            >
              Submit Ticket
            </button>
          </form>

          {/* Tickets List */}
          <div className="space-y-3">
            {hrRequests.map((r) => (
              <div key={r.id} className="p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-[#FF8C42] font-bold block">{r.requestType}</span>
                    <h4 className="font-bold text-white text-xs mt-0.5">{r.subject}</h4>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      r.status === "RESOLVED"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : r.status === "REJECTED"
                        ? "bg-red-500/15 text-red-400 border-red-500/30"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-[#ACACB8]">{r.description}</p>
                {r.resolutionNotes && (
                  <div className="text-[11px] text-emerald-400 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mt-2">
                    Resolution Notes: {r.resolutionNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. ONBOARDING & OFFBOARDING TABS */}
      {activeSubTab === "onboarding" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E]">
            <div>
              <h3 className="text-sm font-bold text-white">Employee Onboarding Checklist</h3>
              <p className="text-xs text-[#888898]">Complete each milestone step to activate all workspace permissions</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-4">
            {[
              { key: "accountCreated", label: "1. Account Created & Credentials Issued", status: true },
              { key: "profileCompleted", label: "2. Personal & Professional Profile Completed", status: onboardingChecklist?.profileCompleted },
              { key: "departmentAssigned", label: "3. Department & Designation Assigned", status: onboardingChecklist?.departmentAssigned },
              { key: "managerAssigned", label: "4. Reporting Manager & Team Lead Configured", status: onboardingChecklist?.managerAssigned },
              { key: "projectAssigned", label: "5. Primary Project & Workspace Assigned", status: onboardingChecklist?.projectAssigned },
              { key: "documentsUploaded", label: "6. Essential Documents (ID & Resume) Uploaded", status: onboardingChecklist?.documentsUploaded },
              { key: "hrOrientation", label: "7. HR Orientation & Systems Overview Completed", status: onboardingChecklist?.hrOrientation },
              { key: "policyAcknowledged", label: "8. Company Code of Conduct & Policies Acknowledged", status: onboardingChecklist?.policyAcknowledged },
            ].map((step, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
                <span className="text-xs font-semibold text-white">{step.label}</span>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                    step.status
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {step.status ? "Completed ✓" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "offboarding" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E]">
            <div>
              <h3 className="text-sm font-bold text-white">Employee Offboarding & Exit Clearance</h3>
              <p className="text-xs text-[#888898]">Formal resignation tracking, exit interview, asset handover, and final clearance</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Submit Resignation / Exit Request</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#888898] mb-1.5 font-semibold">Last Working Day</label>
                <input
                  type="date"
                  value={resignationDate}
                  onChange={(e) => setResignationDate(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#888898] mb-1.5 font-semibold">Reason for Exit</label>
                <input
                  type="text"
                  placeholder="Career growth, higher education, relocation..."
                  value={exitReason}
                  onChange={(e) => setExitReason(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={async () => {
                if (!resignationDate) {
                  showToast("Please select your last working day", "error");
                  return;
                }
                await fetch("/api/hrms/offboarding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ lastWorkingDay: resignationDate, exitReason }),
                });
                showToast("Resignation submitted for manager & HR review");
                fetchModularData();
              }}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
            >
              Submit Exit Request
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 14. REPORTS TAB */}
      {activeSubTab === "reports" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E]">
            <div>
              <h3 className="text-sm font-bold text-white">HRMS Analytics & Headcount Reports</h3>
              <p className="text-xs text-[#888898]">Attendance rates, leave utilization trends, and department breakdowns</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-2">
              <span className="text-[10px] text-[#888898] uppercase font-mono">Monthly Attendance Compliance</span>
              <span className="text-3xl font-black text-emerald-400 font-mono block">94.8%</span>
              <span className="text-[11px] text-[#ACACB8] block">Above target benchmark of 90%</span>
            </div>

            <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-2">
              <span className="text-[10px] text-[#888898] uppercase font-mono">Average Working Hours / Day</span>
              <span className="text-3xl font-black text-[#FF8C42] font-mono block">8.2 hrs</span>
              <span className="text-[11px] text-[#ACACB8] block">Meets 8-Hour Daily Rule</span>
            </div>

            <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-2">
              <span className="text-[10px] text-[#888898] uppercase font-mono">Total Active Headcount</span>
              <span className="text-3xl font-black text-white font-mono block">{employees.length}</span>
              <span className="text-[11px] text-emerald-400 block">100% Retained</span>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedRecord && (
        <AttendanceDetailModal
          isOpen={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          record={selectedRecord}
          dateStr={new Date(selectedRecord.date).toISOString().split("T")[0]}
          isHRAdmin={isHRorSuper}
          onRecordUpdated={fetchAttendance}
        />
      )}

      {isLeaveModalOpen && (
        <LeaveApplyModal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          onLeaveApplied={() => {
            fetchLeaves();
            fetchDashboard();
          }}
        />
      )}

      {/* 360-Degree Employee Detail & Management Modal */}
      {selectedEmployeeProfile && (
        <EmployeeDetailModal
          isOpen={Boolean(selectedEmployeeProfile)}
          onClose={() => setSelectedEmployeeProfile(null)}
          userId={selectedEmployeeProfile.id}
          currentUser={currentUser}
          onEmployeeUpdated={() => {
            fetchEmployees();
            fetchDashboard();
          }}
        />
      )}
    </div>
  );
}
