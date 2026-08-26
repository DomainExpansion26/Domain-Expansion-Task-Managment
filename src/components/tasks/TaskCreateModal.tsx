"use client";

import React, { useState, useEffect } from "react";
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
  projects: any[];
  users: any[];
  currentUser?: any;
  onTaskCreated: (task: any) => void;
  defaultProjectId?: string;
  defaultStatus?: string;
}

export function TaskCreateModal({
  isOpen,
  onClose,
  projects,
  users,
  currentUser,
  onTaskCreated,
  defaultProjectId,
  defaultStatus = "TODO",
}: TaskCreateModalProps) {
  // Filter projects if currentUser is Team Lead (Requirement #4)
  const isSuper = isSuperAdmin(currentUser?.role);
  const userGlobalRole = (currentUser?.role || "").toUpperCase();

  const allowedProjects = React.useMemo(() => {
    if (isSuper) return projects;
    if (userGlobalRole === "TEAM_LEAD") {
      return projects.filter(
        (p) =>
          p.teamLeadId === currentUser?.id ||
          p.leadId === currentUser?.id ||
          p.managerId === currentUser?.id ||
          p.members?.some((m: any) => (m.id || m.userId) === currentUser?.id)
      );
    }
    return projects;
  }, [projects, isSuper, userGlobalRole, currentUser?.id]);

  const initialProject = defaultProjectId
    ? allowedProjects.find((p) => p.id === defaultProjectId) || allowedProjects[0]
    : allowedProjects[0];

  const [projectId, setProjectId] = useState<string>(initialProject?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [taskType, setTaskType] = useState("TASK");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState(defaultStatus);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [sprintId, setSprintId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync project ID when modal opens or defaultProjectId / allowedProjects changes
  useEffect(() => {
    if (isOpen) {
      const selected = defaultProjectId
        ? allowedProjects.find((p) => p.id === defaultProjectId) || allowedProjects[0]
        : allowedProjects[0];
      setProjectId(selected?.id || "");
      setStatus(defaultStatus || "TODO");
      setAssigneeIds([]);
      setError(null);
    }
  }, [isOpen, defaultProjectId, defaultStatus, allowedProjects]);

  if (!isOpen) return null;

  const currentProject = allowedProjects.find((p) => p.id === projectId) || projects.find((p) => p.id === projectId);
  const availableSprints = currentProject?.sprints || [];

  // Dynamically extract ONLY members belonging to the currently selected project (Requirement #3 & #4)
  const projectMembers: any[] = React.useMemo(() => {
    if (!currentProject) return [];
    const memberMap = new Map<string, any>();

    // 1. Add members explicitly assigned to project
    if (Array.isArray(currentProject.members)) {
      currentProject.members.forEach((m: any) => {
        const id = m.id || m.userId;
        if (id) {
          memberMap.set(id, {
            id,
            name: m.name || m.user?.name || "Member",
            email: m.email || m.user?.email || "",
            role: m.projectRole || m.role || "MEMBER",
            avatarUrl: m.avatarUrl || m.user?.avatarUrl,
          });
        }
      });
    }

    // 2. Include project lead / manager / team lead if specified
    if (currentProject.lead && currentProject.lead.id) {
      memberMap.set(currentProject.lead.id, {
        id: currentProject.lead.id,
        name: currentProject.lead.name,
        email: currentProject.lead.email,
        role: "TEAM_LEAD",
        avatarUrl: currentProject.lead.avatarUrl,
      });
    }
    if (currentProject.teamLead && currentProject.teamLead.id) {
      memberMap.set(currentProject.teamLead.id, {
        id: currentProject.teamLead.id,
        name: currentProject.teamLead.name,
        email: currentProject.teamLead.email,
        role: "TEAM_LEAD",
        avatarUrl: currentProject.teamLead.avatarUrl,
      });
    }
    if (currentProject.manager && currentProject.manager.id) {
      memberMap.set(currentProject.manager.id, {
        id: currentProject.manager.id,
        name: currentProject.manager.name,
        email: currentProject.manager.email,
        role: "PROJECT_MANAGER",
        avatarUrl: currentProject.manager.avatarUrl,
      });
    }

    return Array.from(memberMap.values());
  }, [currentProject]);

  const handleProjectChange = (newProjId: string) => {
    setProjectId(newProjId);
    setAssigneeIds([]); // Reset assignees to prevent cross-project invalid members
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
    if (!title.trim() || !projectId) {
      setError("Please provide a task title and select a project.");
      return;
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
          projectId,
          taskType,
          priority,
          status,
          assigneeIds,
          sprintId: sprintId || null,
          dueDate: dueDate || null,
          estimatedHours: Number(estimatedHours) || 0,
          subtasks,
        }),
      });

      const json = await res.json();

      if (json.success) {
        onTaskCreated(json.data);
        onClose();
        // Reset form
        setTitle("");
        setDescription("");
        setAcceptanceCriteria("");
        setSubtasks([]);
        setAssigneeIds([]);
      } else {
        setError(json.error?.message || "Failed to create task");
      }
    } catch (err) {
      console.error("Create task error:", err);
      setError("Network error creating task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#141414] border border-[#2E2E2E] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#F3F4F6]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FF6200]/15 text-[#FF8C42] border border-[#FF6200]/30">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create New Task</h2>
              <p className="text-xs text-[#888898]">Assign project team members, set priorities, and track milestones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#252525] text-[#888898] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Project & Issue Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-[#FF6200]" />
                <span>Project *</span>
              </label>
              {allowedProjects.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
                  No projects available. Please ask your administrator to assign you to a project.
                </div>
              ) : (
                <select
                  value={projectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-[#FF6200]"
                >
                  {allowedProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Issue Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6200]"
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
            <label className="block text-[#ACACB8] font-semibold mb-1.5">Title / Summary *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement user profile management and role assignment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200] font-medium text-sm"
            />
          </div>

          {/* Row 3: Assigned Members (Scoped strictly to Selected Project) - Requirement #3 & #4 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[#ACACB8] font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#FF6200]" />
                <span>Assign Project Member{projectMembers.length > 1 ? "s" : ""}</span>
              </label>
              <span className="text-[11px] text-[#888898]">
                {projectMembers.length} member{projectMembers.length === 1 ? "" : "s"} assigned to {currentProject?.name || "this project"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] min-h-[50px]">
              {projectMembers.length === 0 ? (
                <div className="text-[#888898] italic text-center py-2">
                  No members assigned to this project yet. Use "Manage Members" in Projects View to add members.
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
                            ? "bg-[#FF6200] text-white border-[#FF6200] shadow-md shadow-[#FF6200]/25 scale-105"
                            : "bg-[#252525] text-[#ACACB8] border-[#333] hover:text-white hover:border-[#FF6200]/50"
                        }`}
                      >
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-4 h-4 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                              member.name
                            )} flex items-center justify-center text-[7px] font-black text-white uppercase flex-shrink-0`}
                          >
                            {getInitials(member.name)}
                          </div>
                        )}
                        <span>{member.name}</span>
                        <span className="text-[10px] opacity-75 font-mono">
                          ({member.role?.substring(0, 4)})
                        </span>
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
            <label className="block text-[#ACACB8] font-semibold mb-1.5">Description</label>
            <textarea
              rows={3}
              placeholder="Detailed task description, technical requirements, or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-3 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]"
            />
          </div>

          {/* Row 5: Acceptance Criteria */}
          <div>
            <label className="block text-[#ACACB8] font-semibold mb-1.5">Acceptance Criteria</label>
            <textarea
              rows={2}
              placeholder="- Verified on desktop and mobile&#10;- Passes all permission checks&#10;- Proper error feedback displayed"
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-3 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200] font-mono text-[11px]"
            />
          </div>

          {/* Row 6: Priority, Status, Due Date, Estimate */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
              >
                <option value="CRITICAL">🔴 Critical</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">🟢 Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="BLOCKED">Blocked</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
              />
            </div>

            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Est. Hours</label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
              />
            </div>
          </div>

          {/* Row 7: Sprint (Optional) */}
          {availableSprints.length > 0 && (
            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Sprint (Optional)</label>
              <select
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
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

          {/* Row 8: Subtasks Builder */}
          <div>
            <label className="block text-[#ACACB8] font-semibold mb-1.5">Subtasks Checklist</label>
            <div className="space-y-2">
              {subtasks.map((st, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF6200]" />
                    <span className="text-white font-medium">{st}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(idx)}
                    className="text-[#888898] hover:text-red-400 p-1 transition-colors"
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
                  className="flex-1 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-4 py-2 rounded-xl bg-[#252525] border border-[#2E2E2E] text-white hover:bg-[#333] font-semibold transition-colors"
                >
                  Add Subtask
                </button>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2E2E2E]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-xs font-semibold text-[#ACACB8] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-[#FF6200]/25 transition-all"
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
