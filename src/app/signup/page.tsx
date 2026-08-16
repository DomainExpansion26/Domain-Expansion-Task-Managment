"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, User, Mail, Lock, Briefcase, Building2, Shield, ArrowRight, AlertCircle } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("TEAM_MEMBER");
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
          jobTitle: jobTitle.trim() || "Software Engineer",
          department: department.trim() || "Engineering",
          role,
        }),
      });

      const json = await res.json();
      if (json.success) {
        router.push(`/login?registered=true&email=${encodeURIComponent(email.trim())}`);
      } else {
        setError(json.error?.message || "Failed to create account");
      }
    } catch (err) {
      setError("Network error during registration");
    } finally {
      setLoading(false);
    }
  };

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
            Create Team Member Account
          </p>
        </div>

        {/* Sign Up Card */}
        <div className="p-8 rounded-3xl bg-[#141414] border border-[#2E2E2E] shadow-2xl space-y-5">
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
                  placeholder="e.g. Sanjay Patel"
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
                  placeholder="sanjay@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]/60"
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
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]/60"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1.5">Job Title</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-[#888898] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. QA Engineer"
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

            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Account Role</label>
              <div className="relative">
                <Shield className="w-4 h-4 text-[#888898] absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6200]/60 text-xs"
                >
                  <option value="TEAM_MEMBER">Team Member (Work on assigned tasks & bugs)</option>
                  <option value="PROJECT_MANAGER">Project Manager (Create tasks, manage sprints & projects)</option>
                  <option value="SUPER_ADMIN">Super Admin (Full organization control & AI settings)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] hover:opacity-95 text-white font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(255,98,0,0.3)] flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? "Creating account..." : "Create Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-[#2E2E2E] text-center text-xs text-[#888898]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#FF8C42] font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
