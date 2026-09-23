"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Bug,
  AtSign,
  Eye,
  XCircle,
  ExternalLink,
  Tag,
} from "lucide-react";
import { getPriorityColor, getStatusColor, formatDate, formatDateTime, getInitials, getAvatarGradient } from "@/lib/utils";
import { BugDetailModal } from "@/components/qa/BugDetailModal";

interface MyWorkViewProps {
  tasks: any[];
  currentUser: any;
  users?: any[];
  onSelectTask: (key: string) => void;
  onSelectBug?: (bugKey: string) => void;
  onStatusChange: (taskKey: string, newStatus: string) => void;
  onOpenCreateTask: () => void;
  onToggleAI?: () => void;
}

export function MyWorkView({
  tasks,
  currentUser,
  users = [],
  onSelectTask,
  onSelectBug,
  onStatusChange,
  onOpenCreateTask,
  onToggleAI,
}: MyWorkViewProps) {
  const [mainTab, setMainTab] = useState<"TASKS" | "BUGS" | "READY_TESTING" | "MENTIONS" | "WATCHING">("TASKS");
  const [taskCategory, setTaskCategory] = useState<"ALL" | "TODAY" | "IN_PROGRESS" | "OVERDUE" | "COMPLETED">("ALL");

  const [myBugs, setMyBugs] = useState<any[]>([]);
  const [mentions, setMentions] = useState<any[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [selectedBugKey, setSelectedBugKey] = useState<string | null>(null);

  const fetchDeveloperData = async () => {
    setLoadingExtra(true);
    try {
      const res = await fetch("/api/developer/dashboard");
      const json = await res.json();
      if (json.success && json.data) {
        setMyBugs(json.data.myBugs || []);
        setMentions(json.data.mentions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExtra(false);
    }
  };

  useEffect(() => {
    fetchDeveloperData();
  }, []);

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Filter tasks assigned to current user
  const myTasks = tasks.filter((t) =>
    t.assignees?.some((a: any) => a.id === currentUser?.id || a.email === currentUser?.email)
  );

  const overdueTasks = myTasks.filter(
    (t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < now && new Date(t.dueDate).toISOString().split("T")[0] !== todayStr
  );
  const inProgressTasks = myTasks.filter((t) => t.status === "IN_PROGRESS");
  const todayTasks = myTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate).toISOString().split("T")[0] === todayStr && t.status !== "DONE"
  );
  const completedTasks = myTasks.filter((t) => t.status === "DONE");

  // Bugs breakdown
  const failedBugs = myBugs.filter((b) => b.status === "FAILED" || b.status === "REOPENED");
  const readyBugs = myBugs.filter((b) => b.status === "READY_FOR_TESTING");
  const activeBugs = myBugs.filter((b) => b.status !== "PASSED" && b.status !== "CLOSED");

  // Ready for Testing items (tasks + bugs)
  const readyTasks = tasks.filter((t) => t.status === "READY_FOR_TESTING");

  const getFilteredTasks = () => {
    switch (taskCategory) {
      case "TODAY":
        return todayTasks;
      case "IN_PROGRESS":
        return inProgressTasks;
      case "OVERDUE":
        return overdueTasks;
      case "COMPLETED":
        return completedTasks;
      default:
        return myTasks;
    }
  };

  const displayedTasks = getFilteredTasks();

  const handleBugClick = (key: string) => {
    if (onSelectBug) {
      onSelectBug(key);
    } else {
      setSelectedBugKey(key);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-[#FF6200]" />
            <span>My Work & Engineering Cockpit</span>
          </h1>
          <p className="text-xs text-[#888898] mt-1">
            Personal workbench &bull; Assigned tasks, QA defect triage, verification queue, and mentions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCreateTask}
            className="px-3.5 py-1.5 rounded-lg bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold transition-colors"
          >
            + Create Task
          </button>
        </div>
      </div>

      {/* Main 5 Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2E2E2E] pb-3 text-xs overflow-x-auto">
        <button
          onClick={() => setMainTab("TASKS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
            mainTab === "TASKS"
              ? "bg-[#FF6200]/15 text-[#FF8C42] border border-[#FF6200]/30 shadow-sm"
              : "text-[#888898] hover:text-white hover:bg-[#1A1A1A]"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>My Tasks ({myTasks.length})</span>
        </button>

        <button
          onClick={() => setMainTab("BUGS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
            mainTab === "BUGS"
              ? "bg-red-500/15 text-red-400 border border-red-500/30 shadow-sm"
              : "text-[#888898] hover:text-white hover:bg-[#1A1A1A]"
          }`}
        >
          <Bug className="w-4 h-4" />
          <span>My Bugs ({myBugs.length})</span>
          {failedBugs.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-mono">
              {failedBugs.length} Failed
            </span>
          )}
        </button>

        <button
          onClick={() => setMainTab("READY_TESTING")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
            mainTab === "READY_TESTING"
              ? "bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-sm"
              : "text-[#888898] hover:text-white hover:bg-[#1A1A1A]"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Ready for Testing ({readyBugs.length + readyTasks.length})</span>
        </button>

        <button
          onClick={() => setMainTab("MENTIONS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
            mainTab === "MENTIONS"
              ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm"
              : "text-[#888898] hover:text-white hover:bg-[#1A1A1A]"
          }`}
        >
          <AtSign className="w-4 h-4" />
          <span>Mentions ({mentions.length})</span>
        </button>
      </div>

      {/* TAB 1: MY TASKS */}
      {mainTab === "TASKS" && (
        <div className="space-y-5">
          {/* Summary KPI Category Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              onClick={() => setTaskCategory("ALL")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                taskCategory === "ALL"
                  ? "bg-[#1A1A1A] border-[#FF6200] shadow-[0_0_15px_rgba(255,98,0,0.15)]"
                  : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
              }`}
            >
              <div className="text-[11px] text-[#888898] font-mono uppercase">All Assigned</div>
              <div className="text-xl font-black text-white mt-1">{myTasks.length}</div>
            </button>

            <button
              onClick={() => setTaskCategory("TODAY")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                taskCategory === "TODAY"
                  ? "bg-[#1A1A1A] border-[#FF6200] shadow-[0_0_15px_rgba(255,98,0,0.15)]"
                  : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
              }`}
            >
              <div className="text-[11px] text-[#888898] font-mono uppercase">Due Today</div>
              <div className="text-xl font-black text-amber-400 mt-1">{todayTasks.length}</div>
            </button>

            <button
              onClick={() => setTaskCategory("IN_PROGRESS")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                taskCategory === "IN_PROGRESS"
                  ? "bg-[#1A1A1A] border-[#FF6200] shadow-[0_0_15px_rgba(255,98,0,0.15)]"
                  : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
              }`}
            >
              <div className="text-[11px] text-[#888898] font-mono uppercase">In Progress</div>
              <div className="text-xl font-black text-blue-400 mt-1">{inProgressTasks.length}</div>
            </button>

            <button
              onClick={() => setTaskCategory("OVERDUE")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                taskCategory === "OVERDUE"
                  ? "bg-[#1A1A1A] border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
              }`}
            >
              <div className="text-[11px] text-[#888898] font-mono uppercase">Overdue</div>
              <div className="text-xl font-black text-red-400 mt-1">{overdueTasks.length}</div>
            </button>

            <button
              onClick={() => setTaskCategory("COMPLETED")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                taskCategory === "COMPLETED"
                  ? "bg-[#1A1A1A] border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
              }`}
            >
              <div className="text-[11px] text-[#888898] font-mono uppercase">Done</div>
              <div className="text-xl font-black text-emerald-400 mt-1">{completedTasks.length}</div>
            </button>
          </div>

          {/* Tasks List */}
          <div className="space-y-2.5">
            {displayedTasks.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#888898] bg-[#141414] rounded-2xl border border-[#2E2E2E]">
                No tasks in this category.
              </div>
            ) : (
              displayedTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task.taskKey)}
                  className="p-4 rounded-xl bg-[#141414] border border-[#2E2E2E] hover:border-[#FF6200]/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-black text-[#FF8C42]">
                      {task.taskKey}
                    </span>
                    <span className="text-sm font-bold text-white group-hover:text-[#FF8C42] transition-colors truncate">
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${getStatusColor(task.status)}`}>
                      {task.status?.replace(/_/g, " ")}
                    </span>
                    {task.dueDate && (
                      <span className="text-[11px] text-[#888898] font-mono">
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#888898] group-hover:text-white" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY BUGS */}
      {mainTab === "BUGS" && (
        <div className="space-y-4">
          {/* Failed Bugs Alert Banner */}
          {failedBugs.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-red-300 uppercase tracking-wider">
                    {failedBugs.length} Defect(s) Failed QA Verification
                  </h4>
                  <p className="text-xs text-white mt-0.5">
                    QA has tested and marked these bugs as failed. Please review QA notes and re-test.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bugs Table */}
          <div className="rounded-2xl border border-[#2E2E2E] bg-[#141414] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181818] border-b border-[#2E2E2E] text-[10px] font-mono uppercase text-[#888898]">
                  <tr>
                    <th className="py-3 px-4">Bug ID</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Related Task</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">QA Reporter</th>
                    <th className="py-3 px-4">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E2E2E]/60">
                  {myBugs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-xs text-[#888898]">
                        🎉 No active bugs assigned to you.
                      </td>
                    </tr>
                  ) : (
                    myBugs.map((b) => (
                      <tr
                        key={b.id}
                        onClick={() => handleBugClick(b.bugKey)}
                        className={`hover:bg-[#1A1A1A] transition-colors cursor-pointer group ${
                          b.status === "FAILED" ? "bg-red-950/15" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-red-400 whitespace-nowrap">
                          {b.bugKey}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white group-hover:text-[#FF8C42] max-w-xs truncate">
                          {b.title}
                          {b.failureReason && (
                            <div className="text-[10px] text-red-400 font-semibold truncate mt-0.5">
                              Fail reason: {b.failureReason}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {b.relatedTask ? (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTask(b.relatedTask.taskKey);
                              }}
                              className="px-2 py-0.5 rounded bg-[#FF6200]/15 text-[#FF8C42] font-mono font-bold hover:underline"
                            >
                              {b.relatedTask.taskKey}
                            </span>
                          ) : (
                            <span className="text-[#666]">Standalone</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(b.priority)}`}>
                            {b.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${
                              b.status === "FAILED"
                                ? "bg-red-500/20 border-red-500/40 text-red-400"
                                : b.status === "READY_FOR_TESTING"
                                ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                                : b.status === "PASSED"
                                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                : "bg-blue-500/20 border-blue-500/40 text-blue-300"
                            }`}
                          >
                            {b.status?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#888898]">
                          {b.createdBy?.name || "QA"}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-[10px] text-[#888898]">
                          {formatDateTime(b.updatedAt || b.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: READY FOR TESTING */}
      {mainTab === "READY_TESTING" && (
        <div className="space-y-4">
          <div className="text-xs text-[#888898]">
            Items currently awaiting QA verification and defect re-testing:
          </div>

          <div className="space-y-2.5">
            {readyBugs.length === 0 && readyTasks.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#888898] bg-[#141414] rounded-2xl border border-[#2E2E2E]">
                No items currently in "Ready for Testing" state.
              </div>
            ) : (
              <>
                {readyBugs.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleBugClick(b.bugKey)}
                    className="p-4 rounded-xl bg-[#141414] border border-purple-500/40 hover:border-purple-500 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black text-red-400">{b.bugKey}</span>
                      <span className="text-xs font-bold text-white group-hover:text-purple-300">
                        {b.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border bg-purple-500/20 border-purple-500/40 text-purple-300 uppercase">
                        Ready for Testing
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#888898]" />
                    </div>
                  </div>
                ))}

                {readyTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t.taskKey)}
                    className="p-4 rounded-xl bg-[#141414] border border-purple-500/40 hover:border-purple-500 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black text-[#FF8C42]">{t.taskKey}</span>
                      <span className="text-xs font-bold text-white group-hover:text-purple-300">
                        {t.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border bg-purple-500/20 border-purple-500/40 text-purple-300 uppercase">
                        Task: Ready for Testing
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#888898]" />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MENTIONS */}
      {mainTab === "MENTIONS" && (
        <div className="space-y-3">
          {mentions.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#888898] bg-[#141414] rounded-2xl border border-[#2E2E2E]">
              No active @mentions found.
            </div>
          ) : (
            mentions.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  if (m.bugId) handleBugClick(m.bugId);
                  else if (m.taskId) onSelectTask(m.taskId);
                }}
                className="p-4 rounded-xl bg-[#141414] border border-[#2E2E2E] hover:border-[#FF6200]/40 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-blue-400" />
                    <span>{m.title}</span>
                  </span>
                  <span className="text-[10px] text-[#888898]">{formatDateTime(m.createdAt)}</span>
                </div>
                <div className="text-xs text-[#ACACB8] mt-1">{m.message}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Standalone Bug Detail Modal */}
      {selectedBugKey && (
        <BugDetailModal
          bugKey={selectedBugKey}
          isOpen={Boolean(selectedBugKey)}
          onClose={() => setSelectedBugKey(null)}
          onSelectTask={(taskKey) => {
            setSelectedBugKey(null);
            onSelectTask(taskKey);
          }}
          onBugUpdated={fetchDeveloperData}
          users={users}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
