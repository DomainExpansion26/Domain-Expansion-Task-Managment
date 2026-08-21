"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Bug,
  Sparkles,
  AlertTriangle,
  Layers,
  User,
  CheckCircle2,
  Terminal,
  FileText,
  Upload,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { getInitials, getAvatarGradient } from "@/lib/utils";

interface RaiseBugModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentTask?: {
    id: string;
    taskKey: string;
    title: string;
    projectId: string;
    projectName?: string;
    assignees?: any[];
  } | null;
  projects?: any[];
  users: any[];
  currentUser: any;
  onBugCreated: (bug: any) => void;
}

export function RaiseBugModal({
  isOpen,
  onClose,
  parentTask,
  projects = [],
  users = [],
  currentUser,
  onBugCreated,
}: RaiseBugModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("HIGH");
  const [severity, setSeverity] = useState("MAJOR");
  const [environment, setEnvironment] = useState("Production");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  const [actualResult, setActualResult] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [loading, setLoading] = useState(false);
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset form when modal opens or parentTask changes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (parentTask) {
        setSelectedProjectId(parentTask.projectId);
        // Default assignee to parent task's primary assignee
        const primaryAssignee = parentTask.assignees?.[0];
        const devId = primaryAssignee?.id || primaryAssignee?.userId || primaryAssignee?.user?.id || "";
        setAssignedToId(devId);
      } else if (projects.length > 0) {
        setSelectedProjectId(projects[0].id);
        setAssignedToId("");
      }
    }
  }, [isOpen, parentTask, projects]);

  if (!isOpen) return null;

  const currentProjectName =
    parentTask?.projectName ||
    projects.find((p) => p.id === selectedProjectId)?.name ||
    "Selected Project";

  // AI Prompt generation for reproduction steps
  const handleAIEnhance = async () => {
    if (!title.trim()) {
      setError("Please enter a bug title before using AI enhancement.");
      return;
    }

    setAiEnhancing(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ENHANCE_BUG_REPORT",
          title,
          description: description || stepsToReproduce,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.enhancedText) {
        if (!description) setDescription(`Defect observed on ${parentTask?.taskKey || "system"}: ${title}`);
        if (!stepsToReproduce) {
          setStepsToReproduce(
            `1. Navigate to target module\n2. Trigger action with test payload\n3. Observe system response`
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Bug title is required.");
      return;
    }
    if (!selectedProjectId && !parentTask?.projectId) {
      setError("Project association is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let endpoint = "/api/qa/bugs";
      const payload: any = {
        title: title.trim(),
        description: description.trim() || `QA defect reported against ${parentTask?.taskKey || "task"}: ${title.trim()}`,
        priority,
        severity,
        environment,
        stepsToReproduce: stepsToReproduce.trim() || undefined,
        expectedResult: expectedResult.trim() || undefined,
        actualResult: actualResult.trim() || undefined,
        projectId: parentTask?.projectId || selectedProjectId,
        assignedToId: assignedToId || undefined,
      };

      if (parentTask?.id) {
        endpoint = `/api/tasks/${parentTask.taskKey || parentTask.id}/bugs`;
      } else {
        payload.relatedTaskId = undefined;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        onBugCreated(json.data);
        onClose();
        // Reset form
        setTitle("");
        setDescription("");
        setStepsToReproduce("");
        setExpectedResult("");
        setActualResult("");
      } else {
        setError(json.error?.message || "Failed to raise bug.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to raise QA bug.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#181818]/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
                  QA Defect Management
                </span>
                {parentTask && (
                  <span className="px-2 py-0.5 rounded-md bg-[#252525] border border-[#333] text-[11px] font-mono text-[#FF8C42]">
                    Linked: {parentTask.taskKey}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">Raise QA Bug</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888898] hover:text-white hover:bg-[#252525] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Context Banner if Linked to Task */}
          {parentTask && (
            <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] text-[#888898] uppercase font-mono tracking-wider">
                  Target Work Item Context
                </div>
                <div className="text-xs font-bold text-white truncate mt-0.5 flex items-center gap-2">
                  <span className="text-[#FF6200] font-mono">{parentTask.taskKey}</span>
                  <span className="text-[#888898]">&bull;</span>
                  <span className="truncate">{parentTask.title}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[10px] text-[#888898] uppercase font-mono">Project</div>
                <div className="text-xs font-semibold text-[#ACACB8]">{currentProjectName}</div>
              </div>
            </div>
          )}

          {/* Bug Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#ACACB8] flex items-center gap-1">
                <span>Bug Title</span>
                <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleAIEnhance}
                disabled={aiEnhancing}
                className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiEnhancing ? "Enhancing..." : "AI Auto-Fill Steps"}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Registration API returns 500 error for duplicate email"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs placeholder-[#666] focus:border-[#FF6200] focus:outline-none transition-colors"
            />
          </div>

          {/* Assignment & Environment Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assignee (Defaults to original task assignee) */}
            <div>
              <label className="block text-xs font-bold text-[#ACACB8] mb-1.5">
                Responsible Developer <span className="text-red-400">*</span>
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:border-[#FF6200] focus:outline-none"
              >
                <option value="">Select Developer...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role?.replace("_", " ")})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#888898] mt-1">
                Auto-assigned to task owner &bull; Can be adjusted manually
              </p>
            </div>

            {/* Environment */}
            <div>
              <label className="block text-xs font-bold text-[#ACACB8] mb-1.5">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:border-[#FF6200] focus:outline-none"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="QA / Test">QA / Test</option>
                <option value="Development">Development</option>
              </select>
            </div>
          </div>

          {/* Priority & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#ACACB8] mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:border-[#FF6200] focus:outline-none"
              >
                <option value="CRITICAL">Critical Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#ACACB8] mb-1.5">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:border-[#FF6200] focus:outline-none"
              >
                <option value="CRITICAL">Critical (Blocks Release / Crash)</option>
                <option value="MAJOR">Major (Broken Core Functionality)</option>
                <option value="MEDIUM">Medium (Non-blocking Defect)</option>
                <option value="MINOR">Minor (Cosmetic / Minor Glitch)</option>
                <option value="TRIVIAL">Trivial (Typo / Polish)</option>
              </select>
            </div>
          </div>

          {/* Steps to Reproduce */}
          <div>
            <label className="block text-xs font-bold text-[#ACACB8] mb-1.5">Steps to Reproduce</label>
            <textarea
              rows={3}
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder="1. Open user registration modal&#10;2. Input an existing email (e.g. test@domain.com)&#10;3. Submit registration form"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs placeholder-[#666] focus:border-[#FF6200] focus:outline-none font-mono"
            />
          </div>

          {/* Expected vs Actual Result */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#ACACB8] mb-1.5">Expected Result</label>
              <textarea
                rows={2}
                value={expectedResult}
                onChange={(e) => setExpectedResult(e.target.value)}
                placeholder="User friendly 400 validation: 'Email already registered'"
                className="w-full px-3.5 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs placeholder-[#666] focus:border-[#FF6200] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#ACACB8] mb-1.5">Actual Result</label>
              <textarea
                rows={2}
                value={actualResult}
                onChange={(e) => setActualResult(e.target.value)}
                placeholder="API unhandled exception returns 500 Internal Server Error"
                className="w-full px-3.5 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs placeholder-[#666] focus:border-[#FF6200] focus:outline-none"
              />
            </div>
          </div>

          {/* Additional Description / Notes */}
          <div>
            <label className="block text-xs font-bold text-[#ACACB8] mb-1.5">Defect Description / Summary</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional logs, stack traces, or observed edge cases..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs placeholder-[#666] focus:border-[#FF6200] focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#2E2E2E] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-[#888898]">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Developer will be automatically notified via in-app banner & email.</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#222] hover:bg-[#2A2A2A] text-[#ACACB8] hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
              >
                <Bug className="w-4 h-4" />
                <span>{loading ? "Raising Bug..." : "Log & Assign Bug"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
