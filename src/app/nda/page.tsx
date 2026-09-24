"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Building2,
  Code2,
  KeyRound,
  Database,
  Users2,
} from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials, logout as reduxLogout } from "@/store/slices/authSlice";

export default function NDAPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [template, setTemplate] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch current session and active NDA template
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/nda/template").then((r) => r.json()),
    ])
      .then(([authRes, ndaRes]) => {
        if (!authRes.success || !authRes.data?.user) {
          router.replace("/login");
          return;
        }

        const user = authRes.data.user;
        setCurrentUser(user);

        // If user is already compliant or is superadmin, redirect to dashboard
        if ((user.ndaAccepted || user.role === "SUPER_ADMIN") && user.ndaVersionAccepted === ndaRes.data?.version) {
          router.replace("/dashboard");
          return;
        }

        if (ndaRes.success && ndaRes.data) {
          setTemplate(ndaRes.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load NDA data:", err);
        setError("Failed to load confidentiality agreement. Please refresh.");
        setLoading(false);
      });
  }, [router]);

  const handleAcceptNDA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("You must select the confirmation checkbox to proceed.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/nda/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkboxConfirmed: true,
          version: template?.version || "v1.0",
        }),
      });

      const json = await res.json();
      if (json.success) {
        // Update credentials in Redux
        if (json.data?.user) {
          dispatch(
            setCredentials({
              user: json.data.user,
              token: json.data.token,
            })
          );
        }
        // Redirect to dashboard
        router.replace("/dashboard");
      } else {
        setError(json.error?.message || "Failed to submit NDA acceptance.");
      }
    } catch (err) {
      setError("Network error while submitting acceptance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    dispatch(reduxLogout());
    window.location.replace("/login");
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-[#0F172A] gap-3 text-xs">
        <div className="w-6 h-6 border-2 border-[#FF6200] border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold text-[#64748B]">Verifying legal compliance status...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between p-4 sm:p-6 lg:p-10 font-sans">
      {/* Top Header Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6200] to-[#FF8C42] text-white flex items-center justify-center font-black text-lg shadow-md shadow-[#FF6200]/20">
            DX
          </div>
          <div>
            <div className="text-sm font-black tracking-tight text-[#0F172A]">
              DOMAIN <span className="text-[#FF6200]">EXPANSION</span>
            </div>
            <div className="text-[10px] text-[#64748B] font-mono tracking-wider uppercase">
              Security & Legal Compliance Gateway
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-semibold text-[#64748B] hover:text-[#DC2626] hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Legal Card Container */}
      <main className="max-w-4xl w-full mx-auto my-6 space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-xl space-y-6">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold tracking-wide uppercase font-mono">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Mandatory Action Required</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                {template?.title || "Company Non-Disclosure & Confidentiality Agreement"}
              </h1>
              <p className="text-xs text-[#64748B]">
                Member: <strong className="text-[#0F172A]">{currentUser?.name}</strong> ({currentUser?.email}) &bull; Department: <strong className="text-[#0F172A]">{currentUser?.department || "General"}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="px-3 py-1 rounded-xl bg-orange-50 border border-orange-200 text-[#FF6200] font-mono font-bold text-xs">
                Version {template?.version || "v1.0"}
              </span>
            </div>
          </div>

          {/* Key Confidentiality Scope Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
                <Code2 className="w-3.5 h-3.5 text-[#FF6200]" />
                <span>Source Code</span>
              </div>
              <p className="text-[11px] text-[#64748B]">All repositories, APIs, architectures & deployments</p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
                <KeyRound className="w-3.5 h-3.5 text-[#6D28D9]" />
                <span>Credentials</span>
              </div>
              <p className="text-[11px] text-[#64748B]">Tokens, passwords, keys & system credentials</p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
                <Database className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Client & DB Data</span>
              </div>
              <p className="text-[11px] text-[#64748B]">Private client data, transactions & databases</p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
                <Shield className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Policies & IP</span>
              </div>
              <p className="text-[11px] text-[#64748B]">Processes, trade secrets & internal communications</p>
            </div>
          </div>

          {/* Full Agreement Text Container */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
              Terms & Conditions Document:
            </label>
            <div className="h-72 sm:h-80 overflow-y-auto p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-[#334155] leading-relaxed whitespace-pre-line shadow-inner focus:outline-none">
              {template?.content || "Loading agreement terms..."}
            </div>
            <p className="text-[11px] text-[#64748B] italic">
              Please scroll through and read the full agreement before providing your electronic consent.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Confirmation Form */}
          <form onSubmit={handleAcceptNDA} className="pt-2 border-t border-[#F1F5F9] space-y-5">
            <label className="flex items-start gap-3 p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80 hover:bg-orange-50 transition-colors cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#FF6200] focus:ring-[#FF6200] cursor-pointer"
                id="nda-agree-checkbox"
              />
              <span className="text-xs font-semibold text-[#0F172A] leading-snug">
                I have read, understood, and unconditionally agree to the above Terms & Conditions and Non-Disclosure Agreement (NDA). I acknowledge that any violation may result in immediate revocation of access and disciplinary or legal action under applicable laws.
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[11px] text-[#64748B]">
                Your acceptance date, timestamp, user account, and IP address will be recorded permanently in the organization audit vault.
              </div>

              <button
                type="submit"
                disabled={!agreed || submitting}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-md ${
                  agreed && !submitting
                    ? "bg-gradient-to-r from-[#FF6200] to-[#FF8C42] text-white hover:opacity-95 shadow-[#FF6200]/25 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Recording Acceptance...</span>
                  </>
                ) : (
                  <>
                    <span>Accept Terms & Enter Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center text-[11px] text-[#64748B] pt-4">
        Domain Expansion Enterprise Platform &bull; Think Outside The Box &bull; All Rights Reserved
      </footer>
    </div>
  );
}
