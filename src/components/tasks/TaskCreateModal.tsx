"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { getInitials, getAvatarGradient } from "@/lib/utils";

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: any[];
  users: any[];
  onTaskCreated: (task: any) => void;
  defaultProjectId?: string;
  defaultStatus?: string;
}

export function TaskCreateModal({
  isOpen,
  onClose,
  projects,
  users,
  onTaskCreated,
  defaultProjectId,
  defaultStatus = "TODO",
}: TaskCreateModalProps) {
  const [projectId, setProjectId] = useState(defaultProjectId || (projects[0]?.id || ""));
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

  if (!isOpen) return null;

  const currentProject = projects.find((p) => p.id === (projectId || defaultProjectId || projects[0]?.id));
  const availableSprints = currentProject?.sprints || [];

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
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#FF6200]/20 text-[#FF8C42] border border-[#FF6200]/30">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Create New Task</h2>
              <p className="text-[11px] text-[#888898]">Assign team members, set priorities, and track milestones</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#252525] text-[#888898] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Project & Issue Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Project *</label>
              {projects.length === 0 ? (
                <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
                  No projects created yet. Please create a project first.
                </div>
              ) : (
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]/60"
                >
                  {projects.map((p) => (
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
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]/60"
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
              placeholder="e.g. Implement OAuth2 login with session handling"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3.5 py-2.5 text-white placeholder-[#888898] focus:outline-none focus:border-[#FF6200]/60 font-medium"
            />
          </div>

          {/* Row 3: Description */}
          <div>
            <label className="block text-[#ACACB8] font-semibold mb-1.5">Description</label>
            <textarea
              rows={3}
              placeholder="Detailed task description, technical requirements, or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-3 text-white placeholder-[#888898] focus:outline-none focus:border-[#FF6200]/60"
            />
          </div>

          {/* Row 4: Acceptance Criteria */}
          <div>
            <label className="block text-[#ACACB8] font-semibold mb-1.5">Acceptance Criteria</label>
            <textarea
              rows={2}
              placeholder="- Verified on mobile and desktop&#10;- Unit tests pass 100%&#10;- Error boundary implemented"
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-3 text-white placeholder-[#888898] focus:outline-none focus:border-[#FF6200]/60 font-mono text-[11px]"
            />
          </div>

          {/* Row 5: Priority, Status, Due Date, Estimate */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]/60"
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
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]/60"
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
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]/60"
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
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]/60"
              />
            </div>
          </div>

          {/* Row 6: Sprint */}
          {availableSprints.length > 0 && (
            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Sprint (Optional)</label>
              <select
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]/60"
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

          {/* Row 7: Assignees (Exclude Super Admin & HR Admin) */}
          <div>
            <label className="block text-[#ACACB8] font-semibold mb-1.5">Assign Team Members</label>
            <div className="flex flex-wrap gap-2 p-2.5 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E]">
              {users
                .filter((u) => u.role !== "SUPER_ADMIN" && u.role !== "HR_ADMIN")
                .map((user) => {
                  const isSelected = assigneeIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleAssignee(user.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all ${
                        isSelected
                          ? "bg-[#FF6200] text-white font-semibold shadow-[0_0_10px_rgba(255,98,0,0.3)]"
                          : "bg-[#252525] text-[#ACACB8] hover:text-white hover:bg-[#303030]"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-gradient-to-tr ${getAvatarGradient(user.name)} flex items-center justify-center text-[7px] font-black text-white uppercase`}
                      >
                        {getInitials(user.name)}
                      </div>
                      <span>{user.name}</span>
                      <span className="text-[10px] opacity-70 font-mono">({user.role})</span>
                    </button>
                  );
                })}
              {users.filter((u) => u.role !== "SUPER_ADMIN" && u.role !== "HR_ADMIN").length === 0 && (
                <div className="text-xs text-[#888898] italic py-1 px-2">No team members available for assignment.</div>
              )}
            </div>
          </div>

          {/* Row 8: Subtasks Builder */}
          <div>
            <label className="block text-[#ACACB8] font-semibold mb-1.5">Subtasks Checklist</label>
            <div className="space-y-2">
              {subtasks.map((st, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6200]" />
                    <span className="text-white">{st}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(idx)}
                    className="text-[#888898] hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
                  className="flex-1 bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white placeholder-[#888898] focus:outline-none focus:border-[#FF6200]/60"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 py-2 rounded-lg bg-[#252525] border border-[#2E2E2E] text-white hover:bg-[#303030]"
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
              className="px-4 py-2 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E] text-xs font-semibold text-[#ACACB8] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#FF6200] to-[#FF8C42] text-white text-xs font-bold hover:opacity-95 shadow-[0_0_15px_rgba(255,98,0,0.3)] transition-all"
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
