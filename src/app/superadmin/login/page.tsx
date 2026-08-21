"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, UserPlus, Eye, EyeOff } from "lucide-react";

function SuperAdminLoginForm() {
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

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.user?.role === "SUPER_ADMIN") {
          router.replace("/dashboard");
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
      setError("Please enter your Super Admin email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          portal: "SUPER_ADMIN",
        }),
      });

      const json = await res.json();
      if (json.success) {
        window.location.href = "/dashboard";
      } else {
        setError(json.error?.message || "Invalid credentials or unauthorized.");
      }
    } catch (err) {
      setError("Network error logging into Super Admin portal.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="p-12 rounded-3xl bg-[#141414] border border-[#2E2E2E] flex items-center justify-center gap-3 text-xs text-[#888898]">
        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <span>Checking Super Admin session...</span>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-3xl bg-[#141414] border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)] space-y-5">
      <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Super Admin Authentication</h2>
            <p className="text-[11px] text-[#888898]">Executive administrative control access</p>
          </div>
        </div>
      </div>

      {registered && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Super Admin account created successfully! Please authenticate below.</span>
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
          <label className="block text-[#ACACB8] font-semibold mb-1.5">Super Admin Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="admin@domainexpansion.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[#ACACB8] font-semibold">Super Admin Password</label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-red-500"
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
          className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-95 text-white font-bold tracking-wide transition-all shadow-[0_0_25px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2"
        >
          <span>{loading ? "Authenticating..." : "Authorize Super Admin Login"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="pt-3 border-t border-[#2E2E2E] flex items-center justify-between text-xs">
        <span className="text-[#888898]">Initial Super Admin setup?</span>
        <Link
          href="/superadmin/create-account"
          className="flex items-center gap-1 text-red-400 font-bold hover:underline"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Create Super Admin</span>
        </Link>
      </div>
    </div>
  );
}

export default function SuperAdminLoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0B0B0C] relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            SUPER ADMIN <span className="text-red-500">PORTAL</span>
          </h1>
          <p className="text-xs text-[#888898] font-mono tracking-widest uppercase">
            Domain Expansion &bull; Master Administrative Control
          </p>
        </div>

        <Suspense
          fallback={
            <div className="p-8 rounded-3xl bg-[#141414] border border-[#2E2E2E] text-center text-xs text-[#888898]">
              Loading Super Admin portal...
            </div>
          }
        >
          <SuperAdminLoginForm />
        </Suspense>

        <div className="text-center text-xs text-[#888898]">
          <Link href="/login" className="hover:text-white underline">
            &larr; Back to Normal Member Login
          </Link>
        </div>
      </div>
    </div>
  );
}
