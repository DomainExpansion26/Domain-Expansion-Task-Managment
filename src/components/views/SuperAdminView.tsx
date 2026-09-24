"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Key,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  Network,
  Activity,
  AlertTriangle,
  UserCheck,
  Eye,
  EyeOff,
  Database,
  Download,
  RotateCcw,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Building2,
  Briefcase,
  ChevronRight,
  ExternalLink,
  Lock,
} from "lucide-react";
import { MemberManageModal } from "@/components/modals/MemberManageModal";
import { ConfirmActionModal } from "@/components/modals/ConfirmActionModal";
import { formatDate, formatDateTime } from "@/lib/utils";

interface SuperAdminViewProps {
  currentUser: any;
}

export function SuperAdminView({ currentUser }: SuperAdminViewProps) {
  const [activeTab, setActiveTab] = useState<
    "members" | "nda" | "backups" | "policies" | "hierarchy" | "audit"
  >("members");

  const [members, setMembers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [ndaRecords, setNdaRecords] = useState<any[]>([]);
  const [ndaTemplate, setNdaTemplate] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [ndaFilter, setNdaFilter] = useState("ALL");

  // Modals & Drawers
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [viewProfileMember, setViewProfileMember] = useState<any | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // NDA Edit Modal
  const [isNdaModalOpen, setIsNdaModalOpen] = useState(false);
  const [ndaEditTitle, setNdaEditTitle] = useState("");
  const [ndaEditVersion, setNdaEditVersion] = useState("");
  const [ndaEditContent, setNdaEditContent] = useState("");
  const [selectedMemberNdaHistory, setSelectedMemberNdaHistory] = useState<any | null>(null);

  // Policy Modal
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyTitle, setPolicyTitle] = useState("");
  const [policyCategory, setPolicyCategory] = useState("GENERAL");
  const [policyVersion, setPolicyVersion] = useState("1.0");
  const [policyContent, setPolicyContent] = useState("");

  // New Member Form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newRole, setNewRole] = useState("MEMBER");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newManagerId, setNewManagerId] = useState("");
  const [newTeamLeadId, setNewTeamLeadId] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/admin/members");
      const json = await res.json();
      if (json.success) {
        setMembers(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/admin/audit-logs");
      const json = await res.json();
      if (json.success) {
        const logList = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.data?.logs)
          ? json.data.logs
          : [];
        setAuditLogs(logList);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/admin/backups");
      const json = await res.json();
      if (json.success) {
        const backupList = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.data?.backups)
          ? json.data.backups
          : [];
        setBackups(backupList);
      }
    } catch (err) {
      console.error("Failed to fetch backups:", err);
    }
  };

  const fetchPolicies = async () => {
    try {
      const res = await fetch("/api/company-policies");
      const json = await res.json();
      if (json.success) {
        const policyList = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.data?.policies)
          ? json.data.policies
          : [];
        setPolicies(policyList);
      }
    } catch (err) {
      console.error("Failed to fetch policies:", err);
    }
  };

  const fetchNdaData = async () => {
    try {
      const [recordsRes, templateRes] = await Promise.all([
        fetch("/api/nda/records"),
        fetch("/api/nda/template"),
      ]);
      const recordsJson = await recordsRes.json();
      const templateJson = await templateRes.json();

      if (recordsJson.success) {
        const recordList = Array.isArray(recordsJson.data)
          ? recordsJson.data
          : Array.isArray(recordsJson.data?.members)
          ? recordsJson.data.members
          : [];
        setNdaRecords(recordList);
      }
      if (templateJson.success && templateJson.data) {
        setNdaTemplate(templateJson.data);
        setNdaEditTitle(templateJson.data.title || "Domain Expansion NDA");
        setNdaEditVersion(templateJson.data.version || "v1.0");
        setNdaEditContent(templateJson.data.content || "");
      }
    } catch (err) {
      console.error("Failed to fetch NDA data:", err);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchMembers(),
        fetchAuditLogs(),
        fetchBackups(),
        fetchPolicies(),
        fetchNdaData(),
      ]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword) {
      setCreateError("Name, email, and password are required.");
      return;
    }

    setActionLoading(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          role: newRole,
          jobTitle: newJobTitle.trim() || undefined,
          department: newDepartment.trim() || undefined,
          managerId: newManagerId || null,
          teamLeadId: newTeamLeadId || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        await Promise.all([fetchMembers(), fetchNdaData(), fetchAuditLogs()]);
        setIsCreateModalOpen(false);
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewJobTitle("");
        setNewDepartment("");
        setNewManagerId("");
        setNewTeamLeadId("");
      } else {
        setCreateError(json.error?.message || "Failed to create member");
      }
    } catch (err) {
      setCreateError("Network error creating member");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/members/${deleteConfirm.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await Promise.all([fetchMembers(), fetchAuditLogs()]);
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error("Deactivate error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/backups", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        await fetchBackups();
        alert("Database snapshot created and verified successfully!");
      } else {
        alert(json.error?.message || "Failed to create backup snapshot");
      }
    } catch (err) {
      console.error("Backup creation error:", err);
      alert("Network error triggering backup");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreConfirm) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/backups/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: restoreConfirm }),
      });
      const json = await res.json();
      if (json.success) {
        alert("Database restore completed successfully. All records restored.");
        setRestoreConfirm(null);
        await Promise.all([fetchMembers(), fetchBackups(), fetchAuditLogs()]);
      } else {
        alert(json.error?.message || "Failed to restore backup");
      }
    } catch (err) {
      console.error("Backup restore error:", err);
      alert("Network error executing backup restoration");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishNda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ndaEditTitle.trim() || !ndaEditVersion.trim() || !ndaEditContent.trim()) {
      alert("Title, version, and terms content are required.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/nda/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ndaEditTitle.trim(),
          version: ndaEditVersion.trim(),
          content: ndaEditContent.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(`New NDA version (${ndaEditVersion}) published! Members will be prompted upon login.`);
        setIsNdaModalOpen(false);
        await Promise.all([fetchNdaData(), fetchAuditLogs()]);
      } else {
        alert(json.error?.message || "Failed to publish NDA version");
      }
    } catch (err) {
      console.error("Publish NDA error:", err);
      alert("Network error publishing NDA");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyTitle.trim() || !policyContent.trim()) {
      alert("Policy title and content are required.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/company-policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: policyTitle.trim(),
          category: policyCategory,
          version: policyVersion.trim() || "1.0",
          content: policyContent.trim(),
          isPublished: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await Promise.all([fetchPolicies(), fetchAuditLogs()]);
        setIsPolicyModalOpen(false);
        setPolicyTitle("");
        setPolicyContent("");
      } else {
        alert(json.error?.message || "Failed to save policy");
      }
    } catch (err) {
      console.error("Save policy error:", err);
      alert("Network error saving policy");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchQuery =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === "ALL" || m.role === roleFilter;
    const matchNda =
      ndaFilter === "ALL"
        ? true
        : ndaFilter === "ACCEPTED"
        ? m.ndaAccepted
        : !m.ndaAccepted;
    return matchQuery && matchRole && matchNda;
  });

  const acceptedCount = members.filter((m) => m.ndaAccepted).length;
  const pendingCount = members.length - acceptedCount;
  const complianceRate = members.length > 0 ? Math.round((acceptedCount / members.length) * 100) : 100;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-slate-800 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-50 border border-orange-200 text-[#FF6200] flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Super Admin Master Control</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              White Theme Active
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Administrative Management & Compliance Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete centralized management: Members, Reporting Hierarchy, Mandatory NDA Compliance, Database Snapshots, and Audit Logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCreateBackup}
            disabled={actionLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-[#FF6200]" />
            <span>Snapshot DB</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white text-xs font-bold transition-all shadow-md shadow-[#FF6200]/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveTab("members")}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "members"
              ? "bg-orange-50 text-[#FF6200] border border-orange-200 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members Directory ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("nda")}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "nda"
              ? "bg-orange-50 text-[#FF6200] border border-orange-200 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>NDA & Compliance ({complianceRate}%)</span>
        </button>

        <button
          onClick={() => setActiveTab("backups")}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "backups"
              ? "bg-orange-50 text-[#FF6200] border border-orange-200 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database & Backups ({backups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("policies")}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "policies"
              ? "bg-orange-50 text-[#FF6200] border border-orange-200 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Company Policies ({policies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("hierarchy")}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "hierarchy"
              ? "bg-orange-50 text-[#FF6200] border border-orange-200 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Reporting Structure</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "audit"
              ? "bg-orange-50 text-[#FF6200] border border-orange-200 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: MEMBERS DIRECTORY (TABLE AS SPECIFIED IN USER PROMPT)
          Member | Department | Designation | Reporting Manager | Team Lead | Status | NDA | Actions
      ======================================================== */}
      {activeTab === "members" && (
        <div className="space-y-4">
          {/* Summary & Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search member, email, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#FF6200]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span>Role:</span>
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-[#FF6200]"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="HR_ADMIN">HR Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="QA">QA Engineer</option>
                <option value="MEMBER">Member</option>
              </select>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
                <span>NDA:</span>
              </div>
              <select
                value={ndaFilter}
                onChange={(e) => setNdaFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-[#FF6200]"
              >
                <option value="ALL">All NDA States</option>
                <option value="ACCEPTED">Accepted Only</option>
                <option value="PENDING">Pending Only</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-500">Loading members directory...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500">No members matched the filter criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">Reporting Manager</th>
                      <th className="py-3 px-4">Team Lead</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">NDA</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Member */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={m.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}`}
                              alt={m.name}
                              className="w-8 h-8 rounded-full border border-slate-200 object-cover flex-shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{m.name}</span>
                                {m.id === currentUser?.id && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-100 text-[#FF6200] font-mono font-bold">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">{m.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800">{m.department || "General"}</span>
                        </td>

                        {/* Designation & Role */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{m.jobTitle || "Team Member"}</div>
                          <span className="text-[10px] text-orange-600 font-mono font-bold">
                            {m.role?.replace("_", " ")}
                          </span>
                        </td>

                        {/* Reporting Manager */}
                        <td className="py-3 px-4">
                          {m.manager ? (
                            <span className="font-medium text-slate-800">{m.manager.name}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                          )}
                        </td>

                        {/* Team Lead */}
                        <td className="py-3 px-4">
                          {m.teamLead ? (
                            <span className="font-medium text-slate-800">{m.teamLead.name}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                          )}
                        </td>

                        {/* Account Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              m.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${m.isActive ? "bg-emerald-500" : "bg-red-500"}`}
                            />
                            <span>{m.isActive ? "Active" : "Suspended"}</span>
                          </span>
                        </td>

                        {/* NDA Status */}
                        <td className="py-3 px-4">
                          {m.ndaAccepted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{m.ndaVersionAccepted || "Accepted"}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Profile */}
                            <button
                              onClick={() => setViewProfileMember(m)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="View full profile details"
                            >
                              View
                            </button>

                            {/* Edit / Manage */}
                            <button
                              onClick={() => {
                                setSelectedMember(m);
                                setIsManageModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#FF6200] border border-orange-200 text-[11px] font-bold transition-colors cursor-pointer"
                              title="Edit role, manager, lead, department and status"
                            >
                              Manage
                            </button>

                            {/* Deactivate / Remove */}
                            {m.id !== currentUser?.id && (
                              <button
                                onClick={() => setDeleteConfirm({ id: m.id, name: m.name })}
                                className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Deactivate member account"
                              >
                                Deactivate
                              </button>
                            )}
                          </div>
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

      {/* ========================================================
          TAB 2: MANDATORY NDA & COMPLIANCE SECTION
      ======================================================== */}
      {activeTab === "nda" && (
        <div className="space-y-6">
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Compliance Rate</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{complianceRate}%</div>
              <span className="text-[11px] text-slate-400">Total authorized portal users</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Signed & Accepted</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{acceptedCount}</div>
              <span className="text-[11px] text-emerald-600 font-medium">Active compliant members</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Pending Signatures</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</div>
              <span className="text-[11px] text-slate-400">Blocked until accepted</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Active NDA Version</span>
                <div className="text-xl font-black text-[#FF6200] mt-0.5">
                  {ndaTemplate?.version || "v1.0"}
                </div>
              </div>
              <button
                onClick={() => setIsNdaModalOpen(true)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#FF6200] border border-orange-200 text-xs font-bold transition-all text-center cursor-pointer"
              >
                Edit & Publish NDA
              </button>
            </div>
          </div>

          {/* Compliance Records Table */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden space-y-0">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Member NDA Compliance Records</h2>
                <p className="text-xs text-slate-500">
                  Track acceptance date, time, and version for every member of Domain Expansion
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Member ID</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">NDA Status</th>
                    <th className="py-3 px-4">Acceptance Date & Time</th>
                    <th className="py-3 px-4">NDA Version</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {ndaRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">No member compliance records found</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Records will be listed here as members join and accept the NDA</p>
                      </td>
                    </tr>
                  ) : (
                    ndaRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{r.name}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{r.email}</td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">{r.employeeId || "—"}</td>
                        <td className="py-3 px-4">{r.department || "General"}</td>
                        <td className="py-3 px-4">{r.designation || r.role || "Member"}</td>
                        <td className="py-3 px-4">
                          {r.ndaStatus === "Accepted" || r.ndaAccepted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Accepted</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {r.acceptanceDate ? formatDateTime(r.acceptanceDate) : "—"}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#FF6200]">{r.ndaVersion || "—"}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.accountStatus === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {r.accountStatus || "ACTIVE"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedMemberNdaHistory(r)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            History
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: DATABASE BACKUP & RESTORE RECOVERY
      ======================================================== */}
      {activeTab === "backups" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-5 rounded-2xl bg-orange-50/70 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#FF6200]" />
                <span>Zero Data Loss & Database Recovery Protection</span>
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Before schema modifications, updates, or sensitive migrations, the system automatically takes full database snapshots.
                Super Admin can also generate timestamped manual snapshots and restore to previous safe states.
              </p>
            </div>
            <button
              onClick={handleCreateBackup}
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white text-xs font-bold transition-all shadow-md shadow-[#FF6200]/20 flex items-center gap-2 cursor-pointer flex-shrink-0 disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              <span>{actionLoading ? "Generating..." : "Create Manual Snapshot Now"}</span>
            </button>
          </div>

          {/* Backup History Table */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Database Snapshot Records & History
                </h3>
                <span className="text-[11px] text-slate-500">
                  {backups.length} snapshots available for point-in-time rollback
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-4">Backup Filename</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Type / Version</th>
                    <th className="py-3 px-4">Records Preserved</th>
                    <th className="py-3 px-4">File Size</th>
                    <th className="py-3 px-4">Integrity Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {backups.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">No database snapshots recorded yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Create your first timestamped snapshot to ensure instant rollback capability</p>
                        <button
                          onClick={handleCreateBackup}
                          disabled={actionLoading}
                          className="px-4 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#FF6200] border border-orange-200 text-xs font-bold transition-all cursor-pointer"
                        >
                          Generate Snapshot Now
                        </button>
                      </td>
                    </tr>
                  ) : (
                    backups.map((b: any) => (
                      <tr key={b.filename || b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.filename}</td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {b.timestamp ? formatDateTime(b.timestamp) : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] font-bold text-slate-700">
                            {b.tag || b.version || "SNAPSHOT"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {(b.totalRecords ?? b.recordCount ?? 0).toLocaleString()} records
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {b.sizeBytes ? Math.round(b.sizeBytes / 1024) : (b.sizeKb ?? 0)} KB
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setRestoreConfirm(b.filename)}
                            className="px-3 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#FF6200] border border-orange-200 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Restore Snapshot
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: COMPANY POLICIES
      ======================================================== */}
      {activeTab === "policies" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Company Policies & Compliance Documents</h2>
              <p className="text-xs text-slate-500">
                Create, update, and publish official corporate policies and maintain version histories
              </p>
            </div>
            <button
              onClick={() => setIsPolicyModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white text-xs font-bold transition-all shadow-md shadow-[#FF6200]/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish New Policy</span>
            </button>
          </div>

          {policies.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Company Policies Published</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Define and publish corporate policies such as Information Security, Code of Conduct, and Acceptable Use.
              </p>
              <button
                onClick={() => setIsPolicyModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white text-xs font-bold transition-all shadow-md shadow-[#FF6200]/20 inline-flex items-center gap-1.5 cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Publish New Policy</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {policies.map((p) => (
                <div key={p.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-orange-50 text-[#FF6200] border border-orange-200">
                      {p.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400">v{p.version}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{p.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{p.content}</p>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                    <span>Effective: {formatDate(p.effectiveDate || p.updatedAt || p.createdAt)}</span>
                    <span className="text-emerald-600 font-bold">{p.isPublished !== false ? "Published" : "Draft"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 5: ORGANIZATIONAL REPORTING HIERARCHY
      ======================================================== */}
      {activeTab === "hierarchy" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-0.5">Organizational Reporting Structure</h2>
            <p className="text-xs text-slate-500">
              Clear hierarchy: Reporting Managers $\rightarrow$ Team Leads $\rightarrow$ Members
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members
              .filter((m) => m.role === "MANAGER" || m.role === "SUPER_ADMIN")
              .map((manager) => {
                const teamLeadsUnder = members.filter(
                  (m) => m.manager?.id === manager.id && m.role === "TEAM_LEAD"
                );
                const directMembers = members.filter(
                  (m) => m.manager?.id === manager.id && m.role !== "TEAM_LEAD"
                );

                return (
                  <div key={manager.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                        {manager.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{manager.name}</div>
                        <div className="text-[10px] text-purple-600 font-mono font-bold">
                          {manager.role.replace("_", " ")}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">
                        Team Leads ({teamLeadsUnder.length}):
                      </div>
                      {teamLeadsUnder.length > 0 ? (
                        teamLeadsUnder.map((tl) => (
                          <div key={tl.id} className="pl-3 border-l-2 border-blue-400 py-1 text-slate-800 font-medium">
                            ⚡ {tl.name} {tl.jobTitle && <span className="text-slate-500 text-[11px]">({tl.jobTitle})</span>}
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 italic text-[11px]">No team leads assigned directly</div>
                      )}

                      <div className="text-[10px] font-bold text-slate-500 uppercase pt-2">
                        Direct Members ({directMembers.length}):
                      </div>
                      {directMembers.length > 0 ? (
                        directMembers.map((dm) => (
                          <div key={dm.id} className="pl-3 border-l-2 border-emerald-400 py-1 text-slate-800">
                            • {dm.name} <span className="text-slate-500 text-[11px]">({dm.role})</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 italic text-[11px]">No direct members assigned</div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 6: AUDIT TRAIL
      ======================================================== */}
      {activeTab === "audit" && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-bold text-slate-900">System Security & Administrative Audit Trail</h2>
            <p className="text-xs text-slate-500">
              Immutable log of all user registrations, status updates, role assignments, NDA signatures, and backups
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Details / Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No security audit events recorded yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Critical operations and administrative actions will be logged automatically</p>
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{log.user?.name || "System"}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {log.entityType}: <span className="font-mono text-slate-500">{log.entityId?.substring(0, 8)}...</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600 font-mono text-[11px]">
                        {log.details || log.metadata ? JSON.stringify(log.details || log.metadata) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: VIEW MEMBER PROFILE DRAWER / MODAL
      ======================================================== */}
      {viewProfileMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-800">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#FF6200]" />
                <span>Member Profile Details</span>
              </h2>
              <button
                onClick={() => setViewProfileMember(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-4">
                <img
                  src={
                    viewProfileMember.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(viewProfileMember.name)}`
                  }
                  alt={viewProfileMember.name}
                  className="w-16 h-16 rounded-2xl border border-slate-200 object-cover"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{viewProfileMember.name}</h3>
                  <div className="text-slate-500 font-mono text-[11px]">{viewProfileMember.email}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-orange-50 border border-orange-200 text-[#FF6200] font-mono font-bold text-[10px]">
                      {viewProfileMember.role?.replace("_", " ")}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        viewProfileMember.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {viewProfileMember.isActive ? "Active" : "Suspended"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Department</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                    {viewProfileMember.department || "General"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Designation</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                    {viewProfileMember.jobTitle || "Team Member"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Reporting Manager</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                    {viewProfileMember.manager?.name || "Direct (None)"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Team Lead</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                    {viewProfileMember.teamLead?.name || "Direct (None)"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Joining Date</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                    {viewProfileMember.joiningDate ? formatDate(viewProfileMember.joiningDate) : "—"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">NDA Status</span>
                  <span
                    className={`font-bold text-xs mt-0.5 block ${
                      viewProfileMember.ndaAccepted ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {viewProfileMember.ndaAccepted
                      ? `Accepted (${viewProfileMember.ndaVersionAccepted || "v1.0"})`
                      : "Pending Acceptance"}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setViewProfileMember(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: MEMBER NDA ACCEPTANCE HISTORY
      ======================================================== */}
      {selectedMemberNdaHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-800">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF6200]" />
                <span>NDA Acceptance History & Audit</span>
              </h2>
              <button
                onClick={() => setSelectedMemberNdaHistory(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-sm font-bold text-slate-900">{selectedMemberNdaHistory.name}</div>
                <div className="text-slate-500 font-mono text-[11px]">{selectedMemberNdaHistory.email}</div>
                <div className="text-[11px] text-slate-600">
                  {selectedMemberNdaHistory.department} &bull; {selectedMemberNdaHistory.designation}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700 text-xs block">Acceptance Timeline Record:</span>
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800">
                      Version: {selectedMemberNdaHistory.ndaVersion}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 font-mono text-[10px] font-bold">
                      {selectedMemberNdaHistory.ndaStatus}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Accepted On:{" "}
                    <strong className="text-slate-900">
                      {selectedMemberNdaHistory.acceptanceDate !== "—"
                        ? `${selectedMemberNdaHistory.acceptanceDate} at ${selectedMemberNdaHistory.acceptanceTime}`
                        : "Pending First Login Acceptance"}
                    </strong>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Agreement Type: Domain Expansion Confidentiality & Non-Disclosure Agreement
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedMemberNdaHistory(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT & PUBLISH NDA TEMPLATE
      ======================================================== */}
      {isNdaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-800">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF6200]" />
                <span>Manage & Publish NDA Agreement</span>
              </h2>
              <button
                onClick={() => setIsNdaModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishNda} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Agreement Title</label>
                  <input
                    type="text"
                    required
                    value={ndaEditTitle}
                    onChange={(e) => setNdaEditTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Version Number (e.g. v2.0)</label>
                  <input
                    type="text"
                    required
                    value={ndaEditVersion}
                    onChange={(e) => setNdaEditVersion(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-[#FF6200]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Agreement Terms & Conditions</label>
                <textarea
                  rows={14}
                  required
                  value={ndaEditContent}
                  onChange={(e) => setNdaEditContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-[11px] leading-relaxed">
                <strong>Super Admin Notice:</strong> Publishing a new version will update the mandatory NDA requirement. Any member who has not accepted this latest version will be redirected to the NDA agreement screen upon their next access.
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNdaModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white font-bold transition-all shadow-md shadow-[#FF6200]/20 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Publishing..." : "Publish Agreement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE COMPANY POLICY
      ======================================================== */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-800">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#FF6200]" />
                <span>Publish Company Policy</span>
              </h2>
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Policy Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Information Security & Device Usage"
                  value={policyTitle}
                  onChange={(e) => setPolicyTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={policyCategory}
                    onChange={(e) => setPolicyCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                  >
                    <option value="GENERAL">General Policy</option>
                    <option value="SECURITY">Security & Compliance</option>
                    <option value="HR">HR & Workplace</option>
                    <option value="IT">IT & Access</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Version</label>
                  <input
                    type="text"
                    required
                    value={policyVersion}
                    onChange={(e) => setPolicyVersion(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Policy Details & Text *</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Enter the official policy requirements and rules..."
                  value={policyContent}
                  onChange={(e) => setPolicyContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white font-bold transition-all shadow-md shadow-[#FF6200]/20 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Publishing..." : "Publish Policy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD NEW MEMBER
      ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-800">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#FF6200]" />
                <span>Create New Organization Member</span>
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 mx-6 mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMember} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-3 pr-9 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#FF6200]"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="TEAM_LEAD">Team Lead</option>
                    <option value="MANAGER">Manager</option>
                    <option value="QA">QA Engineer</option>
                    <option value="HR_ADMIN">HR Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Dev"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Reporting Manager</label>
                  <select
                    value={newManagerId}
                    onChange={(e) => setNewManagerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                  >
                    <option value="">None (Top-Level)</option>
                    {members
                      .filter((m) => m.role === "SUPER_ADMIN" || m.role === "MANAGER")
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Team Lead</label>
                  <select
                    value={newTeamLeadId}
                    onChange={(e) => setNewTeamLeadId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                  >
                    <option value="">None</option>
                    {members
                      .filter(
                        (m) =>
                          m.role === "SUPER_ADMIN" || m.role === "MANAGER" || m.role === "TEAM_LEAD"
                      )
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white font-bold transition-all shadow-md shadow-[#FF6200]/20 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Creating..." : "Create Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Management Modal */}
      {selectedMember && (
        <MemberManageModal
          isOpen={isManageModalOpen}
          onClose={() => {
            setIsManageModalOpen(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          allMembers={members}
          onMemberUpdated={async () => {
            await Promise.all([fetchMembers(), fetchNdaData(), fetchAuditLogs()]);
          }}
          onDeleteMember={(id, name) => {
            setDeleteConfirm({ id, name });
          }}
        />
      )}

      {/* Confirmation Modal for Member Deactivation */}
      {deleteConfirm && (
        <ConfirmActionModal
          isOpen={Boolean(deleteConfirm)}
          title="Deactivate Member Account"
          message={`Are you sure you want to deactivate ${deleteConfirm.name}? They will immediately lose login access to the portal.`}
          confirmLabel="Deactivate Account"
          isDestructive={true}
          loading={actionLoading}
          onConfirm={handleDeleteMember}
          onClose={() => setDeleteConfirm(null)}
        />
      )}

      {/* Confirmation Modal for Backup Restore */}
      {restoreConfirm && (
        <ConfirmActionModal
          isOpen={Boolean(restoreConfirm)}
          title="Confirm Database Snapshot Restoration"
          message={`Are you sure you want to restore snapshot "${restoreConfirm}"? This will rollback the database state to the exact records preserved in that snapshot. This action cannot be undone.`}
          confirmLabel="Restore Database"
          isDestructive={true}
          loading={actionLoading}
          onConfirm={handleRestoreBackup}
          onClose={() => setRestoreConfirm(null)}
        />
      )}
    </div>
  );
}
