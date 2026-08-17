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
} from "lucide-react";
import { getPriorityColor, getStatusColor, getTypeIcon, formatDate } from "@/lib/utils";
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
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedTaskKey, setDraggedTaskKey] = useState<string | null>(null);

  // Relations modal
  const [relationsTaskKey, setRelationsTaskKey] = useState<string | null>(null);
  const [activeMenuKey, setActiveMenuKey] = useState<string | null>(null);

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedProjectId !== "ALL" && t.projectId !== selectedProjectId) return false;
    if (onlyMyTasks && !t.assignees?.some((a: any) => a.id === currentUser?.id || a.email === currentUser?.email))
      return false;
    if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
    if (
      searchQuery &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.taskKey.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

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
    <div className="flex flex-col h-[calc(100vh-6.5rem)] space-y-4 animate-fade-in" onClick={() => setActiveMenuKey(null)}>
      {/* Kanban Header & Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#141414] border border-[#2E2E2E]">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6200]"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>

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

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6200]"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🟢 Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#888898] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#888898] focus:outline-none focus:border-[#FF6200]/60 w-44"
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
      </div>

      {/* 5-Column Kanban Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3.5 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const colTasks = filteredTasks.filter((t) => t.status === column.id);

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="flex flex-col h-full rounded-2xl bg-[#141414] border border-[#2E2E2E] overflow-hidden group/col"
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

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.taskKey)}
                        onClick={() => onSelectTask(task.taskKey)}
                        className="relative p-3.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#FF6200]/50 hover:shadow-[0_0_20px_rgba(255,98,0,0.1)] transition-all cursor-grab active:cursor-grabbing space-y-2.5 group"
                      >
                        {/* Top: Key & Type & Three-Dot Menu */}
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

                        {/* Subtasks Progress */}
                        {task.subtasks?.length > 0 && (
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
                                {task.assignees.map((a: any) => (
                                  <img
                                    key={a.id}
                                    src={
                                      a.avatarUrl ||
                                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80"
                                    }
                                    alt={a.name}
                                    title={a.name}
                                    className="w-5 h-5 rounded-full object-cover border border-[#1A1A1A]"
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#888898] italic">Unassigned</span>
                            )}

                            {task.dueDate && (
                              <span className="flex items-center gap-0.5">
                                <Calendar className="w-2.5 h-2.5" />
                                <span>{formatDate(task.dueDate)}</span>
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
