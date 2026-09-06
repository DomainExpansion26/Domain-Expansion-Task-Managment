"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bug,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  XCircle,
  Columns3,
  ListFilter,
  Layers,
  ArrowUpDown,
  RotateCcw,
  User,
  SlidersHorizontal,
  FileText,
  Table,
  Trash2,
} from "lucide-react";
import { getPriorityColor, getStatusColor, formatDateTime, getInitials, getAvatarGradient } from "@/lib/utils";
import { RaiseBugModal } from "@/components/modals/RaiseBugModal";
import { BugDetailModal } from "@/components/qa/BugDetailModal";
import { QABugFailModal } from "@/components/modals/QABugFailModal";
import { QATicketCreateModal } from "@/components/modals/QATicketCreateModal";

interface QAViewProps {
  currentUser: any;
  projects?: any[];
  users?: any[];
  tasks?: any[];
  onSelectTask?: (taskKey: string) => void;
}

const KANBAN_COLUMNS = [
  { id: "OPEN", label: "Open", color: "border-slate-500/30 text-slate-300 bg-slate-500/10" },
  { id: "ASSIGNED", label: "Assigned", color: "border-amber-500/30 text-amber-300 bg-amber-500/10" },
  { id: "IN_PROGRESS", label: "In Progress", color: "border-blue-500/30 text-blue-300 bg-blue-500/10" },
  { id: "READY_FOR_TESTING", label: "Ready for Test", color: "border-purple-500/40 text-purple-300 bg-purple-500/15" },
  { id: "IN_TESTING", label: "In Testing", color: "border-cyan-500/30 text-cyan-300 bg-cyan-500/10" },
  { id: "FAILED", label: "Failed", color: "border-red-500/40 text-red-400 bg-red-500/15" },
  { id: "PASSED", label: "Passed", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" },
  { id: "CLOSED", label: "Closed", color: "border-zinc-500/30 text-zinc-400 bg-zinc-500/10" },
];

import { useAppDispatch, useQA } from "@/store/hooks";
import { setQABugs, setQATickets, setQAStats, upsertQABug } from "@/store/slices/qaSlice";

export function QAView({
  currentUser,
  projects = [],
  users = [],
  tasks = [],
  onSelectTask,
}: QAViewProps) {
  const dispatch = useAppDispatch();
  const qaState = useQA();

  const [viewMode, setViewMode] = useState<"table" | "kanban" | "tickets">("table");
  const bugs = qaState.bugs || [];
  const setBugs = (val: any) => {
    if (typeof val === "function") {
      const updated = val(qaState.bugs);
      dispatch(setQABugs(updated));
    } else {
      dispatch(setQABugs(val));
    }
  };

  const tickets = qaState.tickets || [];
  const setTickets = (val: any) => {
    if (typeof val === "function") {
      const updated = val(qaState.tickets);
      dispatch(setQATickets(updated));
    } else {
      dispatch(setQATickets(val));
    }
  };

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
  const [draggedBugKey, setDraggedBugKey] = useState<string | null>(null);
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

  // Handle Drag and Drop status change
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: string) => {
    if (!draggedBugKey) return;
    const bugKeyToUpdate = draggedBugKey;
    setDraggedBugKey(null);

    // Optimistic UI update
    setBugs((prev: any[]) =>
      prev.map((b: any) => (b.bugKey === bugKeyToUpdate ? { ...b, status: newStatus } : b))
    );

    try {
      const res = await fetch(`/api/qa/bugs/${bugKeyToUpdate}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!json.success) {
        fetchQAData(); // Rollback on error
      } else {
        fetchQAData();
      }
    } catch (err) {
      fetchQAData();
    }
  };

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
        return "bg-red-500/15 border-red-500/30 text-red-400";
      case "PASSED":
        return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
      case "READY_FOR_TESTING":
        return "bg-purple-500/15 border-purple-500/30 text-purple-300";
      case "IN_TESTING":
        return "bg-cyan-500/15 border-cyan-500/30 text-cyan-300";
      case "IN_PROGRESS":
        return "bg-blue-500/15 border-blue-500/30 text-blue-300";
      case "ASSIGNED":
        return "bg-amber-500/15 border-amber-500/30 text-amber-300";
      case "CLOSED":
        return "bg-slate-500/15 border-slate-500/30 text-slate-300";
      default:
        return "bg-slate-500/15 border-slate-500/30 text-slate-300";
    }
  };

  return (
    <div className="p-2 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-red-500/15 border border-red-500/30 text-red-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>QA & Bug Engineering Cockpit</span>
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Quality Assurance & Defect Portal</h1>
          <p className="text-xs text-[#888898]">
            End-to-end bug tracking, parent task linkage, automated developer assignment, and verification workflows
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateTicketOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#222] hover:bg-[#2A2A2A] text-[#ACACB8] hover:text-white text-xs font-semibold border border-[#333] transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>New QA Test Ticket</span>
          </button>

          <button
            onClick={() => setIsRaiseBugOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-95 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] cursor-pointer"
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
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "OPEN"
              ? "bg-[#1A1A1A] border-slate-400 shadow-md"
              : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
          }`}
        >
          <div className="text-[10px] text-[#888898] uppercase font-mono">Open Bugs</div>
          <div className="text-xl font-black text-slate-200 mt-1">{counts.open}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "IN_PROGRESS"
              ? "bg-[#1A1A1A] border-blue-500 shadow-md"
              : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
          }`}
        >
          <div className="text-[10px] text-[#888898] uppercase font-mono">In Progress</div>
          <div className="text-xl font-black text-blue-400 mt-1">{counts.inProgress}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "READY_FOR_TESTING" ? "ALL" : "READY_FOR_TESTING")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "READY_FOR_TESTING"
              ? "bg-[#1A1A1A] border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
              : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
          }`}
        >
          <div className="text-[10px] text-[#888898] uppercase font-mono flex items-center gap-1">
            <span>Ready for Test</span>
            {counts.readyForTesting > 0 && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />}
          </div>
          <div className="text-xl font-black text-purple-400 mt-1">{counts.readyForTesting}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "IN_TESTING" ? "ALL" : "IN_TESTING")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "IN_TESTING"
              ? "bg-[#1A1A1A] border-cyan-500 shadow-md"
              : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
          }`}
        >
          <div className="text-[10px] text-[#888898] uppercase font-mono">In Testing</div>
          <div className="text-xl font-black text-cyan-400 mt-1">{counts.inTesting}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "FAILED" ? "ALL" : "FAILED")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "FAILED"
              ? "bg-[#1A1A1A] border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
          }`}
        >
          <div className="text-[10px] text-[#888898] uppercase font-mono flex items-center gap-1">
            <span>Failed QA</span>
            {counts.failed > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
          </div>
          <div className="text-xl font-black text-red-400 mt-1">{counts.failed}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "PASSED" ? "ALL" : "PASSED")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "PASSED"
              ? "bg-[#1A1A1A] border-emerald-500 shadow-md"
              : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
          }`}
        >
          <div className="text-[10px] text-[#888898] uppercase font-mono">Passed</div>
          <div className="text-xl font-black text-emerald-400 mt-1">{counts.passed}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "CLOSED" ? "ALL" : "CLOSED")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "CLOSED"
              ? "bg-[#1A1A1A] border-zinc-500 shadow-md"
              : "bg-[#141414] border-[#2E2E2E] hover:border-[#444]"
          }`}
        >
          <div className="text-[10px] text-[#888898] uppercase font-mono">Closed</div>
          <div className="text-xl font-black text-zinc-400 mt-1">{counts.closed}</div>
        </div>
      </div>

      {/* Toolbar: Filters & View Switcher */}
      <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2E2E2E] flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-[#888898] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Bug ID, title, parent task, dev..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#666] focus:border-red-500 focus:outline-none"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-xs text-white focus:outline-none"
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
            className="px-2.5 py-1.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-xs text-white focus:outline-none"
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
            className="px-2.5 py-1.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-xs text-white focus:outline-none"
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
            className="px-2.5 py-1.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-xs text-white focus:outline-none"
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
              className="px-2.5 py-1.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-xs text-white focus:outline-none"
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
              className="px-2.5 py-1.5 rounded-xl bg-[#222] hover:bg-[#333] text-[11px] text-[#FF8C42] font-semibold transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-[#1A1A1A] rounded-xl border border-[#2E2E2E]">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              viewMode === "table" ? "bg-[#FF6200] text-white" : "text-[#888898] hover:text-white"
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              viewMode === "kanban" ? "bg-[#FF6200] text-white" : "text-[#888898] hover:text-white"
            }`}
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
          <button
            onClick={() => setViewMode("tickets")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              viewMode === "tickets" ? "bg-[#FF6200] text-white" : "text-[#888898] hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tickets ({tickets.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Modern Issue Table */}
      {viewMode === "table" && (
        <div className="rounded-2xl border border-[#2E2E2E] bg-[#141414] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181818] border-b border-[#2E2E2E] text-[10px] font-mono uppercase text-[#888898]">
                <tr>
                  <th className="py-3 px-4">Bug ID</th>
                  <th className="py-3 px-4">Title & Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Responsible Dev</th>
                  <th className="py-3 px-4">QA Reporter</th>
                  <th className="py-3 px-4">Related Task</th>
                  <th className="py-3 px-4">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E2E]/60">
                {filteredBugs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-xs text-[#888898]">
                      No bugs match the current filters. Click "+ Raise Bug" to report a defect.
                    </td>
                  </tr>
                ) : (
                  filteredBugs.map((bug) => (
                    <tr
                      key={bug.id}
                      onClick={() => setSelectedBugKey(bug.bugKey)}
                      className="hover:bg-[#1A1A1A] transition-colors cursor-pointer group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-red-400 whitespace-nowrap">
                        {bug.bugKey}
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                        <div className="font-bold text-white group-hover:text-[#FF8C42] transition-colors truncate">
                          {bug.title}
                        </div>
                        {bug.failureReason && (
                          <div className="text-[10px] text-red-400 font-semibold truncate mt-0.5">
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
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#ACACB8] font-mono text-[11px]">
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
                          <span className="font-medium text-slate-200">{bug.assignedTo?.name || "Unassigned"}</span>
                        </div>
                      </td>

                      {/* QA Reporter */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-[#888898]">{bug.createdBy?.name || "QA"}</span>
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
                            className="px-2 py-0.5 rounded bg-[#FF6200]/15 border border-[#FF6200]/30 text-[#FF8C42] font-mono font-bold hover:underline cursor-pointer"
                          >
                            {bug.relatedTask.taskKey}
                          </span>
                        ) : (
                          <span className="text-[#666] italic">Standalone</span>
                        )}
                      </td>

                      {/* Updated */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[10px] text-[#888898]">
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

      {/* VIEW 2: Interactive Drag-and-Drop QA Kanban Board */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 overflow-x-auto min-h-[600px] pb-6">
          {KANBAN_COLUMNS.map((col) => {
            const columnBugs = filteredBugs.filter((b) => b.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.id)}
                className="flex flex-col rounded-2xl bg-[#141414] border border-[#2E2E2E] overflow-hidden min-w-[240px]"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-[#2E2E2E] bg-[#181818] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${col.color}`}>
                      {col.label}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#888898]">
                      {columnBugs.length}
                    </span>
                  </div>
                </div>

                {/* Draggable Cards Container */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[700px]">
                  {columnBugs.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-[#666] italic border border-dashed border-[#252525] rounded-xl m-1">
                      No defects
                    </div>
                  ) : (
                    columnBugs.map((b) => (
                      <div
                        key={b.id}
                        draggable
                        onDragStart={() => setDraggedBugKey(b.bugKey)}
                        onClick={() => setSelectedBugKey(b.bugKey)}
                        className={`p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing hover:scale-[1.02] shadow-sm ${
                          b.status === "FAILED"
                            ? "bg-red-950/20 border-red-500/40 hover:border-red-500"
                            : b.status === "READY_FOR_TESTING"
                            ? "bg-purple-950/20 border-purple-500/40 hover:border-purple-500"
                            : "bg-[#1A1A1A] border-[#2E2E2E] hover:border-[#FF6200]/50"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-mono font-black text-red-400 text-[11px]">
                            {b.bugKey}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getPriorityColor(b.priority)}`}>
                            {b.priority}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-white leading-tight line-clamp-2">
                          {b.title}
                        </div>

                        {b.failureReason && (
                          <div className="text-[10px] text-red-400 font-semibold mt-1 truncate">
                            Fail: {b.failureReason}
                          </div>
                        )}

                        {/* Card Footer */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#2E2E2E]/60 text-[10px]">
                          {b.relatedTask ? (
                            <span className="px-1.5 py-0.5 rounded bg-[#FF6200]/15 text-[#FF8C42] font-mono font-bold">
                              {b.relatedTask.taskKey}
                            </span>
                          ) : (
                            <span className="text-[#666]">Standalone</span>
                          )}

                          <div className="flex items-center gap-1">
                            <div
                              className={`w-5 h-5 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                b.assignedTo?.name
                              )} text-[9px] font-bold text-white flex items-center justify-center`}
                              title={`Assigned to ${b.assignedTo?.name || "Unassigned"}`}
                            >
                              {getInitials(b.assignedTo?.name)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: QA Test Tickets */}
      {viewMode === "tickets" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((t) => {
              const canDelete = isSuperAdmin || isManagerOrAdmin || t.createdById === currentUser?.id;
              return (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-[#141414] border border-[#2E2E2E] hover:border-[#FF6200]/40 transition-all space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-blue-400">{t.ticketKey}</span>
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
                            className="p-1 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white">{t.title}</h3>
                      <p className="text-xs text-[#888898] mt-1 line-clamp-2">{t.description}</p>
                    </div>

                    {t.bugs && t.bugs.length > 0 && (
                      <div className="pt-2 border-t border-[#2E2E2E]/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Logged Defects ({t.bugs.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {t.bugs.map((bug: any) => (
                            <button
                              key={bug.id}
                              type="button"
                              onClick={() => setSelectedBugKey(bug.bugKey)}
                              className="px-2 py-0.5 rounded bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold transition-colors"
                            >
                              {bug.bugKey}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#2E2E2E] flex items-center justify-between text-[11px] text-[#888898]">
                    <span>Assigned: <strong className="text-slate-200">{t.assignedTo?.name || "Unassigned"}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTicketForBug(t);
                        setIsRaiseBugOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#FF6200]/15 hover:bg-[#FF6200]/25 text-[#FF8C42] border border-[#FF6200]/30 text-[11px] font-semibold flex items-center gap-1 transition-colors"
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
