"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Lock, UserPlus, ArrowRight } from "lucide-react";

export default function HRMSGatewayPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setCurrentUser(json.data);
          // If already logged in, redirect straight to HRMS dashboard
          router.replace("/hrms/dashboard");
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8FAFC] text-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium text-slate-600">Connecting to HRMS Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#F8FAFC] relative overflow-hidden text-slate-800">
      {/* Background Glows */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-cyan-100/60 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/25 mb-2">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            DOMAIN <span className="text-cyan-600">HRMS</span>
          </h1>
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">
            Workforce, Attendance &amp; Leave Portal
          </p>
        </div>

        {/* Portal Gateway Options */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4">
          <div className="text-center pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Workforce Management Entrance</h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Select an option to access your employee attendance and leave system.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/hrms/login"
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs tracking-wide hover:opacity-95 transition-all shadow-md shadow-cyan-600/20 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-black/15">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm">HRMS Employee Login</div>
                  <div className="text-[10px] text-white/85 font-normal">Sign in with organization email &amp; password</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/hrms/create-account"
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 hover:border-cyan-400 hover:bg-slate-50 text-slate-800 font-semibold text-xs tracking-wide transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm text-slate-900">Register Organization Identity</div>
                  <div className="text-[10px] text-slate-500">Create new organization account</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          <Link href="/login" className="hover:text-slate-900 underline">
            &larr; Return to Main Project Dashboard Login
          </Link>
        </div>
      </div>
    </div>
  );
}
