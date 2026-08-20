"use client";

import React, { useState } from "react";
import {
  Columns3,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Paperclip,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Network,
  Trash2,
  Eye,
  Clock,
  AlertTriangle,
  Users,
  SlidersHorizontal,
  LayoutGrid,
  ListFilter,
  Flame,
  Building,
} from "lucide-react";
import { getPriorityColor, getStatusColor, getTypeIcon, formatDate, getInitials, getAvatarGradient } from "@/lib/utils";
import { TaskRelationsModal } from "@/components/modals/TaskRelationsModal";

interface KanbanViewProps {
  tasks: any[];
  projects: any[];
  currentUser: any;
  onSelectTask: (key: string) => void;
  onStatusChange: (taskKey: string, newStatus: string) => void;
  onOpenCreateTask: (defaultStatus?: string) => void;
}

const COLUMNS = [
  { id: "TODO", label: "To Do", color: "border-slate-500/30 text-slate-300 bg-slate-500/10" },
  { id: "IN_PROGRESS", label: "In Progress", color: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
  { id: "IN_REVIEW", label: "In Review", color: "border-purple-500/30 text-purple-400 bg-purple-500/10" },
  { id: "BLOCKED", label: "Blocked", color: "border-rose-500/30 text-rose-400 bg-rose-500/10" },
  { id: "DONE", label: "Done", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" },
];

export function KanbanView({
  tasks,
  projects,
  currentUser,
  onSelectTask,
  onStatusChange,
  onOpenCreateTask,
}: KanbanViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [dueFilter, setDueFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [cardDensity, setCardDensity] = useState<"detailed" | "compact">("detailed");
  const [draggedTaskKey, setDraggedTaskKey] = useState<string | null>(null);
  const [showWorkload, setShowWorkload] = useState(false);

  // Relations modal
  const [relationsTaskKey, setRelationsTaskKey] = useState<string | null>(null);
  const [activeMenuKey, setActiveMenuKey] = useState<string | null>(null);

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 7);

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedProjectId !== "ALL" && t.projectId !== selectedProjectId) return false;
    if (onlyMyTasks && !t.assignees?.some((a: any) => a.id === currentUser?.id || a.email === currentUser?.email))
      return false;
    if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
    if (typeFilter !== "ALL" && t.taskType !== typeFilter) return false;

    if (selectedDepartment !== "ALL") {
      const matchAssignee = t.assignees?.some((a: any) => {
        const d = (a.department || a.jobTitle || "").toUpperCase();
        if (selectedDepartment === "FRONTEND" && (d.includes("FRONT") || d.includes("REACT") || d.includes("WEB"))) return true;
        if (selectedDepartment === "BACKEND" && (d.includes("BACK") || d.includes("NODE") || d.includes("API") || d.includes("DATABASE"))) return true;
        if (selectedDepartment === "UI_UX" && (d.includes("UI") || d.includes("UX") || d.includes("DESIGN"))) return true;
        if (selectedDepartment === "QA" && (d.includes("QA") || d.includes("TEST") || d.includes("QUALITY"))) return true;
        if (selectedDepartment === "MARKETING" && (d.includes("MARKET") || d.includes("SEO") || d.includes("GROWTH"))) return true;
        return d.includes(selectedDepartment);
      });
      const matchDeptField = t.department && t.department.toUpperCase().includes(selectedDepartment);
      const matchTaskType = (selectedDepartment === "QA" && (t.taskType === "BUG" || t.taskType === "QA_DEFECT")) ||
                            (selectedDepartment === "UI_UX" && (t.taskType === "STORY" || t.title.toLowerCase().includes("design") || t.title.toLowerCase().includes("ui")));
      if (!matchAssignee && !matchDeptField && !matchTaskType) return false;
    }

    if (dueFilter !== "ALL" && t.dueDate) {
      const taskDue = new Date(t.dueDate);
      const dueStr = taskDue.toISOString().split("T")[0];
      if (dueFilter === "OVERDUE" && (dueStr < todayStr && t.status !== "DONE")) return true;
      if (dueFilter === "TODAY" && dueStr === todayStr) return true;
      if (dueFilter === "THIS_WEEK" && taskDue <= endOfWeek && taskDue >= now) return true;
      return false;
    } else if (dueFilter !== "ALL" && !t.dueDate) {
      return false;
    }

    if (
      searchQuery &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.taskKey.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  // Calculate Board Metrics
  const totalCards = filteredTasks.length;
  const inProgressCount = filteredTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const inReviewCount = filteredTasks.filter((t) => t.status === "IN_REVIEW").length;
  const blockedCount = filteredTasks.filter((t) => t.status === "BLOCKED").length;
  const doneCount = filteredTasks.filter((t) => t.status === "DONE").length;
  const totalHoursLogged = filteredTasks.reduce((acc, t) => acc + (t.loggedHours || 0), 0);
  const totalHoursEstimated = filteredTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);

  // Calculate Team Workload
  const memberWorkloadMap: Record<string, { name: string; avatarUrl?: string; count: number; hours: number }> = {};
  filteredTasks.forEach((t) => {
    t.assignees?.forEach((a: any) => {
      if (!memberWorkloadMap[a.id]) {
        memberWorkloadMap[a.id] = { name: a.name, avatarUrl: a.avatarUrl, count: 0, hours: 0 };
      }
      memberWorkloadMap[a.id].count += 1;
      memberWorkloadMap[a.id].hours += t.loggedHours || 0;
    });
  });
  const memberWorkloads = Object.values(memberWorkloadMap);

  const handleDragStart = (e: React.DragEvent, taskKey: string) => {
    e.dataTransfer.setData("text/plain", taskKey);
    setDraggedTaskKey(taskKey);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    const taskKey = e.dataTransfer.getData("text/plain") || draggedTaskKey;
    if (taskKey) {
      onStatusChange(taskKey, columnStatus);
    }
    setDraggedTaskKey(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] space-y-3 animate-fade-in" onClick={() => setActiveMenuKey(null)}>
      {/* Top Metrics Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 p-3 rounded-2xl bg-[#141414] border border-[#2E2E2E] text-xs">
        <div className="flex items-center gap-2 px-2 border-r border-[#2E2E2E]">
          <LayoutGrid className="w-3.5 h-3.5 text-[#FF6200]" />
          <div>
            <span className="text-[10px] text-[#888898] uppercase block">Total</span>
            <span className="font-bold text-white font-mono">{totalCards} issues</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2 border-r border-[#2E2E2E]">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <div>
            <span className="text-[10px] text-[#888898] uppercase block">In Progress</span>
            <span className="font-bold text-blue-400 font-mono">{inProgressCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2 border-r border-[#2E2E2E]">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <div>
            <span className="text-[10px] text-[#888898] uppercase block">In Review</span>
            <span className="font-bold text-purple-400 font-mono">{inReviewCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2 border-r border-[#2E2E2E]">
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <div>
            <span className="text-[10px] text-[#888898] uppercase block">Blocked</span>
            <span className="font-bold text-rose-400 font-mono">{blockedCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2 border-r border-[#2E2E2E]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <div>
            <span className="text-[10px] text-[#888898] uppercase block">Done</span>
            <span className="font-bold text-emerald-400 font-mono">{doneCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2">
          <Clock className="w-3.5 h-3.5 text-[#FF8C42]" />
          <div>
            <span className="text-[10px] text-[#888898] uppercase block">Time Logged</span>
            <span className="font-bold text-[#FF8C42] font-mono">{totalHoursLogged}h / {totalHoursEstimated}h</span>
          </div>
        </div>
      </div>

      {/* Kanban Filters & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#141414] border border-[#2E2E2E]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Selector */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6200]"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>

          {/* Only My Tasks Toggle */}
          <button
            onClick={() => setOnlyMyTasks(!onlyMyTasks)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              onlyMyTasks
                ? "bg-[#FF6200]/20 text-[#FF8C42] border-[#FF6200]/50 shadow-[0_0_10px_rgba(255,98,0,0.2)]"
                : "bg-[#1A1A1A] text-[#888898] border-[#2E2E2E] hover:text-white"
            }`}
          >
            Only My Tasks
          </button>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6200]"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🟢 Low</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6200]"
          >
            <option value="ALL">All Types</option>
            <option value="TASK">📌 Tasks</option>
            <option value="BUG">🐛 Bugs</option>
            <option value="STORY">📖 Stories</option>
            <option value="FEATURE">✨ Features</option>
            <option value="IMPROVEMENT">⚡ Improvements</option>
          </select>

          {/* Due Date Filter */}
          <select
            value={dueFilter}
            onChange={(e) => setDueFilter(e.target.value)}
            className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6200]"
          >
            <option value="ALL">All Due Dates</option>
            <option value="OVERDUE">⚠️ Overdue</option>
            <option value="TODAY">📅 Due Today</option>
            <option value="THIS_WEEK">🗓️ Due This Week</option>
          </select>

          {/* Workload Toggle Button */}
          <button
            onClick={() => setShowWorkload(!showWorkload)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              showWorkload
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                : "bg-[#1A1A1A] text-[#888898] border-[#2E2E2E] hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Load</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Density Switcher */}
          <div className="flex items-center bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setCardDensity("detailed")}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                cardDensity === "detailed" ? "bg-[#252525] text-white" : "text-[#888898] hover:text-white"
              }`}
            >
              Detailed
            </button>
            <button
              onClick={() => setCardDensity("compact")}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                cardDensity === "compact" ? "bg-[#252525] text-white" : "text-[#888898] hover:text-white"
              }`}
            >
              Compact
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#888898] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#888898] focus:outline-none focus:border-[#FF6200]/60 w-36 sm:w-44"
            />
          </div>

          <button
            onClick={() => onOpenCreateTask("TODO")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold transition-colors shadow-[0_0_10px_rgba(255,98,0,0.2)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Department Quick Filter Tabs */}
        <div className="w-full pt-2 border-t border-[#2E2E2E]/60 flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-[10px] font-mono uppercase text-[#888898] flex-shrink-0 mr-1 flex items-center gap-1">
            <Building className="w-3 h-3 text-[#FF6200]" />
            <span>Dept:</span>
          </span>
          {[
            { id: "ALL", label: "All Departments" },
            { id: "FRONTEND", label: "Frontend" },
            { id: "BACKEND", label: "Backend" },
            { id: "UI_UX", label: "UI / UX" },
            { id: "QA", label: "QA & Testing" },
            { id: "MARKETING", label: "Marketing" },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDepartment(d.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 cursor-pointer ${
                selectedDepartment === d.id
                  ? "bg-[#FF6200] text-white shadow-md shadow-[#FF6200]/20 font-bold"
                  : "bg-[#1A1A1A] text-[#888898] hover:text-white border border-[#2E2E2E]"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Team Workload Widget (Optional Dropdown/Drawer) */}
      {showWorkload && (
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-purple-500/30 text-xs space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-purple-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Team Workload Distribution</span>
            </span>
            <span className="text-[10px] text-[#888898] font-normal">{memberWorkloads.length} active assignees</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
            {memberWorkloads.map((mw) => (
              <div key={mw.name} className="p-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] flex items-center gap-2">
                {mw.avatarUrl ? (
                  <img
                    src={mw.avatarUrl}
                    alt={mw.name}
                    className="w-6 h-6 rounded-full object-cover border border-[#2E2E2E]"
                  />
                ) : (
                  <div
                    className={`w-6 h-6 rounded-full bg-gradient-to-tr ${getAvatarGradient(mw.name)} flex items-center justify-center text-[9px] font-bold text-white uppercase border border-[#2E2E2E] flex-shrink-0`}
                  >
                    {getInitials(mw.name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-white font-bold truncate text-[11px]">{mw.name}</div>
                  <div className="text-[10px] text-[#888898] font-mono">
                    {mw.count} tasks &bull; {mw.hours}h
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5-Column Kanban Board with Mobile Horizontal Swipe */}
      <div className="flex-1 flex md:grid md:grid-cols-5 gap-3.5 overflow-x-auto pb-4 snap-x snap-mandatory min-w-0">
        {COLUMNS.map((column) => {
          const colTasks = filteredTasks.filter((t) => t.status === column.id);

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="flex flex-col h-full w-[82vw] sm:w-80 md:w-auto flex-shrink-0 snap-center rounded-2xl bg-[#141414] border border-[#2E2E2E] overflow-hidden group/col shadow-lg"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-[#2E2E2E] flex items-center justify-between bg-[#1A1A1A]">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${column.color}`}>
                    {column.label}
                  </span>
                  <span className="text-[11px] font-mono text-[#888898] bg-[#252525] px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => onOpenCreateTask(column.id)}
                  className="text-[#888898] hover:text-white p-1 rounded hover:bg-[#252525]"
                  title={`Add task to ${column.label}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto min-h-[300px]">
                {colTasks.length === 0 ? (
                  <div className="py-12 text-center text-[11px] text-[#888898] border border-dashed border-[#2E2E2E] rounded-xl">
                    Drop task here
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const pColor = getPriorityColor(task.priority);
                    const typeInfo = getTypeIcon(task.taskType);
                    const isOverdue = task.dueDate && new Date(task.dueDate).toISOString().split("T")[0] < todayStr && task.status !== "DONE";

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.taskKey)}
                        onClick={() => onSelectTask(task.taskKey)}
                        className={`relative rounded-xl bg-[#1A1A1A] border transition-all cursor-grab active:cursor-grabbing group ${
                          cardDensity === "compact" ? "p-2.5 space-y-1.5" : "p-3.5 space-y-2.5"
                        } ${
                          isOverdue
                            ? "border-red-500/50 hover:border-red-500"
                            : "border-[#2E2E2E] hover:border-[#FF6200]/50 hover:shadow-[0_0_20px_rgba(255,98,0,0.1)]"
                        }`}
                      >
                        {/* Top: Key & Type & Menu */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-[#FF8C42] bg-[#FF6200]/10 px-2 py-0.5 rounded border border-[#FF6200]/20">
                            {task.taskKey}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${pColor.bg}`}>
                              {pColor.icon}
                            </span>
                            <span className="text-[10px] text-[#888898] font-mono">
                              {typeInfo.symbol}
                            </span>

                            {/* Three Dot Action Menu Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuKey(activeMenuKey === task.taskKey ? null : task.taskKey);
                              }}
                              className="p-1 rounded hover:bg-[#252525] text-[#888898] hover:text-white"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Three-Dot Menu Dropdown */}
                        {activeMenuKey === task.taskKey && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-3 top-10 w-44 p-1.5 rounded-xl bg-[#1E1E1E] border border-[#2E2E2E] shadow-2xl z-30 space-y-1 text-xs animate-fade-in"
                          >
                            <button
                              onClick={() => {
                                onSelectTask(task.taskKey);
                                setActiveMenuKey(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-[#2A2A2A] flex items-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#888898]" />
                              <span>View Details</span>
                            </button>

                            <button
                              onClick={() => {
                                setRelationsTaskKey(task.taskKey);
                                setActiveMenuKey(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#FF8C42] hover:bg-[#2A2A2A] flex items-center gap-2 font-semibold"
                            >
                              <Network className="w-3.5 h-3.5 text-[#FF6200]" />
                              <span>Relations & Lineage</span>
                            </button>

                            <div className="border-t border-[#2E2E2E] my-1" />

                            <div className="px-2.5 py-1 text-[10px] text-[#888898] uppercase">Move Status:</div>
                            {COLUMNS.filter((c) => c.id !== task.status).map((c) => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  onStatusChange(task.taskKey, c.id);
                                  setActiveMenuKey(null);
                                }}
                                className="w-full text-left px-2.5 py-1 rounded text-[11px] text-slate-300 hover:bg-[#2A2A2A]"
                              >
                                ↳ {c.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Title */}
                        <div className="text-xs font-bold text-white group-hover:text-[#FF8C42] transition-colors leading-snug line-clamp-2">
                          {task.title}
                        </div>

                        {/* Subtasks Progress (In detailed mode) */}
                        {cardDensity === "detailed" && task.subtasks?.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-[#888898]">
                              <span>Subtasks</span>
                              <span>
                                {task.subtasks.filter((s: any) => s.completed).length}/{task.subtasks.length}
                              </span>
                            </div>
                            <div className="w-full h-1 rounded-full bg-[#252525] overflow-hidden">
                              <div
                                className="h-full bg-[#FF6200] rounded-full"
                                style={{
                                  width: `${
                                    (task.subtasks.filter((s: any) => s.completed).length / task.subtasks.length) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Bottom Metadata */}
                        <div className="flex items-center justify-between pt-1 border-t border-[#2E2E2E]/60 text-[10px] text-[#888898]">
                          <div className="flex items-center gap-2">
                            {task.assignees?.length > 0 ? (
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {task.assignees.map((a: any) =>
                                  a.avatarUrl ? (
                                    <img
                                      key={a.id}
                                      src={a.avatarUrl}
                                      alt={a.name}
                                      title={a.name}
                                      className="w-5 h-5 rounded-full object-cover border border-[#1A1A1A]"
                                    />
                                  ) : (
                                    <div
                                      key={a.id}
                                      title={a.name}
                                      className={`w-5 h-5 rounded-full bg-gradient-to-tr ${getAvatarGradient(a.name)} flex items-center justify-center text-[8px] font-black text-white border border-[#1A1A1A] uppercase flex-shrink-0`}
                                    >
                                      {getInitials(a.name)}
                                    </div>
                                  )
                                )}
                              </div>
                            ) : (
                              <span className="text-[#888898] italic">Unassigned</span>
                            )}

                            {task.dueDate && (
                              <span className={`flex items-center gap-0.5 ${isOverdue ? "text-red-400 font-bold" : ""}`}>
                                <Calendar className="w-2.5 h-2.5" />
                                <span>{formatDate(task.dueDate)}</span>
                              </span>
                            )}

                            {task.loggedHours > 0 && (
                              <span className="flex items-center gap-0.5 text-[#FF8C42] font-mono">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{task.loggedHours}h</span>
                              </span>
                            )}
                          </div>

                          {/* Move Left/Right */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {column.id !== "TODO" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const idx = COLUMNS.findIndex((c) => c.id === column.id);
                                  if (idx > 0) onStatusChange(task.taskKey, COLUMNS[idx - 1].id);
                                }}
                                className="p-1 rounded bg-[#252525] hover:bg-[#333] text-white"
                                title="Move left"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            )}
                            {column.id !== "DONE" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const idx = COLUMNS.findIndex((c) => c.id === column.id);
                                  if (idx < COLUMNS.length - 1) onStatusChange(task.taskKey, COLUMNS[idx + 1].id);
                                }}
                                className="p-1 rounded bg-[#252525] hover:bg-[#333] text-white"
                                title="Move right"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Relations Modal */}
      {relationsTaskKey && (
        <TaskRelationsModal
          taskKey={relationsTaskKey}
          isOpen={Boolean(relationsTaskKey)}
          onClose={() => setRelationsTaskKey(null)}
          onSelectTask={(key) => onSelectTask(key)}
        />
      )}
    </div>
  );
}
