"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getPriorityColor, getStatusColor, formatDate } from "@/lib/utils";

interface MyWorkViewProps {
  tasks: any[];
  currentUser: any;
  onSelectTask: (key: string) => void;
  onStatusChange: (taskKey: string, newStatus: string) => void;
  onOpenCreateTask: () => void;
  onToggleAI: () => void;
}

export function MyWorkView({
  tasks,
  currentUser,
  onSelectTask,
  onStatusChange,
  onOpenCreateTask,
  onToggleAI,
}: MyWorkViewProps) {
  const [activeCategory, setActiveCategory] = useState<"ALL" | "TODAY" | "IN_PROGRESS" | "OVERDUE" | "COMPLETED">("ALL");

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Filter tasks assigned to current user
  const myTasks = tasks.filter((t) =>
    t.assignees?.some((a: any) => a.id === currentUser?.id || a.email === currentUser?.email)
  );

  const overdue = myTasks.filter(
    (t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < now && new Date(t.dueDate).toISOString().split("T")[0] !== todayStr
  );
  const inProgress = myTasks.filter((t) => t.status === "IN_PROGRESS");
  const today = myTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate).toISOString().split("T")[0] === todayStr && t.status !== "DONE"
  );
  const completed = myTasks.filter((t) => t.status === "DONE");
  const upcoming = myTasks.filter(
    (t) => t.status !== "DONE" && (!t.dueDate || new Date(t.dueDate) > now) && !today.includes(t) && !inProgress.includes(t)
  );

  const getFilteredTasks = () => {
    switch (activeCategory) {
      case "TODAY":
        return today;
      case "IN_PROGRESS":
        return inProgress;
      case "OVERDUE":
        return overdue;
      case "COMPLETED":
        return completed;
      default:
        return myTasks;
    }
  };

  const displayed = getFilteredTasks();

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-[#FF6200]" />
            <span>My Work</span>
          </h1>
          <p className="text-xs text-[#888898] mt-1">
            Personal cockpit &bull; Track your active assignments, priorities, and deadlines
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleAI}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Work Summary</span>
          </button>
          <button
            onClick={onOpenCreateTask}
            className="px-3.5 py-1.5 rounded-lg bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold transition-colors"
          >
            + Create Task
          </button>
        </div>
      </div>

      {/* Summary KPI Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveCategory("ALL")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeCategory === "ALL"
              ? "bg-[#1A1A1A] border-[#FF6200] shadow-[0_0_15px_rgba(255,98,0,0.15)]"
              : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
          }`}
        >
          <div className="text-[11px] text-[#888898] font-mono uppercase">All Assigned</div>
          <div className="text-xl font-black text-white mt-1">{myTasks.length}</div>
        </button>

        <button
          onClick={() => setActiveCategory("TODAY")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeCategory === "TODAY"
              ? "bg-[#1A1A1A] border-[#FF6200] shadow-[0_0_15px_rgba(255,98,0,0.15)]"
              : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
          }`}
        >
          <div className="text-[11px] text-[#888898] font-mono uppercase flex items-center gap-1">
            <span>Today</span>
          </div>
          <div className="text-xl font-black text-amber-400 mt-1">{today.length}</div>
        </button>

        <button
          onClick={() => setActiveCategory("IN_PROGRESS")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeCategory === "IN_PROGRESS"
              ? "bg-[#1A1A1A] border-[#FF6200] shadow-[0_0_15px_rgba(255,98,0,0.15)]"
              : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
          }`}
        >
          <div className="text-[11px] text-[#888898] font-mono uppercase">In Progress</div>
          <div className="text-xl font-black text-blue-400 mt-1">{inProgress.length}</div>
        </button>

        <button
          onClick={() => setActiveCategory("OVERDUE")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeCategory === "OVERDUE"
              ? "bg-[#1A1A1A] border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
          }`}
        >
          <div className="text-[11px] text-red-400 font-mono uppercase">Overdue</div>
          <div className="text-xl font-black text-red-400 mt-1">{overdue.length}</div>
        </button>

        <button
          onClick={() => setActiveCategory("COMPLETED")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeCategory === "COMPLETED"
              ? "bg-[#1A1A1A] border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
          }`}
        >
          <div className="text-[11px] text-[#888898] font-mono uppercase">Completed</div>
          <div className="text-xl font-black text-emerald-400 mt-1">{completed.length}</div>
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#141414] border border-[#2E2E2E]">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-white">No tasks in this view</div>
            <div className="text-xs text-[#888898] mt-1">You are all caught up!</div>
          </div>
        ) : (
          displayed.map((task) => {
            const pColor = getPriorityColor(task.priority);
            const sColor = getStatusColor(task.status);
            const isOverdue = task.status !== "DONE" && task.dueDate && new Date(task.dueDate) < now;

            return (
              <div
                key={task.id}
                className="p-4 rounded-xl bg-[#141414] border border-[#2E2E2E] hover:border-[#FF6200]/40 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div
                  onClick={() => onSelectTask(task.taskKey)}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#FF8C42] bg-[#FF6200]/10 px-2 py-0.5 rounded border border-[#FF6200]/20">
                      {task.taskKey}
                    </span>
                    <span className="text-xs text-[#888898]">{task.project?.name}</span>
                    {task.sprint && (
                      <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded font-mono">
                        {task.sprint.name}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-white group-hover:text-[#FF8C42] transition-colors mt-1.5">
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-xs text-[#888898] line-clamp-1 mt-1">{task.description}</div>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-[11px] text-[#888898]">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] ${pColor.bg}`}>
                      {pColor.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] ${sColor.bg}`}>
                      {sColor.label}
                    </span>
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 ${isOverdue ? "text-red-400 font-bold" : ""}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(task.dueDate)}</span>
                      </span>
                    )}
                    {task.subtasks?.length > 0 && (
                      <span>
                        Subtasks: {task.subtasks.filter((s: any) => s.completed).length}/{task.subtasks.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Status Changers */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#2E2E2E]">
                  {task.status === "TODO" && (
                    <button
                      onClick={() => onStatusChange(task.taskKey, "IN_PROGRESS")}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 text-xs font-semibold transition-colors"
                    >
                      Start Work &rarr;
                    </button>
                  )}
                  {task.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => onStatusChange(task.taskKey, "IN_REVIEW")}
                      className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 text-xs font-semibold transition-colors"
                    >
                      Ready for Review &rarr;
                    </button>
                  )}
                  {task.status === "IN_REVIEW" && (
                    <button
                      onClick={() => onStatusChange(task.taskKey, "DONE")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-semibold transition-colors"
                    >
                      Mark as Done &check;
                    </button>
                  )}
                  {task.status === "DONE" && (
                    <span className="text-xs text-emerald-400 font-semibold px-2 py-1 bg-emerald-500/10 rounded">
                      Completed &check;
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
