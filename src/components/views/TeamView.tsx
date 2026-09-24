"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  X,
  Phone,
  Calendar,
  FolderKanban,
  CheckSquare,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Building2,
} from "lucide-react";
import { getInitials, getAvatarGradient, formatDate, getPriorityColor, getStatusColor } from "@/lib/utils";

interface TeamViewProps {
  users: any[];
  currentUser: any;
  tasks?: any[];
  projects?: any[];
  onSelectTask: (key: string) => void;
  onRefreshData: () => void;
}

export function TeamView({
  users,
  currentUser,
  tasks = [],
  projects = [],
  onSelectTask,
  onRefreshData,
}: TeamViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userRole = currentUser?.role || "MEMBER";
  const isSuper = userRole === "SUPER_ADMIN";
  const isHR = userRole === "HR_ADMIN";
  const isPM = userRole === "MANAGER" || userRole === "PROJECT_MANAGER";
  const isLead = userRole === "TEAM_LEAD";
  const canInvite = isSuper || isHR || isPM || isLead;

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<"OVERVIEW" | "TASKS" | "PROJECTS">("OVERVIEW");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"ALL" | "ACTIVE" | "REVIEW" | "OVERDUE" | "DONE">("ALL");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Hierarchy editing state for selected user
  const [isEditingHierarchy, setIsEditingHierarchy] = useState(false);
  const [editManagerId, setEditManagerId] = useState("");
  const [editTeamLeadId, setEditTeamLeadId] = useState("");
  const [hierarchySaving, setHierarchySaving] = useState(false);
  const [hierarchyError, setHierarchyError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedUser) {
      setEditManagerId(selectedUser.managerId || "");
      setEditTeamLeadId(selectedUser.teamLeadId || "");
      setIsEditingHierarchy(false);
      setHierarchyError(null);
    }
  }, [selectedUser]);

  const handleSaveHierarchy = async () => {
    if (!selectedUser) return;
    setHierarchySaving(true);
    setHierarchyError(null);
    try {
      const res = await fetch("/api/users/hierarchy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedUser.id,
          managerId: editManagerId || null,
          teamLeadId: editTeamLeadId || null,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.user) {
        setSelectedUser((prev: any) => ({
          ...prev,
          ...json.data.user,
        }));
        setIsEditingHierarchy(false);
        onRefreshData();
      } else {
        setHierarchyError(json.error?.message || "Failed to update hierarchy");
      }
    } catch {
      setHierarchyError("Network error updating hierarchy");
    } finally {
      setHierarchySaving(false);
    }
  };

  const availableUsersForSelected = users.filter((u: any) => u.id !== selectedUser?.id);
  const eligibleManagersForSelected = availableUsersForSelected;
  const eligibleTeamLeadsForSelected = availableUsersForSelected;

  // Helper to extract assigned tasks for a user
  const getUserTasks = (userId: string) => {
    return tasks.filter((t: any) =>
      t.assignees?.some((a: any) => a.userId === userId || a.user?.id === userId || a.id === userId)
    );
  };

  // Helper to extract projects a user is part of
  const getUserProjects = (userId: string) => {
    return projects.filter((p: any) =>
      p.members?.some((m: any) => m.userId === userId || m.user?.id === userId) ||
      p.leadId === userId ||
      p.managerId === userId ||
      p.teamLeadId === userId
    );
  };

  // Helper to compute rich workload stats
  const getUserStats = (userId: string, initialStats?: any) => {
    const userTasks = getUserTasks(userId);
    if (userTasks.length === 0 && initialStats && initialStats.total > 0) {
      return initialStats;
    }
    const active = userTasks.filter((t: any) => t.status === "IN_PROGRESS" || t.status === "TODO").length;
    const inReview = userTasks.filter((t: any) => t.status === "IN_REVIEW").length;
    const completed = userTasks.filter((t: any) => t.status === "DONE").length;
    const overdue = userTasks.filter((t: any) => {
      if (t.status === "DONE") return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date();
    }).length;
    return {
      total: userTasks.length,
      active,
      inReview,
      completed,
      overdue,
      completionRate: userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : 0,
    };
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return { label: "Super Admin", bg: "bg-purple-500/15 border-purple-500/30 text-purple-300" };
      case "HR_ADMIN":
        return { label: "HR Admin", bg: "bg-pink-500/15 border-pink-500/30 text-pink-300" };
      case "MANAGER":
      case "PROJECT_MANAGER":
        return { label: "Manager", bg: "bg-blue-500/15 border-blue-500/30 text-blue-300" };
      case "TEAM_LEAD":
        return { label: "Team Lead", bg: "bg-amber-500/15 border-amber-500/30 text-amber-300" };
      case "QA":
        return { label: "QA Engineer", bg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" };
      default:
        return { label: "Member", bg: "bg-slate-500/15 border-slate-500/30 text-slate-300" };
    }
  };

  const handleCopyEmail = (email: string) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setStatusMsg({ type: "error", text: "Name and email are required." });
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg({ type: "success", text: `Invitation sent to ${inviteEmail}. Email logged in Dev Mailbox!` });
        setInviteName("");
        setInviteEmail("");
        onRefreshData();
      } else {
        setStatusMsg({ type: "error", text: json.error?.message || "Failed to send invitation" });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Network error sending invite" });
    } finally {
      setLoading(false);
    }
  };

  // Selected User data preparation
  const selectedUserTasks = selectedUser ? getUserTasks(selectedUser.id) : [];
  const selectedUserProjects = selectedUser ? getUserProjects(selectedUser.id) : [];
  const selectedUserStats = selectedUser ? getUserStats(selectedUser.id, selectedUser.stats) : {
    total: 0,
    active: 0,
    inReview: 0,
    completed: 0,
    overdue: 0,
    completionRate: 0,
  };

  const filteredTasks = selectedUserTasks.filter((t: any) => {
    if (taskStatusFilter === "ALL") return true;
    if (taskStatusFilter === "ACTIVE") return t.status === "IN_PROGRESS" || t.status === "TODO";
    if (taskStatusFilter === "REVIEW") return t.status === "IN_REVIEW";
    if (taskStatusFilter === "OVERDUE") {
      if (t.status === "DONE") return false;
      return t.dueDate && new Date(t.dueDate) < new Date();
    }
    if (taskStatusFilter === "DONE") return t.status === "DONE";
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#FF6200]" />
            <span>Team Directory & Capacity</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage organization members, assign roles, monitor live workloads, and inspect team profiles
          </p>
        </div>

        {canInvite && (
          <button
            onClick={() => {
              setStatusMsg(null);
              setShowInviteModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,98,0,0.3)] cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {users.map((user) => {
          const stats = getUserStats(user.id, user.stats);
          const roleBadge = getRoleBadge(user.role);

          return (
            <div
              key={user.id}
              onClick={() => {
                setSelectedUser(user);
                setModalTab("OVERVIEW");
                setTaskStatusFilter("ALL");
              }}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#FF6200]/50 hover:shadow-md transition-all cursor-pointer space-y-4 group shadow-xs"
            >
              {/* Member Profile Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(user.name)} flex items-center justify-center text-sm font-bold text-white uppercase border border-slate-200 shadow-sm flex-shrink-0`}
                    >
                      {getInitials(user.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#FF6200] transition-colors truncate">
                      {user.name}
                    </h3>
                    <div className="text-xs text-slate-500 truncate">
                      {user.jobTitle || "Team Member"}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 truncate">{user.email}</div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 whitespace-nowrap ${roleBadge.bg}`}
                >
                  {roleBadge.label}
                </span>
              </div>

              {/* Reporting Line Badge */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 py-0.5 truncate">
                <span className="text-slate-400">Reports to:</span>
                {user.role === "SUPER_ADMIN" ? (
                  <span className="text-purple-600 font-semibold">Executive Leadership</span>
                ) : user.manager?.name || user.teamLead?.name ? (
                  <span className="text-slate-700 font-semibold truncate">
                    {user.manager?.name && user.teamLead?.name
                      ? `${user.manager.name} / ${user.teamLead.name}`
                      : user.manager?.name || user.teamLead?.name}
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    Not Set
                  </span>
                )}
              </div>

              {/* Workload Stats Bar */}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500">Active</div>
                  <div className="font-bold text-slate-900 mt-0.5">{stats.active}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-blue-600">Review</div>
                  <div className="font-bold text-blue-600 mt-0.5">{stats.inReview}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <div className={`text-[10px] ${stats.overdue > 0 ? "text-rose-600 font-bold" : "text-slate-400"}`}>
                    Overdue
                  </div>
                  <div className={`font-bold mt-0.5 ${stats.overdue > 0 ? "text-rose-600" : "text-slate-500"}`}>
                    {stats.overdue}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-emerald-600">Done</div>
                  <div className="font-bold text-emerald-600 mt-0.5">{stats.completed}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Portalled Member Profile Modal */}
      {mounted &&
        selectedUser &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedUser(null);
            }}
          >
            <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative flex-shrink-0">
                      {selectedUser.avatarUrl ? (
                        <img
                          src={selectedUser.avatarUrl}
                          alt={selectedUser.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                            selectedUser.name
                          )} flex items-center justify-center text-base font-bold text-white uppercase border border-slate-200 shadow`}
                        >
                          {getInitials(selectedUser.name)}
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          selectedUser.isActive !== false ? "bg-emerald-500" : "bg-gray-400"
                        }`}
                        title={selectedUser.isActive !== false ? "Active Member" : "Inactive Member"}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 truncate">{selectedUser.name}</h2>
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                            getRoleBadge(selectedUser.role).bg
                          }`}
                        >
                          {getRoleBadge(selectedUser.role).label}
                        </span>
                        {(selectedUser.employeeId || selectedUser.hrProfile?.employeeId) && (
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
                            {selectedUser.employeeId || selectedUser.hrProfile?.employeeId}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5 truncate">
                        <span className="text-slate-700 font-semibold">
                          {selectedUser.jobTitle || "Team Member"}
                        </span>
                        <span>&bull;</span>
                        <span>{selectedUser.department || "General"}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-slate-400">{selectedUser.email}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-1.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1.5 mt-4 border-t border-slate-200 pt-3">
                  <button
                    onClick={() => setModalTab("OVERVIEW")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      modalTab === "OVERVIEW"
                        ? "bg-[#FF6200] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Overview & Info</span>
                  </button>

                  <button
                    onClick={() => setModalTab("TASKS")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      modalTab === "TASKS"
                        ? "bg-[#FF6200] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Assigned Tasks</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        modalTab === "TASKS" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {selectedUserTasks.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setModalTab("PROJECTS")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      modalTab === "PROJECTS"
                        ? "bg-[#FF6200] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <FolderKanban className="w-3.5 h-3.5" />
                    <span>Projects</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        modalTab === "PROJECTS" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {selectedUserProjects.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* TAB 1: OVERVIEW */}
                {modalTab === "OVERVIEW" && (
                  <div className="space-y-4">
                    {/* Organization & Contact Details (6 cards) */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Member Information
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {/* Email Card */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-[#FF6200]" />
                              Email
                            </span>
                            <button
                              onClick={() => handleCopyEmail(selectedUser.email)}
                              className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Copy email"
                            >
                              {copiedEmail ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="font-semibold text-slate-900 text-xs mt-1 truncate" title={selectedUser.email}>
                            {selectedUser.email}
                          </div>
                        </div>

                        {/* Phone Card */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Phone className="w-3 h-3 text-cyan-600" />
                            Phone
                          </div>
                          <div className="font-semibold text-slate-900 text-xs mt-1 truncate">
                            {selectedUser.phone || selectedUser.hrProfile?.phone || "Not specified"}
                          </div>
                        </div>

                        {/* Department Card */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-purple-600" />
                            Department
                          </div>
                          <div className="font-semibold text-slate-900 text-xs mt-1 truncate">
                            {selectedUser.department || "General"}
                          </div>
                        </div>

                        {/* Joined Date */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            Joined
                          </div>
                          <div className="font-semibold text-slate-900 text-xs mt-1 truncate">
                            {formatDate(
                              selectedUser.createdAt || selectedUser.joiningDate || selectedUser.hrProfile?.joiningDate
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reporting Line Hierarchy Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-[#FF6200]" />
                          <span>Reporting Hierarchy</span>
                        </div>
                        {canInvite && (
                          <button
                            type="button"
                            onClick={() => setIsEditingHierarchy(!isEditingHierarchy)}
                            className="text-xs text-[#FF6200] hover:underline font-bold cursor-pointer"
                          >
                            {isEditingHierarchy ? "Cancel" : "Change Assignment"}
                          </button>
                        )}
                      </div>

                      {/* Not assigned warning banner */}
                      {!selectedUser.managerId && !selectedUser.teamLeadId && selectedUser.role !== "SUPER_ADMIN" && (
                        <div className="mb-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                          <span>No Reporting Manager or Team Lead assigned yet.</span>
                        </div>
                      )}

                      {isEditingHierarchy ? (
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#FF6200]/40 space-y-3">
                          {hierarchyError && (
                            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                              {hierarchyError}
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Reporting Manager
                              </label>
                              <select
                                value={editManagerId}
                                onChange={(e) => setEditManagerId(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF6200]"
                              >
                                <option value="">-- No Manager --</option>
                                {eligibleManagersForSelected.map((m: any) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} ({m.jobTitle || m.role.replace("_", " ")})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Reporting Team Lead
                              </label>
                              <select
                                value={editTeamLeadId}
                                onChange={(e) => setEditTeamLeadId(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF6200]"
                              >
                                <option value="">-- No Team Lead --</option>
                                {eligibleTeamLeadsForSelected.map((tl: any) => (
                                  <option key={tl.id} value={tl.id}>
                                    {tl.name} ({tl.jobTitle || tl.role.replace("_", " ")})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsEditingHierarchy(false)}
                              className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveHierarchy}
                              disabled={hierarchySaving}
                              className="px-4 py-1.5 rounded-lg bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold transition-all shadow-[0_0_10px_rgba(255,98,0,0.3)] disabled:opacity-50 cursor-pointer"
                            >
                              {hierarchySaving ? "Saving..." : "Save Assignment"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Manager */}
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                            <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                              <Shield className="w-3 h-3 text-blue-600" />
                              Reporting Manager
                            </div>
                            <div className="font-semibold text-slate-900 text-xs mt-1 truncate">
                              {selectedUser.manager?.name ? (
                                <span>{selectedUser.manager.name}</span>
                              ) : (
                                <span className={selectedUser.role === "SUPER_ADMIN" ? "text-slate-500" : "text-amber-600 font-normal"}>
                                  {selectedUser.role === "SUPER_ADMIN" ? "Executive Leadership" : "None Assigned"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Team Lead */}
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                            <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              Team Lead
                            </div>
                            <div className="font-semibold text-slate-900 text-xs mt-1 truncate">
                              {selectedUser.teamLead?.name ? (
                                <span>{selectedUser.teamLead.name}</span>
                              ) : (
                                <span className={selectedUser.role === "SUPER_ADMIN" ? "text-slate-500" : "text-amber-600 font-normal"}>
                                  {selectedUser.role === "SUPER_ADMIN" ? "Executive Leadership" : "None Assigned"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Workload & Performance Summary */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Workload & Velocity
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                              Task Completion Velocity
                            </span>
                            <span className="font-mono font-bold text-[#FF6200]">
                              {selectedUserStats.completionRate}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className="h-full bg-gradient-to-r from-[#FF6200] to-emerald-500 transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(0, selectedUserStats.completionRate))}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {selectedUserStats.completed} of {selectedUserStats.total} total assigned tasks closed
                          </div>
                        </div>

                        {/* 4 Stat Pills */}
                        <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2 border-t border-slate-200">
                          <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                            <div className="text-[10px] text-slate-500">Active</div>
                            <div className="font-bold text-slate-900 mt-0.5">{selectedUserStats.active}</div>
                          </div>

                          <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                            <div className="text-[10px] text-blue-600">In Review</div>
                            <div className="font-bold text-blue-600 mt-0.5">{selectedUserStats.inReview}</div>
                          </div>

                          <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                            <div
                              className={`text-[10px] ${
                                selectedUserStats.overdue > 0 ? "text-rose-600 font-bold" : "text-slate-400"
                              }`}
                            >
                              Overdue
                            </div>
                            <div
                              className={`font-bold mt-0.5 ${
                                selectedUserStats.overdue > 0 ? "text-rose-600" : "text-slate-500"
                              }`}
                            >
                              {selectedUserStats.overdue}
                            </div>
                          </div>

                          <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                            <div className="text-[10px] text-emerald-600">Completed</div>
                            <div className="font-bold text-emerald-600 mt-0.5">{selectedUserStats.completed}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Projects Association */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Assigned Projects ({selectedUserProjects.length})
                        </div>
                        {selectedUserProjects.length > 0 && (
                          <button
                            onClick={() => setModalTab("PROJECTS")}
                            className="text-xs text-[#FF6200] hover:underline font-bold cursor-pointer"
                          >
                            View all
                          </button>
                        )}
                      </div>

                      {selectedUserProjects.length === 0 ? (
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                          No projects currently associated with this member.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedUserProjects.slice(0, 4).map((p: any) => (
                            <div
                              key={p.id}
                              className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-xs font-bold text-[#FF6200] bg-[#FF6200]/10 px-1.5 py-0.5 rounded border border-[#FF6200]/20 flex-shrink-0">
                                  {p.key}
                                </span>
                                <span className="text-xs font-bold text-slate-900 truncate">{p.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap ml-2">
                                {p._count?.tasks ?? 0} tasks
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: ASSIGNED TASKS */}
                {modalTab === "TASKS" && (
                  <div className="space-y-3">
                    {/* Status Filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                      {(
                        [
                          { id: "ALL", label: `All (${selectedUserTasks.length})` },
                          { id: "ACTIVE", label: `Active (${selectedUserStats.active})` },
                          { id: "REVIEW", label: `In Review (${selectedUserStats.inReview})` },
                          { id: "OVERDUE", label: `Overdue (${selectedUserStats.overdue})` },
                          { id: "DONE", label: `Done (${selectedUserStats.completed})` },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setTaskStatusFilter(f.id)}
                          className={`px-2.5 py-1 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                            taskStatusFilter === f.id
                              ? "bg-[#FF6200] text-white shadow-sm"
                              : "bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Task Items List */}
                    {filteredTasks.length === 0 ? (
                      <div className="py-8 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <CheckCircle2 className="w-6 h-6 text-slate-400 mx-auto" />
                        <div className="text-xs font-bold text-slate-800">No tasks found</div>
                        <p className="text-[11px] text-slate-500">
                          This member has no tasks under the selected &apos;{taskStatusFilter.toLowerCase()}&apos; filter.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredTasks.map((task: any) => {
                          const statusStyle = getStatusColor(task.status);
                          const priorityStyle = getPriorityColor(task.priority);
                          const isOverdue =
                            task.status !== "DONE" && task.dueDate && new Date(task.dueDate) < new Date();

                          return (
                            <div
                              key={task.id}
                              onClick={() => {
                                onSelectTask(task.taskKey);
                                setSelectedUser(null);
                              }}
                              className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-[#FF6200]/50 hover:bg-white transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group shadow-xs"
                            >
                              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                                <span className="font-mono text-xs font-extrabold text-[#FF6200] bg-[#FF6200]/10 border border-[#FF6200]/25 px-1.5 py-0.5 rounded flex-shrink-0">
                                  {task.taskKey}
                                </span>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#FF6200] transition-colors truncate">
                                    {task.title}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                                    {task.project?.name && (
                                      <span className="text-slate-600">{task.project.name}</span>
                                    )}
                                    {task.dueDate && (
                                      <span
                                        className={`flex items-center gap-1 ${
                                          isOverdue ? "text-rose-600 font-bold" : "text-slate-500"
                                        }`}
                                      >
                                        <Clock className="w-3 h-3" />
                                        {formatDate(task.dueDate)}
                                        {isOverdue && " (Overdue)"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-center">
                                {priorityStyle && (
                                  <span
                                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${priorityStyle.bg}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
                                    <span>{priorityStyle.label}</span>
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${statusStyle.bg}`}
                                >
                                  {statusStyle.label}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: PROJECTS */}
                {modalTab === "PROJECTS" && (
                  <div className="space-y-2.5">
                    {selectedUserProjects.length === 0 ? (
                      <div className="py-8 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <FolderKanban className="w-6 h-6 text-slate-400 mx-auto" />
                        <div className="text-xs font-bold text-slate-800">No projects assigned</div>
                        <p className="text-[11px] text-slate-500">
                          This member is not currently assigned to any active workspace projects.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedUserProjects.map((project: any) => {
                          const isLeadOfProject =
                            project.leadId === selectedUser.id || project.teamLeadId === selectedUser.id;
                          const isManagerOfProject = project.managerId === selectedUser.id;

                          return (
                            <div
                              key={project.id}
                              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-[#FF6200] bg-[#FF6200]/10 px-1.5 py-0.5 rounded border border-[#FF6200]/25">
                                      {project.key}
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-900 truncate">{project.name}</h4>
                                  </div>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 flex-shrink-0">
                                  {project.status || "ACTIVE"}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200">
                                <span>Role:</span>
                                <span className="font-bold text-slate-800">
                                  {isLeadOfProject
                                    ? "Project Lead"
                                    : isManagerOfProject
                                    ? "Project Manager"
                                    : "Team Member"}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                                <span>Total Tasks:</span>
                                <span className="font-mono font-semibold text-slate-700">
                                  {project._count?.tasks ?? 0}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Portalled Invite Member Modal */}
      {mounted &&
        showInviteModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowInviteModal(false);
            }}
          >
            <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#FF6200]" />
                  <h2 className="text-sm font-bold text-slate-900">Invite Team Member</h2>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="p-5 space-y-4 text-xs">
                {statusMsg && (
                  <div
                    className={`p-3 rounded-xl border leading-relaxed ${
                      statusMsg.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-red-50 border-red-200 text-red-700"
                    }`}
                  >
                    {statusMsg.text}
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    placeholder="rahul@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Invite as Role *</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#FF6200]"
                  >
                    <option value="MEMBER">💻 Normal Member (Task execution & attendance)</option>
                    {(isSuper || isHR || isPM) && (
                      <option value="TEAM_LEAD">⚡ Team Lead (Team backlog & task distribution)</option>
                    )}
                    {(isSuper || isHR) && (
                      <option value="MANAGER">👔 Project Manager (Project management & sprint leads)</option>
                    )}
                    <option value="QA">🧪 QA Engineer (Defects & verification)</option>
                    {isSuper && (
                      <option value="SUPER_ADMIN">👑 Super Admin (Full organization control)</option>
                    )}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                  An invitation email containing a secure account setup link will be dispatched immediately.
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white font-bold transition-all shadow-[0_0_15px_rgba(255,98,0,0.3)] cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{loading ? "Sending..." : "Send Invitation"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
