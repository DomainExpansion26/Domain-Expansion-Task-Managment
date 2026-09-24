"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bug,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  XCircle,
  FileText,
  Table,
  Trash2,
  RefreshCw,
  FolderKanban,
  User,
  AlertCircle
} from "lucide-react";
import { getPriorityColor, getStatusColor, formatDateTime, getInitials, getAvatarGradient } from "@/lib/utils";
import { RaiseBugModal } from "@/components/modals/RaiseBugModal";
import { BugDetailModal } from "@/components/qa/BugDetailModal";
import { QABugFailModal } from "@/components/modals/QABugFailModal";
import { QATicketCreateModal } from "@/components/modals/QATicketCreateModal";
import { useAppDispatch, useQA } from "@/store/hooks";
import { setQABugs, setQATickets, setQAStats } from "@/store/slices/qaSlice";

interface QAViewProps {
  currentUser: any;
  projects?: any[];
  users?: any[];
  tasks?: any[];
  onSelectTask?: (taskKey: string) => void;
}

export function QAView({
  currentUser,
  projects = [],
  users = [],
  tasks = [],
  onSelectTask,
}: QAViewProps) {
  const dispatch = useAppDispatch();
  const qaState = useQA();

  const [viewMode, setViewMode] = useState<"table" | "tickets">("table");
  const bugs = qaState.bugs || [];
  const tickets = qaState.tickets || [];

  const [counts, setCounts] = useState({
    totalBugs: 0,
    open: 0,
    inProgress: 0,
    readyForTesting: 0,
    inTesting: 0,
    failed: 0,
    passed: 0,
    closed: 0,
    critical: 0,
  });
  const [loading, setLoading] = useState(qaState.bugs.length === 0);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [developerFilter, setDeveloperFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isRaiseBugOpen, setIsRaiseBugOpen] = useState(false);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [selectedTicketForBug, setSelectedTicketForBug] = useState<any | null>(null);
  const [selectedBugKey, setSelectedBugKey] = useState<string | null>(null);
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.systemRole === "SUPER_ADMIN" || currentUser?.role === "SUPER_ADMIN";
  const isManagerOrAdmin = isSuperAdmin || currentUser?.role === "MANAGER" || currentUser?.role === "HR_ADMIN";

  const handleDeleteTicket = async (ticket: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete QA Ticket ${ticket.ticketKey}?`)) {
      return;
    }

    setDeletingTicketId(ticket.id);
    try {
      const res = await fetch(`/api/qa/tickets/${ticket.id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        fetchQAData();
      } else {
        alert(json.error?.message || "Failed to delete ticket");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting ticket");
    } finally {
      setDeletingTicketId(null);
    }
  };

  const fetchQAData = useCallback(async () => {
    try {
      const [dashRes, bugsRes, ticketsRes] = await Promise.all([
        fetch(`/api/qa/dashboard${projectFilter !== "ALL" ? `?projectId=${projectFilter}` : ""}`),
        fetch("/api/qa/bugs"),
        fetch("/api/qa/tickets"),
      ]);

      const [dashJson, bugsJson, ticketsJson] = await Promise.all([
        dashRes.json(),
        bugsRes.json(),
        ticketsRes.json(),
      ]);

      if (dashJson.success && dashJson.data?.counts) {
        setCounts(dashJson.data.counts);
      }
      if (bugsJson.success) {
        dispatch(setQABugs(bugsJson.data));
      }
      if (ticketsJson.success) {
        dispatch(setQATickets(ticketsJson.data));
      }
    } catch (err) {
      console.error("Failed to load QA data:", err);
    } finally {
      setLoading(false);
    }
  }, [projectFilter, dispatch]);

  useEffect(() => {
    fetchQAData();
  }, [fetchQAData]);

  // Filtered bugs
  const filteredBugs = bugs.filter((b) => {
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (priorityFilter !== "ALL" && b.priority !== priorityFilter) return false;
    if (severityFilter !== "ALL" && b.severity !== severityFilter) return false;
    if (projectFilter !== "ALL" && b.projectId !== projectFilter) return false;
    if (developerFilter !== "ALL" && b.assignedToId !== developerFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchKey = b.bugKey?.toLowerCase().includes(q);
      const matchTitle = b.title?.toLowerCase().includes(q);
      const matchTask = b.relatedTask?.taskKey?.toLowerCase().includes(q);
      const matchDev = b.assignedTo?.name?.toLowerCase().includes(q);
      if (!matchKey && !matchTitle && !matchTask && !matchDev) return false;
    }
    return true;
  });

  const getBugStatusBadge = (status: string) => {
    switch (status) {
      case "FAILED":
        return "bg-red-50 border-red-200 text-red-600";
      case "PASSED":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "READY_FOR_TESTING":
        return "bg-purple-50 border-purple-200 text-purple-700";
      case "IN_TESTING":
        return "bg-cyan-50 border-cyan-200 text-cyan-700";
      case "IN_PROGRESS":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "ASSIGNED":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "CLOSED":
        return "bg-slate-100 border-slate-200 text-slate-600";
      default:
        return "bg-slate-100 border-slate-200 text-slate-600";
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-50 border border-red-200 text-red-600 flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>QA & Bug Engineering Cockpit</span>
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Quality Assurance & Defect Portal</h1>
          <p className="text-xs text-slate-500">
            Structured defect tracking, parent task linkage, automated developer assignment, and verification workflows
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateTicketOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>New QA Test Ticket</span>
          </button>

          <button
            onClick={() => setIsRaiseBugOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white text-xs font-bold transition-all shadow-md shadow-[#FF6200]/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Bug</span>
          </button>
        </div>
      </div>

      {/* QA KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div
          onClick={() => setStatusFilter(statusFilter === "OPEN" ? "ALL" : "OPEN")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === "OPEN"
              ? "bg-orange-50/50 border-[#FF6200] shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[10px] text-slate-500 uppercase font-mono font-medium">Open Bugs</div>
          <div className="text-xl font-black text-slate-900 mt-1">{counts.open}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === "IN_PROGRESS"
              ? "bg-blue-50/50 border-blue-500 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[10px] text-slate-500 uppercase font-mono font-medium">In Progress</div>
          <div className="text-xl font-black text-blue-600 mt-1">{counts.inProgress}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "READY_FOR_TESTING" ? "ALL" : "READY_FOR_TESTING")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === "READY_FOR_TESTING"
              ? "bg-purple-50/50 border-purple-500 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[10px] text-slate-500 uppercase font-mono font-medium flex items-center gap-1">
            <span>Ready for Test</span>
            {counts.readyForTesting > 0 && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />}
          </div>
          <div className="text-xl font-black text-purple-600 mt-1">{counts.readyForTesting}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "IN_TESTING" ? "ALL" : "IN_TESTING")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === "IN_TESTING"
              ? "bg-cyan-50/50 border-cyan-500 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[10px] text-slate-500 uppercase font-mono font-medium">In Testing</div>
          <div className="text-xl font-black text-cyan-600 mt-1">{counts.inTesting}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "FAILED" ? "ALL" : "FAILED")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === "FAILED"
              ? "bg-red-50/50 border-red-500 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[10px] text-slate-500 uppercase font-mono font-medium flex items-center gap-1">
            <span>Failed QA</span>
            {counts.failed > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
          </div>
          <div className="text-xl font-black text-red-600 mt-1">{counts.failed}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "PASSED" ? "ALL" : "PASSED")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === "PASSED"
              ? "bg-emerald-50/50 border-emerald-500 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[10px] text-slate-500 uppercase font-mono font-medium">Passed</div>
          <div className="text-xl font-black text-emerald-600 mt-1">{counts.passed}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "CLOSED" ? "ALL" : "CLOSED")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === "CLOSED"
              ? "bg-slate-100 border-slate-400 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-[10px] text-slate-500 uppercase font-mono font-medium">Closed</div>
          <div className="text-xl font-black text-slate-600 mt-1">{counts.closed}</div>
        </div>
      </div>

      {/* Toolbar: Filters & View Switcher */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Bug ID, title, parent task, dev..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#FF6200] focus:outline-none"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#FF6200]"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="READY_FOR_TESTING">Ready for Testing</option>
            <option value="IN_TESTING">In Testing</option>
            <option value="FAILED">Failed</option>
            <option value="PASSED">Passed</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#FF6200]"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#FF6200]"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="MAJOR">Major</option>
            <option value="MEDIUM">Medium</option>
            <option value="MINOR">Minor</option>
          </select>

          {/* Developer */}
          <select
            value={developerFilter}
            onChange={(e) => setDeveloperFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#FF6200]"
          >
            <option value="ALL">All Developers</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Project */}
          {projects.length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#FF6200]"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {(statusFilter !== "ALL" || priorityFilter !== "ALL" || severityFilter !== "ALL" || developerFilter !== "ALL" || projectFilter !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setPriorityFilter("ALL");
                setSeverityFilter("ALL");
                setDeveloperFilter("ALL");
                setProjectFilter("ALL");
                setSearchQuery("");
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] text-[#FF6200] font-semibold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Defects List</span>
          </button>
          <button
            onClick={() => setViewMode("tickets")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "tickets" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tickets ({tickets.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Modern Issue Table */}
      {viewMode === "table" && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-semibold">Bug ID</th>
                  <th className="py-3 px-4 font-semibold">Title & Description</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Priority</th>
                  <th className="py-3 px-4 font-semibold">Severity</th>
                  <th className="py-3 px-4 font-semibold">Responsible Dev</th>
                  <th className="py-3 px-4 font-semibold">QA Reporter</th>
                  <th className="py-3 px-4 font-semibold">Related Task</th>
                  <th className="py-3 px-4 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBugs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-xs text-slate-400">
                      No bugs match the current filters. Click "+ Raise Bug" to report a defect.
                    </td>
                  </tr>
                ) : (
                  filteredBugs.map((bug) => (
                    <tr
                      key={bug.id}
                      onClick={() => setSelectedBugKey(bug.bugKey)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-red-600 whitespace-nowrap">
                        {bug.bugKey}
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                        <div className="font-bold text-slate-900 group-hover:text-[#FF6200] transition-colors truncate">
                          {bug.title}
                        </div>
                        {bug.failureReason && (
                          <div className="text-[10px] text-red-600 font-semibold truncate mt-0.5">
                            QA Fail: {bug.failureReason}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${getBugStatusBadge(
                            bug.status
                          )}`}
                        >
                          {bug.status?.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(bug.priority)}`}>
                          {bug.priority}
                        </span>
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {bug.severity || "MEDIUM"}
                      </td>

                      {/* Assignee */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                              bug.assignedTo?.name
                            )} text-[9px] font-bold text-white flex items-center justify-center`}
                          >
                            {getInitials(bug.assignedTo?.name)}
                          </div>
                          <span className="font-medium text-slate-700">{bug.assignedTo?.name || "Unassigned"}</span>
                        </div>
                      </td>

                      {/* QA Reporter */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-500">{bug.createdBy?.name || "QA"}</span>
                      </td>

                      {/* Related Task */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {bug.relatedTask ? (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectTask && bug.relatedTask?.taskKey) {
                                onSelectTask(bug.relatedTask.taskKey);
                              }
                            }}
                            className="px-2 py-0.5 rounded bg-orange-50 border border-orange-200 text-[#FF6200] font-mono font-bold hover:underline cursor-pointer"
                          >
                            {bug.relatedTask.taskKey}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Standalone</span>
                        )}
                      </td>

                      {/* Updated */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[10px] text-slate-500">
                        {formatDateTime(bug.updatedAt || bug.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: QA Test Tickets */}
      {viewMode === "tickets" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((t) => {
              const canDelete = isSuperAdmin || isManagerOrAdmin || t.createdById === currentUser?.id;
              return (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#FF6200]/30 shadow-xs transition-all space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-blue-600">{t.ticketKey}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${getBugStatusBadge(t.status)}`}>
                          {t.status}
                        </span>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTicket(t, e)}
                            disabled={deletingTicketId === t.id}
                            title="Delete QA Ticket"
                            className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                    </div>

                    {t.bugs && t.bugs.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Logged Defects ({t.bugs.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {t.bugs.map((bug: any) => (
                            <button
                              key={bug.id}
                              type="button"
                              onClick={() => setSelectedBugKey(bug.bugKey)}
                              className="px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                            >
                              {bug.bugKey}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Assigned: <strong className="text-slate-800 font-semibold">{t.assignedTo?.name || "Unassigned"}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTicketForBug(t);
                        setIsRaiseBugOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#FF6200] border border-orange-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Log Bug
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <RaiseBugModal
        isOpen={isRaiseBugOpen}
        onClose={() => {
          setIsRaiseBugOpen(false);
          setSelectedTicketForBug(null);
        }}
        parentTicket={selectedTicketForBug}
        projects={projects}
        users={users}
        currentUser={currentUser}
        onBugCreated={() => fetchQAData()}
      />

      <QATicketCreateModal
        isOpen={isCreateTicketOpen}
        onClose={() => setIsCreateTicketOpen(false)}
        projects={projects}
        users={users}
        tasks={tasks}
        onTicketCreated={() => fetchQAData()}
      />

      {selectedBugKey && (
        <BugDetailModal
          bugKey={selectedBugKey}
          isOpen={Boolean(selectedBugKey)}
          onClose={() => setSelectedBugKey(null)}
          onSelectTask={(taskKey) => {
            setSelectedBugKey(null);
            if (onSelectTask) onSelectTask(taskKey);
          }}
          onBugUpdated={() => fetchQAData()}
          users={users}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
