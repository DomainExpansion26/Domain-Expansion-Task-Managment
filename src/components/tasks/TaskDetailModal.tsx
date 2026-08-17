"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Paperclip,
  Activity as ActivityIcon,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Edit2,
  Check,
  User,
  Tag,
  Layers,
  Network,
} from "lucide-react";
import { getPriorityColor, getStatusColor, getTypeIcon, formatDate, formatDateTime } from "@/lib/utils";
import { TaskRelationsModal } from "@/components/modals/TaskRelationsModal";

interface TaskDetailModalProps {
  taskKey: string;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: () => void;
  users: any[];
  currentUser: any;
}

export function TaskDetailModal({
  taskKey,
  isOpen,
  onClose,
  onTaskUpdated,
  users,
  currentUser,
}: TaskDetailModalProps) {
  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"COMMENTS" | "ACTIVITY" | "ATTACHMENTS">("COMMENTS");
  const [newComment, setNewComment] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isRelationsOpen, setIsRelationsOpen] = useState(false);

  const fetchTaskDetails = async () => {
    if (!taskKey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskKey}`);
      const json = await res.json();
      if (json.success) {
        setTask(json.data);
        setTitleInput(json.data.title);
        setDescInput(json.data.description || "");
      }
    } catch (err) {
      console.error("Failed to load task details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskKey) {
      fetchTaskDetails();
      setAiSummary(null);
    }
  }, [isOpen, taskKey]);

  if (!isOpen) return null;

  const handleUpdateField = async (fields: Record<string, any>) => {
    try {
      const res = await fetch(`/api/tasks/${taskKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const json = await res.json();
      if (json.success) {
        setTask((prev: any) => ({ ...prev, ...json.data }));
        if (onTaskUpdated) onTaskUpdated();
        fetchTaskDetails();
      }
    } catch (err) {
      console.error("Failed to update task field:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${taskKey}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      const json = await res.json();
      if (json.success) {
        setNewComment("");
        fetchTaskDetails();
      }
    } catch (err) {
      console.error("Add comment error:", err);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${taskKey}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSubtask }),
      });
      const json = await res.json();
      if (json.success) {
        setNewSubtask("");
        fetchTaskDetails();
      }
    } catch (err) {
      console.error("Add subtask error:", err);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      await fetch(`/api/tasks/${taskKey}/subtasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskId, completed }),
      });
      fetchTaskDetails();
    } catch (err) {
      console.error("Toggle subtask error:", err);
    }
  };

  const handleAISummarize = async () => {
    setIsSummarizing(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Summarize task ${task.taskKey}: ${task.title}. Provide key context, blocked status, subtasks progress, and current assignee.`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAiSummary(json.data.message);
      }
    } catch (err) {
      console.error("AI summary error:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (loading || !task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
        <div className="p-8 rounded-2xl bg-[#141414] border border-[#2E2E2E] text-xs text-[#888898] flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#FF6200] border-t-transparent rounded-full animate-spin" />
          <span>Loading {taskKey}...</span>
        </div>
      </div>
    );
  }

  const priority = getPriorityColor(task.priority);
  const status = getStatusColor(task.status);
  const typeInfo = getTypeIcon(task.taskType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Key Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-black text-white bg-[#FF6200] px-3 py-1 rounded-lg shadow-[0_0_15px_rgba(255,98,0,0.3)]">
              {task.taskKey}
            </span>
            <span className="text-xs text-[#888898]">in {task.project?.name}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-[#252525] text-slate-300 font-mono">
              {typeInfo.symbol} {typeInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Relations Button */}
            <button
              onClick={() => setIsRelationsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] hover:bg-[#303030] text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              <Network className="w-3.5 h-3.5 text-[#FF8C42]" />
              <span>Relations & Lineage</span>
            </button>

            {/* AI Summarize Button */}
            <button
              onClick={handleAISummarize}
              disabled={isSummarizing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 text-xs font-semibold shadow-[0_0_10px_rgba(168,85,247,0.15)] transition-all"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSummarizing ? "animate-spin" : ""}`} />
              <span>{isSummarizing ? "Analyzing..." : "DX AI Insights"}</span>
            </button>

            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#252525] text-[#888898] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Summary Banner */}
        {aiSummary && (
          <div className="p-4 bg-purple-950/30 border-b border-purple-500/30 text-xs text-purple-200 flex items-start justify-between gap-3 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="whitespace-pre-line leading-relaxed">{aiSummary}</div>
            </div>
            <button onClick={() => setAiSummary(null)} className="text-purple-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-[#2E2E2E]">
            {/* Title */}
            <div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="flex-1 bg-[#1A1A1A] border border-[#FF6200] rounded-lg px-3 py-1.5 text-base font-bold text-white focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      handleUpdateField({ title: titleInput });
                      setIsEditingTitle(false);
                    }}
                    className="p-2 rounded bg-[#FF6200] text-white hover:bg-[#FF8C42]"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingTitle(false)}
                    className="p-2 rounded bg-[#252525] text-[#888898] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  className="text-xl font-bold text-white cursor-pointer hover:text-[#FF8C42] transition-colors flex items-center gap-2 group"
                >
                  <span>{task.title}</span>
                  <Edit2 className="w-4 h-4 text-[#888898] opacity-0 group-hover:opacity-100 transition-opacity" />
                </h1>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#ACACB8] uppercase tracking-wider">Description</h3>
                {!isEditingDesc && (
                  <button
                    onClick={() => setIsEditingDesc(true)}
                    className="text-[11px] text-[#FF8C42] hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#FF6200] rounded-lg p-3 text-xs text-white focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleUpdateField({ description: descInput });
                        setIsEditingDesc(false);
                      }}
                      className="px-3 py-1.5 rounded bg-[#FF6200] text-white text-xs font-bold"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingDesc(false)}
                      className="px-3 py-1.5 rounded bg-[#252525] text-xs text-[#888898]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className="p-3.5 rounded-xl bg-[#1A1A1A]/70 border border-[#2E2E2E] text-xs text-[#E5E7EB] leading-relaxed cursor-pointer hover:border-[#FF6200]/40 transition-colors whitespace-pre-wrap"
                >
                  {task.description || <span className="text-[#888898] italic">Click to add description...</span>}
                </div>
              )}
            </div>

            {/* Acceptance Criteria */}
            {task.acceptanceCriteria && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#ACACB8] uppercase tracking-wider">Acceptance Criteria</h3>
                <div className="p-3.5 rounded-xl bg-[#1A1A1A]/50 border border-[#2E2E2E] font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {task.acceptanceCriteria}
                </div>
              </div>
            )}

            {/* Subtasks Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[#ACACB8] uppercase tracking-wider">Subtasks</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#252525] text-slate-300">
                    {task.subtasks?.filter((s: any) => s.completed).length || 0}/{task.subtasks?.length || 0}
                  </span>
                </div>
              </div>

              {/* Subtasks Checkbox List */}
              <div className="space-y-2">
                {task.subtasks?.map((subtask: any) => (
                  <div
                    key={subtask.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#FF6200]/30 transition-colors"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={(e) => handleToggleSubtask(subtask.id, e.target.checked)}
                        className="w-4 h-4 rounded border-[#2E2E2E] text-[#FF6200] accent-[#FF6200] cursor-pointer"
                      />
                      <span
                        className={`text-xs ${
                          subtask.completed ? "line-through text-[#888898]" : "text-white font-medium"
                        }`}
                      >
                        {subtask.title}
                      </span>
                    </label>
                    {subtask.assignee && (
                      <span className="text-[10px] text-[#888898] font-mono">@{subtask.assignee.name}</span>
                    )}
                  </div>
                ))}

                {/* Inline Add Subtask */}
                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add a new subtask..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    className="flex-1 bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-xs text-white placeholder-[#888898] focus:outline-none focus:border-[#FF6200]/60"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-[#252525] border border-[#2E2E2E] text-xs font-semibold text-white hover:bg-[#303030]"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>

            {/* Bottom Tabs: Comments & Activity History */}
            <div className="pt-4 border-t border-[#2E2E2E] space-y-4">
              <div className="flex items-center gap-3 border-b border-[#2E2E2E] pb-2 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab("COMMENTS")}
                  className={`flex items-center gap-1.5 pb-2 transition-colors ${
                    activeTab === "COMMENTS"
                      ? "text-[#FF8C42] border-b-2 border-b-[#FF6200]"
                      : "text-[#888898] hover:text-white"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Comments ({task.comments?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab("ACTIVITY")}
                  className={`flex items-center gap-1.5 pb-2 transition-colors ${
                    activeTab === "ACTIVITY"
                      ? "text-[#FF8C42] border-b-2 border-b-[#FF6200]"
                      : "text-[#888898] hover:text-white"
                  }`}
                >
                  <ActivityIcon className="w-3.5 h-3.5" />
                  <span>Activity History ({task.activities?.length || 0})</span>
                </button>
              </div>

              {/* Tab 1: Comments */}
              {activeTab === "COMMENTS" && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {task.comments?.map((comment: any) => (
                      <div key={comment.id} className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                comment.author?.avatarUrl ||
                                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                              }
                              alt={comment.author?.name}
                              className="w-5 h-5 rounded-full object-cover border border-[#2E2E2E]"
                            />
                            <span className="font-bold text-white">{comment.author?.name}</span>
                          </div>
                          <span className="text-[10px] text-[#888898]">{formatDateTime(comment.createdAt)}</span>
                        </div>
                        <div className="text-xs text-[#D1D5DB] whitespace-pre-wrap leading-relaxed">
                          {comment.content}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add a comment... (Type @Name to mention)"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#888898] focus:outline-none focus:border-[#FF6200]/60"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,98,0,0.2)]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 2: Activity History */}
              {activeTab === "ACTIVITY" && (
                <div className="space-y-2.5">
                  {task.activities?.map((act: any) => (
                    <div key={act.id} className="flex items-start gap-2.5 text-xs text-[#ACACB8]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6200] mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-white font-semibold">{act.user?.name || "System"}</span>{" "}
                        <span>{act.description}</span>
                        <div className="text-[10px] text-[#888898] mt-0.5">{formatDateTime(act.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Metadata Sidebar */}
          <div className="w-80 bg-[#141414] p-6 space-y-5 text-xs">
            <div>
              <label className="block text-[#888898] font-mono text-[10px] uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={task.status}
                onChange={(e) => handleUpdateField({ status: e.target.value })}
                className={`w-full font-bold rounded-lg px-3 py-2 border ${status.bg} focus:outline-none`}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="BLOCKED">Blocked</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-[#888898] font-mono text-[10px] uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={task.priority}
                onChange={(e) => handleUpdateField({ priority: e.target.value })}
                className={`w-full font-bold rounded-lg px-3 py-2 border ${priority.bg} focus:outline-none`}
              >
                <option value="CRITICAL">🔴 Critical</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">🟢 Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[#888898] font-mono text-[10px] uppercase tracking-wider mb-1.5">
                Assignee
              </label>
              <select
                value={task.assignees?.[0]?.id || ""}
                onChange={(e) => handleUpdateField({ assigneeIds: e.target.value ? [e.target.value] : [] })}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#888898] font-mono text-[10px] uppercase tracking-wider mb-1">
                Reporter
              </label>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E]">
                <img
                  src={task.reporter?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                  alt={task.reporter?.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-white font-medium">{task.reporter?.name || "System"}</span>
              </div>
            </div>

            <div>
              <label className="block text-[#888898] font-mono text-[10px] uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                onChange={(e) => handleUpdateField({ dueDate: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#888898] font-mono text-[10px] uppercase tracking-wider mb-1.5">
                Sprint
              </label>
              <select
                value={task.sprintId || ""}
                onChange={(e) => handleUpdateField({ sprintId: e.target.value || null })}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none"
              >
                <option value="">Backlog (No Sprint)</option>
                {task.project?.sprints?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#2E2E2E]">
              <div>
                <label className="block text-[#888898] font-mono text-[10px] uppercase tracking-wider mb-1">
                  Estimated
                </label>
                <div className="font-mono text-white text-xs bg-[#1A1A1A] p-2 rounded-lg border border-[#2E2E2E]">
                  {task.estimatedHours || 0}h
                </div>
              </div>

              <div>
                <label className="block text-[#888898] font-mono text-[10px] uppercase tracking-wider mb-1">
                  Logged
                </label>
                <div className="font-mono text-[#FF8C42] text-xs bg-[#1A1A1A] p-2 rounded-lg border border-[#2E2E2E]">
                  {task.loggedHours || 0}h
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Relations Modal */}
      {isRelationsOpen && (
        <TaskRelationsModal
          taskKey={task.taskKey}
          isOpen={isRelationsOpen}
          onClose={() => setIsRelationsOpen(false)}
        />
      )}
    </div>
  );
}
