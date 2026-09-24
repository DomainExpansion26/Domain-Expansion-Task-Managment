"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  KeyRound,
  ArrowLeft,
} from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token");
  const portalParam = searchParams.get("portal") || "MAIN";

  const [activeToken, setActiveToken] = useState<string | null>(urlToken || null);
  const [emailInput, setEmailInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [isManualTokenMode, setIsManualTokenMode] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (urlToken) {
      setActiveToken(urlToken);
    }
  }, [urlToken]);

  const getPortalLogin = () => {
    switch (portalParam.toUpperCase()) {
      case "SUPERADMIN":
        return { href: "/superadmin/login", text: "Back to Super Admin Login", color: "text-red-600" };
      case "HRMS":
        return { href: "/hrms/login", text: "Back to HRMS Login", color: "text-cyan-600" };
      default:
        return { href: "/login", text: "Back to Member Login", color: "text-[#FF6200]" };
    }
  };

  const loginInfo = getPortalLogin();

  // If no token in URL, allow user to generate token by email
  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError("Please provide your registered account email.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim(), portal: portalParam }),
      });

      const json = await res.json();
      if (json.success && (json.token || json.devToken)) {
        setActiveToken(json.token || json.devToken);
      } else {
        setError(json.error?.message || "Could not find an active account with that email.");
      }
    } catch {
      setError("Network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError("Please paste your security reset token.");
      return;
    }
    setError(null);
    setActiveToken(tokenInput.trim());
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeToken) {
      setError("Missing authorization token. Please request a new link.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: activeToken, newPassword }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccess(true);
      } else {
        setError(json.error?.message || "Failed to reset password. The link or token may have expired.");
      }
    } catch {
      setError("Network error while connecting to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS STATE
  if (success) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-emerald-200 text-center space-y-4 shadow-xl animate-fade-in text-slate-800">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Password Reset Successfully!</h2>
        <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
          Your new credentials have been updated and verified. You can now log into your account using your updated password.
        </p>
        <div className="pt-3">
          <Link
            href={loginInfo.href}
            className="w-full py-3 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white text-xs font-bold tracking-wide transition-all shadow-md shadow-[#FF6200]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{loginInfo.text}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // NO TOKEN STATE: User navigated to /reset-password directly
  if (!activeToken) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-5 text-slate-800 animate-fade-in">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#FF6200]" />
            <span>Account Password Reset</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter your account email to verify authorization and set a new password.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isManualTokenMode ? (
          <form onSubmit={handleRequestToken} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Registered Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@domainexpansion.in"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white font-bold tracking-wide transition-all shadow-md shadow-[#FF6200]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? "Verifying Account..." : "Continue to Password Setup"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setIsManualTokenMode(true);
                }}
                className="hover:text-slate-800 underline cursor-pointer"
              >
                Paste security token manually
              </button>
              <Link href={loginInfo.href} className={`font-bold hover:underline ${loginInfo.color}`}>
                {loginInfo.text}
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleManualTokenSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Reset Security Token</label>
              <textarea
                rows={3}
                required
                placeholder="Paste the reset token here..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder:text-slate-400 font-mono text-[11px] focus:bg-white focus:outline-none focus:border-[#FF6200]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white font-bold tracking-wide transition-all shadow-md shadow-[#FF6200]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Validate Token &amp; Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setIsManualTokenMode(false);
                }}
                className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                &larr; Back to Email Entry
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // ACTIVE TOKEN STATE: User has token, enter new password
  return (
    <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-5 text-slate-800 animate-fade-in">
      <div className="space-y-1 border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Create New Password</span>
        </h2>
        <p className="text-xs text-slate-500">
          Enter and confirm your new secure password (minimum 6 characters).
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">New Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Enter new password (min. 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#FF6200]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">Confirm New Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#FF6200]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white font-bold tracking-wide transition-all shadow-md shadow-[#FF6200]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving New Password...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Update Password &amp; Finish</span>
            </>
          )}
        </button>

        <div className="pt-2 flex justify-between items-center text-xs border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setActiveToken(null);
              setError(null);
            }}
            className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            Change Account / Email
          </button>
          <Link href={loginInfo.href} className={`font-bold hover:underline ${loginInfo.color}`}>
            Cancel &amp; Login
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#F8FAFC] relative overflow-hidden text-slate-800">
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-orange-100/60 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6200] to-[#FF8C42] text-white shadow-md shadow-[#FF6200]/25 mb-2">
            <span className="font-extrabold text-xl">DX</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            DOMAIN <span className="text-[#FF6200]">EXPANSION</span>
          </h1>
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">
            New Password Setup
          </p>
        </div>

        <Suspense
          fallback={
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center text-xs text-slate-500 shadow-sm">
              Loading reset portal...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
