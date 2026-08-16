"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Columns3,
  ListTodo,
  Users,
  Bell,
  Sparkles,
  Settings,
  Mail,
  Plus,
  Search,
  LogOut,
  ChevronDown,
  Shield,
  Layers,
  Zap,
} from "lucide-react";

interface AppShellProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: any;
  unreadCount: number;
  onOpenCreateTask: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenDevMailbox: () => void;
  onToggleAI: () => void;
  onLogout: () => void;
  onSwitchUser?: (email: string) => void;
  children: React.ReactNode;
}

export function AppShell({
  currentTab,
  onSelectTab,
  currentUser,
  unreadCount,
  onOpenCreateTask,
  onOpenSearch,
  onOpenNotifications,
  onOpenDevMailbox,
  onToggleAI,
  onLogout,
  onSwitchUser,
  children,
}: AppShellProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  // Global keyboard shortcuts: Ctrl+K / Cmd+K for search, 'C' for create task
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onOpenSearch();
      }
      if (
        e.key === "c" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        onOpenCreateTask();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenSearch, onOpenCreateTask]);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "my-work", label: "My Work", icon: CheckSquare },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "kanban", label: "Kanban Board", icon: Columns3 },
    { id: "backlog", label: "Backlog & Sprints", icon: ListTodo },
    { id: "team", label: "Team Directory", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { id: "ai", label: "DX AI Copilot", icon: Sparkles, highlight: true },
    { id: "admin", label: "Admin & Settings", icon: Settings, adminOnly: true },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0D0D0D] text-[#F3F4F6]">
      {/* 1. Left Navigation Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col justify-between border-r border-[#2E2E2E] bg-[#141414]/90 backdrop-blur-xl z-20">
        <div>
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-[#2E2E2E]">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6200] to-[#FF8C42] text-white shadow-[0_0_20px_rgba(255,98,0,0.35)]">
              <span className="font-extrabold text-lg tracking-tighter">DX</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-base">
                DOMAIN <span className="text-[#FF6200]">EXPANSION</span>
              </div>
              <div className="text-[10px] text-[#888898] font-mono uppercase tracking-wider">
                Task Management
              </div>
            </div>
          </div>

          {/* Quick Create Task Action */}
          <div className="px-4 py-3">
            <button
              onClick={onOpenCreateTask}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#FF6200] to-[#FF8C42] text-white font-semibold text-xs tracking-wide uppercase hover:opacity-95 shadow-[0_0_15px_rgba(255,98,0,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
              <kbd className="ml-auto text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-mono">C</kbd>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              if (item.adminOnly && currentUser?.role !== "SUPER_ADMIN" && currentUser?.role !== "PROJECT_MANAGER") {
                return null;
              }

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#FF6200]/15 text-[#FF8C42] border border-[#FF6200]/30 shadow-[0_0_15px_rgba(255,98,0,0.1)]"
                      : "text-[#ACACB8] hover:text-white hover:bg-[#1A1A1A]"
                  } ${item.highlight ? "text-[#C084FC] hover:text-[#D8B4FE]" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? "text-[#FF6200]"
                          : item.highlight
                          ? "text-[#A855F7]"
                          : "text-[#888898]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#FF6200] text-white">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && !item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      AI
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Workspace Tools */}
        <div className="p-3 border-t border-[#2E2E2E] space-y-2">
          <button
            onClick={onOpenDevMailbox}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#888898] hover:text-white hover:bg-[#1A1A1A] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#FF8C42]" />
              <span>Dev Mailbox Logs</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2E2E2E] text-slate-300">
              Live HTML
            </span>
          </button>

          {/* User Profile Mini Bar */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#FF6200]/40 transition-colors"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={
                    currentUser?.avatarUrl ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  }
                  alt={currentUser?.name}
                  className="w-7 h-7 rounded-full object-cover border border-[#FF6200]/40 flex-shrink-0"
                />
                <div className="text-left truncate">
                  <div className="text-xs font-semibold text-white truncate">{currentUser?.name || "User"}</div>
                  <div className="text-[10px] text-[#888898] truncate">{currentUser?.role?.replace("_", " ")}</div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#888898]" />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute bottom-14 left-0 right-0 p-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] shadow-2xl z-50 animate-fade-in space-y-1">
                <div className="px-3 py-2 border-b border-[#2E2E2E]/60 text-xs">
                  <div className="font-semibold text-white">{currentUser?.name}</div>
                  <div className="text-[11px] text-[#888898] truncate">{currentUser?.email}</div>
                </div>

                {onSwitchUser && (
                  <div className="px-2 py-1 text-[10px] text-[#888898] uppercase font-mono">Quick Switch Role:</div>
                )}
                {onSwitchUser && (
                  <>
                    <button
                      onClick={() => {
                        onSwitchUser("admin@domainexpansion.in");
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded text-xs text-slate-300 hover:bg-[#252525] flex items-center justify-between"
                    >
                      <span>Ishwar (Super Admin)</span>
                      <Shield className="w-3 h-3 text-[#FF6200]" />
                    </button>
                    <button
                      onClick={() => {
                        onSwitchUser("rahul@domainexpansion.in");
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded text-xs text-slate-300 hover:bg-[#252525] flex items-center justify-between"
                    >
                      <span>Rahul (Project Manager)</span>
                      <Layers className="w-3 h-3 text-purple-400" />
                    </button>
                    <button
                      onClick={() => {
                        onSwitchUser("amit@domainexpansion.in");
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded text-xs text-slate-300 hover:bg-[#252525] flex items-center justify-between"
                    >
                      <span>Amit (Team Member)</span>
                      <Zap className="w-3 h-3 text-emerald-400" />
                    </button>
                  </>
                )}

                <div className="border-t border-[#2E2E2E]/60 pt-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-[#2E2E2E] bg-[#141414]/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            {/* Global Search Bar Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E] text-xs text-[#888898] hover:text-white hover:border-[#FF6200]/50 transition-all w-72"
            >
              <Search className="w-3.5 h-3.5 text-[#888898]" />
              <span>Search tasks, projects, people...</span>
              <kbd className="ml-auto text-[10px] bg-[#2E2E2E] px-1.5 py-0.5 rounded font-mono text-slate-400">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* DX AI Assistant Trigger Button */}
            <button
              onClick={onToggleAI}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>Ask DX AI</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E] text-[#888898] hover:text-white hover:border-[#FF6200]/40 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF6200] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Create Task Button */}
            <button
              onClick={onOpenCreateTask}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6200] text-white text-xs font-bold hover:bg-[#FF8C42] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
          </div>
        </header>

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0D0D0D] p-6">{children}</main>
      </div>
    </div>
  );
}
