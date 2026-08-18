"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Lock, UserPlus, ArrowRight, ShieldCheck, ShieldAlert } from "lucide-react";
import { isHRMSActive } from "@/lib/permissions";

export default function HRMSGatewayPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.user) {
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
      <div className="h-screen w-screen flex items-center justify-center bg-[#0B0C0E] text-white text-xs">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span>Connecting to HRMS Portal...</span>
        </div>
      </div>
    );
  }

  // If user is already authenticated:
  if (currentUser) {
    if (isHRMSActive(currentUser)) {
      router.push("/hrms/dashboard");
      return null;
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0B0C0E] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] mb-2">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            HRMS <span className="text-cyan-400">PORTAL</span>
          </h1>
          <p className="text-xs text-[#888898] font-mono tracking-widest uppercase">
            Domain Expansion &bull; Employee & Attendance Gateway
          </p>
        </div>

        {/* Portal Gateway Options */}
        <div className="p-8 rounded-3xl bg-[#141414] border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.12)] space-y-4">
          <div className="text-center pb-2 border-b border-[#222]">
            <h2 className="text-sm font-bold text-white">Workforce Management Entrance</h2>
            <p className="text-[11px] text-[#888898] mt-1">
              Select an option to access your employee attendance and leave system.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/hrms/login"
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs tracking-wide hover:opacity-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-black/20">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm">HRMS Employee Login</div>
                  <div className="text-[10px] text-white/80 font-normal">Sign in with organization email & password</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/hrms/create-account"
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] hover:border-cyan-500/50 text-white font-semibold text-xs tracking-wide transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm text-white">Register Organization Identity</div>
                  <div className="text-[10px] text-[#888898]">Create new organization account</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#888898] group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>

        <div className="text-center text-xs text-[#888898]">
          <Link href="/login" className="hover:text-white underline">
            &larr; Return to Main Project Dashboard Login
          </Link>
        </div>
      </div>
    </div>
  );
}
