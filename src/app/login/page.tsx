"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, AlertCircle, UserPlus, CheckCircle2, Shield, Clock, Eye, EyeOff } from "lucide-react";

import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";

function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";
  const emailParam = searchParams.get("email");
  const reasonParam = searchParams.get("reason");

  const [email, setEmail] = useState(emailParam || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Verify if user is already authenticated on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.user) {
          dispatch(
            setCredentials({
              user: json.data.user,
              token: "active-session",
              permissions: json.data.permissions || [],
            })
          );
          router.replace("/dashboard");
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => {
        setCheckingAuth(false);
      });
  }, [router, dispatch]);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
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
          portal: "MAIN",
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        dispatch(
          setCredentials({
            user: json.data.user,
            token: json.data.token,
            portal: "MAIN",
          })
        );
        window.location.href = "/dashboard";
      } else {
        setError(json.error?.message || "Invalid credentials.");
      }
    } catch (err) {
      setError("Network error logging in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="p-12 rounded-3xl bg-white border border-slate-200 flex items-center justify-center gap-3 text-xs text-slate-500 shadow-sm">
        <div className="w-5 h-5 border-2 border-[#FF6200] border-t-transparent rounded-full animate-spin" />
        <span>Checking session...</span>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-5 text-slate-800">
      {/* Registration success notice */}
      {registered && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>Account created successfully! Please sign in with your credentials.</span>
        </div>
      )}

      {/* Inactivity notice */}
      {reasonParam === "inactivity" && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <Clock className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <span>You were logged out due to inactivity. Please sign in again.</span>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">Work Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="name@domainexpansion.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#FF6200]"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-slate-700 font-semibold">Password</label>
            <Link
              href="/forgot-password?portal=MAIN"
              className="text-[11px] text-[#FF6200] hover:underline font-semibold"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#FF6200]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
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
          className="w-full py-3 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white font-bold tracking-wide transition-all shadow-md shadow-[#FF6200]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>{loading ? "Signing in..." : "Sign In to Portal"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Create Account Link */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">Don&apos;t have an account?</span>
        <Link
          href="/create-account"
          className="flex items-center gap-1 text-[#FF6200] font-bold hover:underline"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Create Account</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#F8FAFC] relative overflow-hidden text-slate-800">
      {/* Subtle Warm Background Highlights */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-orange-100/60 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6200] to-[#FF8C42] text-white shadow-md shadow-[#FF6200]/25 mb-2">
            <span className="font-extrabold text-xl">DX</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            DOMAIN <span className="text-[#FF6200]">EXPANSION</span>
          </h1>
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">
            Think Outside The Box &bull; Main Portal
          </p>
        </div>

        {/* Login Card inside Suspense */}
        <Suspense
          fallback={
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center text-xs text-slate-500 shadow-sm">
              Loading login portal...
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Portal Gateway Links */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-center space-y-2 text-slate-500 shadow-sm">
          <div className="font-semibold text-slate-700">Other Portals:</div>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/superadmin/login"
              className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Super Admin</span>
            </Link>
            <span>&bull;</span>
            <Link
              href="/hrms/login"
              className="flex items-center gap-1.5 text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>HRMS Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
