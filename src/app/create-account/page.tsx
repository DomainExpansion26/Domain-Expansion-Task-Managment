"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Briefcase,
  Building2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";

export default function CreateAccountPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.user) {
          router.replace("/dashboard");
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => {
        setCheckingAuth(false);
      });
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter your password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          jobTitle: jobTitle.trim() || "Software Engineer",
          department: department.trim() || "Engineering",
          portal: "MAIN",
        }),
      });

      const json = await res.json();
      if (json.success) {
        // Redirection rule: DO NOT log the user in automatically.
        // Redirect to /login with registered status and prefilled email.
        router.push(`/login?registered=true&email=${encodeURIComponent(email.trim())}`);
      } else {
        setError(json.error?.message || "Failed to create account.");
      }
    } catch (err) {
      setError("Network error during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0D0D0D] text-white text-xs">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#FF6200] border-t-transparent rounded-full animate-spin" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0D0D0D] relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-[#FF6200]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-[#6D28D9]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Portal Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6200] to-[#FF8C42] text-white shadow-[0_0_25px_rgba(255,98,0,0.4)] mb-2">
            <span className="font-extrabold text-xl">DX</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            DOMAIN <span className="text-[#FF6200]">EXPANSION</span>
          </h1>
          <p className="text-xs text-[#888898] font-mono tracking-widest uppercase">
            Main Organization Portal &bull; Create Account
          </p>
        </div>

        {/* Form Card */}
        <div className="p-8 rounded-3xl bg-[#141414] border border-[#2E2E2E] shadow-2xl space-y-5">
          <div className="border-b border-[#222] pb-3">
            <h2 className="text-sm font-bold text-white">Member Registration</h2>
            <p className="text-[11px] text-[#888898]">
              Create your organization account identity.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Work Email *</label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]/60"
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

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#888898] hover:text-white transition-colors focus:outline-none cursor-pointer"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1.5">Job Title</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-[#888898] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Developer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-9 pr-3 py-2 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1.5">Department</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#888898] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-9 pr-3 py-2 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]/60"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] hover:opacity-95 text-white font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(255,98,0,0.3)] flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? "Creating Account..." : "Create Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-[#2E2E2E] flex items-center justify-between text-xs">
            <span className="text-[#888898]">Already have an account?</span>
            <Link href="/login" className="text-[#FF8C42] font-bold hover:underline">
              Sign In to Portal
            </Link>
          </div>
        </div>

        {/* Portal Switcher Footer */}
        <div className="text-center space-y-1 text-xs text-[#888898]">
          <span>Need administrative access? </span>
          <Link href="/superadmin/login" className="text-white hover:text-[#FF8C42] underline">
            Super Admin Portal
          </Link>
          <span> &bull; </span>
          <Link href="/hrms/login" className="text-white hover:text-[#FF8C42] underline">
            HRMS Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
