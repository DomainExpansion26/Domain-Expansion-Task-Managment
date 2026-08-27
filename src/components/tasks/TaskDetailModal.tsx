"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Upload,
  Download,
  File,
  FileText,
  Image as ImageIcon,
  Timer,
  Bug,
  ShieldCheck,
  ChevronRight,
  GitBranch,
  Eye,
  EyeOff,
  Share2,
  ArrowLeft,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  FolderKanban,
  HelpCircle,
  Smile,
  AtSign,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  List,
  Quote,
  RotateCcw,
} from "lucide-react";
import { getPriorityColor, getStatusColor, getTypeIcon, formatDate, formatDateTime, getInitials, getAvatarGradient } from "@/lib/utils";
import { TaskRelationsModal } from "@/components/modals/TaskRelationsModal";
import { RaiseBugModal } from "@/components/modals/RaiseBugModal";
import { BugDetailModal } from "@/components/qa/BugDetailModal";

interface TaskDetailModalProps {
  taskKey: string;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: () => void;
  onSelectTask?: (taskKey: string) => void;
  users: any[];
  currentUser: any;
}

export function TaskDetailModal({
  taskKey,
  isOpen,
  onClose,
  onTaskUpdated,
  onSelectTask,
  users,
  currentUser,
}: TaskDetailModalProps) {
  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVITY" | "FILES" | "RELATIONS" | "WATCHERS">("ACTIVITY");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Editable Fields State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [progressInput, setProgressInput] = useState<number>(0);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [versionInput, setVersionInput] = useState("");
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingVersion, setIsEditingVersion] = useState(false);

  // Activity & Comments
  const [newComment, setNewComment] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Watchers & Share Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedShareUserIds, setSelectedShareUserIds] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccessMsg, setShareSuccessMsg] = useState<string | null>(null);
  const [isWatchingLoading, setIsWatchingLoading] = useState(false);

  // Subtasks & Modals
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isRelationsOpen, setIsRelationsOpen] = useState(false);
  const [isRaiseBugOpen, setIsRaiseBugOpen] = useState(false);
  const [selectedBugKey, setSelectedBugKey] = useState<string | null>(null);

  // File Upload State
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Summary
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSavingField, setIsSavingField] = useState(false);

  const fetchTaskDetails = async (showModalLoader = false) => {
    if (!taskKey) return;
    if (showModalLoader) {
      setLoading(true);
    }
    try {
      const res = await fetch(`/api/tasks/${taskKey}`);
      const json = await res.json();
      if (json.success && json.data) {
        setTask(json.data);
        setTitleInput(json.data.title || "");
        setDescInput(json.data.description || "");
        setProgressInput(json.data.progress ?? 0);
        setStartDateInput(json.data.startDate ? new Date(json.data.startDate).toISOString().split("T")[0] : "");
        setEndDateInput(json.data.endDate ? new Date(json.data.endDate).toISOString().split("T")[0] : json.data.dueDate ? new Date(json.data.dueDate).toISOString().split("T")[0] : "");
        setCategoryInput(json.data.category || "");
        setVersionInput(json.data.version || "");
      }
    } catch (err) {
      console.error("Failed to load task details:", err);
    } finally {
      if (showModalLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen && taskKey) {
      if (task?.taskKey !== taskKey) {
        setTask(null);
        fetchTaskDetails(true);
      } else {
        fetchTaskDetails(false);
      }
      setAiSummary(null);
      setShareSuccessMsg(null);
    }
  }, [isOpen, taskKey]);

  if (!isOpen) return null;

  // Handle inline updates with optimistic local updates
  const handleUpdateField = async (fields: Record<string, any>) => {
    setIsSavingField(true);
    // Optimistic local state update
    setTask((prev: any) => (prev ? { ...prev, ...fields } : prev));
    try {
      const res = await fetch(`/api/tasks/${taskKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTask((prev: any) => ({ ...prev, ...json.data }));
        if (onTaskUpdated) onTaskUpdated();
        fetchTaskDetails(false);
      }
    } catch (err) {
      console.error("Failed to update task field:", err);
      fetchTaskDetails(false);
    } finally {
      setIsSavingField(false);
    }
  };

  // Self Assign
  const handleSelfAssign = async () => {
    if (!currentUser?.id) return;
    await handleUpdateField({ assigneeIds: [currentUser.id] });
  };

  // Toggle Watcher
  const handleToggleWatcher = async () => {
    setIsWatchingLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskKey}/watchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.success) {
        fetchTaskDetails();
      }
    } catch (err) {
      console.error("Failed to toggle watcher:", err);
    } finally {
      setIsWatchingLoading(false);
    }
  };

  // Share Task
  const handleShareTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedShareUserIds.length === 0) return;
    setIsSharing(true);
    try {
      const res = await fetch(`/api/tasks/${taskKey}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedShareUserIds }),
      });
      const json = await res.json();
      if (json.success) {
        setShareSuccessMsg("Task shared successfully!");
        setTimeout(() => {
          setIsShareModalOpen(false);
          setShareSuccessMsg(null);
          setSelectedShareUserIds([]);
        }, 1500);
        fetchTaskDetails();
      }
    } catch (err) {
      console.error("Failed to share task:", err);
    } finally {
      setIsSharing(false);
    }
  };

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    setIsUploadingFile(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", task.id);
      formData.append("projectId", task.projectId);

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        fetchTaskDetails();
      } else {
        setUploadError(json.error?.message || "Failed to upload file");
      }
    } catch (err: any) {
      setUploadError(err.message || "File upload failed");
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Add Comment with @Mention parsing
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/tasks/${taskKey}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setNewComment("");
        setMentionQuery(null);
        fetchTaskDetails();
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err) {
      console.error("Add comment error:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Add Subtask
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${taskKey}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSubtaskTitle.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setNewSubtaskTitle("");
        fetchTaskDetails();
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err) {
      console.error("Add subtask error:", err);
    }
  };

  // Toggle Subtask Completion
  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      await fetch(`/api/tasks/${taskKey}/subtasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskId, completed }),
      });
      fetchTaskDetails();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error("Toggle subtask error:", err);
    }
  };

  // Project Members Extract
  const projectMembers = React.useMemo(() => {
    if (!task?.project) return users || [];
    const map = new Map<string, any>();
    if (Array.isArray(task.project.members)) {
      task.project.members.forEach((m: any) => {
        const u = m.user || m;
        const id = u.id || m.userId;
        if (id) {
          map.set(id, {
            id,
            name: u.name || m.name || "Member",
            email: u.email || "",
            role: m.role || u.role || "MEMBER",
            avatarUrl: u.avatarUrl,
          });
        }
      });
    }
    if (task.project.lead?.id) map.set(task.project.lead.id, { ...task.project.lead, role: "TEAM_LEAD" });
    if (task.project.teamLead?.id) map.set(task.project.teamLead.id, { ...task.project.teamLead, role: "TEAM_LEAD" });
    if (task.project.manager?.id) map.set(task.project.manager.id, { ...task.project.manager, role: "PROJECT_MANAGER" });
    return Array.from(map.values());
  }, [task?.project, users]);

  if (!task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
        <div className="p-8 rounded-3xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] text-xs text-gray-500 dark:text-[#888898] flex items-center gap-3 shadow-2xl">
          <div className="w-5 h-5 border-2 border-[#FF6200] border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold">Loading #{taskKey}...</span>
        </div>
      </div>
    );
  }

  const firstAssignee = task.assignees?.[0];
  const isWatching = Boolean(task.isWatching);
  const watchersCount = Array.isArray(task.watchers) ? task.watchers.length : 0;
  const filesCount = Array.isArray(task.attachments) ? task.attachments.length : 0;
  const relationsCount = (task.relationsAsSource?.length || 0) + (task.relationsAsTarget?.length || 0) + (task.subtasks?.length || 0);
  const activitiesCount = (task.activities?.length || 0) + (task.comments?.length || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-gray-900 dark:text-[#F3F4F6] transition-all ${
          isFullscreen ? "h-[98vh] max-w-[98vw]" : "h-[92vh] max-w-6xl"
        }`}
      >
        {/* TOP BAR: Reference to OpenProject Screenshot #1 */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-[#2E2E2E] bg-gray-50/70 dark:bg-[#1A1A1A] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={onClose}
              title="Back to Task List"
              className="p-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-[#252525] text-gray-500 dark:text-[#888898] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Task Type Badge */}
            <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-[#0066CC]/15 text-[#0066CC] dark:text-[#3399FF] border border-[#0066CC]/30 flex-shrink-0">
              {task.taskType || "TASK"}
            </span>

            {/* Inline Title Editor */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="flex-1 bg-white dark:bg-[#121212] border border-[#FF6200] rounded-xl px-3 py-1 text-sm font-bold text-gray-900 dark:text-white focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    handleUpdateField({ title: titleInput.trim() });
                    setIsEditingTitle(false);
                  }}
                  className="p-1.5 rounded-lg bg-[#FF6200] text-white hover:bg-[#E55800]"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="p-1.5 rounded-lg bg-gray-200 dark:bg-[#252525] text-gray-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-base font-bold text-gray-900 dark:text-white truncate cursor-pointer hover:text-[#FF6200] transition-colors flex items-center gap-2 group"
                title="Click to inline edit title"
              >
                <span className="truncate">{task.title}</span>
                <Edit2 className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 flex-shrink-0" />
              </h1>
            )}
          </div>

          {/* Action Toolbar on Top Right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Share Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#252525] text-xs font-semibold text-gray-700 dark:text-[#ACACB8] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#FF6200]" />
              <span>Share</span>
            </button>

            {/* Watchers Toggle Button */}
            <button
              onClick={handleToggleWatcher}
              disabled={isWatchingLoading}
              title={isWatching ? "You are watching this task" : "Click to watch task"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isWatching
                  ? "bg-[#00875A]/15 text-[#00875A] dark:text-[#36B37E] border-[#00875A]/30 font-bold"
                  : "bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[#2E2E2E] text-gray-700 dark:text-[#ACACB8] hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isWatching ? `Watching (${watchersCount})` : `Watch (${watchersCount})`}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-[#252525] text-gray-500 dark:text-[#888898] hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-[#252525] text-gray-500 dark:text-[#888898] hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STATUS & META BAR: Reference to OpenProject Screenshot #1 */}
        <div className="px-6 py-2.5 border-b border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#141414] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Dropdown */}
            <select
              value={task.status}
              onChange={(e) => handleUpdateField({ status: e.target.value })}
              className={`px-3 py-1 rounded-lg font-bold text-xs border cursor-pointer focus:outline-none ${getStatusColor(
                task.status
              )}`}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="READY_FOR_TESTING">Ready for Testing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CLOSED">Closed</option>
              <option value="BLOCKED">Blocked</option>
            </select>

            {/* ID & Real Created by & Last Updated */}
            <span className="text-gray-500 dark:text-[#888898] text-[11px]">
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                #{task.taskKey.replace(/^[A-Za-z]+-/, "") || task.taskKey}
              </span>
              : Created by{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{task.reporter?.name || "System"}</span> on{" "}
              {formatDate(task.createdAt)}. Last updated on {formatDateTime(task.updatedAt)}.
            </span>
          </div>

          {/* Quick Assignment Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelfAssign}
              className="px-3 py-1 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-700 dark:text-[#ACACB8] hover:text-gray-900 dark:hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Self-Assign
            </button>
            <button
              onClick={() => setIsRelationsOpen(true)}
              className="px-3 py-1 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-700 dark:text-[#ACACB8] hover:text-gray-900 dark:hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Relations ({relationsCount})
            </button>
          </div>
        </div>

        {/* 2-COLUMN MAIN CONTENT (Exact OpenProject Layout) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT COLUMN: Description, People, Details */}
          <div className="w-full md:w-1/2 overflow-y-auto p-6 space-y-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-[#2E2E2E]">
            {/* Description Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-500 dark:text-[#888898] uppercase tracking-wider">
                  Description
                </h3>
                {!isEditingDesc && (
                  <button
                    onClick={() => setIsEditingDesc(true)}
                    className="text-xs text-[#FF6200] hover:underline font-bold"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    rows={5}
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-[#FF6200] rounded-xl p-3 text-xs text-gray-900 dark:text-white focus:outline-none"
                    placeholder="We need to create user guide to describe OpenProject features better..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleUpdateField({ description: descInput.trim() });
                        setIsEditingDesc(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#FF6200] text-white text-xs font-bold shadow-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingDesc(false)}
                      className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-[#252525] text-xs text-gray-600 dark:text-[#888898]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] text-xs text-gray-800 dark:text-[#E5E7EB] leading-relaxed cursor-pointer hover:border-[#FF6200]/40 transition-colors whitespace-pre-wrap"
                >
                  {task.description || (
                    <span className="text-gray-400 dark:text-[#666] italic">
                      Click to add detailed task description and context...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* PEOPLE SECTION: Reference to OpenProject Screenshot #1 */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-[#2E2E2E]">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                PEOPLE
              </h3>

              <div className="space-y-3 text-xs">
                {/* Assignee */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 dark:text-[#888898] font-medium">Assignee</span>
                  <div className="flex-1 max-w-xs">
                    <select
                      value={firstAssignee?.id || ""}
                      onChange={(e) => handleUpdateField({ assigneeIds: e.target.value ? [e.target.value] : [] })}
                      className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white font-semibold focus:outline-none focus:border-[#FF6200]"
                    >
                      <option value="">Unassigned</option>
                      {projectMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Accountable */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 dark:text-[#888898] font-medium">Accountable</span>
                  <div className="flex-1 max-w-xs">
                    <select
                      value={task.accountableId || ""}
                      onChange={(e) => handleUpdateField({ accountableId: e.target.value || null })}
                      className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white font-semibold focus:outline-none focus:border-[#FF6200]"
                    >
                      <option value="">None</option>
                      {projectMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Team Lead */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 dark:text-[#888898] font-medium">Team Lead</span>
                  <div className="flex-1 flex items-center gap-2">
                    {task.project?.teamLead || task.project?.lead ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                            (task.project.teamLead || task.project.lead).name
                          )} flex items-center justify-center text-[8px] font-black text-white uppercase flex-shrink-0`}
                        >
                          {getInitials((task.project.teamLead || task.project.lead).name)}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(task.project.teamLead || task.project.lead).name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-[#666] italic">Not configured</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* DETAILS SECTION: Reference to OpenProject Screenshot #1 */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-[#2E2E2E]">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                DETAILS
              </h3>

              <div className="space-y-3.5 text-xs">
                {/* Priority */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 dark:text-[#888898] font-medium">Priority</span>
                  <div className="flex-1 max-w-xs">
                    <select
                      value={task.priority}
                      onChange={(e) => handleUpdateField({ priority: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white font-semibold focus:outline-none"
                    >
                      <option value="CRITICAL">🔴 Critical</option>
                      <option value="HIGH">🟠 High</option>
                      <option value="MEDIUM">🟡 Medium</option>
                      <option value="LOW">🟢 Low</option>
                    </select>
                  </div>
                </div>

                {/* Dates: Start Date & End Date */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 dark:text-[#888898] font-medium">Date Range</span>
                  <div className="flex-1 flex items-center gap-2 max-w-xs">
                    <input
                      type="date"
                      value={startDateInput}
                      onChange={(e) => {
                        setStartDateInput(e.target.value);
                        handleUpdateField({ startDate: e.target.value || null });
                      }}
                      className="w-1/2 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-2 py-1 text-xs text-gray-900 dark:text-white font-mono focus:outline-none"
                      title="Start Date"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="date"
                      value={endDateInput}
                      onChange={(e) => {
                        setEndDateInput(e.target.value);
                        handleUpdateField({ endDate: e.target.value || null, dueDate: e.target.value || null });
                      }}
                      className="w-1/2 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-2 py-1 text-xs text-gray-900 dark:text-white font-mono focus:outline-none"
                      title="End Date / Finish Date"
                    />
                  </div>
                </div>

                {/* % Complete (Progress) */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 dark:text-[#888898] font-medium flex items-center gap-1">
                    <span>% Complete</span>
                    <HelpCircle className="w-3 h-3 text-gray-400" />
                  </span>
                  <div className="flex-1 flex items-center gap-3 max-w-xs">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={progressInput}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setProgressInput(val);
                      }}
                      onMouseUp={() => handleUpdateField({ progress: progressInput })}
                      onTouchEnd={() => handleUpdateField({ progress: progressInput })}
                      className="flex-1 accent-[#00875A]"
                    />
                    <span className="w-10 font-mono font-bold text-right text-gray-900 dark:text-white">
                      {progressInput}%
                    </span>
                  </div>
                </div>

                {/* Category */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 dark:text-[#888898] font-medium">Category</span>
                  <div className="flex-1 max-w-xs">
                    {isEditingCategory ? (
                      <input
                        type="text"
                        value={categoryInput}
                        onChange={(e) => setCategoryInput(e.target.value)}
                        onBlur={() => {
                          handleUpdateField({ category: categoryInput.trim() });
                          setIsEditingCategory(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdateField({ category: categoryInput.trim() });
                            setIsEditingCategory(false);
                          }
                        }}
                        className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-[#FF6200] rounded-xl px-3 py-1 text-xs text-gray-900 dark:text-white focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => setIsEditingCategory(true)}
                        className="text-gray-800 dark:text-[#D1D5DB] cursor-pointer hover:underline"
                      >
                        {task.category || "-"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Version */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 dark:text-[#888898] font-medium flex items-center gap-1">
                    <span>Version</span>
                    <HelpCircle className="w-3 h-3 text-gray-400" />
                  </span>
                  <div className="flex-1 max-w-xs">
                    {isEditingVersion ? (
                      <input
                        type="text"
                        value={versionInput}
                        onChange={(e) => setVersionInput(e.target.value)}
                        onBlur={() => {
                          handleUpdateField({ version: versionInput.trim() });
                          setIsEditingVersion(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdateField({ version: versionInput.trim() });
                            setIsEditingVersion(false);
                          }
                        }}
                        className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-[#FF6200] rounded-xl px-3 py-1 text-xs text-gray-900 dark:text-white focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => setIsEditingVersion(true)}
                        className="text-gray-800 dark:text-[#D1D5DB] cursor-pointer hover:underline"
                      >
                        {task.version || task.sprint?.name || "-"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Project */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 dark:text-[#888898] font-medium">Project</span>
                  <div className="flex-1 max-w-xs font-semibold text-gray-900 dark:text-white">
                    {task.project?.name} ({task.project?.key})
                  </div>
                </div>
              </div>
            </div>

            {/* Subtasks Section */}
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-[#2E2E2E]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-500 dark:text-[#888898] uppercase tracking-wider">
                  Subtasks / Checklist ({task.subtasks?.filter((s: any) => s.completed).length || 0}/{task.subtasks?.length || 0})
                </h3>
              </div>

              <div className="space-y-2">
                {task.subtasks?.map((st: any) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E]"
                  >
                    <label className="flex items-center gap-2.5 text-xs cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={(e) => handleToggleSubtask(st.id, e.target.checked)}
                        className="rounded border-gray-300 dark:border-[#444] text-[#FF6200] focus:ring-[#FF6200]"
                      />
                      <span className={st.completed ? "line-through text-gray-400 dark:text-[#666]" : "text-gray-900 dark:text-white"}>
                        {st.title}
                      </span>
                    </label>
                  </div>
                ))}

                <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="+ Add subtask..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#FF6200]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-[#FF6200] text-white text-xs font-bold shadow-sm"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Tabs (ACTIVITY, FILES, RELATIONS, WATCHERS) - Exact OpenProject Screenshot #1 */}
          <div className="w-full md:w-1/2 flex flex-col min-w-0 bg-gray-50/30 dark:bg-[#111111]">
            {/* Tabs Header */}
            <div className="flex border-b border-gray-200 dark:border-[#2E2E2E] px-6 bg-white dark:bg-[#141414] overflow-x-auto">
              <button
                onClick={() => setActiveTab("ACTIVITY")}
                className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "ACTIVITY"
                    ? "border-[#0066CC] text-[#0066CC] dark:text-[#3399FF]"
                    : "border-transparent text-gray-500 dark:text-[#888898] hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                ACTIVITY ({activitiesCount})
              </button>

              <button
                onClick={() => setActiveTab("FILES")}
                className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "FILES"
                    ? "border-[#0066CC] text-[#0066CC] dark:text-[#3399FF]"
                    : "border-transparent text-gray-500 dark:text-[#888898] hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                FILES ({filesCount})
              </button>

              <button
                onClick={() => setActiveTab("RELATIONS")}
                className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "RELATIONS"
                    ? "border-[#0066CC] text-[#0066CC] dark:text-[#3399FF]"
                    : "border-transparent text-gray-500 dark:text-[#888898] hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                RELATIONS ({relationsCount})
              </button>

              <button
                onClick={() => setActiveTab("WATCHERS")}
                className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "WATCHERS"
                    ? "border-[#0066CC] text-[#0066CC] dark:text-[#3399FF]"
                    : "border-transparent text-gray-500 dark:text-[#888898] hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                WATCHERS ({watchersCount})
              </button>
            </div>

            {/* TAB CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* TAB 1: ACTIVITY & COMMENTS TIMELINE (Screenshot #1 Reference) */}
              {activeTab === "ACTIVITY" && (
                <div className="space-y-4">
                  {/* Timeline Items */}
                  <div className="space-y-4">
                    {activitiesCount === 0 ? (
                      <div className="text-center py-12 text-gray-400 dark:text-[#666] text-xs italic">
                        No activity records or comments yet.
                      </div>
                    ) : (
                      <>
                        {/* Render Comments */}
                        {task.comments?.map((comment: any, index: number) => (
                          <div
                            key={comment.id}
                            className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] space-y-2 shadow-sm"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-6 h-6 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                    comment.author?.name
                                  )} flex items-center justify-center text-[9px] font-black text-white uppercase flex-shrink-0`}
                                >
                                  {getInitials(comment.author?.name)}
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {comment.author?.name || "Member"}
                                </span>
                                <span className="text-[11px] text-gray-400 dark:text-[#888898]">
                                  {formatDateTime(comment.createdAt)}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-gray-400">#{index + 1}</span>
                            </div>

                            <div className="text-xs text-gray-800 dark:text-[#E5E7EB] leading-relaxed pl-8 whitespace-pre-wrap">
                              {comment.content}
                            </div>
                          </div>
                        ))}

                        {/* Render Field Changes / Activity Audit */}
                        {task.activities?.map((act: any) => (
                          <div key={act.id} className="flex items-start gap-3 text-xs pl-2 text-gray-600 dark:text-[#ACACB8]">
                            <div className="w-2 h-2 rounded-full bg-[#0066CC] mt-1.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="font-semibold text-gray-900 dark:text-white">{act.user?.name || "System"}</span>{" "}
                              <span>{act.description}</span>
                              <div className="text-[10px] text-gray-400 dark:text-[#888898] font-mono mt-0.5">
                                {formatDateTime(act.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* OpenProject-style Comment Editor Box (Matching Screenshot #1) */}
                  <form onSubmit={handleAddComment} className="pt-3 border-t border-gray-200 dark:border-[#2E2E2E]">
                    <div className="rounded-2xl border border-gray-300 dark:border-[#333] bg-white dark:bg-[#1A1A1A] overflow-hidden focus-within:border-[#0066CC] transition-colors shadow-sm">
                      {/* Editor Toolbar Icons */}
                      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-100 dark:border-[#2E2E2E] bg-gray-50/80 dark:bg-[#161616] text-gray-500 dark:text-[#888898]">
                        <button
                          type="button"
                          onClick={() => setNewComment((prev) => prev + "**text**")}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#252525]"
                          title="Bold"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewComment((prev) => prev + "_text_")}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#252525]"
                          title="Italic"
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewComment((prev) => prev + "~~text~~")}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#252525]"
                          title="Strikethrough"
                        >
                          <Strikethrough className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewComment((prev) => prev + "`code`")}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#252525]"
                          title="Code"
                        >
                          <Code className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewComment((prev) => prev + "@")}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#252525] text-[#0066CC] font-bold"
                          title="Mention user"
                        >
                          <AtSign className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Comment Input */}
                      <textarea
                        rows={3}
                        placeholder="Write a comment... (Type @ to mention team members)"
                        value={newComment}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewComment(val);
                          const lastAt = val.lastIndexOf("@");
                          if (lastAt !== -1 && lastAt >= val.length - 15) {
                            setMentionQuery(val.substring(lastAt + 1));
                          } else {
                            setMentionQuery(null);
                          }
                        }}
                        className="w-full p-3 text-xs text-gray-900 dark:text-white bg-transparent focus:outline-none resize-y"
                      />

                      {/* @Mention Autocomplete Dropdown */}
                      {mentionQuery !== null && (
                        <div className="p-2 border-t border-gray-100 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#141414] max-h-32 overflow-y-auto space-y-1">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">
                            Select project member to mention:
                          </div>
                          {projectMembers
                            .filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
                            .map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  const lastAt = newComment.lastIndexOf("@");
                                  setNewComment(newComment.substring(0, lastAt) + `@${m.name} `);
                                  setMentionQuery(null);
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs hover:bg-[#FF6200]/15 hover:text-[#FF6200] text-left cursor-pointer"
                              >
                                <span className="font-bold">@{m.name}</span>
                                <span className="text-[10px] text-gray-400 font-mono">({m.role})</span>
                              </button>
                            ))}
                        </div>
                      )}

                      {/* Bottom Footer with Send Button */}
                      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-[#2E2E2E] bg-gray-50/50 dark:bg-[#161616]">
                        <span className="text-[10px] text-gray-400 font-mono">
                          Powered by Enterprise Work Packages
                        </span>
                        <button
                          type="submit"
                          disabled={isSubmittingComment || !newComment.trim()}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#0066CC] hover:bg-[#0055AA] text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmittingComment ? "Posting..." : "Send"}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: FILES & ATTACHMENTS */}
              {activeTab === "FILES" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 dark:text-[#888898] uppercase tracking-wider">
                      Attached Files ({filesCount})
                    </span>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingFile}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6200] hover:bg-[#E55800] text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingFile ? "Uploading..." : "Upload File"}</span>
                      </button>
                    </div>
                  </div>

                  {uploadError && (
                    <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 text-xs">
                      {uploadError}
                    </div>
                  )}

                  <div className="space-y-2">
                    {filesCount === 0 ? (
                      <div className="text-center py-12 text-gray-400 dark:text-[#666] text-xs italic">
                        No files attached to this task.
                      </div>
                    ) : (
                      task.attachments.map((att: any) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] shadow-sm text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <File className="w-5 h-5 text-[#FF6200]" />
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white">{att.fileName}</div>
                              <div className="text-[10px] text-gray-400 dark:text-[#888898]">
                                {(att.fileSize / 1024).toFixed(1)} KB • Uploaded by {att.uploadedBy?.name || "Member"} on {formatDate(att.createdAt)}
                              </div>
                            </div>
                          </div>
                          <a
                            href={att.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl border border-gray-200 dark:border-[#2E2E2E] hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-600 dark:text-[#ACACB8]"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: RELATIONS */}
              {activeTab === "RELATIONS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 dark:text-[#888898] uppercase tracking-wider">
                      Work Package Lineage & Relations
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsRelationsOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-[#0066CC] text-white text-xs font-bold shadow-sm"
                    >
                      + Manage Relations
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] text-xs space-y-3">
                    <div className="font-bold text-gray-900 dark:text-white">Subtasks ({task.subtasks?.length || 0})</div>
                    {task.subtasks?.length === 0 ? (
                      <div className="text-gray-400 dark:text-[#666] italic">No child subtasks.</div>
                    ) : (
                      <div className="space-y-1.5">
                        {task.subtasks.map((st: any) => (
                          <div key={st.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-[#2E2E2E] last:border-0">
                            <span className={st.completed ? "line-through text-gray-400" : "text-gray-800 dark:text-white"}>{st.title}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${st.completed ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-200 dark:bg-[#252525]"}`}>
                              {st.completed ? "Done" : "Incomplete"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: WATCHERS */}
              {activeTab === "WATCHERS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 dark:text-[#888898] uppercase tracking-wider">
                      Active Watchers ({watchersCount})
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleWatcher}
                      disabled={isWatchingLoading}
                      className="px-3 py-1.5 rounded-xl bg-[#00875A] text-white text-xs font-bold shadow-sm cursor-pointer"
                    >
                      {isWatching ? "Stop Watching" : "+ Watch this task"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {watchersCount === 0 ? (
                      <div className="text-center py-12 text-gray-400 dark:text-[#666] text-xs italic">
                        No members are watching this work package yet.
                      </div>
                    ) : (
                      task.watchers.map((w: any) => (
                        <div
                          key={w.id}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] shadow-sm text-xs"
                        >
                          <div
                            className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                              w.name
                            )} flex items-center justify-center text-[10px] font-black text-white uppercase flex-shrink-0`}
                          >
                            {getInitials(w.name)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">{w.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{w.email}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SHARE TASK MODAL */}
        {isShareModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <form
              onSubmit={handleShareTask}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#FF6200]" />
                  <span>Share Work Package #{task.taskKey}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {shareSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs">
                  {shareSuccessMsg}
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-[#888898]">
                Select real project members to share this task with. They will receive an in-app notification and direct access.
              </p>

              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-200 dark:border-[#2E2E2E] rounded-2xl p-2">
                {projectMembers.map((m) => {
                  const isChecked = selectedShareUserIds.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#222] cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedShareUserIds([...selectedShareUserIds, m.id]);
                            } else {
                              setSelectedShareUserIds(selectedShareUserIds.filter((id) => id !== m.id));
                            }
                          }}
                          className="rounded text-[#FF6200]"
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">{m.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">({m.role})</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSharing || selectedShareUserIds.length === 0}
                  className="px-4 py-2 rounded-xl bg-[#FF6200] hover:bg-[#E55800] text-white text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSharing ? "Sharing..." : `Share with ${selectedShareUserIds.length} Members`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Task Relations Modal */}
        {isRelationsOpen && (
          <TaskRelationsModal
            taskKey={task.taskKey}
            isOpen={isRelationsOpen}
            onClose={() => setIsRelationsOpen(false)}
          />
        )}

        {/* Raise Bug Modal against this task */}
        <RaiseBugModal
          isOpen={isRaiseBugOpen}
          onClose={() => setIsRaiseBugOpen(false)}
          parentTask={task ? {
            id: task.id,
            taskKey: task.taskKey,
            title: task.title,
            projectId: task.projectId,
            projectName: task.project?.name,
            assignees: task.assignees,
          } : null}
          users={users}
          currentUser={currentUser}
          onBugCreated={() => {
            fetchTaskDetails();
            if (onTaskUpdated) onTaskUpdated();
          }}
        />

        {/* Bug Detail Modal */}
        {selectedBugKey && (
          <BugDetailModal
            bugKey={selectedBugKey}
            isOpen={Boolean(selectedBugKey)}
            onClose={() => setSelectedBugKey(null)}
            onSelectTask={() => {}}
            onBugUpdated={() => {
              fetchTaskDetails();
              if (onTaskUpdated) onTaskUpdated();
            }}
            users={users}
            currentUser={currentUser}
          />
        )}
      </div>
    </div>
  );
}
