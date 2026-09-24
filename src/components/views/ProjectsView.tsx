"use client";

import React, { useState } from "react";
import {
  FolderKanban,
  Plus,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  X,
  Shield,
  Briefcase,
  UserPlus,
  Trash2,
} from "lucide-react";
import { formatDate, getInitials, getAvatarGradient } from "@/lib/utils";
import { isSuperAdmin, PROJECT_ROLES, PROJECT_ROLE_LABELS, ProjectRole, normalizeProjectRole } from "@/lib/permissions";
import { ProjectMembersModal } from "@/components/modals/ProjectMembersModal";

interface ProjectsViewProps {
  projects: any[];
  users: any[];
  currentUser: any;
  onSelectProject: (id: string) => void;
  onRefreshData: () => void;
}

export function ProjectsView({
  projects,
  users,
  currentUser,
  onSelectProject,
  onRefreshData,
}: ProjectsViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [leadId, setLeadId] = useState(currentUser?.id || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected members with project roles: array of { userId: string, role: ProjectRole }
  const [selectedMembers, setSelectedMembers] = useState<{ userId: string; role: ProjectRole }[]>([]);
  const [selectedAddUserId, setSelectedAddUserId] = useState<string>("");
  const [selectedAddRole, setSelectedAddRole] = useState<ProjectRole>("DEVELOPER");

  const isUserSuperAdmin = isSuperAdmin(currentUser?.role);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!key || key.length <= 4) {
      const words = val.trim().split(/\s+/);
      if (words.length === 1 && words[0].length >= 3) {
        setKey(words[0].substring(0, 3).toUpperCase());
      } else if (words.length > 1) {
        setKey(words.map((w) => w[0]).join("").substring(0, 4).toUpperCase());
      }
    }
  };

  const handleAddMemberToProject = () => {
    if (!selectedAddUserId) return;
    if (selectedMembers.some((m) => m.userId === selectedAddUserId)) return;
    setSelectedMembers((prev) => [...prev, { userId: selectedAddUserId, role: selectedAddRole }]);
    setSelectedAddUserId("");
  };

  const handleRemoveMemberFromProject = (userId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const handleUpdateMemberRole = (userId: string, role: ProjectRole) => {
    setSelectedMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role } : m))
    );
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) {
      setError("Project name and key are required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          key: key.trim().toUpperCase(),
          description: description.trim(),
          leadId: leadId || currentUser?.id,
          startDate: startDate || null,
          endDate: endDate || null,
          members: selectedMembers,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setName("");
        setKey("");
        setDescription("");
        setSelectedMembers([]);
        setShowCreateModal(false);
        onRefreshData();
      } else {
        setError(json.error?.message || "Failed to create project");
      }
    } catch (err) {
      console.error("Create project error:", err);
      setError("Network error creating project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FolderKanban className="w-5 h-5 text-[#FF6200]" />
            <span>Projects Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isUserSuperAdmin
              ? "Global organization projects, initiatives, roadmap tracking, and member role assignment."
              : "Projects you are actively assigned to work on."}
          </p>
        </div>

        {isUserSuperAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,98,0,0.3)]"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Projects Grid or Empty State */}
      {projects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6200]/10 border border-[#FF6200]/30 flex items-center justify-center text-[#FF6200] mx-auto">
            <FolderKanban className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">
              {isUserSuperAdmin ? "No Projects Created Yet" : "No Projects Assigned Yet"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {isUserSuperAdmin
                ? "Get started by creating your organization's first project. Projects allow you to group tasks, plan sprints, and assign team members with specific roles."
                : "Your administrator will assign you to a project when required. Once assigned, your project workspace and tasks will appear here."}
            </p>
          </div>
          {isUserSuperAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,98,0,0.3)]"
            >
              + Create First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => {
            const percent = project.stats?.progressPercent || 0;
            const myRole = project.myProjectRole;

            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-[#FF6200]/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-4 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#FF6200] bg-[#FF6200]/10 px-2.5 py-1 rounded-xl border border-[#FF6200]/25">
                      {project.key}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {myRole && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
                          {PROJECT_ROLE_LABELS[myRole as ProjectRole] || myRole}
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        {project.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#FF6200] transition-colors mt-3">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                    {project.description || "No project description provided."}
                  </p>
                </div>

                {/* Assigned Members Section & Add Member Trigger */}
                <div className="pt-2">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Assigned Team ({project.members?.length || 0})</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProjectForMembers(project);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] text-[#FF6200] hover:underline font-bold transition-colors cursor-pointer"
                      title="Add member to project"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>+ Add Member</span>
                    </button>
                  </div>
                  {project.members && project.members.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {project.members.slice(0, 4).map((m: any) => (
                        <span
                          key={m.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-700 font-medium"
                          title={`${m.name} - ${m.projectRole}`}
                        >
                          <span className="truncate max-w-[80px]">{m.name}</span>
                          <span className="text-[9px] text-[#FF6200] font-mono">({m.projectRole?.substring(0, 3)})</span>
                        </span>
                      ))}
                      {project.members.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded-lg bg-slate-100 text-[9px] text-slate-500 font-medium">
                          +{project.members.length - 4} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No members assigned yet &bull; Click + Add Member</p>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-bold text-slate-900 font-mono">{percent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF6200] to-orange-400 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Bottom Metadata & Actions */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {project.lead?.avatarUrl ? (
                      <img
                        src={project.lead.avatarUrl}
                        alt={project.lead.name}
                        className="w-5 h-5 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div
                        className={`w-5 h-5 rounded-full bg-gradient-to-tr ${getAvatarGradient(project.lead?.name)} flex items-center justify-center text-[8px] font-black text-white uppercase flex-shrink-0`}
                      >
                        {getInitials(project.lead?.name)}
                      </div>
                    )}
                    <span className="truncate max-w-[100px] text-slate-700 font-medium">{project.lead?.name || "Project Lead"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProjectForMembers(project);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-all border border-slate-200 cursor-pointer"
                      title="Manage Project Members"
                    >
                      <Users className="w-3.5 h-3.5 text-[#FF6200]" />
                      <span>Members</span>
                    </button>
                    <div className="flex items-center gap-1 text-[#FF6200] font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>Tasks</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Members Management Modal */}
      {selectedProjectForMembers && (
        <ProjectMembersModal
          isOpen={Boolean(selectedProjectForMembers)}
          onClose={() => setSelectedProjectForMembers(null)}
          projectId={selectedProjectForMembers.id}
          projectName={selectedProjectForMembers.name}
          projectKey={selectedProjectForMembers.key}
          canManage={selectedProjectForMembers.canManageMembers ?? true}
          onMembersUpdated={() => {
            onRefreshData();
          }}
        />
      )}

      {/* Create Project Modal with Member Assignment */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#FF6200]/10 text-[#FF6200]">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Create New Project</h2>
                  <p className="text-[10px] text-slate-500">Assign team members with specific project roles</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Website Development"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#FF6200]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Project Key (Prefix) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. WEB"
                    value={key}
                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono uppercase focus:outline-none focus:border-[#FF6200]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Project goal, scope, and objectives..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Project Lead</label>
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#FF6200]"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Member & Project Role Assignment Section */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-semibold">
                    Assign Project Members & Roles
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Only assigned members will see this project
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedAddUserId}
                    onChange={(e) => setSelectedAddUserId(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200]"
                  >
                    <option value="">-- Select Member to Add --</option>
                    {users
                      .filter((u) => !selectedMembers.some((sm) => sm.userId === u.id))
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>

                  <select
                    value={selectedAddRole}
                    onChange={(e) => setSelectedAddRole(e.target.value as ProjectRole)}
                    className="w-full sm:w-44 bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200]"
                  >
                    {PROJECT_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {PROJECT_ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleAddMemberToProject}
                    disabled={!selectedAddUserId}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-[#FF6200] hover:text-white disabled:opacity-50 text-slate-700 font-semibold flex items-center justify-center gap-1 transition-colors border border-slate-200"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Assigned Members List */}
                {selectedMembers.length > 0 && (
                  <div className="space-y-1.5 pt-2 max-h-36 overflow-y-auto">
                    {selectedMembers.map((m) => {
                      const userObj = users.find((u) => u.id === m.userId);
                      return (
                        <div
                          key={m.userId}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{userObj?.name || "Member"}</span>
                            <span className="text-[10px] text-slate-500">({userObj?.email})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={m.role}
                              onChange={(e) => handleUpdateMemberRole(m.userId, e.target.value as ProjectRole)}
                              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-[#FF6200] font-semibold focus:outline-none"
                            >
                              {PROJECT_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {PROJECT_ROLE_LABELS[r]}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => handleRemoveMemberFromProject(m.userId)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white font-bold transition-all shadow-[0_0_15px_rgba(255,98,0,0.3)]"
                >
                  {loading ? "Creating..." : "Save Project & Members"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
