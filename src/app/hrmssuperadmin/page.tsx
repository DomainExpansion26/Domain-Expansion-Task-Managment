"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { HRAdminView } from "@/components/views/HRAdminView";
import { isHRAdmin } from "@/lib/permissions";
import { Building2, Lock, UserPlus, ArrowRight } from "lucide-react";

export default function HRMSSuperAdminGatewayPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && isHRAdmin(json.data.user?.role)) {
          setCurrentUser(json.data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0B0B0C] text-white text-xs">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying HRMS Super Admin Authorization...</span>
        </div>
      </div>
    );
  }

  // If user is authenticated as HR Super Admin or Super Admin, render the HR Administrative Dashboard
  if (currentUser && isHRAdmin(currentUser.role)) {
    return (
      <AppShell
        currentTab="hradmin"
        onSelectTab={(tab) => {
          if (tab !== "hradmin") router.push(`/dashboard?tab=${tab}`);
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
          router.push("/hrmssuperadmin/login");
        }}
      >
        <HRAdminView currentUser={currentUser} />
      </AppShell>
    );
  }

  // Otherwise, render dedicated HRMS Super Admin Gateway
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0B0B0C] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-600 text-white shadow-[0_0_30px_rgba(236,72,153,0.4)] mb-2">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            HRMS <span className="text-pink-500">SUPER ADMIN</span>
          </h1>
          <p className="text-xs text-[#888898] font-mono tracking-widest uppercase">
            Administrative Control Center Gateway
          </p>
        </div>

        {/* Portal Options Card */}
        <div className="p-8 rounded-3xl bg-[#141414] border border-pink-500/30 shadow-[0_0_40px_rgba(236,72,153,0.15)] space-y-4">
          <div className="text-center pb-2 border-b border-[#222]">
            <h2 className="text-sm font-bold text-white">HRMS Administration Gateway</h2>
            <p className="text-[11px] text-[#888898] mt-1">
              Select an option below to manage workforce, attendance, and leaves.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/hrmssuperadmin/login"
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-xs tracking-wide hover:opacity-95 transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-black/20">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm">HRMS Super Admin Login</div>
                  <div className="text-[10px] text-white/80 font-normal">Sign in with HR administrative account</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/hrmssuperadmin/create-account"
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] hover:border-pink-500/50 text-white font-semibold text-xs tracking-wide transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm text-white">Setup HRMS Super Admin</div>
                  <div className="text-[10px] text-[#888898]">Initial HR admin configuration</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#888898] group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>

        <div className="text-center text-xs text-[#888898]">
          <Link href="/hrms/login" className="hover:text-white underline">
            &larr; Switch to HRMS Employee Login
          </Link>
        </div>
      </div>
    </div>
  );
}
