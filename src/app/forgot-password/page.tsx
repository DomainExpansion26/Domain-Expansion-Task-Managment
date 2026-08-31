"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, AlertCircle, CheckCircle2, Shield, Clock, ArrowLeft, KeyRound } from "lucide-react";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const portalParam = (searchParams.get("portal") || "MAIN").toUpperCase();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  const getLoginLink = () => {
    switch (portalParam) {
      case "SUPERADMIN":
        return { text: "Back to Super Admin Login", href: "/superadmin/login", color: "text-red-400" };
      case "HRMS":
        return { text: "Back to HRMS Login", href: "/hrms/login", color: "text-cyan-400" };
      case "HRMSSUPERADMIN":
        return { text: "Back to HRMS Super Admin Login", href: "/hrmssuperadmin/login", color: "text-purple-400" };
      default:
        return { text: "Back to Main Login", href: "/login", color: "text-[#FF8C42]" };
    }
  };

  const loginInfo = getLoginLink();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered work email.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), portal: portalParam }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccess(true);
        if (json.token) setDevToken(json.token);
      } else {
        setError(json.error?.message || "Failed to process request. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 rounded-3xl bg-[#141414] border border-[#2E2E2E] shadow-2xl space-y-5">
      {/* Header Info */}
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-[#FF6200]" />
          <span>Reset Your Password</span>
        </h2>
        <p className="text-xs text-[#888898]">
          Enter the email address associated with your account and we&apos;ll send you a password reset link.
        </p>
      </div>

      {/* Success Notification */}
      {success ? (
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>Password Reset Email Dispatched!</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              If an account with <strong className="text-white">{email}</strong> exists, you will receive an email shortly with instructions to create a new password.
            </p>
            <p className="text-[11px] text-[#888898]">
              The link is valid for 1 hour. Be sure to check your spam/junk folder if you do not see it in a few minutes.
            </p>
          </div>

          {/* Development Quick Link */}
          {devToken && (
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/40 text-xs space-y-1.5">
              <div className="font-mono font-bold text-purple-300 text-[11px]">Developer Shortcut:</div>
              <Link
                href={`/reset-password?token=${devToken}`}
                className="inline-flex items-center gap-1.5 text-purple-400 hover:underline font-bold text-xs"
              >
                <span>Click here to test Reset Password Page &rarr;</span>
              </Link>
            </div>
          )}

          <div className="pt-2 flex justify-between items-center text-xs">
            <button
              onClick={() => {
                setSuccess(false);
                setDevToken(null);
              }}
              className="text-[#888898] hover:text-white underline"
            >
              Try another email
            </button>
            <Link href={loginInfo.href} className={`font-bold hover:underline ${loginInfo.color}`}>
              {loginInfo.text}
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] hover:opacity-95 text-white font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(255,98,0,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? "Sending link..." : "Send Password Reset Link"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-3 border-t border-[#2E2E2E] flex items-center justify-between">
            <Link
              href={loginInfo.href}
              className={`flex items-center gap-1.5 font-bold hover:underline ${loginInfo.color}`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{loginInfo.text}</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0D0D0D] relative overflow-hidden">
      {/* Background Glows */}
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
            Security &amp; Account Recovery
          </p>
        </div>

        {/* Form inside Suspense */}
        <Suspense
          fallback={
            <div className="p-8 rounded-3xl bg-[#141414] border border-[#2E2E2E] text-center text-xs text-[#888898]">
              Loading recovery portal...
            </div>
          }
        >
          <ForgotPasswordForm />
        </Suspense>

        {/* Portal Gateway Links */}
        <div className="p-4 rounded-2xl bg-[#141414]/60 border border-[#222] text-xs text-center space-y-2 text-[#888898]">
          <div className="font-semibold text-white/80">Choose Portal:</div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/login" className="text-[#FF8C42] hover:underline font-medium">
              Main Member
            </Link>
            <span>&bull;</span>
            <Link href="/superadmin/login" className="text-red-400 hover:text-red-300 font-medium">
              Super Admin
            </Link>
            <span>&bull;</span>
            <Link href="/hrms/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
              HRMS Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
