"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { QATicketCreateModal } from "@/components/modals/QATicketCreateModal";
import { QABugCreateModal } from "@/components/modals/QABugCreateModal";

interface QAViewProps {
  currentUser: any;
  projects?: any[];
  users?: any[];
  tasks?: any[];
}

export function QAView({ currentUser, projects = [], users = [], tasks = [] }: QAViewProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isCreateBugOpen, setIsCreateBugOpen] = useState(false);
  const [bugTicketTarget, setBugTicketTarget] = useState<any | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/qa/tickets");
      const json = await res.json();
      if (json.success) {
        setTickets(json.data);
        if (selectedTicket) {
          const updatedSelected = json.data.find((t: any) => t.id === selectedTicket.id);
          if (updatedSelected) setSelectedTicket(updatedSelected);
        }
      }
    } catch (err) {
      console.error("Failed to load QA tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const res = await fetch(`/api/qa/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchProject = projectFilter === "ALL" || t.projectId === projectFilter;
    const matchSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticketKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchProject && matchSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CLOSED":
        return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
      case "TEST_FAILED":
        return "bg-red-500/15 border-red-500/30 text-red-400";
      case "READY_FOR_TESTING":
        return "bg-purple-500/15 border-purple-500/30 text-purple-400";
      case "IN_PROGRESS":
        return "bg-blue-500/15 border-blue-500/30 text-blue-400";
      default:
        return "bg-slate-500/15 border-slate-500/30 text-slate-300";
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>QA & Defect Engineering</span>
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Quality Assurance Portal</h1>
          <p className="text-xs text-[#888898]">
            Test ticket execution, verification checklists, and defect triage lifecycle
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateTicketOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create QA Ticket</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#141414] p-3 rounded-2xl border border-[#2E2E2E]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#888898] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search QA tickets, keys, defects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#666] focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#888898]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="READY_FOR_TESTING">Ready for Testing</option>
              <option value="TEST_FAILED">Test Failed</option>
              <option value="CLOSED">Closed / Passed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#888898]">Project:</span>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Tickets List on Left, Selected Ticket & Bugs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tickets Column */}
        <div className="lg:col-span-7 space-y-3">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#888898]">Loading QA tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#141414] border border-[#2E2E2E] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] text-[#888898] mx-auto flex items-center justify-center">
                <Bug className="w-6 h-6" />
              </div>
              <p className="text-xs text-[#888898]">No QA tickets match your filters.</p>
              <button
                onClick={() => setIsCreateTicketOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                Create QA Ticket
              </button>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedTicket?.id === ticket.id
                    ? "bg-[#1A1A1A] border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                    : "bg-[#141414] border-[#2E2E2E] hover:border-[#3E3E3E]"
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-400">{ticket.ticketKey}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#1E1E1E] text-slate-400 border border-[#2E2E2E]">
                      {ticket.project?.name}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1.5">{ticket.title}</h3>
                <p className="text-xs text-[#888898] line-clamp-2 mb-3 leading-relaxed">{ticket.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-[#2E2E2E]/60 text-[11px] text-[#888898]">
                  <div className="flex items-center gap-2">
                    <span>Assigned:</span>
                    <span className="text-white font-medium">{ticket.assignedTo?.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-red-400 font-semibold">
                      <Bug className="w-3.5 h-3.5" />
                      <span>{ticket.bugs?.length || 0} bugs</span>
                    </div>
                    <span>
                      {new Date(ticket.startDate).toLocaleDateString()} - {new Date(ticket.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail & Defects Column */}
        <div className="lg:col-span-5">
          {selectedTicket ? (
            <div className="sticky top-6 p-6 rounded-2xl bg-[#141414] border border-[#2E2E2E] space-y-5">
              {/* Ticket Details Header */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#2E2E2E]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-xs text-blue-400">{selectedTicket.ticketKey}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace("_", " ")}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white">{selectedTicket.title}</h2>
                </div>
              </div>

              {/* Status Actions */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#888898] uppercase tracking-wider block">
                  Workflow Status Transitions
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, "READY_FOR_TESTING")}
                    className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 font-bold transition-all"
                  >
                    Ready for Test
                  </button>
                  <button
                    onClick={() => {
                      setBugTicketTarget(selectedTicket);
                      setIsCreateBugOpen(true);
                    }}
                    className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <Bug className="w-3.5 h-3.5" />
                    <span>Log Bug</span>
                  </button>
                  <button
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, "CLOSED")}
                    className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 font-bold transition-all"
                  >
                    Pass & Close
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-1.5 text-xs">
                <span className="text-[#888898] font-semibold block">Test Specification & Scope:</span>
                <p className="text-[#ACACB8] leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* Related Task Link if exists */}
              {selectedTicket.relatedTask && (
                <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#888898] block text-[10px]">Linked Development Task</span>
                    <span className="font-bold text-[#FF8C42]">{selectedTicket.relatedTask.taskKey}: </span>
                    <span className="text-white">{selectedTicket.relatedTask.title}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#252525] text-slate-300 font-mono">
                    {selectedTicket.relatedTask.status}
                  </span>
                </div>
              )}

              {/* Bugs under this Ticket */}
              <div className="space-y-3 pt-2 border-t border-[#2E2E2E]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Bug className="w-4 h-4 text-red-400" />
                    <h3 className="text-xs font-bold text-white">
                      Linked Defects & Bugs ({selectedTicket.bugs?.length || 0})
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setBugTicketTarget(selectedTicket);
                      setIsCreateBugOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Log Bug</span>
                  </button>
                </div>

                {selectedTicket.bugs && selectedTicket.bugs.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTicket.bugs.map((bug: any) => (
                      <div
                        key={bug.id}
                        className="p-3 rounded-xl bg-[#1A1A1A] border border-red-500/30 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-red-400">{bug.bugKey}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-mono">
                              {bug.severity}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#252525] text-slate-300 font-mono">
                              {bug.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-white font-medium">{bug.title}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#1A1A1A]/40 border border-[#2E2E2E]/60 text-center text-xs text-[#888898] italic">
                    No defects logged under this QA ticket yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-[#141414] border border-[#2E2E2E] text-xs text-[#888898]">
              Select a QA ticket from the list to view its test specifications and defect records.
            </div>
          )}
        </div>
      </div>

      {/* QA Ticket Create Modal */}
      {isCreateTicketOpen && (
        <QATicketCreateModal
          isOpen={isCreateTicketOpen}
          onClose={() => setIsCreateTicketOpen(false)}
          projects={projects}
          users={users}
          tasks={tasks}
          onTicketCreated={fetchTickets}
        />
      )}

      {/* QA Bug Create Modal */}
      {isCreateBugOpen && bugTicketTarget && (
        <QABugCreateModal
          isOpen={isCreateBugOpen}
          onClose={() => {
            setIsCreateBugOpen(false);
            setBugTicketTarget(null);
          }}
          ticketId={bugTicketTarget.id}
          ticketKey={bugTicketTarget.ticketKey}
          projectId={bugTicketTarget.projectId}
          users={users}
          onBugCreated={fetchTickets}
        />
      )}
    </div>
  );
}
