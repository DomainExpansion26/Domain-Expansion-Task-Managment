"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, AlertCircle, UserPlus, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";
  const emailParam = searchParams.get("email");

  const [email, setEmail] = useState(emailParam || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleLogin = async (overrideEmail?: string, overridePass?: string) => {
    const loginEmail = overrideEmail || email;
    const loginPass = overridePass || password;

    if (!loginEmail || !loginPass) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const json = await res.json();
      if (json.success) {
        router.push("/");
      } else {
        setError(json.error?.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Network error logging in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 rounded-3xl bg-[#141414] border border-[#2E2E2E] shadow-2xl space-y-5">
      {registered && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Account created successfully! Please sign in with your credentials.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
        className="space-y-4 text-xs"
      >
        <div>
          <label className="block text-[#ACACB8] font-semibold mb-1.5">Work Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="name@domainexpansion.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]/60"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[#ACACB8] font-semibold">Password</label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]/60"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] hover:opacity-95 text-white font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(255,98,0,0.3)] flex items-center justify-center gap-2"
        >
          <span>{loading ? "Signing in..." : "Sign In to Portal"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Direct Sign Up Link */}
      <div className="pt-3 border-t border-[#2E2E2E] flex items-center justify-between text-xs">
        <span className="text-[#888898]">Don&apos;t have an account?</span>
        <Link
          href="/signup"
          className="flex items-center gap-1 text-[#FF8C42] font-bold hover:underline"
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
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0D0D0D] relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-[#FF6200]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-[#6D28D9]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6200] to-[#FF8C42] text-white shadow-[0_0_25px_rgba(255,98,0,0.4)] mb-2">
            <span className="font-extrabold text-xl">DX</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            DOMAIN <span className="text-[#FF6200]">EXPANSION</span>
          </h1>
          <p className="text-xs text-[#888898] font-mono tracking-widest uppercase">
            Think Outside The Box &bull; Task Platform
          </p>
        </div>

        {/* Login Card inside Suspense */}
        <Suspense
          fallback={
            <div className="p-8 rounded-3xl bg-[#141414] border border-[#2E2E2E] text-center text-xs text-[#888898]">
              Loading login portal...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
