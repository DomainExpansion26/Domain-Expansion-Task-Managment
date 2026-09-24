"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, UserPlus, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SuperAdminView } from "@/components/views/SuperAdminView";
import { isSuperAdmin } from "@/lib/permissions";

export default function SuperAdminGatewayPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setCurrentUser(json.data);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null))
      .finally(() => {
        setLoading(false);
        setAuthChecked(true);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8FAFC] text-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium text-slate-600">Verifying Super Admin Authorization...</span>
        </div>
      </div>
    );
  }

  // If user is authenticated as Super Admin, display the full Super Admin Dashboard
  if (currentUser && isSuperAdmin(currentUser.role)) {
    return (
      <AppShell
        currentTab="superadmin"
        onSelectTab={(tab) => {
          if (tab !== "superadmin") router.push(`/dashboard?tab=${tab}`);
        }}
        currentUser={currentUser}
        unreadCount={0}
        onOpenCreateTask={() => router.push("/dashboard?create=true")}
        onOpenSearch={() => {}}
        onOpenNotifications={() => {}}
        onOpenDevMailbox={() => {}}
        onToggleAI={() => {}}
        onLogout={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.replace("/superadmin/login");
        }}
      >
        <SuperAdminView currentUser={currentUser} />
      </AppShell>
    );
  }

  // If not authenticated as Super Admin, display the dedicated Super Admin Portal gateway interface
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#F8FAFC] relative overflow-hidden text-slate-800">
      {/* Background Glows */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-red-100/60 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/25 mb-2">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            SUPER ADMIN <span className="text-red-600">GATEWAY</span>
          </h1>
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">
            Master Administrative Control Center
          </p>
        </div>

        {/* Portal Options Card */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4">
          <div className="text-center pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Executive Authentication Portal</h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Select an action below to access the administrative control suite.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/superadmin/login"
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs tracking-wide hover:opacity-95 transition-all shadow-md shadow-red-600/20 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-black/15">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm">Super Admin Login</div>
                  <div className="text-[10px] text-white/85 font-normal">Sign in with master administrator credentials</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/superadmin/create-account"
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 hover:border-red-400 hover:bg-slate-50 text-slate-800 font-semibold text-xs tracking-wide transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-100">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm text-slate-900">Super Admin Create Account</div>
                  <div className="text-[10px] text-slate-500">Setup initial master admin account</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          <Link href="/login" className="hover:text-slate-900 underline">
            &larr; Return to Main Organization Member Login
          </Link>
        </div>
      </div>
    </div>
  );
}
