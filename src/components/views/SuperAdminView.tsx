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
} from "lucide-react";
import { MemberManageModal } from "@/components/modals/MemberManageModal";
import { ConfirmActionModal } from "@/components/modals/ConfirmActionModal";

interface SuperAdminViewProps {
  currentUser: any;
}

export function SuperAdminView({ currentUser }: SuperAdminViewProps) {
  const [activeTab, setActiveTab] = useState<"members" | "hierarchy" | "audit">("members");
  const [members, setMembers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Modals
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // New Member Form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("MEMBER");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newManagerId, setNewManagerId] = useState("");
  const [newTeamLeadId, setNewTeamLeadId] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/members");
      const json = await res.json();
      if (json.success) {
        setMembers(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/admin/audit-logs");
      const json = await res.json();
      if (json.success) {
        setAuditLogs(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchAuditLogs();
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
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
          jobTitle: newJobTitle.trim() || "Software Engineer",
          department: newDepartment.trim() || "Engineering",
          managerId: newManagerId || null,
          teamLeadId: newTeamLeadId || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        fetchMembers();
        setIsCreateModalOpen(false);
        setNewName("");
        setNewEmail("");
        setNewPassword("");
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
        fetchMembers();
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error("Deactivate error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchQuery =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === "ALL" || m.role === roleFilter;
    return matchQuery && matchRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-500/15 border-red-500/30 text-red-400 font-bold";
      case "HR_ADMIN":
        return "bg-pink-500/15 border-pink-500/30 text-pink-400 font-bold";
      case "MANAGER":
        return "bg-purple-500/15 border-purple-500/30 text-purple-400 font-bold";
      case "TEAM_LEAD":
        return "bg-blue-500/15 border-blue-500/30 text-blue-400 font-bold";
      case "QA":
        return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-bold";
      default:
        return "bg-slate-500/15 border-slate-500/30 text-slate-300";
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-red-500/15 border border-red-500/30 text-red-400 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Super Admin Portal</span>
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Centralized Organization & Member Administration
          </h1>
          <p className="text-xs text-[#888898]">
            Manage user roles, structural hierarchy, password resets, and comprehensive audit logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] hover:opacity-95 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(255,98,0,0.3)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Member</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2E2E2E] pb-3 text-xs">
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === "members"
              ? "bg-[#1A1A1A] border border-[#FF6200]/50 text-[#FF8C42]"
              : "text-[#888898] hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members Directory ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("hierarchy")}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === "hierarchy"
              ? "bg-[#1A1A1A] border border-[#FF6200]/50 text-[#FF8C42]"
              : "text-[#888898] hover:text-white"
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Org Hierarchy Mapping</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === "audit"
              ? "bg-[#1A1A1A] border border-[#FF6200]/50 text-[#FF8C42]"
              : "text-[#888898] hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: MEMBERS TABLE */}
      {activeTab === "members" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#141414] p-3 rounded-2xl border border-[#2E2E2E]">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#888898] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[#888898]">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6200]"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="HR_ADMIN">HR Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="QA">QA Engineer</option>
                <option value="MEMBER">Member</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="rounded-2xl bg-[#141414] border border-[#2E2E2E] overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-xs text-[#888898]">Loading organization members...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#2E2E2E] bg-[#1A1A1A] text-[#888898] uppercase tracking-wider font-bold text-[10px]">
                      <th className="py-3.5 px-4">Employee</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Department & Title</th>
                      <th className="py-3.5 px-4">Reporting Hierarchy</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2E2E2E]/60 text-[#ACACB8]">
                    {filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-[#1A1A1A]/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={m.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}`}
                              alt={m.name}
                              className="w-8 h-8 rounded-full border border-[#2E2E2E] object-cover"
                            />
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{m.name}</span>
                                {m.id === currentUser.id && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FF6200]/20 text-[#FF8C42] font-mono">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#888898]">{m.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] border ${getRoleBadge(m.role)}`}>
                            {m.role.replace("_", " ")}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-white font-medium">{m.jobTitle}</div>
                          <div className="text-[11px] text-[#888898]">{m.department}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 text-[11px]">
                            <div>
                              <span className="text-[#888898]">Manager: </span>
                              <span className="text-white">{m.manager?.name || "—"}</span>
                            </div>
                            <div>
                              <span className="text-[#888898]">Team Lead: </span>
                              <span className="text-white">{m.teamLead?.name || "—"}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.isActive
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-red-500/15 text-red-400"
                            }`}
                          >
                            {m.isActive ? "Active" : "Disabled"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedMember(m);
                              setIsManageModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#FF6200]/60 hover:text-white transition-colors text-[11px] font-semibold text-[#ACACB8]"
                          >
                            Manage
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

      {/* TAB 2: ORG HIERARCHY MAPPING */}
      {activeTab === "hierarchy" && (
        <div className="p-6 rounded-2xl bg-[#141414] border border-[#2E2E2E] space-y-6">
          <div>
            <h2 className="text-sm font-bold text-white mb-1">Organizational Reporting Structure</h2>
            <p className="text-xs text-[#888898]">
              Managers $\rightarrow$ Team Leads $\rightarrow$ Members reporting breakdown
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members
              .filter((m) => m.role === "MANAGER" || m.role === "SUPER_ADMIN")
              .map((manager) => {
                const teamLeadsUnder = members.filter((m) => m.manager?.id === manager.id && m.role === "TEAM_LEAD");
                const directMembers = members.filter((m) => m.manager?.id === manager.id && m.role !== "TEAM_LEAD");

                return (
                  <div key={manager.id} className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-3">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-[#2E2E2E]">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs">
                        {manager.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white">{manager.name}</div>
                        <div className="text-[10px] text-purple-400 font-mono">{manager.role.replace("_", " ")}</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="text-[10px] font-bold text-[#888898] uppercase">Team Leads ({teamLeadsUnder.length}):</div>
                      {teamLeadsUnder.length > 0 ? (
                        teamLeadsUnder.map((tl) => (
                          <div key={tl.id} className="pl-3 border-l-2 border-blue-500/50 py-1 text-slate-200">
                            ⚡ {tl.name} <span className="text-[#888898]">({tl.jobTitle})</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[#666] italic text-[11px]">No team leads assigned directly</div>
                      )}

                      <div className="text-[10px] font-bold text-[#888898] uppercase pt-2">Direct Members ({directMembers.length}):</div>
                      {directMembers.length > 0 ? (
                        directMembers.map((dm) => (
                          <div key={dm.id} className="pl-3 border-l-2 border-emerald-500/50 py-1 text-slate-200">
                            • {dm.name} <span className="text-[#888898]">({dm.role})</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[#666] italic text-[11px]">No direct members assigned</div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="rounded-2xl bg-[#141414] border border-[#2E2E2E] overflow-hidden">
          <div className="p-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
            <h2 className="text-sm font-bold text-white">System Security & Administrative Audit Trail</h2>
            <p className="text-xs text-[#888898]">Immutable log of sensitive administrative actions</p>
          </div>

          <div className="divide-y divide-[#2E2E2E]/60 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-[#1A1A1A]/40 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#FF6200]/15 text-[#FF8C42] font-mono text-[10px] font-bold">
                      {log.action}
                    </span>
                    <span className="text-white font-semibold">
                      Executed by {log.user?.name || "System"} ({log.user?.role || "SYSTEM"})
                    </span>
                  </div>
                  {log.detailsJson && (
                    <div className="text-[11px] font-mono text-[#888898] bg-[#0D0D0D] p-2 rounded-lg border border-[#2E2E2E]/50">
                      {log.detailsJson}
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-[#888898] whitespace-nowrap font-mono">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Super Admin Member Manage Modal */}
      {isManageModalOpen && selectedMember && (
        <MemberManageModal
          isOpen={isManageModalOpen}
          onClose={() => {
            setIsManageModalOpen(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          allMembers={members}
          onMemberUpdated={fetchMembers}
          onDeleteMember={(id, name) => setDeleteConfirm({ id, name })}
        />
      )}

      {/* Create New Member Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A] flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Create New Organization Member</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded hover:bg-[#252525] text-[#888898]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="p-6 space-y-4 text-xs">
              {createError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#ACACB8] font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                  />
                </div>
                <div>
                  <label className="block text-[#ACACB8] font-semibold mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#ACACB8] font-semibold mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                  />
                </div>
                <div>
                  <label className="block text-[#ACACB8] font-semibold mb-1">Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#FF6200]/50 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-[#FF6200]"
                  >
                    <option value="MEMBER">💻 Member</option>
                    <option value="QA">🧪 QA Engineer</option>
                    <option value="TEAM_LEAD">⚡ Team Lead</option>
                    <option value="MANAGER">👔 Manager</option>
                    <option value="HR_ADMIN">🏢 HR Admin</option>
                    <option value="SUPER_ADMIN">👑 Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#ACACB8] font-semibold mb-1">Job Title</label>
                  <input
                    type="text"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    placeholder="e.g. QA Automation Lead"
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                  />
                </div>
                <div>
                  <label className="block text-[#ACACB8] font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="e.g. Quality Assurance"
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white font-bold transition-all shadow-[0_0_15px_rgba(255,98,0,0.3)]"
                >
                  {actionLoading ? "Creating..." : "Create Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deactivation */}
      {deleteConfirm && (
        <ConfirmActionModal
          isOpen={Boolean(deleteConfirm)}
          title="Deactivate Member Account"
          message={`Are you sure you want to deactivate ${deleteConfirm.name}? They will lose access to login immediately.`}
          confirmLabel="Deactivate"
          onConfirm={handleDeleteMember}
          onClose={() => setDeleteConfirm(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
