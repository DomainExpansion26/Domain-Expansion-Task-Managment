"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Users,
  UserPlus,
  Trash2,
  Shield,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  Briefcase,
} from "lucide-react";
import { getInitials, getAvatarGradient } from "@/lib/utils";
import {
  PROJECT_ROLES,
  PROJECT_ROLE_LABELS,
  ProjectRole,
  normalizeProjectRole,
} from "@/lib/permissions";

interface ProjectMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  projectKey: string;
  canManage: boolean;
  onMembersUpdated?: () => void;
}

export function ProjectMembersModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectKey,
  canManage,
  onMembersUpdated,
}: ProjectMembersModalProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [canManageMembersState, setCanManageMembersState] = useState<boolean>(canManage ?? true);
  const [selectedAddUserId, setSelectedAddUserId] = useState<string>("");
  const [selectedAddRole, setSelectedAddRole] = useState<ProjectRole>("DEVELOPER");
  const [loading, setLoading] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchProjectMembers = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      const json = await res.json();
      if (json.success) {
        setMembers(json.data.members || []);
        setAvailableUsers(json.data.availableUsers || []);
        if (typeof json.data?.canManageMembers === "boolean") {
          setCanManageMembersState(json.data.canManageMembers);
        }
      } else {
        setError(json.error?.message || "Failed to load project members");
      }
    } catch (err) {
      console.error("Error fetching project members:", err);
      setError("Network error fetching project members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      setCanManageMembersState(canManage ?? true);
      fetchProjectMembers();
      setSelectedAddUserId("");
      setSelectedAddRole("DEVELOPER");
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, projectId, canManage]);

  const effectiveCanManage = canManage || canManageMembersState;

  if (!isOpen) return null;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddUserId) {
      setError("Please select a user to add to this project.");
      return;
    }

    setAddingMember(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedAddUserId,
          role: selectedAddRole,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message || "Member added successfully.");
        setSelectedAddUserId("");
        fetchProjectMembers();
        if (onMembersUpdated) onMembersUpdated();
      } else {
        setError(json.error?.message || "Failed to add member to project");
      }
    } catch (err) {
      console.error("Add member error:", err);
      setError("Network error adding member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: ProjectRole) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message || "Role updated successfully.");
        fetchProjectMembers();
        if (onMembersUpdated) onMembersUpdated();
      } else {
        setError(json.error?.message || "Failed to update member role");
      }
    } catch (err) {
      setError("Network error updating role");
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from this project?`)) return;

    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message || "Member removed from project.");
        fetchProjectMembers();
        if (onMembersUpdated) onMembersUpdated();
      } else {
        setError(json.error?.message || "Failed to remove member");
      }
    } catch (err) {
      setError("Network error removing member");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#141414] border border-[#2E2E2E] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#F3F4F6]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FF6200]/15 text-[#FF8C42] border border-[#FF6200]/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Project Team & Member Assignment</h2>
                <span className="font-mono text-xs font-bold text-[#FF8C42] bg-[#FF6200]/10 px-2 py-0.5 rounded border border-[#FF6200]/20">
                  {projectKey}
                </span>
              </div>
              <p className="text-xs text-[#888898]">{projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#252525] text-[#888898] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Add New Member Section (Requirement #1 & #2) */}
          {effectiveCanManage && (
            <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#FF6200]" />
                  <span>Assign New / Existing Member to Project</span>
                </h3>
                <span className="text-[11px] text-[#888898]">
                  {availableUsers.length} organization user{availableUsers.length === 1 ? "" : "s"} available
                </span>
              </div>

              {availableUsers.length === 0 ? (
                <div className="p-3 rounded-xl bg-[#252525] border border-[#333] text-[#888898] italic text-center">
                  All registered organization members are currently assigned to this project. Newly registered users will appear here automatically.
                </div>
              ) : (
                <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                  <select
                    value={selectedAddUserId}
                    onChange={(e) => setSelectedAddUserId(e.target.value)}
                    className="flex-1 bg-[#141414] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6200]"
                  >
                    <option value="">-- Select Member to Add --</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) - {u.role}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedAddRole}
                    onChange={(e) => setSelectedAddRole(e.target.value as ProjectRole)}
                    className="w-full sm:w-44 bg-[#141414] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6200]"
                  >
                    {PROJECT_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {PROJECT_ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    disabled={addingMember || !selectedAddUserId}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] hover:opacity-95 text-white font-bold transition-all shadow-md shadow-[#FF6200]/20 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{addingMember ? "Adding..." : "Add Member"}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Current Assigned Members List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Assigned Team Members ({members.length})
              </h3>
              <span className="text-[11px] text-[#888898]">
                Only these members can be assigned tasks for this project
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-[#888898]">Loading project team members...</div>
            ) : members.length === 0 ? (
              <div className="py-12 text-center text-[#888898] border border-dashed border-[#2E2E2E] rounded-2xl">
                No members assigned to this project yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {members.map((m) => {
                  const u = m.user;
                  return (
                    <div
                      key={m.id || m.userId}
                      className="p-3.5 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#FF6200]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* User Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        {u?.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-10 h-10 rounded-xl object-cover border border-[#2E2E2E]"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                              u?.name
                            )} flex items-center justify-center text-xs font-black text-white uppercase border border-[#2E2E2E] flex-shrink-0`}
                          >
                            {getInitials(u?.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white truncate">{u?.name || "Member"}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#252525] text-[#888898]">
                              {u?.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#888898] truncate">
                            {u?.jobTitle || "Team Member"} &bull; {u?.email}
                          </div>
                        </div>
                      </div>

                      {/* Project Role & Actions */}
                      <div className="flex items-center gap-2 sm:self-center self-end">
                        {effectiveCanManage ? (
                          <>
                            <select
                              value={m.projectRole}
                              onChange={(e) => handleUpdateRole(m.userId, e.target.value as ProjectRole)}
                              className="bg-[#252525] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-[#FF8C42] font-semibold focus:outline-none focus:border-[#FF6200]"
                            >
                              {PROJECT_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {PROJECT_ROLE_LABELS[r]}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.userId, u?.name || "Member")}
                              title="Remove from project"
                              className="p-2 rounded-lg bg-[#252525] hover:bg-red-500/20 text-[#888898] hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="px-3 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold text-xs">
                            {PROJECT_ROLE_LABELS[m.projectRole as ProjectRole] || m.projectRole}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#2E2E2E] bg-[#1A1A1A] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#252525] hover:bg-[#303030] text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
