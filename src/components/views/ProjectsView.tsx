"use client";

import React, { useState } from "react";
import {
  FolderKanban,
  Plus,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ProjectsViewProps {
  projects: any[];
  users: any[];
  currentUser: any;
  onSelectProject: (id: string) => void;
  onRefreshData: () => void;
}

export function ProjectsView({
  projects,
  users,
  currentUser,
  onSelectProject,
  onRefreshData,
}: ProjectsViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [leadId, setLeadId] = useState(currentUser?.id || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!key || key.length <= 4) {
      // Auto-generate project key abbreviation (e.g. "Website Development" -> "WEB")
      const words = val.trim().split(/\s+/);
      if (words.length === 1 && words[0].length >= 3) {
        setKey(words[0].substring(0, 3).toUpperCase());
      } else if (words.length > 1) {
        setKey(words.map((w) => w[0]).join("").substring(0, 4).toUpperCase());
      }
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) {
      setError("Project name and key are required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          key: key.trim().toUpperCase(),
          description: description.trim(),
          leadId,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setName("");
        setKey("");
        setDescription("");
        setShowCreateModal(false);
        onRefreshData();
      } else {
        setError(json.error?.message || "Failed to create project");
      }
    } catch (err) {
      console.error("Create project error:", err);
      setError("Network error creating project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FolderKanban className="w-5 h-5 text-[#FF6200]" />
            <span>Projects Directory</span>
          </h1>
          <p className="text-xs text-[#888898] mt-1">
            Organize work by initiatives, assign project leads, and track roadmap completion
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,98,0,0.3)]"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6200]/10 border border-[#FF6200]/30 flex items-center justify-center text-[#FF6200] mx-auto">
            <FolderKanban className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Projects Created Yet</h3>
            <p className="text-xs text-[#888898] max-w-md mx-auto">
              Get started by creating your organization&apos;s first project. Projects allow you to group tasks, plan sprints, and assign team members.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,98,0,0.3)]"
          >
            + Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => {
          const total = project.stats?.totalTasks || 0;
          const done = project.stats?.completedTasks || 0;
          const inProgress = project.stats?.inProgressTasks || 0;
          const blocked = project.stats?.blockedTasks || 0;
          const percent = project.stats?.progressPercent || 0;

          return (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="p-5 rounded-2xl bg-[#141414] border border-[#2E2E2E] hover:border-[#FF6200]/50 hover:shadow-[0_0_25px_rgba(255,98,0,0.1)] transition-all cursor-pointer flex flex-col justify-between group space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#FF8C42] bg-[#FF6200]/10 px-2.5 py-1 rounded-lg border border-[#FF6200]/30">
                    {project.key}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {project.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-[#FF8C42] transition-colors mt-3">
                  {project.name}
                </h3>
                <p className="text-xs text-[#888898] line-clamp-2 mt-1.5 leading-relaxed">
                  {project.description || "No project description provided."}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-[#2E2E2E]/60">
                <div className="flex justify-between text-xs">
                  <span className="text-[#888898]">Progress</span>
                  <span className="font-bold text-white font-mono">{percent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#252525] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF6200] to-[#FF8C42] transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Bottom Metadata */}
              <div className="flex items-center justify-between text-[11px] text-[#888898] pt-1">
                <div className="flex items-center gap-2">
                  <img
                    src={project.lead?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                    alt={project.lead?.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span>{project.lead?.name || "Lead"}</span>
                </div>
                <div className="flex items-center gap-1 text-[#FF8C42] font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Open Board</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
              <h2 className="text-sm font-bold text-white">Create New Project</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-[#252525] text-[#888898] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Next-Gen Client Portal"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Project Key (Prefix) *</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. PORTAL"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Project goal, scope, and objectives..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-3 text-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Project Lead</label>
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-[#888898] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-[#FF6200] hover:bg-[#FF8C42] text-white font-bold transition-all shadow-[0_0_15px_rgba(255,98,0,0.3)]"
                >
                  {loading ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
