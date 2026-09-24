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
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "BUG_READY_FOR_TESTING":
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case "BUG_PASSED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "BUG_ASSIGNED":
      case "BUG_CREATED":
        return <Bug className="w-4 h-4 text-red-500" />;
      case "TASK_ASSIGNED":
        return <UserCheck className="w-4 h-4 text-[#FF6200]" />;
      case "MENTION":
      case "COMMENT":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "OVERDUE":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "AI":
        return <Sparkles className="w-4 h-4 text-indigo-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleNotificationClick = (item: any) => {
    if (!item.isRead) onMarkRead(item.id);

    // 1. Check for bug link or bugKey
    if (item.bugId && onSelectBug) {
      onSelectBug(item.bugId);
      onClose();
      return;
    }

    if (item.link) {
      const bugMatch = item.link.match(/bug=([^&]+)/);
      if (bugMatch && bugMatch[1] && onSelectBug) {
        onSelectBug(bugMatch[1]);
        onClose();
        return;
      }

      const taskMatch = item.link.match(/tasks\/([^?]+)/);
      if (taskMatch && taskMatch[1]) {
        onSelectTask(taskMatch[1]);
        onClose();
        return;
      }
    }

    // 2. Direct Task ID or Task Key
    if (item.taskId) {
      onSelectTask(item.taskId);
      onClose();
      return;
    }

    // 3. Fallback: Parse task key from title or message
    const keyMatch = (item.title + " " + item.message).match(/#?([A-Za-z0-9]+-[0-9]+)/);
    if (keyMatch && keyMatch[1]) {
      onSelectTask(keyMatch[1]);
      onClose();
      return;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-fade-in text-slate-800">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#FF6200]" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Notifications</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMarkRead(undefined, true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#FF6200] hover:underline cursor-pointer"
            title="Mark all as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-slate-50/50 text-xs overflow-x-auto">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
            filter === "ALL" ? "bg-orange-50 text-[#FF6200] border border-orange-200 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("UNREAD")}
          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
            filter === "UNREAD" ? "bg-orange-50 text-[#FF6200] border border-orange-200 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Unread ({notifications.filter((n) => !n.isRead).length})
        </button>
        <button
          onClick={() => setFilter("BUGS")}
          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
            filter === "BUGS" ? "bg-red-50 text-red-600 border border-red-200 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          QA & Bugs
        </button>
        <button
          onClick={() => setFilter("MENTIONS")}
          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
            filter === "MENTIONS" ? "bg-blue-50 text-blue-600 border border-blue-200 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Mentions
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No notifications in this category.</div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                item.isRead
                  ? "bg-slate-50/70 border-slate-200 opacity-80 hover:opacity-100"
                  : item.type === "BUG_FAILED"
                  ? "bg-red-50/60 border-red-200 shadow-sm"
                  : item.type === "BUG_READY_FOR_TESTING"
                  ? "bg-purple-50/60 border-purple-200 shadow-sm"
                  : "bg-orange-50/40 border-orange-200 shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-lg bg-white border border-slate-200 flex-shrink-0 shadow-xs">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-slate-900 truncate">{item.title}</div>
                    {!item.isRead && <span className="w-2 h-2 rounded-full bg-[#FF6200] flex-shrink-0 animate-pulse" />}
                  </div>
                  <div className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>{formatDateTime(item.createdAt)}</span>
                    <span className="flex items-center gap-1 text-[#FF6200] hover:underline font-bold">
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
