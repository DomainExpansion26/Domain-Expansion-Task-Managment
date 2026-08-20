"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function SuperAdminCreateAccountPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          jobTitle: "Super Administrator",
          department: "Executive Management",
          portal: "SUPER_ADMIN",
        }),
      });

      const json = await res.json();
      if (json.success) {
        // Redirection rule: DO NOT automatically log in.
        // Redirect to /superadmin/login
        router.push(`/superadmin/login?registered=true&email=${encodeURIComponent(email.trim())}`);
      } else {
        setError(json.error?.message || "Failed to create Super Admin account.");
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
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            SUPER ADMIN <span className="text-red-500">CREATION</span>
          </h1>
          <p className="text-xs text-[#888898] font-mono tracking-widest uppercase">
            Master Organization Control &bull; Super Admin Account
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl bg-[#141414] border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)] space-y-5">
          <div className="border-b border-[#2E2E2E] pb-3">
            <h2 className="text-sm font-bold text-white">Create Super Admin Account</h2>
            <p className="text-[11px] text-[#888898]">
              Setup master administrative credentials for full system authority.
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
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Super Admin Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Administrator"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Super Admin Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="superadmin@domainexpansion.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Min 6 characters"
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
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-red-500"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-95 text-white font-bold tracking-wide transition-all shadow-[0_0_25px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? "Creating Super Admin..." : "Create Super Admin Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-[#2E2E2E] flex items-center justify-between text-xs">
            <span className="text-[#888898]">Already have credentials?</span>
            <Link href="/superadmin/login" className="text-red-400 font-bold hover:underline">
              Super Admin Sign In
            </Link>
          </div>
        </div>

        <div className="text-center text-xs text-[#888898]">
          <Link href="/login" className="hover:text-white underline">
            &larr; Back to Normal Member Login
          </Link>
        </div>
      </div>
    </div>
  );
}
