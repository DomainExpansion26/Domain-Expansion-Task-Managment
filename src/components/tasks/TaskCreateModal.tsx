"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  CheckSquare,
  AlertCircle,
  Tag,
  Layers,
  Sparkles,
  Users,
  FolderKanban,
  Check,
} from "lucide-react";
import { getInitials, getAvatarGradient } from "@/lib/utils";
import { isSuperAdmin, isTeamLead } from "@/lib/permissions";

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: any[];
  users?: any[];
  currentUser?: any;
  onTaskCreated?: (task: any) => void;
  defaultProjectId?: string;
  defaultStatus?: string;
}

export function TaskCreateModal({
  isOpen,
  onClose,
  projects = [],
  users = [],
  currentUser,
  onTaskCreated,
  defaultProjectId,
  defaultStatus = "TODO",
}: TaskCreateModalProps) {
  const safeProjects = useMemo(() => (Array.isArray(projects) ? projects : []), [projects]);
  const safeUsers = useMemo(() => (Array.isArray(users) ? users : []), [users]);

  // Filter projects if currentUser is Team Lead
  const isSuper = isSuperAdmin(currentUser?.role);
  const userGlobalRole = (currentUser?.role || "").toUpperCase();

  const allowedProjects = useMemo(() => {
    if (safeProjects.length === 0) return [];
    if (isSuper) return safeProjects;
    if (userGlobalRole === "TEAM_LEAD") {
      const leadProjects = safeProjects.filter(
        (p) =>
          p &&
          (p.teamLeadId === currentUser?.id ||
            p.leadId === currentUser?.id ||
            p.managerId === currentUser?.id ||
            (Array.isArray(p.members) &&
              p.members.some((m: any) => (m?.id || m?.userId || m?.user?.id) === currentUser?.id)))
      );
      return leadProjects.length > 0 ? leadProjects : safeProjects;
    }
    return safeProjects;
  }, [safeProjects, isSuper, userGlobalRole, currentUser?.id]);

  const initialProject = useMemo(() => {
    if (defaultProjectId) {
      return (
        allowedProjects.find((p) => p && p.id === defaultProjectId) ||
        safeProjects.find((p) => p && p.id === defaultProjectId) ||
        allowedProjects[0] ||
        safeProjects[0] ||
        null
      );
    }
    return allowedProjects[0] || safeProjects[0] || null;
  }, [defaultProjectId, allowedProjects, safeProjects]);

  const [projectId, setProjectId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [taskType, setTaskType] = useState("TASK");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState(defaultStatus || "TODO");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [accountableId, setAccountableId] = useState<string>("");
  const [sprintId, setSprintId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [category, setCategory] = useState<string>("");
  const [version, setVersion] = useState<string>("");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync project ID and form when modal opens or projects change
  useEffect(() => {
    if (isOpen) {
      const selected = defaultProjectId
        ? allowedProjects.find((p) => p && p.id === defaultProjectId) ||
          safeProjects.find((p) => p && p.id === defaultProjectId) ||
          allowedProjects[0] ||
          safeProjects[0]
        : allowedProjects[0] || safeProjects[0];

      if (selected?.id) {
        setProjectId(selected.id);
      }
      setStatus(defaultStatus || "TODO");
      setError(null);
    }
  }, [isOpen, defaultProjectId, defaultStatus, allowedProjects, safeProjects]);

  const currentProject = useMemo(() => {
    return (
      allowedProjects.find((p) => p && p.id === projectId) ||
      safeProjects.find((p) => p && p.id === projectId) ||
      initialProject ||
      null
    );
  }, [allowedProjects, safeProjects, projectId, initialProject]);

  const availableSprints = useMemo(() => {
    return Array.isArray(currentProject?.sprints) ? currentProject.sprints : [];
  }, [currentProject]);

  // Dynamically extract members belonging to project with full fallbacks
  const projectMembers: any[] = useMemo(() => {
    const memberMap = new Map<string, any>();

    if (currentProject) {
      // 1. Add members explicitly assigned to project
      if (Array.isArray(currentProject.members)) {
        currentProject.members.forEach((m: any) => {
          if (!m) return;
          const id = m.user?.id || m.userId || m.id;
          if (id) {
            memberMap.set(id, {
              id,
              name: m.user?.name || m.name || "Member",
              email: m.user?.email || m.email || "",
              role: m.projectRole || m.role || m.user?.role || "MEMBER",
              avatarUrl: m.user?.avatarUrl || m.avatarUrl,
            });
          }
        });
      }

      // 2. Include project lead / manager / team lead if specified
      if (currentProject.lead && currentProject.lead.id) {
        memberMap.set(currentProject.lead.id, {
          id: currentProject.lead.id,
          name: currentProject.lead.name || "Project Lead",
          email: currentProject.lead.email || "",
          role: "TEAM_LEAD",
          avatarUrl: currentProject.lead.avatarUrl,
        });
      }
      if (currentProject.teamLead && currentProject.teamLead.id) {
        memberMap.set(currentProject.teamLead.id, {
          id: currentProject.teamLead.id,
          name: currentProject.teamLead.name || "Team Lead",
          email: currentProject.teamLead.email || "",
          role: "TEAM_LEAD",
          avatarUrl: currentProject.teamLead.avatarUrl,
        });
      }
      if (currentProject.manager && currentProject.manager.id) {
        memberMap.set(currentProject.manager.id, {
          id: currentProject.manager.id,
          name: currentProject.manager.name || "Project Manager",
          email: currentProject.manager.email || "",
          role: "PROJECT_MANAGER",
          avatarUrl: currentProject.manager.avatarUrl,
        });
      }
    }

    // 3. Include all workspace users with their department for universal assignment
    if (safeUsers.length > 0) {
      safeUsers.forEach((u: any) => {
        if (u && u.id && !memberMap.has(u.id)) {
          memberMap.set(u.id, {
            id: u.id,
            name: u.name || "User",
            email: u.email || "",
            role: u.role || "MEMBER",
            department: u.department || "General",
            avatarUrl: u.avatarUrl,
          });
        }
      });
    }

    // 4. Fallback to current logged-in user
    if (memberMap.size === 0 && currentUser?.id) {
      memberMap.set(currentUser.id, {
        id: currentUser.id,
        name: currentUser.name || "You",
        email: currentUser.email || "",
        role: currentUser.role || "MEMBER",
        avatarUrl: currentUser.avatarUrl,
      });
    }

    return Array.from(memberMap.values());
  }, [currentProject, safeUsers, currentUser]);

  // Auto-set default accountable if not chosen
  useEffect(() => {
    if (projectMembers.length > 0 && !accountableId) {
      setAccountableId(projectMembers[0].id);
    }
  }, [projectMembers, accountableId]);

  const handleProjectChange = (newProjId: string) => {
    setProjectId(newProjId);
    setAssigneeIds([]);
    setSprintId("");
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([...subtasks, newSubtaskTitle.trim()]);
    setNewSubtaskTitle("");
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  const toggleAssignee = (userId: string) => {
    if (assigneeIds.includes(userId)) {
      setAssigneeIds(assigneeIds.filter((id) => id !== userId));
    } else {
      setAssigneeIds([...assigneeIds, userId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetProjectId = projectId || currentProject?.id || allowedProjects[0]?.id || safeProjects[0]?.id;

    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    if (!targetProjectId) {
      setError("Please select a project.");
      return;
    }

    // Resolve assignees and accountable gracefully
    let effectiveAssignees = [...assigneeIds];
    if (effectiveAssignees.length === 0) {
      if (projectMembers.length > 0) {
        effectiveAssignees = [projectMembers[0].id];
      } else if (currentUser?.id) {
        effectiveAssignees = [currentUser.id];
      }
    }

    let effectiveAccountable = accountableId;
    if (!effectiveAccountable) {
      effectiveAccountable = effectiveAssignees[0] || (currentUser?.id ? currentUser.id : "");
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          acceptanceCriteria: acceptanceCriteria.trim(),
          projectId: targetProjectId,
          taskType,
          priority,
          status,
          assigneeIds: effectiveAssignees,
          accountableId: effectiveAccountable || null,
          startDate: startDate || null,
          endDate: endDate || dueDate || null,
          dueDate: dueDate || endDate || null,
          estimatedHours: Number(estimatedHours) || 0,
          progress: Number(progress) || 0,
          category: category.trim() || null,
          version: version.trim() || null,
          sprintId: sprintId || null,
          subtasks,
        }),
      });

      const json = await res.json().catch(() => ({ success: false, error: { message: "Server response parse error" } }));

      if (json && json.success) {
        if (typeof onTaskCreated === "function") {
          onTaskCreated(json.data);
        }
        onClose();
        // Reset form
        setTitle("");
        setDescription("");
        setAcceptanceCriteria("");
        setSubtasks([]);
        setAssigneeIds([]);
        setAccountableId("");
        setStartDate("");
        setEndDate("");
        setDueDate("");
        setProgress(0);
        setCategory("");
        setVersion("");
      } else {
        setError(json?.error?.message || json?.message || "Failed to create task");
      }
    } catch (err: any) {
      console.error("Create task error:", err);
      setError("Network error creating task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FF6200]/10 text-[#FF6200] border border-[#FF6200]/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New Task</h2>
              <p className="text-xs text-slate-500">Assign project team members, set priorities, and track milestones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Project & Issue Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-[#FF6200]" />
                <span>Project *</span>
              </label>
              {allowedProjects.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  No projects available. Please create a project first or contact your administrator.
                </div>
              ) : (
                <select
                  value={projectId || allowedProjects[0]?.id || ""}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
                >
                  {allowedProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key || "PRJ"})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Issue Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              >
                <option value="TASK">📋 Task</option>
                <option value="BUG">🐛 Bug</option>
                <option value="STORY">📖 Story</option>
                <option value="FEATURE">✨ Feature</option>
                <option value="IMPROVEMENT">⚡ Improvement</option>
                <option value="SUBTASK">↳ Subtask</option>
              </select>
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Title / Summary *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement user profile management and role assignment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] font-medium text-sm"
            />
          </div>

          {/* Row 3: Assigned Members */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-700 font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#FF6200]" />
                <span>Assign Member{projectMembers.length > 1 ? "s" : ""}</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {projectMembers.length} member{projectMembers.length === 1 ? "" : "s"} available
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 min-h-[50px]">
              {projectMembers.length === 0 ? (
                <div className="text-slate-500 italic text-center py-2">
                  No members assigned to this project yet.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {projectMembers.map((member) => {
                    const isSelected = assigneeIds.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => toggleAssignee(member.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-[#FF6200] text-white border-[#FF6200] shadow-sm shadow-[#FF6200]/25 scale-105"
                            : "bg-white text-slate-700 border-slate-200 hover:text-slate-900 hover:border-[#FF6200]/50 shadow-xs"
                        }`}
                      >
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name || "Member"}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-4 h-4 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                              member.name || "User"
                            )} flex items-center justify-center text-[7px] font-black text-white uppercase flex-shrink-0`}
                          >
                            {getInitials(member.name || "User")}
                          </div>
                        )}
                        <span>{member.name || "Member"}</span>
                        {member.role && (
                          <span className="text-[10px] opacity-75 font-mono">
                            ({String(member.role).substring(0, 4)})
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Description */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Description</label>
            <textarea
              rows={3}
              placeholder="Detailed task description, technical requirements, or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
            />
          </div>

          {/* Row 5: Acceptance Criteria */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Acceptance Criteria</label>
            <textarea
              rows={2}
              placeholder="- Verified on desktop and mobile&#10;- Passes all permission checks&#10;- Proper error feedback displayed"
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] font-mono text-[11px]"
            />
          </div>

          {/* Row 6: Accountable & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                Accountable <span className="text-[#FF6200]">*</span>
              </label>
              <select
                value={accountableId || (projectMembers[0]?.id || "")}
                onChange={(e) => setAccountableId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              >
                {projectMembers.length === 0 ? (
                  <option value={currentUser?.id || ""}>{currentUser?.name || "You"}</option>
                ) : (
                  projectMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role || "Member"})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Finish / Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  setEndDate(e.target.value);
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              />
            </div>
          </div>

          {/* Row 7: Priority, Status, Est. Hours, % Complete */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              >
                <option value="CRITICAL">🔴 Critical</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">🟢 Low</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="BLOCKED">Blocked</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Est. Hours</label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">% Complete ({progress}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-[#00875A] mt-2 cursor-pointer"
              />
            </div>
          </div>

          {/* Row 7: Sprint (Optional) */}
          {availableSprints.length > 0 && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Sprint (Optional)</label>
              <select
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              >
                <option value="">No Sprint (Backlog)</option>
                {availableSprints.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Row 8: Subtasks Checklist */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Subtasks Checklist</label>
            <div className="space-y-2">
              {subtasks.map((st, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF6200]" />
                    <span className="text-slate-800 font-medium">{st}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(idx)}
                    className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add a subtask..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 font-semibold transition-colors cursor-pointer"
                >
                  Add Subtask
                </button>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white text-xs font-bold shadow-md shadow-[#FF6200]/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
