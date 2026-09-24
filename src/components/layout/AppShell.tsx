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
} from "lucide-react";
import { isSuperAdmin, isHRAdmin } from "@/lib/permissions";
import { useInactivityTimeout } from "./useInactivityTimeout";
import { InactivityWarningModal } from "@/components/modals/InactivityWarningModal";
import { getInitials, getAvatarGradient } from "@/lib/utils";
import { useAppDispatch, useUI } from "@/store/hooks";

interface AppShellProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: any;
  unreadCount: number;
  onOpenCreateTask: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenDevMailbox: () => void;
  onToggleAI?: () => void;
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
    { id: "work-packages", label: "Task Management", icon: ListTodo, hideForHR: true },
    { id: "my-work", label: "My Work", icon: CheckSquare, hideForExecs: true },
    { id: "projects", label: "Projects", icon: FolderKanban, hideForHR: true },
    { id: "backlog", label: "Backlog & Sprints", icon: Layers, requireManagerOrLead: true },
    { id: "qa", label: "QA & Defects", icon: Bug, requireQAOrLead: true },
    { id: "hrms", label: "HRMS & Attendance", icon: Clock },
    { id: "documents", label: "Documents & Vault", icon: FileText },
    { id: "team", label: "Team Directory", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
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
    <div className="flex flex-col justify-between h-full bg-white text-slate-800">
      <div>
        {/* Brand Logo & Name */}
        <div className="flex items-center justify-between px-5 py-4 sm:py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6200] to-[#FF8C42] text-white shadow-md shadow-[#FF6200]/25">
              <span className="font-extrabold text-lg tracking-tighter">DX</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-slate-900 text-base">
                DOMAIN <span className="text-[#FF6200]">EXPANSION</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                Enterprise Portal
              </div>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white font-semibold text-xs tracking-wide uppercase shadow-md shadow-[#FF6200]/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
              <kbd className="hidden sm:inline ml-auto text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">C</kbd>
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
                    ? "bg-orange-50 text-[#FF6200] border border-orange-200 shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? "text-[#FF6200]"
                        : "text-slate-400"
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
      <div className="p-3 border-t border-slate-200 bg-slate-50/80">
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 flex-shrink-0"
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                    currentUser?.name
                  )} text-xs font-bold text-white flex items-center justify-center flex-shrink-0 uppercase shadow-sm`}
                >
                  {getInitials(currentUser?.name)}
                </div>
              )}
              <div className="text-left min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate group-hover:text-[#FF6200] transition-colors">
                  {currentUser?.name || "User"}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {currentUser?.jobTitle || currentUser?.role?.replace("_", " ")}
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors flex-shrink-0" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute bottom-14 left-0 right-0 p-2 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 animate-fade-in space-y-1">
              <div className="px-3 py-2 border-b border-slate-100 text-xs">
                <div className="font-semibold text-slate-900">{currentUser?.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{currentUser?.email}</div>
                <div className="text-[10px] font-bold text-[#FF6200] mt-0.5 font-mono">
                  {currentUser?.role?.replace("_", " ")}
                </div>
              </div>

              <div className="pt-1 space-y-0.5">
                <button
                  onClick={() => {
                    handleNavClick("profile");
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#FF6200]" />
                  <span>My Profile & Settings</span>
                </button>

                <div className="border-t border-slate-100 my-1" />

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer font-medium"
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-800">
      {/* 1. Desktop Left Navigation Sidebar (Hidden on mobile) */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col justify-between border-r border-slate-200 bg-white z-20 shadow-sm">
        {renderSidebarContent()}
      </aside>

      {/* 2. Mobile Slide-Over Drawer with Backdrop */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
          />

          {/* Slide Drawer */}
          <div className="relative w-72 max-w-[85vw] h-full bg-white border-r border-slate-200 shadow-2xl z-50 flex flex-col">
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* 3. Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header Bar (Responsive) */}
        <header className="h-14 sm:h-16 flex-shrink-0 flex items-center justify-between px-3 sm:px-6 border-b border-slate-200 bg-white/95 backdrop-blur-md z-10 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand Title */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#FF6200] to-[#FF8C42] text-white text-xs font-extrabold flex items-center justify-center shadow-sm">
                DX
              </div>
              <span className="font-bold text-xs text-slate-900 tracking-tight hidden sm:inline">
                DOMAIN <span className="text-[#FF6200]">EXPANSION</span>
              </span>
            </div>

            {/* Global Search Bar Button */}
            <button
              onClick={onOpenSearch}
              className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 hover:text-slate-800 hover:border-[#FF6200]/50 transition-all w-60 lg:w-72 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">Search tasks, projects, docs...</span>
              <kbd className="ml-auto text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-500 shadow-xs">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Mobile Quick Search Button */}
            <button
              onClick={onOpenSearch}
              className="md:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4 text-slate-600" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-[#FF6200]/40 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF6200] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Create Task Button */}
            <button
              onClick={onOpenCreateTask}
              className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white text-xs font-bold shadow-md shadow-[#FF6200]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </header>

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC] p-3 sm:p-6 pb-16 sm:pb-6 min-w-0">
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
