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
  Quote,
  RotateCcw,
  Lock,
  Unlock,
  ShieldAlert,
} from "lucide-react";
import { getPriorityColor, getStatusColor, getTypeIcon, formatDate, formatDateTime, getInitials, getAvatarGradient } from "@/lib/utils";
import { isSuperAdmin } from "@/lib/permissions";
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
  const [activeTab, setActiveTab] = useState<"ACTIVITY" | "FILES" | "RELATIONS" | "WATCHERS" | "BUGS">("ACTIVITY");
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
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [editingMentionQuery, setEditingMentionQuery] = useState<string | null>(null);
  const [isSavingCommentEdit, setIsSavingCommentEdit] = useState(false);

  // Watchers & Share / Tag Modals
  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>(users || []);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedShareUserIds, setSelectedShareUserIds] = useState<string[]>([]);
  const [tagPurpose, setTagPurpose] = useState<"TESTING" | "REVIEW" | "MARKETING" | "COLLABORATION" | "GENERAL">("TESTING");
  const [tagNote, setTagNote] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("ALL");
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccessMsg, setShareSuccessMsg] = useState<string | null>(null);
  const [isWatchingLoading, setIsWatchingLoading] = useState(false);

  useEffect(() => {
    if (users && users.length > 0) {
      setWorkspaceUsers(users);
    } else {
      fetch("/api/users")
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setWorkspaceUsers(data.data);
          }
        })
        .catch((e) => console.error("Error loading users:", e));
    }
  }, [users]);

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

  // Reopen Request State (Closed task lock protection)
  const isUserSuperAdmin = isSuperAdmin(currentUser);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [isSubmittingReopen, setIsSubmittingReopen] = useState(false);
  const [reopenSuccessMsg, setReopenSuccessMsg] = useState<string | null>(null);

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

  // Tag & Share Task with Any Workspace Member for Testing/Review
  const handleShareTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedShareUserIds.length === 0) return;
    setIsSharing(true);
    try {
      const res = await fetch(`/api/tasks/${taskKey}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedShareUserIds,
          purpose: tagPurpose,
          note: tagNote.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        const purposeLabel =
          tagPurpose === "TESTING"
            ? "Testing / QA"
            : tagPurpose === "REVIEW"
            ? "Story Review"
            : tagPurpose === "MARKETING"
            ? "Digital Marketing"
            : tagPurpose === "COLLABORATION"
            ? "Collaboration"
            : "Story Tagging";
        setShareSuccessMsg(`Successfully tagged ${selectedShareUserIds.length} members for ${purposeLabel}!`);
        setTimeout(() => {
          setIsShareModalOpen(false);
          setShareSuccessMsg(null);
          setSelectedShareUserIds([]);
          setTagNote("");
        }, 1400);
        fetchTaskDetails();
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err) {
      console.error("Failed to share/tag task:", err);
    } finally {
      setIsSharing(false);
    }
  };

  // Submit Reopen Request to Super Admins
  const handleSendReopenRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;
    setIsSubmittingReopen(true);
    try {
      const res = await fetch(`/api/tasks/${taskKey}/reopen-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reopenReason.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setReopenSuccessMsg("Reopen request sent to Super Admins successfully!");
        setTimeout(() => {
          setIsReopenModalOpen(false);
          setReopenSuccessMsg(null);
          setReopenReason("");
        }, 1500);
        fetchTaskDetails();
        if (onTaskUpdated) onTaskUpdated();
      } else {
        alert(json.error?.message || "Failed to submit reopen request");
      }
    } catch (err: any) {
      alert(err.message || "Network error occurred");
    } finally {
      setIsSubmittingReopen(false);
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

  // Start editing a comment
  const handleStartEditComment = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content || "");
    setEditingMentionQuery(null);
  };

  // Save edited comment
  const handleSaveEditComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return;
    setIsSavingCommentEdit(true);
    try {
      const res = await fetch(`/api/tasks/${taskKey}/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
          content: editingCommentText.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingCommentId(null);
        setEditingCommentText("");
        setEditingMentionQuery(null);
        fetchTaskDetails();
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err) {
      console.error("Failed to update comment:", err);
    } finally {
      setIsSavingCommentEdit(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskKey}/comments?commentId=${commentId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        fetchTaskDetails();
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
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

  // Handle File Upload (multi-file and drag & drop)
  const handleFileUpload = async (filesOrEvent: React.ChangeEvent<HTMLInputElement> | File[]) => {
    let files: File[] = [];
    if (Array.isArray(filesOrEvent)) {
      files = filesOrEvent;
    } else if (filesOrEvent?.target?.files) {
      files = Array.from(filesOrEvent.target.files);
    }

    if (files.length === 0) return;

    setIsUploadingFile(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("taskId", task?.id || taskKey);
      if (task?.projectId) formData.append("projectId", task.projectId);
      formData.append("folder", "tasks");

      files.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchTaskDetails();
        if (onTaskUpdated) onTaskUpdated();
      } else {
        setUploadError(json.error?.message || "Failed to upload files");
      }
    } catch (err: any) {
      console.error("File upload error:", err);
      setUploadError(err.message || "Failed to upload file(s)");
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Handle Delete Attachment
  const handleDeleteAttachment = async (attachmentId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete attachment "${fileName}"?`)) return;

    try {
      const res = await fetch(`/api/storage/attachments/${attachmentId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        fetchTaskDetails();
        if (onTaskUpdated) onTaskUpdated();
      } else {
        alert(json.error?.message || "Failed to delete attachment");
      }
    } catch (err) {
      console.error("Delete attachment error:", err);
    }
  };

  // Handle Delete Task (Super Admin, Manager, Project Lead, or Task Creator)
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const handleDeleteTask = async () => {
    if (!confirm(`Are you sure you want to permanently delete task ${taskKey}: "${task?.title}"? This cannot be undone.`)) return;

    setIsDeletingTask(true);
    try {
      const res = await fetch(`/api/tasks/${taskKey}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        onClose();
        if (onTaskUpdated) onTaskUpdated();
      } else {
        alert(json.error?.message || "Failed to delete task");
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
      alert("Failed to delete task due to network error.");
    } finally {
      setIsDeletingTask(false);
    }
  };

  // All workspace users (no project restrictions for tagging, assigning, or mentioning)
  const allAvailableUsers = React.useMemo(() => {
    const map = new Map<string, any>();
    if (Array.isArray(workspaceUsers)) {
      workspaceUsers.forEach((u: any) => {
        if (u && u.id) {
          map.set(u.id, {
            id: u.id,
            name: u.name || "Member",
            email: u.email || "",
            role: u.role || "MEMBER",
            jobTitle: u.jobTitle || u.role?.replace("_", " ") || "Team Member",
            department: u.department || "General",
            avatarUrl: u.avatarUrl,
          });
        }
      });
    }
    return Array.from(map.values());
  }, [workspaceUsers]);

  // Distinct departments for filter tabs in Tag / Share modal
  const availableDepartments = React.useMemo(() => {
    const depts = new Set<string>();
    allAvailableUsers.forEach((u) => {
      if (u.department) depts.add(u.department);
    });
    return ["ALL", ...Array.from(depts)];
  }, [allAvailableUsers]);

  // Project Members Extract
  const projectMembers = React.useMemo(() => {
    if (!task?.project) return allAvailableUsers;
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
            jobTitle: u.jobTitle || m.role || "Team Member",
            department: u.department || "General",
            avatarUrl: u.avatarUrl,
          });
        }
      });
    }
    if (task.project.lead?.id) map.set(task.project.lead.id, { ...task.project.lead, role: "TEAM_LEAD", jobTitle: "Project Lead" });
    if (task.project.teamLead?.id) map.set(task.project.teamLead.id, { ...task.project.teamLead, role: "TEAM_LEAD", jobTitle: "Team Lead" });
    if (task.project.manager?.id) map.set(task.project.manager.id, { ...task.project.manager, role: "PROJECT_MANAGER", jobTitle: "Project Manager" });
    return Array.from(map.values());
  }, [task?.project, allAvailableUsers]);

  if (!task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 text-xs text-slate-500 flex items-center gap-3 shadow-2xl">
          <div className="w-5 h-5 border-2 border-[#FF6200] border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold text-slate-800">Loading #{taskKey}...</span>
        </div>
      </div>
    );
  }

  const firstAssignee = task.assignees?.[0];
  const isWatching = Boolean(task.isWatching);
  const watchersCount = Array.isArray(task.watchers) ? task.watchers.length : 0;
  const filesCount = Array.isArray(task.attachments) ? task.attachments.length : 0;
  const bugsCount = Array.isArray(task.qaBugs) ? task.qaBugs.length : 0;
  const relationsCount = (task.relationsAsSource?.length || 0) + (task.relationsAsTarget?.length || 0) + (task.subtasks?.length || 0);
  const activitiesCount = (task.activities?.length || 0) + (task.comments?.length || 0);

  const canDeleteTask =
    isUserSuperAdmin ||
    currentUser?.role === "MANAGER" ||
    currentUser?.role === "PROJECT_MANAGER" ||
    task.reporterId === currentUser?.id ||
    task.project?.leadId === currentUser?.id ||
    task.project?.teamLeadId === currentUser?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div
        className={`relative w-full bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800 transition-all ${
          isFullscreen ? "h-[98vh] max-w-[98vw]" : "h-[92vh] max-w-6xl"
        }`}
      >
        {/* TOP BAR: Reference to OpenProject Screenshot #1 */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={onClose}
              title="Back to Task List"
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Task Type Badge */}
            <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-[#0066CC]/15 text-[#0066CC] border border-[#0066CC]/30 flex-shrink-0">
              {task.taskType || "TASK"}
            </span>

            {/* Inline Title Editor */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="flex-1 bg-white border border-[#FF6200] rounded-xl px-3 py-1 text-sm font-bold text-gray-900 focus:outline-none"
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
                  className="p-1.5 rounded-lg bg-gray-200 text-gray-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-base font-bold text-gray-900 truncate cursor-pointer hover:text-[#FF6200] transition-colors flex items-center gap-2 group"
                title="Click to inline edit title"
              >
                <span className="truncate">{task.title}</span>
                <Edit2 className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 flex-shrink-0" />
              </h1>
            )}
          </div>

          {/* Action Toolbar on Top Right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Raise Bug / Defect Button */}
            <button
              onClick={() => setIsRaiseBugOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-600 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Log defect or QA bug against this task"
            >
              <Bug className="w-3.5 h-3.5 text-red-500" />
              <span>+ Raise Bug</span>
            </button>

            {/* Tag for Testing / Share Button */}
            <button
              onClick={() => {
                setTagPurpose("TESTING");
                setIsShareModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-xs font-bold text-purple-600 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Tag story to any team member for testing, review, or collaboration"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
              <span>Tag for Testing / Share</span>
            </button>

            {/* Watchers Toggle Button */}
            <button
              onClick={handleToggleWatcher}
              disabled={isWatchingLoading}
              title={isWatching ? "You are watching this task" : "Click to watch task"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isWatching
                  ? "bg-[#00875A]/15 text-[#00875A]  border-[#00875A]/30 font-bold"
                  : "bg-white  border-gray-200  text-gray-700  hover:text-gray-900 "
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isWatching ? `Watching (${watchersCount})` : `Watch (${watchersCount})`}</span>
            </button>

            {/* Delete Task Button */}
            {canDeleteTask && (
              <button
                type="button"
                disabled={isDeletingTask}
                onClick={handleDeleteTask}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-500 transition-all cursor-pointer disabled:opacity-50"
                title="Permanently delete this task"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingTask ? "Deleting..." : "Delete"}</span>
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STATUS & META BAR: Reference to OpenProject Screenshot #1 */}
        <div className="px-6 py-2.5 border-b border-gray-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Selector / Closed Task Lock */}
            {task.status === "CLOSED" && !isUserSuperAdmin ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 shadow-sm">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Closed & Locked</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsReopenModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/30 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                  title="Request Super Admin to reopen this closed task"
                >
                  <Unlock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Request Reopen</span>
                </button>
              </div>
            ) : task.status === "CLOSED" && isUserSuperAdmin ? (
              <div className="flex items-center gap-2">
                <select
                  value={task.status}
                  onChange={(e) => handleUpdateField({ status: e.target.value })}
                  className={`px-3 py-1 rounded-lg font-bold text-xs border cursor-pointer focus:outline-none ${getStatusColor(
                    task.status
                  )}`}
                >
                  <option value="CLOSED">Closed (Locked)</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="READY_FOR_TESTING">Ready for Testing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleUpdateField({ status: "IN_PROGRESS" })}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs bg-gradient-to-r from-[#FF6200] to-[#FF8C42] hover:opacity-95 text-white transition-all cursor-pointer shadow-sm"
                  title="Super Admin 1-Click Reopen"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reopen Task</span>
                </button>
              </div>
            ) : (
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
            )}

            {/* ID & Real Created by & Last Updated */}
            <span className="text-gray-500 text-[11px]">
              <span className="font-mono font-bold text-gray-900">
                #{task.taskKey.replace(/^[A-Za-z]+-/, "") || task.taskKey}
              </span>
              : Created by{" "}
              <span className="font-semibold text-gray-900">{task.reporter?.name || "System"}</span> on{" "}
              {formatDate(task.createdAt)}. Last updated on {formatDateTime(task.updatedAt)}.
            </span>
          </div>

          {/* Quick Assignment Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelfAssign}
              className="px-3 py-1 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Self-Assign
            </button>
            <button
              onClick={() => setIsRelationsOpen(true)}
              className="px-3 py-1 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Relations ({relationsCount})
            </button>
          </div>
        </div>

        {/* Super Admin Reopen Banner for Closed Tasks */}
        {isUserSuperAdmin && task.status === "CLOSED" && (
          <div className="mx-6 mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in shadow-sm">
            <div className="flex items-center gap-2 text-amber-700">
              <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>
                <strong>Closed Ticket Protection:</strong> This ticket is locked from team members. Click to reopen and move it back to In Progress.
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleUpdateField({ status: "IN_PROGRESS" })}
              className="px-3.5 py-1.5 rounded-xl bg-[#FF6200] hover:bg-[#E55800] text-white font-bold text-xs flex items-center gap-1.5 shadow-md flex-shrink-0 cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Approve & Reopen Task</span>
            </button>
          </div>
        )}

        {/* 2-COLUMN MAIN CONTENT (Exact OpenProject Layout) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT COLUMN: Description, People, Details */}
          <div className="w-full md:w-1/2 overflow-y-auto p-6 space-y-6 border-b md:border-b-0 md:border-r border-gray-200">
            {/* Description Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
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
                    className="w-full bg-gray-50 border border-[#FF6200] rounded-xl p-3 text-xs text-gray-900 focus:outline-none"
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
                      className="px-3 py-1.5 rounded-xl bg-gray-200 text-xs text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-800 leading-relaxed cursor-pointer hover:border-[#FF6200]/40 transition-colors whitespace-pre-wrap"
                >
                  {task.description || (
                    <span className="text-gray-400 italic">
                      Click to add detailed task description and context...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* PEOPLE SECTION: Reference to OpenProject Layout */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  PEOPLE & COLLABORATION
                </h3>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="text-xs text-purple-600 hover:underline font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Tag for Testing</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Assignee */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 font-medium">Assignee</span>
                  <div className="flex-1 max-w-xs">
                    <select
                      value={firstAssignee?.id || ""}
                      onChange={(e) => handleUpdateField({ assigneeIds: e.target.value ? [e.target.value] : [] })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 font-semibold focus:outline-none focus:border-[#FF6200]"
                    >
                      <option value="">Unassigned</option>
                      {allAvailableUsers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.department ? `[${m.department}]` : `(${m.role})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Accountable */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 font-medium">Accountable</span>
                  <div className="flex-1 max-w-xs">
                    <select
                      value={task.accountableId || ""}
                      onChange={(e) => handleUpdateField({ accountableId: e.target.value || null })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 font-semibold focus:outline-none focus:border-[#FF6200]"
                    >
                      <option value="">None</option>
                      {allAvailableUsers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.department ? `[${m.department}]` : `(${m.role})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Team Lead */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 font-medium">Team Lead</span>
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
                        <span className="font-semibold text-gray-900">
                          {(task.project.teamLead || task.project.lead).name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Not configured</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* DETAILS SECTION: Reference to OpenProject Screenshot #1 */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                DETAILS
              </h3>

              <div className="space-y-3.5 text-xs">
                {/* Priority */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 font-medium">Priority</span>
                  <div className="flex-1 max-w-xs">
                    <select
                      value={task.priority}
                      onChange={(e) => handleUpdateField({ priority: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 font-semibold focus:outline-none"
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
                  <span className="w-32 text-gray-500 font-medium">Date Range</span>
                  <div className="flex-1 flex items-center gap-2 max-w-xs">
                    <input
                      type="date"
                      value={startDateInput}
                      onChange={(e) => {
                        setStartDateInput(e.target.value);
                        handleUpdateField({ startDate: e.target.value || null });
                      }}
                      className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 text-xs text-gray-900 font-mono focus:outline-none"
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
                      className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 text-xs text-gray-900 font-mono focus:outline-none"
                      title="End Date / Finish Date"
                    />
                  </div>
                </div>

                {/* % Complete (Progress) */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 font-medium flex items-center gap-1">
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
                    <span className="w-10 font-mono font-bold text-right text-gray-900">
                      {progressInput}%
                    </span>
                  </div>
                </div>

                {/* Category */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 font-medium">Category</span>
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
                        className="w-full bg-gray-50 border border-[#FF6200] rounded-xl px-3 py-1 text-xs text-gray-900 focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => setIsEditingCategory(true)}
                        className="text-gray-800 cursor-pointer hover:underline"
                      >
                        {task.category || "-"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Version */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 font-medium flex items-center gap-1">
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
                        className="w-full bg-gray-50 border border-[#FF6200] rounded-xl px-3 py-1 text-xs text-gray-900 focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => setIsEditingVersion(true)}
                        className="text-gray-800 cursor-pointer hover:underline"
                      >
                        {task.version || task.sprint?.name || "-"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Project */}
                <div className="flex items-center justify-between">
                  <span className="w-32 text-gray-500 font-medium">Project</span>
                  <div className="flex-1 max-w-xs font-semibold text-gray-900">
                    {task.project?.name} ({task.project?.key})
                  </div>
                </div>
              </div>
            </div>

            {/* Subtasks Section */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Subtasks / Checklist ({task.subtasks?.filter((s: any) => s.completed).length || 0}/{task.subtasks?.length || 0})
                </h3>
              </div>

              <div className="space-y-2">
                {task.subtasks?.map((st: any) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200"
                  >
                    <label className="flex items-center gap-2.5 text-xs cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={(e) => handleToggleSubtask(st.id, e.target.checked)}
                        className="rounded border-gray-300 text-[#FF6200] focus:ring-[#FF6200]"
                      />
                      <span className={st.completed ? "line-through text-gray-400 " : "text-gray-900 "}>
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
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF6200]"
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
          <div className="w-full md:w-1/2 flex flex-col min-w-0 bg-gray-50/30">
            {/* Tabs Header */}
            <div className="flex border-b border-gray-200 px-6 bg-white overflow-x-auto">
              <button
                onClick={() => setActiveTab("ACTIVITY")}
                className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "ACTIVITY"
                    ? "border-[#0066CC] text-[#0066CC] "
                    : "border-transparent text-gray-500  hover:text-gray-900 "
                }`}
              >
                ACTIVITY ({activitiesCount})
              </button>

              <button
                onClick={() => setActiveTab("FILES")}
                className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "FILES"
                    ? "border-[#0066CC] text-[#0066CC] "
                    : "border-transparent text-gray-500  hover:text-gray-900 "
                }`}
              >
                FILES ({filesCount})
              </button>

              <button
                onClick={() => setActiveTab("RELATIONS")}
                className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "RELATIONS"
                    ? "border-[#0066CC] text-[#0066CC] "
                    : "border-transparent text-gray-500  hover:text-gray-900 "
                }`}
              >
                RELATIONS ({relationsCount})
              </button>

              <button
                onClick={() => setActiveTab("WATCHERS")}
                className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "WATCHERS"
                    ? "border-[#0066CC] text-[#0066CC] "
                    : "border-transparent text-gray-500  hover:text-gray-900 "
                }`}
              >
                WATCHERS ({watchersCount})
              </button>

              <button
                onClick={() => setActiveTab("BUGS")}
                className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "BUGS"
                    ? "border-red-500 text-red-500"
                    : "border-transparent text-gray-500  hover:text-gray-900 "
                }`}
              >
                <Bug className="w-3.5 h-3.5" />
                <span>BUGS &amp; DEFECTS ({bugsCount})</span>
                {bugsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-red-500/20 text-red-400 font-mono font-bold">
                    {bugsCount}
                  </span>
                )}
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
                      <div className="text-center py-12 text-gray-400 text-xs italic">
                        No activity records or comments yet.
                      </div>
                    ) : (
                      <>
                        {/* Render Comments */}
                        {task.comments?.map((comment: any, index: number) => {
                          const isAuthor = comment.authorId === currentUser?.id || currentUser?.role === "SUPER_ADMIN";
                          const isEditing = editingCommentId === comment.id;
                          const isEdited = comment.updatedAt && new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 1000;

                          return (
                            <div
                              key={comment.id}
                              className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2 shadow-sm group"
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
                                  <span className="font-bold text-gray-900">
                                    {comment.author?.name || "Member"}
                                  </span>
                                  <span className="text-[11px] text-gray-400">
                                    {formatDateTime(comment.createdAt)}
                                  </span>
                                  {isEdited && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-[#FF8C42] font-mono font-medium">
                                      (edited)
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {isAuthor && !isEditing && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditComment(comment)}
                                        className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-[#0066CC] cursor-pointer"
                                        title="Edit your comment"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="p-1 rounded hover:bg-red-500/15 text-gray-500 hover:text-red-500 cursor-pointer"
                                        title="Delete comment"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                  <span className="font-mono text-[10px] text-gray-400">#{index + 1}</span>
                                </div>
                              </div>

                              {isEditing ? (
                                <div className="pl-8 space-y-2 pt-1">
                                  <textarea
                                    rows={3}
                                    value={editingCommentText}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEditingCommentText(val);
                                      const lastAt = val.lastIndexOf("@");
                                      if (lastAt !== -1 && lastAt >= val.length - 15) {
                                        setEditingMentionQuery(val.substring(lastAt + 1));
                                      } else {
                                        setEditingMentionQuery(null);
                                      }
                                    }}
                                    className="w-full p-2.5 text-xs text-gray-900 bg-gray-50 border border-[#FF6200] rounded-xl focus:outline-none resize-y"
                                  />

                                  {/* Inline @mention dropdown while editing */}
                                  {editingMentionQuery !== null && (
                                    <div className="p-2 border border-gray-200 bg-white max-h-32 overflow-y-auto space-y-1 rounded-xl shadow-lg">
                                      {allAvailableUsers
                                        .filter((m) => m.name.toLowerCase().includes(editingMentionQuery.toLowerCase()))
                                        .slice(0, 5)
                                        .map((m) => (
                                          <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => {
                                              const lastAt = editingCommentText.lastIndexOf("@");
                                              setEditingCommentText(editingCommentText.substring(0, lastAt) + `@${m.name} `);
                                              setEditingMentionQuery(null);
                                            }}
                                            className="w-full flex items-center justify-between px-2 py-1 rounded text-xs hover:bg-[#FF6200]/15 hover:text-[#FF6200] text-left cursor-pointer"
                                          >
                                            <span className="font-bold">@{m.name}</span>
                                            <span className="text-[10px] text-gray-400 font-mono">({m.department || m.role})</span>
                                          </button>
                                        ))}
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={isSavingCommentEdit || !editingCommentText.trim()}
                                      onClick={() => handleSaveEditComment(comment.id)}
                                      className="px-3 py-1.5 rounded-xl bg-[#0066CC] hover:bg-[#0055AA] text-white font-bold text-xs shadow-sm disabled:opacity-50 cursor-pointer"
                                    >
                                      {isSavingCommentEdit ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditingCommentText("");
                                      }}
                                      className="px-3 py-1.5 rounded-xl bg-gray-200 text-gray-600 text-xs font-semibold hover:text-gray-900 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-800 leading-relaxed pl-8 whitespace-pre-wrap">
                                  {comment.content}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Render Field Changes / Activity Audit */}
                        {task.activities?.map((act: any) => (
                          <div key={act.id} className="flex items-start gap-3 text-xs pl-2 text-gray-600">
                            <div className="w-2 h-2 rounded-full bg-[#0066CC] mt-1.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="font-semibold text-gray-900">{act.user?.name || "System"}</span>{" "}
                              <span>{act.description}</span>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                {formatDateTime(act.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* OpenProject-style Comment Editor Box (Matching Screenshot #1) */}
                  <form onSubmit={handleAddComment} className="pt-3 border-t border-gray-200">
                    <div className="rounded-2xl border border-gray-300 bg-white overflow-hidden focus-within:border-[#0066CC] transition-colors shadow-sm">
                      {/* Editor Toolbar Icons */}
                      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-100 bg-gray-50/80 text-gray-500">
                        <button
                          type="button"
                          onClick={() => setNewComment((prev) => prev + "**text**")}
                          className="p-1 rounded hover:bg-gray-200"
                          title="Bold"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewComment((prev) => prev + "_text_")}
                          className="p-1 rounded hover:bg-gray-200"
                          title="Italic"
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewComment((prev) => prev + "~~text~~")}
                          className="p-1 rounded hover:bg-gray-200"
                          title="Strikethrough"
                        >
                          <Strikethrough className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewComment((prev) => prev + "`code`")}
                          className="p-1 rounded hover:bg-gray-200"
                          title="Code"
                        >
                          <Code className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewComment((prev) => prev + "@")}
                          className="p-1 rounded hover:bg-gray-200 text-[#0066CC] font-bold"
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
                        className="w-full p-3 text-xs text-gray-900 bg-transparent focus:outline-none resize-y"
                      />

                      {/* @Mention Autocomplete Dropdown */}
                      {mentionQuery !== null && (
                        <div className="p-2 border-t border-gray-100 bg-gray-50 max-h-48 overflow-y-auto space-y-1 rounded-b-xl shadow-inner">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 flex items-center justify-between">
                            <span>Tag any team member (@{mentionQuery || "..."}):</span>
                            <span className="text-[#FF6200] font-mono text-[9px]">All Departments</span>
                          </div>
                          {allAvailableUsers
                            .filter(
                              (m) =>
                                m.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                                (m.department && m.department.toLowerCase().includes(mentionQuery.toLowerCase())) ||
                                (m.jobTitle && m.jobTitle.toLowerCase().includes(mentionQuery.toLowerCase()))
                            )
                            .slice(0, 8)
                            .map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  const lastAt = newComment.lastIndexOf("@");
                                  setNewComment(newComment.substring(0, lastAt) + `@${m.name} `);
                                  setMentionQuery(null);
                                }}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#FF6200]/15 hover:text-[#FF6200] text-left cursor-pointer transition-colors group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className={`w-5 h-5 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                      m.name
                                    )} flex items-center justify-center text-[8px] font-bold text-white uppercase flex-shrink-0`}
                                  >
                                    {getInitials(m.name)}
                                  </div>
                                  <span className="font-bold text-gray-900 truncate">
                                    @{m.name}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-mono truncate">
                                    ({m.jobTitle || m.role})
                                  </span>
                                </div>
                                {m.department && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-semibold flex-shrink-0 ml-2">
                                    {m.department}
                                  </span>
                                )}
                              </button>
                            ))}
                        </div>
                      )}

                      {/* Bottom Footer with Send Button */}
                      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/50">
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
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Attached Files ({filesCount})
                    </span>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        multiple
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingFile}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6200] hover:bg-[#E55800] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingFile ? "Uploading Files..." : "Upload Multiple Files"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Multi-file Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleFileUpload(Array.from(e.dataTransfer.files));
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-gray-300 hover:border-[#FF6200] bg-gray-50/50 rounded-2xl text-center cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#FF6200]/10 text-[#FF6200] mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-gray-900">
                      Drag &amp; Drop multiple files here, or <span className="text-[#FF6200] underline">browse</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Supports batch upload of images, documents, PDFs, zip archives, spreadsheets, and test artifacts
                    </p>
                  </div>

                  {uploadError && (
                    <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 text-xs">
                      {uploadError}
                    </div>
                  )}

                  <div className="space-y-2">
                    {filesCount === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-xs italic">
                        No files attached to this task.
                      </div>
                    ) : (
                      task.attachments.map((att: any) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-white border border-gray-200 shadow-sm text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <File className="w-5 h-5 text-[#FF6200] flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-bold text-gray-900 truncate">{att.fileName}</div>
                              <div className="text-[10px] text-gray-400">
                                {(att.fileSize / 1024).toFixed(1)} KB &bull; Uploaded by {att.uploadedBy?.name || "Member"} on {formatDate(att.createdAt)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <a
                              href={att.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600"
                              title="Download attachment"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            {(isUserSuperAdmin || att.uploadedById === currentUser?.id) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteAttachment(att.id, att.fileName)}
                                className="p-2 rounded-xl border border-red-500/30 hover:bg-red-500/15 text-red-500 transition-colors"
                                title="Delete attachment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
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
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Work Package Lineage & Relations
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsRelationsOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-[#0066CC] text-white text-xs font-bold shadow-sm cursor-pointer"
                    >
                      + Manage Relations
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-gray-200 text-xs space-y-3">
                    <div className="font-bold text-gray-900">Subtasks ({task.subtasks?.length || 0})</div>
                    {task.subtasks?.length === 0 ? (
                      <div className="text-gray-400 italic">No child subtasks.</div>
                    ) : (
                      <div className="space-y-1.5">
                        {task.subtasks.map((st: any) => (
                          <div key={st.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                            <span className={st.completed ? "line-through text-gray-400" : "text-gray-800 "}>{st.title}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${st.completed ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-200 "}`}>
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
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
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
                      <div className="text-center py-12 text-gray-400 text-xs italic">
                        No members are watching this work package yet.
                      </div>
                    ) : (
                      task.watchers.map((w: any) => (
                        <div
                          key={w.id}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-200 shadow-sm text-xs"
                        >
                          <div
                            className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                              w.name
                            )} flex items-center justify-center text-[10px] font-black text-white uppercase flex-shrink-0`}
                          >
                            {getInitials(w.name)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{w.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{w.email}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: BUGS & DEFECTS */}
              {activeTab === "BUGS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Linked QA Defects &amp; Bugs ({bugsCount})
                      </span>
                      <p className="text-[11px] text-gray-500">
                        Log unlimited bugs against this task for testing and resolution.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRaiseBugOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-red-600/20 cursor-pointer"
                    >
                      <Bug className="w-3.5 h-3.5" />
                      <span>+ Raise Defect</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {bugsCount === 0 ? (
                      <div className="text-center py-12 border border-dashed border-gray-300 rounded-2xl space-y-3 p-6">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center">
                          <Bug className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-gray-900">
                          No defects reported on this task yet
                        </div>
                        <p className="text-[11px] text-gray-500">
                          If issues are found during development or QA verification, log them here.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsRaiseBugOpen(true)}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Raise First Bug</span>
                        </button>
                      </div>
                    ) : (
                      task.qaBugs.map((bug: any) => (
                        <div
                          key={bug.id}
                          onClick={() => setSelectedBugKey(bug.bugKey)}
                          className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-red-500/40 transition-all cursor-pointer space-y-2 group shadow-sm"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-red-500">{bug.bugKey}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${getStatusColor(bug.status)}`}>
                                {bug.status?.replace(/_/g, " ")}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getPriorityColor(bug.priority)}`}>
                                {bug.priority}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {formatDateTime(bug.updatedAt || bug.createdAt)}
                            </span>
                          </div>

                          <div className="font-bold text-gray-900 group-hover:text-red-400 transition-colors text-xs">
                            {bug.title}
                          </div>

                          {bug.failureReason && (
                            <div className="text-[10px] text-red-500 font-semibold">
                              QA Fail Note: {bug.failureReason}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px] text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <span>Assigned to:</span>
                              <span className="font-semibold text-gray-700">
                                {bug.assignedTo?.name || "Unassigned"}
                              </span>
                            </div>
                            <div>
                              <span>Severity: </span>
                              <span className="font-mono font-bold text-gray-700">{bug.severity || "MEDIUM"}</span>
                            </div>
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

        {/* TAG FOR TESTING & STORY SHARE MODAL */}
        {isShareModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <form
              onSubmit={handleShareTask}
              className="w-full max-w-xl rounded-3xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col text-slate-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Tag Members on Story #{task.taskKey}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tag anyone across all departments for testing or cross-team collaboration.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {shareSuccessMsg && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{shareSuccessMsg}</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* 1. Tag Purpose Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Tag Purpose / Action:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: "TESTING", label: "🧪 Testing / QA", desc: "For QA & test verification" },
                      { id: "REVIEW", label: "👀 Story Review", desc: "Acceptance & criteria review" },
                      { id: "MARKETING", label: "📢 Digital Marketing", desc: "Campaigns & release sync" },
                      { id: "COLLABORATION", label: "🤝 Cross-Team Collab", desc: "Dev & engineering sync" },
                      { id: "GENERAL", label: "📌 General Tag", desc: "Share story details" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setTagPurpose(p.id as any)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          tagPurpose === p.id
                            ? "bg-purple-500/15 border-purple-500 text-purple-600  shadow-sm font-bold"
                            : "bg-gray-50  border-gray-200  text-gray-700  hover:border-gray-400 "
                        }`}
                      >
                        <div className="text-xs font-bold">{p.label}</div>
                        <div className="text-[9px] opacity-75 mt-0.5">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Optional Note */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Note / Instructions (Optional):
                  </label>
                  <input
                    type="text"
                    value={tagNote}
                    onChange={(e) => setTagNote(e.target.value)}
                    placeholder={
                      tagPurpose === "TESTING"
                        ? "e.g., Please run regression testing on the new checkout flow..."
                        : "e.g., Please review acceptance criteria and provide feedback..."
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* 3. Team Member Search & Department Filter */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                      Select Team Members to Tag ({selectedShareUserIds.length} selected):
                    </label>
                    <div className="flex items-center gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = allAvailableUsers.filter(
                            (m) =>
                              (selectedDepartmentFilter === "ALL" || m.department === selectedDepartmentFilter) &&
                              (userSearchQuery === "" ||
                                m.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                (m.department && m.department.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
                                (m.jobTitle && m.jobTitle.toLowerCase().includes(userSearchQuery.toLowerCase())))
                          );
                          setSelectedShareUserIds(Array.from(new Set([...selectedShareUserIds, ...filtered.map((m) => m.id)])));
                        }}
                        className="text-purple-600 font-bold hover:underline"
                      >
                        Select All Visible
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedShareUserIds([])}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Search Input */}
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search by name, department (e.g. QA, Marketing, Backend)..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-purple-500"
                  />

                  {/* Department Pills */}
                  {availableDepartments.length > 2 && (
                    <div className="flex flex-wrap gap-1.5 py-1">
                      {availableDepartments.map((dept) => (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => setSelectedDepartmentFilter(dept)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                            selectedDepartmentFilter === dept
                              ? "bg-purple-600 text-white font-bold"
                              : "bg-gray-100  text-gray-600  hover:text-gray-900 "
                          }`}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Member Selection List */}
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-2xl p-2 bg-gray-50/50">
                    {allAvailableUsers
                      .filter((m) => {
                        if (selectedDepartmentFilter !== "ALL" && m.department !== selectedDepartmentFilter) {
                          return false;
                        }
                        if (userSearchQuery.trim()) {
                          const q = userSearchQuery.toLowerCase();
                          return (
                            m.name.toLowerCase().includes(q) ||
                            (m.department && m.department.toLowerCase().includes(q)) ||
                            (m.jobTitle && m.jobTitle.toLowerCase().includes(q)) ||
                            (m.email && m.email.toLowerCase().includes(q))
                          );
                        }
                        return true;
                      })
                      .map((m) => {
                        const isChecked = selectedShareUserIds.includes(m.id);
                        return (
                          <label
                            key={m.id}
                            className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer text-xs ${
                              isChecked
                                ? "bg-purple-500/10  border border-purple-500/30"
                                : "hover:bg-white  border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
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
                                className="rounded text-purple-600 accent-purple-600 w-3.5 h-3.5"
                              />
                              <div
                                className={`w-6 h-6 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                  m.name
                                )} flex items-center justify-center text-[9px] font-bold text-white uppercase flex-shrink-0`}
                              >
                                {getInitials(m.name)}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-gray-900 truncate block">
                                  {m.name}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono truncate block">
                                  {m.jobTitle || m.role}
                                </span>
                              </div>
                            </div>
                            {m.department && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 font-semibold flex-shrink-0 ml-2">
                                {m.department}
                              </span>
                            )}
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-[10px] text-gray-400 font-mono">
                  {selectedShareUserIds.length} member(s) will receive instant in-app notification
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSharing || selectedShareUserIds.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {isSharing
                        ? "Tagging..."
                        : `Tag & Notify ${selectedShareUserIds.length} Member${selectedShareUserIds.length === 1 ? "" : "s"}`}
                    </span>
                  </button>
                </div>
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
            onSelectTask={(key) => {
              setSelectedBugKey(null);
              if (onSelectTask) onSelectTask(key);
            }}
            onBugUpdated={() => {
              fetchTaskDetails();
              if (onTaskUpdated) onTaskUpdated();
            }}
            users={users}
            currentUser={currentUser}
          />
        )}

        {/* Request Reopen Modal (Closed Task Lock) */}
        {isReopenModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in text-slate-800">
            <form
              onSubmit={handleSendReopenRequest}
              className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                    <Unlock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Request Task Reopen
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Super Admin authorization required
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReopenModalOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reopenSuccessMsg ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{reopenSuccessMsg}</span>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-900">
                      Task #{task.taskKey} is currently closed.
                    </p>
                    <p>
                      Please provide a clear reason why this task needs to be reopened. All Super Admins will be notified immediately to review and approve.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Reason for Reopening <span className="text-[#FF6200]">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={reopenReason}
                      onChange={(e) => setReopenReason(e.target.value)}
                      placeholder="e.g., Regression bug found in QA testing; additional scope required..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF6200]"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsReopenModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReopen || !reopenReason.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingReopen ? "Submitting..." : "Send Request to Super Admin"}</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
