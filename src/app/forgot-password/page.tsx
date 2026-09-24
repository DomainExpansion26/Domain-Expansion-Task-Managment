"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const portalParam = searchParams.get("portal") || "MAIN"; // MAIN, SUPERADMIN, HRMS

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // In-line reset form states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [passwordResetDone, setPasswordResetDone] = useState(false);

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

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please provide your registered account email.");
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
        const token = json.token || json.devToken || null;
        setResetToken(token);
        if (token) {
          setResetUrl(`/reset-password?token=${token}&portal=${portalParam}`);
        }
      } else {
        setError(json.error?.message || "Failed to process password reset request.");
      }
    } catch {
      setError("Network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInlineReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      setResetError("Reset token is missing. Please request a new link.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setResetError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    setResetError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });

      const json = await res.json();
      if (json.success) {
        setPasswordResetDone(true);
      } else {
        setResetError(json.error?.message || "Failed to update password. Token may have expired.");
      }
    } catch {
      setResetError("Network error while resetting password. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!resetUrl) return;
    const fullUrl = `${window.location.origin}${resetUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // If password was reset successfully
  if (passwordResetDone) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-emerald-200 shadow-xl space-y-5 text-slate-800 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Password Reset Successfully!</h2>
          <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
            Your new password has been securely updated for <strong className="text-slate-900">{email}</strong>. You can now log into your account.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href={loginInfo.href}
            className="w-full py-3 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-[#FF6200]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-5 text-slate-800">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#FF6200]" />
          <span>Reset Your Password</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter your registered work email to verify and update your account password.
        </p>
      </div>

      {success ? (
        <div className="space-y-4 pt-1 animate-fade-in">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-700">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>Password Reset Ready for {email}</span>
            </div>
            <p className="leading-relaxed text-slate-700">
              A secure password reset authorization token has been generated. You can proceed directly to create your new password below.
            </p>
          </div>

          {/* Direct Reset Action Buttons */}
          {resetUrl && (
            <div className="space-y-2 pt-1">
              <Link
                href={resetUrl}
                className="w-full py-3 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white text-xs font-bold transition-all shadow-md shadow-[#FF6200]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Dedicated Reset Page</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Reset Link Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Reset Link</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* In-Line Direct Password Reset Form */}
          {resetToken && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-[#FF6200]" />
                <span>Or Set New Password Right Now:</span>
              </div>

              {resetError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                  <span>{resetError}</span>
                </div>
              )}

              <form onSubmit={handleInlineReset} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">New Password</label>
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
                  <label className="block text-slate-700 font-semibold mb-1">Confirm New Password</label>
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
                  disabled={resetLoading}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {resetLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Save New Password &amp; Finish</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          <div className="pt-2 flex justify-between items-center text-xs border-t border-slate-100">
            <button
              onClick={() => {
                setSuccess(false);
                setResetToken(null);
                setResetUrl(null);
                setNewPassword("");
                setConfirmPassword("");
                setResetError(null);
              }}
              className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Try another email
            </button>
            <Link href={loginInfo.href} className={`font-bold hover:underline ${loginInfo.color}`}>
              {loginInfo.text}
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRequestToken} className="space-y-4 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Registered Account Email</label>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white font-bold tracking-wide transition-all shadow-md shadow-[#FF6200]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? "Verifying Account..." : "Authorize Password Reset"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
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
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#F8FAFC] relative overflow-hidden text-slate-800">
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-orange-100/60 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6200] to-[#FF8C42] text-white shadow-md shadow-[#FF6200]/25 mb-2">
            <span className="font-extrabold text-xl">DX</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            DOMAIN <span className="text-[#FF6200]">EXPANSION</span>
          </h1>
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">
            Security &amp; Account Recovery
          </p>
        </div>

        <Suspense
          fallback={
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center text-xs text-slate-500 shadow-sm">
              Loading recovery portal...
            </div>
          }
        >
          <ForgotPasswordForm />
        </Suspense>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-center space-y-2 text-slate-500 shadow-sm">
          <div className="font-semibold text-slate-700">Choose Portal:</div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/login" className="text-[#FF6200] hover:underline font-medium">
              Main Member
            </Link>
            <span>&bull;</span>
            <Link href="/superadmin/login" className="text-red-600 hover:text-red-700 font-medium">
              Super Admin
            </Link>
            <span>&bull;</span>
            <Link href="/hrms/login" className="text-cyan-600 hover:text-cyan-700 font-medium">
              HRMS Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
