"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  User,
  Calendar,
  FileText,
  DollarSign,
  Users,
  Building2,
  HelpCircle,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  ExternalLink,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import { isSuperAdmin, isHRAdmin } from "@/lib/permissions";
import { getInitials, getAvatarGradient } from "@/lib/utils";

interface HRMSShellProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: any;
  onLogout: () => void;
  children: React.ReactNode;
}

export function HRMSShell({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  children,
}: HRMSShellProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userRole = currentUser?.role || "MEMBER";
  const isHR = isHRAdmin(userRole) || isSuperAdmin(userRole);

  const hrmsNavItems = [
    { id: "overview", label: "HR Overview", icon: LayoutDashboard },
    { id: "profile", label: "My HR Profile", icon: User },
    { id: "attendance", label: "Attendance & Punch", icon: Clock },
    { id: "leaves", label: "Leave Management", icon: Calendar },
    { id: "documents", label: "HR Documents", icon: FileText },
    { id: "payroll", label: "Salary & Payslips", icon: DollarSign },
    { id: "directory", label: "Company Directory", icon: Users },
    { id: "requests", label: "HR Helpdesk", icon: HelpCircle },
    ...(isHR ? [{ id: "hradmin", label: "HR Administration", icon: Building2, hrOnly: true }] : []),
  ];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Brand Logo & Name */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-gray-900 text-base">
                DOMAIN <span className="text-cyan-500">HRMS</span>
              </div>
              <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                Workforce Portal
              </div>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Workforce Management
          </div>

          {hrmsNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-700  font-bold border border-cyan-500/30"
                    : "text-gray-700  hover:text-gray-900  hover:bg-gray-100 "
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isActive ? "text-cyan-600  scale-110" : "text-gray-500 "
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Section */}
      <div className="p-3 border-t border-gray-200 space-y-2">
        {/* Switch to Project / Task Portal Link */}
        <Link
          href="/dashboard"
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 hover:border-cyan-500 text-gray-700 hover:text-gray-900 text-xs font-semibold transition-all group"
        >
          <span className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-cyan-500" />
            <span>Task Management</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-gray-400" />
        </Link>

        {/* User Card & Logout */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50/90 border border-gray-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                currentUser?.name || "User"
              )} flex items-center justify-center text-xs font-black text-white uppercase flex-shrink-0 shadow-sm`}
            >
              {getInitials(currentUser?.name || "U")}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-gray-900 truncate">
                {currentUser?.name || "Employee"}
              </div>
              <div className="text-[10px] text-gray-500 truncate">
                {currentUser?.jobTitle || "Employee"}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:block w-64 border-r border-gray-200 bg-white flex-shrink-0 sticky top-0 h-screen z-30 shadow-sm">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <aside className="relative w-72 bg-white border-r border-gray-200 h-full z-10 shadow-2xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                HR Portal
              </span>
              <span className="text-gray-300">/</span>
              <span className="text-xs font-bold text-gray-900 capitalize">
                {currentTab.replace("-", " ")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div
                  className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                    currentUser?.name || "User"
                  )} flex items-center justify-center text-[10px] font-black text-white uppercase shadow-sm`}
                >
                  {getInitials(currentUser?.name || "U")}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-gray-200 shadow-2xl p-2 z-50 text-xs animate-fade-in space-y-1">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="font-bold text-gray-900 truncate">{currentUser?.name}</div>
                    <div className="text-[10px] text-gray-500 truncate">{currentUser?.email}</div>
                  </div>

                  <Link
                    href="/dashboard"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100"
                  >
                    <Shield className="w-4 h-4 text-cyan-500" />
                    <span>Task Management Portal</span>
                  </Link>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
