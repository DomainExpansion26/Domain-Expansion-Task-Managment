"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Lock, User, Briefcase, ArrowRight } from "lucide-react";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetch(`/api/auth/invite?token=${token}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setInvitation(json.data);
            setName(json.data.name || "");
          } else {
            setError(json.error?.message || "Invalid or expired invitation");
          }
        })
        .catch(() => setError("Failed to validate invitation"))
        .finally(() => setLoading(false));
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/invite", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name,
          password,
          jobTitle,
          department,
        }),
      });

      const json = await res.json();
      if (json.success) {
        router.push("/");
      } else {
        setError(json.error?.message || "Failed to setup account");
      }
    } catch (err) {
      setError("Network error accepting invitation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0D0D0D] text-xs text-[#888898]">
        Validating invitation link...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0D0D0D] relative overflow-hidden">
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-[#FF6200]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6200] to-[#FF8C42] text-white shadow-[0_0_25px_rgba(255,98,0,0.4)] mb-2">
            <span className="font-extrabold text-xl">DX</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            DOMAIN <span className="text-[#FF6200]">EXPANSION</span>
          </h1>
          <p className="text-xs text-[#888898] font-mono tracking-widest uppercase">
            Account Setup & Workspace Access
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-[#141414] border border-[#2E2E2E] shadow-2xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {invitation && (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-[#ACACB8]">
                You have been invited to join as{" "}
                <span className="text-[#FF8C42] font-bold font-mono">{invitation.role}</span> by{" "}
                <span className="text-white font-semibold">{invitation.invitedBy}</span>.
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Email</label>
                <input
                  type="text"
                  disabled
                  value={invitation.email}
                  className="w-full bg-[#0D0D0D] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-[#888898] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6200]/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Create Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6200]/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#ACACB8] font-semibold mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]/60"
                  />
                </div>

                <div>
                  <label className="block text-[#ACACB8] font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]/60"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] hover:opacity-95 text-white font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(255,98,0,0.3)] flex items-center justify-center gap-2"
              >
                <span>{submitting ? "Setting up..." : "Accept Invitation & Access Workspace"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
