"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Clock, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, ShieldAlert, UserPlus, Eye, EyeOff } from "lucide-react";

function HRMSLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";
  const emailParam = searchParams.get("email");

  const [email, setEmail] = useState(emailParam || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notActivated, setNotActivated] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.user) {
          if (json.data.user.isHRMSActive) {
            router.replace("/hrms/dashboard");
          } else {
            setCheckingAuth(false);
          }
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => {
        setCheckingAuth(false);
      });
  }, [router]);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your work email and password.");
      return;
    }

    setLoading(true);
    setError(null);
    setNotActivated(false);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          portal: "HRMS",
        }),
      });

      const json = await res.json();
      if (json.success) {
        // Active employee authenticated -> enter HRMS dashboard
        router.replace("/hrms/dashboard");
      } else {
        if (json.error?.code === "HRMS_NOT_ACTIVATED") {
          setNotActivated(true);
        } else {
          setError(json.error?.message || "Invalid credentials.");
        }
      }
    } catch (err) {
      setError("Network error connecting to HRMS.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="p-12 rounded-3xl bg-[#141414] border border-[#2E2E2E] flex items-center justify-center gap-3 text-xs text-[#888898]">
        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span>Checking HRMS session...</span>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-3xl bg-[#141414] border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.12)] space-y-5">
      <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">HRMS Employee Authentication</h2>
            <p className="text-[11px] text-[#888898]">Workforce, attendance & leave portal</p>
          </div>
        </div>
      </div>

      {registered && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Account created! Sign in below. Note: HRMS access requires employee activation.</span>
        </div>
      )}

      {/* HRMS Unactivated state (Requirement #6) */}
      {notActivated && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>HRMS Access Not Available</span>
          </div>
          <p className="text-[11px] text-amber-300/90 leading-relaxed">
            Your organization account has not yet been activated as an employee in HRMS. Please contact your administrator to activate your HRMS employee record.
          </p>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4 text-xs">
        <div>
          <label className="block text-[#ACACB8] font-semibold mb-1.5">Organization Work Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="employee@domainexpansion.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[#ACACB8] font-semibold mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#888898] hover:text-white transition-colors focus:outline-none cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-95 text-white font-bold tracking-wide transition-all shadow-[0_0_25px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
        >
          <span>{loading ? "Verifying Employee Access..." : "Sign In to HRMS"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="pt-3 border-t border-[#2E2E2E] flex items-center justify-between text-xs">
        <span className="text-[#888898]">Don&apos;t have an identity yet?</span>
        <Link href="/hrms/create-account" className="text-cyan-400 font-bold hover:underline flex items-center gap-1">
          <UserPlus className="w-3.5 h-3.5" />
          <span>Register Account</span>
        </Link>
      </div>
    </div>
  );
}

export default function HRMSLoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0B0C0E] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] mb-2">
            <Clock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            HRMS <span className="text-cyan-400">PORTAL</span>
          </h1>
          <p className="text-xs text-[#888898] font-mono tracking-widest uppercase">
            Domain Expansion &bull; Employee & Attendance Suite
          </p>
        </div>

        <Suspense
          fallback={
            <div className="p-8 rounded-3xl bg-[#141414] border border-[#2E2E2E] text-center text-xs text-[#888898]">
              Loading HRMS portal...
            </div>
          }
        >
          <HRMSLoginForm />
        </Suspense>

        <div className="p-4 rounded-2xl bg-[#141414]/60 border border-[#222] text-xs text-center space-y-2 text-[#888898]">
          <div className="font-semibold text-white/80">Other Portals:</div>
          <div className="flex items-center justify-center gap-4">
            <Link href="/login" className="hover:text-white underline">
              Main Dashboard
            </Link>
            <span>&bull;</span>
            <Link href="/hrmssuperadmin/login" className="text-pink-400 hover:text-pink-300 underline font-medium">
              HRMS Super Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
