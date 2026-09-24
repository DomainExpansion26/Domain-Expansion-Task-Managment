"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  Calendar,
  Coffee,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Plus,
  Users,
  Search,
  DollarSign,
  Download,
  Printer,
  Building,
  Mail,
  Phone,
  Briefcase,
  Layers,
  Check,
  Building2,
  Award,
  BookOpen,
  HelpCircle,
  BarChart3,
  Settings,
  Send,
  Eye,
  Trash2,
  RefreshCw,
  ExternalLink,
  Shield,
  FileCheck,
  TrendingUp,
  Edit3,
  X,
  Upload,
  Cake,
  PartyPopper,
  Megaphone,
  Sparkles,
  Heart,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AttendanceDetailModal } from "@/components/modals/AttendanceDetailModal";
import { LeaveApplyModal } from "@/components/modals/LeaveApplyModal";
import { isTeamLead, isManager, isHRAdmin, isSuperAdmin } from "@/lib/permissions";
import { formatDateTime, formatDate, getInitials, getAvatarGradient } from "@/lib/utils";

interface HRMSViewProps {
  currentUser: any;
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export function HRMSView({ currentUser, currentTab = "overview", onSelectTab }: HRMSViewProps) {
  // Map 'overview' from sidebar to internal 'dashboard'
  const normalizedTab = currentTab === "overview" ? "dashboard" : currentTab;

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "profile" | "attendance" | "leaves" | "documents" | "payroll" | "directory" | "requests"
  >(
    (normalizedTab as any) || "dashboard"
  );

  // Auto-sync when parent currentTab changes (from left sidebar clicks)
  useEffect(() => {
    const target = (currentTab === "overview" ? "dashboard" : currentTab) as any;
    if (target && target !== activeTab) {
      setActiveTab(target);
    }
  }, [currentTab]);

  // Ref to the active tab button to auto-scroll into view smoothly
  const activeTabRef = useRef<HTMLButtonElement | null>(null);
  const tabContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeTab]);

  const handleTabChange = (tab: "dashboard" | "profile" | "attendance" | "leaves" | "documents" | "payroll" | "directory" | "requests") => {
    setActiveTab(tab);
    if (onSelectTab) {
      onSelectTab(tab === "dashboard" ? "overview" : tab);
    }
  };

  // Live Timer for Working Hours
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Profile State
  const [profileData, setProfileData] = useState<any | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editEmergency, setEditEmergency] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Attendance State
  const [punchData, setPunchData] = useState<any | null>(null);
  const [punchNote, setPunchNote] = useState("");
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [punchLoading, setPunchLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState<any | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Leaves State
  const [leaves, setLeaves] = useState<any[]>([]);
  const [teamPendingLeaves, setTeamPendingLeaves] = useState<any[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [showOtherLeaves, setShowOtherLeaves] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [actionLeaveLoading, setActionLeaveLoading] = useState(false);

  // Documents State
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docCategory, setDocCategory] = useState("IDENTITY");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Payroll & Payslips State
  const [salaryStructure, setSalaryStructure] = useState<any | null>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  // Directory State
  const [directoryEmployees, setDirectoryEmployees] = useState<any[]>([]);
  const [dirSearch, setDirSearch] = useState("");
  const [dirDept, setDirDept] = useState("ALL");

  // HR Requests State
  const [hrRequests, setHrRequests] = useState<any[]>([]);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [reqType, setReqType] = useState("PROFILE_UPDATE");
  const [reqSubject, setReqSubject] = useState("");
  const [reqDesc, setReqDesc] = useState("");
  const [submittingReq, setSubmittingReq] = useState(false);

  // Birthday Wishes State
  const [sendingWishId, setSendingWishId] = useState<string | null>(null);

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const isLead =
    isTeamLead(currentUser?.role) ||
    isManager(currentUser?.role) ||
    (Boolean(currentUser?.role) && ["TEAM_LEAD", "MANAGER", "PROJECT_MANAGER"].includes(currentUser.role));
  const isHR = isHRAdmin(currentUser?.role) || isSuperAdmin(currentUser?.role);
  const canReviewLeaves = isHR || isLead || (teamPendingLeaves && teamPendingLeaves.length > 0);

  // Compute live punch / work time stats
  const getLivePunchStats = () => {
    if (!punchData?.punchIn) {
      return {
        isActive: false,
        displayHours: 0,
        formattedHours: "0.0h",
        progressPct: 0,
      };
    }

    const isActive = Boolean(punchData.punchIn && !punchData.punchOut);

    if (!isActive) {
      const hours = punchData.totalWorkingHours || 0;
      return {
        isActive: false,
        displayHours: hours,
        formattedHours: `${hours}h`,
        progressPct: Math.min(100, Math.round((hours / 8.0) * 100)),
      };
    }

    // Active session: compute live elapsed working time
    let sessions: any[] = [];
    if (Array.isArray(punchData.sessions) && punchData.sessions.length > 0) {
      sessions = punchData.sessions;
    } else if (punchData.notes) {
      try {
        const parsed = JSON.parse(punchData.notes);
        if (Array.isArray(parsed.punches)) sessions = parsed.punches;
      } catch (e) {}
    }

    let totalActiveMs = 0;
    const nowMs = currentTime ? currentTime.getTime() : Date.now();

    if (sessions.length > 0) {
      for (const s of sessions) {
        if (s.punchIn) {
          const inMs = new Date(s.punchIn).getTime();
          if (s.punchOut) {
            const outMs = new Date(s.punchOut).getTime();
            totalActiveMs += Math.max(0, outMs - inMs);
          } else {
            totalActiveMs += Math.max(0, nowMs - inMs);
          }
        }
      }
    } else {
      const inMs = new Date(punchData.punchIn).getTime();
      totalActiveMs = Math.max(0, nowMs - inMs);
    }

    // In a 9-hour shift: standard 1-hour break window applies beyond 8 hours for continuous single session
    const elapsedHours = totalActiveMs / (1000 * 60 * 60);
    let breakMs = 0;
    if (sessions.length <= 1) {
      if (elapsedHours >= 9.0) {
        breakMs = 60 * 60 * 1000;
      } else if (elapsedHours > 8.0) {
        breakMs = Math.min(60 * 60 * 1000, totalActiveMs - 8 * 60 * 60 * 1000);
      }
    }

    const netMs = Math.max(0, totalActiveMs - breakMs);
    const totalMinutes = Math.floor(netMs / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const decimalHours = Math.min(12.0, Math.round((netMs / (1000 * 60 * 60)) * 100) / 100);

    return {
      isActive: true,
      displayHours: decimalHours,
      formattedHours: `${hours}h ${mins}m`,
      progressPct: Math.min(100, Math.round((decimalHours / 8.0) * 100)),
    };
  };

  const livePunchStats = getLivePunchStats();

  // 1. Fetch Dashboard & Punch Status
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

  // 2. Fetch Profile
  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/hrms/profile");
      const json = await res.json();
      if (json.success && json.data) {
        setProfileData(json.data);
        setEditPhone(json.data.hrProfile?.phone || "");
        setEditEmergency(json.data.hrProfile?.emergencyContact || "");
        setEditAddress(json.data.hrProfile?.address || "");
        setEditAvatarUrl(json.data.avatarUrl || "");
        setEditDob(json.data.hrProfile?.dateOfBirth ? new Date(json.data.hrProfile.dateOfBirth).toISOString().split("T")[0] : "");
      }
    } catch (err) {
      console.error("Profile fetch error", err);
    }
  };

  // 3. Fetch Attendance History
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

  // 4. Fetch Leaves & Balances
  const fetchLeaves = async () => {
    try {
      const leaveUrl = isHR ? "/api/hrms/leave?viewAll=true" : "/api/hrms/leave";
      const [leaveRes, balRes] = await Promise.all([
        fetch(leaveUrl),
        fetch("/api/hrms/leave/types"),
      ]);
      const [leaveJson, balJson] = await Promise.all([leaveRes.json(), balRes.json()]);
      if (leaveJson.success) {
        const allList = leaveJson.data || [];
        setLeaves(allList.filter((l: any) => l.userId === currentUser.id));
        setTeamPendingLeaves(allList.filter((l: any) => l.userId !== currentUser.id && l.status === "PENDING"));
      }
      if (balJson.success) setLeaveBalances(balJson.data || []);
    } catch (err) {
      console.error("Leaves fetch error", err);
    }
  };

  // 5. Fetch Documents
  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/hrms/documents");
      const json = await res.json();
      if (json.success) setDocuments(json.data || []);
    } catch (err) {
      console.error("Docs fetch error", err);
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
      if (slipJson.success) setPayslips(slipJson.data || []);
    } catch (err) {
      console.error("Payroll fetch error", err);
    }
  };

  // 7. Fetch Directory
  const fetchDirectory = async () => {
    try {
      const res = await fetch("/api/hrms/employees");
      const json = await res.json();
      if (json.success) setDirectoryEmployees(json.data || []);
    } catch (err) {
      console.error("Directory fetch error", err);
    }
  };

  // 8. Fetch Requests
  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/hrms/requests");
      const json = await res.json();
      if (json.success) setHrRequests(json.data || []);
    } catch (err) {
      console.error("Requests fetch error", err);
    }
  };

  // High-performance unified bootstrap (1 roundtrip instead of 9 separate requests)
  const fetchHRMSBootstrap = async () => {
    setLoadingDashboard(true);
    try {
      const res = await fetch(`/api/hrms/bootstrap?month=${selectedMonth}&year=${selectedYear}`);
      const json = await res.json();
      if (json.success && json.data) {
        const {
          profile,
          dashboard,
          punch,
          attendance,
          leaves: lList,
          teamPendingLeaves: tLeaves,
          leaveBalances: lBal,
          documents: dList,
          payroll,
          directory,
          requests,
        } = json.data;

        if (dashboard) setDashboardData({ employeeDashboard: dashboard });
        if (punch) setPunchData(punch);
        if (profile) {
          setProfileData(profile);
          setEditPhone(profile.hrProfile?.phone || "");
          setEditEmergency(profile.hrProfile?.emergencyContact || "");
          setEditAddress(profile.hrProfile?.address || "");
          setEditAvatarUrl(profile.avatarUrl || "");
          setEditDob(profile.hrProfile?.dateOfBirth ? new Date(profile.hrProfile.dateOfBirth).toISOString().split("T")[0] : "");
        }
        if (attendance) {
          setAttendanceRecords(attendance.attendances || []);
          setMonthlyStats(attendance.stats || null);
        }
        if (lList) setLeaves(lList);
        if (tLeaves) setTeamPendingLeaves(tLeaves);
        if (lBal) setLeaveBalances(lBal);
        if (dList) setDocuments(dList);
        if (payroll) {
          setSalaryStructure(payroll.salaryStructure);
          setPayslips(payroll.payslips || []);
        }
        if (directory) setDirectoryEmployees(directory);
        if (requests) setHrRequests(requests);
      }
    } catch (err) {
      console.error("Bootstrap error, falling back to granular fetch:", err);
      fetchDashboard();
      fetchProfile();
      fetchAttendance();
      fetchLeaves();
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    fetchHRMSBootstrap();
  }, [selectedMonth, selectedYear]);

  // Handle Punch In / Punch Out
  const handlePunchAction = async (action: "PUNCH_IN" | "PUNCH_OUT") => {
    setPunchLoading(true);
    try {
      const res = await fetch("/api/hrms/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          notes: punchNote || undefined,
          breakDurationMinutes: breakMinutes || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPunchData(json.data);
        showToast(json.message || "Attendance recorded successfully", "success");
        fetchDashboard();
        fetchAttendance();
      } else {
        showToast(json.error?.message || "Punch failed", "error");
      }
    } catch (err) {
      showToast("Network error executing punch", "error");
    } finally {
      setPunchLoading(false);
    }
  };

  // Handle Team Lead / HR Leave Approval
  const handleApproveOrRejectLeave = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
    setActionLeaveLoading(true);
    try {
      const res = await fetch("/api/hrms/leave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveId,
          status,
          approverComment: `Decision updated by ${currentUser.name} (${currentUser.role})`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || `Leave application ${status.toLowerCase()} successfully`, "success");
        fetchLeaves();
        fetchDashboard();
      } else {
        showToast(json.error?.message || "Failed to update leave", "error");
      }
    } catch (err) {
      showToast("Error updating leave decision", "error");
    } finally {
      setActionLeaveLoading(false);
    }
  };

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/hrms/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: editPhone,
          emergencyContact: editEmergency,
          address: editAddress,
          avatarUrl: editAvatarUrl || undefined,
          dateOfBirth: editDob || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Profile details updated successfully", "success");
        setIsEditProfileOpen(false);
        fetchProfile();
        fetchDashboard();
      } else {
        showToast(json.error?.message || "Failed to update profile", "error");
      }
    } catch (err) {
      showToast("Error updating profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Send Birthday Wish
  const handleSendWish = async (targetUserId: string, targetName: string) => {
    setSendingWishId(targetUserId);
    try {
      const res = await fetch("/api/hrms/wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          message: `Wishing you a fantastic Birthday, ${targetName}! 🎉🎂 Have a stellar year ahead!`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Birthday wish sent to ${targetName}! 🎉`, "success");
      } else {
        showToast(json.error?.message || "Failed to send wish", "error");
      }
    } catch (err) {
      showToast("Network error sending wish", "error");
    } finally {
      setSendingWishId(null);
    }
  };

  // Handle Document Upload
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docUrl.trim()) return;
    setUploadingDoc(true);
    try {
      const res = await fetch("/api/hrms/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: docName.trim(),
          fileUrl: docUrl.trim(),
          docCategory,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Document uploaded successfully", "success");
        setIsUploadDocOpen(false);
        setDocName("");
        setDocUrl("");
        fetchDocuments();
      } else {
        showToast(json.error?.message || "Upload failed", "error");
      }
    } catch (err) {
      showToast("Error uploading document", "error");
    } finally {
      setUploadingDoc(false);
    }
  };

  // Handle Submit HR Request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqSubject.trim() || !reqDesc.trim()) return;
    setSubmittingReq(true);
    try {
      const res = await fetch("/api/hrms/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: reqType,
          subject: reqSubject.trim(),
          description: reqDesc.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("HR Request submitted successfully", "success");
        setIsNewRequestOpen(false);
        setReqSubject("");
        setReqDesc("");
        fetchRequests();
      } else {
        showToast(json.error?.message || "Failed to submit request", "error");
      }
    } catch (err) {
      showToast("Error submitting request", "error");
    } finally {
      setSubmittingReq(false);
    }
  };

  // Filter Directory
  const filteredDirectory = directoryEmployees.filter((emp) => {
    if (dirDept !== "ALL" && (emp.department || emp.hrProfile?.department) !== dirDept) return false;
    if (dirSearch.trim()) {
      const q = dirSearch.toLowerCase();
      const matchName = (emp.name || "").toLowerCase().includes(q);
      const matchEmail = (emp.email || "").toLowerCase().includes(q);
      const matchDept = (emp.department || emp.hrProfile?.department || "").toLowerCase().includes(q);
      const matchTitle = (emp.jobTitle || emp.hrProfile?.designation || "").toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchDept && !matchTitle) return false;
    }
    return true;
  });

  const empDash = dashboardData?.employeeDashboard;
  const upcomingBirthdays = empDash?.upcomingBirthdays || [];
  const todayBirthdays = empDash?.todayBirthdays || [];
  const isMyBirthday = empDash?.isMyBirthday || false;
  const upcomingAnniversaries = empDash?.upcomingAnniversaries || [];
  const announcements = empDash?.announcements || [];
  const upcomingHolidays = (empDash?.upcomingHolidays || []).filter((h: any) => {
    if (!h?.date) return false;
    const hDate = new Date(h.date);
    const now = new Date();
    const hDateStr = typeof h.date === "string" ? h.date.split("T")[0] : hDate.toISOString().split("T")[0];
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return hDateStr >= todayStr;
  });

  const tabList = [
    { id: "dashboard", label: "📊 HR Overview & Celebrations" },
    { id: "profile", label: "👤 My HR Profile" },
    { id: "attendance", label: "⏱️ Attendance & Working Hours" },
    { id: "leaves", label: "🏖️ Leave Management", badge: teamPendingLeaves.length > 0 && canReviewLeaves ? teamPendingLeaves.length : null },
    { id: "documents", label: `📁 HR Documents (${documents.length})` },
    { id: "payroll", label: "💰 Salary & Payslips" },
    { id: "directory", label: "🏢 Company Directory" },
    { id: "requests", label: `📩 HR Helpdesk (${hrRequests.length})` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-gray-900">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-xs font-semibold text-white flex items-center gap-2 animate-fade-in ${
            toastMsg.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toastMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* SPECIAL BIRTHDAY HERO BANNER (If it is user's birthday today!) */}
      {isMyBirthday && (
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white shadow-2xl animate-fade-in">
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
                🎂
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black">Happy Birthday, {currentUser?.name}! 🎉</h2>
                <p className="text-xs sm:text-sm text-white/90 mt-1">
                  The entire organization wishes you a fantastic day filled with joy, happiness, and great success!
                </p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white/25 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
              ✨ Birthday Celebration
            </div>
          </div>
        </div>
      )}

      {/* TODAY'S COLLEAGUES BIRTHDAYS BANNER */}
      {todayBirthdays.length > 0 && !isMyBirthday && (
        <div className="p-5 rounded-3xl bg-pink-50/90 border border-pink-200 text-xs shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Cake className="w-4 h-4 text-pink-500" />
              <span>🎉 Today's Birthday Celebration in the Team!</span>
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-pink-600 text-white uppercase">
              Today's Special
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {todayBirthdays.map((b: any, idx: number) => (
              <div
                key={b.id || b.userId || `today-bday-${idx}`}
                className="p-3.5 rounded-2xl bg-white border border-gray-200 flex items-center justify-between gap-2 shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                      b.name
                    )} flex items-center justify-center text-xs font-black text-white uppercase flex-shrink-0 shadow-sm`}
                  >
                    {getInitials(b.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 truncate">{b.name}</div>
                    <div className="text-[10px] text-gray-500 truncate">{b.jobTitle}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleSendWish(b.id, b.name)}
                  disabled={sendingWishId === b.id}
                  className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-[11px] shadow-sm transition-all flex-shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {sendingWishId === b.id ? "Sending..." : "🎂 Wish"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
              currentUser?.name || "Employee"
            )} flex items-center justify-center text-lg font-black text-white uppercase shadow-md flex-shrink-0`}
          >
            {getInitials(currentUser?.name || "E")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900">
                Welcome, {currentUser?.name}
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 border border-cyan-500/30">
                {profileData?.hrProfile?.employeeId || "EMP-" + (currentUser?.id?.slice(0, 5)?.toUpperCase() || "001")}
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {currentUser?.role}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {(profileData?.jobTitle || profileData?.hrProfile?.designation) && (
                <span>{profileData?.jobTitle || profileData?.hrProfile?.designation} &bull; </span>
              )}
              {(profileData?.department || profileData?.hrProfile?.department) && (
                <span>{profileData?.department || profileData?.hrProfile?.department} &bull; </span>
              )}
              <span>{currentUser?.email}</span>
            </p>
          </div>
        </div>

        {/* Live Clock Widget */}
        <div className="flex items-center gap-3 self-start sm:self-auto bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-2xl">
          <Clock className="w-5 h-5 text-cyan-600" />
          <div>
            <div className="text-sm font-black font-mono text-gray-900">
              {currentTime ? currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
              {currentTime ? currentTime.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation (Synchronized with left sidebar & Auto-scrolled) */}
      <div
        ref={tabContainerRef}
        className="flex border-b border-gray-200 bg-white rounded-2xl px-4 overflow-x-auto shadow-sm text-xs font-bold scroll-smooth no-scrollbar"
      >
        {tabList.map((item) => {
          const isSelected = activeTab === item.id;
          return (
            <button
              key={item.id}
              ref={isSelected ? activeTabRef : null}
              onClick={() => handleTabChange(item.id as any)}
              className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? "border-cyan-500 text-cyan-600  font-black"
                  : "border-transparent text-gray-500  hover:text-gray-900 "
              }`}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-mono text-[10px]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: HR OVERVIEW (DASHBOARD & CELEBRATIONS) */}
      {activeTab === "dashboard" && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Quick Punch Widget & Profile Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Punch In / Out Card */}
            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-500" />
                    <span>Today's Attendance & Time Tracker</span>
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 font-semibold">
                    9h Shift &bull; 1h Break
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    punchData?.punchIn && !punchData?.punchOut
                      ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 animate-pulse"
                      : punchData?.punchOut
                      ? "bg-cyan-500/15 text-cyan-500 border border-cyan-500/30"
                      : "bg-gray-100  text-gray-500"
                  }`}
                >
                  {punchData?.punchIn && !punchData?.punchOut ? "CLOCKED IN (ACTIVE)" : punchData?.punchOut ? "PUNCHED OUT / ON BREAK" : "NOT RECORDED"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-gray-50/90 border border-gray-200">
                  <div className="text-[10px] text-gray-500 font-semibold uppercase">First Punch In</div>
                  <div className="text-sm font-bold font-mono text-gray-900 mt-1">
                    {punchData?.punchIn ? new Date(punchData.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50/90 border border-gray-200">
                  <div className="text-[10px] text-gray-500 font-semibold uppercase">Latest Punch Out</div>
                  <div className="text-sm font-bold font-mono text-gray-900 mt-1">
                    {punchData?.punchOut ? new Date(punchData.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : punchData?.punchIn ? "In Progress" : "--:--"}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50/90 border border-gray-200">
                  <div className="text-[10px] text-gray-500 font-semibold uppercase">Break Time</div>
                  <div className="text-sm font-bold font-mono text-gray-900 mt-1">
                    {punchData?.breakDurationMinutes ?? 0}m <span className="text-[10px] text-gray-500 font-normal">(1h allowed)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50/90 border border-gray-200">
                  <div className="text-[10px] text-gray-500 font-semibold uppercase flex items-center justify-between">
                    <span>Logged Hours</span>
                    {livePunchStats.isActive && (
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" title="Actively tracking" />
                    )}
                  </div>
                  <div className="text-sm font-bold font-mono text-cyan-600 mt-1">
                    {livePunchStats.formattedHours}{" "}
                    <span className="text-[10px] font-normal text-gray-500">/ 8.0h</span>
                  </div>
                </div>
              </div>

              {/* Multi-punch session indicator */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  {!punchData?.punchIn || (punchData?.punchIn && punchData?.punchOut) ? (
                    <button
                      type="button"
                      disabled={punchLoading}
                      onClick={() => handlePunchAction("PUNCH_IN")}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span>{punchData?.punchOut ? "➕ Punch In (Resume Work)" : "▶ Punch In Now"}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={punchLoading}
                      onClick={() => handlePunchAction("PUNCH_OUT")}
                      className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span>⏹ Punch Out (Take Break / Finish)</span>
                    </button>
                  )}
                  {punchLoading && <span className="text-xs text-gray-400 animate-pulse">Updating...</span>}
                </div>

                <div className="text-[11px] text-gray-500">
                  {punchData?.status === "FULL_DAY" || livePunchStats.displayHours >= 8.0 ? (
                    <span className="text-emerald-500 font-bold">✓ Full Day Target Met (8+ hours)</span>
                  ) : livePunchStats.displayHours > 0 ? (
                    <span>
                      Progress: <b>{livePunchStats.displayHours}h</b> / 8.0h ({livePunchStats.progressPct}%)
                    </span>
                  ) : (
                    <span>9-hour shift with 1-hour break window</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Profile Summary Box */}
            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-3 text-xs">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-500" />
                <span>My HR Summary</span>
              </h2>

              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Employee ID:</span>
                  <span className="font-bold text-gray-900 font-mono">
                    {profileData?.hrProfile?.employeeId || "EMP-" + currentUser?.id?.slice(0, 5).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Department:</span>
                  <span className="font-semibold text-gray-900">
                    {profileData?.department || profileData?.hrProfile?.department || "General"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Designation:</span>
                  <span className="font-semibold text-gray-900">
                    {profileData?.jobTitle || profileData?.hrProfile?.designation || "Employee"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Date of Birth:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {profileData?.hrProfile?.dateOfBirth ? formatDate(profileData.hrProfile.dateOfBirth) : "Not updated"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-bold text-emerald-500">
                    {profileData?.hrProfile?.status || "ACTIVE"}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => handleTabChange("profile")}
                  className="flex-1 py-2 rounded-xl bg-gray-50 hover:bg-cyan-500 hover:text-slate-900 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  View Profile
                </button>
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="px-3 py-2 rounded-xl border border-gray-200 hover:border-cyan-500 text-gray-600 text-xs font-semibold cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Leave Balances Cards - Focused strictly on Monthly CL & PL */}
          <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-500" />
                    <span>My Leave Balances (CL & PL)</span>
                  </h2>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                    +1 CL & +1 PL Credited Monthly
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  1 Casual Leave (CL) + 1 Privilege Leave (PL) credited on the 1st of every month. Unused leaves accumulate and roll over to next month!
                </p>
              </div>
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm cursor-pointer transition-all self-start sm:self-auto flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Apply for Leave</span>
              </button>
            </div>

            {leaveBalances.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs italic">
                Leave balance not available.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Primary Focused Cards: Casual Leave (CL) and Privilege Leave (PL) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leaveBalances
                    .filter((bal) => bal.code === "CL" || bal.code === "PL" || bal.code === "EL" || bal.code === "SL")
                    .map((bal) => {
                      const isCL = bal.code === "CL" || bal.code === "SL";
                      return (
                        <div
                          key={bal.id}
                          className={`p-5 rounded-2xl border transition-all text-xs space-y-3 relative overflow-hidden ${
                            isCL
                              ? "bg-gradient-to-br from-cyan-50/70 via-white to-blue-50/40    border-cyan-200 "
                              : "bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40    border-emerald-200 "
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${
                                  isCL ? "bg-cyan-500" : "bg-emerald-500"
                                }`}
                              />
                              <span className="font-bold text-sm text-gray-900">
                                {isCL ? "Casual / Sick Leave (CL)" : "Privilege / Earned Leave (PL)"}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                isCL
                                  ? "bg-cyan-500/15 text-cyan-600  border border-cyan-500/30"
                                  : "bg-emerald-500/15 text-emerald-600  border border-emerald-500/30"
                              }`}
                            >
                              +1 Credited Monthly
                            </span>
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black font-mono text-gray-900">
                              {bal.remainingDays}
                            </span>
                            <span className="text-xs font-semibold text-gray-500">
                              Days Available
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono ml-auto">
                              / {bal.accruedDays || bal.daysAllowed} accrued so far
                            </span>
                          </div>

                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                            <div>
                              <span>Used: <b>{bal.approvedDays}d</b></span>
                              <span className="mx-1.5">&bull;</span>
                              <span>Pending: <b>{bal.pendingDays}d</b></span>
                            </div>
                            <span className="font-mono text-[10px] text-gray-400">
                              Quota: 12d/yr
                            </span>
                          </div>

                          <div className="text-[10px] text-emerald-600 bg-emerald-50/80 px-2.5 py-1.5 rounded-xl border border-emerald-200/60 flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                            <span>Unused balance rolls over to next month automatically (+1 added on 1st).</span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Collapsible toggle for other statutory leaves (Maternity, Paternity, LOP) */}
                {leaveBalances.some((bal) => !(bal.code === "CL" || bal.code === "PL" || bal.code === "EL" || bal.code === "SL")) && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowOtherLeaves(!showOtherLeaves)}
                      className="text-[11px] text-gray-500 hover:text-cyan-600 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
                    >
                      {showOtherLeaves ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{showOtherLeaves ? "Hide other statutory leave types" : "View other statutory leave types (Maternity, Paternity, LOP)"}</span>
                    </button>

                    {showOtherLeaves && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
                        {leaveBalances
                          .filter((bal) => !(bal.code === "CL" || bal.code === "PL" || bal.code === "EL" || bal.code === "SL"))
                          .map((bal) => (
                            <div
                              key={bal.id}
                              className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200 text-xs space-y-1"
                            >
                              <div className="font-bold text-gray-700 truncate">{bal.name}</div>
                              <div className="text-xl font-bold font-mono text-gray-900">
                                {bal.remainingDays}{" "}
                                <span className="text-[10px] font-normal text-gray-400">/ {bal.daysAllowed}</span>
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {bal.approvedDays} used &bull; Statutory Policy
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CELEBRATIONS SECTION: UPCOMING BIRTHDAYS & WORK ANNIVERSARIES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upcoming Birthdays Card */}
            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Cake className="w-4 h-4 text-rose-500" />
                  <span>Upcoming Birthdays (Next 45 Days)</span>
                </h2>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
                  {upcomingBirthdays.length}
                </span>
              </div>

              {upcomingBirthdays.length === 0 ? (
                <div className="py-8 text-center text-gray-400 italic">
                  No upcoming team birthdays in the next 45 days.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {upcomingBirthdays.map((b: any, idx: number) => (
                    <div
                      key={b.id || b.userId || `upcoming-bday-${idx}`}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                        b.id === currentUser?.id
                          ? "bg-rose-50  border-rose-200 "
                          : "bg-gray-50/80  border-gray-200 "
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                            b.name
                          )} flex items-center justify-center text-xs font-black text-white uppercase flex-shrink-0 shadow-sm`}
                        >
                          {getInitials(b.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 flex items-center gap-1.5 truncate">
                            <span>{b.name}</span>
                            {b.id === currentUser?.id && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {b.jobTitle} &bull; {b.department}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <div className="font-mono font-bold text-gray-900">
                            {b.day} {b.month}
                          </div>
                          <div
                            className={`text-[10px] font-bold ${
                              b.isToday ? "text-rose-600  font-extrabold animate-pulse" : "text-gray-500 "
                            }`}
                          >
                            {b.isToday ? "🎉 Today!" : `In ${b.daysUntil} day(s)`}
                          </div>
                        </div>

                        {b.id !== currentUser?.id && (
                          <button
                            onClick={() => handleSendWish(b.id, b.name)}
                            disabled={sendingWishId === b.id}
                            title="Send Birthday Wish"
                            className="p-1.5 rounded-xl bg-pink-50 hover:bg-pink-600 hover:text-slate-900 text-pink-600 border border-pink-200 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Heart className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Work Anniversaries Card */}
            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-amber-500" />
                  <span>Work Anniversaries (Next 45 Days)</span>
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  {upcomingAnniversaries.length}
                </span>
              </div>

              {upcomingAnniversaries.length === 0 ? (
                <div className="py-8 text-center text-gray-500 italic">
                  No work anniversaries upcoming in the next 45 days.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {upcomingAnniversaries.map((a: any, idx: number) => (
                    <div
                      key={a.id || a.userId || `anniv-${idx}`}
                      className="p-3 rounded-2xl bg-gray-50/80 border border-gray-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                            a.name
                          )} flex items-center justify-center text-xs font-black text-white uppercase flex-shrink-0 shadow-sm`}
                        >
                          {getInitials(a.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 truncate">{a.name}</div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {a.jobTitle} &bull; {a.department}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="font-mono font-bold text-amber-600">
                          {a.yearsCompleted} Year{a.yearsCompleted > 1 ? "s" : ""}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {a.isToday ? "Today!" : `In ${a.daysUntil} day(s)`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* HOLIDAYS & ANNOUNCEMENTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upcoming Holidays */}
            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4 text-xs">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-500" />
                <span>Upcoming Company Holidays</span>
              </h2>

              {upcomingHolidays.length === 0 ? (
                <div className="py-8 text-center text-gray-500 italic">
                  No upcoming holidays scheduled.
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingHolidays.map((h: any, idx: number) => (
                    <div
                      key={h.id || `holiday-${idx}`}
                      className="p-3 rounded-2xl bg-gray-50/80 border border-gray-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-gray-900">{h.name}</div>
                        <div className="text-[10px] text-gray-500">{h.description || "Official Holiday"}</div>
                      </div>
                      <span className="font-mono font-bold text-cyan-600 text-xs">
                        {formatDate(h.date)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Company Announcements */}
            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4 text-xs">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-purple-500" />
                <span>Official HR Announcements</span>
              </h2>

              {announcements.length === 0 ? (
                <div className="py-8 text-center text-gray-500 italic">
                  No company announcements at this time.
                </div>
              ) : (
                <div className="space-y-2">
                  {announcements.map((ann: any, idx: number) => (
                    <div
                      key={ann.id || `announcement-${idx}`}
                      className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-gray-900">{ann.title}</div>
                        <span className="text-[10px] text-gray-500 font-mono">{formatDate(ann.createdAt)}</span>
                      </div>
                      <p className="text-gray-600 text-[11px] leading-relaxed">{ann.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY HR PROFILE */}
      {activeTab === "profile" && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                My Complete Employee Profile
              </h2>
              <p className="text-xs text-gray-500">
                View personal information, employment records, and edit self-service contact details.
              </p>
            </div>

            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Contact Details</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Personal Information */}
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-500" />
                <span>Personal Information</span>
              </h3>

              <div className="space-y-2.5 text-gray-600">
                <div className="flex justify-between py-1 border-b border-gray-200/50">
                  <span>Full Name:</span>
                  <span className="font-bold text-gray-900">{currentUser?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/50">
                  <span>Email:</span>
                  <span className="font-semibold text-gray-900 font-mono">{currentUser?.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/50">
                  <span>Phone Number:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {profileData?.hrProfile?.phone || "-"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/50">
                  <span>Emergency Contact:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {profileData?.hrProfile?.emergencyContact || "-"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/50">
                  <span>Date of Birth:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {profileData?.hrProfile?.dateOfBirth ? formatDate(profileData.hrProfile.dateOfBirth) : "-"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Address:</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[220px]">
                    {profileData?.hrProfile?.address || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-cyan-500" />
                <span>Employment Information</span>
              </h3>

              <div className="space-y-2.5 text-gray-600">
                <div className="flex justify-between py-1 border-b border-gray-200/50">
                  <span>Employee ID:</span>
                  <span className="font-bold font-mono text-cyan-600">
                    {profileData?.hrProfile?.employeeId || "EMP-" + currentUser?.id?.slice(0, 5).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/50">
                  <span>Department:</span>
                  <span className="font-semibold text-gray-900">
                    {profileData?.department || profileData?.hrProfile?.department || "General"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/50">
                  <span>Designation:</span>
                  <span className="font-semibold text-gray-900">
                    {profileData?.jobTitle || profileData?.hrProfile?.designation || "Employee"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/50">
                  <span>Joining Date:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {profileData?.hrProfile?.joiningDate ? formatDate(profileData.hrProfile.joiningDate) : "-"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/50">
                  <span>Reporting Manager:</span>
                  <span className="font-semibold text-gray-900">
                    {profileData?.manager?.name || "Not assigned"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Employment Status:</span>
                  <span className="font-bold text-emerald-500">
                    {profileData?.hrProfile?.status || "ACTIVE"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE */}
      {activeTab === "attendance" && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6 shadow-sm animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Monthly Attendance & Logs
              </h2>
              <p className="text-xs text-gray-500">
                Review your daily check-in, check-out, and total calculated working hours.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-900 focus:outline-none"
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
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-900 focus:outline-none"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {attendanceRecords.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-xs italic">
              No attendance records found for this month.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-bold text-[10px] uppercase bg-gray-50/50">
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-3">CHECK IN</th>
                    <th className="py-3 px-3">CHECK OUT</th>
                    <th className="py-3 px-3">BREAK</th>
                    <th className="py-3 px-3">WORKING HOURS</th>
                    <th className="py-3 px-3">STATUS</th>
                    <th className="py-3 px-4">NOTES</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendanceRecords.map((rec) => (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedAttendanceRecord(rec)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-gray-900">
                        {formatDate(rec.date)}
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-600">
                        {rec.punchIn ? new Date(rec.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-600">
                        {rec.punchOut ? new Date(rec.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-500">{rec.breakDurationMinutes || 0}m</td>
                      <td className="py-3 px-3 font-mono font-bold text-gray-900">
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
                      <td className="py-3 px-4 text-gray-500 text-[11px] italic">{rec.notes || "-"}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAttendanceRecord(rec);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 border border-cyan-500/30 transition-all cursor-pointer"
                        >
                          {isHR ? "View / Correct" : "Details"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LEAVES */}
      {activeTab === "leaves" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 p-6 rounded-3xl shadow-sm">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Leave Applications & Approvals
              </h2>
              <p className="text-xs text-gray-500">
                {canReviewLeaves
                  ? "Review team leave requests, apply for your own leave, and track approval statuses."
                  : "Apply for leave, track approval statuses from your Team Lead, and view remaining quota."}
              </p>
            </div>

            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
          </div>

          {/* CORPORATE LEAVE POLICY & MONTHLY ACCRUAL SPECIFICATION CARD */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-50/60 via-white to-blue-50/40 border border-cyan-200/80 shadow-sm space-y-4 text-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-cyan-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 font-bold border border-cyan-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    Corporate Leave Policy & Monthly Accrual Rules (Full-Time Members)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    24-Day Annual Quota &bull; 2 Leaves Credited Monthly on 1st &bull; Year-End Carry Forward Protection
                  </p>
                </div>
              </div>
              <span className="self-start md:self-auto text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                Active Corporate Policy
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
              <div className="p-3.5 rounded-2xl bg-white/80 border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-600 text-[11px]">Casual / Sick Leave (CL/SL)</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600">12 Days/Yr</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  <strong>1 working day credited on the 1st of every month</strong> for personal exigencies and medical recovery. Unused days carry forward past December 31st.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-600 text-[11px]">Privilege / Earned (PL/EL)</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">12 Days/Yr</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  <strong>1 working day credited on the 1st of every month</strong> for planned vacations. Unused balance carries forward to the next calendar year without lapsing.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-pink-600 text-[11px]">Maternity Benefit (ML)</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-600">26 Weeks Paid</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Administered per the <strong>Maternity Benefit (Amendment) Act, 2017</strong> (26 weeks / 182 days paid leave) with 100% salary continuation.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-600 text-[11px]">Paternity Benefit (PTL)</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600">10 Days Paid</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Administered per <strong>Company Paternity Policy</strong>. 10 paid working days upon childbirth or legal adoption of a child.
                </p>
              </div>
            </div>
          </div>

          {/* TEAM LEAVE APPROVALS SECTION (Visible to Team Leads, Managers, HR Admins) */}
          {canReviewLeaves && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-sm text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>Team Member Leave Requests Pending Your Review ({teamPendingLeaves.length})</span>
                </h3>
                <span className="text-[10px] text-gray-400">
                  {isHRAdmin(currentUser?.role) || isSuperAdmin(currentUser?.role)
                    ? "HR & Admin Authorization"
                    : "Team Lead Authorization"}
                </span>
              </div>

              {teamPendingLeaves.length === 0 ? (
                <div className="py-8 text-center text-gray-400 italic">
                  No pending leave applications from your team members.
                </div>
              ) : (
                <div className="space-y-3">
                  {teamPendingLeaves.map((tl) => (
                    <div
                      key={tl.id}
                      className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{tl.user?.name}</span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-600 font-bold">
                            {tl.leaveType}
                          </span>
                          <span className="font-mono font-bold text-gray-500">
                            {tl.daysCount === 0.5 ? "0.5 Day (Half Day)" : `${tl.daysCount} Day(s)`}
                          </span>
                          <span className="text-[10px] text-gray-400">({tl.user?.role})</span>
                        </div>
                        <div className="text-gray-500 font-mono text-[11px]">
                          Period: {formatDate(tl.startDate)}{tl.daysCount > 0.5 ? ` - ${formatDate(tl.endDate)}` : ""}
                        </div>
                        <div className="text-gray-700 italic">"{tl.reason}"</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={actionLeaveLoading}
                          onClick={() => handleApproveOrRejectLeave(tl.id, "APPROVED")}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                        >
                          Approve Leave
                        </button>
                        <button
                          type="button"
                          disabled={actionLeaveLoading}
                          onClick={() => handleApproveOrRejectLeave(tl.id, "REJECTED")}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MY PERSONAL LEAVE HISTORY */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                My Leave History ({leaves.length})
              </h3>
              {(isLead || isHR) && (
                <span className="text-[10px] text-amber-500 font-medium">
                  Note: Team Lead & HR Admin leaves require Super Admin approval.
                </span>
              )}
            </div>

            {leaves.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs italic">
                No leave records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-bold text-[10px] uppercase bg-gray-50/50">
                      <th className="py-3 px-4">LEAVE TYPE</th>
                      <th className="py-3 px-3">START DATE</th>
                      <th className="py-3 px-3">END DATE</th>
                      <th className="py-3 px-3">DAYS</th>
                      <th className="py-3 px-3">REASON</th>
                      <th className="py-3 px-3">STATUS</th>
                      <th className="py-3 px-4">APPROVER REMARK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leaves.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-gray-900">{l.leaveType}</td>
                        <td className="py-3 px-3 font-mono text-gray-600">{formatDate(l.startDate)}</td>
                        <td className="py-3 px-3 font-mono text-gray-600">{formatDate(l.endDate)}</td>
                        <td className="py-3 px-3 font-mono font-bold">
                          {l.daysCount === 0.5 ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 font-mono text-[10px]">
                              0.5 (Half)
                            </span>
                          ) : (
                            l.daysCount
                          )}
                        </td>
                        <td className="py-3 px-3 text-gray-700">{l.reason}</td>
                        <td className="py-3 px-3">
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
                        <td className="py-3 px-4 text-gray-500 text-[11px] italic">{l.approverComment || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                My Official HR Documents
              </h2>
              <p className="text-xs text-gray-500">
                Access your offer letter, policy agreements, certificates, and identity records.
              </p>
            </div>

            <button
              onClick={() => setIsUploadDocOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-xs italic">
              No documents available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 line-clamp-1">{doc.fileName}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {(doc.fileSize / 1024).toFixed(1)} KB &bull; Uploaded on {formatDate(doc.createdAt)}
                      </div>
                    </div>
                  </div>

                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SALARY & PAYSLIPS */}
      {activeTab === "payroll" && (
        <div className="space-y-6 animate-fade-in">
          {/* Salary Structure Card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">
              My Salary Structure & Breakdown
            </h2>

            {!salaryStructure ? (
              <div className="py-10 text-center text-gray-400 text-xs italic">
                Salary information not available. Contact HR Admin.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Basic Pay</div>
                  <div className="text-lg font-black text-gray-900 font-mono mt-1">
                    ₹{(salaryStructure.basic || 0).toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">HRA</div>
                  <div className="text-lg font-black text-gray-900 font-mono mt-1">
                    ₹{(salaryStructure.hra || 0).toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Allowances</div>
                  <div className="text-lg font-black text-gray-900 font-mono mt-1">
                    ₹{(salaryStructure.allowances || 0).toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                  <div className="text-[10px] text-cyan-600 font-bold uppercase">Net Monthly Salary</div>
                  <div className="text-lg font-black text-cyan-600 font-mono mt-1">
                    ₹{(salaryStructure.netSalary || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payslips History */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">
              Generated Payslips ({payslips.length})
            </h2>

            {payslips.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs italic">
                No payslips available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-bold text-[10px] uppercase bg-gray-50/50">
                      <th className="py-3 px-4">PAYSLIP PERIOD</th>
                      <th className="py-3 px-3">GROSS (₹)</th>
                      <th className="py-3 px-3">DEDUCTIONS (₹)</th>
                      <th className="py-3 px-3">NET PAY (₹)</th>
                      <th className="py-3 px-3">STATUS</th>
                      <th className="py-3 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payslips.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-gray-900 font-mono">
                          {new Date(p.year, p.month - 1).toLocaleString("default", { month: "long" })} {p.year}
                        </td>
                        <td className="py-3 px-3 font-mono">₹{(p.grossSalary || 0).toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono text-rose-500">₹{(p.deductions || 0).toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-500">₹{(p.netSalary || 0).toLocaleString()}</td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedPayslip(p)}
                            className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-cyan-600 hover:text-slate-900 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            View Payslip
                          </button>
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

      {/* TAB 7: COMPANY DIRECTORY */}
      {activeTab === "directory" && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-5 shadow-sm text-xs animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search team directory by name, email, department..."
                value={dirSearch}
                onChange={(e) => setDirSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredDirectory.map((emp) => (
              <div
                key={emp.id}
                className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-3 shadow-sm"
              >
                <div
                  className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                    emp.name
                  )} flex items-center justify-center text-xs font-black text-white uppercase flex-shrink-0`}
                >
                  {getInitials(emp.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-gray-900 truncate">{emp.name}</div>
                  <div className="text-[11px] text-gray-500 truncate">
                    {emp.jobTitle || emp.hrProfile?.designation || "Employee"}
                  </div>
                  <div className="text-[10px] text-cyan-600 font-mono truncate">
                    {emp.department || emp.hrProfile?.department || "General"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: HR REQUESTS */}
      {activeTab === "requests" && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-5 shadow-sm text-xs animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                HR Service Desk & Queries
              </h2>
              <p className="text-xs text-gray-500">
                Submit profile corrections, document requests, or query HR admins.
              </p>
            </div>

            <button
              onClick={() => setIsNewRequestOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New HR Request</span>
            </button>
          </div>

          {hrRequests.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs italic">
              No HR requests submitted.
            </div>
          ) : (
            <div className="space-y-2">
              {hrRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{req.subject}</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-gray-200">
                        {req.requestType}
                      </span>
                    </div>
                    <div className="text-gray-500 mt-1">{req.description}</div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      req.status === "RESOLVED"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : req.status === "PENDING"
                        ? "bg-amber-500/15 text-amber-500"
                        : "bg-cyan-500/15 text-cyan-500"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleUpdateProfile}
            className="w-full max-w-md rounded-3xl bg-white border border-gray-200 p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                Edit Contact & Personal Details
              </h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-gray-500 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-semibold mb-1">Emergency Contact</label>
                <input
                  type="text"
                  placeholder="Contact Name & Number"
                  value={editEmergency}
                  onChange={(e) => setEditEmergency(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-semibold mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Used for birthday celebrations on the team dashboard.
                </p>
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
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadDocOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleUploadDocument}
            className="w-full max-w-md rounded-3xl bg-white border border-gray-200 p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                Upload Employee Document
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadDocOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-gray-500 font-semibold mb-1">Document Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Identity Proof / PAN Card"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-semibold mb-1">Document URL / Storage Link *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-semibold mb-1">Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500"
                >
                  <option value="IDENTITY">Identity Proof (Aadhaar/PAN/Passport)</option>
                  <option value="EDUCATION">Education / Degree Certificate</option>
                  <option value="EXPERIENCE">Previous Experience Letter</option>
                  <option value="OFFER_LETTER">Offer / Appointment Letter</option>
                  <option value="OTHER">Other Official Document</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsUploadDocOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadingDoc}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
              >
                {uploadingDoc ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW HR REQUEST MODAL */}
      {isNewRequestOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSubmitRequest}
            className="w-full max-w-md rounded-3xl bg-white border border-gray-200 p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                Submit HR Service Desk Request
              </h3>
              <button
                type="button"
                onClick={() => setIsNewRequestOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-gray-500 font-semibold mb-1">Request Type</label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500"
                >
                  <option value="PROFILE_UPDATE">Profile Update / Correction</option>
                  <option value="DOCUMENT_REQUEST">Salary Certificate / Experience Letter</option>
                  <option value="HR_QUERY">General HR Policy Query</option>
                  <option value="OTHER">Other Service Request</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-500 font-semibold mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Request for Bonafide Salary Certificate"
                  value={reqSubject}
                  onChange={(e) => setReqSubject(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-semibold mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide context or details..."
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewRequestOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReq}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
              >
                {submittingReq ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW PAYSLIP MODAL */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white border border-gray-200 p-6 space-y-5 shadow-2xl text-xs text-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Salary Statement / Payslip
                </h3>
                <p className="text-gray-500 font-mono text-[11px]">
                  {new Date(selectedPayslip.year, selectedPayslip.month - 1).toLocaleString("default", { month: "long" })} {selectedPayslip.year}
                </p>
              </div>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div>
                <div className="text-[10px] text-gray-400 uppercase">Employee Name</div>
                <div className="font-bold text-gray-900">{currentUser?.name}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase">Employee ID</div>
                <div className="font-mono font-bold">{profileData?.hrProfile?.employeeId || "EMP-" + currentUser?.id?.slice(0, 5).toUpperCase()}</div>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-gray-500 uppercase">Earnings</div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span>Basic Salary</span>
                  <span className="font-mono font-bold">₹{(selectedPayslip.basic || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>House Rent Allowance (HRA)</span>
                  <span className="font-mono font-bold">₹{(selectedPayslip.hra || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Special Allowance</span>
                  <span className="font-mono font-bold">₹{(selectedPayslip.allowances || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="text-[11px] font-bold text-gray-500 uppercase">Deductions</div>
              <div className="flex justify-between text-rose-500">
                <span>Provident Fund & Taxes</span>
                <span className="font-mono font-bold">₹{(selectedPayslip.deductions || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Net Salary Total */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
              <div>
                <div className="text-[10px] font-bold text-emerald-600 uppercase">Net Disbursed Pay</div>
                <div className="text-xl font-black font-mono text-emerald-600">
                  ₹{(selectedPayslip.netSalary || 0).toLocaleString()}
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600">
                DISBURSED
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      <LeaveApplyModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onLeaveApplied={() => {
          fetchDashboard();
          fetchLeaves();
        }}
      />

      {/* Attendance Detail & HR Correction Modal */}
      {selectedAttendanceRecord && (
        <AttendanceDetailModal
          isOpen={Boolean(selectedAttendanceRecord)}
          onClose={() => setSelectedAttendanceRecord(null)}
          record={selectedAttendanceRecord}
          dateStr={
            selectedAttendanceRecord.date
              ? new Date(selectedAttendanceRecord.date).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0]
          }
          isHRAdmin={isHR}
          onRecordUpdated={() => {
            fetchAttendance();
            fetchDashboard();
            setSelectedAttendanceRecord(null);
          }}
        />
      )}
    </div>
  );
}
