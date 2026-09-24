"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Filter,
  Layers,
  Clock,
  Calendar,
  AlertCircle,
  UserCheck,
  Share2,
  Users,
  CheckCircle2,
  ListFilter,
  Columns,
  Download,
  ArrowUpDown,
  MoreHorizontal,
  FolderKanban,
  CheckSquare,
  Sparkles,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  FileText,
  UserPlus,
} from "lucide-react";
import { getPriorityColor, getStatusColor, getTypeIcon, formatDate, getInitials, getAvatarGradient } from "@/lib/utils";
import { ProjectMembersModal } from "@/components/modals/ProjectMembersModal";

interface WorkPackagesViewProps {
  tasks: any[];
  projects: any[];
  users: any[];
  currentUser: any;
  onSelectTask: (taskKey: string) => void;
  onOpenCreateTask: (defaultProjectId?: string, defaultStatus?: string) => void;
  onRefreshData?: () => void;
}

export function WorkPackagesView({
  tasks,
  projects,
  users,
  currentUser,
  onSelectTask,
  onOpenCreateTask,
  onRefreshData,
}: WorkPackagesViewProps) {
  const [activeFilterView, setActiveFilterView] = useState<string>("all-open");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [collapsedParents, setCollapsedParents] = useState<Record<string, boolean>>({});
  const [sortField, setSortField] = useState<"id" | "title" | "status" | "priority" | "dueDate" | "progress">("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filter views definition matching OpenProject
  const filterViews = [
    { id: "all-open", label: "All open", icon: Layers, description: "All active & in-progress tasks" },
    { id: "latest-activity", label: "Latest activity", icon: Clock, description: "Sorted by recent updates" },
    { id: "recently-created", label: "Recently created", icon: Calendar, description: "Newest tasks first" },
    { id: "overdue", label: "Overdue", icon: AlertCircle, description: "Past deadline & incomplete" },
    { id: "summary", label: "Summary", icon: ListFilter, description: "All accessible work packages" },
    { id: "created-by-me", label: "Created by me", icon: FileText, description: "Tasks you created" },
    { id: "assigned-to-me", label: "Assigned to me", icon: UserCheck, description: "Tasks assigned to you" },
    { id: "shared-with-users", label: "Shared with users", icon: Users, description: "Tasks shared across members" },
    { id: "shared-with-me", label: "Shared with me", icon: Share2, description: "Tasks shared directly with you" },
  ];

  const currentProject = selectedProjectId === "ALL" ? null : projects.find((p) => p.id === selectedProjectId);

  // Apply Views & Filter Pipeline strictly using real database tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Project Filter
      if (selectedProjectId !== "ALL" && t.projectId !== selectedProjectId) {
        return false;
      }

      // 2. View Preset Filter
      const isCompleted = t.status === "COMPLETED" || t.status === "CLOSED" || t.status === "DONE";

      if (activeFilterView === "all-open") {
        if (isCompleted) return false;
      } else if (activeFilterView === "overdue") {
        if (isCompleted) return false;
        const now = new Date();
        const due = t.dueDate ? new Date(t.dueDate) : t.endDate ? new Date(t.endDate) : null;
        if (!due || due >= now) return false;
      } else if (activeFilterView === "created-by-me") {
        if (t.reporter?.id !== currentUser?.id && t.reporterId !== currentUser?.id) return false;
      } else if (activeFilterView === "assigned-to-me") {
        const isAssigned = t.assignees?.some((a: any) => a.id === currentUser?.id || a.userId === currentUser?.id || a.email === currentUser?.email);
        if (!isAssigned) return false;
      } else if (activeFilterView === "shared-with-me") {
        const isSharedWithMe = t.shares?.some((s: any) => s.userId === currentUser?.id || s.user?.id === currentUser?.id);
        if (!isSharedWithMe) return false;
      } else if (activeFilterView === "shared-with-users") {
        const hasShares = Array.isArray(t.shares) && t.shares.length > 0;
        if (!hasShares) return false;
      }

      // 3. Status Dropdown Filter
      if (statusFilter !== "ALL" && t.status !== statusFilter) {
        return false;
      }

      // 4. Priority Dropdown Filter
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) {
        return false;
      }

      // 5. Type Dropdown Filter
      if (typeFilter !== "ALL" && t.taskType !== typeFilter) {
        return false;
      }

      // 6. Search Bar Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchKey = t.taskKey?.toLowerCase().includes(query);
        const matchTitle = t.title?.toLowerCase().includes(query);
        const matchDesc = t.description?.toLowerCase().includes(query);
        const matchAssignee = t.assignees?.some((a: any) => (a.name || "").toLowerCase().includes(query));
        const matchAccountable = (t.accountable?.name || "").toLowerCase().includes(query);
        const matchProject = (t.project?.name || "").toLowerCase().includes(query);

        if (!matchKey && !matchTitle && !matchDesc && !matchAssignee && !matchAccountable && !matchProject) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, selectedProjectId, activeFilterView, statusFilter, priorityFilter, typeFilter, searchQuery, currentUser?.id, currentUser?.email]);

  // Sort Tasks
  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];
    list.sort((a, b) => {
      if (activeFilterView === "latest-activity") {
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      }
      if (activeFilterView === "recently-created") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }

      let res = 0;
      if (sortField === "id") {
        res = (a.taskKey || "").localeCompare(b.taskKey || "");
      } else if (sortField === "title") {
        res = (a.title || "").localeCompare(b.title || "");
      } else if (sortField === "status") {
        res = (a.status || "").localeCompare(b.status || "");
      } else if (sortField === "priority") {
        res = (a.priority || "").localeCompare(b.priority || "");
      } else if (sortField === "dueDate") {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : a.endDate ? new Date(a.endDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : b.endDate ? new Date(b.endDate).getTime() : 0;
        res = dateA - dateB;
      } else if (sortField === "progress") {
        res = (a.progress || 0) - (b.progress || 0);
      }
      return sortDirection === "asc" ? res : -res;
    });
    return list;
  }, [filteredTasks, activeFilterView, sortField, sortDirection]);

  const toggleSort = (field: "id" | "title" | "status" | "priority" | "dueDate" | "progress") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleCollapse = (taskId: string) => {
    setCollapsedParents((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const activeViewObj = filterViews.find((v) => v.id === activeFilterView) || filterViews[0];

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full min-h-[calc(100vh-140px)]">
      {/* Left Sidebar: Filter / Views Section (Matching OpenProject Reference) */}
      <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
        {/* Project Selector Box */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FolderKanban className="w-4 h-4 text-[#FF6200]" />
            <span>Scope / Project</span>
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#FF6200]"
          >
            <option value="ALL">🌐 All Projects (Enterprise Scope)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
        </div>

        {/* Views Navigation Panel */}
        <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm flex-1 flex flex-col">
          <div className="px-3 py-2 flex items-center justify-between border-b border-gray-100 mb-2">
            <div className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-[#FF6200]" />
              <span>Work packages</span>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {sortedTasks.length}
            </span>
          </div>

          <div className="text-[11px] font-bold text-gray-400 px-3 pt-2 pb-1 uppercase tracking-wider">
            Default Views
          </div>

          <div className="space-y-0.5">
            {filterViews.map((view) => {
              const Icon = view.icon;
              const isActive = activeFilterView === view.id;

              return (
                <button
                  key={view.id}
                  onClick={() => setActiveFilterView(view.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left group cursor-pointer ${
                    isActive
                      ? "bg-[#FF6200]/10 text-[#FF6200] font-bold border-l-4 border-[#FF6200] "
                      : "text-gray-600  hover:bg-gray-50  hover:text-gray-900 "
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-[#FF6200]" : "text-gray-400  group-hover:text-[#FF6200]"}`} />
                    <span className="truncate">{view.label}</span>
                  </div>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#FF6200]" />}
                </button>
              );
            })}
          </div>

          {/* Quick Stats Footer */}
          <div className="mt-auto pt-4 border-t border-gray-100 px-3">
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span>Assigned to you:</span>
              <span className="font-bold text-gray-900">
                {tasks.filter((t) => t.assignees?.some((a: any) => a.id === currentUser?.id || a.email === currentUser?.email)).length}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
              <span>Overdue tasks:</span>
              <span className="font-bold text-rose-500">
                {
                  tasks.filter((t) => {
                    const isComp = t.status === "COMPLETED" || t.status === "CLOSED" || t.status === "DONE";
                    const due = t.dueDate ? new Date(t.dueDate) : t.endDate ? new Date(t.endDate) : null;
                    return !isComp && due && due < new Date();
                  }).length
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center & Main: Work Packages Table Section (OpenProject 2nd Screenshot reference) */}
      <div className="flex-1 flex flex-col min-w-0 bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Top Header & Breadcrumbs Bar */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <span className="font-semibold hover:underline cursor-pointer">
                {currentProject ? `${currentProject.name} (${currentProject.key})` : "Enterprise Workspace"}
              </span>
              <span>/</span>
              <span className="hover:underline cursor-pointer">Work packages</span>
              <span>/</span>
              <span className="font-bold text-gray-900">Default: {activeViewObj.label}</span>
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
              <span>{activeViewObj.label}</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#FF6200]/15 text-[#FF8C42] border border-[#FF6200]/30">
                {sortedTasks.length} items
              </span>
            </h1>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {currentProject && (
              <button
                type="button"
                onClick={() => setSelectedProjectForMembers(currentProject)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-[#FF6200] hover:text-slate-900 border border-gray-200 text-xs font-bold text-gray-700 transition-all cursor-pointer shadow-sm hover:shadow-[0_0_10px_rgba(255,98,0,0.3)]"
                title="View & manage project members"
              >
                <Users className="w-3.5 h-3.5 text-[#FF8C42]" />
                <span>Members ({currentProject.members?.length || 0})</span>
              </button>
            )}

            <button
              onClick={() => onOpenCreateTask(selectedProjectId !== "ALL" ? selectedProjectId : undefined)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00875A] hover:bg-[#00704A] text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create</span>
            </button>

            {onRefreshData && (
              <button
                onClick={onRefreshData}
                title="Refresh platform records"
                className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="px-6 py-3 border-b border-gray-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, subject, assignee, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF6200]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#FF6200]"
            >
              <option value="ALL">Status: All</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="READY_FOR_TESTING">Ready for Testing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CLOSED">Closed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#FF6200]"
            >
              <option value="ALL">Priority: All</option>
              <option value="CRITICAL">🔴 Critical</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">🟢 Low</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#FF6200]"
            >
              <option value="ALL">Type: All</option>
              <option value="TASK">📋 Task</option>
              <option value="BUG">🐛 Bug</option>
              <option value="FEATURE">✨ Feature</option>
              <option value="STORY">📖 Story</option>
              <option value="IMPROVEMENT">⚡ Improvement</option>
            </select>
          </div>
        </div>

        {/* Work Packages Table Body */}
        <div className="flex-1 overflow-x-auto">
          {sortedTasks.length === 0 ? (
            /* Strict Clean Empty State - No Fake Data */
            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 mb-4">
                <CheckSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {activeFilterView === "assigned-to-me"
                  ? "No tasks assigned to you"
                  : activeFilterView === "created-by-me"
                  ? "No tasks created by you"
                  : activeFilterView === "overdue"
                  ? "No overdue tasks found"
                  : activeFilterView === "shared-with-me"
                  ? "No tasks shared with you"
                  : "No work packages found"}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mb-5">
                {searchQuery
                  ? "No database records match your active query. Try clearing search keywords or filters."
                  : "There are currently no matching work packages for this filter preset in your authorized projects."}
              </p>
              <button
                onClick={() => onOpenCreateTask(selectedProjectId !== "ALL" ? selectedProjectId : undefined)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6200] hover:bg-[#E55800] text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Task</span>
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th
                    onClick={() => toggleSort("id")}
                    className="py-3 px-4 w-28 cursor-pointer hover:text-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>ID</span>
                      {sortField === "id" && <ArrowUpDown className="w-3 h-3 text-[#FF6200]" />}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("title")}
                    className="py-3 px-4 min-w-[240px] cursor-pointer hover:text-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>SUBJECT</span>
                      {sortField === "title" && <ArrowUpDown className="w-3 h-3 text-[#FF6200]" />}
                    </div>
                  </th>
                  <th className="py-3 px-3 w-28">TYPE</th>
                  <th
                    onClick={() => toggleSort("status")}
                    className="py-3 px-3 w-32 cursor-pointer hover:text-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>STATUS</span>
                      {sortField === "status" && <ArrowUpDown className="w-3 h-3 text-[#FF6200]" />}
                    </div>
                  </th>
                  <th className="py-3 px-3 w-40">ASSIGNEE</th>
                  <th className="py-3 px-3 w-36">ACCOUNTABLE</th>
                  <th
                    onClick={() => toggleSort("priority")}
                    className="py-3 px-3 w-28 cursor-pointer hover:text-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>PRIORITY</span>
                      {sortField === "priority" && <ArrowUpDown className="w-3 h-3 text-[#FF6200]" />}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("dueDate")}
                    className="py-3 px-3 w-32 cursor-pointer hover:text-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>END / DUE</span>
                      {sortField === "dueDate" && <ArrowUpDown className="w-3 h-3 text-[#FF6200]" />}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("progress")}
                    className="py-3 px-4 w-28 cursor-pointer hover:text-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>PROGRESS</span>
                      {sortField === "progress" && <ArrowUpDown className="w-3 h-3 text-[#FF6200]" />}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedTasks.map((task) => {
                  const hasSubtasks = Array.isArray(task.subtasks) && task.subtasks.length > 0;
                  const isCollapsed = Boolean(collapsedParents[task.id]);
                  const firstAssignee = task.assignees?.[0];

                  return (
                    <React.Fragment key={task.id}>
                      <tr
                        className="hover:bg-gray-50 transition-colors group cursor-pointer"
                        onClick={() => onSelectTask(task.taskKey)}
                      >
                        {/* ID Column */}
                        <td className="py-3 px-4 font-mono font-bold text-[#0066CC] hover:underline">
                          #{task.taskKey.replace(/^[A-Za-z]+-/, "") || task.taskKey}
                        </td>

                        {/* SUBJECT Column with Subtask Toggle */}
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            {hasSubtasks ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCollapse(task.id);
                                }}
                                className="p-0.5 rounded hover:bg-gray-200 text-gray-500"
                              >
                                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            ) : (
                              <div className="w-3.5" />
                            )}
                            <span className="hover:text-[#FF6200] transition-colors line-clamp-1">{task.title}</span>
                            {task.commentsCount > 0 && (
                              <span className="text-[10px] text-gray-400 font-mono">
                                💬{task.commentsCount}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* TYPE */}
                        <td className="py-3 px-3">
                          {(() => {
                            const typeInfo = getTypeIcon(task.taskType);
                            return (
                              <span className={`inline-flex items-center gap-1.5 font-semibold ${typeInfo.color}`}>
                                <span>{typeInfo.symbol}</span>
                                <span>{typeInfo.label}</span>
                              </span>
                            );
                          })()}
                        </td>

                        {/* STATUS */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.status?.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* ASSIGNEE */}
                        <td className="py-3 px-3">
                          {firstAssignee ? (
                            <div className="flex items-center gap-2">
                              {firstAssignee.avatarUrl ? (
                                <img
                                  src={firstAssignee.avatarUrl}
                                  alt={firstAssignee.name}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  className={`w-5 h-5 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                    firstAssignee.name
                                  )} flex items-center justify-center text-[8px] font-black text-white uppercase flex-shrink-0`}
                                >
                                  {getInitials(firstAssignee.name)}
                                </div>
                              )}
                              <span className="truncate max-w-[100px] text-gray-800">
                                {firstAssignee.name}
                              </span>
                              {task.assignees.length > 1 && (
                                <span className="text-[10px] text-gray-400 font-mono">
                                  +{task.assignees.length - 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>

                        {/* ACCOUNTABLE */}
                        <td className="py-3 px-3">
                          {task.accountable ? (
                            <div className="flex items-center gap-2">
                              {task.accountable.avatarUrl ? (
                                <img
                                  src={task.accountable.avatarUrl}
                                  alt={task.accountable.name}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  className={`w-5 h-5 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                    task.accountable.name
                                  )} flex items-center justify-center text-[8px] font-black text-white uppercase flex-shrink-0`}
                                >
                                  {getInitials(task.accountable.name)}
                                </div>
                              )}
                              <span className="truncate max-w-[90px] text-gray-800">
                                {task.accountable.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>

                        {/* PRIORITY */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </td>

                        {/* END / DUE DATE */}
                        <td className="py-3 px-3 text-gray-600 font-mono text-[11px]">
                          {task.endDate
                            ? formatDate(task.endDate)
                            : task.dueDate
                            ? formatDate(task.dueDate)
                            : "-"}
                        </td>

                        {/* PROGRESS */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-2 rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className="h-full bg-[#00875A] rounded-full transition-all"
                                style={{ width: `${Math.min(100, Math.max(0, task.progress || 0))}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-gray-500">
                              {task.progress || 0}%
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Subtasks Rows */}
                      {hasSubtasks &&
                        !isCollapsed &&
                        task.subtasks.map((st: any) => (
                          <tr
                            key={st.id}
                            className="bg-gray-50/40 hover:bg-gray-100/50 transition-colors border-l-4 border-l-[#FF6200]/40 text-xs"
                            onClick={() => onSelectTask(task.taskKey)}
                          >
                            <td className="py-2 px-4 font-mono text-[11px] text-gray-400 pl-8">
                              ↳
                            </td>
                            <td className="py-2 px-4 pl-10 text-gray-700">
                              <div className="flex items-center gap-2">
                                <span className={st.completed ? "line-through text-gray-400 " : ""}>
                                  {st.title}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-gray-400 text-[11px]">Subtask</td>
                            <td className="py-2 px-3">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                  st.completed ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-500/15 text-gray-400"
                                }`}
                              >
                                {st.completed ? "Done" : "Pending"}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-gray-500 text-[11px]">{st.assignee?.name || "-"}</td>
                            <td className="py-2 px-3 text-gray-400">-</td>
                            <td className="py-2 px-3 text-gray-400">-</td>
                            <td className="py-2 px-3 text-gray-400 text-[11px]">{st.dueDate ? formatDate(st.dueDate) : "-"}</td>
                            <td className="py-2 px-4 text-gray-400 text-[10px]">{st.completed ? "100%" : "0%"}</td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Project Members Modal */}
      {selectedProjectForMembers && (
        <ProjectMembersModal
          isOpen={Boolean(selectedProjectForMembers)}
          onClose={() => setSelectedProjectForMembers(null)}
          projectId={selectedProjectForMembers.id}
          projectName={selectedProjectForMembers.name}
          projectKey={selectedProjectForMembers.key}
          canManage={selectedProjectForMembers.canManageMembers ?? true}
          onMembersUpdated={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}
    </div>
  );
}
