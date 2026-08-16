import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "No date";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getPriorityColor(priority: string) {
  switch (priority?.toUpperCase()) {
    case "CRITICAL":
      return {
        bg: "bg-red-500/15 border-red-500/30 text-red-400",
        dot: "bg-red-500",
        label: "Critical",
        icon: "🔴",
      };
    case "HIGH":
      return {
        bg: "bg-orange-500/15 border-orange-500/30 text-orange-400",
        dot: "bg-orange-500",
        label: "High",
        icon: "🟠",
      };
    case "MEDIUM":
      return {
        bg: "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
        dot: "bg-yellow-500",
        label: "Medium",
        icon: "🟡",
      };
    case "LOW":
    default:
      return {
        bg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
        dot: "bg-emerald-500",
        label: "Low",
        icon: "🟢",
      };
  }
}

export function getStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case "TODO":
      return {
        bg: "bg-slate-500/15 border-slate-500/30 text-slate-300",
        dot: "bg-slate-400",
        label: "To Do",
      };
    case "IN_PROGRESS":
      return {
        bg: "bg-blue-500/15 border-blue-500/30 text-blue-400",
        dot: "bg-blue-500",
        label: "In Progress",
      };
    case "IN_REVIEW":
      return {
        bg: "bg-purple-500/15 border-purple-500/30 text-purple-400",
        dot: "bg-purple-500",
        label: "In Review",
      };
    case "BLOCKED":
      return {
        bg: "bg-rose-500/15 border-rose-500/30 text-rose-400",
        dot: "bg-rose-500",
        label: "Blocked",
      };
    case "DONE":
      return {
        bg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
        dot: "bg-emerald-500",
        label: "Done",
      };
    default:
      return {
        bg: "bg-gray-500/15 border-gray-500/30 text-gray-300",
        dot: "bg-gray-400",
        label: status,
      };
  }
}

export function getTypeIcon(type: string) {
  switch (type?.toUpperCase()) {
    case "BUG":
      return { label: "Bug", color: "text-red-400", symbol: "🐛" };
    case "STORY":
      return { label: "Story", color: "text-emerald-400", symbol: "📖" };
    case "FEATURE":
      return { label: "Feature", color: "text-purple-400", symbol: "✨" };
    case "IMPROVEMENT":
      return { label: "Improvement", color: "text-blue-400", symbol: "⚡" };
    case "SUBTASK":
      return { label: "Subtask", color: "text-cyan-400", symbol: "↳" };
    case "TASK":
    default:
      return { label: "Task", color: "text-amber-400", symbol: "📋" };
  }
}
