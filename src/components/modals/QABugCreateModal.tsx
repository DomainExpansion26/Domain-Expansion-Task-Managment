"use client";

import React, { useState } from "react";
import { X, Sparkles, AlertCircle, Bug } from "lucide-react";

interface QABugCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketKey?: string;
  projectId: string;
  users: any[];
  onBugCreated: () => void;
}

export function QABugCreateModal({
  isOpen,
  onClose,
  ticketId,
  ticketKey,
  projectId,
  users,
  onBugCreated,
}: QABugCreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("MAJOR");
  const [priority, setPriority] = useState("HIGH");
  const [assignedToId, setAssignedToId] = useState("");
  const [status, setStatus] = useState("OPEN");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAIEnhance = async () => {
    if (!title.trim()) {
      setError("Please provide a bug summary before requesting AI reproduction steps.");
      return;
    }
    setAiLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ENHANCE_BUG_REPORT",
          title,
          description,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.enhancedText) {
        setDescription(json.data.enhancedText);
      }
    } catch (err) {
      console.error("AI Bug Enhance error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Bug title and reproduction description are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/qa/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority,
          severity,
          status,
          ticketId,
          projectId,
          assignedToId: assignedToId || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        onBugCreated();
        onClose();
        setTitle("");
        setDescription("");
      } else {
        setError(json.error?.message || "Failed to log QA bug");
      }
    } catch (err) {
      setError("Network error logging bug");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Log Defect / QA Bug</h2>
              <p className="text-[11px] text-slate-500">Linked under QA Ticket: {ticketKey || ticketId}</p>
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

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Bug Summary / Title *</label>
            <input
              type="text"
              placeholder="e.g. Invalid password error message not displayed on login failure"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-medium"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-semibold">Reproduction Steps & Behavior *</label>
              <button
                type="button"
                onClick={handleAIEnhance}
                disabled={aiLoading}
                className="flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-700 font-semibold"
              >
                <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? "animate-spin" : ""}`} />
                <span>{aiLoading ? "Structuring..." : "AI Generate Steps"}</span>
              </button>
            </div>
            <textarea
              rows={4}
              placeholder="1. Enter invalid email&#10;2. Click Sign In&#10;Expected: Red error banner&#10;Actual: Silent freeze"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 leading-relaxed font-mono text-[11px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              >
                <option value="CRITICAL">🔴 Critical (Blocker / Crash)</option>
                <option value="MAJOR">🟠 Major (Core feature broken)</option>
                <option value="MEDIUM">🟡 Medium (Workaround exists)</option>
                <option value="MINOR">🟢 Minor (Cosmetic / UI glitch)</option>
                <option value="TRIVIAL">⚪ Trivial (Typo)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Assign to Developer</label>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

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
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-sm shadow-red-600/20"
            >
              {loading ? "Logging Bug..." : "Log Bug"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
