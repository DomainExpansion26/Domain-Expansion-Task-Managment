"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Columns3,
  ListTodo,
  Layers,
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
  Clock,
  Bug,
  Building2,
  FileText,
  Menu,
  X,
  User,
  Sun,
  Moon,
} from "lucide-react";
import { isSuperAdmin, isHRAdmin } from "@/lib/permissions";
import { useInactivityTimeout } from "./useInactivityTimeout";
import { InactivityWarningModal } from "@/components/modals/InactivityWarningModal";
import { getInitials, getAvatarGradient } from "@/lib/utils";
import { useAppDispatch, useUI } from "@/store/hooks";
import { toggleTheme } from "@/store/slices/uiSlice";

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
  children,
}: AppShellProps) {
  const dispatch = useAppDispatch();
  const uiState = useUI();
  const isDark = (uiState?.theme || "dark") === "dark";

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Inactivity timeout: 5 minutes default with 30-second advance warning
  const { showWarning, secondsRemaining, resetActivity, handleExpireLogout } = useInactivityTimeout({
    timeoutMs: 5 * 60 * 1000,
    warningMs: 30 * 1000,
    enabled: !!currentUser,
    onLogout,
  });

  // Global keyboard shortcuts: Ctrl+K for search, 'C' for create task
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

  const userRole = currentUser?.role || "MEMBER";
  const isSuper = isSuperAdmin(userRole);
  const isHR = isHRAdmin(userRole);
  const isManagerOrLead = userRole === "MANAGER" || userRole === "PROJECT_MANAGER" || userRole === "TEAM_LEAD" || isSuper;
  const isQAUser = userRole === "QA" || isManagerOrLead;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "work-packages", label: "Work Packages", icon: ListTodo, hideForHR: true },
    { id: "my-work", label: "My Work", icon: CheckSquare, hideForExecs: true },
    { id: "projects", label: "Projects", icon: FolderKanban, hideForHR: true },
    { id: "kanban", label: "Kanban Board", icon: Columns3, hideForHR: true },
    { id: "backlog", label: "Backlog & Sprints", icon: Layers, requireManagerOrLead: true },
    { id: "qa", label: "QA & Defects", icon: Bug, requireQAOrLead: true },
    { id: "hrms", label: "HRMS & Attendance", icon: Clock },
    { id: "documents", label: "Documents & Vault", icon: FileText },
    { id: "team", label: "Team Directory", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { id: "ai", label: "DX AI Copilot", icon: Sparkles, highlight: true },
    { id: "hradmin", label: "HR Admin", icon: Building2, hrOnly: true },
    { id: "superadmin", label: "Super Admin", icon: Shield, superAdminOnly: true },
    { id: "admin", label: "Settings", icon: Settings, superAdminOnly: true },
  ];

  const handleNavClick = (tabId: string) => {
    if (tabId === "hrms") {
      window.location.href = "/hrms/dashboard";
      return;
    }
    if (tabId === "hradmin") {
      window.location.href = "/hrms/dashboard?tab=hradmin";
      return;
    }
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Brand Logo & Name */}
        <div className="flex items-center justify-between px-5 py-4 sm:py-5 border-b border-[#2E2E2E]">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6200] to-[#FF8C42] text-white shadow-[0_0_20px_rgba(255,98,0,0.35)]">
              <span className="font-extrabold text-lg tracking-tighter">DX</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-base">
                DOMAIN <span className="text-[#FF6200]">EXPANSION</span>
              </div>
              <div className="text-[10px] text-[#888898] font-mono uppercase tracking-wider">
                Enterprise Portal
              </div>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-[#888898] hover:text-white hover:bg-[#252525]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Create Task Action (Hidden for pure HR Admin) */}
        {(!isHR || isSuper) && (
          <div className="px-4 py-3">
            <button
              onClick={() => {
                onOpenCreateTask();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] text-white font-semibold text-xs tracking-wide uppercase hover:opacity-95 shadow-[0_0_15px_rgba(255,98,0,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
              <kbd className="hidden sm:inline ml-auto text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-mono">C</kbd>
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="px-3 py-2 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || (item.id === "dashboard" && (!currentTab || currentTab === "overview"));

            if (item.superAdminOnly && !isSuper) return null;
            if (item.hrOnly && !(isHR || isSuper)) return null;
            if (item.hideForHR && isHR && !isSuper) return null;
            if (item.hideForExecs && (isSuper || isHR)) return null;
            if (item.requireManagerOrLead && !isManagerOrLead) return null;
            if (item.requireQAOrLead && !isQAUser) return null;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#FF6200]/15 text-[#FF8C42] border border-[#FF6200]/30 shadow-[0_0_15px_rgba(255,98,0,0.1)] font-bold"
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
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-[#2E2E2E] bg-[#101010]/80">
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#1C1C1C] transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-[#2E2E2E] flex-shrink-0"
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                    currentUser?.name
                  )} text-xs font-bold text-white flex items-center justify-center flex-shrink-0 uppercase shadow-md`}
                >
                  {getInitials(currentUser?.name)}
                </div>
              )}
              <div className="text-left min-w-0">
                <div className="text-xs font-semibold text-white truncate group-hover:text-[#FF8C42] transition-colors">
                  {currentUser?.name || "User"}
                </div>
                <div className="text-[10px] text-[#888898] truncate">
                  {currentUser?.jobTitle || currentUser?.role?.replace("_", " ")}
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#888898] group-hover:text-white transition-colors flex-shrink-0" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute bottom-14 left-0 right-0 p-2 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] shadow-2xl z-50 animate-fade-in space-y-1">
              <div className="px-3 py-2 border-b border-[#2E2E2E]/60 text-xs">
                <div className="font-semibold text-white">{currentUser?.name}</div>
                <div className="text-[11px] text-[#888898] truncate">{currentUser?.email}</div>
                <div className="text-[10px] font-bold text-[#FF8C42] mt-0.5 font-mono">
                  {currentUser?.role?.replace("_", " ")}
                </div>
              </div>

              <div className="pt-1 space-y-0.5">
                <button
                  onClick={() => {
                    handleNavClick("profile");
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#ACACB8] hover:text-white hover:bg-[#252525] transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#FF6200]" />
                  <span>My Profile & Settings</span>
                </button>

                <button
                  onClick={() => {
                    dispatch(toggleTheme());
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#ACACB8] hover:text-white hover:bg-[#252525] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>Theme</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#FF8C42]">
                    {isDark ? "Dark" : "Light"}
                  </span>
                </button>

                <div className="border-t border-[#2E2E2E]/60 my-1" />

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0D0D0D] text-[#F3F4F6]">
      {/* 1. Desktop Left Navigation Sidebar (Hidden on mobile) */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col justify-between border-r border-[#2E2E2E] bg-[#141414]/90 backdrop-blur-xl z-20">
        {renderSidebarContent()}
      </aside>

      {/* 2. Mobile Slide-Over Drawer with Backdrop */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
          />

          {/* Slide Drawer */}
          <div className="relative w-72 max-w-[85vw] h-full bg-[#141414] border-r border-[#2E2E2E] shadow-2xl z-50 flex flex-col">
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* 3. Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header Bar (Responsive) */}
        <header className="h-14 sm:h-16 flex-shrink-0 flex items-center justify-between px-3 sm:px-6 border-b border-[#2E2E2E] bg-[#141414]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-[#888898] hover:text-white hover:border-[#FF6200]/40 transition-colors"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>

            {/* Mobile Brand Title */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#FF6200] to-[#FF8C42] text-white text-xs font-extrabold flex items-center justify-center shadow-sm">
                DX
              </div>
              <span className="font-bold text-xs text-white tracking-tight hidden sm:inline">
                DOMAIN <span className="text-[#FF6200]">EXPANSION</span>
              </span>
            </div>

            {/* Global Search Bar Button */}
            <button
              onClick={onOpenSearch}
              className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-xs text-[#888898] hover:text-white hover:border-[#FF6200]/50 transition-all w-60 lg:w-72 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#888898]" />
              <span className="truncate">Search tasks, projects, docs...</span>
              <kbd className="ml-auto text-[10px] bg-[#2E2E2E] px-1.5 py-0.5 rounded font-mono text-slate-400">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Mobile Quick Search Button */}
            <button
              onClick={onOpenSearch}
              className="md:hidden p-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-[#888898] hover:text-white transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4 text-white" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-[#888898] hover:text-white hover:border-[#FF6200]/40 transition-colors cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            {/* DX AI Assistant Trigger Button */}
            <button
              onClick={onToggleAI}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="hidden sm:inline">Ask DX AI</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-[#888898] hover:text-white hover:border-[#FF6200]/40 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF6200] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Create Task Button */}
            <button
              onClick={onOpenCreateTask}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] text-white text-xs font-bold hover:opacity-95 shadow-md shadow-[#FF6200]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </header>

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0D0D0D] p-3 sm:p-6 pb-16 sm:pb-6 min-w-0">
          {children}
        </main>
      </div>

      {/* Inactivity Warning Modal */}
      <InactivityWarningModal
        isOpen={showWarning}
        secondsRemaining={secondsRemaining}
        onStayLoggedIn={resetActivity}
        onLogoutNow={handleExpireLogout}
      />
    </div>
  );
}
