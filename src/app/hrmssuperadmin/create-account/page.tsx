"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Info } from "lucide-react";

export default function HRMSSuperAdminCreateAccountPage() {
  const router = useRouter();
  const [name, setName] = useState("HR Administrator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Requirement #4: Read pre-filled HRMS Super Admin email from secure configuration/database settings
  useEffect(() => {
    fetch("/api/auth/config")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.hrmsSuperAdminEmail) {
          setEmail(json.data.hrmsSuperAdminEmail);
        } else {
          setEmail("hrms.admin@domainexpansion.in");
        }
      })
      .catch(() => setEmail("hrms.admin@domainexpansion.in"))
      .finally(() => setInitialLoading(false));
  }, []);

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
          jobTitle: "HR Super Administrator",
          department: "Human Resources",
          portal: "HRMS_SUPER_ADMIN",
        }),
      });

      const json = await res.json();
      if (json.success) {
        // Redirection rule: DO NOT automatically log in.
        router.push(`/hrmssuperadmin/login?registered=true&email=${encodeURIComponent(email.trim())}`);
      } else {
        setError(json.error?.message || "Failed to setup HRMS Super Admin account.");
      }
    } catch (err) {
      setError("Network error during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0B0B0C] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-600 text-white shadow-[0_0_25px_rgba(236,72,153,0.4)] mb-2">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            HRMS <span className="text-pink-500">SUPER ADMIN</span>
          </h1>
          <p className="text-xs text-[#888898] font-mono tracking-widest uppercase">
            Initial Administrative Account Setup
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl bg-[#141414] border border-pink-500/30 shadow-[0_0_40px_rgba(236,72,153,0.15)] space-y-5">
          <div className="border-b border-[#2E2E2E] pb-3">
            <h2 className="text-sm font-bold text-white">Create HRMS Super Admin</h2>
            <p className="text-[11px] text-[#888898]">
              Setup HR control center administrator credentials.
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
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Administrator Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. HR Director"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[#ACACB8] font-semibold">HRMS Super Admin Email *</label>
                <span className="text-[10px] text-pink-400 font-mono">Configured Default</span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="hrms.admin@domainexpansion.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || initialLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:opacity-95 text-white font-bold tracking-wide transition-all shadow-[0_0_25px_rgba(236,72,153,0.3)] flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? "Creating Account..." : "Create HRMS Super Admin Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-[#2E2E2E] flex items-center justify-between text-xs">
            <span className="text-[#888898]">Already configured?</span>
            <Link href="/hrmssuperadmin/login" className="text-pink-400 font-bold hover:underline">
              HRMS Admin Sign In
            </Link>
          </div>
        </div>

        <div className="text-center text-xs text-[#888898]">
          <Link href="/hrms/login" className="hover:text-white underline">
            &larr; Return to HRMS Employee Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
