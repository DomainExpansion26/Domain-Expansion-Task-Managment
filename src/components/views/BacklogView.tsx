"use client";

import React, { useState } from "react";
import {
  ListTodo,
  Plus,
  Play,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Search,
  Clock,
  Target,
} from "lucide-react";
import { getPriorityColor, getStatusColor, getTypeIcon, formatDate, getInitials, getAvatarGradient } from "@/lib/utils";

interface BacklogViewProps {
  tasks: any[];
  projects: any[];
  sprints: any[];
  onSelectTask: (key: string) => void;
  onOpenCreateTask: (projectId?: string, sprintId?: string) => void;
  onRefreshData: () => void;
}

export function BacklogView({
  tasks,
  projects,
  sprints,
  onSelectTask,
  onOpenCreateTask,
  onRefreshData,
}: BacklogViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintGoal, setNewSprintGoal] = useState("");
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeProject = projects.find((p) => p.id === (selectedProjectId || projects[0]?.id));
  const projectSprints = sprints.filter((s) => s.projectId === activeProject?.id);

  // Filter tasks
  const projectTasks = tasks.filter((t) => {
    if (t.projectId !== activeProject?.id) return false;
    if (
      searchQuery &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.taskKey.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  // Backlog tasks = tasks with no sprint or sprintId === null
  const backlogTasks = projectTasks.filter(
    (t) => !t.sprintId || t.sprintId === "null"
  );

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName.trim() || !activeProject) return;

    setLoading(true);
    try {
      const res = await fetch("/api/sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProject.id,
          name: newSprintName.trim(),
          goal: newSprintGoal.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNewSprintName("");
        setNewSprintGoal("");
        setShowCreateSprint(false);
        onRefreshData();
      }
    } catch (err) {
      console.error("Create sprint error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSprintStatus = async (sprintId: string, status: string) => {
    try {
      const res = await fetch(`/api/sprints/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        onRefreshData();
      }
    } catch (err) {
      console.error("Update sprint error:", err);
    }
  };

  const handleMoveTaskToSprint = async (taskId: string, sprintId: string | null) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintId }),
      });
      onRefreshData();
    } catch (err) {
      console.error("Move task to sprint error:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ListTodo className="w-5 h-5 text-[#FF6200]" />
            <span>Scrum Backlog & Sprints</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Prioritize backlog user stories, plan sprints, and set milestone goals
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project Picker */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#FF6200]"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter backlog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-[#888898] focus:outline-none focus:border-[#FF6200] w-36 sm:w-44"
            />
          </div>

          <button
            onClick={() => setShowCreateSprint(!showCreateSprint)}
            className="px-3.5 py-2 rounded-xl bg-[#252525] border border-slate-200 hover:bg-[#303030] text-xs font-bold text-white transition-colors"
          >
            + New Sprint
          </button>
        </div>
      </div>

      {/* New Sprint Modal / Inline Form */}
      {showCreateSprint && (
        <form
          onSubmit={handleCreateSprint}
          className="p-5 rounded-2xl bg-white border border-[#FF6200]/40 shadow-xl space-y-4 animate-fade-in"
        >
          <div className="text-sm font-bold text-white">Create New Sprint for {activeProject?.name}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Sprint Name (e.g. Sprint 3 - Performance & AI)"
              value={newSprintName}
              onChange={(e) => setNewSprintName(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6200]"
            />
            <input
              type="text"
              placeholder="Sprint Goal (e.g. Reduce latency, deliver MVP auth)"
              value={newSprintGoal}
              onChange={(e) => setNewSprintGoal(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6200]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateSprint(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newSprintName.trim()}
              className="px-4 py-1.5 rounded-lg bg-[#FF6200] text-white text-xs font-bold hover:bg-[#FF8C42]"
            >
              Create Sprint
            </button>
          </div>
        </form>
      )}

      {/* Sprints Sections */}
      <div className="space-y-6">
        {projectSprints.map((sprint) => {
          const sprintTasks = projectTasks.filter((t) => t.sprintId === sprint.id);
          const completedCount = sprintTasks.filter((t) => t.status === "DONE").length;
          const sprintHours = sprintTasks.reduce((acc, t) => acc + (t.loggedHours || 0), 0);
          const sprintEstimate = sprintTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
          const percentDone = sprintTasks.length > 0 ? Math.round((completedCount / sprintTasks.length) * 100) : 0;

          return (
            <div
              key={sprint.id}
              className="rounded-2xl bg-white border border-slate-200 overflow-hidden space-y-3 p-5"
            >
              {/* Sprint Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-white">{sprint.name}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                        sprint.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : sprint.status === "COMPLETED"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {sprint.status}
                    </span>
                    <span className="text-xs text-slate-500">{sprintTasks.length} issues</span>
                    <span className="text-xs text-[#FF8C42] font-mono font-bold">{sprintHours}h / {sprintEstimate}h</span>
                  </div>
                  {sprint.goal && (
                    <div className="text-xs text-slate-700 mt-1 font-medium italic flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-[#FF6200]" />
                      <span>&ldquo;{sprint.goal}&rdquo;</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {sprint.status === "PLANNED" && (
                    <button
                      onClick={() => handleUpdateSprintStatus(sprint.id, "ACTIVE")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-bold transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Sprint</span>
                    </button>
                  )}
                  {sprint.status === "ACTIVE" && (
                    <button
                      onClick={() => handleUpdateSprintStatus(sprint.id, "COMPLETED")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 text-xs font-bold transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Sprint</span>
                    </button>
                  )}
                  <button
                    onClick={() => onOpenCreateTask(activeProject?.id, sprint.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#252525] hover:bg-slate-100 text-xs font-semibold text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                </div>
              </div>

              {/* Sprint Progress Bar */}
              {sprintTasks.length > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Sprint Progress</span>
                    <span>{completedCount}/{sprintTasks.length} tasks done ({percentDone}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#252525] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF6200] to-emerald-500 transition-all duration-300"
                      style={{ width: `${percentDone}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Sprint Tasks List */}
              <div className="space-y-2 pt-1">
                {sprintTasks.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">No tasks in this sprint yet.</div>
                ) : (
                  sprintTasks.map((task) => {
                    const pColor = getPriorityColor(task.priority);
                    const sColor = getStatusColor(task.status);
                    const typeInfo = getTypeIcon(task.taskType);

                    return (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task.taskKey)}
                        className="p-3 rounded-xl bg-white border border-slate-200 hover:border-[#FF6200]/40 transition-all flex items-center justify-between gap-4 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-xs font-bold text-[#FF8C42]">{task.taskKey}</span>
                          <span className="text-xs text-white font-medium group-hover:text-[#FF8C42] transition-colors truncate">
                            {task.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[10px]">
                          <span className={`px-2 py-0.5 rounded-full border ${sColor.bg}`}>{sColor.label}</span>
                          <span className={`px-2 py-0.5 rounded-full border ${pColor.bg}`}>{pColor.label}</span>
                          {task.assignees?.[0] && (
                            task.assignees[0].avatarUrl ? (
                              <img
                                src={task.assignees[0].avatarUrl}
                                alt={task.assignees[0].name}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                title={task.assignees[0].name}
                                className={`w-5 h-5 rounded-full bg-gradient-to-tr ${getAvatarGradient(task.assignees[0].name)} flex items-center justify-center text-[8px] font-black text-white uppercase flex-shrink-0`}
                              >
                                {getInitials(task.assignees[0].name)}
                              </div>
                            )
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveTaskToSprint(task.id, null);
                            }}
                            className="text-[10px] text-slate-500 hover:text-slate-900 px-2 py-1 bg-[#252525] rounded"
                            title="Move to Backlog"
                          >
                            To Backlog &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

        {/* Backlog Section */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Backlog (Unassigned Sprints)</span>
              <span className="text-xs text-slate-500 font-mono bg-[#252525] px-2 py-0.5 rounded-full">
                {backlogTasks.length} issues
              </span>
            </div>
            <button
              onClick={() => onOpenCreateTask(activeProject?.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FF6200] hover:bg-[#FF8C42] text-xs font-bold text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
          </div>

          <div className="space-y-2">
            {backlogTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">Backlog is empty.</div>
            ) : (
              backlogTasks.map((task) => {
                const pColor = getPriorityColor(task.priority);
                const sColor = getStatusColor(task.status);

                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task.taskKey)}
                    className="p-3 rounded-xl bg-white border border-slate-200 hover:border-[#FF6200]/40 transition-all flex items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-bold text-[#FF8C42]">{task.taskKey}</span>
                      <span className="text-xs text-white font-medium group-hover:text-[#FF8C42] transition-colors truncate">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full border ${sColor.bg}`}>{sColor.label}</span>
                      <span className={`px-2 py-0.5 rounded-full border ${pColor.bg}`}>{pColor.label}</span>
                      {projectSprints.length > 0 && (
                        <select
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleMoveTaskToSprint(task.id, e.target.value)}
                          className="bg-[#252525] border border-slate-200 rounded px-2 py-1 text-white text-[10px] focus:outline-none"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Move to Sprint...
                          </option>
                          {projectSprints.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
