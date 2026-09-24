"use client";

import React, { useState } from "react";
import { X, Sparkles, AlertCircle, Plus, Calendar } from "lucide-react";

interface QATicketCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: any[];
  users: any[];
  tasks: any[];
  onTicketCreated: () => void;
}

export function QATicketCreateModal({
  isOpen,
  onClose,
  projects,
  users,
  tasks,
  onTicketCreated,
}: QATicketCreateModalProps) {
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [assignedToId, setAssignedToId] = useState(users[0]?.id || "");
  const [relatedTaskId, setRelatedTaskId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("TODO");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const projectTasks = tasks.filter((t) => t.projectId === (projectId || projects[0]?.id));

  const handleAIEnhance = async () => {
    if (!title.trim()) {
      setError("Please provide at least a ticket title before AI enhancement.");
      return;
    }
    setAiLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ENHANCE_QA_TICKET",
          title,
          description,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.enhancedText) {
        setDescription(json.data.enhancedText);
      }
    } catch (err) {
      console.error("AI Enhance error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mandatory fields validation (Master Prompt Section 16 & 39)
    if (!title.trim() || !description.trim() || !startDate || !endDate || !assignedToId || !projectId) {
      setError("Title, Description, Start Date, End Date, Assigned Member, and Project are ALL mandatory.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/qa/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          startDate,
          endDate,
          assignedToId,
          projectId,
          relatedTaskId: relatedTaskId || null,
          priority,
          status,
        }),
      });

      const json = await res.json();
      if (json.success) {
        onTicketCreated();
        onClose();
        setTitle("");
        setDescription("");
      } else {
        setError(json.error?.message || "Failed to create QA Ticket");
      }
    } catch (err) {
      setError("Network error creating QA Ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Create QA Ticket</h2>
              <p className="text-[11px] text-slate-500">Assign test coverage, define verification scope & edge cases</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Project & Related Task */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Project *</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Related Task (Optional)</label>
              <select
                value={relatedTaskId}
                onChange={(e) => setRelatedTaskId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              >
                <option value="">None (Independent QA Ticket)</option>
                {projectTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.taskKey}: {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">QA Ticket Title *</label>
            <input
              type="text"
              placeholder="e.g. Login screen validation & credential handling"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] font-medium"
            />
          </div>

          {/* Description with OpenRouter AI Enhance */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-semibold">Test Specification / Description *</label>
              <button
                type="button"
                onClick={handleAIEnhance}
                disabled={aiLoading}
                className="flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-700 font-semibold"
              >
                <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? "animate-spin" : ""}`} />
                <span>{aiLoading ? "AI Generating..." : "AI Improve Spec"}</span>
              </button>
            </div>
            <textarea
              rows={4}
              placeholder="Detailed description of test requirements, edge cases, and expected behaviors..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] leading-relaxed"
            />
          </div>

          {/* Start Date & End Date (Mandatory) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              />
            </div>
          </div>

          {/* Assigned Member & Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Assigned QA / Member *</label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="READY_FOR_TESTING">Ready for Testing</option>
                <option value="TEST_FAILED">Test Failed</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              >
                <option value="CRITICAL">🔴 Critical</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">🟢 Low</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white font-bold transition-all shadow-sm shadow-[#FF6200]/25"
            >
              {loading ? "Creating..." : "Create QA Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
