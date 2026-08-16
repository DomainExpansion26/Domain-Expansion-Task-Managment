"use client";

import React, { useState } from "react";
import { X, CheckCheck, Bell, MessageSquare, AlertTriangle, UserCheck, Sparkles, ExternalLink } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: any[];
  onMarkRead: (id?: string, markAll?: boolean) => void;
  onSelectTask: (taskKey: string) => void;
}

export function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onSelectTask,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => (filter === "UNREAD" ? !n.isRead : true));

  const getIcon = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return <UserCheck className="w-4 h-4 text-[#FF6200]" />;
      case "MENTION":
      case "COMMENT":
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case "OVERDUE":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case "AI":
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
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
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#2E2E2E] bg-[#0D0D0D]/50 text-xs">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-3 py-1 rounded-md font-medium transition-colors ${
            filter === "ALL" ? "bg-[#FF6200]/20 text-[#FF8C42] border border-[#FF6200]/30" : "text-[#888898] hover:text-white"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("UNREAD")}
          className={`px-3 py-1 rounded-md font-medium transition-colors ${
            filter === "UNREAD"
              ? "bg-[#FF6200]/20 text-[#FF8C42] border border-[#FF6200]/30"
              : "text-[#888898] hover:text-white"
          }`}
        >
          Unread ({notifications.filter((n) => !n.isRead).length})
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
              onClick={() => {
                if (!item.isRead) onMarkRead(item.id);
                if (item.link) {
                  const match = item.link.match(/tasks\/(.+)/);
                  if (match && match[1]) {
                    onSelectTask(match[1]);
                    onClose();
                  }
                }
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                item.isRead
                  ? "bg-[#1A1A1A]/40 border-[#2E2E2E] opacity-75 hover:opacity-100"
                  : "bg-[#1A1A1A] border-[#FF6200]/40 shadow-[0_0_15px_rgba(255,98,0,0.08)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-lg bg-[#252525] border border-[#2E2E2E]">{getIcon(item.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-white truncate">{item.title}</div>
                    {!item.isRead && <span className="w-2 h-2 rounded-full bg-[#FF6200] flex-shrink-0" />}
                  </div>
                  <div className="text-xs text-[#ACACB8] mt-1 leading-relaxed">{item.message}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2E2E2E]/60 text-[10px] text-[#888898]">
                    <span>{formatDateTime(item.createdAt)}</span>
                    {item.link && (
                      <span className="flex items-center gap-1 text-[#FF8C42] hover:underline">
                        <span>View Task</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
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
