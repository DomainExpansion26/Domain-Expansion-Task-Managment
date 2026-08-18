"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { HRMSView } from "@/components/views/HRMSView";
import { isHRMSActive } from "@/lib/permissions";
import { Clock, ShieldAlert, ArrowRight } from "lucide-react";

export default function HRMSDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.user) {
          const user = json.data.user;
          setCurrentUser(user);
          const active = isHRMSActive(user);
          setIsActivated(active);
        } else {
          router.push("/hrms/login");
        }
      })
      .catch(() => router.push("/hrms/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading || !currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0D0D0D] text-white text-xs">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span>Connecting to HRMS Portal...</span>
        </div>
      </div>
    );
  }

  // Requirement #6: If the user is not active in HRMS, do not show the HRMS dashboard!
  if (!isActivated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0B0C0E] relative overflow-hidden text-white">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-[#141414] border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)] text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white">HRMS Access Not Available</h1>
            <p className="text-xs text-[#888898] leading-relaxed">
              Your account (<span className="text-white font-mono">{currentUser.email}</span>) has not been activated as an employee in the HRMS system.
            </p>
            <p className="text-xs text-amber-300/90 font-medium">
              Please contact your organization administrator to activate your HRMS employee record.
            </p>
          </div>

          <div className="pt-3 border-t border-[#222] flex flex-col gap-2.5">
            <Link
              href="/dashboard"
              className="w-full py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#FF6200]/50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>Go to Main Project Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/hrms/login");
              }}
              className="text-xs text-[#888898] hover:text-white underline pt-1"
            >
              Sign out and switch accounts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      currentTab="hrms"
      onSelectTab={(tab) => {
        if (tab !== "hrms") router.push(`/dashboard?tab=${tab}`);
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
        router.push("/hrms/login");
      }}
    >
      <HRMSView currentUser={currentUser} />
    </AppShell>
  );
}
