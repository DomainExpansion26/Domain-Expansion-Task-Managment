"use client";

import React, { useState } from "react";
import {
  X,
  CheckCheck,
  Bell,
  MessageSquare,
  AlertTriangle,
  UserCheck,
  Sparkles,
  ExternalLink,
  Bug,
  CheckCircle2,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: any[];
  onMarkRead: (id?: string, markAll?: boolean) => void;
  onSelectTask: (taskKey: string) => void;
  onSelectBug?: (bugKey: string) => void;
}

export function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onSelectTask,
  onSelectBug,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "BUGS" | "MENTIONS">("ALL");

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.isRead;
    if (filter === "BUGS") return n.type?.startsWith("BUG") || n.bugId || n.title?.includes("BUG-");
    if (filter === "MENTIONS") return n.type === "MENTION";
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "BUG_FAILED":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "BUG_READY_FOR_TESTING":
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case "BUG_PASSED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "BUG_ASSIGNED":
      case "BUG_CREATED":
        return <Bug className="w-4 h-4 text-red-400" />;
      case "TASK_ASSIGNED":
        return <UserCheck className="w-4 h-4 text-[#FF6200]" />;
      case "MENTION":
      case "COMMENT":
        return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      case "OVERDUE":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case "AI":
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  const handleNotificationClick = (item: any) => {
    if (!item.isRead) onMarkRead(item.id);

    // Check for bug link or bugKey in title/link
    if (item.bugId && onSelectBug) {
      onSelectBug(item.bugId);
      onClose();
      return;
    }

    if (item.link) {
      // E.g. /tasks/PROJ-124?bug=BUG-058
      const bugMatch = item.link.match(/bug=([^&]+)/);
      if (bugMatch && bugMatch[1] && onSelectBug) {
        onSelectBug(bugMatch[1]);
        onClose();
        return;
      }

      // E.g. /tasks/PROJ-124
      const taskMatch = item.link.match(/tasks\/([^?]+)/);
      if (taskMatch && taskMatch[1]) {
        onSelectTask(taskMatch[1]);
        onClose();
        return;
      }
    }

    if (item.taskId) {
      onSelectTask(item.taskId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#141414] border-l border-[#2E2E2E] shadow-2xl flex flex-col animate-fade-in">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E2E2E]">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#FF6200]" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Notifications</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMarkRead(undefined, true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#FF8C42] hover:underline"
            title="Mark all as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#1A1A1A] text-[#888898] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#2E2E2E] bg-[#0D0D0D]/50 text-xs overflow-x-auto">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-3 py-1 rounded-lg font-medium transition-colors ${
            filter === "ALL" ? "bg-[#FF6200]/20 text-[#FF8C42] border border-[#FF6200]/30 font-bold" : "text-[#888898] hover:text-white"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("UNREAD")}
          className={`px-3 py-1 rounded-lg font-medium transition-colors ${
            filter === "UNREAD" ? "bg-[#FF6200]/20 text-[#FF8C42] border border-[#FF6200]/30 font-bold" : "text-[#888898] hover:text-white"
          }`}
        >
          Unread ({notifications.filter((n) => !n.isRead).length})
        </button>
        <button
          onClick={() => setFilter("BUGS")}
          className={`px-3 py-1 rounded-lg font-medium transition-colors ${
            filter === "BUGS" ? "bg-red-500/20 text-red-400 border border-red-500/30 font-bold" : "text-[#888898] hover:text-white"
          }`}
        >
          QA & Bugs
        </button>
        <button
          onClick={() => setFilter("MENTIONS")}
          className={`px-3 py-1 rounded-lg font-medium transition-colors ${
            filter === "MENTIONS" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold" : "text-[#888898] hover:text-white"
          }`}
        >
          Mentions
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#888898]">No notifications in this category.</div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                item.isRead
                  ? "bg-[#1A1A1A]/40 border-[#2E2E2E] opacity-75 hover:opacity-100"
                  : item.type === "BUG_FAILED"
                  ? "bg-red-950/25 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                  : item.type === "BUG_READY_FOR_TESTING"
                  ? "bg-purple-950/25 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                  : "bg-[#1A1A1A] border-[#FF6200]/40 shadow-[0_0_15px_rgba(255,98,0,0.08)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-lg bg-[#252525] border border-[#2E2E2E] flex-shrink-0">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-white truncate">{item.title}</div>
                    {!item.isRead && <span className="w-2 h-2 rounded-full bg-[#FF6200] flex-shrink-0 animate-pulse" />}
                  </div>
                  <div className="text-xs text-[#ACACB8] mt-1 leading-relaxed">{item.message}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2E2E2E]/60 text-[10px] text-[#888898]">
                    <span>{formatDateTime(item.createdAt)}</span>
                    <span className="flex items-center gap-1 text-[#FF8C42] hover:underline font-bold">
                      <span>Open Item</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
