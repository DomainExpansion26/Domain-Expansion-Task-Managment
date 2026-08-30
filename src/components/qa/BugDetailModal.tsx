"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Bug,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Activity as ActivityIcon,
  Paperclip,
  Sparkles,
  Send,
  User,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  Tag,
  Play,
  RotateCcw,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { getPriorityColor, getStatusColor, formatDateTime, getInitials, getAvatarGradient } from "@/lib/utils";
import { QABugFailModal } from "@/components/modals/QABugFailModal";

interface BugDetailModalProps {
  bugKey: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectTask?: (taskKey: string) => void;
  onBugUpdated?: () => void;
  users: any[];
  currentUser: any;
}

export function BugDetailModal({
  bugKey,
  isOpen,
  onClose,
  onSelectTask,
  onBugUpdated,
  users,
  currentUser,
}: BugDetailModalProps) {
  const [bug, setBug] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVITY" | "COMMENTS" | "ATTACHMENTS">("ACTIVITY");
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchBugDetails = async () => {
    if (!bugKey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/qa/bugs/${bugKey}`);
      const json = await res.json();
      if (json.success) {
        setBug(json.data);
      }
    } catch (err) {
      console.error("Failed to load bug details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && bugKey) {
      fetchBugDetails();
    }
  }, [isOpen, bugKey]);

  if (!isOpen) return null;

  const handleUpdateBug = async (fields: Record<string, any>) => {
    try {
      const res = await fetch(`/api/qa/bugs/${bugKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const json = await res.json();
      if (json.success) {
        setBug(json.data);
        if (onBugUpdated) onBugUpdated();
      }
    } catch (err) {
      console.error("Failed to update bug:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/qa/bugs/${bugKey}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setNewComment("");
        fetchBugDetails();
        if (onBugUpdated) onBugUpdated();
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleFailConfirm = async (data: { failureReason: string; actualResult?: string; failureComment?: string }) => {
    await handleUpdateBug({
      status: "FAILED",
      failureReason: data.failureReason,
      actualResult: data.actualResult,
      failureComment: data.failureComment,
    });
  };

  // Mention autocomplete filter
  const matchingUsers = mentionQuery !== null
    ? users.filter((u) => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : [];

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewComment(val);
    const lastAtPos = val.lastIndexOf("@");
    if (lastAtPos !== -1 && lastAtPos === val.length - 1) {
      setMentionQuery("");
    } else if (lastAtPos !== -1) {
      const textAfterAt = val.substring(lastAtPos + 1);
      if (!textAfterAt.includes(" ") && textAfterAt.length <= 15) {
        setMentionQuery(textAfterAt);
      } else {
        setMentionQuery(null);
      }
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (userName: string) => {
    const lastAtPos = newComment.lastIndexOf("@");
    if (lastAtPos !== -1) {
      const before = newComment.substring(0, lastAtPos);
      setNewComment(`${before}@${userName} `);
      setMentionQuery(null);
    }
  };

  const copyBugKey = () => {
    navigator.clipboard.writeText(`${window.location.origin}/qa?bug=${bug?.bugKey || bugKey}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBugStatusBadge = (status: string) => {
    switch (status) {
      case "FAILED":
        return "bg-red-500/15 border-red-500/40 text-red-400";
      case "PASSED":
        return "bg-emerald-500/15 border-emerald-500/40 text-emerald-400";
      case "READY_FOR_TESTING":
        return "bg-purple-500/15 border-purple-500/40 text-purple-300 animate-pulse";
      case "IN_TESTING":
        return "bg-cyan-500/15 border-cyan-500/40 text-cyan-300";
      case "IN_PROGRESS":
        return "bg-blue-500/15 border-blue-500/40 text-blue-300";
      case "ASSIGNED":
        return "bg-amber-500/15 border-amber-500/40 text-amber-300";
      case "CLOSED":
        return "bg-slate-500/15 border-slate-500/40 text-slate-300";
      default:
        return "bg-slate-500/15 border-slate-500/40 text-slate-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[92vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#181818]/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex-shrink-0">
              <Bug className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black text-red-400 tracking-wider">
                  {bug?.bugKey || bugKey}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider bg-red-500/15 border-red-500/30 text-red-400">
                  Bug
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${getBugStatusBadge(
                    bug?.status || "OPEN"
                  )}`}
                >
                  {bug?.status?.replace(/_/g, " ")}
                </span>
                {bug?.priority && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(bug.priority)}`}>
                    {bug.priority}
                  </span>
                )}
              </div>
              <h1 className="text-base sm:text-lg font-black text-white truncate mt-0.5">
                {bug?.title || "Loading defect details..."}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={copyBugKey}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#222] hover:bg-[#2A2A2A] text-[#ACACB8] hover:text-white text-xs font-semibold transition-colors"
              title="Copy Bug Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Share"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#888898] hover:text-white hover:bg-[#252525] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workflow Action Command Strip */}
        <div className="px-6 py-2.5 border-b border-[#2E2E2E] bg-[#111] flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#888898]">
            <span>Workflow Actions:</span>
            {/* Developer Actions */}
            {(bug?.status === "OPEN" || bug?.status === "ASSIGNED") && (
              <button
                onClick={() => handleUpdateBug({ status: "IN_PROGRESS" })}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Working</span>
              </button>
            )}

            {bug?.status === "IN_PROGRESS" && (
              <button
                onClick={() => handleUpdateBug({ status: "READY_FOR_TESTING" })}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mark Ready for Testing</span>
              </button>
            )}

            {/* QA Testing Actions */}
            {bug?.status === "READY_FOR_TESTING" && (
              <button
                onClick={() => handleUpdateBug({ status: "IN_TESTING" })}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Start Testing</span>
              </button>
            )}

            {(bug?.status === "READY_FOR_TESTING" || bug?.status === "IN_TESTING") && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateBug({ status: "PASSED" })}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pass Bug</span>
                </button>
                <button
                  onClick={() => setIsFailModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Fail Bug</span>
                </button>
              </div>
            )}

            {bug?.status === "FAILED" && (
              <button
                onClick={() => handleUpdateBug({ status: "IN_PROGRESS" })}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen / Fix Defect</span>
              </button>
            )}

            {bug?.status === "PASSED" && (
              <button
                onClick={() => handleUpdateBug({ status: "CLOSED" })}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Close Defect</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#888898]">Override:</span>
            <select
              value={bug?.status || "OPEN"}
              onChange={(e) => handleUpdateBug({ status: e.target.value })}
              className="px-2.5 py-1 rounded-lg bg-[#222] border border-[#333] text-xs text-white focus:outline-none"
            >
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="READY_FOR_TESTING">Ready for Testing</option>
              <option value="IN_TESTING">In Testing</option>
              <option value="FAILED">Failed</option>
              <option value="PASSED">Passed</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {/* Main Content Split Panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Main Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-[#2E2E2E]">
            {/* Related Task Breadcrumb / Card */}
            {bug?.relatedTask && (
              <div
                onClick={() => {
                  if (onSelectTask) {
                    onSelectTask(bug.relatedTask.taskKey);
                    onClose();
                  }
                }}
                className="p-4 rounded-xl bg-gray-50/80 dark:bg-gradient-to-r dark:from-[#1A1A1A] dark:to-[#222] border border-gray-200 dark:border-[#333] hover:border-[#FF6200]/50 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#888898] uppercase">Parent Task Link</span>
                    <span className="px-2 py-0.5 rounded bg-[#FF6200]/15 text-[#FF8C42] font-mono font-bold">
                      {bug.relatedTask.taskKey}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[#FF8C42] group-hover:underline text-[11px] font-bold">
                    <span>Open Task Detail</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
                <div className="text-sm font-bold text-white mt-1 group-hover:text-[#FF8C42] transition-colors">
                  {bug.relatedTask.title}
                </div>
              </div>
            )}

            {/* QA Failure Alert Banner (If Failed) */}
            {bug?.status === "FAILED" && bug?.failureReason && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  <span>QA Defect Verification Failed</span>
                </div>
                <div className="text-sm font-semibold text-white">
                  <strong>Reason:</strong> {bug.failureReason}
                </div>
                {bug.actualResult && (
                  <div className="text-xs text-red-200/90 font-mono bg-black/40 p-2.5 rounded-xl border border-red-500/20">
                    <strong>Observed Result:</strong> {bug.actualResult}
                  </div>
                )}
              </div>
            )}

            {/* Defect Description */}
            <div>
              <h3 className="text-xs font-mono font-bold text-[#888898] uppercase tracking-wider mb-2">
                Description & Summary
              </h3>
              <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-xs text-white leading-relaxed whitespace-pre-wrap">
                {bug?.description || "No detailed description provided."}
              </div>
            </div>

            {/* Reproduction Steps */}
            {bug?.stepsToReproduce && (
              <div>
                <h3 className="text-xs font-mono font-bold text-[#888898] uppercase tracking-wider mb-2">
                  Steps to Reproduce
                </h3>
                <div className="p-4 rounded-xl bg-[#171717] border border-[#2E2E2E] font-mono text-xs text-emerald-400/90 leading-relaxed whitespace-pre-wrap">
                  {bug.stepsToReproduce}
                </div>
              </div>
            )}

            {/* Expected vs Actual Comparison */}
            {(bug?.expectedResult || bug?.actualResult) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E]">
                  <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase mb-1">
                    Expected Result
                  </div>
                  <div className="text-xs text-slate-300">{bug.expectedResult || "Not specified"}</div>
                </div>
                <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E]">
                  <div className="text-[10px] font-mono font-bold text-red-400 uppercase mb-1">
                    Actual Result
                  </div>
                  <div className="text-xs text-slate-300">{bug.actualResult || "Not specified"}</div>
                </div>
              </div>
            )}

            {/* Bottom Tabs: Activity & Comments */}
            <div className="pt-4 border-t border-[#2E2E2E]">
              <div className="flex items-center gap-4 border-b border-[#2E2E2E] pb-2 text-xs">
                <button
                  onClick={() => setActiveTab("ACTIVITY")}
                  className={`flex items-center gap-2 pb-2 font-bold transition-colors ${
                    activeTab === "ACTIVITY"
                      ? "text-[#FF8C42] border-b-2 border-[#FF6200]"
                      : "text-[#888898] hover:text-white"
                  }`}
                >
                  <ActivityIcon className="w-4 h-4" />
                  <span>Activity Timeline ({bug?.activities?.length || 0})</span>
                </button>
                <button
                  onClick={() => setActiveTab("COMMENTS")}
                  className={`flex items-center gap-2 pb-2 font-bold transition-colors ${
                    activeTab === "COMMENTS"
                      ? "text-[#FF8C42] border-b-2 border-[#FF6200]"
                      : "text-[#888898] hover:text-white"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Comments & Mentions ({bug?.comments?.length || 0})</span>
                </button>
              </div>

              {/* Tab: Activity Timeline */}
              {activeTab === "ACTIVITY" && (
                <div className="pt-4 space-y-3">
                  {bug?.activities?.length === 0 ? (
                    <div className="text-xs text-[#888898] py-6 text-center">No activity entries yet.</div>
                  ) : (
                    bug?.activities?.map((act: any) => (
                      <div key={act.id} className="flex items-start gap-3 text-xs">
                        <div
                          className={`w-6 h-6 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                            act.user?.name
                          )} text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0 mt-0.5`}
                        >
                          {getInitials(act.user?.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-300">
                            <span className="font-bold text-white">{act.user?.name || "System"}</span>{" "}
                            <span>{act.description}</span>
                          </div>
                          <div className="text-[10px] text-[#888898] mt-0.5">
                            {formatDateTime(act.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Comments */}
              {activeTab === "COMMENTS" && (
                <div className="pt-4 space-y-4">
                  <div className="space-y-3">
                    {bug?.comments?.map((c: any) => (
                      <div key={c.id} className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                c.author?.name
                              )} text-[10px] font-bold text-white flex items-center justify-center`}
                            >
                              {getInitials(c.author?.name)}
                            </div>
                            <span className="font-bold text-white">{c.author?.name}</span>
                            <span className="text-[10px] text-[#888898]">{c.author?.role?.replace("_", " ")}</span>
                          </div>
                          <span className="text-[10px] text-[#888898]">{formatDateTime(c.createdAt)}</span>
                        </div>
                        <div className="text-xs text-slate-200 whitespace-pre-wrap pl-8">
                          {c.content}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comment Input */}
                  <form onSubmit={handleAddComment} className="relative pt-2">
                    {mentionQuery !== null && matchingUsers.length > 0 && (
                      <div className="absolute bottom-full mb-2 left-0 w-64 bg-[#1E1E1E] border border-[#333] rounded-xl shadow-2xl p-1 z-30 space-y-0.5">
                        <div className="px-2.5 py-1 text-[10px] font-mono text-[#888898] uppercase">Mention Member</div>
                        {matchingUsers.slice(0, 5).map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => insertMention(u.name)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#2A2A2A] text-left text-xs text-white"
                          >
                            <div className="w-5 h-5 rounded-full bg-[#FF6200] text-[9px] font-bold flex items-center justify-center">
                              {getInitials(u.name)}
                            </div>
                            <span className="font-semibold">{u.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <textarea
                        rows={2}
                        value={newComment}
                        onChange={handleCommentChange}
                        placeholder="Write a comment or mention someone with @Name..."
                        className="flex-1 px-3.5 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs placeholder-[#666] focus:border-[#FF6200] focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingComment || !newComment.trim()}
                        className="px-4 py-3 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Right Properties Panel */}
          <div className="w-full md:w-80 bg-[#111] p-6 space-y-5 overflow-y-auto">
            <h3 className="text-xs font-mono font-bold text-[#888898] uppercase tracking-wider">
              Defect Properties
            </h3>

            {/* Responsible Developer */}
            <div>
              <label className="block text-[11px] font-mono text-[#888898] uppercase mb-1">
                Assigned Developer
              </label>
              <select
                value={bug?.assignedToId || ""}
                onChange={(e) => handleUpdateBug({ assignedToId: e.target.value || null })}
                className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:outline-none"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role?.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>

            {/* QA Reporter */}
            <div>
              <label className="block text-[11px] font-mono text-[#888898] uppercase mb-1">QA Reporter</label>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E]">
                <div
                  className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                    bug?.createdBy?.name
                  )} text-xs font-bold text-white flex items-center justify-center`}
                >
                  {getInitials(bug?.createdBy?.name)}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{bug?.createdBy?.name || "QA Engineer"}</div>
                  <div className="text-[10px] text-[#888898]">{bug?.createdBy?.email}</div>
                </div>
              </div>
            </div>

            {/* Priority Dropdown */}
            <div>
              <label className="block text-[11px] font-mono text-[#888898] uppercase mb-1">Priority</label>
              <select
                value={bug?.priority || "MEDIUM"}
                onChange={(e) => handleUpdateBug({ priority: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:outline-none"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Severity Dropdown */}
            <div>
              <label className="block text-[11px] font-mono text-[#888898] uppercase mb-1">Severity</label>
              <select
                value={bug?.severity || "MEDIUM"}
                onChange={(e) => handleUpdateBug({ severity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:outline-none"
              >
                <option value="CRITICAL">Critical (Crash / Blocker)</option>
                <option value="MAJOR">Major</option>
                <option value="MEDIUM">Medium</option>
                <option value="MINOR">Minor</option>
                <option value="TRIVIAL">Trivial</option>
              </select>
            </div>

            {/* Environment */}
            <div>
              <label className="block text-[11px] font-mono text-[#888898] uppercase mb-1">Environment</label>
              <select
                value={bug?.environment || "Production"}
                onChange={(e) => handleUpdateBug({ environment: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:outline-none"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="QA / Test">QA / Test</option>
                <option value="Development">Development</option>
              </select>
            </div>

            {/* Timestamps */}
            <div className="pt-3 border-t border-[#2E2E2E] space-y-2 text-[11px] text-[#888898]">
              <div className="flex justify-between">
                <span>Reported:</span>
                <span className="text-slate-300">{bug?.createdAt ? formatDateTime(bug.createdAt) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="text-slate-300">{bug?.updatedAt ? formatDateTime(bug.updatedAt) : "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QA Fail Modal */}
      <QABugFailModal
        isOpen={isFailModalOpen}
        onClose={() => setIsFailModalOpen(false)}
        bugKey={bug?.bugKey || bugKey}
        bugTitle={bug?.title || ""}
        developerName={bug?.assignedTo?.name}
        onConfirmFail={handleFailConfirm}
      />
    </div>
  );
}
