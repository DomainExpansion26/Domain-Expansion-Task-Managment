"use client";

import React from "react";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Users,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getPriorityColor, getStatusColor } from "@/lib/utils";

interface DashboardViewProps {
  tasks: any[];
  projects: any[];
  users: any[];
  onSelectTask: (key: string) => void;
  onSelectProject: (id: string) => void;
  onOpenCreateTask: () => void;
  onToggleAI?: () => void;
}

export function DashboardView({
  tasks,
  projects,
  users,
  onSelectTask,
  onSelectProject,
  onOpenCreateTask,
  onToggleAI,
}: DashboardViewProps) {
  const now = new Date();

  // Metrics
  const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED").length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < now
  );

  // Status distribution data for chart
  const statusData = [
    { name: "To Do", count: tasks.filter((t) => t.status === "TODO").length, color: "#64748B" },
    { name: "In Progress", count: inProgressTasks, color: "#3B82F6" },
    { name: "In Review", count: tasks.filter((t) => t.status === "IN_REVIEW").length, color: "#8B5CF6" },
    { name: "Blocked", count: blockedTasks, color: "#EF4444" },
    { name: "Done", count: completedTasks, color: "#10B981" },
  ];

  // Priority distribution
  const priorityData = [
    { name: "Critical", value: tasks.filter((t) => t.priority === "CRITICAL").length, color: "#EF4444" },
    { name: "High", value: tasks.filter((t) => t.priority === "HIGH").length, color: "#F97316" },
    { name: "Medium", value: tasks.filter((t) => t.priority === "MEDIUM").length, color: "#EAB308" },
    { name: "Low", value: tasks.filter((t) => t.priority === "LOW").length, color: "#10B981" },
  ];

  // Assignee workload
  const assigneeData = users.map((u) => {
    const userTasks = tasks.filter((t) => t.assignees?.some((a: any) => a.id === u.id));
    return {
      name: u.name.split(" ")[0],
      active: userTasks.filter((t) => t.status !== "DONE").length,
      completed: userTasks.filter((t) => t.status === "DONE").length,
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Welcome & Slogan Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-orange-50/70 via-white to-orange-50/40 p-6 sm:p-8 shadow-xs">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6200]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6200]/15 border border-[#FF6200]/30 text-[10px] font-mono uppercase tracking-widest text-[#FF6200] mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6200] animate-pulse" />
              Domain Expansion Platform
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Think <span className="text-gradient-orange">Outside The Box</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
              Enterprise workflow engine, sprint tracking, and real-time collaboration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenCreateTask}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,98,0,0.3)]"
            >
              <span>+ Create Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono uppercase font-semibold">Projects</span>
            <FolderKanban className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{activeProjects}</div>
          <div className="text-[10px] text-slate-500 mt-1">Active Projects</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono uppercase font-semibold">Total Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalTasks}</div>
          <div className="text-[10px] text-blue-600 font-semibold mt-1">{completedTasks} completed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono uppercase font-semibold">In Progress</span>
            <Clock className="w-4 h-4 text-[#FF6200]" />
          </div>
          <div className="text-2xl font-black text-[#FF6200] mt-2">{inProgressTasks}</div>
          <div className="text-[10px] text-slate-500 mt-1">Active sprint tasks</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono uppercase font-semibold">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className={`text-2xl font-black mt-2 ${overdueTasks.length > 0 ? "text-rose-600" : "text-slate-900"}`}>
            {overdueTasks.length}
          </div>
          <div className="text-[10px] text-rose-600 font-semibold mt-1">Needs attention</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono uppercase font-semibold">Blocked</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{blockedTasks}</div>
          <div className="text-[10px] text-slate-500 mt-1">Pending unblock</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono uppercase font-semibold">Team</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{users.length}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">Members active</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Tasks by Workflow Status</h3>
            <span className="text-[10px] font-mono text-slate-400">Pipeline</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", fontSize: "11px", color: "#0F172A", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Priority Distribution</h3>
            <span className="text-[10px] font-mono text-slate-400">Urgency</span>
          </div>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-p-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", fontSize: "11px", color: "#0F172A", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-[10px] text-slate-500">
            {priorityData.map((p, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="font-medium text-slate-600">{p.name}: {p.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team Workload */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Team Member Workload</h3>
            <span className="text-[10px] font-mono text-slate-400">Capacity</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assigneeData} layout="vertical">
                <XAxis type="number" stroke="#94A3B8" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} width={60} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", fontSize: "11px", color: "#0F172A", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="active" stackId="a" fill="#FF6200" name="Active" radius={[0, 0, 0, 0]} />
                <Bar dataKey="completed" stackId="a" fill="#10B981" name="Done" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Projects Progress & Critical/Overdue Alert List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Overview */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Project Progress</h3>
            <span className="text-[10px] font-mono text-slate-400">All Projects</span>
          </div>
          <div className="space-y-3">
            {projects.map((p) => {
              const total = p.stats?.totalTasks || 0;
              const done = p.stats?.completedTasks || 0;
              const percent = p.stats?.progressPercent || 0;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-[#FF6200]/50 hover:bg-white transition-all cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#FF6200]">{p.key}</span>
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-[#FF6200] transition-colors">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-mono">{percent}%</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-200 mt-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF6200] to-orange-400 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                    <span>Lead: {p.lead?.name || "Unassigned"}</span>
                    <span>{done}/{total} tasks completed</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attention Needed (Overdue & Critical Tasks) */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Attention Required</h3>
            <span className="text-[10px] font-mono text-rose-600 font-semibold">Critical & Overdue</span>
          </div>

          <div className="space-y-2.5">
            {overdueTasks.length === 0 && blockedTasks === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                🎉 All tasks are on schedule and running smoothly.
              </div>
            ) : (
              tasks
                .filter((t) => t.status === "BLOCKED" || (t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE"))
                .slice(0, 5)
                .map((task) => {
                  const pColor = getPriorityColor(task.priority);
                  const sColor = getStatusColor(task.status);
                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task.taskKey)}
                      className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-rose-400 hover:bg-white transition-all cursor-pointer flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-[#FF6200]">{task.taskKey}</span>
                        <div className="truncate max-w-[220px]">
                          <div className="text-xs font-semibold text-slate-800 truncate">{task.title}</div>
                          <div className="text-[10px] text-slate-500 truncate">{task.project?.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sColor.bg}`}>
                          {sColor.label}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${pColor.bg}`}>
                          {pColor.label}
                        </span>
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
